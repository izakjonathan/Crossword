import test from 'node:test';
import assert from 'node:assert/strict';
import {APPROVED_WORDS,ANSWER_RECORDS} from '../features/editorial/catalog.mjs';
import {CAPITAL_MAX,SPORTS_MAX,popCultureEligibility,topicFlags,validateTopicMix} from '../lib/topic-policy.mjs';
import {READY_PUZZLES} from '../lib/ready-puzzles.mjs';
import {inspectCandidate} from '../features/publication/checks.mjs';
import {validatePuzzle} from '../lib/validate.mjs';

test('pop culture filters actual clue variants, retaining familiar classics and modern work',()=>{
 const clue=(answer,level)=>ANSWER_RECORDS.get(answer).clues.find(c=>c.level===level);
 assert.ok(popCultureEligibility('ELVIS',clue('ELVIS',1)));
 assert.equal(popCultureEligibility('ELVIS',{level:1,text:'An obscure invented biographical clue'}),null);
 assert.equal(popCultureEligibility('BOWIE',{level:3}),null);
 assert.equal(popCultureEligibility('ASTA',{level:1}),null);
 assert.equal(popCultureEligibility('JOR',{level:2}),null);
 assert.equal(popCultureEligibility('UNKNOWN',{level:1}),null);
 assert.equal(popCultureEligibility('EUGENE',clue('EUGENE',2)).year,2010);
 assert.equal(popCultureEligibility('ELSA',clue('ELSA',2)).year,2013);
 assert.equal(popCultureEligibility('MAX',clue('MAX',2)).year,2016);
 assert.equal(ANSWER_RECORDS.get('TRAVIS').answer.status,'quarantined');
 for(const w of APPROVED_WORDS.filter(w=>w.category==='pop-culture'))for(const c of w.clues)assert.ok(popCultureEligibility(w.answer,c),w.answer+': '+c.text);
});
test('topic checks include inverse capitals and sporting acronyms, but ordinary senses remain available',()=>{
 for(const text of ['Country whose capital is Quito','Swiss federal city','Capital of Denmark'])assert.equal(topicFlags([{text}]).capital,true);
 for(const text of ['NBA statistic, abbr.','Basketball statistic counting recovered missed shots','Cricket delivery','Player in a football team','Sport played with a shuttlecock'])assert.equal(topicFlags([{text}]).sports,true);
 assert.deepEqual(topicFlags([{text:'Move a computer pointer across a screen'}]),{capital:false,sports:false});
 const capitals=Array.from({length:CAPITAL_MAX+1},()=>({clue:'Capital of Denmark'}));
 const sports=Array.from({length:SPORTS_MAX+1},()=>({clue:'Football position'}));
 assert.deepEqual(validateTopicMix(capitals),['Too many capital-related answers']);
 assert.deepEqual(validateTopicMix(capitals.map(e=>({...e,topicFlags:{capital:false,sports:false}}))),['Too many capital-related answers']);
 assert.deepEqual(validateTopicMix(sports),['Too many sports answers']);
 assert.deepEqual(validateTopicMix([{clue:'Drinking glass without a stem',topicFlags:{sports:true}}]),[]);
});
test('every ready puzzle obeys the topic limits and publisher derives topics rather than trusting flags',()=>{
 for(const packet of READY_PUZZLES){
  assert.equal(packet.puzzle.topicPolicyVersion,1);assert.deepEqual(validateTopicMix(packet.puzzle.entries),[]);
  assert.deepEqual(validatePuzzle(packet.puzzle),[]);assert.equal(inspectCandidate(packet.puzzle).ok,true);
 }
 const old=structuredClone(READY_PUZZLES[0].puzzle);delete old.topicPolicyVersion;
 assert.ok(inspectCandidate(old).errors.includes('Outdated topic policy'));
});

test('reviewed homographs retain the intended tense, number and part of speech',()=>{
 const meaning=(answer,text)=>{const r=ANSWER_RECORDS.get(answer),c=r.clues.find(c=>c.text===text);assert.ok(c,answer+': '+text);return r.meanings.find(m=>m.id===c.meaningId);};
 assert.equal(meaning('DOES','Performs, in the present tense').grammar.number,'singular');
 assert.equal(meaning('DOES','Female deer').grammar.number,'plural');
 assert.equal(meaning('DOES','Female deer').partOfSpeech,'noun');
 assert.equal(meaning('FELL','Cut down, as a tree').grammar.tense,'base');
 assert.equal(meaning('FELL','Dropped, in the past tense').grammar.tense,'past');
 assert.equal(meaning('MUM','Mother, informally in British English').partOfSpeech,'noun');
 assert.equal(meaning('MUM','Silent, after keep').partOfSpeech,'adjective');
});
