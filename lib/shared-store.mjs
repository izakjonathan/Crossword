import { createHash, randomBytes } from 'node:crypto';
import { createRoom, validateOperation, ROOM_TTL_SECONDS, SharedError } from './shared-model.mjs';

// The immutable puzzle and all changed cells are committed in one Redis script.
// Per-operation keys make retries idempotent for the full lifetime of the room.
export const PATCH_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return false end
if redis.call('EXISTS', KEYS[2]) == 1 then return raw end
local room = cjson.decode(raw)
local op = cjson.decode(ARGV[1])
for _, change in ipairs(op.changes) do
  local cell = tostring(change.cell)
  if change.expected == nil or room.writers[cell] == change.expected then
    room.answers[cell] = change.value
    room.writers[cell] = op.id
  end
end
room.assisted = room.assisted or op.assisted
room.revision = room.revision + 1
local ttl = redis.call('PTTL', KEYS[1])
if ttl <= 0 then return false end
local updated = cjson.encode(room)
redis.call('SET', KEYS[1], updated, 'PX', ttl)
redis.call('SET', KEYS[2], '1', 'PX', ttl)
return updated
`;
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
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
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
      validateOperation(room.puzzle, operation);
      const raw = await command(['EVAL', PATCH_SCRIPT, 2, roomKey(token), `${roomKey(token)}:op:${operation.id}`, JSON.stringify(operation)]);
      if (!raw) throw new SharedError('This shared game has expired.', 404);
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    }
  };
}
