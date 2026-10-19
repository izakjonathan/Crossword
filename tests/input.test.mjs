import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, enterText, selectCell, backspace, undoInput, moveCell, nextEntry, revealWord } from '../lib/input.mjs';
const puzzle = { cols: 3, rows: 3, entries: [
  { id: 0, answer: 'CAT', clue: 'Domestic feline', dir: 'across', number: 2, cells: [3, 4, 5] },
  { id: 1, answer: 'BAR', clue: 'Place serving drinks', dir: 'down', number: 1, cells: [1, 4, 7] },
], grid: [null, { letter: 'B' }, null, { letter: 'C' }, { letter: 'A' }, { letter: 'T' }, null, { letter: 'R' }, null] };
test('typing skips crossing letters already present and advances to the next incomplete clue', () => {
  const start = { ...initialState(puzzle), answers: { 4: 'A' } };
  const one = enterText(puzzle, start, 'c');
  assert.equal(one.selected, 5); assert.equal(one.answers[4], 'A');
  const two = enterText(puzzle, one, 't');
  assert.equal(two.entryId, 1); assert.equal(two.selected, 1);
  assert.deepEqual(two.answers, { 3: 'C', 4: 'A', 5: 'T' });
});
test('directly tapping a filled square overwrites it and activates the immediate next square', () => {
  const start = { ...initialState(puzzle), answers: { 3: 'X', 4: 'A' }, selected: 5 };
  const tapped = selectCell(puzzle, start, 3);
  assert.equal(tapped.overwrite, true);
  const written = enterText(puzzle, tapped, 'c');
  assert.equal(written.answers[3], 'C'); assert.equal(written.selected, 4);
  const resumed = enterText(puzzle, written, 't');
  assert.equal(resumed.answers[4], 'A'); assert.equal(resumed.answers[5], 'T');
});
test('the selected crossing toggles across/down and arrow navigation changes direction', () => {
  const s = { ...initialState(puzzle), selected: 4 };
  assert.equal(selectCell(puzzle, s, 4).entryId, 1);
  const down = moveCell(puzzle, s, 'ArrowDown');
  assert.equal(down.entryId, 1); assert.equal(down.selected, 7);
  assert.equal(moveCell(puzzle, down, 'ArrowDown').selected, 7);
});
test('backspace clears the selected letter, then moves backwards if it is empty', () => {
  const s = { ...initialState(puzzle), selected: 5, answers: { 3: 'C', 4: 'A', 5: 'T' } };
  const one = backspace(puzzle, s); assert.equal(one.answers[5], ''); assert.equal(one.selected, 5);
  const two = backspace(puzzle, one); assert.equal(two.selected, 4); assert.equal(two.answers[4], '');
  assert.equal(undoInput(two).answers[4], 'A');
});
test('multi-character entry uses the same skip rules and does not overwrite a completed grid', () => {
  const start = { ...initialState(puzzle), answers: { 4: 'A' } };
  const written = enterText(puzzle, start, 'ctbr');
  assert.deepEqual(written.answers, { 1: 'B', 3: 'C', 4: 'A', 5: 'T', 7: 'R' });
  assert.deepEqual(enterText(puzzle, written, 'Z').answers, written.answers);
  assert.deepEqual(undoInput(written).answers, start.answers);
});
test('revealing a word keeps its assisted status even when the revealed letters are undone', () => {
  const revealed = revealWord(puzzle, initialState(puzzle));
  assert.equal(revealed.assisted, true);
  const undone = undoInput(revealed); assert.equal(undone.assisted, true); assert.deepEqual(undone.answers, {});
});
test('clue navigation skips to an empty position and ignores punctuation input', () => {
  const s = { ...initialState(puzzle), answers: { 1: 'B', 4: 'A' } };
  assert.equal(nextEntry(puzzle, s).selected, 7);
  assert.deepEqual(enterText(puzzle, s, '123!?'), s);
});
