import {selectCell} from '../../lib/input.mjs';

// Native Scribble supplies text, not ink coordinates. Each input occupies its
// actual grid square, so its index remains stable even if shared selection moves.
export function pencilLetter(value) {
  const text=String(value).trim().toUpperCase();
  return text===''||/^[A-Z]$/.test(text)?text:null;
}
export function writePencilCell(puzzle,state,index,value) {
  const letter=pencilLetter(value);
  if(letter===null||!Number.isInteger(index)||!puzzle.grid[index]||state.answers[index]===letter||(!state.answers[index]&&!letter))return state;
  const selected=state.selected===index?state:selectCell(puzzle,state,index);
  return {...selected,answers:{...state.answers,[index]:letter},overwrite:!!letter,
    undo:[...(state.undo||[]).slice(-99),{answers:state.answers,entryId:state.entryId,selected:state.selected,overwrite:state.overwrite,assisted:state.assisted}]};
}

export function pencilReplacement(previous,text) {
  const inserted=previous&&text.length===2&&text.startsWith(previous)?text.slice(1):text;
  return pencilLetter(inserted);
}
