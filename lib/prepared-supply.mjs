import {protectedAnswers} from './answer-history.mjs';
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
 blocked=new Set([...blocked,...protectedAnswers(history)]);
 const active=PREPARED_HARD.filter(p=>p.entries.every(e=>approved.get(e.answer)?.clues.some(c=>c.text===e.clue&&c.level===e.clueLevel)));
 const candidates=active.filter(p=>p.entries.every(e=>!blocked.has(e.answer)));
 let hash=2166136261;for(const c of seed)hash=Math.imul(hash^c.charCodeAt(0),16777619);
 const offset=(hash>>>0)%Math.max(1,candidates.length);
 const ranked=candidates.map((p,i)=>({p,unseen:p.entries.filter(e=>!history.uses[e.answer]).length,age:p.entries.reduce((n,e)=>n+(history.uses[e.answer]?.game||0),0),tie:(i-offset+candidates.length)%candidates.length})).sort((a,b)=>b.unseen-a.unseen||a.age-b.age||a.tie-b.tie);
 function runway(p) {
  // A fixed neighbouring packet sequence can reject a perfectly viable grid
  // after mixed-mode play. Search bounded alternative continuations instead.
  const rounds=[...(history.recentRounds||[]).slice(-5),p.entries.map(e=>e.answer)].slice(-5);
  let visits=0;
  const failed=new Set();
  function continueFrom(rounds,left){
   if(!left)return true;
   if(++visits>4096)return false;
   const key=left+':'+rounds.map(r=>r.join(',')).join(';');
   if(failed.has(key))return false;
   const protectedWords=new Set([...blocked,...rounds.flat()]);
   for(const next of active){
    const answers=next.entries.map(e=>e.answer);
    if(answers.some(answer=>protectedWords.has(answer)))continue;
    if(continueFrom([...rounds,answers].slice(-5),left-1))return true;
    if(visits>4096)break;
   }
   failed.add(key);return false;
  }
  return continueFrom(rounds,5);
 }
 for(const {p} of ranked){if(!runway(p))continue;const puzzle=expandPrepared(p);if(!validatePuzzle(puzzle).length)return {...puzzle,id:puzzle.id+':'+(hash>>>0).toString(36)};}
 // Continuation is a preference, not a reason to withhold a legal current grid.
 for(const {p} of ranked){const puzzle=expandPrepared(p);if(!validatePuzzle(puzzle).length)return {...puzzle,id:puzzle.id+':'+(hash>>>0).toString(36)};}
 return null;
}
