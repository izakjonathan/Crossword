import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { generatePuzzle, random } from '../lib/engine.mjs';
import { fillLayout } from '../lib/grid-fill.mjs';

// Construction v5 intentionally changes layouts and resulting fills/clues.
// Keep historical hashes; freeze v2.13.0 for future search-cost changes.
const reference = JSON.parse(readFileSync(new URL('./fixtures/v2.13.0-generation-hashes.json',import.meta.url)));
test('seeded search preserves complete v2.13.0 editorial-bank output for fixed inputs',()=>{
  for (const {input,sha256} of reference.cases) {
    const actual=createHash('sha256').update(JSON.stringify(generatePuzzle(input))).digest('hex');
    assert.equal(actual,sha256,JSON.stringify(input));
  }
});
test('cached crossing domains retain all-different and backtracking acceptance rules',()=>{
  const layout={slots:[
    {id:0,cells:[0,1,2],crossings:[{other:1,position:1,otherPosition:1}]},
    {id:1,cells:[3,1,4],crossings:[{other:0,position:1,otherPosition:1}]},
  ]};
  const bank=['CAT','BAT','BAR','CAR'].map(answer=>({answer}));
  const attempts=[];
  const result=fillLayout(layout,bank,random('domain-accept'),3000,null,words=>{
    attempts.push(words.map(w=>w.answer));
    return attempts.length===3;
  });
  assert.equal(attempts.length,3);
  assert.ok(attempts.every(words=>new Set(words).size===2));
  assert.deepEqual(result.words.map(w=>w.answer),attempts[2]);
  assert.equal(fillLayout(layout,[{answer:'CAT'},{answer:'CAT'}],random('same-answer')).words,null);
});
