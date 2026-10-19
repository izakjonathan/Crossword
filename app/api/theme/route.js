import { globalThemeStore } from '../../../lib/global-theme-store.mjs';
import { validateTheme } from '../../../lib/theme.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control':'no-store, max-age=0' };
export async function GET() {
  try { return Response.json(await globalThemeStore().get(), { headers }); }
  catch { return Response.json({ error:'Global colours are temporarily unavailable.' }, { status:503, headers }); }
}
export async function PUT(request) {
  const expected = new URL(request.url);
  expected.host = request.headers.get('host') || expected.host;
  const protocol = request.headers.get('x-forwarded-proto');
  if (protocol === 'http' || protocol === 'https') expected.protocol = `${protocol}:`;
  const origin = request.headers.get('origin');
  if (origin && origin !== expected.origin) return Response.json({ error:'Save colours from this website.' }, { status:403, headers });
  if (!request.headers.get('content-type')?.startsWith('application/json')) return Response.json({ error:'Expected JSON.' }, { status:415, headers });
  let theme;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error('Missing body');
    let size = 0; const chunks = [];
    while (true) {
      const {done,value} = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 1024) { await reader.cancel(); return Response.json({ error:'Colour settings are too large.' }, { status:413, headers }); }
      chunks.push(value);
    }
    theme = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { return Response.json({ error:'Invalid colour settings.' }, { status:400, headers }); }
  const problem = validateTheme(theme);
  if (problem) return Response.json({ error:problem }, { status:400, headers });
  try { return Response.json(await globalThemeStore().save(theme), { headers }); }
  catch { return Response.json({ error:'Could not save colours for everyone. Please try again.' }, { status:503, headers }); }
}
