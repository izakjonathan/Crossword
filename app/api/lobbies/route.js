import { lobbyStore } from '../../../lib/lobby-store.mjs';
import { SharedError } from '../../../lib/shared-model.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store, max-age=0'};
async function respond(fn){try{return Response.json(await fn(),{headers});}catch(error){return Response.json({error:error instanceof SharedError?error.message:'Shared lobbies are temporarily unavailable.'},{status:error instanceof SharedError?error.status:503,headers});}}
export function GET(){return respond(()=>lobbyStore().list());}
export function POST(request){return respond(async()=>{
  const expected=new URL(request.url);expected.host=request.headers.get('host')||expected.host;
  const protocol=request.headers.get('x-forwarded-proto');if(protocol==='http'||protocol==='https')expected.protocol=`${protocol}:`;
  const origin=request.headers.get('origin');if(origin&&origin!==expected.origin)throw new SharedError('Open shared games on this website.',403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw new SharedError('Expected JSON.',415);
  const reader=request.body?.getReader();if(!reader)throw new SharedError('Missing lobby request.');
  const chunks=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>100000){await reader.cancel();throw new SharedError('Lobby request is too large.',413);}chunks.push(value);}
  let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new SharedError('Invalid lobby request.');}
  if(!body||typeof body!=='object')throw new SharedError('Invalid lobby request.');
  const store=lobbyStore();
  if(body.action==='host')return store.host(body.game,body.name,body.playerId,request.headers.get('x-vercel-forwarded-for')||request.headers.get('x-forwarded-for')?.split(',')[0]||'unknown');
  if(body.action==='join')return store.join(body.lobbyId,body.playerId);
  if(body.action==='leave')return store.leave(body.lobbyId,body.playerId);
  throw new SharedError('Unknown lobby action.');
});}
