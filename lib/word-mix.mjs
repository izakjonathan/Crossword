export const WORD_BANK_VERSION=2;
export const POP_CULTURE_MIN=.15;
export const POP_CULTURE_MAX=.35;
export const ABBREVIATION_MAX=.25;
export const isAbbreviation=word=>/\babbr\./i.test(word.easy);
export function validateWordMix(entries,version=WORD_BANK_VERSION){
 const minimum=version===1?.20:POP_CULTURE_MIN;
 const n=entries.length,pop=entries.filter(e=>e?.category==='pop-culture').length;
 const abbreviated=entries.filter(e=>e?.answerStyle==='abbreviation').length;
 const errors=[];
 if(entries.some(e=>!['general','pop-culture'].includes(e?.category)||!['word','abbreviation'].includes(e?.answerStyle)))errors.push('Missing replacement-bank classification');
 if(pop<Math.ceil(minimum*n)||pop>Math.floor(POP_CULTURE_MAX*n))errors.push('Pop-culture share outside replacement-bank limits');
 if(abbreviated>Math.floor(ABBREVIATION_MAX*n))errors.push('Too many abbreviated answers');
 return errors;
}
