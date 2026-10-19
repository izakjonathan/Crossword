import { ENGINE_VERSION, RECENT_LIMIT } from './config.mjs';
import { validatePuzzle } from './validate.mjs';
export const SESSION_KEY = 'daily-cross:session:v3';
export const HISTORY_KEY = 'daily-cross:history:v3';
export function loadSession(storage) {
  try {
    const value = JSON.parse(storage.getItem(SESSION_KEY));
    if (!value || value.puzzle?.version !== ENGINE_VERSION || !value.play || validatePuzzle(value.puzzle).length) return null;
    const entry = value.puzzle.entries.find(e => e.id === value.play.entryId);
    if (!entry?.cells.includes(value.play.selected)) return null;
    return { puzzle: value.puzzle, play: { ...value.play, undo: [] } };
  } catch { return null; }
}
export function loadHistory(storage) {
  try { const history = JSON.parse(storage.getItem(HISTORY_KEY)); return Array.isArray(history) ? history.filter(w => typeof w === 'string' && /^[A-Z]{3,}$/.test(w)).slice(-RECENT_LIMIT) : []; }
  catch { return []; }
}
export function saveSession(storage, game) {
  if (!game) return;
  storage.setItem(SESSION_KEY, JSON.stringify({ puzzle: game.puzzle, play: { ...game.play, undo: [] } }));
}
