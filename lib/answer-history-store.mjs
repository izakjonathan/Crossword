import { GLOBAL_ANSWERS_KEY, HISTORY_SCAN_KEY, ANSWER_PATTERN, roomAnswerHistory } from './answer-history.mjs';
import { WORDS, GENERATION_WORDS } from './words.mjs';
import { SharedError, OP_PATTERN } from './shared-model.mjs';
import { redisCommand } from './shared-store.mjs';
const known = new Set([...WORDS, ...GENERATION_WORDS].map(word => word.answer));
export const IMPORT_ANSWERS_SCRIPT = `
for _,answer in ipairs(ARGV) do redis.call('HSETNX',KEYS[1],answer,'imported') end
return 1
`;
export const CLAIM_ANSWERS_SCRIPT = `
if redis.call('GET',KEYS[2]) ~= 'done' then return 'RECOVERING' end
for i=2,#ARGV do
 local owner=redis.call('HGET',KEYS[1],ARGV[i])
 if owner and owner ~= ARGV[1] then return 'REPEAT' end
end
for i=2,#ARGV do redis.call('HSET',KEYS[1],ARGV[i],ARGV[1]) end
return 'OK'
`;
export function validateHistoryAnswers(answers) {
  if (!Array.isArray(answers) || answers.length > 10000 || answers.some(answer => typeof answer !== 'string' || !ANSWER_PATTERN.test(answer))) throw new SharedError('Invalid answer history.');
  // Older imports can contain abandoned entries. Only recognized bank answers
  // enter the global registry, bounding writes to the actual vocabulary.
  return [...new Set(answers.filter(answer => known.has(answer)))];
}
export function answerHistoryStore(command = redisCommand) {
  async function importAnswers(answers) {
    const clean = validateHistoryAnswers(answers);
    if (clean.length) await command(['EVAL', IMPORT_ANSWERS_SCRIPT, 1, GLOBAL_ANSWERS_KEY, ...clean]);
  }
  async function recoverRooms() {
    const saved = await command(['GET', HISTORY_SCAN_KEY]);
    if (saved === 'done') return true;
    let cursor = saved || '0';
    // Bounded, restartable SCAN; never KEYS, never delete or rewrite a room.
    for (let page = 0; page < 4; page++) {
      const result = await command(['SCAN', cursor, 'MATCH', 'crossword:shared:v1:*', 'COUNT', 200]);
      const [next, keys] = result;
      const roomKeys = keys.filter(key => /^crossword:shared:v1:[a-f0-9]{64}$/.test(key));
      if (roomKeys.length) {
        const values = await command(['MGET', ...roomKeys]);
        const recovered = [];
        for (const raw of values) {
          if (!raw) continue;
          let room;
          try { room = typeof raw === 'string' ? JSON.parse(raw) : raw; }
          catch { throw new SharedError('A stored shared history could not be read. No new game was created.',503); }
          recovered.push(...roomAnswerHistory(room));
        }
        await importAnswers([...new Set(recovered)]);
      }
      cursor = String(next);
      // A concurrent recovery finishing cannot be reverted to a partial scan.
      await command(['EVAL', "if redis.call('GET',KEYS[1]) ~= 'done' then redis.call('SET',KEYS[1],ARGV[1]) end return 1", 1, HISTORY_SCAN_KEY, cursor === '0' ? 'done' : cursor]);
      if (cursor === '0') return true;
    }
    return false;
  }
  return {
    importAnswers,
    async sync(answers) {
      await importAnswers(answers);
      const ready = await recoverRooms();
      return {ready, answers:await command(['HKEYS', GLOBAL_ANSWERS_KEY])};
    },
    async claim(id, answers) {
      if (typeof id !== 'string' || !OP_PATTERN.test(id)) throw new SharedError('Invalid puzzle reservation.');
      const clean = validateHistoryAnswers(answers);
      if (!clean.length || clean.length !== answers.length || clean.length > 100) throw new SharedError('Invalid puzzle answers.');
      const result = await command(['EVAL', CLAIM_ANSWERS_SCRIPT, 2, GLOBAL_ANSWERS_KEY, HISTORY_SCAN_KEY, id, ...clean]);
      if (result === 'REPEAT') throw new SharedError('Another game has already used one of these answers. Try again. Your current game has been kept.',409);
      if (result !== 'OK') throw new SharedError('Answer history is still being recovered. Try again shortly.',503);
      return {ready:true, answers:clean};
    }
  };
}
