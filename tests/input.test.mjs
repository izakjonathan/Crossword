import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, enterText, selectCell, backspace, undoInput, moveCell, nextEntry, revealWord } from '../lib/input.mjs';
const puzzle = { cols: 3, rows: 3, entries: [
  { id: 0, answer: 'CAT', clue: 'Domestic feline', dir: 'across', number: 2, cells: [3, 4, 5] },
  { id: 1, answer: 'BAR', clue: 'Place serving drinks', dir: 'down', number: 1, cells: [1, 4, 7] },
], grid: [null, { letter: 'B' }, null, { letter: 'C' }, { letter: 'A' }, { letter: 'T' }, null, { letter: 'R' }, null] };
test('typing advances one square at a time and does not skip a filled crossing', () => {
  const start = {...initialState(puzzle),answers:{4:'A'}};
  const one = enterText(puzzle,start,'c');
  assert.equal(one.selected,4);assert.equal(one.answers[4],'A');
  const two = enterText(puzzle,one,'o');
  assert.equal(two.selected,5);assert.equal(two.answers[4],'O');
  assert.equal(enterText(puzzle,two,'t').answers[5],'T');
});
test('tapping a filled square overwrites it and the next key overwrites the next square', () => {
  const start = {...initialState(puzzle),answers:{3:'X',4:'A'},selected:5};
  const written = enterText(puzzle,selectCell(puzzle,start,3),'c');
  assert.equal(written.answers[3],'C');assert.equal(written.selected,4);
  const next = enterText(puzzle,written,'o');assert.equal(next.answers[4],'O');assert.equal(next.selected,5);
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
test('multi-character entry replaces filled squares in order and remains undoable', () => {
  const start = {...initialState(puzzle),answers:{4:'A'}};
  const written = enterText(puzzle,start,'cot');
  assert.deepEqual(written.answers,{3:'C',4:'O',5:'T'});
  assert.deepEqual(undoInput(written).answers,start.answers);
  assert.equal(enterText(puzzle,written,'Z').answers[5],'Z');
});
test('revealing a word keeps its assisted status even when the revealed letters are undone', () => {
  const revealed = revealWord(puzzle, initialState(puzzle));
  assert.equal(revealed.assisted, true);
  const undone = undoInput(revealed); assert.equal(undone.assisted, true); assert.deepEqual(undone.answers, {});
});
test('clue navigation starts at the first square and ignores punctuation input', () => {
  const s = { ...initialState(puzzle), answers: { 1: 'B', 4: 'A' } };
  assert.equal(nextEntry(puzzle, s).selected, 1);
  assert.deepEqual(enterText(puzzle, s, '123!?'), s);
});

test('letter hints keep assisted status after undo, while clearing a word is reversible', async () => {
  const { revealLetter, clearWord } = await import('../lib/input.mjs');
  const puzzle = { entries:[{id:0,cells:[0,1,2]}],grid:[{letter:'C'},{letter:'A'},{letter:'T'}] };
  const state = {answers:{0:'X',1:'A',2:'T'},entryId:0,selected:0,overwrite:true,undo:[],assisted:false};
  const hinted = revealLetter(puzzle,state);
  assert.equal(hinted.answers[0],'C'); assert.equal(undoInput(hinted).assisted,true);
  const cleared = clearWord(puzzle,state);
  assert.deepEqual(cleared.answers,{});assert.equal(cleared.selected,0);
  assert.deepEqual(undoInput(cleared).answers,state.answers);assert.equal(cleared.assisted,false);
});
