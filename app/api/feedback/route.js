import {feedbackStore} from '../../../features/feedback/store.mjs';
import {jsonBody,noStore,failure} from '../../../features/publication/http.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request){try{return Response.json(await feedbackStore().record(await jsonBody(request,4000),request.headers.get('x-vercel-forwarded-for')||request.headers.get('x-forwarded-for')?.split(',')[0]||'unknown'),{headers:noStore});}catch(error){return failure(error);}}
