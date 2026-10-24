import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyLedger, dayKey, recordPuzzle, candidatePools, readLedger, generateAndRecord, LEDGER_KEY } from '../lib/repetition.mjs';
import { generateFreshPuzzle } from '../lib/fresh-puzzle.mjs';
import { ledgerRounds, recentAnswers } from '../lib/recent-rounds.mjs';
import { WORDS } from '../lib/words.mjs';
import { HISTORY_KEY } from '../lib/storage.mjs';
const now=Date.parse('2026-10-19T10:00:00Z'), day=86400000;
function storage(){const values=new Map();return{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};}
const puzzle=words=>({entries:words.map(answer=>({answer}))});
test('dense generation protects the most recent five puzzles across all modes',()=>{
 let history=emptyLedger(); const seen=new Set();
 for(let i=0;i<12;i++){
  const p=generateFreshPuzzle({mode:['easy','medium','hard'][i%3],seed:`day-${i}`,history,now:now+i*1000});
  for(const e of p.entries){assert.ok(!recentAnswers(ledgerRounds(history)).has(e.answer),e.answer);seen.add(e.answer);}
  history=recordPuzzle(history,p,now+i*1000);
 }
 assert.equal(Object.keys(history.uses).length,seen.size);
});
test('Copenhagen calendar boundaries and daylight saving time are explicit',()=>{
 assert.equal(dayKey(Date.parse('2026-10-19T21:59:59Z')),'2026-10-19');
 assert.equal(dayKey(Date.parse('2026-10-19T22:00:00Z')),'2026-10-20');
 assert.equal(dayKey(Date.parse('2026-12-19T22:59:59Z')),'2026-12-19');
 assert.equal(dayKey(Date.parse('2026-12-19T23:00:00Z')),'2026-12-20');
});
test('unused and well-rested answers precede younger answers in candidate pools',()=>{
 const bank=['APPLE','PEAR','GRAPE','PLUM'].map(answer=>({answer}));
 const history={version:1,sequence:100,uses:{PEAR:{at:now-90*day,day:dayKey(now-90*day),game:1},GRAPE:{at:now-10*day,day:dayKey(now-10*day),game:70},PLUM:{at:now,day:dayKey(now),game:100}}};
 const pools=candidatePools(bank,history,now).map(pool=>pool.map(w=>w.answer));
 assert.deepEqual(pools[0],['APPLE']);assert.deepEqual(pools[1],['APPLE','PEAR','GRAPE']);
 assert.ok(pools.every(pool=>!pool.includes('PLUM')));
 assert.deepEqual(pools.at(-1),['APPLE','PEAR','GRAPE']);
});
test('true rolling-window exhaustion has a distinct error and cannot repeat a protected answer',()=>{
 const history=recordPuzzle(emptyLedger(),puzzle(WORDS.map(w=>w.answer)),now);
 assert.throws(()=>generateFreshPuzzle({mode:'easy',seed:'exhausted',history,now}),/Too few eligible answers/);
 assert.throws(()=>recordPuzzle(history,puzzle(['APPLE']),now),/last five puzzles/);
});
test('full history survives reload and undated legacy history becomes a preference',()=>{
 const s=storage();s.setItem(HISTORY_KEY,JSON.stringify(['APPLE','PEAR']));
 const migrated=readLedger(s,now);assert.equal(migrated.uses.APPLE.day,dayKey(now));
 const next=recordPuzzle(migrated,puzzle(['GRAPE']),now);s.setItem(LEDGER_KEY,JSON.stringify(next));
 assert.deepEqual(readLedger(s,now+day),next);
 s.setItem(LEDGER_KEY,'broken');assert.throws(()=>readLedger(s,now),/history could not be read/);
});
test('concurrent generators share an exclusive history transaction; storage failure never publishes a puzzle',async()=>{
 const s=storage();let tail=Promise.resolve(), active=0;
 const locks={request(name,opts,fn){assert.equal(opts.mode,'exclusive');const result=tail.then(async()=>{assert.equal(active++,0);try{return await fn();}finally{active--;}});tail=result.catch(()=>{});return result;}};
 const generate=()=>generateAndRecord({storage:s,locks,now:()=>now,makePuzzle:async history=>{await Promise.resolve();return puzzle(history.uses.APPLE?['PEAR']:['APPLE']);}});
 const [a,b]=await Promise.all([generate(),generate()]);assert.notDeepEqual(a,b);
 assert.equal(readLedger(s,now).sequence,2);
 let called=false;
 await assert.rejects(()=>generateAndRecord({storage:{getItem:()=>null,setItem(){throw new Error('Denied');}},locks,now:()=>now,makePuzzle:()=>{called=true;}}),/Allow site storage/);
 assert.equal(called,false);
 await assert.rejects(()=>generateAndRecord({storage:s,locks:null,makePuzzle:()=>{}}),/Update your browser/);
});

test('five intervening puzzles unlock an answer without waiting for a calendar date',()=>{
 let history=recordPuzzle(emptyLedger(),puzzle(['APPLE']),now);
 for(const word of ['PEAR','GRAPE','PLUM','MELON'])history=recordPuzzle(history,puzzle([word]),now);
 assert.throws(()=>recordPuzzle(history,puzzle(['APPLE']),now),/last five/);
 history=recordPuzzle(history,puzzle(['LEMON']),now);
 assert.doesNotThrow(()=>recordPuzzle(history,puzzle(['APPLE']),now));
 assert.ok(candidatePools([{answer:'APPLE'}],history,now).at(-1).length);
});
test('a fully exhausted legacy bank recovers without clearing storage',()=>{
 const s=storage(), uses=Object.fromEntries(WORDS.map(w=>[w.answer,{at:now,day:dayKey(now),game:0}]));
 s.setItem(LEDGER_KEY,JSON.stringify({version:1,sequence:0,uses}));
 const history=readLedger(s,now);
 assert.equal(candidatePools(WORDS,history,now).at(-1).length,WORDS.length);
 const current=puzzle(['APPLE','PEAR']);const reserved=readLedger(s,now,current);
 assert.deepEqual([...recentAnswers(reserved.recentRounds)].sort(),['APPLE','PEAR']);
 assert.ok(!candidatePools(WORDS,reserved,now).at(-1).some(w=>w.answer==='APPLE'));
});
test('a failed final history write rejects the generated puzzle',async()=>{
 let writes=0;const s={getItem:()=>null,setItem(){if(++writes===2)throw new Error('Full');}};
 const locks={request:async(name,options,fn)=>fn()};
 await assert.rejects(()=>generateAndRecord({storage:s,locks,now:()=>now,makePuzzle:()=>puzzle(['APPLE'])}),/history could not be saved/);
});

test('the ledger retains over 500 seen answers while hard exclusion stays bounded',()=>{
 let history=emptyLedger();
 // Ledger capacity is independent of how many dense grids the finite bank
 // can currently form. Reserve actual bank answers in successive batches.
 for(let i=0;i<600;i+=10) history=recordPuzzle(history,puzzle(WORDS.slice(i,i+10).map(w=>w.answer)),now+i*1000);
 assert.equal(Object.keys(history.uses).length,600);
 const pools=candidatePools(WORDS,history,now+600000);
 const blocked=recentAnswers(history.recentRounds);
 assert.equal(blocked.size,50);
 for(const pool of pools)for(const word of pool)assert.ok(!blocked.has(word.answer));
 assert.ok(pools.at(-1).some(w=>history.uses[w.answer]));
 const s=storage();s.setItem(LEDGER_KEY,JSON.stringify(history));
 assert.equal(Object.keys(readLedger(s,now+600000).uses).length,600);
});
