import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyLedger } from '../lib/repetition.mjs';
test('generation worker preserves request identity and reports validation failures as messages',async()=>{
 const messages=[];globalThis.self={postMessage:message=>messages.push(message)};
 try{
  await import('../lib/puzzle.worker.mjs');
  self.onmessage({data:{requestId:'valid',options:{mode:'easy',seed:'worker-test'}}});
  assert.equal(messages[0].requestId,'valid');assert.ok(messages[0].puzzle.entries.length>10);
  self.onmessage({data:{requestId:'invalid',options:{mode:'nonsense',seed:'x'}}});
  assert.equal(messages[1].requestId,'invalid');assert.ok(messages[1].error);assert.equal(messages[1].puzzle,undefined);
  self.onmessage({data:{requestId:'dated',options:{mode:'easy',seed:'worker-dated',history:emptyLedger(),now:Date.parse('2026-10-19T10:00:00Z')}}});
  assert.equal(messages[2].requestId,'dated');assert.ok(messages[2].puzzle.entries.length>10);
 }finally{delete globalThis.self;}
});
