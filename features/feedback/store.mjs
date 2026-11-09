import {createHash} from 'node:crypto';
import {redisCommand} from '../../lib/shared-store.mjs';
import {OP_PATTERN,SharedError} from '../../lib/shared-model.mjs';
import {publicationStore} from '../publication/store.mjs';
export const METRICS_KEY='crossword:quality-metrics:v1';
export const EVENTS_SCRIPT=`
if redis.call('EXISTS',KEYS[2])==1 then return 0 end
local count=redis.call('INCR',KEYS[3]);if count==1 then redis.call('EXPIRE',KEYS[3],3600) end
if count>120 then return -1 end
redis.call('SET',KEYS[2],'1','EX',604800)
for i=1,#ARGV,2 do redis.call('HINCRBY',KEYS[1],ARGV[i],tonumber(ARGV[i+1])) end
return 1
`;
const reasons=['incorrect','ambiguous','wording','difficulty','other'];
export function feedbackStore(command=redisCommand,{publications=publicationStore(command)}={}){
 return {
  async record(body,address='unknown'){
   if(!OP_PATTERN.test(body.eventId||'')||!OP_PATTERN.test(body.publicationId||'')||!['check','hint','complete','pause','report'].includes(body.kind))throw new SharedError('Invalid clue feedback.');
   const receipt=await publications.receipt(body.publicationId);if(!receipt)throw new SharedError('This puzzle is not available for feedback.',404);
   const entry=receipt.puzzle.entries.find(e=>e.clueId===body.clueId);
   if(!['complete','pause'].includes(body.kind)&&!entry)throw new SharedError('Unknown clue.');
   if(body.kind==='report'&&(!reasons.includes(body.reason)||typeof body.comment!=='string'||body.comment.length>400||/[\u0000-\u0008]/.test(body.comment)))throw new SharedError('Choose a feedback reason and use at most 400 characters.');
   const scope=entry?`clue:${entry.clueId}`:`mode:${receipt.mode}`,args=[`${scope}:${body.kind}`,1];
   if(body.kind==='check'){
    if(!Number.isInteger(body.wrong)||body.wrong<0||body.wrong>receipt.puzzle.grid.length)throw new SharedError('Invalid check count.');
    args.push(`${scope}:wrong`,body.wrong);
   }
   if(body.kind==='complete'){
    if(!Number.isFinite(body.activeSeconds)||body.activeSeconds<0||body.activeSeconds>604800)throw new SharedError('Invalid active time.');
    args.push(`${scope}:activeSeconds`,Math.round(body.activeSeconds));
   }
   const rate=createHash('sha256').update(address).digest('hex'),result=await command(['EVAL',EVENTS_SCRIPT,3,METRICS_KEY,`crossword:quality-event:v1:${body.eventId}`,`crossword:quality-rate:v1:${rate}`,...args]);
   if(result<0)throw new SharedError('Too much feedback sent. Try again later.',429);
   if(body.kind==='report'){
    // Idempotent write also repairs a comment write interrupted after metrics.
    await command(['SET',`crossword:clue-report:v1:${body.eventId}`,JSON.stringify({clueId:entry.clueId,catalogVersion:receipt.puzzle.catalogVersion,reason:body.reason,comment:body.comment.trim(),at:new Date().toISOString()}),'EX',2592000,'NX']);
   }
   return {saved:true};
  }
 };
}
export function calibrationReport(metrics,{minimumChecks=20}={}){
 if(Array.isArray(metrics)){const object={};for(let i=0;i<metrics.length;i+=2)object[metrics[i]]=Number(metrics[i+1]);metrics=object;}
 const ids=new Set(Object.keys(metrics).filter(k=>k.startsWith('clue:')).map(k=>k.slice(5,k.lastIndexOf(':'))));
 return [...ids].map(clueId=>{const value=key=>Number(metrics[`clue:${clueId}:${key}`]||0),checks=value('check'),reports=value('report'),wrong=value('wrong'),hints=value('hint');return {clueId,checks,reports,hints,wrong,needsReview:reports>=3||(checks>=minimumChecks&&(wrong/checks>.5||hints/checks>.3)),status:checks<minimumChecks?'insufficient-sample':'provisional',note:'Review flag only. These public, observational events do not automatically change difficulty or certify an error.'};});
}
