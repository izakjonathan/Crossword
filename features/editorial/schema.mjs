import {topicFlags,popCultureEligibility} from '../../lib/topic-policy.mjs';
import {validateWordBank,normalizeClue} from '../../lib/word-quality.mjs';
export const CATALOG_SCHEMA=1;
export const REVIEW_CHECKS=['meaning','grammar','facts','naturalness','leakage','fairness','ambiguity','style'];
export function normalizeAnswer(display) {
 if(typeof display!=='string'||!display.trim()||display.length>100)throw new Error('Invalid answer display form');
 const result=display.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/Æ/g,'AE').replace(/æ/g,'ae').replace(/Œ/g,'OE').replace(/œ/g,'oe').replace(/Ø/g,'O').replace(/ø/g,'o').replace(/ß/g,'ss').toUpperCase().replace(/[ '\u2019-]/g,'');
 if(!/^[A-Z]{3,11}$/.test(result))throw new Error('Answer must normalize to 3–11 Latin letters');
 return result;
}
export function contentId(text) {let h=2166136261;for(const ch of text)h=Math.imul(h^ch.charCodeAt(0),16777619);return(h>>>0).toString(36);}
const statuses=['draft','review','approved','rejected','quarantined'];
const speech=['noun','verb','adjective','adverb','proper-noun','interjection','preposition','conjunction','pronoun','other'];
export function validateCatalog(catalog) {
 if(!catalog||typeof catalog!=='object')return ['Invalid editorial catalog'];
 const errors=[],ids=new Set(),answers=new Set(),sourceIds=new Set(Array.isArray(catalog.sources)?catalog.sources.map(s=>s.id):[]);
 if(catalog.schema!==CATALOG_SCHEMA||!catalog.version||!Array.isArray(catalog.records)||!Array.isArray(catalog.sources))return ['Invalid editorial catalog'];
 for(const source of catalog.sources){if(!source.id||!['original','reference'].includes(source.kind)||!source.locator||!source.rights||!source.retrievedAt)errors.push('Incomplete provenance');}
 for(const record of catalog.records){
  const add=message=>errors.push(`${record.answer?.grid||'?'}: ${message}`),a=record.answer;
  if(!a||!statuses.includes(a.status)||!Number.isInteger(a.revision)||a.revision<1){add('Invalid answer record');continue;}
  try{if(normalizeAnswer(a.display)!==a.grid||a.length!==a.grid.length) add('Answer normalization mismatch');}catch(error){add(error.message);}
  if(answers.has(a.grid))add('Duplicate normalized answer');answers.add(a.grid);
  if(a.id!==`answer:${a.grid}`||![1,2,3].includes(a.familiarity))add('Invalid answer identity or familiarity');
  if(!Number.isFinite(a.desirability)||a.desirability<0||a.desirability>100||!['en-GB','en-US','en'].includes(a.language))add('Invalid answer assessment');
  if(!Array.isArray(record.meanings)||!Array.isArray(record.clues)||!record.revisions?.length){add('Missing meaning, clue or revision data');continue;}
  for(const entity of [a,...record.meanings,...record.clues]){if(!entity.id||ids.has(entity.id))add('Missing or duplicate editorial ID');ids.add(entity.id);if(!statuses.includes(entity.status))add('Invalid editorial status');}
  for(const meaning of record.meanings){if(meaning.answerId!==a.id||!speech.includes(meaning.partOfSpeech)||typeof meaning.definition!=='string'||meaning.definition.trim().length<3||!meaning.grammar||!meaning.subject||!meaning.id.startsWith(`meaning:${a.grid}:`))add('Incomplete answer meaning');}
  for(const clue of record.clues){
   if(!clue.id.startsWith(`clue:${a.grid}:`)||!record.meanings.some(m=>m.id===clue.meaningId)||!clue.explanation||!clue.evidence?.length||clue.evidence.some(id=>!sourceIds.has(id)))add('Clue lacks linked meaning/evidence/explanation');
   if(clue.status==='approved'&&(!clue.review?.reviewer||!clue.review.at||REVIEW_CHECKS.some(check=>clue.review.checks?.[check]!==true&&!(clue.review.basis==='legacy-acceptance'&&clue.review.checks?.[check]==='inherited'))))add('Approved clue lacks recorded review');
   if(a.flags?.abbreviation&&!/abbr|for short|initials|acronym|initialism|letters|code/i.test(clue.text))add('Abbreviation clue lacks an indicator');
   if(![1,2,3].includes(clue.level)||!Number.isInteger(clue.revision)||clue.revision<1)add('Invalid clue demand/revision');
  }
 }
 return errors;
}
export function approvedWords(catalog,{minimumScore=55}={}) {
 const errors=validateCatalog(catalog);if(errors.length)throw new Error(errors.slice(0,8).join('; '));
 const words=catalog.records.flatMap(record=>{
  const a=record.answer;if(a.status!=='approved'||a.desirability<minimumScore)return [];
  const approved=record.clues.filter(c=>c.status==='approved'&&(a.category!=='pop-culture'||popCultureEligibility(a.grid,c))&&record.meanings.some(m=>m.id===c.meaningId&&m.status==='approved'));
  // Missing an approved direct clue excludes the answer rather than inventing one.
  const direct=approved.find(c=>c.level===1);if(!direct)return [];
  return [{topicFlags:topicFlags(approved),answer:a.grid,subject:record.meanings.find(m=>m.id===direct.meaningId).subject,displayAnswer:a.display,answerId:a.id,category:a.category,vocabularyLevel:a.familiarity,editorialScore:a.desirability,editorialStatus:'approved',catalogVersion:catalog.version,easy:direct.text,hard:approved.at(-1).text,clues:approved.map(c=>({...c,clueId:c.id,meaningId:c.meaningId,clueRevision:c.revision}))}];
 });
 const guardrails=validateWordBank(words);if(guardrails.length)throw new Error(guardrails.slice(0,8).join('; '));
 return words;
}
export function applyReview(record,decision,{reviewer,at,checks={},reason,independent=false}={}) {
 if(!['approve','reject','quarantine'].includes(decision)||!reviewer||!at||!reason)throw new Error('Review needs a decision, reviewer, timestamp and reason');
 if(decision==='approve'&&REVIEW_CHECKS.some(check=>checks[check]!==true))throw new Error('Every editorial check must be explicitly accepted');
 const next=structuredClone(record),status={approve:'approved',reject:'rejected',quarantine:'quarantined'}[decision];
 next.answer.status=status;next.answer.revision++;
 for(const meaning of next.meanings)meaning.status=status;
 for(const clue of next.clues){clue.status=status;clue.revision++;clue.review={reviewer,at,checks,reason,independent:independent===true};}
 next.revisions.push({number:next.answer.revision,at,author:reviewer,reason,decision});return next;
}
export function clueBrief(record,{level=1}={}) {
 return {answer:record.answer.display,grid:record.answer.grid,meanings:record.meanings.map(m=>({id:m.id,definition:m.definition,partOfSpeech:m.partOfSpeech,grammar:m.grammar})),evidence:record.clues.map(c=>({ids:c.evidence,context:record.meanings.find(m=>m.id===c.meaningId)?.definition,basis:record.meanings.find(m=>m.id===c.meaningId)?.basis})),level,instructions:'Draft an original clue for one specified meaning. Preserve tense, number and part of speech. Do not change the answer, invent facts, quote source wording, or include the answer. Return JSON with meaningId, text, level, explanation and evidenceIds. This is a draft, never approval.'};
}
export function checkDraft(record,draft){
 if(!draft||!record.meanings.some(m=>m.id===draft.meaningId)||!draft.explanation||!draft.evidenceIds?.length)return ['Missing specified meaning, explanation or evidence'];
 if(![1,2,3].includes(draft.level)||draft.evidenceIds.some(id=>!record.clues.some(c=>c.evidence.includes(id))))return ['Unsupported difficulty or evidence outside this answer record'];
 if(record.clues.some(c=>normalizeClue(c.text)===normalizeClue(draft.text||'')))return ['Duplicate clue wording'];
 return validateWordBank([{answer:record.answer.grid,easy:draft.text,hard:draft.text}]);
}
export function validatePinnedMetadata(puzzle){
 if(puzzle.editorialVersion!==1||typeof puzzle.catalogVersion!=='string'||puzzle.catalogVersion.length>80)return ['Unsupported editorial snapshot'];
 if(puzzle.entries.some(e=>e.answerId!==`answer:${e.answer}`||typeof e.meaningId!=='string'||!e.meaningId.startsWith(`meaning:${e.answer}:`)||typeof e.clueId!=='string'||!e.clueId.startsWith(`clue:${e.answer}:`)||!Number.isSafeInteger(e.clueRevision)||e.clueRevision<1||!Number.isFinite(e.editorialScore)))return ['Invalid pinned clue metadata'];
 if(puzzle.publication&&(!/^[a-f0-9]{64}$/.test(puzzle.publication.digest||'')||!puzzle.publication.requestId))return ['Invalid publication receipt'];
 return [];
}
