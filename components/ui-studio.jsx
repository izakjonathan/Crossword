'use client';
import { useState } from 'react';
import Dialog from './dialog';
import { validateTheme, saveLocalTheme } from '../lib/theme.mjs';
export default function UiStudio({ saved, preview, onPreview, onClose, onSaved }) {
  const [draft, setDraft] = useState(saved), [message, setMessage] = useState('');
  const problem = validateTheme(draft);
  function change(key, value) {
    const next = { ...draft, [key]: value }; setDraft(next); setMessage('');
    if (!validateTheme(next)) onPreview(next);
  }
  function save() {
    if (problem) return;
    try {
      saveLocalTheme(localStorage, draft);
      onSaved(draft); onClose();
    } catch { setMessage('This browser could not save the colours. Check that site storage is allowed.'); }
  }
  return <Dialog title="UI Studio" onClose={onClose} className="studio-dialog"><div className="studio-fields">{[['background', 'Background'], ['content', 'Content']].map(([key, label]) => <label className="colour-field" key={key}><span>{label}</span><span className="colour-control"><input aria-label={`${label} colour`} type="color" value={/^#[0-9a-f]{6}$/i.test(draft[key]) ? draft[key] : preview[key]} onChange={e => change(key, e.target.value)} /><input aria-label={`${label} hex value`} type="text" value={draft[key]} autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={7} onChange={e => change(key, e.target.value)} /></span></label>)}</div><p className="studio-note">Saved on this device.</p><p className="dialog-error" role="status">{message || problem || ''}</p><div className="dialog-actions"><button className="outline-button" onClick={onClose}>Cancel</button><button className="solid-button" disabled={!!problem} onClick={save}>Save</button></div></Dialog>;
}
