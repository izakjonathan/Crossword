import {parentPort,workerData} from 'node:worker_threads';
import {generatePuzzle} from '../../lib/engine.mjs';
const diagnostics=[];
try{
 const puzzle=generatePuzzle({...workerData,onDiagnostic:entry=>{if(diagnostics.length<40)diagnostics.push(entry);}});
 parentPort.postMessage({puzzle,diagnostics});
}catch(error){parentPort.postMessage({error:{code:error.code||'SEARCH_EXHAUSTED',message:error.message},diagnostics});}
