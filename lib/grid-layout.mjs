import { gridQuality, acceptableGrid, acceptableQuickGrid } from './grid-quality.mjs';

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

export function createLayout(size, rng, longer = false) {
  if (![9, 11, 13].includes(size)) return null;
  const mode = size === 9 ? 'easy' : size === 11 ? 'medium' : 'hard';
  const maxLength = size === 9 ? 7 : size === 11 ? 9 : 11;
  const patterns = size === 9 ? [[3], [5]] : size === 11 ? [[3], [5], [7]] : [[3], [5], [7], [9], [3, 7], [5, 9]];
  // Pair separators before filling: every edit has a 180-degree counterpart.
  const lanes = () => {
    const result = Array((size + 1) / 2);
    for (let i = 0; i < result.length / 2; i++) {
      const mirror = result.length - 1 - i;
      if (i === mirror) { result[i] = [Math.floor(size / 2)]; continue; }
      result[i] = patterns[Math.floor(rng() * patterns.length)];
      result[mirror] = result[i].map(position => size - 1 - position).sort((a, b) => a - b);
    }
    return result;
  };
  const across = lanes(), down = lanes();
  if (size % 4 === 1) {
    const mid = (size - 1) / 4;
    down[mid] = [Math.floor(size / 2) - 1, Math.floor(size / 2) + 1];
  }
  // Anchor opposite long slots before segmenting and trimming the rest.
  const fromRight = rng() < .5;
  if (longer) { across[0] = []; across[across.length - 1] = []; }
  const mask = Array.from({ length: size * size }, (_, i) => {
    const row = Math.floor(i / size), col = i % size;
    if (longer && ((row === 0 && (fromRight ? col >= size - 2 : col < 2)) ||
      (row === size - 1 && (fromRight ? col < 2 : col >= size - 2)))) return false;
    return row % 2 === 0 ? !across[row / 2].includes(col) : col % 2 === 0 && !down[col / 2].includes(row);
  });
  let layout = validLayout(mask, size);
  if (!layout) return null;
  // Paired endpoint trims introduce even lengths without splitting words.
  const trims = mask.map((_, i) => ({ i, rank: rng() })).filter(({ i }) => i < mask.length - 1 - i).sort((a, b) => a.rank - b.rank);
  let removed = 0;
  for (const { i } of trims) {
    const opposite = mask.length - 1 - i;
    if (!mask[i] || !mask[opposite] || removed >= 4) continue;
    mask[i] = mask[opposite] = false;
    const next = validLayout(mask, size);
    if (next && next.slots.length === layout.slots.length) { layout = next; removed += 2; }
    else mask[i] = mask[opposite] = true;
  }
  // Add crossings in mirrored pairs where they keep all extracted runs legal.
  // Moderate density keeps the existing curated-bank fill search reliable.
  const targetFields = { easy: 58, medium: 82, hard: 110 }[mode] - (rng() < .35 ? 2 : 0);
  const order = mask.map((_, i) => ({ i, rank: rng() })).filter(({ i }) => i <= mask.length - 1 - i).sort((a, b) => a.rank - b.rank);
  for (const { i } of order) {
    const opposite = mask.length - 1 - i;
    if (mask[i] || mask[opposite] || mask.filter(Boolean).length + (i === opposite ? 1 : 2) > targetFields) continue;
    mask[i] = mask[opposite] = true;
    const next = validLayout(mask, size);
    if (next && next.slots.every(slot => slot.cells.length <= maxLength)) layout = next;
    else mask[i] = mask[opposite] = false;
  }
  if (!acceptableQuickGrid(mask, size, size, mode) || layout.slots.some(slot => slot.cells.length > maxLength)) return null;
  // Transposing preserves geometry while varying long-answer direction and
  // slot order, giving the bounded fill search more distinct arrangements.
  if (rng() < .5) {
    const transposed = mask.map((_, i) => mask[(i % size) * size + Math.floor(i / size)]);
    return { mask: transposed, ...validLayout(transposed, size) };
  }
  return { mask, ...layout };
}
