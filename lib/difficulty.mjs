export const DIFFICULTY_VERSION = 2;
// These are measurable editorial starting profiles, not human-calibrated scores.
const LEGACY_DIFFICULTY_PROFILES = {
  easy: { minFields:50,maxFields:58,minMeanVocabulary:1,maxMeanVocabulary:1.15,minBroader:0,maxAdvanced:0,minAdvanced:0,minChallengingClues:0,minHardClues:0,maxMeanClue:1,minMeanClue:1,longLength:6,minLong:0 },
  medium: { minFields:75,maxFields:85,minMeanVocabulary:1.3,maxMeanVocabulary:1.65,minBroader:.25,maxAdvanced:.10,minAdvanced:0,minChallengingClues:.35,minHardClues:0,maxMeanClue:1.7,minMeanClue:1.35,longLength:8,minLong:1 },
  hard: { minFields:105,maxFields:115,minMeanVocabulary:1.75,maxMeanVocabulary:2.35,minBroader:.5,maxAdvanced:.25,minAdvanced:.10,minChallengingClues:.65,minHardClues:.20,maxMeanClue:3,minMeanClue:1.85,longLength:9,minLong:1 },
};
export const DIFFICULTY_PROFILES = {...LEGACY_DIFFICULTY_PROFILES,hard:{...LEGACY_DIFFICULTY_PROFILES.hard,minMeanVocabulary:1.5,minBroader:.4,minAdvanced:0,maxAdvanced:.2}};
export function difficultySummary(entries) {
  const count=entries.length;
  return { answers:count,meanVocabulary:entries.reduce((sum,e)=>sum+e.vocabularyLevel,0)/count,broader:entries.filter(e=>e.vocabularyLevel>=2).length,advanced:entries.filter(e=>e.vocabularyLevel===3).length,challengingClues:entries.filter(e=>e.clueLevel>=2).length,hardClues:entries.filter(e=>e.clueLevel===3).length,meanClue:entries.reduce((sum,e)=>sum+e.clueLevel,0)/count };
}
export function validateDifficulty(puzzle) {
  const profile=(puzzle.difficultyVersion===1?LEGACY_DIFFICULTY_PROFILES:DIFFICULTY_PROFILES)[puzzle.mode];
  if(!profile)return ['Unknown difficulty profile'];
  const entries=puzzle.entries;
  if(entries.some(e=>![1,2,3].includes(e.vocabularyLevel)||![1,2,3].includes(e.clueLevel)))return ['Missing editorial ratings'];
  const q=difficultySummary(entries),count=entries.length,fields=puzzle.grid.filter(Boolean).length,errors=[];
  if(fields<profile.minFields||fields>profile.maxFields)errors.push('Playable-square count outside difficulty profile');
  if(q.meanVocabulary<profile.minMeanVocabulary-1e-9||q.meanVocabulary>profile.maxMeanVocabulary+1e-9)errors.push('Vocabulary mean outside difficulty profile');
  if(q.broader<Math.ceil(profile.minBroader*count)||q.advanced<Math.ceil(profile.minAdvanced*count)||q.advanced>Math.floor(profile.maxAdvanced*count))errors.push('Vocabulary mixture outside difficulty profile');
  if(q.challengingClues<Math.ceil(profile.minChallengingClues*count)||q.hardClues<Math.ceil(profile.minHardClues*count)||q.meanClue<profile.minMeanClue-1e-9||q.meanClue>profile.maxMeanClue+1e-9)errors.push('Clue mixture outside difficulty profile');
  if(entries.filter(e=>e.answer.length>=profile.longLength).length<profile.minLong)errors.push('Missing longer answers');
  return errors;
}
