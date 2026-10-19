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
  const make=(cell,value,expected)=>{const operation={id:randomUUID(),changes:[{cell,value,...(expected?{expected}:{})}],assisted:false};ops.push(operation);return operation;};
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
