import { validatePuzzle } from './validate.mjs';

export const ROOM_TTL_SECONDS = 7 * 24 * 60 * 60;
export const TOKEN_PATTERN = /^[a-f0-9]{64}$/;
export const OP_PATTERN = /^[a-f0-9-]{36}$/;
export class SharedError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export function createRoom(game, now = Date.now()) {
  if (!game?.puzzle || validatePuzzle(game.puzzle).length) throw new SharedError('This puzzle cannot be shared.');
  const answers = game.play?.answers;
  if (!answers || typeof answers !== 'object' || Array.isArray(answers) || typeof game.play.assisted !== 'boolean') throw new SharedError('Invalid puzzle progress.');
  validateChanges(game.puzzle, Object.entries(answers).map(([cell, value]) => ({ cell, value })));
  return { puzzle:game.puzzle, answers:{...answers}, writers:{}, assisted:game.play.assisted, revision:0, expiresAt:now + ROOM_TTL_SECONDS * 1000 };
}
export function validateChanges(puzzle, changes) {
  if (!Array.isArray(changes) || changes.length > puzzle.grid.length) throw new SharedError('Invalid letter changes.');
  const cells = new Set();
  for (const change of changes) {
    if (!change || !/^(0|[1-9][0-9]*)$/.test(String(change.cell)) || !puzzle.grid[Number(change.cell)] || cells.has(String(change.cell)) || typeof change.value !== 'string' || !/^[A-Z]?$/.test(change.value) || (change.expected !== undefined && !OP_PATTERN.test(change.expected))) throw new SharedError('Invalid letter changes.');
    cells.add(String(change.cell));
  }
}
export function validateOperation(puzzle, operation) {
  if (!operation || !OP_PATTERN.test(operation.id) || typeof operation.assisted !== 'boolean') throw new SharedError('Invalid shared edit.');
  validateChanges(puzzle, operation.changes);
}
export function playWithRoom(play, room) {
  return { ...play, answers:{...room.answers}, assisted:play.assisted || room.assisted };
}
export function changesBetween(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(cell => (before[cell] || '') !== (after[cell] || '')).map(cell => ({ cell, value:after[cell] || '' }));
}
// Each operation changes only named squares. Undo carries the original writer ID,
// so another player's subsequent letter (even the same letter) is never undone.
export function applyOperation(room, operation) {
  const next = { ...room, answers:{...room.answers}, writers:{...room.writers}, assisted:room.assisted || operation.assisted };
  for (const change of operation.changes) {
    if (change.expected !== undefined && next.writers[change.cell] !== change.expected) continue;
    next.answers[change.cell] = change.value;
    next.writers[change.cell] = operation.id;
  }
  return next;
}
