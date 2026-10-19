'use client';
import { useState } from 'react';
import Dialog from './dialog';

export default function SharedGameDialog({ shared, creating, onCreate, onLeave, onClose, notice }) {
  const [message, setMessage] = useState('');
  const link = shared?.token ? `${location.origin}${location.pathname}#game=${shared.token}` : '';
  async function copy() {
    try { await navigator.clipboard.writeText(link); setMessage('Link copied. Send it to the person you want to play with.'); }
    catch { setMessage('Select and copy the link below.'); }
  }
  async function share() {
    try { await navigator.share({ title:'Play this crossword with me', url:link }); }
    catch (error) { if (error.name !== 'AbortError') copy(); }
  }
  return <Dialog title="Play together" onClose={onClose}>
    <p className="dialog-copy">{shared ? 'Anyone with this link can write and delete letters on this board. The link lasts 7 days.' : 'Invite someone to solve your current crossword. Both of you can write and delete letters, with changes appearing automatically.'}</p>
    {shared && <label className="shared-link-label">Game link<input aria-label="Shared game link" className="shared-link" readOnly value={link} onFocus={event => event.target.select()} /></label>}
    <div className="dialog-actions">
      {shared ? <><button className="solid-button" onClick={copy}>Copy link</button>{typeof navigator.share === 'function' && <button className="outline-button" onClick={share}>Share</button>}<button className="outline-button" disabled={shared.generating || (shared.pending > 0 && shared.status !== 'ended')} onClick={onLeave}>{shared.status === 'ended' && shared.pending ? 'Keep a solo copy' : 'Leave shared game'}</button></> : <button className="solid-button" disabled={creating} onClick={onCreate}>{creating ? 'Creating link…' : 'Create game link'}</button>}
    </div>
    <p className="shared-message" role="status">{notice || message || (shared?.pending ? 'Saving your changes before you leave…' : shared?.error || '')}</p>
  </Dialog>;
}
