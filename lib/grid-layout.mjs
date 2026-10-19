import { gridQuality, acceptableGrid } from './grid-quality.mjs';

// Derive real horizontal/vertical runs; isolated cells are never entries.
export function extractSlots(mask, cols, rows = cols) {
  const slots = [];
  for (const dir of ['across', 'down']) for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const dr = dir === 'down' ? 1 : 0, dc = 1 - dr;
    if (!mask[r * cols + c] || (r - dr >= 0 && c - dc >= 0 && mask[(r - dr) * cols + c - dc])) continue;
    const cells = [];
    for (let y = r, x = c; y < rows && x < cols && mask[y * cols + x]; y += dr, x += dc) cells.push(y * cols + x);
    if (cells.length > 1) slots.push({ id: slots.length, dir, cells });
  }
  const owners = Array.from({ length: mask.length }, () => []);
  for (const slot of slots) slot.cells.forEach((cell, position) => owners[cell].push({ slot: slot.id, position }));
  for (const slot of slots) {
    slot.crossings = [];
    slot.cells.forEach((cell, position) => {
      for (const owner of owners[cell]) if (owner.slot !== slot.id) slot.crossings.push({ other: owner.slot, position, otherPosition: owner.position });
    });
  }
  return { slots, owners };
}

export function validLayout(mask, cols, rows = cols) {
  if (!acceptableGrid(gridQuality(mask.map(cell => cell ? {} : null), cols, rows))) return null;
  const layout = extractSlots(mask, cols, rows), { slots, owners } = layout;
  if (!slots.length || owners.some((o, i) => mask[i] && !o.length)) return null;
  for (const slot of slots) {
    if (slot.cells.length < 3 || slot.crossings.length < Math.ceil(slot.cells.length / 2)) return null;
    // No adjacent unchecked letters: stricter than the two-unch allowance
    // used by some British publications, to help mobile quick solvers.
    if (slot.cells.map(i => owners[i].length === 2 ? 'X' : '.').join('').includes('..')) return null;
  }
  const seen = new Set([0]), queue = [0];
  for (const id of queue) for (const { other } of slots[id].crossings) if (!seen.has(other)) { seen.add(other); queue.push(other); }
  return seen.size === slots.length ? layout : null;
}

export function createLayout(size, rng) {
  // Interleaved lanes give genuine cross-checks. Vary separators rather than
  // growing long, weakly connected arms from a single centre word.
  const patterns = size === 9 ? [[3], [5]] : size === 11 ? [[5], [5], [3], [7]] : [[5], [5], [7], [7], [3, 7], [5, 9]];
  const choose = () => patterns[Math.floor(rng() * patterns.length)];
  const across = Array.from({ length: (size + 1) / 2 }, choose);
  const down = Array.from({ length: (size + 1) / 2 }, choose);
  const mask = Array.from({ length: size * size }, (_, i) => {
    const r = Math.floor(i / size), c = i % size;
    return r % 2 === 0 ? !across[r / 2].includes(c) : c % 2 === 0 && !down[c / 2].includes(r);
  });
  let layout = validLayout(mask, size);
  if (!layout) return null;
  // Trimming eligible endpoints introduces even lengths (4/6), without
  // losing checking, creating short runs or splitting an answer in two.
  const order = mask.map((_, i) => ({ i, rank: rng() })).sort((a, b) => a.rank - b.rank);
  let trimmed = 0;
  for (const { i } of order) {
    if (trimmed >= Math.floor(size / 2)) break;
    if (!mask[i]) continue;
    mask[i] = false;
    const next = validLayout(mask, size);
    if (next && next.slots.length === layout.slots.length) { layout = next; trimmed++; }
    else mask[i] = true;
  }
  return { mask, ...layout };
}
