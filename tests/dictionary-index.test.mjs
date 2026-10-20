import test from 'node:test';
import assert from 'node:assert/strict';
import { createDictionaryIndex } from '../lib/dictionary-index.mjs';
import { WORDS } from '../lib/words.mjs';

test('indexed length and crossing queries equal linear matching across the curated bank', () => {
  const index = createDictionaryIndex(WORDS);
  for (const length of new Set(WORDS.map(word => word.answer.length))) {
    const domain = index.forLength(length);
    assert.deepEqual(domain, WORDS.filter(word => word.answer.length === length));
    for (let position = 0; position < length; position++) {
      for (const allowed of [true, false]) {
        const groups = index.letters(domain, position, allowed);
        for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
          assert.deepEqual(groups.get(letter) || [], domain.filter(word =>
            word.answer[position] === letter && (allowed || word.vocabularyLevel !== 3)));
        }
      }
    }
  }
  assert.deepEqual(index.forLength(100), []);
});

test('backtracking queries preserve parent domains, duplicate exclusion and history isolation', () => {
  const bank = ['CAT', 'CAR', 'BAT', 'BAR', 'CAT'].map(answer => ({ answer }));
  const index = createDictionaryIndex(bank), parent = index.forLength(3);
  const child = index.without(parent, 'CAT');
  assert.deepEqual(child.map(word => word.answer), ['CAR', 'BAT', 'BAR']);
  assert.deepEqual(parent, bank);
  assert.strictEqual(index.without(parent, 'CAT'), child);
  assert.strictEqual(index.without(parent, 'DOG'), parent);
  assert.deepEqual(index.letters(child, 0).get('C').map(word => word.answer), ['CAR']);
  assert.deepEqual(index.letters(parent, 0).get('C').map(word => word.answer), ['CAT', 'CAR', 'CAT']);
  const restricted = createDictionaryIndex(bank.filter(word => word.answer !== 'CAT'));
  assert.deepEqual(restricted.forLength(3).map(word => word.answer), ['CAR', 'BAT', 'BAR']);
  assert.notStrictEqual(restricted.forLength(3), child);
});
