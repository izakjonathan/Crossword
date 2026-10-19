// An app-specific editorial safeguard, based on the current explicit bands.
// This is not a guarantee that every solver knows a particular answer.
export const FAIRNESS_VERSION = 1;

export function crossingSafety(entries) {
  const owners = new Map();
  entries.forEach((entry, index) => entry.cells.forEach(cell => {
    const list = owners.get(cell) || [];
    list.push(index);
    owners.set(cell, list);
  }));
  const neighbours = entries.map(() => new Set());
  let specialistPairs = 0, hardestCluePairs = 0;
  for (const list of owners.values()) for (let a = 0; a < list.length; a++) for (const b of list.slice(a + 1)) {
    const i = list[a];
    if (neighbours[i].has(b)) continue;
    neighbours[i].add(b); neighbours[b].add(i);
    if (entries[i].vocabularyLevel === 3 && entries[b].vocabularyLevel === 3) specialistPairs++;
    if (entries[i].clueLevel === 3 && entries[b].clueLevel === 3) hardestCluePairs++;
  }
  const unsupportedHardClues = entries.filter((entry, i) => entry.clueLevel === 3 &&
    ![...neighbours[i]].some(j => entries[j].clueLevel < 3)).length;
  return { specialistPairs, hardestCluePairs, unsupportedHardClues };
}

export function validateCrossingSafety(puzzle) {
  const errors = [];
  if (puzzle.fairnessVersion !== FAIRNESS_VERSION) return ['Unsupported crossing fairness version'];
  if (puzzle.difficultyVersion !== 1 || puzzle.entries.some(e => ![1,2,3].includes(e.vocabularyLevel) || ![1,2,3].includes(e.clueLevel))) return ['Missing crossing fairness ratings'];
  const quality = crossingSafety(puzzle.entries);
  if (quality.specialistPairs) errors.push('Specialist answers cross each other');
  if (quality.unsupportedHardClues) errors.push('Hardest clue has no gentler crossing clue');
  if (puzzle.mode !== 'hard' && puzzle.entries.some(e => e.clueLevel === 3)) errors.push('Hardest clues outside Hard mode');
  return errors;
}
