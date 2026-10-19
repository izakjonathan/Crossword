import { DIFFICULTY_PROFILES } from './difficulty.mjs';

// Allocate reviewed variants jointly. A greedy choice can leave the hardest
// clue supported only by other hardest-tier clues, even in a well-checked grid.
// Fixed subset-search budget keeps generation reproducible and bounded.
export function selectClues(words, mode, slots, rng, budget = 4096) {
  const profile = DIFFICULTY_PROFILES[mode], count = words.length;
  const direct = words.map(word => word.clues.find(c => c.level === 1));
  const mixed = words.map(word => word.clues.find(c => c.level === 2));
  const hard = words.map(word => mode === 'hard' && word.clues.find(c => c.level === 3));
  if (direct.some(clue => !clue)) return null;
  const order = words.map((_, i) => ({ i, rank:rng() })).sort((a,b) => a.rank-b.rank).map(item => item.i);
  const candidates = order.filter(i => hard[i]);
  const minChallenging = Math.ceil(profile.minChallengingClues * count);
  const minHard = Math.max(Math.ceil(profile.minHardClues * count), minChallenging - mixed.filter(Boolean).length);
  const selectedHard = new Set();
  const neighbours = slots.map(slot => [...new Set(slot.crossings.map(c => c.other))]);
  let nodes = 0;

  function supported() {
    return [...selectedHard].every(i => neighbours[i].some(j => !selectedHard.has(j)));
  }
  function complete() {
    const selected = direct.slice();
    for (const i of selectedHard) selected[i] = hard[i];
    let challenging = selectedHard.size;
    for (const i of order) if (!selectedHard.has(i) && mixed[i] && challenging < minChallenging) {
      selected[i] = mixed[i]; challenging++;
    }
    const mean = selected.reduce((sum,c) => sum+c.level,0)/count;
    return challenging >= minChallenging && mean >= profile.minMeanClue-1e-9 && mean <= profile.maxMeanClue+1e-9 ? selected : null;
  }
  function choose(position, needed) {
    if (++nodes > budget || candidates.length-position < needed || !supported()) return null;
    if (!needed) return complete();
    const i = candidates[position];
    selectedHard.add(i);
    const included = choose(position+1, needed-1);
    selectedHard.delete(i);
    return included || choose(position+1, needed);
  }
  for (let target = minHard; target <= Math.min(candidates.length,minChallenging); target++) {
    const result = choose(0,target);
    if (result) return result;
    if (nodes > budget) break;
  }
  return null;
}
