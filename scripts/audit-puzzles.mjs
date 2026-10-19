import { generatePuzzle } from '../lib/engine.mjs';
import { checkingQuality, validatePuzzle } from '../lib/validate.mjs';
import { gridQuality } from '../lib/grid-quality.mjs';
import { WORDS } from '../lib/words.mjs';
const count = Number(process.argv[2] || 100);
if (!Number.isInteger(count) || count < 1 || count > 1000) throw new Error('Choose 1–1000 seeds per difficulty.');
const result = { seedsPerMode:count, bankAnswers:WORDS.length, modes:{} };
const byAnswer = new Map(WORDS.map(word => [word.answer, word]));
for (const mode of ['easy','medium','hard']) {
  const samples = [], failures = [], grids = new Set(), frequency = new Map();
  for (let seed=0; seed<count; seed++) {
    const input = {mode, seed:`audit-${seed}`}, start = performance.now();
    try {
      const puzzle = generatePuzzle(input), errors = validatePuzzle(puzzle);
      if (errors.length) throw new Error(errors.join(', '));
      const checking = checkingQuality(puzzle), quality = gridQuality(puzzle.grid,puzzle.cols,puzzle.rows);
      const longAnswers = puzzle.entries.filter(entry => entry.answer.length >= 5).length;
      const alternativeClues = puzzle.entries.filter(entry => byAnswer.get(entry.answer).easy !== byAnswer.get(entry.answer).hard).length;
      samples.push({ms:performance.now()-start, entries:puzzle.entries.length, black:quality.blackRatio, meanChecking:checking.entries.reduce((sum,e)=>sum+e.ratio,0)/checking.entries.length, minChecking:checking.minRatio, maxUnchecked:checking.maxUnchecked, longAnswers, alternativeClues});
      grids.add(puzzle.grid.map(cell=>cell?.letter||'#').join(''));
      for (const entry of puzzle.entries) frequency.set(entry.answer,(frequency.get(entry.answer)||0)+1);
    } catch (error) { failures.push({seed,message:error.message}); }
  }
  const average = key => samples.reduce((sum,sample)=>sum+sample[key],0)/samples.length;
  const timings=samples.map(sample=>sample.ms).sort((a,b)=>a-b);
  result.modes[mode]={successes:samples.length,failures,distinctGrids:grids.size,meanMs:average('ms'),p95Ms:timings[Math.min(timings.length-1,Math.ceil(timings.length*.95)-1)],maxMs:timings.at(-1),meanEntries:average('entries'),meanBlack:average('black'),meanChecking:average('meanChecking'),minChecking:Math.min(...samples.map(s=>s.minChecking)),maxUnchecked:Math.max(...samples.map(s=>s.maxUnchecked)),meanLongAnswers:average('longAnswers'),meanAlternativeClues:average('alternativeClues'),uniqueAnswersUsed:frequency.size,mostFrequentAnswers:[...frequency].sort((a,b)=>b[1]-a[1]).slice(0,5)};
}
console.log(JSON.stringify(result,null,2));
if (Object.values(result.modes).some(mode=>mode.failures.length)) process.exitCode=1;
