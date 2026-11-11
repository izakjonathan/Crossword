import {TOPIC_POLICY_VERSION,popCultureEligibility,topicFlags,validateTopicMix} from '../../lib/topic-policy.mjs';
import {createHash} from 'node:crypto';
import {validatePuzzle} from '../../lib/validate.mjs';
import {CATALOG,CLUE_RECORDS} from '../editorial/catalog.mjs';
import {clueSetErrors} from '../../lib/word-quality.mjs';
import {validateGeometry} from '../generation/geometry.mjs';
import {puzzleScore} from '../generation/quality.mjs';
function canonical(value){return Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;}
export function puzzleDigest(puzzle){
 const {publication,id,...content}=puzzle;
 return createHash('sha256').update(JSON.stringify(canonical(content))).digest('hex');
}
export function inspectCandidate(puzzle,{excluded=new Set(),catalogVersion=CATALOG.version}={}) {
 const errors=validatePuzzle(puzzle);
 if(errors.length)return {ok:false,errors,score:0};
 errors.push(...validateGeometry(puzzle));
 if(puzzle.topicPolicyVersion!==TOPIC_POLICY_VERSION)errors.push('Outdated topic policy');
 const authoritativeEntries=puzzle.entries.map(e=>{return {...e,topicFlags:topicFlags([{text:CLUE_RECORDS.get(e.clueId)?.clue.text||e.clue}])};});
 errors.push(...validateTopicMix(authoritativeEntries,puzzle.mode));
 for(const e of puzzle.entries)if(e.category==='pop-culture'&&!popCultureEligibility(e.answer,{level:e.clueLevel,text:e.clue}))errors.push('Pop-culture clue outside audience policy');
 if(puzzle.editorialVersion!==1||puzzle.catalogVersion!==catalogVersion)errors.push('Outdated editorial catalog');
 errors.push(...clueSetErrors(puzzle.entries));
 for(const entry of puzzle.entries){
  const linked=CLUE_RECORDS.get(entry.clueId);
  if(!linked||linked.record.answer.status!=='approved'||linked.clue.status!=='approved'||linked.meaning.status!=='approved'||linked.clue.text!==entry.clue||linked.clue.revision!==entry.clueRevision||linked.clue.meaningId!==entry.meaningId||linked.record.answer.id!==entry.answerId||linked.record.answer.desirability<55||entry.clueLevel!==linked.clue.level||entry.editorialScore!==linked.record.answer.desirability||entry.vocabularyLevel!==linked.record.answer.familiarity||entry.clueStyle!==linked.clue.style||entry.answerForm!==linked.clue.answerForm||entry.clueRegister!==linked.clue.register)errors.push('Unapproved or changed answer/clue');
  if(excluded.has(entry.answer))errors.push('Previously used answer');
 }
 const subjects=Map.groupBy(puzzle.entries,e=>e.subject||e.category);
 if([...subjects.values()].some(group=>group.length>Math.ceil(puzzle.entries.length*.75)))errors.push('Too much of one subject');
 const unique=[...new Set(errors)];return {ok:!unique.length,errors:unique,score:puzzleScore(puzzle),checks:{structure:true,activeClues:!unique.some(e=>/clue|catalog/.test(e)),geometry:!unique.some(e=>/Geometry|geometry/.test(e)),freshness:!unique.includes('Previously used answer')},review:{kind:'deterministic-publication-checks',humanTestSolved:false}};
}
export function sealCandidate(puzzle,options){
 const report=inspectCandidate(puzzle,options);
 if(!report.ok){const error=new Error('Candidate rejected: '+report.errors.join('; '));error.code='EDITORIAL_REJECTED';error.report=report;throw error;}
 const digest=puzzleDigest(puzzle);
 return {digest,puzzle:structuredClone(puzzle),report,createdAt:new Date().toISOString(),catalogVersion:CATALOG.version};
}
