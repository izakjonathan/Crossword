// Reviewed original wording. Sources support the senses, not a measured
// human difficulty score. A question mark signals the deliberate misreading.
const wordplay = [
  ['RIVER', 'Runner with a bed and a mouth?', 'A watercourse runs and has a bed and mouth; the surface suggests a person.'],
  ['LETTER', 'Character in the mail?', 'Character means an alphabetic sign; a written message travels by post.'],
  ['ENAMEL', 'Canine coat?', 'Canine means a tooth, not a dog; the hard covering is its coat.'],
  ['FREEZER', 'Cold case?', 'Case means a cabinet rather than an unsolved investigation.'],
  ['NURSERY', 'Growing business?', 'Growing refers to raising plants rather than increasing revenue.'],
  ['TENT', "Pitcher's shelter?", 'A camper pitches a fabric shelter; the surface suggests baseball.'],
];
export const WORDPLAY_CLUES = Object.fromEntries(wordplay.map(([answer, text, rationale]) => [answer, {
  text, level: 3, style: 'wordplay', rationale,
  source: `https://www.merriam-webster.com/dictionary/${answer.toLowerCase()}`,
}]));
export const PROFESSIONAL_WORDS = [
  ['ENAMEL', 2, 'Hard outer covering of a tooth'],
  ['FREEZER', 1, 'Appliance that keeps food at subzero temperatures'],
  ['NURSERY', 1, 'Place where young plants are grown for sale'],
  ['TENT', 1, 'Portable shelter made of fabric'],
].map(([answer, vocabularyLevel, easy]) => ({ answer, vocabularyLevel, easy, hard: easy }));
