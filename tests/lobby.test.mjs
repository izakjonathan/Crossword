import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { ACTIVE_SHARED_KEY, playerId, saveSharedSession, loadSharedSession, clearSharedSession } from '../lib/lobby-session.mjs';
import { lobbyStore, lobbyKey, LOBBY_INDEX } from '../lib/lobby-store.mjs';
import { sharedStore, roomKey } from '../lib/shared-store.mjs';
import { generatePuzzle } from '../lib/engine.mjs';
import { initialState } from '../lib/input.mjs';
import { GET, POST } from '../app/api/lobbies/route.js';

const memory=()=>{const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};};
test('device identity and active lobby survive reopening; explicit leave clears only the shared session',()=>{
  const storage=memory(),id=playerId(storage);assert.equal(playerId(storage),id);
  storage.setItem('solo','saved');const session={token:'a'.repeat(64),lobby:{id:'b'.repeat(16),name:'Friends'}};
  saveSharedSession(storage,session);assert.deepEqual(loadSharedSession(storage),session);
  clearSharedSession(storage);assert.equal(loadSharedSession(storage),null);assert.equal(storage.getItem('solo'),'saved');assert.equal(playerId(storage),id);
  storage.setItem(ACTIVE_SHARED_KEY,'{broken');assert.equal(loadSharedSession(storage),null);
  storage.setItem(ACTIVE_SHARED_KEY,JSON.stringify({token:'invalid'}));assert.equal(loadSharedSession(storage),null);
  storage.setItem(ACTIVE_SHARED_KEY,JSON.stringify({token:'a'.repeat(64),lobby:{id:'invalid'}}));assert.equal(loadSharedSession(storage),null);
});
test('lobby API rejects foreign origins, malformed JSON, oversized requests and unknown actions',async()=>{
  const request=(body,headers={})=>new Request('https://example.com/api/lobbies',{method:'POST',headers:{'content-type':'application/json',...headers},body});
  for(const [body,headers,status] of [['{}',{origin:'https://other.example'},403],['{}',{'content-type':'text/plain'},415],['{broken',{},400],['x'.repeat(100001),{},413],['null',{},400],['{}',{},400],[JSON.stringify({action:'join',lobbyId:'bad',playerId:randomUUID()}),{},400]])assert.equal((await POST(request(body,headers))).status,status);
});
test('lobby API lists publicly and accepts the forwarded same-site origin without exposing Redis credentials',async()=>{
  const keys=['UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','KV_REST_API_URL','KV_REST_API_TOKEN'],old=keys.map(k=>process.env[k]),originalFetch=globalThis.fetch;
  keys.forEach(k=>delete process.env[k]);process.env.KV_REST_API_URL='https://test.invalid';process.env.KV_REST_API_TOKEN='test-secret';
  globalThis.fetch=async(url,options)=>{assert.equal(options.headers.Authorization,'Bearer test-secret');const command=JSON.parse(options.body);return Response.json({result:command[0]==='ZREVRANGEBYSCORE'?[]:1});};
  try{
    const list=await GET();assert.deepEqual(await list.json(),{lobbies:[]});assert.match(list.headers.get('cache-control'),/no-store/);
    const left=await POST(new Request('http://internal/api/lobbies',{method:'POST',headers:{host:'example.com',origin:'https://example.com','x-forwarded-proto':'https','content-type':'application/json'},body:JSON.stringify({action:'leave',lobbyId:'a'.repeat(16),playerId:randomUUID()})}));
    assert.equal(left.status,200);assert.deepEqual(await left.json(),{left:true});
  }finally{globalThis.fetch=originalFetch;keys.forEach((k,i)=>{if(old[i]===undefined)delete process.env[k];else process.env[k]=old[i];});}
});
test('invalid lobby names and player identities fail before accessing storage',async()=>{
  const store=lobbyStore(async()=>{throw new Error('Unexpected storage access');});
  for(const name of ['', ' '.repeat(3), 'x'.repeat(49), 42])await assert.rejects(store.host({},name,randomUUID()),e=>e.status===400);
  await assert.rejects(store.host({},'Friends','invalid'),e=>e.status===400);
  await assert.rejects(store.join('invalid',randomUUID()),e=>e.status===400);
});
test('real Redis discovers lobbies, keeps devices joined across rounds and closes only after the last explicit leave',{skip:!process.env.REDIS_TEST_CLI},async()=>{
  const command=async args=>JSON.parse(execFileSync(process.env.REDIS_TEST_CLI,['-p',process.env.REDIS_TEST_PORT||'6397','--json',...args.map(String)],{encoding:'utf8'}));
  const store=lobbyStore(command),rooms=sharedStore(command),host=randomUUID(),guest=randomUUID();
  const puzzle=generatePuzzle({mode:'easy',seed:'lobby-test'}),game={puzzle,play:initialState(puzzle)};
  const created=await store.host(game,'  Friends  ',host,randomUUID()),id=created.lobby.id,token=created.token;
  const key=lobbyKey(id),memberKey=`${key}:members`,privateRoom=await rooms.create(game,randomUUID());
  try{
    let list=(await store.list()).lobbies;assert.equal(list.length,1);assert.equal(list[0].name,'Friends');assert.equal(list[0].players,1);assert.equal(JSON.stringify(list).includes(token),false);assert.equal(JSON.stringify(list).includes(host),false);
    assert.equal((await store.join(id,host)).lobby.players,1);
    const joined=await store.join(id,guest);assert.equal(joined.token,token);assert.equal(joined.lobby.players,2);assert.equal((await store.join(id,guest)).lobby.players,2);
    const cell=puzzle.entries[0].cells[0];await rooms.patch(token,{id:randomUUID(),roundId:puzzle.id,assisted:false,changes:[{cell:String(cell),value:'A'}]});assert.equal((await store.join(id,guest)).room.answers[cell],'A');
    await rooms.patch(token,{id:randomUUID(),roundId:puzzle.id,assisted:false,changes:[{cell:String(cell),value:''}]});assert.equal((await store.join(id,guest)).room.answers[cell],'');
    const lease=randomUUID();await rooms.patch(token,{id:lease,kind:'begin',roundId:puzzle.id,assisted:false,changes:[]});
    const next=generatePuzzle({mode:'medium',seed:'lobby-next',recent:puzzle.entries.map(e=>e.answer)}),replacement=randomUUID();
    await rooms.patch(token,{id:replacement,kind:'replace',roundId:puzzle.id,leaseId:lease,puzzle:next,assisted:false,changes:[]});
    const resumed=await store.join(id,guest);assert.equal(resumed.token,token);assert.equal(resumed.lobby.id,id);assert.equal(resumed.room.puzzle.id,next.id);assert.equal(resumed.room.roundId,replacement);
    assert.equal((await store.list()).lobbies[0].players,2);
    const ttl=await command(['PTTL',roomKey(token)]);assert.ok(Math.abs(ttl-await command(['PTTL',key]))<200);assert.ok(Math.abs(ttl-await command(['PTTL',memberKey]))<200);
    await store.leave(id,guest);await store.leave(id,guest);assert.equal((await store.list()).lobbies[0].players,1);assert.equal((await rooms.get(token)).puzzle.id,next.id);
    await store.leave(id,host);assert.deepEqual((await store.list()).lobbies,[]);await assert.rejects(store.join(id,guest),e=>e.status===404);assert.equal((await rooms.get(token)).puzzle.id,next.id);
    const expired=await store.host(game,'Expired',host,randomUUID());await command(['DEL',lobbyKey(expired.lobby.id),roomKey(expired.token),`${lobbyKey(expired.lobby.id)}:members`]);assert.deepEqual((await store.list()).lobbies,[]);assert.equal(await command(['ZSCORE',LOBBY_INDEX,expired.lobby.id]),null);
  }finally{await command(['DEL',key,memberKey,roomKey(token),roomKey(privateRoom.token)]);await command(['ZREM',LOBBY_INDEX,id]);}
});
