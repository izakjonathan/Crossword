import test from 'node:test';
import assert from 'node:assert/strict';
import {validateWordBank, normalizeClue} from '../lib/word-quality.mjs';
import {WORDS} from '../lib/words.mjs';

const word = (answer, clue) => ({answer, easy:clue, hard:clue});
test('entire published bank passes editorial text guardrails', () => {
  assert.deepEqual(validateWordBank(WORDS), []);
  // Same-length answers must not receive an identical definition. Such a clue
  // provides no way to distinguish the intended answer except by crossings.
  const clues = new Map();
  for (const w of WORDS) for (const clue of new Set([w.easy,w.hard])) {
    const key = `${w.answer.length}:${clue.toLowerCase()}`;
    assert.ok(!clues.has(key), `${w.answer} and ${clues.get(key)} share ${clue}`);
    clues.set(key,w.answer);
  }
});
test('editorial guardrails reject ambiguous data assembly and answer giveaways', () => {
  assert.ok(validateWordBank([word('MINT','Herb for tea'),word('MINT','Coin factory')]).some(e=>e.includes('duplicate')));
  for (const w of [word('MINT','Herb used in peppermint tea'),word('INFORM','Provide information'),word('ROSE','Flower among roses'),word('CANDLE','Light from a candle')]) {
    assert.ok(validateWordBank([w]).some(e=>e.includes('revealed')),w.answer);
  }
  assert.ok(validateWordBank([word('A B','A spaced answer')]).length);
  assert.ok(validateWordBank([word('TREE','')]).length);
  assert.ok(validateWordBank([word('TREE','x'.repeat(101))]).length);
  assert.ok(validateWordBank([word('TREE','Woodland|plant')]).length);
});
test('short precise clues and coincidental substrings remain valid', () => {
  assert.deepEqual(validateWordBank([word('COLOUR','Hue'),word('EAR','Organ used for hearing'),word('RING','Gift given in spring')]),[]);
});

test('clue collisions survive typographic and spacing changes', () => {
  assert.equal(normalizeClue('  A person’s  record. '), normalizeClue("A person's record"));
  assert.ok(validateWordBank([word('BROOK','Small stream'),word('CREEK','Small  stream.')]).some(e=>e.includes('same-length')));
  // Identical easy/hard clues for one answer remain valid; this is a collision
  // between different answers, not an invented requirement to paraphrase all.
  assert.deepEqual(validateWordBank([word('BROOK','Small stream')]),[]);
});
test('answer leakage catches ordinary spelling changes without substring false positives', () => {
  for(const [answer,clue] of [['DANCE','Activity involving dancing'],['BERRY','Fruit among berries'],['BUD','Plant structure that is budding']]) {
    assert.ok(validateWordBank([word(answer,clue)]).some(e=>e.includes('revealed')),answer);
  }
  assert.deepEqual(validateWordBank([word('EAR','Organ used for hearing'),word('RING','A gift for spring')]),[]);
});
