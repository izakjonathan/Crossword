import { DEFAULT_THEME, validateTheme } from './theme.mjs';
import { redisCommand } from './shared-store.mjs';

export const GLOBAL_THEME_KEY = 'crossword:global-theme:v1';
export const SAVE_THEME_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
local revision = 0
if raw then revision = cjson.decode(raw).revision end
local value = { theme = cjson.decode(ARGV[1]), revision = revision + 1 }
local updated = cjson.encode(value)
redis.call('SET', KEYS[1], updated)
return updated
`;
export function globalThemeStore(command = redisCommand) {
  return {
    async get() {
      const raw = await command(['GET', GLOBAL_THEME_KEY]);
      return raw ? JSON.parse(raw) : { theme:{...DEFAULT_THEME}, revision:0 };
    },
    async save(theme) {
      const error = validateTheme(theme);
      if (error) throw new Error(error);
      const clean = { background:theme.background.toLowerCase(), content:theme.content.toLowerCase() };
      return JSON.parse(await command(['EVAL', SAVE_THEME_SCRIPT, 1, GLOBAL_THEME_KEY, JSON.stringify(clean)]));
    }
  };
}
