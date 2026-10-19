'use client';
import { useState } from 'react';
import Dialog from './dialog';
import { validateTheme } from '../lib/theme.mjs';
export default function UiStudio({ saved, preview, onPreview, onClose, onSave, onSaved }) {
  const [draft, setDraft] = useState(saved), [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const problem = validateTheme(draft);
  const close = () => { if (!saving) onClose(); };
  function change(key, value) {
    const next = { ...draft, [key]: value }; setDraft(next); setMessage('');
    if (!validateTheme(next)) onPreview(next);
  }
  async function save() {
    if (problem || saving) return;
    setSaving(true); setMessage('');
    try {
      const theme = await onSave(draft);
      onSaved(theme); onClose();
    } catch (error) { setMessage(error.message || 'Could not save colours for everyone. Please try again.'); }
    finally { setSaving(false); }
  }
  return <Dialog title="UI Studio" onClose={close} className="studio-dialog"><div className="studio-fields">{[['background', 'Background'], ['content', 'Content']].map(([key, label]) => <label className="colour-field" key={key}><span>{label}</span><span className="colour-control"><input aria-label={`${label} colour`} disabled={saving} type="color" value={/^#[0-9a-f]{6}$/i.test(draft[key]) ? draft[key] : preview[key]} onChange={e => change(key, e.target.value)} /><input aria-label={`${label} hex value`} disabled={saving} type="text" value={draft[key]} autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={7} onChange={e => change(key, e.target.value)} /></span></label>)}</div><p className="studio-note">Saving changes the colours for everyone.</p><p className="dialog-error" role="status">{message || problem || ''}</p><div className="dialog-actions"><button className="outline-button" disabled={saving} onClick={close}>Cancel</button><button className="solid-button" disabled={!!problem || saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</button></div></Dialog>;
}
