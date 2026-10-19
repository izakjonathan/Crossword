export function initialState(puzzle) {
  return { answers: {}, entryId: puzzle.entries[0].id, selected: puzzle.entries[0].cells[0], overwrite: false, undo: [], assisted: false };
}
export function currentEntry(puzzle, state) { return puzzle.entries.find(e => e.id === state.entryId) || puzzle.entries[0]; }
export function selectCell(puzzle, state, cell) {
  const options = puzzle.entries.filter(e => e.cells.includes(cell));
  const current = currentEntry(puzzle, state);
  const entry = (state.selected === cell ? options.find(e => e.id !== current.id) : options.find(e => e.dir === current.dir)) || options[0];
  return entry ? { ...state, selected: cell, entryId: entry.id, overwrite: !!state.answers[cell] } : state;
}
export function selectEntry(puzzle, state, id) {
  const entry = puzzle.entries.find(e => e.id === id);
  if (!entry) return state;
  return { ...state, entryId: id, selected: entry.cells[0], overwrite: !!state.answers[entry.cells[0]] };
}
export function nextEntry(puzzle, state, delta = 1) {
  const index = puzzle.entries.findIndex(e => e.id === state.entryId);
  return selectEntry(puzzle, state, puzzle.entries[(index + delta + puzzle.entries.length) % puzzle.entries.length].id);
}
function snapshot(state) { return { answers: state.answers, entryId: state.entryId, selected: state.selected, overwrite: state.overwrite, assisted: state.assisted }; }
export function enterText(puzzle, state, text, options = {}) {
  const letters = text.normalize('NFKD').replace(/[^a-z]/gi, '').toUpperCase();
  if (!letters) return state;
  let next = { ...state, answers: { ...state.answers }, undo: [...(state.undo || []).slice(-99), snapshot(state)] };
  for (const letter of letters) {
    const entry = currentEntry(puzzle, next), index = entry.cells.indexOf(next.selected);
    next.answers[next.selected] = letter;
    // Advance exactly one square, including filled crossings. Stay at the
    // final square until the player chooses a different clue.
    if (options.advanceWord && index === entry.cells.length - 1) next = nextEntry(puzzle, next);
    else next.selected = entry.cells[Math.min(index + 1, entry.cells.length - 1)];
    next.overwrite = !!next.answers[next.selected];
  }
  return next;
}
export function backspace(puzzle, state) {
  const entry = currentEntry(puzzle, state), index = entry.cells.indexOf(state.selected);
  const selected = state.answers[state.selected] ? state.selected : entry.cells[Math.max(0, index - 1)];
  return { ...state, selected, answers: { ...state.answers, [selected]: '' }, overwrite: false, undo: [...(state.undo || []).slice(-99), snapshot(state)] };
}
export function undoInput(state) {
  const undo = state.undo || [];
  return undo.length ? { ...state, ...undo[undo.length - 1], assisted: state.assisted || undo[undo.length - 1].assisted, undo: undo.slice(0, -1) } : state;
}
export function moveCell(puzzle, state, key) {
  const dir = ['ArrowUp', 'ArrowDown'].includes(key) ? 'down' : 'across';
  const entry = puzzle.entries.find(e => e.dir === dir && e.cells.includes(state.selected));
  if (!entry) return state;
  const step = ['ArrowUp', 'ArrowLeft'].includes(key) ? -1 : 1;
  const i = entry.cells.indexOf(state.selected), selected = entry.cells[Math.max(0, Math.min(entry.cells.length - 1, i + step))];
  return { ...state, selected, entryId: entry.id, overwrite: !!state.answers[selected] };
}
export function revealWord(puzzle, state) {
  const answers = { ...state.answers };
  for (const i of currentEntry(puzzle, state).cells) answers[i] = puzzle.grid[i].letter;
  return { ...state, answers, assisted: true, undo: [...(state.undo || []).slice(-99), snapshot(state)] };
}

export function clearWord(puzzle, state) {
  const entry = currentEntry(puzzle, state);
  if (!entry.cells.some(i => state.answers[i])) return state;
  const answers = { ...state.answers };
  for (const i of entry.cells) delete answers[i];
  return { ...state, answers, selected: entry.cells[0], overwrite: false, undo: [...(state.undo || []).slice(-99), snapshot(state)] };
}
export function revealLetter(puzzle, state) {
  return { ...state, answers: { ...state.answers, [state.selected]: puzzle.grid[state.selected].letter }, assisted: true, undo: [...(state.undo || []).slice(-99), snapshot(state)] };
}

export function clearAndAdvance(puzzle,state){
  const entry=currentEntry(puzzle,state),index=entry.cells.indexOf(state.selected);
  return {...state,answers:{...state.answers,[state.selected]:''},selected:entry.cells[Math.min(index+1,entry.cells.length-1)],undo:[...(state.undo||[]).slice(-99),snapshot(state)]};
}
