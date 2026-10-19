import { createHash, randomBytes } from 'node:crypto';
import { sharedStore, redisCommand, roomKey } from './shared-store.mjs';
import { SharedError } from './shared-model.mjs';
import { LOBBY_ID, PLAYER_ID } from './lobby-session.mjs';
export const LOBBY_INDEX='crossword:lobbies:v1';
export const lobbyKey=id=>`crossword:lobby:v1:${id}`;
const memberKey=id=>`${lobbyKey(id)}:members`;
const hash=id=>createHash('sha256').update(id).digest('hex');
export const REGISTER_LOBBY_SCRIPT=`
local ttl=redis.call('PTTL',KEYS[1])
if ttl<=0 then return false end
redis.call('SET',KEYS[2],ARGV[1],'PX',ttl)
redis.call('SADD',KEYS[3],ARGV[2])
redis.call('PEXPIRE',KEYS[3],ttl)
redis.call('ZADD',KEYS[4],ARGV[3],ARGV[4])
return 1
`;
export const JOIN_LOBBY_SCRIPT=`
local ttl=redis.call('PTTL',KEYS[1])
if ttl<=0 or redis.call('EXISTS',KEYS[2])==0 then return false end
redis.call('SADD',KEYS[3],ARGV[1])
redis.call('PEXPIRE',KEYS[3],ttl)
return redis.call('SCARD',KEYS[3])
`;
export const LEAVE_LOBBY_SCRIPT=`
redis.call('SREM',KEYS[2],ARGV[1])
redis.call('HDEL',KEYS[4],ARGV[1])
if redis.call('SCARD',KEYS[2])==0 then
  redis.call('DEL',KEYS[1],KEYS[2],KEYS[4])
  redis.call('ZREM',KEYS[3],ARGV[2])
end
return 1
`;
export const PRESENCE_SCRIPT=`
local ttl=redis.call('PTTL',KEYS[1])
if ttl<=0 or redis.call('SISMEMBER',KEYS[2],ARGV[1])==0 then return false end
local now=tonumber(redis.call('TIME')[1])*1000
local name=ARGV[2]
if name=='' then name='Player' end
redis.call('HSET',KEYS[3],ARGV[1],cjson.encode({name=name,lastSeen=now}))
redis.call('PEXPIRE',KEYS[3],ttl)
local participants={}
for _,id in ipairs(redis.call('SMEMBERS',KEYS[2])) do
  local raw=redis.call('HGET',KEYS[3],id)
  local profile={name='Player',lastSeen=0}
  if raw then profile=cjson.decode(raw) end
  table.insert(participants,{name=profile.name,online=now-profile.lastSeen<35000,self=id==ARGV[1]})
end
return cjson.encode(participants)
`;
function identity(player) { if(!PLAYER_ID.test(player||''))throw new SharedError('This device needs a player identity. Reload and try again.');return hash(player); }
function idCheck(id) { if(!LOBBY_ID.test(id||''))throw new SharedError('Invalid shared game.'); }
function publicLobby(lobby,players) { return {id:lobby.id,name:lobby.name,createdAt:lobby.createdAt,expiresAt:lobby.expiresAt,players}; }
export function lobbyStore(command=redisCommand) {
  const rooms=sharedStore(command);
  async function read(id) {
    idCheck(id);const raw=await command(['GET',lobbyKey(id)]);
    if(!raw)throw new SharedError('This shared game has expired or is no longer available.',404);
    return typeof raw==='string'?JSON.parse(raw):raw;
  }
  return {
    async host(game,name,player,address='unknown') {
      const member=identity(player);
      if(typeof name!=='string'||name.trim().length<1||name.trim().length>48)throw new SharedError('Give the lobby a name of 1–48 characters.');
      const {token,room}=await rooms.create(game,address),id=randomBytes(8).toString('hex');
      const lobby={id,name:name.trim(),token,createdAt:Date.now(),expiresAt:room.expiresAt};
      const registered=await command(['EVAL',REGISTER_LOBBY_SCRIPT,4,roomKey(token),lobbyKey(id),memberKey(id),LOBBY_INDEX,JSON.stringify(lobby),member,lobby.expiresAt,id]);
      if(!registered)throw new SharedError('Could not host this game. Please try again.',503);
      return {token,room,lobby:publicLobby(lobby,1)};
    },
    async list() {
      const now=Date.now();await command(['ZREMRANGEBYSCORE',LOBBY_INDEX,'-inf',now]);
      const ids=await command(['ZREVRANGEBYSCORE',LOBBY_INDEX,'+inf',now,'LIMIT',0,50]);
      if(!ids?.length)return {lobbies:[]};
      const records=await command(['MGET',...ids.map(lobbyKey)]);
      const lobbies=(await Promise.all(records.map(async (raw,i)=>{
        if(!raw){await command(['ZREM',LOBBY_INDEX,ids[i]]);return null;}
        const lobby=typeof raw==='string'?JSON.parse(raw):raw;
        return publicLobby(lobby,await command(['SCARD',memberKey(lobby.id)]));
      }))).filter(Boolean);
      return {lobbies};
    },
    async join(id,player) {
      const member=identity(player),lobby=await read(id);
      const count=await command(['EVAL',JOIN_LOBBY_SCRIPT,3,roomKey(lobby.token),lobbyKey(id),memberKey(id),member]);
      if(!count)throw new SharedError('This shared game has expired.',404);
      return {token:lobby.token,room:await rooms.get(lobby.token),lobby:publicLobby(lobby,count)};
    },
    async heartbeat(id,player,name='') {
      idCheck(id);const member=identity(player);
      if(typeof name!=='string'||name.length>24||/[\u0000-\u001f]/.test(name))throw new SharedError('Use a player name of up to 24 characters.');
      const result=await command(['EVAL',PRESENCE_SCRIPT,3,lobbyKey(id),memberKey(id),`${lobbyKey(id)}:profiles`,member,name.trim()]);
      if(!result)throw new SharedError('Rejoin this lobby to update your player status.',404);
      const participants=typeof result==='string'?JSON.parse(result):result;
      return {participants:Array.isArray(participants)?participants:[]};
    },
    async leave(id,player) {
      idCheck(id);const member=identity(player);
      // Idempotent even if the room already expired. Other players stay joined.
      await command(['EVAL',LEAVE_LOBBY_SCRIPT,4,lobbyKey(id),memberKey(id),LOBBY_INDEX,`${lobbyKey(id)}:profiles`,member,id]);return {left:true};
    }
  };
}
