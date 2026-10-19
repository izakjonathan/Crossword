'use client';
import Dialog from '../../components/dialog';
import { elapsedSeconds, formatTime } from './model.mjs';
export default function SolveSummary({game,shared,onClose,onNew}){
  return <Dialog title="Crossword complete" onClose={onClose}><p className="dialog-copy">{shared?'You solved it together.':'Every letter is in place.'}</p><dl className="solve-summary"><div><dt>Time</dt><dd>{formatTime(elapsedSeconds(game.stats))}</dd></div><div><dt>Hints</dt><dd>{game.stats?.hints||0}</dd></div><div><dt>Checks</dt><dd>{game.stats?.checks||0}</dd></div><div><dt>Solve</dt><dd>{game.play.assisted?'Assisted':'Without reveals'}</dd></div></dl><p className="dialog-copy">Saved in your game library. Time includes any time away from the app.</p><div className="dialog-actions"><button className="outline-button" onClick={onClose}>View board</button><button className="solid-button" onClick={onNew}>New puzzle</button></div></Dialog>;
}
