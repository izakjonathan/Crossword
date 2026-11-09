import {Worker} from 'node:worker_threads';
import {join} from 'node:path';
import {GenerationError} from './quality.mjs';
// Keep CPU search off the HTTP event loop. Source modules are explicitly
// included in the two function traces by next.config.mjs.
export function generateOffThread(options){
 const {onDiagnostic,...workerData}=options;
 return new Promise((resolve,reject)=>{
  const worker=new Worker(join(process.cwd(),'features/generation/worker.mjs'),{workerData,execArgv:[]});let finished=false;
  const complete=(error,result)=>{if(finished)return;finished=true;clearTimeout(timer);worker.terminate();if(error)reject(error);else resolve(result);};
  const timer=setTimeout(()=>complete(new GenerationError('SEARCH_TIMEOUT','Background generation deadline reached')),Math.max(250,(options.deadline||Date.now()+5000)-Date.now()+250));
  worker.once('message',message=>{for(const entry of message.diagnostics||[])onDiagnostic?.(entry);complete(message.error?new GenerationError(message.error.code,message.error.message):null,message.puzzle);});
  worker.once('error',error=>complete(new GenerationError('WORKER_FAILED',error.message)));
  worker.once('exit',code=>{if(!finished)complete(new GenerationError('WORKER_FAILED','Generation worker exited before returning a puzzle: '+code));});
 });
}
