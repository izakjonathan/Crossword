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
  return { ...state, entryId: id, selected: entry.cells.find(i => !state.answers[i]) ?? entry.cells[0], overwrite: false };
}
export function nextEntry(puzzle, state, delta = 1) {
  const index = puzzle.entries.findIndex(e => e.id === state.entryId);
  return selectEntry(puzzle, state, puzzle.entries[(index + delta + puzzle.entries.length) % puzzle.entries.length].id);
}
function afterWord(puzzle, state) {
  const index = puzzle.entries.findIndex(e => e.id === state.entryId);
  for (let offset = 1; offset <= puzzle.entries.length; offset++) {
    const e = puzzle.entries[(index + offset) % puzzle.entries.length];
    const empty = e.cells.find(i => !state.answers[i]);
    if (empty !== undefined) return { ...state, entryId: e.id, selected: empty, overwrite: false };
  }
  return { ...state, overwrite: false };
}
function snapshot(state) { return { answers: state.answers, entryId: state.entryId, selected: state.selected, overwrite: state.overwrite, assisted: state.assisted }; }
export function enterText(puzzle, state, text) {
  const letters = text.normalize('NFKD').replace(/[^a-z]/gi, '').toUpperCase();
  if (!letters) return state;
  let next = { ...state, answers: { ...state.answers }, undo: [...(state.undo || []).slice(-99), snapshot(state)] };
  for (const letter of letters) {
    let entry = currentEntry(puzzle, next), index = entry.cells.indexOf(next.selected);
    if (!next.overwrite && next.answers[next.selected]) {
      const empty = entry.cells.slice(index).find(i => !next.answers[i]);
      if (empty === undefined) { next = afterWord(puzzle, next); entry = currentEntry(puzzle, next); index = entry.cells.indexOf(next.selected); if (next.answers[next.selected]) break; }
      else { next.selected = empty; index = entry.cells.indexOf(empty); }
    }
    const explicit = next.overwrite;
    next.answers[next.selected] = letter;
    next.overwrite = false;
    if (explicit && index < entry.cells.length - 1) next.selected = entry.cells[index + 1];
    else {
      const empty = entry.cells.slice(index + 1).find(i => !next.answers[i]);
      if (empty !== undefined) next.selected = empty;
      else {
        const earlier = entry.cells.slice(0, index).find(i => !next.answers[i]);
        if (earlier !== undefined) next.selected = earlier;
        else next = afterWord(puzzle, next);
      }
    }
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
