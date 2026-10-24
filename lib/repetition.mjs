import { ledgerRounds, recentAnswers, appendRound, answersOf } from './recent-rounds.mjs';
import { HISTORY_KEY, loadHistory } from './storage.mjs';
export const LEDGER_KEY = 'daily-cross:word-ledger:v1';
export const REPEAT_TIME_ZONE = 'Europe/Copenhagen';
export const MIN_REUSE_GAMES = 5;
const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: REPEAT_TIME_ZONE, year:'numeric', month:'2-digit', day:'2-digit' });
export function dayKey(now) { return formatter.format(new Date(now)); }
export function emptyLedger() { return { version:1, sequence:0, uses:{}, recentRounds:[] }; }
export function readLedger(storage, now, currentPuzzle) {
  const raw = storage.getItem(LEDGER_KEY);
  let ledger;
  if (raw !== null) {
    try { ledger = JSON.parse(raw); } catch { throw new Error('Word history could not be read. Your current puzzle has been kept.'); }
    if (ledger?.version !== 1 || !Number.isSafeInteger(ledger.sequence) || ledger.sequence < 0 || !ledger.uses || Array.isArray(ledger.uses) || typeof ledger.uses !== 'object') throw new Error('Word history is damaged. Your current puzzle has been kept.');
    for (const [word, use] of Object.entries(ledger.uses)) {
      if (!/^[A-Z]{3,}$/.test(word) || !Number.isFinite(use?.at) || !Number.isSafeInteger(use.game) || use.game < 0 || use.game > ledger.sequence || use.day !== dayKey(use.at)) throw new Error('Word history is damaged. Your current puzzle has been kept.');
    }
  } else {
    ledger = emptyLedger();
    // Preserve undated legacy answers as seen-word preferences. Only known
    // recent rounds/current puzzle become hard exclusions.
    if (storage.getItem(HISTORY_KEY) !== null) for (const word of loadHistory(storage)) ledger.uses[word] = { at:now, day:dayKey(now), game:0 };
  }
  if (ledger.recentRounds !== undefined && (!Array.isArray(ledger.recentRounds) || ledger.recentRounds.length > 5 || ledger.recentRounds.some(round => !Array.isArray(round) || round.some(word => !/^[A-Z]{3,11}$/.test(word))))) throw new Error('Word history is damaged. Your current puzzle has been kept.');
  ledger.recentRounds = ledgerRounds(ledger);
  if (currentPuzzle) {
    const answers = answersOf(currentPuzzle), previous = ledger.recentRounds.at(-1);
    if (!previous || answers.length !== previous.length || answers.some(word => !previous.includes(word))) ledger.recentRounds = appendRound(ledger.recentRounds, answers);
  }
  for (const entry of currentPuzzle?.entries || []) if (!ledger.uses[entry.answer]) ledger.uses[entry.answer] = { at:now, day:dayKey(now), game:ledger.sequence };
  return ledger;
}
export function recordPuzzle(ledger, puzzle, now) {
  const day = dayKey(now), sequence = ledger.sequence + 1, uses = { ...ledger.uses };
  const answers = puzzle.entries.map(entry => entry.answer);
  const rounds = ledgerRounds(ledger), blocked = recentAnswers(rounds);
  if (new Set(answers).size !== answers.length || answers.some(word => blocked.has(word))) throw new Error('An answer was used in the last five puzzles. Your current puzzle has been kept.');
  for (const word of answers) uses[word] = { at:now, day, game:sequence };
  return { version:1, sequence, uses, recentRounds:appendRound(rounds, answers) };
}
export function candidatePools(bank, ledger, now) {
  const blocked = recentAnswers(ledgerRounds(ledger));
  const available = bank.filter(word => !blocked.has(word.answer));
  const unused = available.filter(word => !ledger.uses[word.answer]);
  const used = available.filter(word => ledger.uses[word.answer]).sort((a,b) => ledger.uses[a.answer].game - ledger.uses[b.answer].game || ledger.uses[a.answer].at - ledger.uses[b.answer].at || a.answer.localeCompare(b.answer));
  const pools = [], seen = new Set();
  function add(words) { const signature = words.map(w=>w.answer).sort().join(','); if (!seen.has(signature)) { seen.add(signature); pools.push(words); } }
  add(unused);
  // Expand in sizeable oldest-first steps; no daily or lifetime lockout.
  for (const size of [320, 960, used.length]) if (size > 0) add([...unused, ...used.slice(0,size)]);
  return pools;
}
export async function generateAndRecord({ storage, locks, makePuzzle, now = Date.now, currentPuzzle, signal, historyForGeneration = ledger => ledger }) {
  if (!locks?.request) throw new Error('Update your browser to generate puzzles with safe repeat protection.');
  return locks.request('daily-cross:word-generation', { mode:'exclusive', signal }, async () => {
    const started = now();
    const ledger = readLedger(storage, started, currentPuzzle);
    // Check persistence before spending time generating. No silent memory-only fallback.
    try { storage.setItem(LEDGER_KEY, JSON.stringify(ledger)); }
    catch { throw new Error('Allow site storage to generate puzzles without repeating answers.'); }
    const generationHistory = historyForGeneration(ledger, started);
    const puzzle = await makePuzzle(generationHistory, started);
    const committed = now();
    const next = recordPuzzle(historyForGeneration(readLedger(storage, committed), committed), puzzle, committed);
    try { storage.setItem(LEDGER_KEY, JSON.stringify(next)); }
    catch { throw new Error('Word history could not be saved. Your current puzzle has been kept.'); }
    return puzzle;
  });
}

// Reserve a viewed shared round locally, without counting reloads as games.
export function reserveSharedAnswers(storage, puzzle, now = Date.now()) {
  const ledger = readLedger(storage, now);
  const answers = answersOf(puzzle), previous = ledger.recentRounds.at(-1);
  if (!previous || answers.length !== previous.length || answers.some(word => !previous.includes(word))) ledger.recentRounds = appendRound(ledger.recentRounds, answers);
  for (const entry of puzzle.entries) ledger.uses[entry.answer] = { at:now, day:dayKey(now), game:ledger.sequence };
  storage.setItem(LEDGER_KEY, JSON.stringify(ledger));
}
