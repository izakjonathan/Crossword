import { readLedger } from './repetition.mjs';
import { loadHistory, loadSession } from './storage.mjs';
import { loadLibrary } from '../features/library/store.mjs';
import { ANSWER_PATTERN, preserveExclusions } from './answer-history.mjs';

export function recoverDeviceAnswers(storage, currentPuzzle, now = Date.now()) {
  const ledger = readLedger(storage, now, currentPuzzle);
  const puzzles = [currentPuzzle, loadSession(storage)?.puzzle, ...loadLibrary(storage).map(row => row.game.puzzle)];
  return [...new Set([
    ...Object.keys(ledger.uses), ...(ledger.excludedAnswers || []), ...loadHistory(storage),
    ...puzzles.flatMap(puzzle => (puzzle?.entries || []).map(entry => entry.answer))
  ].filter(answer => ANSWER_PATTERN.test(answer)))];
}
export async function historyRequest(body, { fetcher = fetch, signal } = {}) {
  let response;
  try {
    response = await fetcher('/api/answer-history', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body), cache:'no-store', signal:signal || AbortSignal.timeout(15000)});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Answer history is unavailable.');
    if (!result || !Array.isArray(result.answers) || result.answers.some(answer => typeof answer !== 'string' || !ANSWER_PATTERN.test(answer)) || typeof result.ready !== 'boolean') throw new Error('Invalid answer-history response.');
    return result;
  } catch (error) {
    throw new Error(error.message || 'Could not synchronize answer history. Your current game has been kept.');
  }
}
export async function syncAnswerHistory(storage, currentPuzzle, options = {}) {
  // Capture the complete device history before networking or changing content.
  options = {...options,signal:options.signal || AbortSignal.timeout(20000)};
  let answers = preserveExclusions(storage, recoverDeviceAnswers(storage, currentPuzzle));
  for (let page = 0; page < 64; page++) {
    const result = await historyRequest({action:'sync', answers:page ? [] : answers}, options);
    answers = preserveExclusions(storage, result.answers);
    if (result.ready) return answers;
  }
  throw new Error('Shared answer history is still being recovered. Try again shortly. Your current game has been kept.');
}
export async function claimAnswers(puzzle, options = {}) {
  // Retrying the same request after a lost response is safe; another puzzle
  // with any of these answers is not. No token or Redis credential is public.
  const body = {action:'claim', id:options.id || crypto.randomUUID(), answers:puzzle.entries.map(entry => entry.answer)};
  try { return await historyRequest(body, options); }
  catch { return historyRequest(body, options); }
}
