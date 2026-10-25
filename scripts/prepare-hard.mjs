import {generatePuzzle,validatePuzzle} from '../lib/engine.mjs';
import {writeFileSync,renameSync} from 'node:fs';
const games=[],rounds=[];
for(let seed=0;games.length<64 && seed<256;seed++) {
 try {
 const p=generatePuzzle({mode:'hard',seed:'edited-ready-'+seed,recent:rounds.slice(-5).flat(),deadline:Date.now()+2500});
 if(validatePuzzle(p).length)throw Error('Invalid output');
 games.push(p);rounds.push(p.entries.map(e=>e.answer));

 console.log(games.length,seed);
 }catch(error){if(!/budget|fill/.test(error.message))throw error;}
}
if(games.length<64)throw Error('Insufficient prepared supply');

// Publish only a complete, validated inventory; failed runs leave the old file intact.
const destination=new URL('../lib/prepared-hard.mjs',import.meta.url),temporary=new URL('../lib/prepared-hard.mjs.tmp',import.meta.url);
writeFileSync(temporary,'// CSP-built offline; runtime still checks validation and recent answers.\nexport const PREPARED_HARD='+JSON.stringify(games.map(({grid,...p})=>p))+';\n');
renameSync(temporary,destination);
