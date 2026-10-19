import { gridQuality, acceptableGrid } from './grid-quality.mjs';
export function validatePuzzle(p) {
  const errors = [], { cols, rows, grid, entries } = p;
  if (grid.length !== cols * rows) errors.push('Grid size');
  if (new Set(entries.map(e => e.answer)).size !== entries.length) errors.push('Repeated answer');
  for (const e of entries) {
    if (e.answer.length < 3 || !e.clue || e.cells.map(i => grid[i]?.letter).join('') !== e.answer) errors.push('Invalid entry');
    if (!entries.some(other => other.id !== e.id && other.cells.some(i => e.cells.includes(i)))) errors.push('Uncrossed entry');
  }
  for (const dir of ['across', 'down']) for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c, dr = dir === 'down' ? 1 : 0, dc = 1 - dr;
    if (!grid[i] || (r - dr >= 0 && c - dc >= 0 && grid[(r - dr) * cols + c - dc])) continue;
    const run = [];
    for (let k = 0; r + dr * k < rows && c + dc * k < cols; k++) { const j = (r + dr * k) * cols + c + dc * k; if (!grid[j]) break; run.push(j); }
    if (run.length > 1 && !entries.some(e => e.dir === dir && e.cells.join(',') === run.join(','))) errors.push('Unclued run');
  }
  const visited = new Set(entries[0] ? [entries[0].id] : []);
  let grew = true;
  while (grew) { grew = false; for (const e of entries) if (!visited.has(e.id) && entries.some(o => visited.has(o.id) && o.cells.some(i => e.cells.includes(i)))) { visited.add(e.id); grew = true; } }
  if (visited.size !== entries.length) errors.push('Disconnected grid');
  if (grid.some((cell, i) => cell && !entries.some(e => e.cells.includes(i)))) errors.push('Uncovered cell');
  if (p.constructionVersion === 2 && !acceptableGrid(gridQuality(grid, cols, rows))) errors.push('Excessive black cells or solid black clumps');
  return errors;
}
