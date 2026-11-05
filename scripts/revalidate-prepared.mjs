// Reconcile cached clue annotations with the active authored bank before release.
import {readFileSync,writeFileSync} from 'node:fs';
import {PREPARED_HARD} from '../lib/prepared-hard.mjs';
import {GENERATION_WORDS} from '../lib/words.mjs';
import {expandPrepared} from '../lib/prepared-supply.mjs';
import {generatePuzzle,validatePuzzle} from '../lib/engine.mjs';
const active=new Map(GENERATION_WORDS.map(w=>[w.answer,w]));
const normalise=p=>({...p,entries:p.entries.map(e=>{
 const w=active.get(e.answer),c=w?.clues.find(c=>c.text===e.clue&&c.level===e.clueLevel);
 if(!c)return null;
 return {...e,clueStyle:c.style,answerForm:c.answerForm,clueRegister:c.register};
})});
const games=PREPARED_HARD.map(normalise).filter(p=>p.entries.every(Boolean)&&!validatePuzzle(expandPrepared(p)).length);
const discarded=PREPARED_HARD.length-games.length;
for(let seed=0;games.length<64&&seed<256;seed++){
 try{const p=generatePuzzle({mode:'hard',seed:'fresh-topup-'+seed,recent:games.slice(-5).flatMap(p=>p.entries.map(e=>e.answer)),deadline:Date.now()+3000});const{grid,...packet}=p;games.push(packet);}catch(error){if(!/budget|fill/.test(error.message))throw error;}
}
if(games.length<64)throw Error('Insufficient valid prepared supply');
if(games.some(p=>validatePuzzle(expandPrepared(p)).length))throw Error('Invalid prepared grid');
writeFileSync(new URL('../lib/prepared-hard.mjs',import.meta.url),'// CSP-built offline; runtime still checks validation and recent answers.\nexport const PREPARED_HARD='+JSON.stringify(games)+';\n');
console.log(JSON.stringify({prepared:games.length,discarded}));
