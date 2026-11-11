import {randomUUID} from 'node:crypto';
import {redisCommand} from '../../lib/shared-store.mjs';
import {GLOBAL_ANSWERS_KEY,HISTORY_SCAN_KEY} from '../../lib/answer-history.mjs';
import {OP_PATTERN,SharedError} from '../../lib/shared-model.mjs';
import {CATALOG} from '../editorial/catalog.mjs';
import {GENERATION_WORDS} from '../../lib/words.mjs';
import {READY_PUZZLES} from '../../lib/ready-puzzles.mjs';
import {inspectCandidate,puzzleDigest,sealCandidate} from './checks.mjs';
import {generateOffThread} from '../generation/server-worker.mjs';
export const inventoryKey=`crossword:inventory:v1:${CATALOG.version}`;
export const modeKey=mode=>`${inventoryKey}:${mode}`;
export const receiptKey=id=>`crossword:publication:v1:${id}`;
export const diagnosticsKey=`crossword:diagnostics:v1:${CATALOG.version}`;
export const RESERVE_PUZZLE_SCRIPT=`
local previous=redis.call('GET',KEYS[3])
if previous then return previous end
if redis.call('GET',KEYS[2]) ~= 'done' then return 'RECOVERING' end
if redis.call('HEXISTS',KEYS[4],ARGV[3])==0 then return 'MISSING' end
local answers=cjson.decode(ARGV[4])
for _,answer in ipairs(answers) do if redis.call('HEXISTS',KEYS[1],answer)==1 then return 'REPEAT' end end
for _,answer in ipairs(answers) do redis.call('HSET',KEYS[1],answer,'published:'..ARGV[1]) end
redis.call('SET',KEYS[3],ARGV[2])
redis.call('ZREM',KEYS[5],ARGV[3])
redis.call('HDEL',KEYS[4],ARGV[3])
return ARGV[2]
`;
const SEED_SCRIPT=`
if redis.call('EXISTS',KEYS[2])==1 then return 0 end
local packets=cjson.decode(ARGV[1])
for _,packet in ipairs(packets) do
 redis.call('HSETNX',KEYS[1],packet.digest,packet.value)
 redis.call('ZADD',KEYS[3],packet.score,packet.digest)
end
redis.call('SET',KEYS[2],'done')
return #packets
`;
const ADD_SCRIPT=`
if redis.call('GET',KEYS[4])~=ARGV[1] then return 0 end
if redis.call('HEXISTS',KEYS[1],ARGV[2])==1 then return -1 end
for _,answer in ipairs(cjson.decode(ARGV[5])) do if redis.call('HEXISTS',KEYS[3],answer)==1 then return 0 end end
redis.call('HSETNX',KEYS[1],ARGV[2],ARGV[3]);redis.call('ZADD',KEYS[2],ARGV[4],ARGV[2]);return 1
`;
const releaseScript="if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0";
export function publicationStore(command=redisCommand,{seedPackets=READY_PUZZLES,generate=generateOffThread}={}){
 async function receipt(id){const raw=await command(['GET',receiptKey(id)]);return raw?JSON.parse(raw):null;}
 async function seed(){
  for(const mode of ['easy','medium','hard']){
   const marker=`${modeKey(mode)}:seeded`;
   if(await command(['GET',marker]))continue;
   const packets=seedPackets.filter(p=>p.puzzle.mode===mode&&p.catalogVersion===CATALOG.version).filter(p=>inspectCandidate(p.puzzle).ok&&puzzleDigest(p.puzzle)===p.digest).map(p=>({digest:p.digest,value:JSON.stringify(p),score:p.report.score}));
   await command(['EVAL',SEED_SCRIPT,3,inventoryKey,marker,modeKey(mode),JSON.stringify(packets)]);
  }
 }
 async function usable(mode,excluded){
  const ids=await command(['ZREVRANGE',modeKey(mode),0,63]);if(!ids.length)return [];
  const values=await command(['HMGET',inventoryKey,...ids]),valid=[],stale=[];
  for(let i=0;i<ids.length;i++){
   try{const p=values[i]&&JSON.parse(values[i]);if(p&&p.digest===puzzleDigest(p.puzzle)&&inspectCandidate(p.puzzle,{excluded}).ok){valid.push(p);continue;}}catch{}
   stale.push(ids[i]);
  }
  if(stale.length)await command(['ZREM',modeKey(mode),...stale]);
  // The immutable packet may remain in the hash until a later catalog cleanup;
  // removing it from the ready index is enough to prevent serving it.
  return valid;
 }
 async function health(){
  await seed();const excluded=new Set(await command(['HKEYS',GLOBAL_ANSWERS_KEY])),modes={};
  for(const mode of ['easy','medium','hard'])modes[mode]=(await usable(mode,excluded)).length;
  const available=GENERATION_WORDS.filter(w=>!excluded.has(w.answer));
  const rawDiagnostics=await command(['HGETALL',diagnosticsKey]),diagnostics=Array.isArray(rawDiagnostics)?Object.fromEntries(Array.from({length:rawDiagnostics.length/2},(_,i)=>rawDiagnostics.slice(i*2,i*2+2))):rawDiagnostics||{};
  return {catalogVersion:CATALOG.version,approvedAnswers:GENERATION_WORDS.length,excludedAnswers:excluded.size,eligibleAnswers:available.length,eligibleByLength:Object.fromEntries([...Map.groupBy(available,w=>w.answer.length)].map(([n,words])=>[n,words.length])),ready:modes,diagnostics};
 }
 return {
  seed,health,receipt,
  async next({id,mode,scope='solo'}){
   if(!OP_PATTERN.test(id||'')||!['easy','medium','hard'].includes(mode)||typeof scope!=='string'||scope.length>200)throw new SharedError('Invalid new-game request.');
   const previous=await receipt(id);
   if(previous){if(previous.mode!==mode||previous.scope!==scope)throw new SharedError('This request belongs to another game.',409);return previous.puzzle;}
   if(await command(['GET',HISTORY_SCAN_KEY])!=='done')throw new SharedError('Open the updated app online to recover answer history first.',503);
   await seed();const excluded=new Set(await command(['HKEYS',GLOBAL_ANSWERS_KEY]));
   const modes=['easy','medium','hard'],stock=Object.fromEntries(await Promise.all(modes.map(async m=>[m,await usable(m,excluded)])));
   const answerSets=new Map(Object.values(stock).flat().map(p=>[p.digest,new Set(p.puzzle.entries.map(e=>e.answer))]));
   const compatible=(a,b)=>![...answerSets.get(a.digest)].some(answer=>answerSets.get(b.digest).has(answer));
   function runway(packets){
    const list=packets.slice(0,12);let best=0,visits=0;
    function visit(remaining,count){if(++visits>4096||count+remaining.length<=best)return;best=Math.max(best,count);if(!remaining.length)return;const [first,...rest]=remaining;visit(rest.filter(p=>compatible(first,p)),count+1);visit(rest,count);}
    visit(list,0);return best;
   }
   const candidates=stock[mode].map(packet=>{
    const remaining=Object.fromEntries(modes.map(m=>[m,stock[m].filter(p=>p.digest!==packet.digest&&compatible(packet,p))]));
    const runs=modes.map(m=>runway(remaining[m]));
    return {packet,minRunway:Math.min(...runs),hardRunway:runs[2],total:runs.reduce((a,b)=>a+b,0),remaining:modes.reduce((n,m)=>n+remaining[m].length,0)};
   }).sort((a,b)=>b.minRunway-a.minRunway||b.hardRunway-a.hardRunway||b.total-a.total||b.remaining-a.remaining||b.packet.report.score-a.packet.report.score).map(item=>item.packet);
   for(const packet of candidates){
    const puzzle={...structuredClone(packet.puzzle),id:`published:${id}`,publication:{requestId:id,digest:packet.digest,catalogVersion:CATALOG.version,quality:packet.report.score,checks:packet.report.checks,review:packet.report.review}};
    const record={id,mode,scope,puzzle,createdAt:Date.now()},raw=await command(['EVAL',RESERVE_PUZZLE_SCRIPT,5,GLOBAL_ANSWERS_KEY,HISTORY_SCAN_KEY,receiptKey(id),inventoryKey,modeKey(mode),id,JSON.stringify(record),packet.digest,JSON.stringify(puzzle.entries.map(e=>e.answer))]);
    if(['REPEAT','MISSING'].includes(raw))continue;
    if(raw==='RECOVERING')throw new SharedError('Answer history is still being recovered.',503);
    const result=JSON.parse(raw);if(result.mode!==mode||result.scope!==scope)throw new SharedError('This request belongs to another game.',409);
    return result.puzzle;
   }
   const error=new SharedError('Fresh puzzles are being prepared. Try again shortly. Your current game has been kept.',503);error.code='SUPPLY_REPLENISHING';throw error;
  },
  async verify(puzzle,{id,scope}){
   if(!OP_PATTERN.test(id||'')||puzzle?.publication?.requestId!==id)throw new SharedError('Create a new game using the updated app.',409);
   const record=await receipt(id);
   if(!record||record.scope!==scope||record.puzzle.id!==puzzle.id||record.puzzle.publication.digest!==puzzleDigest(puzzle)||record.puzzle.publication.digest!==puzzle.publication.digest)throw new SharedError('This puzzle is not an approved publication.',409);
   return record;
  },
  async replenish({budgetMs=20000,target=8,maxAttempts=9,preferredMode}={}){
   const lock=`${inventoryKey}:refill`,owner=randomUUID();
   if(await command(['SET',lock,owner,'NX','PX',budgetMs+10000])!=='OK')return {running:true};
   const started=Date.now(),end=started+budgetMs,report={created:0,attempts:0,failures:{}};
   try{
    await seed();if(await command(['GET',HISTORY_SCAN_KEY])!=='done')return {...report,recovering:true};
    const excluded=new Set(await command(['HKEYS',GLOBAL_ANSWERS_KEY]));
    const attemptsByMode={easy:0,medium:0,hard:0},stock={};for(const mode of ['easy','medium','hard'])stock[mode]=await usable(mode,excluded);
    while(report.attempts<maxAttempts&&Date.now()<end-250){
     // Another player can reserve a game during a worker attempt. Refresh the
     // history and stock before spending the next search budget on old letters.
     if(report.attempts&&Number(await command(['HLEN',GLOBAL_ANSWERS_KEY]))!==excluded.size){
      for(const answer of await command(['HKEYS',GLOBAL_ANSWERS_KEY]))excluded.add(answer);
      for(const m of ['easy','medium','hard'])stock[m]=await usable(m,excluded);
     }
     const requested=stock[preferredMode]?.length===0&&attemptsByMode[preferredMode]===0?preferredMode:null;
     const mode=requested||['easy','medium','hard'].filter(m=>stock[m].length<target).sort((a,b)=>(stock[a].length+attemptsByMode[a])-(stock[b].length+attemptsByMode[b]))[0];
     if(!mode)break;
     report.attempts++;attemptsByMode[mode]++;
     const seedId=await command(['HINCRBY',diagnosticsKey,'generationSequence',1]),patterns=new Map();
     try{
      // Restore an empty mode from permanent history first. Excluding the
      // union of overlapping unplayed stock can leave no usable short fill.
      // Later attempts prefer disjoint stock; actual history is never relaxed.
      const recent=new Set(excluded);
      if(stock[mode].length>0&&attemptsByMode[mode]%2===0)for(const packets of Object.values(stock))for(const p of packets)for(const entry of p.puzzle.entries)recent.add(entry.answer);
      const puzzle=await generate({mode,seed:`inventory:${CATALOG.version}:${seedId}`,recent:[...recent],quality:true,publication:true,deadline:Math.min(end,Date.now()+(mode==='hard'?8000:2000)),onDiagnostic:p=>{if(patterns.size<40)patterns.set(`${p.length}:${p.pattern}`,p);}});
      const packet=sealCandidate(puzzle,{excluded});
      const added=await command(['EVAL',ADD_SCRIPT,4,inventoryKey,modeKey(mode),GLOBAL_ANSWERS_KEY,lock,owner,packet.digest,JSON.stringify(packet),packet.report.score,JSON.stringify(puzzle.entries.map(e=>e.answer))]);
      if(Number(added)===1){stock[mode].push(packet);report.created++;}else {const reason=Number(added)===-1?'DUPLICATE_INVENTORY':'CONCURRENT_HISTORY';report.failures[reason]=(report.failures[reason]||0)+1;}
     }catch(error){
      const code=error.code||'SEARCH_EXHAUSTED';report.failures[code]=(report.failures[code]||0)+1;
      const increments=[`${mode}:${code}`,1,...[...patterns.keys()].flatMap(key=>[`pattern:${mode}:${key}`,1])];
      await command(['EVAL',"for i=1,#ARGV,2 do redis.call('HINCRBY',KEYS[1],ARGV[i],tonumber(ARGV[i+1])) end return 1",1,diagnosticsKey,...increments]);
     }
    }
    await command(['HSET',diagnosticsKey,'lastReplenishment',JSON.stringify({...report,at:new Date().toISOString(),elapsedMs:Date.now()-started})]);
    return report;
   }finally{await command(['EVAL',releaseScript,1,lock,owner]);}
  }
 };
}
