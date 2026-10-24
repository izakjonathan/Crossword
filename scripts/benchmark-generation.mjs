import { recentAnswers, ledgerRounds } from '../lib/recent-rounds.mjs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { generatePuzzle, validatePuzzle } from '../lib/engine.mjs';
import { generateFreshPuzzle } from '../lib/fresh-puzzle.mjs';
import { emptyLedger, recordPuzzle } from '../lib/repetition.mjs';

// Compare two source trees in the same process, alternating execution order.
// Generation alone is timed. Cost-only comparisons require identical output;
// --changed-search permits intentional solver changes and validates both outputs.
const baselineRoot = process.argv[2], count = Number(process.argv[3] || 30);
const changedSearch = process.argv.includes('--changed-search');
if (!baselineRoot || !Number.isInteger(count) || count < 1 || count > 1000) throw new Error('Usage: node scripts/benchmark-generation.mjs /path/to/baseline-source [1–1000 seeds per mode]');
const baseline = await import(pathToFileURL(join(resolve(baselineRoot),'lib/engine.mjs')));
const baselineFresh = await import(pathToFileURL(join(resolve(baselineRoot),'lib/fresh-puzzle.mjs')));
const stats = samples => {
  const sorted = samples.slice().sort((a,b)=>a-b);
  return {meanMs:samples.reduce((sum,v)=>sum+v,0)/samples.length,p95Ms:sorted[Math.ceil(sorted.length*.95)-1],maxMs:sorted.at(-1)};
};
function compare(oldGenerate, newGenerate, input, reverse, oldInput = input) {
  let before, after;
  const oldRun=()=>{const start=performance.now();const puzzle=oldGenerate(oldInput);before={puzzle,ms:performance.now()-start};};
  const newRun=()=>{const start=performance.now();const puzzle=newGenerate(input);after={puzzle,ms:performance.now()-start};};
  if(reverse){newRun();oldRun();}else{oldRun();newRun();}
  const identical = isDeepStrictEqual(before.puzzle,after.puzzle);
  if(!changedSearch && !identical)throw new Error(`Changed puzzle for ${input.mode}/${input.seed}`);
  const errors=[...baseline.validatePuzzle(before.puzzle),...validatePuzzle(after.puzzle)];
  if(errors.length)throw new Error(errors.join('; '));
  return {beforeMs:before.ms,afterMs:after.ms,puzzle:after.puzzle,baselinePuzzle:before.puzzle,identical};
}
const report={baseline:JSON.parse(readFileSync(join(resolve(baselineRoot),'package.json'))).version,candidate:JSON.parse(readFileSync(new URL('../package.json',import.meta.url))).version,seedsPerMode:count,method:changedSearch ? 'Same-process alternating order; three untimed warm-ups; both outputs independently validated; changed solver output permitted.' : 'Same-process alternating order; three untimed warm-up comparisons; full puzzle equality required.',modes:{}};
for(const mode of ['easy','medium','hard'])compare(baseline.generatePuzzle,generatePuzzle,{mode,seed:'benchmark-warm-up'},false);
for(const mode of ['easy','medium','hard']){
  const before=[],after=[];let identical=0;
  for(let seed=0;seed<count;seed++){
    const result=compare(baseline.generatePuzzle,generatePuzzle,{mode,seed:`audit-${seed}`},seed%2===1);
    before.push(result.beforeMs);after.push(result.afterMs);identical+=Number(result.identical);
  }
  const oldStats=stats(before),newStats=stats(after);
  report.modes[mode]={validatedPuzzles:count,identicalPuzzles:identical,baseline:oldStats,candidate:newStats,meanSpeedup:oldStats.meanMs/newStats.meanMs};
  console.error(`${mode}: ${count} validated comparisons; ${identical} identical`);
}
const before=[],after=[];let history=emptyLedger(), oldHistory=emptyLedger();const seen=new Set(), oldSeen=new Set();
const now=Date.parse('2026-10-19T10:00:00Z');
for(let index=0;index<12;index++){
  const mode=['easy','medium','hard'][index%3];
  const input={mode,seed:`day-${index}`,history,now:now+index*1000};
  const result=compare(baselineFresh.generateFreshPuzzle,generateFreshPuzzle,input,index%2===1,changedSearch?{...input,history:oldHistory}:input);
  for(const entry of result.baselinePuzzle.entries){if(oldSeen.has(entry.answer))throw new Error('Baseline repeated answer in sequence');oldSeen.add(entry.answer);}
  oldHistory=recordPuzzle(oldHistory,result.baselinePuzzle,now+index*1000);
  const blocked = recentAnswers(ledgerRounds(history));
  for(const entry of result.puzzle.entries){if(blocked.has(entry.answer))throw new Error('Repeated protected answer in sequence');seen.add(entry.answer);}
  history=recordPuzzle(history,result.puzzle,now+index*1000);
  before.push(result.beforeMs);after.push(result.afterMs);
}
report.sameDaySequence={validatedPuzzles:12,...(!changedSearch?{identicalPuzzles:12}:{}),distinctAnswers:seen.size,...(changedSearch?{baselineDistinctAnswers:oldSeen.size,historyMethod:'Each solver records its own generated puzzles in its own ledger.'}:{}),baseline:stats(before),candidate:stats(after)};
console.log(JSON.stringify(report,null,2));
