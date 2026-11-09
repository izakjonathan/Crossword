// This key is deliberately independent of releases and the rolling window.
export const EXCLUSIONS_KEY = 'daily-cross:answer-exclusions:v1';
export const GLOBAL_ANSWERS_KEY = 'crossword:answer-history:v1';
export const HISTORY_SCAN_KEY = 'crossword:answer-history:room-scan:v1';
export const ANSWER_PATTERN = /^[A-Z]{3,11}$/;
export function protectedAnswers(history) {
  return new Set([...(history.excludedAnswers || []), ...(history.recentRounds || []).slice(-5).flat()]);
}
export function readExclusions(storage) {
  const raw = storage.getItem(EXCLUSIONS_KEY);
  if (raw === null) return [];
  let answers;
  try { answers = JSON.parse(raw); } catch { throw new Error('Saved answer exclusions could not be read. Your current game has been kept.'); }
  if (!Array.isArray(answers) || answers.some(answer => typeof answer !== 'string' || !ANSWER_PATTERN.test(answer))) throw new Error('Saved answer exclusions are damaged. Your current game has been kept.');
  return [...new Set(answers)];
}
export function preserveExclusions(storage, answers) {
  const merged = [...new Set([...readExclusions(storage), ...answers])];
  if (merged.some(answer => typeof answer !== 'string' || !ANSWER_PATTERN.test(answer))) throw new Error('Invalid answer history.');
  storage.setItem(EXCLUSIONS_KEY, JSON.stringify(merged));
  return merged;
}
export function roomAnswerHistory(room) {
  return [...new Set([
    ...(Array.isArray(room?.usedAnswers) ? room.usedAnswers : []),
    ...(Array.isArray(room?.recentRounds) ? room.recentRounds.flat() : []),
    ...(room?.puzzle?.entries || []).map(entry => entry.answer)
  ].filter(answer => typeof answer === 'string' && ANSWER_PATTERN.test(answer)))];
}
