import { CLUE_POLICY_VERSION } from './clue-policy.mjs';
import { FAIRNESS_VERSION } from './crossing-safety.mjs';
import { selectClues } from './clue-selection.mjs';
import { DIFFICULTY_VERSION, DIFFICULTY_PROFILES } from './difficulty.mjs';
import { ENGINE_VERSION, RECENT_LIMIT, MODES } from './config.mjs';
import { validatePuzzle } from './validate.mjs';
export { ENGINE_VERSION, RECENT_LIMIT, MODES, rememberAnswers } from './config.mjs';
export { validatePuzzle } from './validate.mjs';
import { GENERATION_WORDS as WORDS } from './words.mjs';
import { createLayout } from './grid-layout.mjs';
import { fillLayout } from './grid-fill.mjs';

export function random(seed) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function generatePuzzle({ mode = 'medium', seed, recent = [], deadline = Infinity }) {
  if (!MODES[mode] || typeof seed !== 'string' || !seed.length || seed.length > 160 || !Array.isArray(recent)) throw new Error('Invalid puzzle request.');
  const { cols, rows, target, maxLength } = MODES[mode];
  const rng = random(`professional-v5:${seed}:${mode}`), blocked = new Set(recent);
  const eligible = WORDS.filter(word => !blocked.has(word.answer) && word.answer.length <= maxLength && (mode !== 'easy' || word.vocabularyLevel < 3));
  if (eligible.length < target + 15) throw new Error('Not enough unused words. Your current puzzle has been kept.');
  // Bound new dictionary domains first; widen deterministically when the
  // smaller vocabulary cannot satisfy a layout. New seeds rotate the
  // supplemental selection; history exclusions apply to every tier.
  const primary = eligible.filter(word => !word.supplemental), extra = eligible.filter(word => word.supplemental);
  const choose = random('dictionary-tier:' + seed + ':' + mode);
  const ordered = Map.groupBy(extra.map(word => ({word,rank:choose()})), value => value.word.answer.length);
  for (const values of ordered.values()) values.sort((a,b)=>a.rank-b.rank);
  const banks = [16,32,64].map(limit => {
    const selected = new Set([...ordered.values()].flatMap(values=>values.slice(0,limit).map(value=>value.word)));
    return [...primary,...extra.filter(word=>selected.has(word))];
  });
  const capacities = banks.map(bank => ({
    advanced:bank.filter(word=>word.vocabularyLevel===3).length,
    challenging:bank.filter(word=>word.clues.some(clue=>mode==='medium'?clue.level===2:clue.level>=2)).length,
    hard:bank.filter(word=>word.clues.some(clue=>clue.level===3)).length
  }));
  let nodes = 0;
  for (let attempt = 0; attempt < 1024 && nodes < 48000; attempt++) {
    if(Date.now()>=deadline)throw new Error('Search budget reached');
    const tier = attempt < 64 ? 0 : attempt < 256 ? 1 : 2, bank = banks[tier];
    const layout = createLayout(cols, rng, mode !== 'easy');
    if (!layout) continue;
    const profile=DIFFICULTY_PROFILES[mode],fields=layout.mask.filter(Boolean).length;
    if(fields<profile.minFields || fields>profile.maxFields || layout.slots.filter(slot=>slot.cells.length>=profile.longLength).length<profile.minLong)continue;
    const capacity = capacities[tier], count = layout.slots.length;
    if (capacity.advanced < Math.ceil(profile.minAdvanced*count) || capacity.challenging < Math.ceil(profile.minChallengingClues*count) || capacity.hard < Math.ceil(profile.minHardClues*count)) continue;
    let selectedClues = null;
    const filled = fillLayout(layout, bank, rng, Math.min(300 + Math.floor(attempt / 64) * 200, 48000 - nodes), mode, words => {
      selectedClues = selectClues(words, mode, layout.slots, rng);
      return selectedClues !== null;
    }, deadline);
    nodes += filled.nodes;
    if (!filled.words) continue;
    const grid = layout.mask.map(cell => cell ? { letter: '', number: null } : null);
    const starts = [...new Set(layout.slots.map(slot => slot.cells[0]))].sort((a, b) => a - b);
    const numbers = new Map(starts.map((cell, index) => [cell, index + 1]));
    const entries = layout.slots.map((slot, index) => {
      const word = filled.words[index];
      slot.cells.forEach((cell, position) => { grid[cell].letter = word.answer[position]; grid[cell].number = numbers.get(cell) || null; });
      return { id: slot.id, answer: word.answer, clue: selectedClues[index].text, clueLevel:selectedClues[index].level, clueStyle:selectedClues[index].style, answerForm:selectedClues[index].answerForm, clueRegister:selectedClues[index].register, vocabularyLevel:word.vocabularyLevel, number: numbers.get(slot.cells[0]), dir: slot.dir, cells: slot.cells };
    }).sort((a, b) => a.number - b.number || a.dir.localeCompare(b.dir));
    const puzzle = { constructionVersion: 5, cluePolicyVersion: CLUE_POLICY_VERSION, difficultyVersion: DIFFICULTY_VERSION, fairnessVersion: FAIRNESS_VERSION, version: ENGINE_VERSION, id: `v${ENGINE_VERSION}:professional:edited1:${mode}:${seed}`, mode, cols, rows, entries, grid };
    if (validatePuzzle(puzzle).length) throw new Error('Puzzle validation failed. Your current puzzle has been kept.');
    return puzzle;
  }
  throw new Error('Could not fill a well-checked grid with the available words. Try another difficulty. Your current puzzle has been kept.');
}
