import { validateCluePolicy } from './clue-policy.mjs';
import { validateCrossingSafety } from './crossing-safety.mjs';
import { DIFFICULTY_VERSION, validateDifficulty } from './difficulty.mjs';
import { gridQuality, acceptableGrid, acceptableQuickGrid } from './grid-quality.mjs';
import { extractSlots } from './grid-layout.mjs';

export function checkingQuality(puzzle) {
  const owners = Array.from({ length: puzzle.grid.length }, () => new Set());
  for (const entry of puzzle.entries) for (const cell of entry.cells) owners[cell].add(entry.dir);
  const entries = puzzle.entries.map(entry => {
    let run = 0, longestUnchecked = 0, checked = 0;
    for (const cell of entry.cells) {
      if (owners[cell].size === 2) { checked++; run = 0; }
      else longestUnchecked = Math.max(longestUnchecked, ++run);
    }
    return { id: entry.id, checked, length: entry.cells.length, ratio: checked / entry.cells.length, longestUnchecked };
  });
  return { entries, minRatio: Math.min(...entries.map(entry => entry.ratio)), maxUnchecked: Math.max(...entries.map(entry => entry.longestUnchecked)) };
}

export function validatePuzzle(p) {
  if (!p || !Number.isInteger(p.cols) || !Number.isInteger(p.rows) || p.cols < 3 || p.rows < 3 || p.cols > 25 || p.rows > 25 || !Array.isArray(p.grid) || !Array.isArray(p.entries)) return ['Invalid puzzle shape'];
  const errors = [], { cols, rows, grid, entries } = p;
  if (p.version !== undefined && !['easy', 'medium', 'hard'].includes(p.mode)) return ['Invalid difficulty'];
  if (grid.length !== cols * rows) return ['Grid size'];
  if (!entries.length || entries.length > grid.length) return ['Invalid entry count'];
  if (grid.some(cell => cell !== null && (!cell || typeof cell !== 'object' || !/^[A-Z]$/.test(cell.letter)))) errors.push('Invalid grid letter');
  if (new Set(entries.map(entry => entry?.id)).size !== entries.length) errors.push('Repeated entry ID');
  if (new Set(entries.map(entry => entry?.answer)).size !== entries.length) errors.push('Repeated answer');
  for (const entry of entries) {
    if (!entry || !Number.isSafeInteger(entry.id) || entry.id < 0 || !/^[A-Z]{3,}$/.test(entry.answer) || typeof entry.clue !== 'string' || !entry.clue.trim() || !['across', 'down'].includes(entry.dir) || !Array.isArray(entry.cells) || entry.cells.length !== entry.answer.length || entry.cells.some(i => !Number.isInteger(i) || i < 0 || i >= grid.length)) { errors.push('Invalid entry'); continue; }
    if (entry.cells.map(i => grid[i]?.letter).join('') !== entry.answer) errors.push('Invalid entry');
    const step = entry.dir === 'across' ? 1 : cols;
    if (entry.cells.some((cell, i) => i && (cell - entry.cells[i - 1] !== step || (entry.dir === 'across' && Math.floor(cell / cols) !== Math.floor(entry.cells[0] / cols))))) errors.push('Invalid entry path');
  }
  if (errors.length) return [...new Set(errors)];
  const layout = extractSlots(grid.map(Boolean), cols, rows);
  for (const slot of layout.slots) if (!entries.some(entry => entry.dir === slot.dir && entry.cells.join(',') === slot.cells.join(','))) errors.push('Unclued run');
  const occupied = Array.from({ length: grid.length }, () => new Set());
  for (const entry of entries) for (const cell of entry.cells) {
    if (occupied[cell].has(entry.dir)) errors.push('Overlapping parallel entries');
    occupied[cell].add(entry.dir);
  }
  if (grid.some((cell, i) => cell && !occupied[i].size)) errors.push('Uncovered cell');
  for (const entry of entries) if (!entry.cells.some(cell => occupied[cell].size === 2)) errors.push('Uncrossed entry');
  const seen = new Set([entries[0].id]), queue = [entries[0]];
  for (const entry of queue) for (const other of entries) if (!seen.has(other.id) && entry.cells.some(cell => other.cells.includes(cell))) { seen.add(other.id); queue.push(other); }
  if (seen.size !== entries.length) errors.push('Disconnected grid');
  if (p.constructionVersion >= 2 && !acceptableGrid(gridQuality(grid, cols, rows))) errors.push('Excessive black cells or solid black clumps');
  if (p.constructionVersion >= 4 && !acceptableQuickGrid(grid, cols, rows, p.mode, p.constructionVersion)) errors.push('Invalid symmetric quick-grid geometry');
  if (p.constructionVersion >= 3) {
    const starts = [...new Set(entries.map(entry => entry.cells[0]))].sort((a, b) => a - b);
    const numbers = new Map(starts.map((cell, i) => [cell, i + 1]));
    if (entries.some(entry => entry.number !== numbers.get(entry.cells[0])) || grid.some((cell, i) => cell && cell.number !== (numbers.get(i) || null))) errors.push('Invalid clue numbering');
    if (checkingQuality(p).entries.some(entry => entry.checked < Math.ceil(entry.length / 2) || entry.longestUnchecked > 1)) errors.push('Insufficient answer checking');
  }
  if (p.difficultyVersion !== undefined) {
    if(![1,DIFFICULTY_VERSION].includes(p.difficultyVersion))errors.push('Unsupported difficulty version');
    else errors.push(...validateDifficulty(p));
  }
  if (p.cluePolicyVersion !== undefined) errors.push(...validateCluePolicy(p));
  if (p.fairnessVersion !== undefined) errors.push(...validateCrossingSafety(p));
  return [...new Set(errors)];
}
