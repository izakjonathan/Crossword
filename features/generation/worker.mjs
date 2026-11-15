import {parentPort,workerData} from 'node:worker_threads';
import {generatePuzzle,random} from '../../lib/engine.mjs';
import {READY_PUZZLES} from '../../lib/ready-puzzles.mjs';
const diagnostics=[];
const options={...workerData,onDiagnostic:entry=>{if(diagnostics.length<40)diagnostics.push(entry);}};

function generateForRefill(options) {
 if(!options.reuseLayouts||options.template||!Number.isFinite(options.deadline))return generatePuzzle(options);
 const masks=new Map();
 for(const {puzzle} of READY_PUZZLES){
  if(puzzle.mode!==options.mode)continue;
  const mask=puzzle.grid.map(Boolean);
  masks.set(mask.map(Number).join(''),mask);
 }
 const rng=random(options.seed);
 const layouts=[...masks.values()].map(mask=>({mask,rank:rng()})).sort((a,b)=>a.rank-b.rank);
 const started=Date.now(),budget=options.deadline-started;
 const layoutEnd=started+Math.floor(budget*.7);
 const slice=options.mode==='hard'?850:450;
 for(const {mask} of layouts){
  const now=Date.now();
  if(now+100>=layoutEnd)break;
  try {
   return generatePuzzle({...options,template:{mask},deadline:Math.min(layoutEnd,now+slice)});
  } catch(error) {
   if(!['SEARCH_TIMEOUT','SEARCH_EXHAUSTED'].includes(error.code))throw error;
  }
 }
 return generatePuzzle(options);
}

try{
 const puzzle=generateForRefill(options);
 parentPort.postMessage({puzzle,diagnostics});
}catch(error){parentPort.postMessage({error:{code:error.code||'SEARCH_EXHAUSTED',message:error.message},diagnostics});}
