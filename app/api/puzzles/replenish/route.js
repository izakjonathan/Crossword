import {timingSafeEqual} from 'node:crypto';
import {publicationStore} from '../../../../features/publication/store.mjs';
import {noStore,failure} from '../../../../features/publication/http.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
export async function GET(request){
 const expected=process.env.CRON_SECRET,received=request.headers.get('authorization')||'';
 if(!expected||Buffer.byteLength(received)!==Buffer.byteLength('Bearer '+expected)||!timingSafeEqual(Buffer.from(received),Buffer.from('Bearer '+expected)))return Response.json({error:'Unauthorized'},{status:401,headers:noStore});
 try{return Response.json(await publicationStore().replenish({budgetMs:45000,maxAttempts:18}),{headers:noStore});}catch(error){return failure(error);}
}
