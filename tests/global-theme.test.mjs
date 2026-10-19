import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { DEFAULT_THEME } from '../lib/theme.mjs';
import { GlobalThemeClient } from '../lib/global-theme-client.mjs';
import { globalThemeStore, GLOBAL_THEME_KEY } from '../lib/global-theme-store.mjs';
import { GET, PUT } from '../app/api/theme/route.js';
const light={background:'#ffffff',content:'#123456'},dark={background:'#123456',content:'#ffffff'};
const client=(request,onTheme=()=>{})=>new GlobalThemeClient({request,onTheme,schedule:()=>0,cancel:()=>{}});

test('two independent clients receive the global save and fresh clients load it without a local palette',async()=>{
  let value={theme:DEFAULT_THEME,revision:0};
  const request=async(method,theme)=>{if(method==='PUT')value={theme,revision:value.revision+1};return structuredClone(value);};
  let aTheme,bTheme;const a=client(request,t=>aTheme=t),b=client(request,t=>bTheme=t);
  await a.refresh();await b.refresh();await a.save(dark);await b.refresh();assert.deepEqual(aTheme,dark);assert.deepEqual(bTheme,dark);
  const fresh=client(request);await fresh.refresh();assert.deepEqual(fresh.current.theme,dark);
});
test('stale polls cannot overwrite a completed save and the most recent server revision wins',async()=>{
  const values=[],a=client(async()=>({theme:dark,revision:5}),t=>values.push(t));
  a.accept({theme:light,revision:1});await a.save(dark);a.accept({theme:light,revision:2});
  assert.deepEqual(a.current,{theme:dark,revision:5});assert.equal(values.length,2);
  a.accept({theme:light,revision:6});assert.deepEqual(a.current.theme,light);
});
test('failed saves reject without changing the saved palette; a stopped client ignores late responses',async()=>{
  const a=client(async()=>{throw new Error('Offline');});a.accept({theme:light,revision:1});
  await assert.rejects(a.save(dark),/Offline/);await a.refresh();assert.deepEqual(a.current.theme,light);
  let emit=0;const b=client(async()=>({theme:dark,revision:2}),()=>emit++);b.stop();b.accept({theme:dark,revision:2});assert.equal(emit,0);
  await assert.rejects(a.save({background:'#ffffff',content:'#ffffff'}),/similar/);
});
test('new database has a readable default; saved palette is normalised and never expires',async()=>{
  const commands=[];const store=globalThemeStore(async command=>{commands.push(command);if(command[0]==='GET')return null;return JSON.stringify({theme:light,revision:1});});
  assert.deepEqual(await store.get(),{theme:DEFAULT_THEME,revision:0});await store.save({background:'#FFFFFF',content:'#123456'});
  assert.equal(commands[1][0],'EVAL');assert.deepEqual(JSON.parse(commands[1].at(-1)),light);
  await assert.rejects(store.save({background:'#ffffff',content:'#ffffff'}),/similar/);
});
test('theme API rejects cross-origin saves, invalid/low-contrast palettes, malformed JSON and oversized bodies',async()=>{
  const request=(body,headers={})=>new Request('https://example.com/api/theme',{method:'PUT',headers:{'content-type':'application/json',...headers},body});
  assert.equal((await PUT(request(JSON.stringify(light),{origin:'https://other.example'}))).status,403);
  assert.equal((await PUT(request(JSON.stringify({background:'#ffffff',content:'#ffffff'})))).status,400);
  assert.equal((await PUT(request('{broken'))).status,400);
  assert.equal((await PUT(request('x'.repeat(1025)))).status,413);
  assert.equal((await PUT(request('{}',{'content-type':'text/plain'}))).status,415);
});
test('unauthenticated theme API saves through the server-only Redis credentials and returns fresh shared values',async()=>{
  const keys=['UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','KV_REST_API_URL','KV_REST_API_TOKEN'],old=keys.map(k=>process.env[k]),originalFetch=globalThis.fetch;
  keys.forEach(k=>delete process.env[k]);process.env.KV_REST_API_URL='https://test.invalid';process.env.KV_REST_API_TOKEN='test-secret';let stored;
  globalThis.fetch=async(url,options)=>{assert.equal(options.headers.Authorization,'Bearer test-secret');const command=JSON.parse(options.body);if(command[0]==='EVAL')stored=JSON.stringify({theme:JSON.parse(command.at(-1)),revision:1});return Response.json({result:stored||null});};
  try{
    const initial=await GET();assert.deepEqual((await initial.json()).theme,DEFAULT_THEME);
    const saved=await PUT(new Request('http://internal/api/theme',{method:'PUT',headers:{host:'example.com',origin:'https://example.com','x-forwarded-proto':'https','content-type':'application/json'},body:JSON.stringify(dark)}));
    assert.equal(saved.status,200);assert.deepEqual((await saved.json()).theme,dark);
    const read=await GET();assert.deepEqual((await read.json()).theme,dark);assert.equal(read.headers.get('cache-control'),'no-store, max-age=0');
  }finally{globalThis.fetch=originalFetch;keys.forEach((k,i)=>{if(old[i]===undefined)delete process.env[k];else process.env[k]=old[i];});}
});
test('real Redis global palette persists, increments revisions atomically and has no TTL',{skip:!process.env.REDIS_TEST_CLI},async()=>{
  const command=async args=>JSON.parse(execFileSync(process.env.REDIS_TEST_CLI,['-p',process.env.REDIS_TEST_PORT||'6397','--json',...args.map(String)],{encoding:'utf8'}));
  const store=globalThemeStore(command);
  try{
    await command(['DEL',GLOBAL_THEME_KEY]);assert.equal((await store.get()).revision,0);
    const saved=await Promise.all([store.save(light),store.save(dark)]);assert.deepEqual(saved.map(v=>v.revision).sort(),[1,2]);
    const latest=await store.get();assert.equal(latest.revision,2);assert.equal(await command(['TTL',GLOBAL_THEME_KEY]),-1);assert.deepEqual(latest.theme,dark);
  }finally{await command(['DEL',GLOBAL_THEME_KEY]);}
});
