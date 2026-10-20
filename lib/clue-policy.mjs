export const CLUE_POLICY_VERSION = 1;
// Sense-specific annotations: VET's verb and VAT's tank sense are not
// shortened forms. Do not infer grammar or abbreviation from spelling alone.
const shortened = { PHOTO:[1], EXAM:[1], FLU:[1], GYM:[1], LAB:[1], VET:[1], SOAP:[2], CORD:[2], POP:[2], VAT:[2] };
const informal = { BREAD:[2], SALT:[2], LEMON:[2], BIRD:[2], DOUGH:[2], BOTTLE:[2], BAG:[2], BIN:[2], BUG:[1], MAD:[1,2], NUT:[3], PAL:[1], RAG:[2], RAT:[3], ROT:[3], RUM:[3], TAR:[3], PARACHUTE:[3], PASSENGER:[3] };
export function annotateClue(answer, clue) {
  return { ...clue, style:clue.style ?? 'literal',
    answerForm:shortened[answer]?.includes(clue.level) ? 'shortened' : 'normal',
    register:informal[answer]?.includes(clue.level) ? 'informal' : 'standard' };
}
export function validateClueConvention(answer, clue, requireMetadata = false) {
  const errors = [];
  const { text, level } = clue;
  const style = requireMetadata ? clue.style : clue.style ?? 'literal';
  const form = requireMetadata ? clue.answerForm : clue.answerForm ?? 'normal';
  const register = requireMetadata ? clue.register : clue.register ?? 'standard';
  if (!['literal','wordplay'].includes(style)) errors.push('Invalid clue style');
  if (!['normal','shortened'].includes(form)) errors.push('Invalid answer form');
  if (!['standard','informal'].includes(register)) errors.push('Invalid clue register');
  if (typeof text !== 'string') return [...errors, 'Invalid clue text'];
  if (style === 'wordplay' ? !text.endsWith('?') || level !== 3 : text.includes('?')) errors.push('Unsignalled or unreviewed wordplay');
  if (shortened[answer]?.includes(level) && form !== 'shortened') errors.push('Missing shortened-answer annotation');
  if (form === 'shortened' && !/\bfor short\b|\babbr(?:eviation)?\.?/i.test(text)) errors.push('Missing abbreviation indicator');
  if (informal[answer]?.includes(level) && register !== 'informal') errors.push('Missing informal-sense annotation');
  if (register === 'informal' && !/\binformal(?:ly)?\b|\bslang\b|\bcolloquial(?:ly)?\b/i.test(text)) errors.push('Missing informal-language indicator');
  return errors;
}
export function validateCluePolicy(puzzle) {
  if (puzzle.cluePolicyVersion !== CLUE_POLICY_VERSION) return ['Unsupported clue policy version'];
  const modeErrors = puzzle.mode !== 'hard' && puzzle.entries.some(entry => entry.clueStyle === 'wordplay') ? ['Wordplay outside Hard mode'] : [];
  return modeErrors.concat(puzzle.entries.flatMap(entry => validateClueConvention(entry.answer, {
    text:entry.clue, level:entry.clueLevel, style:entry.clueStyle,
    answerForm:entry.answerForm, register:entry.clueRegister,
  }, true)));
}
