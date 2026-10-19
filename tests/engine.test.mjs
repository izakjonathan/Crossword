import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePuzzle, rememberAnswers, validatePuzzle, MODES, RECENT_LIMIT } from '../lib/engine.mjs';
import { acceptableGrid, gridQuality } from '../lib/grid-quality.mjs';
import { WORDS } from '../lib/words.mjs';

test('clue bank uses unique ordinary answer forms, complete literal clues and no answer leakage', () => {
  assert.ok(WORDS.length > 1200);
  assert.equal(new Set(WORDS.map(w => w.answer)).size, WORDS.length);
  for (const word of WORDS) {
    assert.match(word.answer, /^[A-Z]{3,}$/);
    for (const clue of [word.easy, word.hard]) {
      assert.ok(clue && clue.length >= 3, word.answer);
      assert.ok(!new RegExp(`\\b${word.answer}\\b`, 'i').test(clue), `${word.answer} appears in its own clue`);
    }
  }
});
test('randomized square puzzles have square-cell coordinates, proper numbering, crossings and connected clued runs', () => {
  for (let i = 0; i < 24; i++) for (const mode of Object.keys(MODES)) {
    const p = generatePuzzle({ mode, seed: `invariant-${i}` });
    assert.deepEqual(validatePuzzle(p), []);
    assert.equal(p.constructionVersion, 3);
    assert.ok(acceptableGrid(gridQuality(p.grid,p.cols,p.rows)));
    assert.equal(p.rows, p.cols);
    assert.ok(p.entries.length >= MODES[mode].target - 5);
    const starts = [...new Set(p.entries.map(e => e.cells[0]))].sort((a, b) => a - b);
    for (const e of p.entries) {
      const source = WORDS.find(w => w.answer === e.answer);
      assert.ok(source, `Unknown answer ${e.answer}`);
      assert.equal(e.vocabularyLevel, source.vocabularyLevel);
      assert.ok(source.clues.some(clue=>clue.text===e.clue && clue.level===e.clueLevel));
      if(mode==='easy')assert.equal(e.clueLevel,1);
      assert.equal(p.grid[e.cells[0]].number, e.number);
      assert.equal(e.number, starts.indexOf(e.cells[0]) + 1);
      for (let n = 1; n < e.cells.length; n++) assert.equal(e.cells[n] - e.cells[n - 1], e.dir === 'across' ? 1 : p.cols);
      if (e.dir === 'across') assert.equal(Math.floor(e.cells[0] / p.cols), Math.floor(e.cells.at(-1) / p.cols));
    }
  }
});
test('new seeds change the puzzle while identical inputs are reproducible', () => {
  const input = { mode: 'medium', seed: 'reproducible', recent: [] };
  assert.deepEqual(generatePuzzle(input), generatePuzzle(input));
  assert.notDeepEqual(generatePuzzle(input).grid, generatePuzzle({ ...input, seed: 'another' }).grid);
});
test('successive dense grids honour exclusions and never relax them on exhaustion', () => {
  let recent = [];
  for (let i = 0; i < 12; i++) {
    const mode = ['easy', 'medium', 'hard'][i % 3], p = generatePuzzle({ mode, seed: `sequence-${i}`, recent });
    for (const e of p.entries) assert.ok(!recent.includes(e.answer), `${e.answer} recurred in puzzle ${i}`);
    recent = rememberAnswers(recent, p);
    assert.ok(recent.length <= RECENT_LIMIT);
    assert.equal(new Set(recent).size, recent.length);
  }
  // More than 500 exclusions must remain hard exclusions. The old truncated
  // implementation could generate a grid from the first part of this list.
  assert.throws(() => generatePuzzle({mode:'easy',seed:'all-excluded',recent:WORDS.map(w=>w.answer)}), /Not enough unused/);
});
test('invalid generator requests and damaged grids are rejected', () => {
  assert.throws(() => generatePuzzle({ mode: 'unknown', seed: 'x' }));
  assert.throws(() => generatePuzzle({ mode: 'easy', seed: '' }));
  const p = generatePuzzle({ mode: 'easy', seed: 'damage' });
  const copy = structuredClone(p); copy.grid[copy.entries[0].cells[0]].letter = '!';
  assert.ok(validatePuzzle(copy).length > 0);
});

test('density checks allow adjacent blocks but reject sparse grids and large solid clumps', () => {
 const adjacent = Array.from({length:25},(_,i)=>i===0||i===1?null:{letter:'A'});
 assert.ok(acceptableGrid(gridQuality(adjacent,5,5)));
 const sparse = Array.from({length:25},(_,i)=>i<12?null:{letter:'A'});
 assert.ok(!acceptableGrid(gridQuality(sparse,5,5)));
 const clump = Array.from({length:25},(_,i)=>Math.floor(i/5)<3&&i%5<3?null:{letter:'A'});
 assert.ok(!acceptableGrid(gridQuality(clump,5,5)));
});

test('old sparse saves remain valid while new construction rejects the same sparse shape', () => {
  const grid=Array(25).fill(null);
  for(const [i,letter]of [[7,'B'],[11,'C'],[12,'A'],[13,'T'],[17,'R']])grid[i]={letter};
  const p={cols:5,rows:5,grid,entries:[{id:0,answer:'CAT',clue:'Feline',dir:'across',cells:[11,12,13]},{id:1,answer:'BAR',clue:'Counter',dir:'down',cells:[7,12,17]}]};
  assert.deepEqual(validatePuzzle(p),[]);
  assert.ok(validatePuzzle({...p,constructionVersion:2}).includes('Excessive black cells or solid black clumps'));
});
