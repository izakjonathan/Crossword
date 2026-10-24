import { generatePuzzle } from './engine.mjs';
import { WORDS } from './words.mjs';
import { MODES } from './config.mjs';
import { ledgerRounds, recentAnswers } from './recent-rounds.mjs';
import { candidatePools } from './repetition.mjs';
export function generateFreshPuzzle({ mode, seed, history, now }) {
  if (!MODES[mode] || !history || !Number.isFinite(now)) throw new Error('Invalid puzzle request.');
  const bank = WORDS.filter(word => word.answer.length <= MODES[mode].maxLength && (mode !== 'easy' || word.vocabularyLevel < 3));
  const blocked = recentAnswers(ledgerRounds(history));
  if (bank.filter(word => !blocked.has(word.answer)).length < MODES[mode].target + 15) throw new Error('Too few eligible answers remain outside the last five puzzles. Try another difficulty. Your current puzzle has been kept.');
  const pools = candidatePools(bank, history, now);
  for (let index=0; index<pools.length; index++) {
    const pool=pools[index]; if (pool.length < MODES[mode].target + 15) continue;
    const allowed = new Set(pool.map(word=>word.answer));
    const recent = WORDS.filter(word=>!allowed.has(word.answer)).map(word=>word.answer);
    for (let attempt=0; attempt<2; attempt++) {
      try { return generatePuzzle({mode,seed:`${seed}:pool-${index}:${attempt}`,recent}); }
      catch { /* Try another arrangement, then widen to older answers. */ }
    }
  }
  throw new Error('Eligible words remain, but no valid grid was found within the search limit. Try again or choose another difficulty. Your current puzzle has been kept.');
}
