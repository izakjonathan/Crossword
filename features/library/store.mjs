import { loadSession, SESSION_KEY } from '../../lib/storage.mjs';
import { isSolved, solveStats } from '../solve/model.mjs';
export const LIBRARY_KEY='daily-cross:library:v1';
export const LIBRARY_LIMIT=50;
const cache=new WeakMap();
function validateGame(value){return loadSession({getItem:key=>key===SESSION_KEY?JSON.stringify(value):null});}
export function loadLibrary(storage){
  try{const raw=storage.getItem(LIBRARY_KEY),saved=cache.get(storage);if(saved?.raw===raw)return saved.rows;
    const values=JSON.parse(raw);if(!Array.isArray(values))return [];
    const rows=values.slice(0,LIBRARY_LIMIT).flatMap(item=>{const game=validateGame(item.game);return game&&typeof item.id==='string'&&Number.isFinite(item.updatedAt)?[{...item,completed:isSolved(game.puzzle,game.play),game}]:[];});
    cache.set(storage,{raw,rows});return rows;
  }catch{return [];}
}
export function saveLibraryGame(storage,game,session=null,now=Date.now()){
  if(!game)return;if(!validateGame(game))throw new Error('This game cannot be saved.');const existing=loadLibrary(storage),id=`${session?.lobby?.id||session?.token||'solo'}:${game.sharedRound||game.puzzle.id}`;
  const previous=existing.find(item=>item.id===id);
  const row={id,createdAt:previous?.createdAt||now,updatedAt:now,game:{puzzle:game.puzzle,play:{...game.play,undo:[]},stats:solveStats(game.stats,now)},shared:session?{token:session.token,lobby:session.lobby}:null,completed:isSolved(game.puzzle,game.play)};
  if(!previous&&existing.length>=LIBRARY_LIMIT)throw new Error('Your saved-game library is full. Remove an old game before saving another.');
  const rows=[row,...existing.filter(item=>item.id!==id)],raw=JSON.stringify(rows);storage.setItem(LIBRARY_KEY,raw);cache.set(storage,{raw,rows});return row;
}
export function removeLibraryGame(storage,id){storage.setItem(LIBRARY_KEY,JSON.stringify(loadLibrary(storage).filter(item=>item.id!==id)));}
