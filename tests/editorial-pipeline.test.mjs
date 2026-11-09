import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG,APPROVED_WORDS,ANSWER_RECORDS} from '../features/editorial/catalog.mjs';
import {normalizeAnswer,validateCatalog,approvedWords,applyReview,REVIEW_CHECKS,clueBrief,checkDraft} from '../features/editorial/schema.mjs';
import {ADDITIONS} from '../data/editorial/additions.mjs';
import {WORDS} from '../lib/words.mjs';
import {loadSession,SESSION_KEY} from '../lib/storage.mjs';
import {initialState} from '../lib/input.mjs';
import {READY_PUZZLES} from '../lib/ready-puzzles.mjs';
import {inspectCandidate,puzzleDigest} from '../features/publication/checks.mjs';
import {fillLayout} from '../lib/grid-fill.mjs';
import {random} from '../lib/engine.mjs';
import {validateGeometry} from '../features/generation/geometry.mjs';
import {extractSlots} from '../lib/grid-layout.mjs';

test('normalization preserves display text and explicitly handles supported Latin spelling',()=>{
 assert.equal(normalizeAnswer('Ice cream'),'ICECREAM');assert.equal(normalizeAnswer('Beyoncé'),'BEYONCE');assert.equal(normalizeAnswer('café-au-lait'),'CAFEAULAIT');
 for(const value of ['A2B','AB','αβγ','hello/world',null])assert.throws(()=>normalizeAnswer(value));
});
test('catalog links every approved answer to distinct meanings, reviewed clues, provenance and revisions',()=>{
 assert.deepEqual(validateCatalog(CATALOG),[]);assert.equal(APPROVED_WORDS.length,1803);assert.equal(ADDITIONS.length,123);
 const retired=new Set(WORDS.map(w=>w.answer));assert.ok(APPROVED_WORDS.every(w=>!retired.has(w.answer)));
 const amp=ANSWER_RECORDS.get('AMP');assert.ok(amp.meanings.length>=2);assert.equal(new Set(amp.clues.map(c=>c.meaningId)).size,amp.clues.length);
 for(const addition of ADDITIONS){const r=ANSWER_RECORDS.get(normalizeAnswer(addition.display));assert.equal(r.answer.flags.legacySemanticAudit,false);assert.ok(r.meanings.every(m=>m.basis==='explicit-meaning'));assert.ok(r.clues.every(c=>c.review.independent===false));}
 const travis=ANSWER_RECORDS.get('TRAVIS');assert.ok(travis.clues.every(c=>!/husband|married/i.test(c.text)));assert.ok(travis.clues.every(c=>c.evidence.includes('reference:TRAVIS')));
});
test('drafts, missing meaning approvals and low-scored answers never enter a generation pool',()=>{
 const catalog=structuredClone(CATALOG);catalog.records=[catalog.records.find(r=>r.answer.grid==='TAYLOR')];
 catalog.records[0].answer.status='draft';assert.equal(approvedWords(catalog).length,0);
 catalog.records[0].answer.status='approved';catalog.records[0].meanings.forEach(m=>m.status='review');assert.equal(approvedWords(catalog).length,0);
 catalog.records[0].meanings.forEach(m=>m.status='approved');catalog.records[0].answer.desirability=20;assert.equal(approvedWords(catalog).length,0);
 catalog.records[0].clues[0].evidence=[];assert.ok(validateCatalog(catalog).length);
});
test('review decisions require explicit rubric answers and retain revision history without altering the original',()=>{
 const record=ANSWER_RECORDS.get('TRAVIS'),original=structuredClone(record);
 assert.throws(()=>applyReview(record,'approve',{reviewer:'Editor',at:'2026-11-09',reason:'Checked'}),/Every editorial check/);
 const next=applyReview(record,'quarantine',{reviewer:'Editor',at:'2026-11-09',reason:'Recheck the meaning'});
 assert.equal(next.answer.status,'quarantined');assert.equal(next.answer.revision,record.answer.revision+1);assert.deepEqual(record,original);
 const approved=applyReview(next,'approve',{reviewer:'Editor',at:'2026-11-09',reason:'Checked all meanings',checks:Object.fromEntries(REVIEW_CHECKS.map(k=>[k,true]))});assert.equal(approved.answer.status,'approved');
});
test('AI drafting briefs pin meaning and grammar; draft checking does not grant approval',()=>{
 const record=ANSWER_RECORDS.get('TAYLOR'),brief=clueBrief(record);assert.ok(brief.meanings.every(m=>m.grammar));assert.match(brief.instructions,/never approval/);
 assert.ok(checkDraft(record,{meaningId:'invented',text:'Something',level:1,explanation:'x',evidenceIds:['x']}).length);
 assert.ok(checkDraft(record,{meaningId:record.meanings[0].id,text:record.clues[0].text,level:1,explanation:'x',evidenceIds:['x']}).length);
 assert.equal(record.answer.status,'approved');
});
test('best-fill selection keeps the clue assignment paired with its chosen words',()=>{
 const layout={slots:[{id:0,cells:[0,1,2],crossings:[]},{id:1,cells:[3,4,5],crossings:[]}]};
 const bank=[{answer:'CAT',editorialScore:100},{answer:'DOG',editorialScore:99},{answer:'OWL',editorialScore:55}];let accepted;
 const result=fillLayout(layout,bank,random('best-fill'),10000,null,words=>{accepted=words.map(w=>w.answer);return true;},Infinity,{scored:true,maxSolutions:100,capture:()=>accepted.slice()});
 assert.deepEqual(new Set(result.words.map(w=>w.answer)),new Set(['CAT','DOG']));assert.deepEqual(result.acceptance,result.words.map(w=>w.answer));assert.ok(result.solutions>1);
});
test('named geometry profiles distinguish partial checking from American all-over interlock',()=>{
 const p=READY_PUZZLES[0].puzzle;assert.deepEqual(validateGeometry(p),[]);assert.ok(validateGeometry(p,'american-15').length);
 const mask=Array(225).fill(true),{slots}=extractSlots(mask,15),full={cols:15,rows:15,grid:mask.map(()=>({letter:'A'})),entries:slots.map(s=>({id:s.id,dir:s.dir,cells:s.cells,answer:'A'.repeat(s.cells.length)}))};
 assert.deepEqual(validateGeometry(full,'american-15'),[]);
});
test('every prepared difficulty passes independent publication checks and excludes the migration snapshot',()=>{
 assert.equal(READY_PUZZLES.length,24);for(const mode of ['easy','medium','hard'])assert.equal(READY_PUZZLES.filter(p=>p.puzzle.mode===mode).length,8);
 for(const packet of READY_PUZZLES){assert.equal(puzzleDigest(packet.puzzle),packet.digest);assert.equal(inspectCandidate(packet.puzzle).ok,true);assert.equal(packet.report.review.humanTestSolved,false);}
});
test('publisher rejects changed clues, unknown IDs and protected answers; canonical digest survives JSON key reordering',()=>{
 const p=structuredClone(READY_PUZZLES[0].puzzle);assert.equal(inspectCandidate(p,{excluded:new Set([p.entries[0].answer])}).ok,false);
 const reordered=Object.fromEntries(Object.entries(p).reverse());assert.equal(puzzleDigest(reordered),puzzleDigest(p));
 p.entries[0].clue='A fabricated clue';assert.equal(inspectCandidate(p).ok,false);
 p.entries[0].clueId='unknown';assert.equal(inspectCandidate(p).ok,false);
});
test('published snapshots remain readable without fetching the latest content catalog',()=>{
 const p=structuredClone(READY_PUZZLES[0].puzzle),game={puzzle:p,play:initialState(p)};
 const loaded=loadSession({getItem:key=>key===SESSION_KEY?JSON.stringify(game):null});assert.equal(loaded.puzzle.entries[0].clueId,p.entries[0].clueId);
});

test('background generation runs off-thread, returns pinned content and honors expired deadlines',async()=>{
 const {generateOffThread}=await import('../features/generation/server-worker.mjs');
 const p=await generateOffThread({mode:'easy',seed:'off-thread-regression',quality:true,deadline:Date.now()+10000});assert.equal(p.editorialVersion,1);
 await assert.rejects(generateOffThread({mode:'easy',seed:'expired-worker',deadline:0}),e=>e.code==='SEARCH_TIMEOUT');
});

test('multiple approved clues at one demand tier are supported without admitting an unchecked draft',()=>{
 const catalog=structuredClone(CATALOG);catalog.records=[catalog.records.find(r=>r.answer.grid==='AMP')];
 const row=catalog.records[0],alternate={...structuredClone(row.clues[0]),id:'clue:AMP:second',text:'Electrical current unit, for short'};
 row.clues.push(alternate);assert.equal(approvedWords(catalog)[0].clues.filter(c=>c.level===1).length,2);
 alternate.status='draft';assert.equal(approvedWords(catalog)[0].clues.filter(c=>c.level===1).length,1);
});
