import test from 'node:test';
import {readFileSync} from 'node:fs';
import {loadSession} from '../lib/storage.mjs';
import assert from 'node:assert/strict';
import { generatePuzzle, random } from '../lib/engine.mjs';
import { crossingSafety, validateCrossingSafety } from '../lib/crossing-safety.mjs';
import { selectClues } from '../lib/clue-selection.mjs';
import { validatePuzzle } from '../lib/validate.mjs';
import { validateWordBank } from '../lib/word-quality.mjs';

const graph = neighbours => neighbours.map((list,id)=>({id,crossings:list.map(other=>({other}))}));
const rated = (levels=[1,2,3]) => ({clues:levels.map(level=>({level,text:`Tier ${level}`}))});

test('crossing metrics count pairs once and distinguish hard neighbours from missing support',()=>{
  const entries=[
    {id:0,cells:[0,1,2],vocabularyLevel:3,clueLevel:3},
    {id:1,cells:[0,3,6],vocabularyLevel:3,clueLevel:3},
    {id:2,cells:[2,5,8],vocabularyLevel:1,clueLevel:2},
  ];
  assert.deepEqual(crossingSafety(entries),{specialistPairs:1,hardestCluePairs:1,unsupportedHardClues:1});
  entries[1].clueLevel=1;entries[1].vocabularyLevel=2;
  assert.deepEqual(crossingSafety(entries),{specialistPairs:0,hardestCluePairs:0,unsupportedHardClues:0});
});
test('new grids enforce crossing safeguards without lowering difficulty targets',()=>{
  for(const mode of ['easy','medium','hard']) for(let seed=0;seed<12;seed++) {
    const p=generatePuzzle({mode,seed:`safe-crossings-${seed}`});
    assert.equal(p.fairnessVersion,1);
    assert.deepEqual(validatePuzzle(p),[]);
    assert.deepEqual(validateCrossingSafety(p),[]);
    const q=crossingSafety(p.entries);
    assert.equal(q.specialistPairs,0);assert.equal(q.unsupportedHardClues,0);
  }
});
test('clue allocation backtracks, rejects impossible support and obeys its search budget',()=>{
  // Only vertices 0 and 1 have tier 3; both share one another as their sole
  // crossing. Hard needs two such clues in this six-answer example, so no
  // valid assignment exists even though enough hard variants are present.
  const words=[rated([1,3]),rated([1,3]),...Array.from({length:4},()=>rated([1,2]))];
  assert.equal(selectClues(words,'hard',graph([[1],[0],[3],[2],[5],[4]]),random('impossible')),null);
  const slots=graph([[1,2],[0,3],[0],[1],[5],[4]]);
  const selected=selectClues(words,'hard',slots,random('supported'));
  assert.ok(selected);
  assert.equal(selected.filter(c=>c.level===3).length,2);
  assert.equal(selected.filter(c=>c.level>=2).length,4);
  assert.deepEqual(selected,selectClues(words,'hard',slots,random('supported')));
  const branchWords=[rated([1,3]),rated([1,3]),rated([1,3]),...Array.from({length:3},()=>rated([1,2]))];
  const branched=selectClues(branchWords,'hard',graph([[1],[0,3],[4],[1],[2],[5]]),()=>0);
  assert.ok(branched);assert.equal(branched[0].level,3);assert.equal(branched[1].level,1);assert.equal(branched[2].level,3);
  assert.equal(selectClues(words,'hard',slots,random('budget'),0),null);
  assert.equal(selectClues([rated([2])],'easy',graph([[]]),random('no-direct')),null);
});
test('fairness validation rejects damage while genuine pre-safeguard grids remain playable',()=>{
  const fixture=readFileSync(new URL('./fixtures/v2.8.0-specialist-crossings.json',import.meta.url),'utf8');
  const saved=loadSession({getItem:()=>fixture});
  assert.ok(saved);assert.equal(saved.play.answers[saved.play.selected],'X');
  assert.ok(crossingSafety(saved.puzzle.entries).specialistPairs>0);
  assert.deepEqual(validatePuzzle(saved.puzzle),[]);
  const p=generatePuzzle({mode:'hard',seed:'safety-damage'});
  const crossed=structuredClone(p),first=crossed.entries[0];
  const neighbour=crossed.entries.find(e=>e.id!==first.id&&e.cells.some(c=>first.cells.includes(c)));
  first.vocabularyLevel=3;neighbour.vocabularyLevel=3;
  assert.ok(validatePuzzle(crossed).includes('Specialist answers cross each other'));
  const unsupported=structuredClone(p);unsupported.entries.forEach(e=>{e.clueLevel=3;});
  assert.ok(validatePuzzle(unsupported).includes('Hardest clue has no gentler crossing clue'));
  assert.ok(validatePuzzle({...p,fairnessVersion:99}).includes('Unsupported crossing fairness version'));
  const unrated=structuredClone(p);delete unrated.entries[0].vocabularyLevel;
  assert.ok(validatePuzzle(unrated).includes('Missing crossing fairness ratings'));
  assert.deepEqual(validateCrossingSafety({...p,mode:'medium',entries:p.entries.map(e=>({...e,clueLevel:3}))}).includes('Hardest clues outside Hard mode'),true);
});
test('rated bank entries require a direct clue and distinct tier identities',()=>{
  const base={answer:'CAT',easy:'Domestic feline',hard:'Household pet',vocabularyLevel:1};
  assert.deepEqual(validateWordBank([{...base,clues:[{text:base.easy,level:1}]}]),[]);
  for(const clues of [
    [{text:'Household pet',level:2}],
    [{text:base.easy,level:1},{text:'Household pet',level:1}],
    [{text:base.easy,level:1},{text:'Domestic feline.',level:2}],
  ])assert.ok(validateWordBank([{...base,clues}]).length);
});
