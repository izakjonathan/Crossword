import { ENGINE_VERSION, RECENT_LIMIT, MODES } from './config.mjs';
import { validatePuzzle } from './validate.mjs';
export { ENGINE_VERSION, RECENT_LIMIT, MODES, rememberAnswers } from './config.mjs';
export { validatePuzzle } from './validate.mjs';
import { WORDS } from './words.mjs';
import { gridQuality, acceptableGrid } from './grid-quality.mjs';

export function random(seed) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function generatePuzzle({ mode = 'medium', seed, recent = [] }) {
  if (!MODES[mode] || typeof seed !== 'string' || !seed.length || seed.length > 120) throw new Error('Invalid puzzle request.');
  const { cols, rows, target, maxLength } = MODES[mode];
  const rng = random(`${ENGINE_VERSION}:${seed}:${mode}`);
  const blocked = new Set(recent);
  const eligible = WORDS.filter(w => !blocked.has(w.answer) && w.answer.length <= maxLength);
  if (eligible.length < target + 15) throw new Error('Not enough unused words. Your current puzzle has been kept.');
  let best;
  for (let attempt = 0; attempt < 200; attempt++) {
    const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
    const entries = [], used = new Set(), positions = new Map();
    const words = eligible.map(w => ({ ...w, rank: rng(), priority: w.answer.length + rng() * 4 })).sort((a, b) => b.priority - a.priority);
    const at = (r, c) => grid[r]?.[c] ?? null;
    function fit(word, row, col, dir) {
      const dr = dir === 'down' ? 1 : 0, dc = 1 - dr;
      if (row < 0 || col < 0 || row + dr * (word.length - 1) >= rows || col + dc * (word.length - 1) >= cols || at(row - dr, col - dc) || at(row + dr * word.length, col + dc * word.length)) return -1;
      let crosses = 0;
      for (let k = 0; k < word.length; k++) {
        const r = row + dr * k, c = col + dc * k, cell = at(r, c);
        if (cell) { if (cell.letter !== word[k] || cell[dir]) return -1; crosses++; }
        else if (at(r - dc, c - dr) || at(r + dc, c + dr)) return -1;
      }
      return crosses;
    }
    function place(w, row, col, dir) {
      const id = entries.length;
      entries.push({ ...w, row, col, dir, id }); used.add(w.answer);
      for (let k = 0; k < w.answer.length; k++) {
        const r = row + (dir === 'down' ? k : 0), c = col + (dir === 'across' ? k : 0);
        if (!grid[r][c]) {
          grid[r][c] = { letter: w.answer[k] };
          if (!positions.has(w.answer[k])) positions.set(w.answer[k], []);
          positions.get(w.answer[k]).push([r, c]);
        }
        grid[r][c][dir] = id + 1;
      }
    }
    const first = words.find(w => w.answer.length >= 5 && w.answer.length <= cols - 2) || words[0];
    place(first, Math.floor(rows / 2), Math.floor((cols - first.answer.length) / 2), 'across');
    for (let pass = 0; pass < 4 && entries.length < target + 12; pass++) {
      for (const w of words) {
        if (entries.length >= target + 12) break;
        if (used.has(w.answer)) continue;
        let choice;
        for (let k = 0; k < w.answer.length; k++) {
          for (const [r, c] of positions.get(w.answer[k]) || []) {
            for (const dir of ['across', 'down']) {
              const row = r - (dir === 'down' ? k : 0), col = c - (dir === 'across' ? k : 0);
              const crosses = fit(w.answer, row, col, dir);
              if (crosses < 1) continue;
              const distance = Math.abs(row + (dir === 'down' ? w.answer.length / 2 : 0) - rows / 2) + Math.abs(col + (dir === 'across' ? w.answer.length / 2 : 0) - cols / 2);
              const score = crosses * 4 + (w.answer.length - crosses) * 8 - distance * .05 + rng() * .5;
              if (!choice || score > choice.score) choice = { row, col, dir, score };
            }
          }
        }
        if (choice) place(w, choice.row, choice.col, choice.dir);
      }
    }
    const cells = grid.flat().filter(Boolean);
    const crossingCount = cells.filter(c => c.across && c.down).length;
    const quality = gridQuality(grid.flat(),cols,rows);
    const score = cells.length * 15 + crossingCount * 2 + entries.length - quality.solidBlackSquares * 20;
    if (entries.length < target - 5 || !acceptableGrid(quality)) continue;
    if (!best || score > best.score) best = { grid, entries, score, crossingCount };
    if (quality.blackRatio <= .35 && quality.solidBlackSquares === 0 && attempt >= 12) break;
    if (best && attempt >= 119) break;
  }
  if (!best || best.entries.length < target - 5) throw new Error('Could not build a good connected grid. Tap + to try again.');
  const starts = new Map();
  best.entries.sort((a, b) => a.row - b.row || a.col - b.col || a.dir.localeCompare(b.dir));
  let number = 0;
  const entries = best.entries.map(e => {
    const start = e.row * cols + e.col;
    if (!starts.has(start)) starts.set(start, ++number);
    return { id: e.id, answer: e.answer, clue: mode === 'hard' ? e.hard : mode === 'medium' && e.rank > .5 ? e.hard : e.easy, number: starts.get(start), dir: e.dir,
      cells: Array.from({ length: e.answer.length }, (_, i) => (e.row + (e.dir === 'down' ? i : 0)) * cols + e.col + (e.dir === 'across' ? i : 0)) };
  });
  const result = { constructionVersion:2, version: ENGINE_VERSION, id: `v${ENGINE_VERSION}:${mode}:${seed}`, mode, cols, rows, entries,
    grid: best.grid.flat().map((cell, i) => cell ? { letter: cell.letter, number: starts.get(i) || null } : null) };
  const errors = validatePuzzle(result);
  if (errors.length) throw new Error('Puzzle validation failed. Please generate another grid.');
  return result;
}
