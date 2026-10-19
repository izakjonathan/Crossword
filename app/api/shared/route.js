import { sharedStore } from '../../../lib/shared-store.mjs';
import { SharedError, TOKEN_PATTERN } from '../../../lib/shared-model.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control':'private, no-store, max-age=0', 'Referrer-Policy':'no-referrer' };
function tokenFrom(request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!TOKEN_PATTERN.test(token || '')) throw new SharedError('This shared game link is incorrect.', 401);
  return token;
}
async function readBody(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new SharedError('Expected JSON.', 415);
  const reader = request.body?.getReader();
  if (!reader) throw new SharedError('Missing request body.');
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 100000) { await reader.cancel(); throw new SharedError('Shared game request is too large.', 413); }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) { if (error instanceof SharedError) throw error; throw new SharedError('Invalid JSON.'); }
}
function sameOrigin(request) {
  const origin = request.headers.get('origin');
  const expected = new URL(request.url);
  // Next can use an internal hostname in request.url behind its HTTP adapter.
  // Host is the browser-facing authority; Vercel supplies the forwarded scheme.
  expected.host = request.headers.get('host') || expected.host;
  const protocol = request.headers.get('x-forwarded-proto');
  if (protocol === 'http' || protocol === 'https') expected.protocol = `${protocol}:`;
  if (origin && origin !== expected.origin) throw new SharedError('Open the game link on this site to edit.', 403);
}
async function respond(action) {
  try { return Response.json(await action(), { headers }); }
  catch (error) { return Response.json({ error:error instanceof SharedError ? error.message : 'Could not open the shared game. Please try again.' }, { status:error instanceof SharedError ? error.status : 500, headers }); }
}
export function POST(request) {
  return respond(async () => {
    sameOrigin(request);
    const body = await readBody(request);
    return sharedStore().create(body.game, request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown');
  });
}
export function GET(request) { return respond(() => sharedStore().get(tokenFrom(request))); }
export function PATCH(request) {
  return respond(async () => { sameOrigin(request); const token = tokenFrom(request); return sharedStore().patch(token, await readBody(request)); });
}
