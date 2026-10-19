'use client';
import { KEY_ROWS } from '../lib/board-view.mjs';
export default function PuzzleKeyboard({ disabled, onLetter, onDelete }) {
  return <div className="puzzle-keyboard" role="group" aria-label="Crossword keyboard">
    {KEY_ROWS.map((row, i) => <div className={`key-row row-${i}`} key={row}>{[...row].map(letter => <button key={letter} className="letter-key" disabled={disabled} onClick={() => onLetter(letter)}>{letter}</button>)}{i === 2 && <button className="letter-key delete-key" disabled={disabled} onClick={onDelete} aria-label="Delete letter"><svg width="25" height="22" viewBox="0 0 28 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M10 4h15v16H10l-7-8 7-8ZM13 8l8 8m0-8-8 8" /></svg></button>}</div>)}
  </div>;
}
