export const ENGINE_VERSION = 3;
export const RECENT_LIMIT = 500;
export const MODES = {
  easy: { label: 'Easy', cols: 9, rows: 9, target: 14, maxLength: 7 },
  medium: { label: 'Medium', cols: 11, rows: 11, target: 20, maxLength: 9 },
  hard: { label: 'Hard', cols: 13, rows: 13, target: 24, maxLength: 11 },
};
export function rememberAnswers(history, puzzle) {
  const added = puzzle.entries.map(e => e.answer);
  const used = new Set(added);
  return [...history.filter(w => !used.has(w)), ...added].slice(-RECENT_LIMIT);
}
