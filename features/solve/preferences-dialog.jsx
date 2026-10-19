'use client';
import Dialog from '../../components/dialog';
export default function PreferencesDialog({value,onChange,onClose}){
  return <Dialog title="Solving preferences" onClose={onClose}><div className="preference-fields">
    <label><span>Show timer</span><input type="checkbox" checked={value.showTimer} onChange={e=>onChange({showTimer:e.target.checked})}/></label>
    <label><span>Check errors as I type</span><input type="checkbox" checked={value.autoCheck} onChange={e=>onChange({autoCheck:e.target.checked})}/></label>
    <label><span>At the end of a word</span><select value={value.advanceWord?'next':'stay'} onChange={e=>onChange({advanceWord:e.target.value==='next'})}><option value="stay">Stay in this clue</option><option value="next">Move to next clue</option></select></label>
    <label><span>Space key</span><select value={value.spaceAction} onChange={e=>onChange({spaceAction:e.target.value})}><option value="direction">Switch direction</option><option value="clear">Clear square and advance</option></select></label>
  </div><p className="dialog-copy">Typing always moves one square, including filled letters. Preferences are saved on this device. The session timer includes time away from the app; hiding it does not pause it.</p></Dialog>;
}
