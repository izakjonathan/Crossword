import { DIFFICULTY_PROFILES } from './difficulty.mjs';

// Domain arrays retain bank order. Reusing an unchanged domain is important:
// its letter groups, membership and editorial bounds can all be reused too.
// Everything is local to one layout fill, never shared between games/history.
function domainCache() {
  const cache = new WeakMap();
  function info(domain) {
    let value = cache.get(domain);
    if (!value) {
      value = { answers: null, positions: new Map(), bounds: null };
      cache.set(domain, value);
    }
    return value;
  }
  function letters(domain, position) {
    const value = info(domain);
    if (!value.positions.has(position)) {
      const all = new Map(), nonspecialist = new Map();
      for (const word of domain) {
        const letter = word.answer[position];
        if (!all.has(letter)) all.set(letter, []);
        all.get(letter).push(word);
        if (word.vocabularyLevel !== 3) {
          if (!nonspecialist.has(letter)) nonspecialist.set(letter, []);
          nonspecialist.get(letter).push(word);
        }
      }
      value.positions.set(position, { all, nonspecialist });
    }
    return value.positions.get(position);
  }
  function without(domain, answer) {
    const value = info(domain);
    value.answers ||= new Set(domain.map(word => word.answer));
    return value.answers.has(answer) ? domain.filter(word => word.answer !== answer) : domain;
  }
  return { info, letters, without };
}

// Seeded MRV/degree search with forward checking and all-different answers.
// Caches change the cost of a branch, never its order or the random stream.
export function fillLayout(layout, bank, rng, budget = 3000, mode = null, accept = () => true) {
  const { slots } = layout, byLength = Object.groupBy(bank, word => word.answer.length);
  const ranks = new Map(bank.map(word => [word.answer, rng()]));
  const assigned = Array(slots.length).fill(null);
  const profile = DIFFICULTY_PROFILES[mode], count = slots.length;
  const features = word => [word.vocabularyLevel, Number(word.vocabularyLevel >= 2), Number(word.vocabularyLevel === 3), Number(word.clues?.some(c => mode === 'medium' ? c.level === 2 : c.level >= 2)), Number(word.clues?.some(c => c.level === 3))];
  const vectors = profile ? new Map(bank.map(word => [word, features(word)])) : null;
  const minimum = profile ? [Math.ceil(profile.minMeanVocabulary*count-1e-9),Math.ceil(profile.minBroader*count),Math.ceil(profile.minAdvanced*count),Math.ceil(profile.minChallengingClues*count),Math.ceil(profile.minHardClues*count)] : [];
  const maximum = profile ? [Math.floor(profile.maxMeanVocabulary*count+1e-9),count,Math.floor(profile.maxAdvanced*count),count,count] : [];
  const domains = domainCache(), empty = [];
  const related = slots.map(slot => {
    const crossings = new Map();
    for (const crossing of slot.crossings) if (!crossings.has(crossing.other)) crossings.set(crossing.other, crossing);
    // Keep stable ascending propagation order, including the first
    // empty-domain failure, independently of the slot-selection tie-break.
    return slots.flatMap((other, i) => crossings.has(i) || other.cells.length === slot.cells.length ? [{ i, crossing: crossings.get(i) }] : []);
  });
  function bounds(domain) {
    const value = domains.info(domain);
    if (value.bounds) return value.bounds;
    const lo = [Infinity,Infinity,Infinity,Infinity,Infinity], hi = [0,0,0,0,0];
    for (const word of domain) {
      const vector = vectors.get(word);
      for (let j = 0; j < 5; j++) { lo[j] = Math.min(lo[j],vector[j]); hi[j] = Math.max(hi[j],vector[j]); }
    }
    return value.bounds = { lo, hi };
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
    if (!feasible(current)) return null;
    if (!remaining) return accept(assigned) ? assigned.slice() : null;
    if (++nodes > budget) return null;
    let chosen = -1;
    for (let i = 0; i < count; i++) {
      if (assigned[i]) continue;
      if (chosen < 0) { chosen = i; continue; }
      const domainDelta = current[i].length - current[chosen].length;
      const degreeDelta = slots[i].crossings.length - slots[chosen].crossings.length;
      if (domainDelta < 0 || (domainDelta === 0 && (degreeDelta > 0 ||
        (degreeDelta === 0 && distance[i] < distance[chosen])))) chosen = i;
    }
    if (!current[chosen].length) return null;
    const slot = slots[chosen];
    const supports = slot.crossings.filter(x => !assigned[x.other]).map(crossing => {
      const letters = domains.letters(current[crossing.other], crossing.otherPosition).all;
      const logs = new Map([...letters].map(([letter, words]) => [letter, Math.log(1 + words.length)]));
      return { crossing, logs };
    });
    const totals = [0,0,0,0,0];
    if (profile) for (const value of assigned.filter(Boolean)) vectors.get(value).forEach((v,j) => { totals[j] += v; });
    const preference = word => vectors.get(word).reduce((score,value,j) => score + (totals[j] < minimum[j] ? value * (j >= 3 ? 3 : 1) : 0), 0);
    const choices = current[chosen].map(word => ({ word, score: supports.reduce((sum, { crossing, logs }) => sum + (logs.get(word.answer[crossing.position]) || 0), 0) + ranks.get(word.answer) * 4 + (profile ? preference(word) : 0) })).sort((a,b) => b.score-a.score);
    for (const { word } of choices) {
      assigned[chosen] = word;
      const next = current.slice();
      let possible = true;
      for (const { i, crossing } of related[chosen]) if (!assigned[i]) {
        let domain = current[i];
        if (crossing) {
          const groups = domains.letters(domain, crossing.otherPosition);
          const letters = profile && word.vocabularyLevel === 3 ? groups.nonspecialist : groups.all;
          domain = letters.get(word.answer[crossing.position]) || empty;
        }
        next[i] = domains.without(domain, word.answer);
        if (!next[i].length) { possible = false; break; }
      }
      if (possible) { const result = visit(next, remaining-1); if (result) return result; }
      assigned[chosen] = null;
      if (nodes > budget) break;
    }
    return null;
  }
  const words = visit(slots.map(slot => byLength[slot.cells.length] || empty), count);
  return { words, nodes };
}
