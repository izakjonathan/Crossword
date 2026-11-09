import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {EXCLUSIONS_KEY,GLOBAL_ANSWERS_KEY,HISTORY_SCAN_KEY,protectedAnswers,readExclusions} from '../lib/answer-history.mjs';
import {emptyLedger,recordPuzzle,readLedger,LEDGER_KEY,dayKey,candidatePools,generateAndRecord,reserveSharedAnswers} from '../lib/repetition.mjs';
import {recoverDeviceAnswers,syncAnswerHistory,claimAnswers} from '../lib/answer-history-client.mjs';
import {answerHistoryStore} from '../lib/answer-history-store.mjs';
import {generateFreshPuzzle} from '../lib/fresh-puzzle.mjs';
import {generatePuzzle} from '../lib/engine.mjs';
import {PREPARED_HARD} from '../lib/prepared-hard.mjs';
import {choosePrepared} from '../lib/prepared-supply.mjs';
import {GENERATION_WORDS} from '../lib/words.mjs';
import {initialState} from '../lib/input.mjs';
import {saveSession,HISTORY_KEY} from '../lib/storage.mjs';
import {saveLibraryGame,removeLibraryGame} from '../features/library/store.mjs';
import {sharedStore,roomKey} from '../lib/shared-store.mjs';
import {POST} from '../app/api/answer-history/route.js';
import {redisTestCommand} from './helpers/redis.mjs';
const memory=()=>{const data=new Map();return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};};
const now=Date.parse('2026-11-09T18:00:00Z');
const word=GENERATION_WORDS[0].answer,other=GENERATION_WORDS[1].answer;
const puzzle=answers=>({entries:answers.map(answer=>({answer}))});
const locks={request:async(name,options,fn)=>fn()};

test('complete device ledger, legacy history, session and saved library are recovered without changing games',()=>{
 const storage=memory();
 storage.setItem(LEDGER_KEY,JSON.stringify({...emptyLedger(),sequence:200,uses:{[word]:{at:now-86400000,day:dayKey(now-86400000),game:1}},recentRounds:[]}));
 storage.setItem(HISTORY_KEY,JSON.stringify([other]));
 const p=generatePuzzle({mode:'easy',seed:'history-recovery'}),game={puzzle:p,play:initialState(p)};
 saveSession(storage,game);const row=saveLibraryGame(storage,game);
 const session=storage.getItem('daily-cross:session:v3'),library=storage.getItem('daily-cross:library:v1');
 const answers=recoverDeviceAnswers(storage,null,now);
 for(const answer of [word,other,...p.entries.map(e=>e.answer)])assert.ok(answers.includes(answer));
 assert.equal(storage.getItem('daily-cross:session:v3'),session);assert.equal(storage.getItem('daily-cross:library:v1'),library);
 assert.equal(row.game.puzzle.id,p.id);
});
test('sync keeps exclusions after library deletion and reload, merges other devices, and fails closed offline',async()=>{
 const storage=memory();storage.setItem(LEDGER_KEY,JSON.stringify({...emptyLedger(),sequence:100,uses:{[word]:{at:now,day:dayKey(now),game:1}},recentRounds:[]}));
 const fetcher=async(url,options)=>{assert.equal(url,'/api/answer-history');assert.ok(JSON.parse(options.body).answers.includes(word));return Response.json({ready:true,answers:[word,other]});};
 await syncAnswerHistory(storage,null,{fetcher});
 assert.deepEqual(new Set(readLedger(storage,now).excludedAnswers),new Set([word,other]));
 removeLibraryGame(storage,'anything');assert.ok(readExclusions(storage).includes(word));
 await assert.rejects(syncAnswerHistory(storage,null,{fetcher:async()=>{throw new Error('Offline');}}),/Offline/);
 assert.ok(readExclusions(storage).includes(word));
 storage.setItem(EXCLUSIONS_KEY,'broken');assert.throws(()=>readLedger(storage,now),/could not be read/);
});
test('full-history exclusions survive five-round rollover and never re-enter widened pools',()=>{
 let history={...emptyLedger(),excludedAnswers:[word]};
 const selected=GENERATION_WORDS.filter(w=>w.answer!==word).slice(0,6);
 for(const w of selected)history=recordPuzzle(history,puzzle([w.answer]),now);
 assert.ok(!history.recentRounds.flat().includes(selected[0].answer));
 assert.throws(()=>recordPuzzle(history,puzzle([word]),now),/already been used/);
 assert.throws(()=>recordPuzzle(history,puzzle([selected[0].answer]),now),/already been used/);
 assert.ok(candidatePools(GENERATION_WORDS,history,now).every(pool=>pool.every(w=>!protectedAnswers(history).has(w.answer))));
 const storage=memory();storage.setItem(LEDGER_KEY,JSON.stringify(history));reserveSharedAnswers(storage,puzzle([other]),now);
 assert.ok(readExclusions(storage).includes(other));
});
test('prepared and CSP generation honor permanent answers outside the recent-five window',()=>{
 const excludedAnswers=PREPARED_HARD[0].entries.map(e=>e.answer),history={...emptyLedger(),excludedAnswers};
 const prepared=choosePrepared({seed:'permanent',history,blocked:new Set()});
 if(prepared)assert.ok(prepared.entries.every(e=>!excludedAnswers.includes(e.answer)));
 const allPrepared=PREPARED_HARD.flatMap(p=>p.entries.map(e=>e.answer));
 assert.equal(choosePrepared({seed:'all',history:{...history,excludedAnswers:allPrepared},blocked:new Set()}),null);
 const p=generateFreshPuzzle({mode:'easy',seed:'permanent-csp',history,now});
 assert.ok(p.entries.every(e=>!excludedAnswers.includes(e.answer)));
 assert.throws(()=>generateFreshPuzzle({mode:'hard',seed:'exhausted',history:{...history,excludedAnswers:GENERATION_WORDS.map(w=>w.answer)},now}),/Too few eligible/);
});
test('a server reservation failure cannot publish or commit a generated puzzle',async()=>{
 const storage=memory();let calls=0;
 await assert.rejects(generateAndRecord({storage,locks,now:()=>now,makePuzzle:()=>puzzle([word]),historyForGeneration:async h=>({...h,excludedAnswers:[]}),reservePuzzle:async()=>{calls++;throw new Error('Conflict');}}),/Conflict/);
 assert.equal(calls,1);assert.equal(readLedger(storage,now).sequence,0);
});
test('lost reservation responses retry exactly the same claim identifier and answers',async()=>{
 const bodies=[];await claimAnswers(puzzle([word]),{fetcher:async(url,options)=>{bodies.push(JSON.parse(options.body));if(bodies.length===1)throw new Error('Response lost');return Response.json({ready:true,answers:[word]});}});
 assert.equal(bodies.length,2);assert.deepEqual(bodies[0],bodies[1]);
});
test('history API rejects foreign origins, invalid words/actions, non-JSON and oversized input before writes',async()=>{
 const req=(body,headers={})=>new Request('https://example.com/api/answer-history',{method:'POST',headers:{'content-type':'application/json',...headers},body});
 for(const [body,headers,status] of [['{}',{origin:'https://elsewhere.com'},403],['{}',{'content-type':'text/plain'},415],['x'.repeat(120001),{},413],['{bad',{},400],['{}',{},400],[JSON.stringify({action:'sync',answers:['bad!']}),{},400]])assert.equal((await POST(req(body,headers))).status,status);
});
test('real Redis imports surviving rooms, retains non-expiring history, and atomically rejects a second device',{skip:!process.env.REDIS_TEST_CLI},async()=>{
 const command=redisTestCommand({recovered:false}),store=answerHistoryStore(command),key='crossword:shared:v1:'+'f'.repeat(64);
 await command(['SET',key,JSON.stringify({usedAnswers:[word],recentRounds:[[other]],puzzle:{entries:[]}}),'EX',10]);
 try{
  const sync=await store.sync([]);assert.equal(sync.ready,true);assert.ok(sync.answers.includes(word));assert.ok(sync.answers.includes(other));
  assert.equal(await command(['TTL',GLOBAL_ANSWERS_KEY]),-1);
  assert.ok(await command(['TTL',key])>0);
  const fresh=GENERATION_WORDS.find(w=>![word,other].includes(w.answer)).answer,first=randomUUID(),second=randomUUID();
  const results=await Promise.allSettled([store.claim(first,[fresh]),store.claim(second,[fresh])]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.status,409);
  const owner=results[0].status==='fulfilled'?first:second;await store.claim(owner,[fresh]);
  await store.sync([fresh]);await store.claim(owner,[fresh]); // import never overwrites reservation ownership
  await command(['DEL',key]);assert.ok((await store.sync([])).answers.includes(word));
 }finally{await command(['DEL',key]);}
});
test('real Redis fences shared replacement against a solo reservation without losing letters or membership',{skip:!process.env.REDIS_TEST_CLI},async()=>{
 const command=redisTestCommand(),rooms=sharedStore(command),history=answerHistoryStore(command);
 const original=generatePuzzle({mode:'easy',seed:'permanent-room'}),{token}=await rooms.create({puzzle:original,play:initialState(original)},randomUUID());
 const current=await rooms.get(token),next=generatePuzzle({mode:'easy',seed:'permanent-next',recent:original.entries.map(e=>e.answer)});
 const id=randomUUID();await rooms.patch(token,{id,roundId:current.roundId,kind:'begin',changes:[],assisted:false});
 await history.claim(randomUUID(),next.entries.map(e=>e.answer));
 await assert.rejects(rooms.patch(token,{id:randomUUID(),roundId:current.roundId,kind:'replace',leaseId:id,puzzle:next,changes:[],assisted:false}),e=>e.status===409);
 assert.equal((await rooms.get(token)).puzzle.id,original.id);assert.ok(await command(['TTL',roomKey(token)])>0);
});
