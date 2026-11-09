import {REPLACEMENT_WORDS} from '../../lib/replacement-words.mjs';
import {ADDITIONS} from '../../data/editorial/additions.mjs';
import {DECISIONS,SOURCE_ROWS,REVIEWS,LEGACY_ACCEPTANCE,REVIEWED_RECORDS,REVIEWED_SOURCES} from './source-data.mjs';
import {CATALOG_SCHEMA,REVIEW_CHECKS,contentId,normalizeAnswer,approvedWords} from './schema.mjs';
import {annotateClue} from '../../lib/clue-policy.mjs';
const date='2026-11-09',checks=Object.fromEntries(REVIEW_CHECKS.map(key=>[key,true]));
const sources=[{id:'authored-v219',kind:'original',locator:'data/replacement/*.tsv at d8361980c16b162bee3c9f81187a9e0408d587f3',rights:'Original assistant-authored app content; not publisher clue extracts',retrievedAt:date},{id:'authored-v221',kind:'original',locator:'data/editorial/additions.mjs',rights:'Original assistant-authored app content',retrievedAt:date}];
const guessSpeech=(text,abbreviation)=>abbreviation||/First name|Surname|Singer|Capital of|Country whose|City |Character |Actor |Actress /i.test(text)?'proper-noun':/^(Be |Become |Cause |Move |Make |Put |Take |Give |Go |Stop |Remove |Turn |Leave |Start |Clean |Write |Return |Continue |Search |Find |Help |End |Store |Fold |Roll |Spend |Pay |Wait |Reduce |Increase |Recover |Cancel |Arrive |Enter |Get |Join )/.test(text)?'verb':/^(Exclamation|Cry |Sound made)/.test(text)?'interjection':'other';
function makeRecord(word,addition=null){
 const change=DECISIONS.changes[word.answer],answerId='answer:'+word.answer;
 if(change?.source)sources.push({id:'reference:'+word.answer,kind:'reference',locator:change.source,rights:'Factual verification only; clue wording original',retrievedAt:date});
 const clues=change?.clues||addition?.clues||word.clues;
 const inherited=!addition&&!change;
 const score=addition?.score??(word.vocabularyLevel===1?88:word.vocabularyLevel===2?74:58)-(/\babbr\./i.test(word.easy)?16:0);
 const record={author:inherited?'legacy release v2.19.0':'Codex original author',answer:{id:answerId,grid:word.answer,display:addition?.display||SOURCE_ROWS[word.answer]?.display||word.answer,length:word.answer.length,language:'en',region:'international',category:word.category,familiarity:word.vocabularyLevel,desirability:score,status:'approved',revision:change?2:1,flags:{abbreviation:/\babbr\./i.test(word.easy),properName:word.category==='pop-culture',legacySemanticAudit:inherited}},meanings:[],clues:[],revisions:[{number:change?2:1,at:date,author:inherited?'legacy release v2.19.0':DECISIONS.reviewer,reason:change?.reason||(inherited?'Preserve prior release acceptance; semantic metadata imported from each distinct clue, not a new independent human certification.':'Original everyday phrase with explicit meaning and grammatical review.')} ]};
 for(const c of clues){
  const review=REVIEWS.find(r=>r.answer===word.answer&&r.content===contentId([c.text,c.definition,c.level].join('|'))&&r.decision==='approved');
  const acceptedLegacy=inherited&&LEGACY_ACCEPTANCE.clues[word.answer]?.includes(contentId(c.text));
  const status=change||review||acceptedLegacy?'approved':'draft';
  const meaningId=`meaning:${word.answer}:${contentId(c.definition||c.text)}`,id=`clue:${word.answer}:${contentId(c.text)}`;
  if(!record.meanings.some(m=>m.id===meaningId))record.meanings.push({id:meaningId,answerId,definition:c.definition||c.text,partOfSpeech:c.partOfSpeech||guessSpeech(c.text,record.answer.flags.abbreviation),grammar:c.grammar||{form:record.answer.flags.abbreviation?'abbreviation':'uninflected',number:'unspecified',tense:'unspecified',reviewStatus:'needs-semantic-review'},subject:addition?.subject||(word.category==='pop-culture'?'entertainment':SOURCE_ROWS[word.answer]?.locator.includes('food-nature')?'food-and-nature':SOURCE_ROWS[word.answer]?.locator.includes('capitals')?'geography':SOURCE_ROWS[word.answer]?.locator.includes('everyday')?'household':'general'),status,basis:inherited?'inherited-clue-context':'explicit-meaning'});
  record.clues.push({...annotateClue(word.answer,c),id,meaningId,status,revision:change?2:1,explanation:c.explanation||`The intended answer is ${record.answer.display}; ${c.definition||c.text}.`,evidence:[change?.source?'reference:'+word.answer:addition?'authored-v221':'authored-v219'],review:review||{reviewer:inherited?'v2.19.0 release acceptance':DECISIONS.reviewer,at:date,checks:inherited?Object.fromEntries(REVIEW_CHECKS.map(key=>[key,'inherited'])):checks,basis:inherited?'legacy-acceptance':'assistant-editorial-review',independent:false,reason:record.revisions[0].reason},sourceLocator:SOURCE_ROWS[word.answer]?.locator||'data/editorial/additions.mjs'});
 }
 if(!record.clues.some(c=>c.level===1&&c.status==='approved'))record.answer.status='review';
 return record;
}
const records=[...REPLACEMENT_WORDS.map(w=>makeRecord(w)),...ADDITIONS.map(a=>makeRecord({answer:normalizeAnswer(a.display),vocabularyLevel:a.familiarity||1,category:a.category||'general',easy:a.clues[0].text,clues:a.clues},a))];
const mergedRecords=new Map(records.map(r=>[r.answer.grid,r]));for(const record of REVIEWED_RECORDS)mergedRecords.set(record.answer.grid,record);
const mergedSources=new Map([...sources,...REVIEWED_SOURCES].map(source=>[source.id,source]));
export const CATALOG={schema:CATALOG_SCHEMA,version:DECISIONS.version,sources:[...mergedSources.values()],records:[...mergedRecords.values()]};
export const APPROVED_WORDS=approvedWords(CATALOG);
export const ANSWER_RECORDS=new Map(CATALOG.records.map(record=>[record.answer.grid,record]));
export const CLUE_RECORDS=new Map(CATALOG.records.flatMap(record=>record.clues.map(clue=>[clue.id,{record,clue,meaning:record.meanings.find(m=>m.id===clue.meaningId)}])));
