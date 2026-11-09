import {topicLimits,mandatoryTopicFlags} from './topic-policy.mjs';
import {fillScore} from '../features/generation/quality.mjs';
import {POP_CULTURE_MIN,POP_CULTURE_MAX,ABBREVIATION_MAX,isAbbreviation} from './word-mix.mjs';
import { DIFFICULTY_PROFILES } from './difficulty.mjs';
import { createDictionaryIndex } from './dictionary-index.mjs';
import { createConstraintPropagator } from './constraint-propagation.mjs';

// Seeded MAC search: propagate every binary constraint before branching and
// after each tentative assignment; child arrays preserve parent domains.
export function fillLayout(layout, bank, rng, budget = 3000, mode = null, accept = () => true, deadline = Infinity, options = {}) {
  const { slots } = layout;
  const ranks = new Map(bank.map(word => [word.answer, rng()]));
  const assigned = Array(slots.length).fill(null);
  const profile = DIFFICULTY_PROFILES[mode], count = slots.length;
  const replacement=bank.every(word=>word.category);
  const dimensions=replacement?9:5,topicMaximum=topicLimits(mode);
  const topics=new Map(bank.map(word=>[word,word.catalogVersion?mandatoryTopicFlags(word,mode):{capital:false,sports:false}]));
  const features = word => [word.vocabularyLevel, Number(word.vocabularyLevel >= 2), Number(word.vocabularyLevel === 3), Number(word.clues?.some(c => mode === 'medium' ? c.level === 2 : c.level >= 2)), Number(word.clues?.some(c => c.level === 3)),...(replacement?[Number(word.category==='pop-culture'),Number(isAbbreviation(word)),Number(!!topics.get(word).capital),Number(!!topics.get(word).sports)]:[])];
  const vectors = profile ? new Map(bank.map(word => [word, features(word)])) : null;
  const minimum = profile ? [Math.ceil(profile.minMeanVocabulary*count-1e-9),Math.ceil(profile.minBroader*count),Math.ceil(profile.minAdvanced*count),Math.ceil(profile.minChallengingClues*count),Math.ceil(profile.minHardClues*count),...(replacement?[Math.ceil(POP_CULTURE_MIN*count),0,0,0]:[])] : [];
  const maximum = profile ? [Math.floor(profile.maxMeanVocabulary*count+1e-9),count,Math.floor(profile.maxAdvanced*count),count,count,...(replacement?[Math.floor(POP_CULTURE_MAX*count),Math.floor(ABBREVIATION_MAX*count),topicMaximum.capital,topicMaximum.sports]:[])] : [];
  const domains = createDictionaryIndex(bank), boundCache = new WeakMap();
  const constraints = createConstraintPropagator(slots, domains, !!profile);
  function bounds(domain) {
    if (boundCache.has(domain)) return boundCache.get(domain);
    const lo = Array(dimensions).fill(Infinity), hi = Array(dimensions).fill(0);
    for (const word of domain) {
      const vector = vectors.get(word);
      for (let j = 0; j < dimensions; j++) { lo[j] = Math.min(lo[j],vector[j]); hi[j] = Math.max(hi[j],vector[j]); }
    }
    const value = { lo, hi };
    boundCache.set(domain, value);
    return value;
  }
  function feasible(current) {
    if (!profile) return true;
    const low = Array(dimensions).fill(0), high = Array(dimensions).fill(0);
    for (let i = 0; i < count; i++) {
      if (!assigned[i] && !current[i].length) return false;
      const vector = assigned[i] && vectors.get(assigned[i]);
      const { lo, hi } = vector ? { lo:vector, hi:vector } : bounds(current[i]);
      for (let j = 0; j < dimensions; j++) { low[j] += lo[j]; high[j] += hi[j]; }
    }
    return low.every((value,j) => value <= maximum[j] && high[j] >= minimum[j]);
  }
  function pruneQuotaDomains(current,changed){
    if(!profile)return true;
    const low=Array(dimensions).fill(0),high=Array(dimensions).fill(0),limits=[];
    for(let i=0;i<count;i++){
      if(!current[i].length)return false;
      const vector=assigned[i]&&vectors.get(assigned[i]);
      const bound=vector?{lo:vector,hi:vector}:bounds(current[i]);limits.push(bound);
      for(let j=0;j<dimensions;j++){low[j]+=bound.lo[j];high[j]+=bound.hi[j];}
    }
    for(let i=0;i<count;i++)if(!assigned[i]){
      const bound=limits[i],filtered=current[i].filter(word=>vectors.get(word).every((v,j)=>low[j]-bound.lo[j]+v<=maximum[j]&&high[j]-bound.hi[j]+v>=minimum[j]));
      if(!filtered.length)return false;
      if(filtered.length!==current[i].length){current[i]=filtered;changed.push(i);}
    }
    return true;
  }
  // Keep minimum-domain and crossing-degree priorities. Only break a true
  // constraint tie toward the centre, where fill can support more of the grid.
  const size = Math.sqrt(layout.mask?.length || 0), middle = (size - 1) / 2;
  const distance = slots.map(slot => Number.isInteger(size) && size > 0 ?
    Math.abs(slot.cells.reduce((sum, cell) => sum + Math.floor(cell / size), 0) / slot.cells.length - middle) +
    Math.abs(slot.cells.reduce((sum, cell) => sum + cell % size, 0) / slot.cells.length - middle) : 0);
  let nodes = 0, best=null, bestScore=-Infinity, bestAcceptance=null, solutions=0;
  const solutionLimit=options.maxSolutions||1;
  function diagnose(current){
    if(!options.onDiagnostic)return;
    const i=current.findIndex(domain=>!domain.length);if(i<0)return;
    const slot=slots[i],letters=Array(slot.cells.length).fill('.');
    for(const crossing of slot.crossings)if(assigned[crossing.other])letters[crossing.position]=assigned[crossing.other].answer[crossing.otherPosition];
    options.onDiagnostic({code:'EMPTY_DOMAIN',length:slot.cells.length,pattern:letters.join(''),direction:slot.dir});
  }
  function visit(current, remaining) {
    if (Date.now()>=deadline || !feasible(current)) return null;
    if (!remaining) {
      if(!accept(assigned))return null;
      const score=fillScore(assigned);solutions++;
      if(score>bestScore){bestScore=score;best=assigned.slice();bestAcceptance=options.capture?.();}
      return solutions>=solutionLimit?best:null;
    }
    if (++nodes > budget) return null;
    const degrees = slots.map(slot => slot.crossings.filter(crossing => !assigned[crossing.other]).length);
    let chosen = -1;
    for (let i = 0; i < count; i++) {
      if (assigned[i]) continue;
      if (chosen < 0) { chosen = i; continue; }
      const domainDelta = current[i].length - current[chosen].length;
      const degreeDelta = degrees[i] - degrees[chosen];
      if (domainDelta < 0 || (domainDelta === 0 && (degreeDelta > 0 ||
        (degreeDelta === 0 && distance[i] < distance[chosen])))) chosen = i;
    }
    if (!current[chosen].length) return null;
    const totals = Array(dimensions).fill(0);
    if (profile) for (const value of assigned.filter(Boolean)) vectors.get(value).forEach((v,j) => { totals[j] += v; });
    const preference = word => vectors.get(word).reduce((score,value,j) => score + (totals[j] < minimum[j] ? value * (j >= 3 ? 3 : 1) : 0), 0);
    // Prefer values retaining support across neighbours, while keeping the
    // authored difficulty targets and seeded variety in the ranking.
    const choices = current[chosen].filter(word=>!profile||vectors.get(word).every((v,j)=>totals[j]+v<=maximum[j])).map(word => ({
      word, eliminated:constraints.eliminated(word, current, chosen, assigned),
      score:ranks.get(word.answer) * 4 + (profile ? preference(word) : 0) + (options.scored ? ((word.editorialScore??70)-70)/8 : 0) - (topics.get(word).capital?4:0) - (topics.get(word).sports?4:0)
    })).sort((a,b) => (b.score - Math.log1p(b.eliminated)) - (a.score - Math.log1p(a.eliminated)) || a.eliminated - b.eliminated);
    for (const { word } of choices) {
      if(nodes>budget||Date.now()>=deadline)break;
      assigned[chosen] = word;
      const next = current.slice();
      next[chosen] = [word];
      const changed=[chosen];
      if(profile&&replacement){
        const vector=vectors.get(word);
        // Once a topic quota is full, remove it from every unfilled domain.
        // Propagate these removals too instead of repeatedly exploring a fill
        // that can only exceed the topic limit several slots later.
        const saturated=[7,8].filter(j=>totals[j]+vector[j]>=maximum[j]);
        if(saturated.length)for(let i=0;i<count;i++)if(!assigned[i]){
          const filtered=next[i].filter(value=>saturated.every(j=>vectors.get(value)[j]===0));
          if(filtered.length!==next[i].length){next[i]=filtered;changed.push(i);}
        }
      }
      if (pruneQuotaDomains(next,changed) && feasible(next) && constraints.propagate(next, changed)) { const result = visit(next, remaining-1); if (result) return result; } else diagnose(next);
      assigned[chosen] = null;
      if (nodes > budget) break;
    }
    return null;
  }
  const initial = slots.map(slot => domains.forLength(slot.cells.length).filter(word=>slot.cells.every((cell,i)=>!layout.fixedLetters?.[cell]||layout.fixedLetters[cell]===word.answer[i])));
  const initialChanges=[];
  const words = pruneQuotaDomains(initial,initialChanges) && feasible(initial) && constraints.propagate(initial) ? visit(initial, count) : null;
  if(!words)diagnose(initial);
  return { words:words||best, nodes, solutions, score:bestScore, acceptance:bestAcceptance, timedOut:Date.now()>=deadline, propagation: { ...constraints.stats } };
}
