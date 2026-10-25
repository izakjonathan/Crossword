import test from 'node:test';
import assert from 'node:assert/strict';
import {GENERATION_WORDS,WORDS} from '../lib/words.mjs';
import {EDITED_ADDITIONS} from '../lib/edited-additions.mjs';
import {PREPARED_HARD} from '../lib/prepared-hard.mjs';
import {choosePrepared,expandPrepared} from '../lib/prepared-supply.mjs';
import {validatePuzzle} from '../lib/validate.mjs';
import {generateFreshPuzzle} from '../lib/fresh-puzzle.mjs';
import {emptyLedger,recordPuzzle} from '../lib/repetition.mjs';
import {recentAnswers} from '../lib/recent-rounds.mjs';
import {generatePuzzle} from '../lib/engine.mjs';
import {readFileSync} from 'node:fs';
test('new fill quarantines raw definitions; rewritten additions are explicit and older data stays readable',()=>{
 assert.equal(WORDS.length,5730);assert.equal(GENERATION_WORDS.length,2010);assert.equal(Object.keys(EDITED_ADDITIONS).length,100);
 for(const word of GENERATION_WORDS.filter(w=>w.supplemental)){assert.equal(word.editorialStatus,'rewritten');assert.equal(word.easy,EDITED_ADDITIONS[word.answer]);}
 assert.equal(GENERATION_WORDS.find(w=>w.answer==='FOUND').easy,'Discovered after searching');
 assert.equal(GENERATION_WORDS.find(w=>w.answer==='SMALL').easy,'Limited in size');
});
test('every prepared Hard puzzle passes current geometry, clue difficulty and crossing safeguards',()=>{
 assert.ok(PREPARED_HARD.length>=64);
 for(const p of PREPARED_HARD){assert.equal(p.difficultyVersion,2);assert.deepEqual(validatePuzzle(expandPrepared(p)),[]);}
});
test('prepared selection never repeats protected answers and fresh returned games are isolated copies',()=>{
 const history=emptyLedger(),blocked=new Set(PREPARED_HARD[0].entries.map(e=>e.answer));
 const game=choosePrepared({seed:'blocked',history,blocked});if(game)assert.ok(game.entries.every(e=>!blocked.has(e.answer)));
 const a=choosePrepared({seed:'copy',history,blocked:new Set()}),b=choosePrepared({seed:'copy',history,blocked:new Set()});a.entries[0].clue='changed';assert.notEqual(b.entries[0].clue,'changed');
 const all=new Set(PREPARED_HARD.flatMap(p=>p.entries.map(e=>e.answer)));assert.equal(choosePrepared({seed:'none',history,blocked:all}),null);
});
test('long Hard-only sequences load from the prepared supply without search or protected repeats',()=>{
 let history=emptyLedger();const start=performance.now();
 for(let i=0;i<120;i++){
  const blocked=recentAnswers(history.recentRounds),p=choosePrepared({seed:'continuous-'+i,history,blocked});
  assert.ok(p,`Supply unavailable at round ${i}`);assert.deepEqual(validatePuzzle(p),[]);
  assert.ok(p.entries.every(e=>!blocked.has(e.answer)));history=recordPuzzle(history,p,Date.now());
 }
 assert.ok(performance.now()-start<5000);
});
test('expired search budget exits before starting CSP; keyboard is the sole input mode',()=>{
 assert.throws(()=>generatePuzzle({mode:'hard',seed:'deadline',deadline:0}),/budget/);
 const page=readFileSync(new URL('../app/page.jsx',import.meta.url),'utf8');assert.ok(!page.includes('pencil'));assert.ok(page.includes('<PuzzleKeyboard'));
});

test('Hard recovers after five mixed-mode games while retaining every protected answer',()=>{
 let history=emptyLedger();
 for(let i=0;i<5;i++){const p=generatePuzzle({mode:i%2?'medium':'easy',seed:'mixed-release-'+i,recent:[...recentAnswers(history.recentRounds)]});history=recordPuzzle(history,p,Date.now());}
 const protectedWords=recentAnswers(history.recentRounds);
 const p=generateFreshPuzzle({mode:'hard',seed:'mixed-actual-hard',history,now:Date.now()});
 assert.deepEqual(validatePuzzle(p),[]);assert.ok(p.entries.every(e=>!protectedWords.has(e.answer)));
});
