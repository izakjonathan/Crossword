import { solveStats } from '../features/solve/model.mjs';
import { validatePuzzle } from './validate.mjs';
export const ROOM_TTL_SECONDS = 7 * 24 * 60 * 60;
export const TOKEN_PATTERN = /^[a-f0-9]{64}$/;
export const OP_PATTERN = /^[a-f0-9-]{36}$/;
export const SHARED_MODALS = [null, 'tools', 'clues', 'new', 'reveal', 'check', 'summary'];
export class SharedError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export const roundId = room => room.roundId || room.puzzle.id;
export function defaultView(puzzle) { return { entryId:puzzle.entries[0].id, selected:puzzle.entries[0].cells[0], modal:null, errors:[], board:null, clueDirection:'across', notice:'' }; }
export function createRoom(game, now = Date.now()) {
  if (!game?.puzzle || validatePuzzle(game.puzzle).length) throw new SharedError('This puzzle cannot be shared.');
  const answers = game.play?.answers;
  if (!answers || typeof answers !== 'object' || Array.isArray(answers) || typeof game.play.assisted !== 'boolean') throw new SharedError('Invalid puzzle progress.');
  validateChanges(game.puzzle, Object.entries(answers).map(([cell, value]) => ({ cell, value })));
  const view = { ...defaultView(game.puzzle), entryId:game.play.entryId, selected:game.play.selected };
  validateView(game.puzzle, view);
  return { stats:{...solveStats(null,now),completedAt:game.puzzle.grid.every((c,i)=>!c||answers[i]===c.letter)?now:null}, puzzle:game.puzzle, roundId:game.puzzle.id, answers:{...answers}, writers:{}, view, usedAnswers:game.puzzle.entries.map(e=>e.answer), assisted:game.play.assisted, revision:0, expiresAt:now + ROOM_TTL_SECONDS * 1000 };
}
export function validateChanges(puzzle, changes) {
  if (!Array.isArray(changes) || changes.length > puzzle.grid.length) throw new SharedError('Invalid letter changes.');
  const cells = new Set();
  for (const change of changes) {
    if (!change || !/^(0|[1-9][0-9]*)$/.test(String(change.cell)) || !puzzle.grid[Number(change.cell)] || cells.has(String(change.cell)) || typeof change.value !== 'string' || !/^[A-Z]?$/.test(change.value) || (change.expected !== undefined && !OP_PATTERN.test(change.expected))) throw new SharedError('Invalid letter changes.');
    cells.add(String(change.cell));
  }
}
export function validateView(puzzle, view) {
  if (!view || typeof view !== 'object' || Array.isArray(view) || Object.keys(view).some(key=>!['entryId','selected','modal','errors','board','clueDirection','notice','noticeId'].includes(key))) throw new SharedError('Invalid shared view.');
  if (view.entryId !== undefined || view.selected !== undefined) {
    const entry = puzzle.entries.find(e=>e.id===view.entryId);
    if (!entry || !entry.cells.includes(view.selected)) throw new SharedError('Invalid shared selection.');
  }
  if (view.modal !== undefined && !SHARED_MODALS.includes(view.modal)) throw new SharedError('Invalid shared dialog.');
  if (view.errors !== undefined && (!Array.isArray(view.errors) || view.errors.length > puzzle.grid.length || view.errors.some(i=>!Number.isInteger(i)||!puzzle.grid[i]))) throw new SharedError('Invalid shared checks.');
  if (view.board !== undefined && view.board !== null && (!Number.isFinite(view.board.scale) || view.board.scale < 1 || view.board.scale > 4 || !Number.isFinite(view.board.x) || !Number.isFinite(view.board.y) || Math.abs(view.board.x) > 20 || Math.abs(view.board.y) > 20)) throw new SharedError('Invalid shared board position.');
  if (view.clueDirection !== undefined && !['across','down'].includes(view.clueDirection)) throw new SharedError('Invalid clue direction.');
  if (view.noticeId !== undefined && !OP_PATTERN.test(view.noticeId)) throw new SharedError('Invalid shared notice.');
  if (view.notice !== undefined && (typeof view.notice !== 'string' || view.notice.length > 200)) throw new SharedError('Invalid shared notice.');
}
export function validateOperation(puzzle, operation) {
  if (!operation || !OP_PATTERN.test(operation.id) || typeof operation.assisted !== 'boolean') throw new SharedError('Invalid shared edit.');
  if (operation.metrics !== undefined && (!operation.metrics || typeof operation.metrics !== 'object' || Array.isArray(operation.metrics) || Object.entries(operation.metrics).some(([key,value])=>!['hints','checks'].includes(key)||value!==1))) throw new SharedError('Invalid solve statistics.');
  validateChanges(puzzle, operation.changes);
  if (operation.view !== undefined) validateView(puzzle, operation.view);
}
export function playWithRoom(play, room) {
  const view = room.view || defaultView(room.puzzle);
  return { ...play, answers:{...room.answers}, assisted:play.assisted || room.assisted, selected:view.selected, entryId:view.entryId };
}
export function changesBetween(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(cell => (before[cell] || '') !== (after[cell] || '')).map(cell => ({ cell, value:after[cell] || '' }));
}
export function applyOperation(room, operation) {
  if (operation.roundId !== undefined && operation.roundId !== roundId(room)) return room;
  const next = { ...room, answers:{...room.answers}, writers:{...room.writers}, view:{...(room.view || defaultView(room.puzzle)), ...operation.view}, assisted:room.assisted || operation.assisted };
  for (const change of operation.changes) {
    if (change.expected !== undefined && next.writers[change.cell] !== change.expected) continue;
    next.answers[change.cell] = change.value;
    next.writers[change.cell] = operation.id;
  }
  return next;
}
export function sharedHistory(history, room, now) {
  const uses = {...history.uses};
  // Worker candidate selection only needs the standard dated ledger shape.
  const day = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Copenhagen',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
  for (const answer of room.usedAnswers || room.puzzle.entries.map(e=>e.answer)) uses[answer] = {at:now, day,game:history.sequence};
  return {...history,uses};
}
