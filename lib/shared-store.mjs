import { validatePuzzle } from './validate.mjs';
import { createHash, randomBytes } from 'node:crypto';
import { createRoom, validateOperation, ROOM_TTL_SECONDS, SharedError, roundId, defaultView, OP_PATTERN } from './shared-model.mjs';

// Every edit is fenced to a round. Generation leases and replacement are
// atomic, so an old client/request can never write into a new puzzle.
export const PATCH_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return false end
if redis.call('EXISTS', KEYS[2]) == 1 then return raw end
local room = cjson.decode(raw)
local op = cjson.decode(ARGV[1])
local current = room.roundId or room.puzzle.id
if op.roundId ~= current then return 'CONFLICT' end
local clock = redis.call('TIME')
local now = tonumber(clock[1]) * 1000 + math.floor(tonumber(clock[2])/1000)
local kind = op.kind or 'edit'
if kind == 'begin' then
  if room.generating and room.generating.untilAt > now then return 'CONFLICT' end
  room.generating = { id = op.id, untilAt = now + 45000 }
  room.view = room.view or cjson.decode(ARGV[3])
  room.view.modal = cjson.null
elseif kind == 'replace' then
  if not room.generating or room.generating.id ~= op.leaseId or room.generating.untilAt <= now then return 'CONFLICT' end
  local fresh = cjson.decode(ARGV[2])
  fresh.roundId = op.id
  fresh.revision = room.revision
  fresh.expiresAt = room.expiresAt
  fresh.usedAnswers = room.usedAnswers or {}
  if #fresh.usedAnswers == 0 then for _, entry in ipairs(room.puzzle.entries) do table.insert(fresh.usedAnswers, entry.answer) end end
  for _, entry in ipairs(fresh.puzzle.entries) do table.insert(fresh.usedAnswers, entry.answer) end
  room = fresh
elseif kind == 'cancel' then
  if room.generating and room.generating.id == op.leaseId then room.generating = nil end
else
  room.view = room.view or cjson.decode(ARGV[3])
  for _, change in ipairs(op.changes) do
    local cell = tostring(change.cell)
    if change.expected == nil or room.writers[cell] == change.expected then
      room.answers[cell] = change.value
      room.writers[cell] = op.id
    end
  end
  if op.view then for key, value in pairs(op.view) do room.view[key] = value end end
  room.assisted = room.assisted or op.assisted
end
room.stats = room.stats or {startedAt=room.expiresAt-604800000,completedAt=cjson.null,hints=0,checks=0}
if kind == 'replace' then room.stats = {startedAt=now,completedAt=cjson.null,hints=0,checks=0} end
if kind == 'edit' and op.metrics then
  room.stats.hints = (room.stats.hints or 0) + (op.metrics.hints or 0)
  room.stats.checks = (room.stats.checks or 0) + (op.metrics.checks or 0)
end
-- Some Redis-compatible cjson implementations drop null array elements.
-- Rebuild exact grid positions from the validated, authoritative entries and
-- use false for blocked squares in Redis only. API responses restore nulls.
local grid={}
for i=1,room.puzzle.cols*room.puzzle.rows do grid[i]=false end
for _,entry in ipairs(room.puzzle.entries) do
  for position,cell in ipairs(entry.cells) do grid[cell+1]={letter=string.sub(entry.answer,position,position),number=false} end
end
for _,entry in ipairs(room.puzzle.entries) do grid[entry.cells[1]+1].number=entry.number end
room.puzzle.grid=grid
local solved = true
for index, cell in ipairs(room.puzzle.grid) do
  if cell and cell ~= cjson.null and room.answers[tostring(index-1)] ~= cell.letter then solved = false; break end
end
if solved then
  if not room.stats.completedAt or room.stats.completedAt == cjson.null then room.stats.completedAt = now end
else room.stats.completedAt = cjson.null end
room.roundId = room.roundId or current
room.revision = room.revision + 1
local ttl = redis.call('PTTL', KEYS[1])
if ttl <= 0 then return false end
local updated = cjson.encode(room)
redis.call('SET', KEYS[1], updated, 'PX', ttl)
redis.call('SET', KEYS[2], '1', 'PX', ttl)
return updated
`;
function normaliseRoom(room) {
  // Entries preserve coordinates even in legacy rooms whose grid nulls were
  // dropped by Upstash Lua. Validate the reconstructed puzzle before use.
  const puzzle=room.puzzle,grid=Array(puzzle.cols*puzzle.rows).fill(null);
  for(const entry of puzzle.entries)for(let position=0;position<entry.cells.length;position++)grid[entry.cells[position]]={letter:entry.answer[position],number:null};
  for(const entry of puzzle.entries)grid[entry.cells[0]].number=entry.number;
  room.puzzle={...puzzle,grid};
  if(validatePuzzle(room.puzzle).length)throw new SharedError('This stored shared puzzle is damaged.',503);
  room.roundId = roundId(room);
  room.stats ||= {startedAt:room.expiresAt-ROOM_TTL_SECONDS*1000,completedAt:null,hints:0,checks:0};
  room.stats.completedAt ??= null;
  // Upstash and Redis cjson differ on the encoding of empty Lua tables.
  if (Array.isArray(room.answers)) room.answers = {};
  if (Array.isArray(room.writers)) room.writers = {};
  room.view = {...defaultView(room.puzzle),...room.view};
  if (!Array.isArray(room.view.errors)) room.view.errors = [];
  return room;
}
const RATE_SCRIPT = `local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], 3600) end; return n`;
export const roomKey = token => `crossword:shared:v1:${createHash('sha256').update(token).digest('hex')}`;
export function redisCredentials(env = process.env) {
  // Keep credential pairs together: a partial override must never combine
  // the URL of one database with the token of another.
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) return { url:env.UPSTASH_REDIS_REST_URL, token:env.UPSTASH_REDIS_REST_TOKEN };
  if (env.KV_REST_API_URL && env.KV_REST_API_TOKEN) return { url:env.KV_REST_API_URL, token:env.KV_REST_API_TOKEN };
  return {};
}
export async function redisCommand(command) {
  const { url, token } = redisCredentials();
  if (!url || !token) throw new SharedError('Shared games are temporarily unavailable.', 503);
  try {
    const response = await fetch(url, { method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, body:JSON.stringify(command), cache:'no-store', signal:AbortSignal.timeout(8000) });
    const body = await response.json();
    if (!response.ok || body.error) throw new Error('Storage unavailable');
    return body.result;
  } catch { throw new SharedError('Could not connect to the shared game. Your changes will retry.', 503); }
}
export function sharedStore(command = redisCommand) {
  async function get(token) {
    const raw = await command(['GET', roomKey(token)]);
    if (!raw) throw new SharedError('This shared game has expired or the link is incorrect.', 404);
    return normaliseRoom(typeof raw === 'string' ? JSON.parse(raw) : raw);
  }
  return {
    get,
    async create(game, clientAddress = 'unknown') {
      const room = createRoom(game);
      const address = createHash('sha256').update(clientAddress).digest('hex');
      const count = await command(['EVAL', RATE_SCRIPT, 1, `crossword:shared:create:${address}`]);
      if (count > 30) throw new SharedError('Too many shared games created. Please try again in an hour.', 429);
      const token = randomBytes(32).toString('hex');
      const saved = await command(['SET', roomKey(token), JSON.stringify(room), 'EX', ROOM_TTL_SECONDS, 'NX']);
      if (saved !== 'OK') throw new SharedError('Could not create a shared game. Please try again.', 503);
      return { token, room };
    },
    async patch(token, operation) {
      const room = await get(token);
      if (!operation || !OP_PATTERN.test(operation.id || '')) throw new SharedError('Invalid shared action.');
      if (typeof operation.roundId !== 'string' || operation.roundId !== roundId(room)) {
        if (await command(['EXISTS', `${roomKey(token)}:op:${operation.id}`])) return room;
        throw new SharedError('The shared puzzle changed. Reloading the current game.', 409);
      }
      const kind = operation.kind || 'edit';
      if (!['edit','begin','replace','cancel'].includes(kind)) throw new SharedError('Invalid shared action.');
      validateOperation(room.puzzle, operation);
      let fresh = {};
      if (kind === 'replace') {
        if (!OP_PATTERN.test(operation.leaseId || '')) throw new SharedError('Invalid generation request.');
        const puzzle = operation.puzzle;
        const play = puzzle?.entries?.[0] ? {answers:{},assisted:false,entryId:puzzle.entries[0].id,selected:puzzle.entries[0].cells[0]} : null;
        fresh = createRoom({puzzle,play});
        const used = new Set(room.usedAnswers || room.puzzle.entries.map(e=>e.answer));
        if (puzzle.entries.some(e=>used.has(e.answer))) throw new SharedError('This puzzle repeats an answer from the shared session. Try another difficulty.');
      }
      if (kind === 'cancel' && !OP_PATTERN.test(operation.leaseId || '')) throw new SharedError('Invalid generation request.');
      const raw = await command(['EVAL', PATCH_SCRIPT, 2, roomKey(token), `${roomKey(token)}:op:${operation.id}`, JSON.stringify(operation), JSON.stringify(fresh), JSON.stringify(defaultView(room.puzzle))]);
      if (!raw) throw new SharedError('This shared game has expired.', 404);
      if (raw === 'CONFLICT') throw new SharedError('Another player changed the shared puzzle. Loading their game.', 409);
      return normaliseRoom(typeof raw === 'string' ? JSON.parse(raw) : raw);
    }
  };
}
