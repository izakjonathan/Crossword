export const RECENT_PUZZLES = 5;
export const answersOf = puzzle => puzzle.entries.map(entry => entry.answer);
export function recentAnswers(rounds) { return new Set(rounds.slice(-RECENT_PUZZLES).flat()); }
export function appendRound(rounds, answers) {
  return [...rounds, answers.slice()].slice(-RECENT_PUZZLES);
}
export function ledgerRounds(ledger) {
  if (Array.isArray(ledger.recentRounds)) return ledger.recentRounds.slice(-RECENT_PUZZLES);
  // Old ledgers have last-use game numbers, not complete round records.
  // Preserve identifiable recent games; undated game-zero imports are only
  // preferences, otherwise a legacy blacklist can reserve the entire bank.
  const groups = new Map();
  for (const [answer, use] of Object.entries(ledger.uses)) {
    if (use.game <= 0 || ledger.sequence - use.game >= RECENT_PUZZLES) continue;
    if (!groups.has(use.game)) groups.set(use.game, []);
    groups.get(use.game).push(answer);
  }
  return [...groups].sort((a,b)=>a[0]-b[0]).map(([,words])=>words);
}
export function roomRounds(room) {
  return Array.isArray(room.recentRounds) ? room.recentRounds.slice(-RECENT_PUZZLES) : [answersOf(room.puzzle)];
}
