export const PREFERENCES_KEY='daily-cross:preferences:v1';
export const DEFAULT_PREFERENCES={showTimer:false,autoCheck:false,advanceWord:false,spaceAction:'direction',playerName:''};
export function preferences(value={}) { return {showTimer:value.showTimer===true,autoCheck:value.autoCheck===true,advanceWord:value.advanceWord===true,spaceAction:value.spaceAction==='clear'?'clear':'direction',playerName:typeof value.playerName==='string'?value.playerName.trim().slice(0,24):''}; }
export function loadPreferences(storage) {try{return preferences(JSON.parse(storage.getItem(PREFERENCES_KEY))||{});}catch{return {...DEFAULT_PREFERENCES};}}
export function savePreferences(storage,value){storage.setItem(PREFERENCES_KEY,JSON.stringify(preferences(value)));}
export function isSolved(puzzle,play){return puzzle.grid.every((cell,i)=>!cell||play.answers[i]===cell.letter);}
export function solveStats(value,now=Date.now()) {
  const startedAt=Number.isSafeInteger(value?.startedAt)&&value.startedAt>0&&value.startedAt<=now?value.startedAt:now;
  return {startedAt,completedAt:Number.isSafeInteger(value?.completedAt)&&value.completedAt>=startedAt&&value.completedAt<=now?value.completedAt:null,hints:Number.isSafeInteger(value?.hints)&&value.hints>=0?value.hints:0,checks:Number.isSafeInteger(value?.checks)&&value.checks>=0?value.checks:0};
}
export function updateStats(stats,puzzle,play,delta={},now=Date.now()) {
  const next=solveStats(stats,now);next.hints+=delta.hints||0;next.checks+=delta.checks||0;
  next.completedAt=isSolved(puzzle,play)?next.completedAt||now:null;return next;
}
export function elapsedSeconds(stats,now=Date.now()){return stats?Math.max(0,Math.floor(((stats.completedAt||now)-stats.startedAt)/1000)):0;}
export function formatTime(seconds){return `${Math.floor(seconds/3600)?`${Math.floor(seconds/3600)}:`:''}${String(Math.floor(seconds/60)%60).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
export function checkProgress(puzzle,play,scope='puzzle') {
  const entry=puzzle.entries.find(e=>e.id===play.entryId),cells=scope==='letter'?[play.selected]:scope==='word'?entry.cells:puzzle.grid.flatMap((cell,i)=>cell?[i]:[]);
  const entered=cells.filter(i=>play.answers[i]);const wrong=entered.filter(i=>play.answers[i]!==puzzle.grid[i].letter);
  return {wrong,message:!entered.length?'Enter a letter in this selection first.':wrong.length?`${wrong.length} ${wrong.length===1?'letter needs':'letters need'} another look.`:entered.length<cells.length?'All entered letters in this selection are correct.':'This selection is correct.',entered:entered.length};
}
