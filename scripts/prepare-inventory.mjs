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
// A stock count alone is misleading when every packet shares the same answer.
// The default rebuild starts with two answer-disjoint Hard games, then two of
// each smaller mode, all mutually disjoint. Later stock may overlap unplayed
// stock; it can never overlap actual permanent history.
const plan=[];
for(let round=0;round<Math.min(2,count);round++)plan.push(['hard',round]);
for(let round=0;round<Math.min(2,count);round++)for(const mode of ['easy','medium'])plan.push([mode,round]);
for(let round=0;round<count;round++)for(const mode of ['easy','medium','hard'])plan.push([mode,round]);
for(const [mode,round]of plan){
 if(packets.filter(p=>p.puzzle.mode===mode).length>round)continue;
 let packet;const startup=packets.length<Math.min(6,count*3);
 for(let attempt=0;attempt<64&&!packet;attempt++){
  try{
   const recent=new Set(excluded);
   if(startup||attempt<4)for(const p of packets)for(const e of p.puzzle.entries)recent.add(e.answer);
   const p=generatePuzzle({mode,seed:`release-ready-${round}-${mode}-${attempt}`,quality:true,recent:[...recent],deadline:Date.now()+Number(process.env.INVENTORY_ATTEMPT_MS||8000)});
   const next=sealCandidate(p,{excluded});if(!seen.has(next.digest)){packet=next;seen.add(next.digest);}
  }catch(error){if(!['SEARCH_TIMEOUT','SEARCH_EXHAUSTED','NO_ELIGIBLE_ANSWERS','EDITORIAL_REJECTED'].includes(error.code))throw error;}
 }
 if(!packet)throw Error('Could not prepare '+mode+' round '+round+'; previous inventory kept');
 packets.push(packet);console.log(packets.length,mode,packet.report.score);
}
const destination=new URL('../lib/ready-puzzles.mjs',import.meta.url),temporary=new URL('../lib/ready-puzzles.mjs.tmp',import.meta.url);
writeFileSync(temporary,'// Versioned, CSP-built and independently validated before publication.\nexport const READY_PUZZLES='+JSON.stringify(packets)+';\n');renameSync(temporary,destination);
console.log(JSON.stringify({packets:packets.length,protectedAnswers:excluded.size,distinctAnswers:new Set(packets.flatMap(p=>p.puzzle.entries.map(e=>e.answer))).size}));
