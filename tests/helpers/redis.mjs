import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {GLOBAL_ANSWERS_KEY,HISTORY_SCAN_KEY} from '../../lib/answer-history.mjs';
// Each test gets independent permanent history. All commands still run on a
// real disposable Redis instance, including the production Lua scripts.
export function redisTestCommand({recovered=true}={}) {
  const namespace=randomUUID(),keys=new Set([GLOBAL_ANSWERS_KEY,HISTORY_SCAN_KEY]);
  const run=args=>{
    const values=args.map(value=>(keys.has(value)||typeof value==='string'&&/^crossword:(?:inventory|publication|diagnostics|quality-|clue-report)/.test(value))?`${value}:${namespace}`:String(value));
    const input=values.at(-1)?.length>50000?values.pop():undefined;
    return JSON.parse(execFileSync(process.env.REDIS_TEST_CLI,['-p',process.env.REDIS_TEST_PORT||'6397','--json',...(input===undefined?[]:['-x']),...values],{encoding:'utf8',input,maxBuffer:4000000}));
  };
  if(recovered)run(['SET',HISTORY_SCAN_KEY,'done']);
  return async args=>run(args);
}
