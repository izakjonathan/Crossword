export const ANSWER_COOLDOWN = 30;
export function puzzleSignature(puzzle) {
 if(puzzle.publication?.digest)return puzzle.publication.digest;
 return JSON.stringify([puzzle.mode,puzzle.cols,puzzle.rows,puzzle.entries.map(e=>[e.dir,e.cells,e.answer,e.clue]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))]);
}
export function rollingHistory(history, room) {
 const groups=new Map();
 for(const [answer,use] of Object.entries(history.uses||{})){
  if(use.game<=0||history.sequence-use.game>=ANSWER_COOLDOWN)continue;
  if(!groups.has(use.game))groups.set(use.game,[]);
  groups.get(use.game).push(answer);
 }
 let rounds=room ? (room.recentRounds||[room.puzzle.entries.map(e=>e.answer)]) : history.continuityVersion===1 ? (history.recentRounds||[]) : [...groups].sort((a,b)=>a[0]-b[0]).map(([,answers])=>answers);
 if(!room&&history.continuityVersion!==1)for(const round of history.recentRounds||[]){
  if(!rounds.some(old=>old.length===round.length&&round.every(answer=>old.includes(answer))))rounds.push(round);
 }
 return {...history,continuityVersion:1,recentRounds:rounds.slice(-ANSWER_COOLDOWN)};
}
