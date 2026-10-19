import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { generatePuzzle } from '../lib/engine.mjs';
import { initialState } from '../lib/input.mjs';
import { createRoom, validateOperation, applyOperation, playWithRoom, TOKEN_PATTERN } from '../lib/shared-model.mjs';
import { SharedClient } from '../lib/shared-client.mjs';
import { sharedStore, roomKey, redisCredentials } from '../lib/shared-store.mjs';
import { GET, POST, PATCH } from '../app/api/shared/route.js';
const puzzle = generatePuzzle({mode:'easy',seed:'shared-test'}), game = {puzzle,play:initialState(puzzle)};
const cells = puzzle.grid.flatMap((cell,i)=>cell?[String(i)]:[]);
const op = (cell,value,extra={})=>({id:randomUUID(),changes:[{cell,value,...extra}],assisted:false});
const storage = ()=>{const data=new Map();return {getItem:key=>data.get(key)||null,setItem:(k,v)=>data.set(k,v)};};
const settle = async()=>{for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve));};
function transport(){
  let room=createRoom(game),offline=false,loseResponse=false; const seen=new Set();
  return {get room(){return structuredClone(room);},set offline(v){offline=v;},set loseResponse(v){loseResponse=v;},
    request:async(token,method,operation)=>{
      if(offline)throw new Error('Offline');
      if(method==='PATCH'&&!seen.has(operation.id)){
        if(operation.roundId!==room.roundId){const e=new Error('Round changed');e.status=409;throw e;}
        if(operation.kind==='begin'){
          if(room.generating?.untilAt>Date.now()){const e=new Error('Already generating');e.status=409;throw e;}
          room={...room,generating:{id:operation.id,untilAt:Date.now()+45000},view:{...room.view,modal:null},revision:room.revision+1};
        }else if(operation.kind==='replace'){
          if(room.generating?.id!==operation.leaseId){const e=new Error('Lease changed');e.status=409;throw e;}
          room={...createRoom({puzzle:operation.puzzle,play:initialState(operation.puzzle)}),roundId:operation.id,usedAnswers:[...room.usedAnswers,...operation.puzzle.entries.map(e=>e.answer)],expiresAt:room.expiresAt,revision:room.revision+1};
        }else if(operation.kind==='cancel'){
          if(room.generating?.id===operation.leaseId)room={...room,generating:undefined,revision:room.revision+1};
        }else{validateOperation(room.puzzle,operation);room={...applyOperation(room,operation),revision:room.revision+1};}
        seen.add(operation.id);
      }
      if(loseResponse){loseResponse=false;throw new Error('Response lost');}return structuredClone(room);
    }};
}
function client(server,session=storage()){
  let snapshot;const value=new SharedClient({token:'a'.repeat(64),room:server.room,request:server.request,storage:session,onChange:s=>{snapshot=s;},schedule:()=>0,cancel:()=>{}});
  return {client:value,get state(){return snapshot;},session};
}
function edit(client,cell,value){const before=client.view();client.edit(before,{...before,answers:{...before.answers,[cell]:value}});}

test('rooms validate supplied progress and retain puzzle, assistance and seven-day expiry',()=>{
  const room=createRoom({...game,play:{...game.play,answers:{[cells[0]]:'A'},assisted:true}},1000);
  assert.equal(room.answers[cells[0]],'A');assert.equal(room.assisted,true);assert.equal(room.expiresAt,1000+7*86400000);
  assert.throws(()=>createRoom({...game,play:{...game.play,answers:{99999:'A'}}}));assert.throws(()=>createRoom({...game,puzzle:{}}));
  assert.throws(()=>validateOperation(puzzle,op(cells[0],'AA')));assert.throws(()=>validateOperation(puzzle,{...op(cells[0],'A'),id:'bad'}));assert.throws(()=>validateOperation(puzzle,op('__proto__','A')));
  assert.throws(()=>validateOperation(puzzle,{...op(cells[0],'A'),changes:[{cell:cells[0],value:'A'},{cell:cells[0],value:'B'}]}));
});
test('two clients retain concurrent different-square edits and sync deletions both ways',async()=>{
  const server=transport(),a=client(server),b=client(server);edit(a.client,cells[0],'A');edit(b.client,cells[1],'B');await settle();await Promise.all([a.client.poll(),b.client.poll()]);
  assert.equal(a.state.room.answers[cells[0]],'A');assert.equal(a.state.room.answers[cells[1]],'B');assert.deepEqual(a.state.room.answers,b.state.room.answers);
  edit(b.client,cells[0],'');await settle();await a.client.poll();assert.equal(a.state.room.answers[cells[0]],'');assert.equal(a.state.room.answers[cells[1]],'B');
  edit(a.client,cells[1],'');await settle();await b.client.poll();assert.equal(b.state.room.answers[cells[1]],'');
});
test('same-square edits converge and undo cannot erase another writer, even with equal letters',async()=>{
  const server=transport(),a=client(server),b=client(server);edit(a.client,cells[0],'A');await settle();edit(b.client,cells[0],'A');await settle();await a.client.poll();a.client.undo();await settle();assert.equal(server.room.answers[cells[0]],'A');
  edit(b.client,cells[0],'B');await settle();await a.client.poll();assert.equal(a.state.room.answers[cells[0]],'B');
});
test('consecutive own edits on a square can both be undone',async()=>{
  const server=transport(),a=client(server);edit(a.client,cells[0],'A');edit(a.client,cells[0],'B');await settle();a.client.undo();await settle();assert.equal(server.room.answers[cells[0]],'A');a.client.undo();await settle();assert.equal(server.room.answers[cells[0]],'');
});
test('offline edits survive refresh and lost-response retries cannot replay over newer edits',async()=>{
  const server=transport(),a=client(server);server.offline=true;edit(a.client,cells[0],'A');await settle();assert.equal(a.state.status,'reconnecting');assert.equal(a.client.view().answers[cells[0]],'A');a.client.stop();server.offline=false;
  const restored=client(server,a.session);restored.client.start();await settle();assert.equal(server.room.answers[cells[0]],'A');assert.equal(restored.state.pending,0);
  server.loseResponse=true;edit(restored.client,cells[0],'B');await settle();const b=client(server);edit(b.client,cells[0],'C');await settle();await restored.client.poll();await settle();assert.equal(server.room.answers[cells[0]],'C');assert.equal(restored.state.room.answers[cells[0]],'C');
});
test('late poll responses cannot replace newer revisions; selection follows the shared active square',()=>{
  const server=transport(),a=client(server),room=server.room;a.client.accept({...room,revision:5,answers:{[cells[0]]:'Z'}});a.client.accept(room);assert.equal(a.client.view().answers[cells[0]],'Z');
  const play={...game.play,selected:Number(cells[2]),entryId:123},merged=playWithRoom(play,a.client.view());assert.equal(merged.selected,room.view.selected);assert.equal(merged.entryId,room.view.entryId);
});
test('hints remain assisted after undo and expired rooms stop retrying',async()=>{
  const server=transport(),a=client(server),before=a.client.view();a.client.edit(before,{...before,answers:{[cells[0]]:'A'},assisted:true});await settle();a.client.undo();await settle();assert.equal(server.room.assisted,true);
  a.client.request=async()=>{const e=new Error('Expired');e.status=404;throw e;};await a.client.poll();assert.equal(a.state.status,'ended');assert.throws(()=>edit(a.client,cells[0],'B'));
});
test('API rejects missing tokens, cross-origin writes and oversized bodies; storage never falls back silently',async()=>{
  assert.equal((await GET(new Request('https://example.com/api/shared'))).status,401);
  const request=(method,body,headers={})=>new Request('https://example.com/api/shared',{method,headers:{'content-type':'application/json',...headers},body});
  assert.equal((await POST(request('POST',JSON.stringify({game}),{origin:'https://other.com'}))).status,403);
  assert.equal((await POST(request('POST','x'.repeat(100001)))).status,413);
  assert.equal((await PATCH(request('PATCH','{}',{authorization:'Bearer nope'}))).status,401);
  const oldUrl=process.env.UPSTASH_REDIS_REST_URL,oldToken=process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.UPSTASH_REDIS_REST_URL;delete process.env.UPSTASH_REDIS_REST_TOKEN;
  try{
    const forwarded = await POST(new Request('http://internal/api/shared',{method:'POST',headers:{host:'example.com',origin:'https://example.com','x-forwarded-proto':'https','content-type':'application/json'},body:JSON.stringify({game})}));
    assert.equal(forwarded.status,503);
    const result=await POST(request('POST',JSON.stringify({game})));assert.equal(result.status,503);assert.equal(result.headers.get('cache-control'),'private, no-store, max-age=0');}
  finally{if(oldUrl)process.env.UPSTASH_REDIS_REST_URL=oldUrl;if(oldToken)process.env.UPSTASH_REDIS_REST_TOKEN=oldToken;}
});
test('store creates random rooms, hashes capability keys and limits creation',async()=>{
  const commands=[],store=sharedStore(async cmd=>{commands.push(cmd);return cmd[0]==='EVAL'?1:'OK';});const result=await store.create(game,'test-ip');assert.match(result.token,TOKEN_PATTERN);assert.ok(!roomKey(result.token).includes(result.token));assert.equal(commands[1][3],'EX');assert.equal(commands[1][4],604800);await assert.rejects(sharedStore(async()=>31).create(game,'test-ip'),e=>e.status===429);
});

test('joining reserves shared answers without erasing old history or incrementing game count on reload', async()=>{
  const {reserveSharedAnswers,LEDGER_KEY,dayKey}=await import('../lib/repetition.mjs');
  const local=storage(),now=Date.parse('2026-10-19T12:00:00Z');
  local.setItem(LEDGER_KEY,JSON.stringify({version:1,sequence:12,uses:{ZZZ:{at:now-86400000,day:dayKey(now-86400000),game:1}}}));
  reserveSharedAnswers(local,puzzle,now);reserveSharedAnswers(local,puzzle,now);
  const ledger=JSON.parse(local.getItem(LEDGER_KEY));assert.equal(ledger.sequence,12);assert.ok(ledger.uses.ZZZ);
  for(const entry of puzzle.entries){assert.equal(ledger.uses[entry.answer].day,dayKey(now));assert.equal(ledger.uses[entry.answer].game,12);}
  local.setItem(LEDGER_KEY,'broken');assert.throws(()=>reserveSharedAnswers(local,puzzle,now));assert.equal(local.getItem(LEDGER_KEY),'broken');
});


test('Redis accepts complete Marketplace KV pairs, prefers complete Upstash pairs, and never mixes credentials',()=>{
  assert.deepEqual(redisCredentials({KV_REST_API_URL:'https://marketplace',KV_REST_API_TOKEN:'write-token',KV_REST_API_READ_ONLY_TOKEN:'read-token'}),{url:'https://marketplace',token:'write-token'});
  assert.deepEqual(redisCredentials({UPSTASH_REDIS_REST_URL:'https://direct',UPSTASH_REDIS_REST_TOKEN:'direct-token',KV_REST_API_URL:'https://marketplace',KV_REST_API_TOKEN:'write-token'}),{url:'https://direct',token:'direct-token'});
  assert.deepEqual(redisCredentials({UPSTASH_REDIS_REST_URL:'https://partial',KV_REST_API_URL:'https://marketplace',KV_REST_API_TOKEN:'write-token'}),{url:'https://marketplace',token:'write-token'});
  assert.deepEqual(redisCredentials({UPSTASH_REDIS_REST_URL:'https://partial',KV_REST_API_TOKEN:'other-token'}),{});
  assert.deepEqual(redisCredentials({KV_REST_API_URL:'https://marketplace',KV_REST_API_READ_ONLY_TOKEN:'read-token'}),{});
});


test('shared selection, checks, clue dialog/direction and board position propagate to the other device',async()=>{
  const server=transport(),a=client(server),b=client(server),entry=puzzle.entries[1];
  a.client.setView({entryId:entry.id,selected:entry.cells[0],modal:'clues',clueDirection:'down',errors:[entry.cells[0]],board:{scale:2,x:-.2,y:-.1}});
  await settle();await b.client.poll();assert.deepEqual(b.state.room.view,a.state.room.view);
  const before={...game.play,answers:a.client.view().answers};
  a.client.edit(before,{...before,entryId:entry.id,selected:entry.cells[1]});await settle();await b.client.poll();assert.equal(b.state.room.view.selected,entry.cells[1]);assert.deepEqual(b.state.room.view.errors,[]);
});
test('either device can start a new round and both keep the same room through multiple games',async()=>{
  const server=transport(),a=client(server),b=client(server);const expires=server.room.expiresAt;
  const first=generatePuzzle({mode:'medium',seed:'shared-next-one'}),second=generatePuzzle({mode:'hard',seed:'shared-next-two'});
  await a.client.newRound(async()=>first);await b.client.poll();
  assert.equal(a.state.room.puzzle.id,first.id);assert.equal(b.state.room.puzzle.id,first.id);assert.equal(b.state.room.expiresAt,expires);assert.deepEqual(b.state.room.answers,{});
  await b.client.newRound(async()=>second);await a.client.poll();assert.equal(a.state.room.puzzle.id,second.id);assert.equal(a.state.canUndo,false);assert.equal(a.client.token,b.client.token);
  const fresh=client(server);fresh.client.start();await settle();assert.equal(fresh.state.room.puzzle.id,second.id);
});
test('old offline edits are fenced out after a new puzzle, and failed generation keeps the old game',async()=>{
  const server=transport(),a=client(server),b=client(server);
  server.offline=true;edit(b.client,cells[0],'Z');await settle();server.offline=false;
  const next=generatePuzzle({mode:'easy',seed:'offline-next'});await a.client.newRound(async()=>next);await b.client.poll();await settle();
  assert.equal(server.room.puzzle.id,next.id);assert.deepEqual(server.room.answers,{});assert.equal(b.state.pending,0);
  await assert.rejects(a.client.newRound(async()=>{throw new Error('No grid');}),/No grid/);assert.equal(server.room.puzzle.id,next.id);assert.equal(a.state.generating,false);
});
test('simultaneous new-game requests reserve one generation lease and cannot replace each other',async()=>{
  const server=transport(),a=client(server),b=client(server);let release,started;
  const begun=new Promise(r=>started=r),gate=new Promise(r=>release=r);
  const next=generatePuzzle({mode:'easy',seed:'lease-next'});
  const first=a.client.newRound(async()=>{started();await gate;return next;});await begun;
  await assert.rejects(b.client.newRound(async()=>next));release();await first;await b.client.poll();assert.equal(b.state.room.puzzle.id,next.id);assert.equal(b.state.generating,false);
});

test('a lost new-round response retries the same replacement without starting a second puzzle',async()=>{
  const server=transport(),a=client(server),b=client(server),next=generatePuzzle({mode:'easy',seed:'lost-round-response'});
  await a.client.newRound(async()=>{server.loseResponse=true;return next;});await b.client.poll();
  assert.equal(a.state.room.roundId,b.state.room.roundId);assert.equal(b.state.room.puzzle.id,next.id);assert.equal(a.state.generating,false);
});


test('empty Lua tables from Upstash normalise to answer/writer maps and an errors array',async()=>{
  const room={...createRoom(game),answers:[],writers:[],view:{...createRoom(game).view,errors:{}}};
  const store=sharedStore(async()=>JSON.stringify(room));const restored=await store.get('a'.repeat(64));
  assert.deepEqual(restored.answers,{});assert.deepEqual(restored.writers,{});assert.deepEqual(restored.view.errors,[]);
});
