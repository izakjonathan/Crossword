// Binary constraints: crossing agreement, distinct answers and (when enabled)
// no specialist-to-specialist crossing. Each instance belongs to one fill.
export function createConstraintPropagator(slots, index, fairness = false) {
  const incoming = slots.map(() => []), outgoing = slots.map(() => []), arcs = [];
  const summaries = new WeakMap(), revisions = new WeakMap(), descriptions = new WeakMap();
  const stats = { propagations: 0, revisions: 0, removed: 0 };
  for (let from = 0; from < slots.length; from++) {
    const crossings = new Map(slots[from].crossings.map(crossing => [crossing.other, crossing]));
    for (let to = 0; to < slots.length; to++) {
      if (from === to) continue;
      const crossing = crossings.get(to);
      if (!crossing && slots[from].cells.length !== slots[to].cells.length) continue;
      const arc = { id: arcs.length, from, to, crossing };
      arcs.push(arc); outgoing[from].push(arc); incoming[to].push(arc);
    }
  }
  function summary(domain) {
    let counts = summaries.get(domain);
    if (!counts) {
      counts = new Map();
      for (const word of domain) counts.set(word.answer, (counts.get(word.answer) || 0) + 1);
      summaries.set(domain, counts);
    }
    return counts;
  }
  function supportCount(word, domain, arc) {
    if (arc.crossing) {
      const { position, otherPosition } = arc.crossing;
      domain = index.letters(domain, otherPosition, !(fairness && word.vocabularyLevel === 3)).get(word.answer[position]);
      if (!domain) return 0;
    }
    return domain.length - (summary(domain).get(word.answer) || 0);
  }
  function revise(before, target, arc) {
    let targets = revisions.get(before);
    if (!targets) { targets = new WeakMap(); revisions.set(before, targets); }
    let results = targets.get(target);
    if (!results) { results = new Map(); targets.set(target, results); }
    const key = arc.crossing ? arc.crossing.position + ':' + arc.crossing.otherPosition : 'different';
    if (results.has(key)) return results.get(key);
    let after;
    if (!arc.crossing) {
      const counts = summary(target);
      after = counts.size > 1 ? before : index.without(before, target[0].answer);
    } else {
      const { position, otherPosition } = arc.crossing;
      const all = index.letters(target, otherPosition);
      const ordinary = fairness && before.some(word => word.vocabularyLevel === 3) ? index.letters(target, otherPosition, false) : all;
      // Compute each support group's answer counts once per arc, rather than
      // looking up the dictionary index for every source candidate.
      const describe = groups => {
        let value = descriptions.get(groups);
        if (!value) {
          value = new Map([...groups].map(([letter, domain]) => [letter, { count:domain.length, answers:summary(domain) }]));
          descriptions.set(groups, value);
        }
        return value;
      };
      const full = describe(all), safe = ordinary === all ? full : describe(ordinary);
      after = before.filter(word => {
        const group = (fairness && word.vocabularyLevel === 3 ? safe : full).get(word.answer[position]);
        return group && group.count > (group.answers.get(word.answer) || 0);
      });
      if (after.length === before.length) after = before;
    }
    results.set(key, after);
    return after;
  }
  function propagate(current, changed = null) {
    stats.propagations++;
    if (current.some(domain => domain.length === 0)) return false;
    const queue = [], queued = new Set();
    const enqueue = arc => { if (!queued.has(arc.id)) { queued.add(arc.id); queue.push(arc); } };
    if (changed) for (const slot of changed) incoming[slot].forEach(enqueue);
    else arcs.forEach(enqueue);
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const arc = queue[cursor]; queued.delete(arc.id);
      const before = current[arc.from];
      // For a pure inequality, two distinct target answers already support
      // every source value. Avoid rescanning large equal-length dictionaries.
      if (!arc.crossing && summary(current[arc.to]).size > 1) continue;
      const after = revise(before, current[arc.to], arc);
      if (after.length === before.length) continue;
      current[arc.from] = after;
      stats.revisions++; stats.removed += before.length - after.length;
      if (!after.length) return false;
      // A smaller domain can invalidate support in any neighbour, including
      // an unfilled slot several intersections away from the last placement.
      incoming[arc.from].forEach(enqueue);
    }
    return true;
  }
  function eliminated(word, current, slot, assigned) {
    let count = 0;
    for (const arc of outgoing[slot]) if (!assigned[arc.to]) {
      const supported = supportCount(word, current[arc.to], arc);
      count += current[arc.to].length - supported;
    }
    return count;
  }
  return { propagate, eliminated, stats };
}
