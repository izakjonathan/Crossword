import {createHash} from 'node:crypto';
import {validatePuzzle} from '../../lib/validate.mjs';
import {CATALOG,CLUE_RECORDS} from '../editorial/catalog.mjs';
import {normalizeClue,validateWordBank} from '../../lib/word-quality.mjs';
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
 if(puzzle.editorialVersion!==1||puzzle.catalogVersion!==catalogVersion)errors.push('Outdated editorial catalog');
 const texts=new Set();
 for(const entry of puzzle.entries){
  const linked=CLUE_RECORDS.get(entry.clueId),key=normalizeClue(entry.clue);
  if(!linked||linked.record.answer.status!=='approved'||linked.clue.status!=='approved'||linked.meaning.status!=='approved'||linked.clue.text!==entry.clue||linked.clue.revision!==entry.clueRevision||linked.clue.meaningId!==entry.meaningId||linked.record.answer.id!==entry.answerId||linked.record.answer.desirability<55||entry.clueLevel!==linked.clue.level||entry.editorialScore!==linked.record.answer.desirability||entry.vocabularyLevel!==linked.record.answer.familiarity||entry.clueStyle!==linked.clue.style||entry.answerForm!==linked.clue.answerForm||entry.clueRegister!==linked.clue.register)errors.push('Unapproved or changed answer/clue');
  if(texts.has(key))errors.push('Repeated clue in one puzzle');texts.add(key);
  if(excluded.has(entry.answer))errors.push('Previously used answer');
  // Check accidental leakage of any complete answer into another clue too.
  for(const other of puzzle.entries)if(other!==entry){
   const tokens=(entry.clue.toUpperCase().match(/[A-Z]+/g)||[]).join(' '),display=other.displayAnswer?.toUpperCase();
   if(new RegExp(`\\b${other.answer}\\b`).test(tokens)||(display?.includes(' ')&&tokens.includes(display)))errors.push('A clue gives away another answer');
  }
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
