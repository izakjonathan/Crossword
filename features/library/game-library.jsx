'use client';
import { useState } from 'react';
import Dialog from '../../components/dialog';
import { loadLibrary, removeLibraryGame } from './store.mjs';
import { formatTime, elapsedSeconds } from '../solve/model.mjs';
export default function GameLibrary({onOpen,onClose,shared,busy}){
  const [games,setGames]=useState(()=>{try{return loadLibrary(localStorage);}catch{return [];}}),[error,setError]=useState(''),[filter,setFilter]=useState('all');
  function remove(id){try{removeLibraryGame(localStorage,id);setGames(loadLibrary(localStorage));}catch{setError('Could not remove this saved game.');}}
  return <Dialog title="Saved games" onClose={onClose} className="library-dialog"><div className="clue-tabs" role="group" aria-label="Saved-game filter">{['all','unfinished','completed'].map(name=><button key={name} aria-pressed={filter===name} onClick={()=>setFilter(name)}>{name}</button>)}</div><p className="dialog-copy">Saved on this device. Shared entries join the session’s current puzzle; solo copies keep the saved board.</p>
    {shared&&<p className="dialog-copy">Leave your current shared session before opening another game.</p>}
    <div className="library-list">{games.filter(row=>filter==='all'||row.completed===(filter==='completed')).map(row=>{const filled=Object.values(row.game.play.answers).filter(Boolean).length,total=row.game.puzzle.grid.filter(Boolean).length;return <article key={row.id} className="saved-game"><h3>{row.shared?.lobby?.name||`${row.game.puzzle.mode} crossword`}</h3><p>{row.game.puzzle.mode} · {row.shared?'Shared':'Solo'} · {row.completed?'Completed':`${filled}/${total} filled`}</p><p>{new Date(row.updatedAt).toLocaleDateString()} · {formatTime(elapsedSeconds(row.game.stats,row.updatedAt))}</p><div className="saved-actions"><button className="outline-button" disabled={!!shared||busy} onClick={()=>onOpen(row,false)}>{row.shared?'Join session':'Resume'}</button>{row.shared&&<button className="outline-button" disabled={!!shared||busy} onClick={()=>onOpen(row,true)}>Solo copy</button>}<button className="text-button" onClick={()=>remove(row.id)} aria-label={`Remove saved ${row.game.puzzle.mode} game`}>Remove</button></div></article>;})}</div>
    {!games.length&&<p>No saved games yet. Your current game is saved automatically.</p>}<p role="status" className="shared-message">{error}</p>
  </Dialog>;
}
