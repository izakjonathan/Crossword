import {after} from 'next/server.js';
import {publicationStore} from '../../../features/publication/store.mjs';
import {jsonBody,noStore,failure} from '../../../features/publication/http.mjs';
import {TOKEN_PATTERN,SharedError,roundId} from '../../../lib/shared-model.mjs';
import {sharedStore,roomKey} from '../../../lib/shared-store.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function GET(){try{return Response.json(await publicationStore().health(),{headers:noStore});}catch(error){return failure(error);}}
export async function POST(request){
 const store=publicationStore();
 try{
  const body=await jsonBody(request),token=request.headers.get('authorization')?.replace(/^Bearer /,'');let scope='solo';
  if(token){
   if(!TOKEN_PATTERN.test(token))throw new SharedError('Invalid shared game.',401);
   scope=roomKey(token);
   // A lost publication response can retry its receipt after the room changed.
   const previous=await store.receipt(body.requestId);
   if(!previous){const room=await sharedStore().get(token);if(roundId(room)!==body.roundId||room.generating?.id!==body.requestId||room.generating.untilAt<=Date.now())throw new SharedError('This shared generation lease has ended.',409);}
  }
  const puzzle=await store.next({id:body.requestId,mode:body.mode,scope});
  after(async()=>{try{await store.replenish();}catch(error){console.error('Puzzle replenishment failed',error.code||'STORAGE');}});
  return Response.json({puzzle},{headers:noStore});
 }catch(error){
  if(error.code==='SUPPLY_REPLENISHING')after(async()=>{try{await store.replenish();}catch{console.error('Puzzle replenishment retry failed');}});
  return failure(error);
 }
}
