// Keep the retired bank available for historical saves and regression fixtures.
export {WORDS, GENERATION_WORDS as LEGACY_GENERATION_WORDS} from './legacy-words.mjs';
import {WORDS as RETIRED_WORDS} from './legacy-words.mjs';
import {REPLACEMENT_WORDS} from './replacement-words.mjs';
import {validateWordBank} from './word-quality.mjs';
const retired=new Set(RETIRED_WORDS.map(word=>word.answer));
if(REPLACEMENT_WORDS.some(word=>retired.has(word.answer)))throw new Error('Replacement bank contains a retired answer');
const errors=validateWordBank(REPLACEMENT_WORDS);
if(errors.length)throw new Error('Invalid replacement bank: '+errors.join('; '));
export const GENERATION_WORDS=REPLACEMENT_WORDS;
