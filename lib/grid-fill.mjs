// Seeded constraint search: MRV slot choice, crossing-degree tie-break,
// forward checking, all-different answers, and least-constraining values.
// Fixed node budgets keep results reproducible, unlike a time-based cutoff.
export function fillLayout(layout, bank, rng, budget = 3000) {
  const { slots } = layout, byLength = Object.groupBy(bank, word => word.answer.length);
  const ranks = new Map(bank.map(word => [word.answer, rng()]));
  const assigned = Array(slots.length).fill(null);
  let nodes = 0;
  function visit(domains, remaining) {
    if (!remaining) return assigned.slice();
    if (++nodes > budget) return null;
    let chosen = -1;
    for (let i = 0; i < slots.length; i++) if (!assigned[i] && (chosen < 0 || domains[i].length < domains[chosen].length || (domains[i].length === domains[chosen].length && slots[i].crossings.length > slots[chosen].crossings.length))) chosen = i;
    if (!domains[chosen].length) return null;
    const slot = slots[chosen];
    const supports = slot.crossings.filter(x => !assigned[x.other]).map(crossing => {
      const letters = new Map();
      for (const word of domains[crossing.other]) {
        const letter = word.answer[crossing.otherPosition];
        letters.set(letter, (letters.get(letter) || 0) + 1);
      }
      return { crossing, letters };
    });
    const choices = domains[chosen].map(word => ({ word, score: supports.reduce((sum, { crossing, letters }) => sum + Math.log(1 + (letters.get(word.answer[crossing.position]) || 0)), 0) + ranks.get(word.answer) * 4 })).sort((a, b) => b.score - a.score);
    for (const { word } of choices) {
      assigned[chosen] = word;
      const next = domains.slice();
      let possible = true;
      for (let i = 0; i < slots.length; i++) if (!assigned[i]) {
        const crossing = slot.crossings.find(x => x.other === i);
        if (crossing || slots[i].cells.length === word.answer.length) {
          next[i] = domains[i].filter(candidate => candidate.answer !== word.answer && (!crossing || candidate.answer[crossing.otherPosition] === word.answer[crossing.position]));
          if (!next[i].length) { possible = false; break; }
        }
      }
      if (possible) { const result = visit(next, remaining - 1); if (result) return result; }
      assigned[chosen] = null;
      if (nodes > budget) break;
    }
    return null;
  }
  const words = visit(slots.map(slot => byLength[slot.cells.length] || []), slots.length);
  return { words, nodes };
}
