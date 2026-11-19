import test from 'node:test';
import assert from 'node:assert/strict';
import {rollingHistory,puzzleSignature} from '../lib/continuous-history.mjs';
import {protectedAnswers} from '../lib/answer-history.mjs';
import {recordPuzzle,emptyLedger} from '../lib/repetition.mjs';
import {POST} from '../app/api/continuous/route.js';
import {inspectCandidate} from '../features/publication/checks.mjs';
import {randomUUID} from 'node:crypto';

test('continuous policy retains archives and reconstructs recent history during migration',()=>{
 const history={...emptyLedger(),sequence:40,uses:{OLD:{game:1},NEW:{game:40}},excludedAnswers:['OLD','NEW'],recentRounds:[['NEW','NOW']]};
 const rolling=rollingHistory(history);
 assert.deepEqual(rolling.excludedAnswers,history.excludedAnswers);
 assert.equal(protectedAnswers(rolling).has('OLD'),false);
 assert.equal(protectedAnswers(rolling).has('NOW'),true);
 assert.equal(protectedAnswers(rolling).has('NEW'),true);
 const group=rollingHistory(history,{recentRounds:[['CAT']],puzzle:{entries:[]}});
 assert.deepEqual([...protectedAnswers(group)],['CAT']);
});

test('continuous HTTP generation rejects malformed history',async()=>{
 const response=await POST(new Request('https://example.com/api/continuous',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({requestId:randomUUID(),mode:'hard',recent:['bad'],signatures:[]})}));
 assert.equal(response.status,400);
});

test('100 consecutive games pass the real route, publication validation and migrated ledger', {timeout:180000},async()=>{
 let history={...emptyLedger(),excludedAnswers:['CAT'],recentRounds:[]};
 const signatures=new Set();
 for(let i=0;i<100;i++){
  history=rollingHistory(history);
  const mode=i%2?'hard':'medium',recent=[...protectedAnswers(history)];
  const response=await POST(new Request('https://example.com/api/continuous',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({requestId:randomUUID(),mode,recent,signatures:[...signatures]})}));
  const result=await response.json();
  assert.equal(response.status,200,JSON.stringify(result));
  assert.equal(inspectCandidate(result.puzzle,{excluded:new Set(recent)}).ok,true);
  assert.equal(signatures.has(puzzleSignature(result.puzzle)),false);
  signatures.add(puzzleSignature(result.puzzle));
  history=recordPuzzle(history,result.puzzle,Date.now());
  assert.ok(history.excludedAnswers.includes('CAT'));
  assert.ok(history.recentRounds.length<=30);
 }
 assert.equal(signatures.size,100);
 assert.equal(history.sequence,100);
});

test('continuous solo feedback validates its snapshot without a stored publication receipt',async()=>{
 const {READY_PUZZLES}=await import('../lib/ready-puzzles.mjs');
 const {feedbackStore}=await import('../features/feedback/store.mjs');
 const {puzzleDigest}=await import('../features/publication/checks.mjs');
 const id=randomUUID(),puzzle={...structuredClone(READY_PUZZLES[0].puzzle),continuityVersion:1};
 puzzle.publication={requestId:id,digest:puzzleDigest(puzzle)};
 const store=feedbackStore(async()=>1,{publications:{receipt:async()=>null}});
 assert.deepEqual(await store.record({eventId:randomUUID(),publicationId:id,puzzle,kind:'hint',clueId:puzzle.entries[0].clueId}),{saved:true});
 const corrupt=structuredClone(puzzle);corrupt.entries[0].clue='Invented clue';
 await assert.rejects(store.record({eventId:randomUUID(),publicationId:id,puzzle:corrupt,kind:'hint',clueId:puzzle.entries[0].clueId}));
});
