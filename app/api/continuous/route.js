import {generateOffThread} from '../../../features/generation/server-worker.mjs';
import {sealCandidate} from '../../../features/publication/checks.mjs';
import {jsonBody,noStore,failure} from '../../../features/publication/http.mjs';
import {sharedStore,roomKey,redisCommand} from '../../../lib/shared-store.mjs';
import {receiptKey} from '../../../features/publication/store.mjs';
import {OP_PATTERN,TOKEN_PATTERN,SharedError,roundId} from '../../../lib/shared-model.mjs';
import {puzzleSignature} from '../../../lib/continuous-history.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function POST(request){
 try{
  const body=await jsonBody(request,250000);
  if(!OP_PATTERN.test(body.requestId||'')||!['easy','medium','hard'].includes(body.mode))throw new SharedError('Invalid puzzle request.');
  if(!Array.isArray(body.recent)||body.recent.length>3000||body.recent.some(a=>!/^[A-Z]{3,11}$/.test(a)))throw new SharedError('Invalid recent answers.');
  if(!Array.isArray(body.signatures)||body.signatures.length>2000||body.signatures.some(s=>typeof s!=='string'||s.length>20000))throw new SharedError('Invalid puzzle history.');
  const token=request.headers.get('authorization')?.replace(/^Bearer /,'');
  let scope='solo',recent=body.recent,signatures=body.signatures;
  if(token){
   if(!TOKEN_PATTERN.test(token))throw new SharedError('Invalid shared game.',401);
   scope=roomKey(token);
   const raw=await redisCommand(['GET',receiptKey(body.requestId)]);
   if(raw){const record=JSON.parse(raw);if(record.scope!==scope||record.mode!==body.mode)throw new SharedError('Request belongs to another game.',409);return Response.json({puzzle:record.puzzle},{headers:noStore});}
   const room=await sharedStore().get(token);
   if(roundId(room)!==body.roundId||room.generating?.id!==body.requestId||room.generating.untilAt<=Date.now())throw new SharedError('Shared generation lease has ended.',409);
   recent=(room.recentRounds||[room.puzzle.entries.map(e=>e.answer)]).slice(-30).flat();
   signatures=room.puzzleSignatures||[puzzleSignature(room.puzzle)];
  }
  const excluded=new Set(recent),seen=new Set(signatures),end=Date.now()+18000;
  for(let attempt=0;attempt<6&&Date.now()<end-200;attempt++){
   let puzzle;
   try{puzzle=await generateOffThread({mode:body.mode,seed:body.requestId+':'+attempt,recent:[...excluded],publication:true,deadline:Math.min(end,Date.now()+3000)});}
   catch(error){if(['SEARCH_TIMEOUT','SEARCH_EXHAUSTED'].includes(error.code))continue;throw error;}
   puzzle={...puzzle,continuityVersion:1};
   const packet=sealCandidate(puzzle,{excluded});
   if(seen.has(packet.digest))continue;
   puzzle={...puzzle,id:'published:'+body.requestId,publication:{requestId:body.requestId,digest:packet.digest,catalogVersion:packet.catalogVersion,quality:packet.report.score}};
   if(token){
    const record={id:body.requestId,mode:body.mode,scope,puzzle,createdAt:Date.now()};
    await redisCommand(['SET',receiptKey(body.requestId),JSON.stringify(record),'NX']);
    const stored=JSON.parse(await redisCommand(['GET',receiptKey(body.requestId)]));
    if(stored.scope!==scope||stored.mode!==body.mode)throw new SharedError('Request belongs to another game.',409);
    puzzle=stored.puzzle;
   }
   return Response.json({puzzle},{headers:noStore});
  }
  throw new SharedError('This grid took too long to fill. Try again. Your current game has been kept.',503);
 }catch(error){return failure(error);}
}
