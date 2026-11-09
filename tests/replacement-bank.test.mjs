import test from 'node:test';
import assert from 'node:assert/strict';
import {WORDS as retired,GENERATION_WORDS as bank} from '../lib/words.mjs';
import {validateWordBank} from '../lib/word-quality.mjs';
import {generatePuzzle,validatePuzzle} from '../lib/engine.mjs';
import {generateFreshPuzzle} from '../lib/fresh-puzzle.mjs';
import {emptyLedger,recordPuzzle,dayKey} from '../lib/repetition.mjs';
import {recentAnswers} from '../lib/recent-rounds.mjs';
import {validateWordMix} from '../lib/word-mix.mjs';

test('the replacement bank is wholly disjoint, individually clued and roughly one-quarter pop culture',()=>{
 const old=new Set(retired.map(w=>w.answer));
 assert.equal(bank.length,1643);assert.equal(bank.filter(w=>w.category==='pop-culture').length,384);
 assert.ok(bank.every(w=>!old.has(w.answer)&&w.editorialStatus==='approved'));
 assert.deepEqual(validateWordBank(bank),[]);
 assert.ok(bank.filter(w=>w.answer.length===3).length>=300);
 assert.ok(bank.filter(w=>w.clues.some(c=>c.level===3)).length>=150);
 const share=bank.filter(w=>w.category==='pop-culture').length/bank.length;
 assert.ok(share>=.22&&share<=.25);
 assert.ok(!bank.some(w=>['FIERO','LORELAX'].includes(w.answer)));
 assert.match(bank.find(w=>w.answer==='TRAVIS').easy,/football player Kelce/);
 assert.match(bank.find(w=>w.answer==='TRAVIS').easy,/First name/);
});

test('every difficulty meets the content mix; invalid classification and mix are independently rejected',()=>{
 for(const mode of ['easy','medium','hard']){
  const p=generatePuzzle({mode,seed:'replacement-mix'});
  assert.equal(p.wordBankVersion,1);assert.deepEqual(validateWordMix(p.entries),[]);assert.deepEqual(validatePuzzle(p),[]);
  const changed=structuredClone(p);changed.entries.forEach(e=>e.category='general');assert.ok(validatePuzzle(changed).includes('Pop-culture share outside replacement-bank limits'));
  assert.ok(validatePuzzle({...p,wordBankVersion:99}).includes('Unsupported word-bank version'));
 }
});

test('a fully seen retired bank does not block the replacement; mixed rounds keep all protected words excluded',()=>{
 const now=Date.now(),history=emptyLedger();
 history.uses=Object.fromEntries(retired.map(w=>[w.answer,{at:now,day:dayKey(now),game:0}]));
 let ledger=history;
 for(let i=0;i<9;i++){
  const mode=['easy','medium','hard'][i%3],blocked=recentAnswers(ledger.recentRounds);
  const p=generateFreshPuzzle({mode,seed:'replacement-history-'+i,history:ledger,now});
  assert.deepEqual(validatePuzzle(p),[]);assert.ok(p.entries.every(e=>!blocked.has(e.answer)));
  assert.ok(p.entries.every(e=>bank.some(w=>w.answer===e.answer)));
  ledger=recordPuzzle(ledger,p,now);
 }
 assert.equal(ledger.recentRounds.length,5);assert.ok(Object.keys(ledger.uses).length>retired.length);
});
