import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {GLOBAL_ANSWERS_KEY,HISTORY_SCAN_KEY} from '../../lib/answer-history.mjs';
// Each test gets independent permanent history. All commands still run on a
// real disposable Redis instance, including the production Lua scripts.
export function redisTestCommand({recovered=true}={}) {
  const namespace=randomUUID(),keys=new Set([GLOBAL_ANSWERS_KEY,HISTORY_SCAN_KEY]);
  const run=args=>JSON.parse(execFileSync(process.env.REDIS_TEST_CLI,['-p',process.env.REDIS_TEST_PORT||'6397','--json',...args.map(value=>keys.has(value)?`${value}:${namespace}`:String(value))],{encoding:'utf8'}));
  if(recovered)run(['SET',HISTORY_SCAN_KEY,'done']);
  return async args=>run(args);
}
