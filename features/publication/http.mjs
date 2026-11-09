import {SharedError} from '../../lib/shared-model.mjs';
export const noStore={'Cache-Control':'private, no-store, max-age=0'};
export async function jsonBody(request,limit=16000){
 const url=new URL(request.url);url.host=request.headers.get('host')||url.host;
 const protocol=request.headers.get('x-forwarded-proto');if(['http','https'].includes(protocol))url.protocol=protocol+':';
 if(request.headers.get('origin')&&request.headers.get('origin')!==url.origin)throw new SharedError('Open this game on this website.',403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new SharedError('Expected JSON.',415);
 const reader=request.body?.getReader();if(!reader)throw new SharedError('Missing request body.');const chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw new SharedError('Request is too large.',413);}chunks.push(value);}
 try{const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!body||Array.isArray(body)||typeof body!=='object')throw new Error();return body;}catch{throw new SharedError('Invalid JSON.');}
}
export function failure(error){return Response.json({error:error instanceof SharedError?error.message:'Puzzles are temporarily unavailable. Your current game has been kept.',code:error.code||'UNAVAILABLE'},{status:error instanceof SharedError?error.status:503,headers:noStore});}
