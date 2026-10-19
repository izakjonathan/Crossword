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
  for (const {answer, easy, hard, clues, vocabularyLevel} of bank) {
    if (!/^[A-Z]{3,11}$/.test(answer)) errors.push(`${answer}: invalid answer form`);
    if (seen.has(answer)) errors.push(`${answer}: duplicate answer`);
    seen.add(answer);
    if (clues !== undefined && (![1,2,3].includes(vocabularyLevel) || !Array.isArray(clues) || !clues.length || clues.some(c=>!c || ![1,2,3].includes(c.level)))) errors.push(`${answer}: invalid editorial ratings`);
    if (Array.isArray(clues)) {
      if (!clues.some(c => c?.level === 1 && c.text === easy)) errors.push(`${answer}: missing direct clue`);
      if (new Set(clues.map(c => c?.level)).size !== clues.length) errors.push(`${answer}: repeated clue tier`);
      if (new Set(clues.filter(c => typeof c?.text === 'string').map(c => normalizeClue(c.text))).size !== clues.length) errors.push(`${answer}: duplicate rated clue`);
    }
    if (Array.isArray(clues)) for (const clue of clues) if (clue?.source !== undefined) {
      try {
        const url = new URL(clue.source);
        if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid source URL');
      } catch { errors.push(`${answer}: invalid clue source`); }
    }
    for (const [level, clue] of [...Object.entries({easy, hard}), ...(Array.isArray(clues) ? clues.map((c,i)=>[`variant${i}`,c?.text]) : [])]) {
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
