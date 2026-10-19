import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePuzzle } from '../lib/engine.mjs';
import { DIFFICULTY_PROFILES, difficultySummary, validateDifficulty } from '../lib/difficulty.mjs';
import { validatePuzzle } from '../lib/validate.mjs';
import { validateWordBank } from '../lib/word-quality.mjs';
import { WORDS } from '../lib/words.mjs';

test('difficulty bands separate word familiarity, clue demand, field counts and longer answers',()=>{
  for(const mode of Object.keys(DIFFICULTY_PROFILES)) for(let seed=0;seed<12;seed++) {
    const p=generatePuzzle({mode,seed:`difficulty-${seed}`});
    assert.equal(p.difficultyVersion,1);
    assert.deepEqual(validateDifficulty(p),[]);
    assert.deepEqual(validatePuzzle(p),[]);
    const summary=difficultySummary(p.entries);
    if(mode==='easy')assert.equal(summary.advanced+summary.challengingClues,0);
    if(mode==='medium')assert.ok(p.entries.some(e=>e.answer.length>=8));
    if(mode==='hard')assert.ok(p.entries.some(e=>e.answer.length>=9));
    for(const entry of p.entries) {
      const source=WORDS.find(w=>w.answer===entry.answer);
      assert.equal(entry.vocabularyLevel,source.vocabularyLevel);
      assert.ok(source.clues.some(c=>c.text===entry.clue && c.level===entry.clueLevel));
    }
  }
});
test('new rated puzzles reject missing ratings, invalid versions and downgraded mixtures',()=>{
  const p=generatePuzzle({mode:'hard',seed:'profile-tampering'});
  const missing=structuredClone(p);delete missing.entries[0].clueLevel;
  const downgraded=structuredClone(p);downgraded.entries.forEach(e=>{e.clueLevel=1;e.vocabularyLevel=1;});
  for(const bad of [missing,downgraded,{...p,difficultyVersion:99}])assert.ok(validatePuzzle(bad).length);
  // Pre-rating saves are still playable; no new policy is retroactively imposed.
  const legacy=structuredClone(p);delete legacy.difficultyVersion;delete legacy.fairnessVersion;
  legacy.entries.forEach(e=>{delete e.clueLevel;delete e.vocabularyLevel;});
  assert.deepEqual(validatePuzzle(legacy),[]);
});
test('ratings are explicit and legacy alternative text is not automatically considered difficult',()=>{
  assert.ok(WORDS.every(w=>[1,2,3].includes(w.vocabularyLevel)));
  const sonnet=WORDS.find(w=>w.answer==='SONNET');
  assert.notEqual(sonnet.easy,sonnet.hard);
  assert.ok(sonnet.clues.every(c=>c.level===1));
  assert.ok(WORDS.filter(w=>w.answer.length>=8).length>=150);
  const base={answer:'CAT',easy:'Domestic feline',hard:'Household feline'};
  assert.deepEqual(validateWordBank([base]),[]);
  for(const word of [
    {...base,clues:[{level:2,text:'Domestic feline'}]},
    {...base,vocabularyLevel:2,clues:[{level:4,text:'Domestic feline'}]},
    {...base,vocabularyLevel:1,clues:[{level:2,text:'A cat'}]},
  ])assert.ok(validateWordBank([word]).length);
});
