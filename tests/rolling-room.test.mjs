import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {sharedStore,roomKey} from '../lib/shared-store.mjs';
import {sharedHistory} from '../lib/shared-model.mjs';
import {generatePuzzle} from '../lib/engine.mjs';
import {initialState} from '../lib/input.mjs';
import {emptyLedger} from '../lib/repetition.mjs';
import {WORDS} from '../lib/words.mjs';
import {SUPPLEMENTAL_WORDS} from '../lib/supplemental-words.mjs';

test('expanded dictionary has traceable direct definitions and no invented harder variants',()=>{
 assert.equal(WORDS.length,5730); assert.equal(SUPPLEMENTAL_WORDS.length,3820);
 for(const word of SUPPLEMENTAL_WORDS){
  assert.equal(word.hard,word.easy); assert.equal(word.vocabularyLevel,2);
  assert.match(word.wordnetSense,/\.[nvars]\.\d+$/);
  assert.equal(word.source,'https://wordnet.princeton.edu/');
 }
});
test('shared history uses the lobby window rather than an obsolete lifetime blacklist',()=>{
 const room={puzzle:{entries:[{answer:'APPLE'}]},usedAnswers:WORDS.map(w=>w.answer)};
 assert.deepEqual(sharedHistory(emptyLedger(),room,Date.now()).recentRounds,[['APPLE']]);
 room.recentRounds=[['PEAR'],['APPLE']];
 assert.deepEqual(sharedHistory(emptyLedger(),room,Date.now()).recentRounds,room.recentRounds);
});
test('real Redis migrates an exhausted old lobby and rolls over its five-round window',{skip:!process.env.REDIS_TEST_CLI},async()=>{
 const command=async args=>JSON.parse(execFileSync(process.env.REDIS_TEST_CLI,['-p',process.env.REDIS_TEST_PORT||'6397','--json',...args.map(String)],{encoding:'utf8'}));
 const store=sharedStore(command),original=generatePuzzle({mode:'easy',seed:'legacy-lobby-original'});
 const {token}=await store.create({puzzle:original,play:initialState(original)},randomUUID()),key=roomKey(token),ids=[];
 try{
  let stored=JSON.parse(await command(['GET',key]));delete stored.recentRounds;
  stored.usedAnswers=WORDS.map(w=>w.answer);await command(['SET',key,JSON.stringify(stored),'KEEPTTL']);
  let current=await store.get(token),allSeen=original.entries.map(e=>e.answer);
  const action=(kind,extra={})=>{const id=randomUUID();ids.push(id);return{id,roundId:current.roundId||current.puzzle.id,kind,changes:[],assisted:false,...extra};};
  for(let i=0;i<6;i++){
   const lease=action('begin');await store.patch(token,lease);
   if(i===0)await assert.rejects(store.patch(token,action('replace',{leaseId:lease.id,puzzle:original})),e=>e.status===400);
   const next=generatePuzzle({mode:'easy',seed:'rolling-lobby-'+i,recent:allSeen});
   allSeen.push(...next.entries.map(e=>e.answer));
   current=await store.patch(token,action('replace',{leaseId:lease.id,puzzle:next}));
   assert.ok(current.recentRounds.length<=5);
   assert.deepEqual(current.usedAnswers,current.recentRounds.flat());
   assert.ok(current.usedAnswers.length<250);
  }
  const lease=action('begin');await store.patch(token,lease);
  current=await store.patch(token,action('replace',{leaseId:lease.id,puzzle:original}));
  assert.equal(current.puzzle.id,original.id);assert.equal(current.recentRounds.length,5);
  assert.ok(await command(['TTL',key])>0);
 }finally{await command(['DEL',key,...ids.map(id=>`${key}:op:${id}`)]);}
});
