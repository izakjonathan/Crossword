import {isAbbreviation} from '../../lib/word-mix.mjs';
export function fillScore(words) {
 const n=Math.max(1,words.length),subjects=new Set(words.map(w=>w.subject||w.category));
 const roots=words.map(w=>w.answer.replace(/(?:ING|ED|ES|S)$/,''));
 return words.reduce((sum,w)=>sum+(w.editorialScore??70),0)/n - words.filter(isAbbreviation).length*12/n - (roots.length-new Set(roots).size)*4 + subjects.size;
}
export function puzzleScore(puzzle) {
 const n=puzzle.entries.length;
 return Number((puzzle.entries.reduce((sum,e)=>sum+(e.editorialScore??70),0)/n - puzzle.entries.filter(e=>e.answerStyle==='abbreviation').length*12/n + new Set(puzzle.entries.map(e=>e.subject||e.category)).size).toFixed(3));
}
export class GenerationError extends Error {constructor(code,message,details={}){super(message);this.name='GenerationError';this.code=code;this.details=details;}}
