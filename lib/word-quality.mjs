// Mechanical editorial guardrails, not a substitute for reviewing meaning.
// Substrings alone aren't leakage: EAR in 'hearing' and RING in 'spring'
// are not equivalent to defining MINT with 'peppermint'.
const giveawayFamilies = {
  MINT: ['PEPPERMINT', 'SPEARMINT'],
  INFORM: ['INFORMS', 'INFORMED', 'INFORMING', 'INFORMATION'],
  FORT: ['FORTIFY', 'FORTIFIED', 'FORTIFICATION'],
  GINGER: ['GINGERBREAD'],
};
export function normalizeClue(clue) {
  return clue.normalize('NFKC').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ').trim().replace(/\.$/, '').toLowerCase();
}
function inflections(answer) {
  const forms = [answer, `${answer}S`, `${answer}ES`, `${answer}ED`, `${answer}ING`, ...(giveawayFamilies[answer] || [])];
  if (answer.endsWith('E')) forms.push(`${answer}D`, `${answer.slice(0,-1)}ING`);
  if (/[^AEIOU]Y$/.test(answer)) forms.push(`${answer.slice(0,-1)}IES`, `${answer.slice(0,-1)}IED`);
  if (/[AEIOU][BDGMNPRT]$/.test(answer)) forms.push(`${answer}${answer.at(-1)}ED`, `${answer}${answer.at(-1)}ING`);
  return new Set(forms);
}
export function validateWordBank(bank) {
  const errors = [], seen = new Set(), definitions = new Map();
  for (const {answer, easy, hard} of bank) {
    if (!/^[A-Z]{3,11}$/.test(answer)) errors.push(`${answer}: invalid answer form`);
    if (seen.has(answer)) errors.push(`${answer}: duplicate answer`);
    seen.add(answer);
    for (const [level, clue] of Object.entries({easy, hard})) {
      if (typeof clue !== 'string' || clue.trim() !== clue || clue.length < 3 || clue.length > 100 || /[|\n\r]/.test(clue)) {
        errors.push(`${answer}/${level}: invalid clue text`); continue;
      }
      const tokens = clue.toUpperCase().match(/[A-Z]+/g) || [];
      const key = `${answer.length}:${normalizeClue(clue)}`;
      const previous = definitions.get(key);
      if (previous && previous !== answer) errors.push(`${answer}/${level}: same-length clue shared with ${previous}`);
      definitions.set(key, answer);
      const revealed = inflections(answer);
      if (tokens.some(token => revealed.has(token))) errors.push(`${answer}/${level}: answer revealed in clue`);
    }
  }
  return errors;
}
