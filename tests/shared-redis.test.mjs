import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { sharedStore, roomKey } from '../lib/shared-store.mjs';
import { generatePuzzle } from '../lib/engine.mjs';
import { initialState } from '../lib/input.mjs';

// Explicit opt-in: use a disposable Redis database, never production.
const cli = process.env.REDIS_TEST_CLI;
test('real Redis atomically merges concurrent edits, deduplicates retries, guards undo and expires rooms', {skip:!cli}, async()=>{
  const port=process.env.REDIS_TEST_PORT || '6397';
  const command=async args=>JSON.parse(execFileSync(cli,['-p',port,'--json',...args.map(String)],{encoding:'utf8'}));
  const store=sharedStore(command),puzzle=generatePuzzle({mode:'easy',seed:'shared-redis-test'});
  const game={puzzle,play:initialState(puzzle)},address=`test-${randomUUID()}`;
  const {token}=await store.create(game,address),other=await store.create(game,`${address}-other`);
  const key=roomKey(token),ops=[];
  const cells=puzzle.grid.flatMap((cell,i)=>cell?[String(i)]:[]);
  const make=(cell,value,expected)=>{const operation={id:randomUUID(),roundId:puzzle.id,changes:[{cell,value,...(expected?{expected}:{})}],assisted:false};ops.push(operation);return operation;};
  try{
    const a=make(cells[0],'A'),b=make(cells[1],'B');await Promise.all([store.patch(token,a),store.patch(token,b)]);
    let room=await store.get(token);assert.equal(room.answers[cells[0]],'A');assert.equal(room.answers[cells[1]],'B');assert.equal(room.revision,2);
    const newer=make(cells[0],'C');await store.patch(token,newer);await store.patch(token,a);room=await store.get(token);assert.equal(room.answers[cells[0]],'C');assert.equal(room.revision,3);
    await store.patch(token,make(cells[0],'',a.id));assert.equal((await store.get(token)).answers[cells[0]],'C');
    await store.patch(token,make(cells[0],'',newer.id));assert.equal((await store.get(token)).answers[cells[0]],'');
    await store.patch(token,{...make(cells[1],'D'),assisted:true});assert.equal((await store.get(token)).assisted,true);
    await assert.rejects(store.patch(token,make('9999','A')),e=>e.status===400);assert.deepEqual((await store.get(other.token)).answers,{});
    const ttl=await command(['TTL',key]);assert.ok(ttl>604700&&ttl<=604800);
    await command(['PEXPIRE',key,1]);await new Promise(resolve=>setTimeout(resolve,5));await assert.rejects(store.get(token),e=>e.status===404);
  }finally{await command(['DEL',key,roomKey(other.token),...ops.map(op=>`${key}:op:${op.id}`)]);}
});

test('real Redis keeps devices in one room across new rounds and fences all old requests',{skip:!cli},async()=>{
  const command=async args=>JSON.parse(execFileSync(cli,['-p',process.env.REDIS_TEST_PORT||'6397','--json',...args.map(String)],{encoding:'utf8'}));
  const store=sharedStore(command),puzzle=generatePuzzle({mode:'easy',seed:'round-start'}),{token}=await store.create({puzzle,play:initialState(puzzle)},randomUUID());
  const key=roomKey(token),ids=[];let round=puzzle.id;
  const action=(kind,extra={})=>{const op={id:randomUUID(),kind,roundId:round,changes:[],assisted:false,...extra};ids.push(op.id);return op;};
  try{
    const begin=action('begin');const [one,two]=await Promise.allSettled([store.patch(token,begin),store.patch(token,action('begin'))]);
    assert.equal(one.status,'fulfilled');assert.equal(two.status,'rejected');assert.equal(two.reason.status,409);
    const next=generatePuzzle({mode:'medium',seed:'round-second',recent:puzzle.entries.map(e=>e.answer)});
    await assert.rejects(store.patch(token,action('replace',{leaseId:randomUUID(),puzzle:next})),e=>e.status===409);
    await assert.rejects(store.patch(token,action('replace',{leaseId:begin.id,puzzle})),e=>e.status===400);
    const replacement=action('replace',{leaseId:begin.id,puzzle:next}),updated=await store.patch(token,replacement);
    assert.equal(updated.puzzle.id,next.id);assert.equal(updated.roundId,replacement.id);assert.equal(updated.generating,undefined);assert.deepEqual(updated.answers,{});
    const retry=await store.patch(token,replacement);assert.equal(retry.revision,updated.revision);
    await assert.rejects(store.patch(token,action('edit',{changes:[{cell:String(puzzle.entries[0].cells[0]),value:'Z'}]})),e=>e.status===409);
    round=updated.roundId;
    const entry=next.entries[1];await store.patch(token,action('edit',{view:{entryId:entry.id,selected:entry.cells[0],modal:'clues',clueDirection:'down',errors:[entry.cells[0]],board:{scale:2,x:-.2,y:-.1}}}));
    const otherDevice=await store.get(token);assert.equal(otherDevice.view.selected,entry.cells[0]);assert.equal(otherDevice.view.modal,'clues');assert.equal(otherDevice.view.board.scale,2);
    const secondLease=action('begin');await store.patch(token,secondLease);await store.patch(token,action('cancel',{leaseId:secondLease.id}));assert.equal((await store.get(token)).generating,undefined);
    const lease=action('begin');await store.patch(token,lease);
    const third=generatePuzzle({mode:'easy',seed:'round-third',recent:(await store.get(token)).usedAnswers});
    const final=await store.patch(token,action('replace',{leaseId:lease.id,puzzle:third}));assert.equal(final.puzzle.id,third.id);
    assert.equal(new Set(final.usedAnswers).size,final.usedAnswers.length);assert.ok(await command(['TTL',key])<=604800);
    assert.deepEqual((await store.get(token)).answers,{});
  }finally{await command(['DEL',key,...ids.map(id=>`${key}:op:${id}`)]);}
});

test('real Redis keeps a shared popup closed after either client dismisses it and polling continues',{skip:!cli},async()=>{
  const {SharedClient}=await import('../lib/shared-client.mjs');
  const command=async args=>JSON.parse(execFileSync(cli,['-p',process.env.REDIS_TEST_PORT||'6397','--json',...args.map(String)],{encoding:'utf8'}));
  const store=sharedStore(command),puzzle=generatePuzzle({mode:'easy',seed:'popup-real-redis'});
  const {token,room}=await store.create({puzzle,play:initialState(puzzle)},randomUUID()),ids=[],clients=[];
  const key=roomKey(token),states=[];
  const request=async(_,method,operation)=>method==='PATCH'?store.patch(token,operation):store.get(token);
  try{
    for(let i=0;i<2;i++)clients.push(new SharedClient({token,room:structuredClone(room),request,onChange:state=>{states[i]=state;},schedule:()=>0,cancel:()=>{},uuid:()=>{const id=randomUUID();ids.push(id);return id;}}));
    const [a,b]=clients;
    a.setView({modal:'clues',clueDirection:'down',board:{scale:2,x:-.1,y:-.2}});await a.flush();await b.poll();
    assert.equal(states[1].room.view.modal,'clues');
    b.setView({modal:null,board:null});await b.flush();
    for(let i=0;i<3;i++){await a.poll();await b.poll();assert.equal(states[0].room.view.modal,null);assert.equal(states[1].room.view.modal,null);}
    assert.equal(states[0].room.view.board,null);assert.equal(states[0].room.view.clueDirection,'down');
    a.setView({clueDirection:'across'});await a.flush();await b.poll();assert.equal(states[1].room.view.modal,null);
    assert.equal(JSON.parse(await command(['GET',key])).view.modal,false);
  }finally{clients.forEach(client=>client.stop());await command(['DEL',key,...ids.map(id=>`${key}:op:${id}`)]);}
});
