import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generatePuzzle } from '../lib/engine.mjs';
import { validatePuzzle } from '../lib/validate.mjs';
import { acceptableQuickGrid } from '../lib/grid-quality.mjs';

const legacy = JSON.parse(readFileSync(new URL('./fixtures/v2.11.0-saved-puzzles.json', import.meta.url)));
test('genuine pre-symmetry saves retain their original validation rules', () => {
  for (const puzzle of legacy) {
    assert.equal(puzzle.constructionVersion, 3);
    assert.deepEqual(validatePuzzle(puzzle), []);
    assert.ok(validatePuzzle({ ...puzzle, constructionVersion: 4 }).includes('Invalid symmetric quick-grid geometry'));
  }
});
test('new puzzles independently satisfy symmetry, density, clump limits and white-cell connectivity', () => {
  for (const mode of ['easy', 'medium', 'hard']) {
    const p = generatePuzzle({ mode, seed: 'geometry-independent' });
    const white = p.grid.flatMap((cell, i) => cell ? [i] : []);
    const maxRatio = { easy: .31, medium: .34, hard: .37 }[mode];
    assert.ok(1 - white.length / p.grid.length <= maxRatio);
    for (let i = 0; i < p.grid.length; i++) assert.equal(p.grid[i] === null, p.grid[p.grid.length - 1 - i] === null);
    let patches = 0;
    for (let r = 0; r < p.rows - 1; r++) for (let c = 0; c < p.cols - 1; c++) {
      const i = r * p.cols + c;
      if ([i, i + 1, i + p.cols, i + p.cols + 1].every(j => p.grid[j] === null)) patches++;
    }
    assert.equal(patches, 0);
    const seen = new Set([white[0]]), queue = [white[0]];
    for (const i of queue) for (const j of [i - p.cols, i + p.cols, ...(i % p.cols ? [i - 1] : []), ...(i % p.cols < p.cols - 1 ? [i + 1] : [])]) {
      if (p.grid[j] && !seen.has(j)) { seen.add(j); queue.push(j); }
    }
    assert.equal(seen.size, white.length);
  }
});
test('quick geometry rejects one-sided edits, excessive blocks and solid clumps', () => {
  const grid = Array(81).fill(true);
  assert.ok(acceptableQuickGrid(grid, 9, 9, 'easy'));
  const asymmetric = grid.slice(); asymmetric[0] = false;
  assert.ok(!acceptableQuickGrid(asymmetric, 9, 9, 'easy'));
  const clumped = grid.map((cell, i) => i < 18 || i >= 63 ? false : cell);
  assert.ok(!acceptableQuickGrid(clumped, 9, 9, 'easy'));
  assert.ok(!acceptableQuickGrid(grid, 9, 9, 'unknown'));
});
