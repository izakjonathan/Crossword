import {PREPARED_HARD} from './prepared-hard.mjs';
import {validatePuzzle} from './validate.mjs';
import {GENERATION_WORDS} from './words.mjs';
const approved=new Map(GENERATION_WORDS.map(word=>[word.answer,word]));
export function expandPrepared(packet) {
 const puzzle=structuredClone(packet),grid=Array(puzzle.cols*puzzle.rows).fill(null);
 const starts=[...new Set(puzzle.entries.map(e=>e.cells[0]))].sort((a,b)=>a-b),numbers=new Map(starts.map((cell,i)=>[cell,i+1]));
 for(const entry of puzzle.entries)entry.cells.forEach((cell,i)=>{grid[cell]={letter:entry.answer[i],number:numbers.get(cell)||null};});
 return {...puzzle,grid};
}
export function choosePrepared({seed,history,blocked}) {
 const candidates=PREPARED_HARD.filter(p=>p.entries.every(e=>!blocked.has(e.answer)&&approved.get(e.answer)?.clues.some(c=>c.text===e.clue&&c.level===e.clueLevel)));
 let hash=2166136261;for(const c of seed)hash=Math.imul(hash^c.charCodeAt(0),16777619);
 const offset=(hash>>>0)%Math.max(1,candidates.length);
 const ranked=candidates.map((p,i)=>({p,unseen:p.entries.filter(e=>!history.uses[e.answer]).length,age:p.entries.reduce((n,e)=>n+(history.uses[e.answer]?.game||0),0),tie:(i-offset+candidates.length)%candidates.length})).sort((a,b)=>b.unseen-a.unseen||a.age-b.age||a.tie-b.tie);
 function runway(p) {
  let index=PREPARED_HARD.indexOf(p);
  let rounds=[...(history.recentRounds||[]).slice(-5),p.entries.map(e=>e.answer)].slice(-5);
  for(let step=0;step<5;step++){
   index=index+1<PREPARED_HARD.length?index+1:PREPARED_HARD.length-6;
   const next=PREPARED_HARD[index],protectedWords=new Set(rounds.flat());
   if(next.entries.some(e=>protectedWords.has(e.answer)||!approved.get(e.answer)?.clues.some(c=>c.text===e.clue&&c.level===e.clueLevel)))return false;
   rounds=[...rounds,next.entries.map(e=>e.answer)].slice(-5);
  }
  return true;
 }
 for(const {p} of ranked){if(!runway(p))continue;const puzzle=expandPrepared(p);if(!validatePuzzle(puzzle).length)return {...puzzle,id:puzzle.id+':'+(hash>>>0).toString(36)};}
 return null;
}
