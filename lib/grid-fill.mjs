import { DIFFICULTY_PROFILES } from './difficulty.mjs';
import { createDictionaryIndex } from './dictionary-index.mjs';
import { createConstraintPropagator } from './constraint-propagation.mjs';

// Seeded MAC search: propagate every binary constraint before branching and
// after each tentative assignment; child arrays preserve parent domains.
export function fillLayout(layout, bank, rng, budget = 3000, mode = null, accept = () => true, deadline = Infinity) {
  const { slots } = layout;
  const ranks = new Map(bank.map(word => [word.answer, rng()]));
  const assigned = Array(slots.length).fill(null);
  const profile = DIFFICULTY_PROFILES[mode], count = slots.length;
  const features = word => [word.vocabularyLevel, Number(word.vocabularyLevel >= 2), Number(word.vocabularyLevel === 3), Number(word.clues?.some(c => mode === 'medium' ? c.level === 2 : c.level >= 2)), Number(word.clues?.some(c => c.level === 3))];
  const vectors = profile ? new Map(bank.map(word => [word, features(word)])) : null;
  const minimum = profile ? [Math.ceil(profile.minMeanVocabulary*count-1e-9),Math.ceil(profile.minBroader*count),Math.ceil(profile.minAdvanced*count),Math.ceil(profile.minChallengingClues*count),Math.ceil(profile.minHardClues*count)] : [];
  const maximum = profile ? [Math.floor(profile.maxMeanVocabulary*count+1e-9),count,Math.floor(profile.maxAdvanced*count),count,count] : [];
  const domains = createDictionaryIndex(bank), boundCache = new WeakMap();
  const constraints = createConstraintPropagator(slots, domains, !!profile);
  function bounds(domain) {
    if (boundCache.has(domain)) return boundCache.get(domain);
    const lo = [Infinity,Infinity,Infinity,Infinity,Infinity], hi = [0,0,0,0,0];
    for (const word of domain) {
      const vector = vectors.get(word);
      for (let j = 0; j < 5; j++) { lo[j] = Math.min(lo[j],vector[j]); hi[j] = Math.max(hi[j],vector[j]); }
    }
    const value = { lo, hi };
    boundCache.set(domain, value);
    return value;
  }
  function feasible(current) {
    if (!profile) return true;
    const low = [0,0,0,0,0], high = [0,0,0,0,0];
    for (let i = 0; i < count; i++) {
      if (!assigned[i] && !current[i].length) return false;
      const vector = assigned[i] && vectors.get(assigned[i]);
      const { lo, hi } = vector ? { lo:vector, hi:vector } : bounds(current[i]);
      for (let j = 0; j < 5; j++) { low[j] += lo[j]; high[j] += hi[j]; }
    }
    return low.every((value,j) => value <= maximum[j] && high[j] >= minimum[j]);
  }
  // Keep minimum-domain and crossing-degree priorities. Only break a true
  // constraint tie toward the centre, where fill can support more of the grid.
  const size = Math.sqrt(layout.mask?.length || 0), middle = (size - 1) / 2;
  const distance = slots.map(slot => Number.isInteger(size) && size > 0 ?
    Math.abs(slot.cells.reduce((sum, cell) => sum + Math.floor(cell / size), 0) / slot.cells.length - middle) +
    Math.abs(slot.cells.reduce((sum, cell) => sum + cell % size, 0) / slot.cells.length - middle) : 0);
  let nodes = 0;
  function visit(current, remaining) {
    if (Date.now()>=deadline || !feasible(current)) return null;
    if (!remaining) return accept(assigned) ? assigned.slice() : null;
    if (++nodes > budget) return null;
    const degrees = slots.map(slot => slot.crossings.filter(crossing => !assigned[crossing.other]).length);
    let chosen = -1;
    for (let i = 0; i < count; i++) {
      if (assigned[i]) continue;
      if (chosen < 0) { chosen = i; continue; }
      const domainDelta = current[i].length - current[chosen].length;
      const degreeDelta = degrees[i] - degrees[chosen];
      if (domainDelta < 0 || (domainDelta === 0 && (degreeDelta > 0 ||
        (degreeDelta === 0 && distance[i] < distance[chosen])))) chosen = i;
    }
    if (!current[chosen].length) return null;
    const totals = [0,0,0,0,0];
    if (profile) for (const value of assigned.filter(Boolean)) vectors.get(value).forEach((v,j) => { totals[j] += v; });
    const preference = word => vectors.get(word).reduce((score,value,j) => score + (totals[j] < minimum[j] ? value * (j >= 3 ? 3 : 1) : 0), 0);
    // Prefer values retaining support across neighbours, while keeping the
    // authored difficulty targets and seeded variety in the ranking.
    const choices = current[chosen].map(word => ({
      word, eliminated:constraints.eliminated(word, current, chosen, assigned),
      score:ranks.get(word.answer) * 4 + (profile ? preference(word) : 0)
    })).sort((a,b) => (b.score - Math.log1p(b.eliminated)) - (a.score - Math.log1p(a.eliminated)) || a.eliminated - b.eliminated);
    for (const { word } of choices) {
      assigned[chosen] = word;
      const next = current.slice();
      next[chosen] = [word];
      if (feasible(next) && constraints.propagate(next, [chosen])) { const result = visit(next, remaining-1); if (result) return result; }
      assigned[chosen] = null;
      if (nodes > budget) break;
    }
    return null;
  }
  const initial = slots.map(slot => domains.forLength(slot.cells.length));
  const words = feasible(initial) && constraints.propagate(initial) ? visit(initial, count) : null;
  return { words, nodes, propagation: { ...constraints.stats } };
}
