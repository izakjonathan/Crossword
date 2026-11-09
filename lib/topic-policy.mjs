import {AUDIENCE_CLUES} from '../data/editorial/audience-clues.mjs';
// v2.22: editorial eligibility is about the actual clue, not the age of a person.
// Familiarity is an explicit provisional editorial judgment, not a survey score.
export const TOPIC_POLICY_VERSION=1;
export const CAPITAL_MAX=4;
export const SPORTS_MAX=2;
// The text-bound selection prevents a famous answer or old demand label from
// automatically admitting a new, obscure clue variant.
export function popCultureEligibility(answer,clue){return AUDIENCE_CLUES.get([answer,clue.level,clue.text].join('|'))||null;}
export function topicFlags(clues){
 const text=clues.map(c=>c.text??c.clue??'').join(' ');
 return {capital:/\b(capital|federal city)\b/i.test(text),sports:/\b(sport|football|basketball|baseball|cricket(?! companion)|rugby|tennis|golf|hockey|volleyball|badminton|olympic|olympics|athlet(?:e|ics)|gymnast|soccer|NFL|NBA|NHL|MLB|FIFA|UEFA|goalkeeper|goalpost|touchdown|quarterback|innings|wicket|bowler|bowling|batsman|fielder|shortstop|bullpen|rebound|slalom|skiing|skier|hurdle|decathlon|heptathlon|javelin|pole vault|sprint|marathon|triathlon|wrestl|boxing|boxer|pugilis|fencing|fencer|snooker|billiard|darts|offside|scrum|lineout|tiebreak|fairway|caddie|bogey|yorker|googly|legspin|offbreak|powerplay|pommel)\w*\b/i.test(text)};
}
export function topicLimits(mode){return {capital:mode==='easy'||mode==='medium'?2:CAPITAL_MAX,sports:SPORTS_MAX};}
export function validateTopicMix(entries,mode){
 const limits=topicLimits(mode);
 const flags=entries.map(e=>topicFlags([e||{}]));
 return [...(flags.filter(f=>f.capital).length>limits.capital?['Too many capital-related answers']:[]),...(flags.filter(f=>f.sports).length>limits.sports?['Too many sports answers']:[])];
}

export function mandatoryTopicFlags(word,mode){
 const options=(word.clues||[]).filter(c=>mode==='easy'?c.level===1:mode==='medium'?c.level<=2:true).map(c=>topicFlags([c]));
 return {capital:options.length>0&&options.every(f=>f.capital),sports:options.length>0&&options.every(f=>f.sports)};
}
