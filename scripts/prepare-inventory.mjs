import {readFileSync,writeFileSync,renameSync} from 'node:fs';
import {generatePuzzle} from '../lib/engine.mjs';
import {READY_PUZZLES} from '../lib/ready-puzzles.mjs';
import {CATALOG,CLUE_RECORDS} from '../features/editorial/catalog.mjs';
import {sealCandidate} from '../features/publication/checks.mjs';
const path=process.argv.find(arg=>arg.startsWith('--history='))?.slice(10),count=Number(process.env.INVENTORY_PER_MODE||8);
const history=path?JSON.parse(readFileSync(path,'utf8')):{answers:[]};
if(!Array.isArray(history.answers)||!Number.isInteger(count)||count<1||count>64)throw Error('Invalid inventory preparation options');
const excluded=new Set(history.answers),packets=[],seen=new Set();
if(process.argv.includes('--reuse'))for(const previous of READY_PUZZLES){
 if(previous.puzzle.mode==='hard'&&process.argv.includes('--refresh-hard'))continue;
 try{const entries=previous.puzzle.entries.map(e=>{const c=CLUE_RECORDS.get(e.clueId)?.clue;if(!c||c.text!==e.clue||c.level!==e.clueLevel)throw Error('Clue changed');return {...e,clueStyle:c.style,answerForm:c.answerForm,clueRegister:c.register};});const next=sealCandidate({...previous.puzzle,catalogVersion:CATALOG.version,entries},{excluded});packets.push(next);seen.add(next.digest);}catch{}
}

for(let round=0;round<count;round++)for(const mode of ['easy','medium','hard']){
 if(packets.filter(p=>p.puzzle.mode===mode).length>round)continue;
 let packet;
 for(let attempt=0;attempt<64&&!packet;attempt++){
  try{
   const recent=new Set(excluded);
   // Pack the first six rounds disjointly where possible; later attempts may
   // overlap unplayed inventory, never the actual protected history.
   if(attempt<4)for(const p of packets)for(const e of p.puzzle.entries)recent.add(e.answer);
   const p=generatePuzzle({mode,seed:`release-ready-${round}-${mode}-${attempt}`,quality:true,recent:[...recent],deadline:Date.now()+1800});
   const next=sealCandidate(p,{excluded});if(!seen.has(next.digest)){packet=next;seen.add(next.digest);}
  }catch(error){if(!['SEARCH_TIMEOUT','SEARCH_EXHAUSTED','NO_ELIGIBLE_ANSWERS','EDITORIAL_REJECTED'].includes(error.code))throw error;}
 }
 if(!packet)throw Error('Could not prepare '+mode+' round '+round+'; previous inventory kept');
 packets.push(packet);console.log(packets.length,mode,packet.report.score);
}
const destination=new URL('../lib/ready-puzzles.mjs',import.meta.url),temporary=new URL('../lib/ready-puzzles.mjs.tmp',import.meta.url);
writeFileSync(temporary,'// Versioned, CSP-built and independently validated before publication.\nexport const READY_PUZZLES='+JSON.stringify(packets)+';\n');renameSync(temporary,destination);
console.log(JSON.stringify({packets:packets.length,protectedAnswers:excluded.size,distinctAnswers:new Set(packets.flatMap(p=>p.puzzle.entries.map(e=>e.answer))).size}));
