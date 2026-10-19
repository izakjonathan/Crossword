'use client';
import { useEffect, useState } from 'react';
import Dialog from './dialog';
import { lobbyRequest } from '../lib/lobby-session.mjs';

export default function SharedGameDialog({ shared, creating, leaving, canHost, onCreate, onJoin, onLeave, onClose, notice, playerName, onPlayerName, players }) {
  const [name, setName] = useState('Shared crossword');
  const [lobbies, setLobbies] = useState(null), [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController(); let timer;
    async function refresh() {
      try { const data = await lobbyRequest(null, controller.signal); if (!controller.signal.aborted) { setLobbies(data.lobbies); setError(''); } }
      catch (cause) { if (!controller.signal.aborted) setError(cause.message); }
      finally { if (!controller.signal.aborted) timer = setTimeout(refresh, 3000); }
    }
    refresh(); return () => { controller.abort(); clearTimeout(timer); };
  }, []);
  const active = lobbies?.find(lobby => lobby.id === shared?.lobby?.id) || shared?.lobby;
  return <Dialog title="Play together" onClose={onClose}>
    <label className="player-name-label" htmlFor="player-name">Your name<input id="player-name" className="shared-link" maxLength={24} value={playerName||''} placeholder="Player" onChange={event=>onPlayerName(event.target.value)}/></label>
    {shared ? <>
      <p className="dialog-copy"><strong>{active?.name || 'Shared session'}</strong>{active ? ` · ${active.players} joined` : ''}</p>
      <p className="dialog-copy">You stay together when either player creates a new puzzle. Reopening this app reconnects you until you leave. Sessions last up to 7 days.</p>
      <ul className="player-list" aria-label="Joined players">{players?.participants.map((player,index)=><li key={index}><span>{player.name}{player.self?' (you)':''}</span><span>{player.online?'Connected':'Away'}</span></li>)}</ul><p role="status">{players?.error}</p>
      <div className="dialog-actions"><button className="outline-button" disabled={leaving || shared.generating || (shared.pending > 0 && shared.status !== 'ended')} onClick={onLeave}>{leaving ? 'Leaving…' : shared.status === 'ended' && shared.pending ? 'Keep a solo copy and leave' : 'Leave shared game'}</button></div>
      <p className="dialog-copy">Leaving returns you to your solo game. Other players stay connected. The lobby closes when everyone leaves.</p>
    </> : <>
      <p className="dialog-copy">Host your current game so anyone on another device can find it below and join. Everyone in the lobby can write, erase and create the next puzzle.</p>
      <form className="lobby-host" onSubmit={event => { event.preventDefault(); onCreate(name.trim()); }}>
        <label htmlFor="lobby-name">Lobby name</label>
        <input id="lobby-name" className="shared-link" maxLength={48} value={name} onChange={event => setName(event.target.value)} disabled={creating} required />
        <button className="solid-button" disabled={creating || !canHost || !name.trim()}>{creating ? 'Connecting…' : 'Host this game'}</button>
      </form>
      <h3 className="lobby-heading">Available games</h3>
      {lobbies === null && !error && <p role="status">Finding shared games…</p>}
      {lobbies?.length === 0 && <p>No shared games yet. Host one to get started.</p>}
      <div className="difficulty-options lobby-list">{lobbies?.map(lobby => <button key={lobby.id} className="difficulty-option" disabled={creating} onClick={() => onJoin(lobby.id)} aria-label={`Join ${lobby.name}`}><span className="lobby-name">{lobby.name}<small>{lobby.players} joined</small></span><span>Join</span></button>)}</div>
      <p className="dialog-copy">Joined devices stay in the session when the app is closed. Use Leave shared game to leave. The count shows joined devices, including those currently away.</p>
    </>}
    <p className="shared-message" role="status">{notice || error || (shared?.pending ? 'Saving your changes before you leave…' : shared?.error || '')}</p>
  </Dialog>;
}
