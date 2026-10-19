import test from 'node:test';
import assert from 'node:assert/strict';
import { GenerationClient } from '../lib/generation-client.mjs';
function setup() {
  const workers = [], timers = new Map(); let nextTimer = 0;
  const client = new GenerationClient(() => {
    const worker = { terminated:false, postMessage(message) { this.sent = message; }, terminate() { this.terminated = true; } };
    workers.push(worker); return worker;
  }, { schedule(fn) { timers.set(++nextTimer, fn); return nextTimer; }, cancel(id) { timers.delete(id); } });
  return { client, workers, timers };
}
test('timeout terminates the active search, rejects it and creates a clean worker for retry', async () => {
  const { client, workers, timers } = setup();
  const pending = client.generate({seed:'first'});
  const rejected = assert.rejects(pending, /too long/);
  [...timers.values()][0](); await rejected;
  assert.equal(workers[0].terminated, true);
  const retry = client.generate({seed:'retry'});
  workers[0].onmessage({data:{requestId:1,puzzle:{id:'stale'}}});
  assert.equal(client.pending.requestId, 2);
  workers[1].onmessage({data:{requestId:2,puzzle:{id:'new'}}});
  assert.deepEqual(await retry, {id:'new'}); assert.equal(timers.size, 0);
  client.dispose();
});
test('worker crashes and disposal reject requests; duplicate requests do not replace the first', async () => {
  const { client, workers } = setup();
  const first = client.generate({});
  await assert.rejects(client.generate({}), /already being generated/);
  const crashed = assert.rejects(first, /stopped unexpectedly/); workers[0].onerror(); await crashed;
  const second = client.generate({}); const disposed = assert.rejects(second, /cancelled/); client.dispose(); await disposed;
  await assert.rejects(client.generate({}), /cancelled/);
});
test('an error response preserves the reusable worker, while malformed responses replace it', async () => {
  const { client, workers } = setup();
  const first = client.generate({}); const badFill = assert.rejects(first, /No fill/);
  workers[0].onmessage({data:{requestId:1,error:'No fill'}}); await badFill;
  const second = client.generate({}); const incomplete = assert.rejects(second, /incomplete/);
  workers[0].onmessage({data:{requestId:2}}); await incomplete; assert.equal(workers[0].terminated, true);
  client.dispose();
});

test('default browser timers are called without the client object as their receiver', async () => {
  const schedule=globalThis.setTimeout, cancel=globalThis.clearTimeout;
  globalThis.setTimeout=function(...args){if(this!==undefined&&this!==globalThis)throw new TypeError('Illegal invocation');return schedule(...args);};
  globalThis.clearTimeout=function(...args){if(this!==undefined&&this!==globalThis)throw new TypeError('Illegal invocation');return cancel(...args);};
  const worker={postMessage(message){this.message=message;},terminate(){}};
  const client=new GenerationClient(()=>worker);
  try{
    const generated=client.generate({});
    worker.onmessage({data:{requestId:worker.message.requestId,puzzle:{id:'browser-timer'}}});
    assert.equal((await generated).id,'browser-timer');
    client.dispose();
  }finally{globalThis.setTimeout=schedule;globalThis.clearTimeout=cancel;}
});

test('a failed worker constructor does not prevent the next request from creating a worker', async () => {
  let attempts=0;const worker={postMessage(message){this.message=message;},terminate(){}};
  const client=new GenerationClient(()=>{if(++attempts===1)throw new Error('Unavailable');return worker;});
  await assert.rejects(client.generate({}), /could not start/);
  const next=client.generate({});worker.onmessage({data:{requestId:worker.message.requestId,puzzle:{id:'retry'}}});
  assert.equal((await next).id,'retry');client.dispose();
});
