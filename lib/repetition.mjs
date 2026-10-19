import { HISTORY_KEY, loadHistory } from './storage.mjs';
export const LEDGER_KEY = 'daily-cross:word-ledger:v1';
export const REPEAT_TIME_ZONE = 'Europe/Copenhagen';
export const MIN_REUSE_DAYS = 7;
export const MIN_REUSE_GAMES = 20;
const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: REPEAT_TIME_ZONE, year:'numeric', month:'2-digit', day:'2-digit' });
export function dayKey(now) { return formatter.format(new Date(now)); }
export function emptyLedger() { return { version:1, sequence:0, uses:{} }; }
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
    // Legacy records have no date. Conservatively reserve every known answer
    // for today instead of guessing that it is safe to use again.
    if (storage.getItem(HISTORY_KEY) !== null) for (const word of loadHistory(storage)) ledger.uses[word] = { at:now, day:dayKey(now), game:0 };
  }
  for (const entry of currentPuzzle?.entries || []) if (!ledger.uses[entry.answer]) ledger.uses[entry.answer] = { at:now, day:dayKey(now), game:ledger.sequence };
  return ledger;
}
export function recordPuzzle(ledger, puzzle, now) {
  const day = dayKey(now), sequence = ledger.sequence + 1, uses = { ...ledger.uses };
  const answers = puzzle.entries.map(entry => entry.answer);
  if (new Set(answers).size !== answers.length || answers.some(word => uses[word]?.day === day)) throw new Error('An answer was already used today. Your current puzzle has been kept.');
  if (answers.some(word => uses[word] && (now - uses[word].at < MIN_REUSE_DAYS * 86400000 || ledger.sequence - uses[word].game < MIN_REUSE_GAMES))) throw new Error('An answer has been used too recently. Your current puzzle has been kept.');
  for (const word of answers) uses[word] = { at:now, day, game:sequence };
  return { version:1, sequence, uses };
}
export function candidatePools(bank, ledger, now) {
  const today = dayKey(now), available = bank.filter(word => {
    const use = ledger.uses[word.answer];
    return !use || (use.day !== today && now - use.at >= MIN_REUSE_DAYS * 86400000 && ledger.sequence - use.game >= MIN_REUSE_GAMES);
  });
  const unused = available.filter(word => !ledger.uses[word.answer]);
  const used = available.filter(word => ledger.uses[word.answer]).sort((a,b) => ledger.uses[a.answer].game - ledger.uses[b.answer].game || ledger.uses[a.answer].at - ledger.uses[b.answer].at || a.answer.localeCompare(b.answer));
  const rested = used.filter(word => now - ledger.uses[word.answer].at >= 30 * 86400000 && ledger.sequence - ledger.uses[word.answer].game >= 40);
  const pools = [], seen = new Set();
  function add(words) { const signature=words.map(w=>w.answer).sort().join(','); if (!seen.has(signature)) { seen.add(signature); pools.push(words); } }
  add(unused);
  // Exhaust never-used answers first, then answers rested for 30 days AND
  // 40 games. Only when those cannot form a grid, widen oldest-first pools.
  for (const size of [80,160,320,640,rested.length]) if (size > 0) add([...unused,...rested.slice(0,size)]);
  for (const size of [80,160,320,640,used.length]) if (size > 0) add([...unused,...used.slice(0,size)]);
  return pools;
}
export async function generateAndRecord({ storage, locks, makePuzzle, now = Date.now, currentPuzzle, signal }) {
  if (!locks?.request) throw new Error('Update your browser to generate puzzles with safe repeat protection.');
  return locks.request('daily-cross:word-generation', { mode:'exclusive', signal }, async () => {
    const started = now();
    const ledger = readLedger(storage, started, currentPuzzle);
    // Check persistence before spending time generating. No silent memory-only fallback.
    try { storage.setItem(LEDGER_KEY, JSON.stringify(ledger)); }
    catch { throw new Error('Allow site storage to generate puzzles without repeating answers.'); }
    const puzzle = await makePuzzle(ledger, started);
    const committed = now();
    const next = recordPuzzle(readLedger(storage, committed), puzzle, committed);
    try { storage.setItem(LEDGER_KEY, JSON.stringify(next)); }
    catch { throw new Error('Word history could not be saved. Your current puzzle has been kept.'); }
    return puzzle;
  });
}
