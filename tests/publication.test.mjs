import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {publicationStore,receiptKey,inventoryKey} from '../features/publication/store.mjs';
import {READY_PUZZLES} from '../lib/ready-puzzles.mjs';
import {PublishedPuzzleClient} from '../features/publication/client.mjs';
import {GLOBAL_ANSWERS_KEY} from '../lib/answer-history.mjs';
import {sharedStore,roomKey} from '../lib/shared-store.mjs';
import {initialState} from '../lib/input.mjs';
import {feedbackStore,METRICS_KEY,calibrationReport} from '../features/feedback/store.mjs';
import {redisTestCommand} from './helpers/redis.mjs';
import {GET as replenish} from '../app/api/puzzles/replenish/route.js';
import {POST as nextPuzzle} from '../app/api/puzzles/route.js';
const cli=process.env.REDIS_TEST_CLI;

test('default puzzle transport calls fetch without a client receiver',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async function(url,options){
  assert.equal(this,undefined,'browser fetch must not receive the puzzle client as its receiver');
  const body=JSON.parse(options.body);
  return Response.json({puzzle:{publication:{requestId:body.requestId}}});
 };
 try{await new PublishedPuzzleClient().generate({mode:'hard'});}
 finally{globalThis.fetch=original;}
});

test('published client retries a lost response with the same identity and rejects malformed receipts',async()=>{
 const requests=[];const client=new PublishedPuzzleClient({fetcher:async(url,options)=>{const body=JSON.parse(options.body);requests.push(body);if(requests.length===1)throw Error('Lost');return Response.json({puzzle:{publication:{requestId:body.requestId}}});}});
 await client.generate({mode:'easy'});assert.deepEqual(requests[0],requests[1]);assert.equal(client.pending,null);client.dispose();await assert.rejects(client.generate({mode:'easy'}),/cancelled/);
 const invalid=new PublishedPuzzleClient({fetcher:async()=>Response.json({puzzle:{}})});await assert.rejects(invalid.generate({mode:'easy'}),/invalid receipt/);
});
test('new-game and scheduled routes reject invalid requests and missing scheduler authorization',async()=>{
 assert.equal((await replenish(new Request('https://example.com/api/puzzles/replenish'))).status,401);
 const request=(body,headers={})=>new Request('https://example.com/api/puzzles',{method:'POST',headers:{'content-type':'application/json',...headers},body});
 assert.equal((await nextPuzzle(request('{}',{origin:'https://elsewhere.com'}))).status,403);
 assert.equal((await nextPuzzle(request('x'.repeat(16001)))).status,413);
 assert.equal((await nextPuzzle(request('{}'))).status,400);
});
test('calibration flags sufficient-sample outliers without automatically changing any clue',()=>{
 const records=calibrationReport({'clue:clue:CAT:123:check':30,'clue:clue:CAT:123:wrong':20,'clue:clue:CAT:123:hint':10});assert.equal(records[0].needsReview,true);assert.equal(records[0].status,'provisional');
 assert.equal(calibrationReport({'clue:x:check':2})[0].status,'insufficient-sample');
});
test('real Redis serves only ready puzzles, reserves answers once and retries exactly the same immutable publication',{skip:!cli},async()=>{
 const command=redisTestCommand(),store=publicationStore(command),id=randomUUID();
 const [a,b]=await Promise.all([store.next({id,mode:'easy'}),store.next({id,mode:'easy'})]);assert.deepEqual(a,b);
 assert.equal(await command(['TTL',GLOBAL_ANSWERS_KEY]),-1);assert.equal(await command(['TTL',receiptKey(id)]),-1);
 const next=await store.next({id:randomUUID(),mode:'easy'});assert.ok(next.entries.every(e=>!a.entries.some(other=>other.answer===e.answer)));
 await assert.rejects(store.next({id,mode:'hard'}),e=>e.status===409);
 assert.equal((await store.verify(a,{id,scope:'solo'})).id,id);
 await assert.rejects(store.verify({...a,entries:a.entries.map((e,i)=>i?e:{...e,clue:'changed'})},{id,scope:'solo'}),e=>e.status===409);
});
test('real Redis coordinates competing publications, prepared depletion and restart-safe refills',{skip:!cli},async()=>{
 const command=redisTestCommand(),store=publicationStore(command,{seedPackets:[]});let sequence=0;
 const generator=({mode})=>structuredClone(READY_PUZZLES.find(p=>p.puzzle.mode===mode).puzzle);
 const filling=publicationStore(command,{seedPackets:[],generate:generator});
 const report=await filling.replenish({target:1,maxAttempts:3});assert.equal(report.created,3);
 const health=await store.health();assert.deepEqual(health.ready,{easy:1,medium:1,hard:1});
 const results=await Promise.allSettled([store.next({id:randomUUID(),mode:'easy'}),store.next({id:randomUUID(),mode:'easy'})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 await assert.rejects(store.next({id:randomUUID(),mode:'easy'}),e=>e.code==='SUPPLY_REPLENISHING');
 assert.ok(await command(['HLEN',inventoryKey])>=1);
});
test('real Redis attaches a published next game to the same shared room and prevents stale content changes',{skip:!cli},async()=>{
 const command=redisTestCommand(),store=publicationStore(command),rooms=sharedStore(command);
 const original=READY_PUZZLES.find(p=>p.puzzle.mode==='easy').puzzle,{token}=await rooms.create({puzzle:original,play:initialState(original)},randomUUID());
 const lease=randomUUID(),base=original.id;await rooms.patch(token,{id:lease,kind:'begin',roundId:base,changes:[],assisted:false});
 const p=await store.next({id:lease,mode:'hard',scope:roomKey(token)});await store.verify(p,{id:lease,scope:roomKey(token)});
 const operation={id:randomUUID(),kind:'replace',roundId:base,leaseId:lease,puzzle:p,changes:[],assisted:false};
 const updated=await rooms.patch(token,operation),retry=await rooms.patch(token,operation);assert.equal(updated.roundId,operation.id);assert.deepEqual(updated,retry);assert.equal(updated.puzzle.id,p.id);
 const loaded=await rooms.get(token);assert.equal(loaded.puzzle.entries[0].clueId,p.entries[0].clueId);assert.ok(await command(['TTL',roomKey(token)])>0);
});
test('real Redis stores clue feedback and aggregate metrics idempotently with no typed letters or player identity',{skip:!cli},async()=>{
 const command=redisTestCommand(),publications=publicationStore(command),p=await publications.next({id:randomUUID(),mode:'easy'}),store=feedbackStore(command,{publications}),eventId=randomUUID();
 const event={eventId,publicationId:p.publication.requestId,clueId:p.entries[0].clueId,kind:'report',reason:'wording',comment:'This could be clearer.'};
 await store.record(event,'test');await store.record(event,'test');
 assert.equal(Number(await command(['HGET',METRICS_KEY,`clue:${p.entries[0].clueId}:report`])),1);
 const raw=await command(['GET',`crossword:clue-report:v1:${eventId}`]);assert.ok(!raw.includes('test'));assert.ok(raw.includes('wording'));
 await assert.rejects(store.record({...event,eventId:randomUUID(),clueId:'invented'},'test'),e=>e.status===400);
});

test('client waits for background supply with the original request ID instead of starting another game',async()=>{
 const bodies=[],client=new PublishedPuzzleClient({fetcher:async(url,options)=>{const body=JSON.parse(options.body);bodies.push(body);return bodies.length===1?Response.json({error:'Preparing',code:'SUPPLY_REPLENISHING'},{status:503}):Response.json({puzzle:{publication:{requestId:body.requestId}}});}});
 await client.generate({mode:'hard'});assert.equal(bodies.length,2);assert.deepEqual(bodies[0],bodies[1]);
});
test('real Redis plans mixed-mode selections to preserve a second Hard game without immediate refill',{skip:!cli},async()=>{
 const command=redisTestCommand(),store=publicationStore(command),answers=new Set();
 for(const mode of ['easy','medium','hard','hard']){const p=await store.next({id:randomUUID(),mode});assert.ok(p.entries.every(e=>!answers.has(e.answer)));p.entries.forEach(e=>answers.add(e.answer));}
});
