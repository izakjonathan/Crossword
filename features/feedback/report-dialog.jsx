'use client';
import {useState} from 'react';
import Dialog from '../../components/dialog';
import {sendFeedback} from './client.mjs';
export default function ReportDialog({game,entry,onClose}){
 const[eventId]=useState(()=>crypto.randomUUID());
 const[reason,setReason]=useState('incorrect'),[comment,setComment]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function submit(event){event.preventDefault();setBusy(true);setMessage('');try{await sendFeedback(game.puzzle,{kind:'report',clueId:entry.clueId,reason,comment},{eventId});setMessage('Thank you. This clue has been flagged for review.');}catch(error){setMessage(error.message);}finally{setBusy(false);}}
 return <Dialog title="Report a clue" onClose={onClose}><p className="dialog-copy">{entry.clue}</p><form onSubmit={submit}><label className="field-label">What needs attention?<select value={reason} onChange={event=>setReason(event.target.value)}>{[['incorrect','The clue seems incorrect'],['ambiguous','More than one answer seems reasonable'],['wording','The wording is unclear'],['difficulty','The difficulty feels wrong'],['other','Something else']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label className="field-label">Optional explanation<textarea rows={3} maxLength={400} value={comment} onChange={event=>setComment(event.target.value)}/></label><p role="status" className="dialog-copy">{message}</p><div className="dialog-actions"><button type="button" className="outline-button" onClick={onClose}>Close</button><button type="submit" className="solid-button" disabled={busy}>{busy?'Sending…':'Send feedback'}</button></div></form></Dialog>;
}
