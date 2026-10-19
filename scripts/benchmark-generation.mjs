import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { generatePuzzle, validatePuzzle } from '../lib/engine.mjs';
import { generateFreshPuzzle } from '../lib/fresh-puzzle.mjs';
import { emptyLedger, recordPuzzle } from '../lib/repetition.mjs';

// Compare two source trees in the same process, alternating execution order.
// Generation alone is timed. Every complete result must remain identical;
// equality and structural/editorial validation are outside the timed section.
const baselineRoot = process.argv[2], count = Number(process.argv[3] || 30);
if (!baselineRoot || !Number.isInteger(count) || count < 1 || count > 1000) throw new Error('Usage: node scripts/benchmark-generation.mjs /path/to/baseline-source [1–1000 seeds per mode]');
const baseline = await import(pathToFileURL(join(resolve(baselineRoot),'lib/engine.mjs')));
const baselineFresh = await import(pathToFileURL(join(resolve(baselineRoot),'lib/fresh-puzzle.mjs')));
const stats = samples => {
  const sorted = samples.slice().sort((a,b)=>a-b);
  return {meanMs:samples.reduce((sum,v)=>sum+v,0)/samples.length,p95Ms:sorted[Math.ceil(sorted.length*.95)-1],maxMs:sorted.at(-1)};
};
function compare(oldGenerate, newGenerate, input, reverse) {
  let before, after;
  const oldRun=()=>{const start=performance.now();const puzzle=oldGenerate(input);before={puzzle,ms:performance.now()-start};};
  const newRun=()=>{const start=performance.now();const puzzle=newGenerate(input);after={puzzle,ms:performance.now()-start};};
  if(reverse){newRun();oldRun();}else{oldRun();newRun();}
  if(!isDeepStrictEqual(before.puzzle,after.puzzle))throw new Error(`Changed puzzle for ${input.mode}/${input.seed}`);
  const errors=validatePuzzle(after.puzzle);
  if(errors.length)throw new Error(errors.join('; '));
  return {beforeMs:before.ms,afterMs:after.ms,puzzle:after.puzzle};
}
const report={baseline:JSON.parse(readFileSync(join(resolve(baselineRoot),'package.json'))).version,candidate:JSON.parse(readFileSync(new URL('../package.json',import.meta.url))).version,seedsPerMode:count,method:'Same-process alternating order; three untimed warm-up comparisons; full puzzle equality required.',modes:{}};
for(const mode of ['easy','medium','hard'])compare(baseline.generatePuzzle,generatePuzzle,{mode,seed:'benchmark-warm-up'},false);
for(const mode of ['easy','medium','hard']){
  const before=[],after=[];
  for(let seed=0;seed<count;seed++){
    const result=compare(baseline.generatePuzzle,generatePuzzle,{mode,seed:`audit-${seed}`},seed%2===1);
    before.push(result.beforeMs);after.push(result.afterMs);
  }
  const oldStats=stats(before),newStats=stats(after);
  report.modes[mode]={identicalPuzzles:count,baseline:oldStats,candidate:newStats,meanSpeedup:oldStats.meanMs/newStats.meanMs};
  console.error(`${mode}: ${count}/${count} identical puzzles checked`);
}
const before=[],after=[];let history=emptyLedger();const seen=new Set();
const now=Date.parse('2026-10-19T10:00:00Z');
for(let index=0;index<12;index++){
  const mode=['easy','medium','hard'][index%3];
  const result=compare(baselineFresh.generateFreshPuzzle,generateFreshPuzzle,{mode,seed:`day-${index}`,history,now:now+index*1000},index%2===1);
  for(const entry of result.puzzle.entries){if(seen.has(entry.answer))throw new Error('Repeated answer in sequence');seen.add(entry.answer);}
  history=recordPuzzle(history,result.puzzle,now+index*1000);
  before.push(result.beforeMs);after.push(result.afterMs);
}
report.sameDaySequence={identicalPuzzles:12,distinctAnswers:seen.size,baseline:stats(before),candidate:stats(after)};
console.log(JSON.stringify(report,null,2));
