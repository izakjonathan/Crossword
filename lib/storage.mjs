import { solveStats } from '../features/solve/model.mjs';
import { ENGINE_VERSION, RECENT_LIMIT } from './config.mjs';
import { validatePuzzle } from './validate.mjs';
export const SESSION_KEY = 'daily-cross:session:v3';
export const HISTORY_KEY = 'daily-cross:history:v3';
export function loadSession(storage) {
  try {
    const value = JSON.parse(storage.getItem(SESSION_KEY));
    if (!value || value.puzzle?.version !== ENGINE_VERSION || !value.play || validatePuzzle(value.puzzle).length) return null;
    const entry = value.puzzle.entries.find(e => e.id === value.play.entryId);
    if (!Number.isInteger(value.play.selected) || !entry?.cells.includes(value.play.selected)) return null;
    const answers = value.play.answers;
    if (!answers || typeof answers !== 'object' || Array.isArray(answers) || Object.entries(answers).some(([key, letter]) => !/^(0|[1-9][0-9]*)$/.test(key) || !value.puzzle.grid[Number(key)] || typeof letter !== 'string' || !/^[A-Z]?$/.test(letter))) return null;
    if (typeof value.play.assisted !== 'boolean' || typeof value.play.overwrite !== 'boolean') return null;
    return { stats:solveStats(value.stats), puzzle: value.puzzle, play: { ...value.play, undo: [] } };
  } catch { return null; }
}
export function loadHistory(storage) {
  try { const history = JSON.parse(storage.getItem(HISTORY_KEY)); return Array.isArray(history) ? history.filter(w => typeof w === 'string' && /^[A-Z]{3,}$/.test(w)).slice(-RECENT_LIMIT) : []; }
  catch { return []; }
}
export function saveSession(storage, game) {
  if (!game) return;
  storage.setItem(SESSION_KEY, JSON.stringify({ stats:solveStats(game.stats), puzzle: game.puzzle, play: { ...game.play, undo: [] } }));
}
