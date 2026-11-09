import {readFileSync,writeFileSync,renameSync,mkdirSync} from 'node:fs';
import {createDictionaryIndex} from '../lib/dictionary-index.mjs';
import {CATALOG,APPROVED_WORDS} from '../features/editorial/catalog.mjs';
import {validateCatalog,clueBrief,checkDraft,applyReview} from '../features/editorial/schema.mjs';
const [command,argument]=process.argv.slice(2);
if(command==='audit'){
 const errors=validateCatalog(CATALOG);console.log(JSON.stringify({version:CATALOG.version,answers:CATALOG.records.length,inheritedReviews:CATALOG.records.filter(r=>r.answer.flags.legacySemanticAudit).length,errors},null,2));if(errors.length)process.exitCode=1;
}else if(command==='candidates'){
 console.log(JSON.stringify(createDictionaryIndex(APPROVED_WORDS).matching(argument).map(w=>({answer:w.answer,score:w.editorialScore,clue:w.easy})),null,2));
}else if(command==='priorities'){
 const health=JSON.parse(readFileSync(argument,'utf8')),raw=health.diagnostics||{},historyPath=process.argv[4],excluded=new Set(historyPath?JSON.parse(readFileSync(historyPath,'utf8')).answers:[]),index=createDictionaryIndex(APPROVED_WORDS);
 console.log(JSON.stringify(Object.entries(raw).filter(([key])=>key.startsWith('pattern:')).map(([key,count])=>{const [,mode,length,pattern]=key.split(':');return {mode,length:Number(length),pattern,failures:Number(count),approvedMatches:index.matching(pattern,{excluded}).length};}).sort((a,b)=>b.failures-a.failures).slice(0,30),null,2));
}else if(command==='brief'){
 const record=CATALOG.records.find(r=>r.answer.grid===argument);if(!record)throw Error('Unknown answer');console.log(JSON.stringify(clueBrief(record),null,2));
}else if(command==='check-draft'){
 const value=JSON.parse(readFileSync(argument,'utf8')),record=CATALOG.records.find(r=>r.answer.grid===value.answer);if(!record)throw Error('Unknown answer');const errors=checkDraft(record,value);console.log(JSON.stringify({status:'draft',errors},null,2));if(errors.length)process.exitCode=1;
}else if(command==='import-reviewed'){
 const input=JSON.parse(readFileSync(argument,'utf8')),record=input.record||input;
 const validation=validateCatalog({...CATALOG,records:[record],sources:[...CATALOG.sources,...(input.sources||[])]});
 if(validation.length||record.answer.status!=='approved'||record.clues.some(c=>c.status!=='approved'))throw Error('Reviewed record is not publishable: '+validation.join('; '));
 const directory=new URL('../data/editorial/reviewed/',import.meta.url);mkdirSync(directory,{recursive:true});
 const destination=new URL(record.answer.grid+'.json',directory),temporary=new URL(record.answer.grid+'.json.tmp',directory);writeFileSync(temporary,JSON.stringify({record,sources:input.sources||[]},null,2)+'\n');renameSync(temporary,destination);
 console.log('Imported reviewed source. Increment decisions.json version, rebuild editorial data and inventory, then run checks before release.');
}else if(command==='review'){
 // Explicit reviewer decisions are persisted as a review artifact; this command
 // never rewrites canonical bank content or approves an AI draft automatically.
 const input=JSON.parse(readFileSync(argument,'utf8')),record=input.record||CATALOG.records.find(r=>r.answer.grid===input.answer);if(!record)throw Error('Unknown record');
 const reviewed=applyReview(record,input.decision,input.review),path=argument+'.reviewed.json',temp=path+'.tmp';writeFileSync(temp,JSON.stringify(reviewed,null,2)+'\n');renameSync(temp,path);console.log(path);
}else throw Error('Use audit, brief ANSWER, check-draft FILE, or review FILE. Reviewed content is applied through a versioned source change and validation, never direct production mutation.');
