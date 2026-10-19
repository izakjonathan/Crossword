'use client';
import { useEffect, useRef, useState } from 'react';
import Dialog from './dialog';

export default function ClueList({ game, onSelect, onClose }) {
  const current = game.puzzle.entries.find(entry => entry.id === game.play.entryId);
  const [direction, setDirection] = useState(current?.dir || 'across');
  const active = useRef(null);
  useEffect(() => { active.current?.scrollIntoView({ block: 'nearest' }); }, [direction]);
  return <Dialog title="All clues" onClose={onClose} className="clue-list-dialog">
    <div className="clue-tabs" role="group" aria-label="Clue direction">
      {['across', 'down'].map(dir => <button key={dir} aria-pressed={dir === direction} onClick={() => setDirection(dir)}>{dir}</button>)}
    </div>
    <p className="clue-list-note">Tap a clue to jump to its first empty square.</p>
    <div className="clue-list" aria-label={`${direction} clues`}>
      {game.puzzle.entries.filter(entry => entry.dir === direction).map(entry => {
        const filled = entry.cells.filter(cell => game.play.answers[cell]).length;
        const selected = entry.id === game.play.entryId;
        return <button key={entry.id} ref={selected ? active : undefined} className={`clue-row ${selected ? 'current' : ''}`} aria-current={selected ? 'true' : undefined} onClick={() => onSelect(entry.id)}>
          <span className="clue-row-number">{entry.number}</span>
          <span className="clue-row-copy"><span>{entry.clue} <span className="enumeration">({entry.answer.length})</span></span><small>{filled === entry.cells.length ? 'Filled' : `${filled} of ${entry.cells.length} letters`}</small></span>
          <span className="clue-row-arrow" aria-hidden="true">›</span>
        </button>;
      })}
    </div>
  </Dialog>;
}
