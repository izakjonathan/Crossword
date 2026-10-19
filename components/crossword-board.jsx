'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { fitBoard, fitView, constrain, zoomAt, revealCell, BoardGesture, cellAtPoint } from '../lib/board-view.mjs';
import { MODES } from '../lib/config.mjs';

export default function CrosswordBoard({ game, entry, errors, busy, onSelect, zoomRef }) {
  const area = useRef(null), gesture = useRef(new BoardGesture());
  const frameRef = useRef(null), transform = useRef({ scale: 1, x: 0, y: 0 });
  const [frame, setFrame] = useState(null), [view, setView] = useState(transform.current);
  const puzzle = game?.puzzle, selected = game?.play.selected;
  function update(next) { transform.current = next; setView(next); }
  useEffect(() => {
    const element = area.current; if (!element || !puzzle) return;
    let first = true;
    const resize = () => {
      const previous = frameRef.current, next = fitBoard(element.clientWidth, element.clientHeight, puzzle.cols, puzzle.rows);
      const old = transform.current;
      frameRef.current = next; setFrame(next);
      if (first || !previous) update(fitView(next));
      else update(zoomAt(fitView(next), next, old.scale, { x: next.width / 2, y: next.height / 2 }));
      first = false; gesture.current.reset();
    };
    resize(); const observer = new ResizeObserver(resize); observer.observe(element);
    return () => observer.disconnect();
  }, [puzzle?.id, puzzle?.cols, puzzle?.rows]);
  useEffect(() => {
    if (selected == null || !frame) return;
    update(revealCell(transform.current, frame, selected % puzzle.cols, Math.floor(selected / puzzle.cols)));
  }, [selected, puzzle?.cols, frame]);
  useEffect(() => {
    zoomRef.current = direction => {
      const f = frameRef.current; if (!f) return;
      const v = transform.current;
      update(direction === 0 ? fitView(f) : zoomAt(v, f, v.scale + direction * .5, { x: f.width / 2, y: f.height / 2 }));
    };
    return () => { zoomRef.current = null; };
  }, [zoomRef]);
  useEffect(() => {
    const element = area.current;
    const wheel = event => {
      const f = frameRef.current; if (!f || busy) return;
      event.preventDefault(); const v = transform.current, rect = element.getBoundingClientRect();
      update(event.ctrlKey || event.metaKey ? zoomAt(v, f, v.scale * Math.exp(-event.deltaY * .008), { x: event.clientX - rect.left, y: event.clientY - rect.top }) : constrain({ ...v, x: v.x - event.deltaX, y: v.y - event.deltaY }, f));
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [busy]);
  function point(event) { const r = area.current.getBoundingClientRect(); return { x: event.clientX - r.left, y: event.clientY - r.top }; }
  function down(event) {
    if (busy || (event.pointerType === 'mouse' && event.button !== 0)) return;
    gesture.current.down(event.pointerId, point(event), transform.current);
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event) {
    if (!frameRef.current) return;
    const next = gesture.current.move(event.pointerId, point(event), frameRef.current);
    if (next) update(next);
  }
  function up(event, cancelled = false) {
    if (!gesture.current.pointers.has(event.pointerId)) return;
    if (!cancelled) move(event);
    const tap = gesture.current.up(event.pointerId, transform.current, cancelled);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (tap && frameRef.current && puzzle) {
      const index = cellAtPoint(frameRef.current, transform.current, puzzle.cols, puzzle.rows, point(event));
      if (index !== null && puzzle.grid[index]) onSelect(index);
    }
  }
  // A gesture only changes the wrapper transform; letter buttons stay cached.
  const cells = useMemo(() => puzzle && frame ? (<div className="board" role="group" aria-label={`${MODES[puzzle.mode].label} crossword, ${puzzle.cols} columns by ${puzzle.rows} rows. Pinch to zoom; drag to move.`} style={{ gridTemplateColumns: `repeat(${puzzle.cols},var(--cell))` }}>
        {puzzle.grid.map((cell, i) => cell ? <button key={i} tabIndex={selected === i ? 0 : -1} disabled={busy} className={`cell ${entry.cells.includes(i) ? 'active-word' : ''} ${selected === i ? `selected direction-${entry.dir}` : ''} ${errors.includes(i) ? 'incorrect' : ''}`} onClick={e => { if (e.detail === 0) onSelect(i); }} aria-label={`Row ${Math.floor(i / puzzle.cols) + 1}, column ${i % puzzle.cols + 1}, ${cell.number ? `clue ${cell.number}, ` : ''}${game.play.answers[i] || 'empty'}`} aria-pressed={selected === i}>{cell.number && <span className="cell-number">{cell.number}</span>}<span className="cell-letter">{game.play.answers[i] || ''}</span></button> : <span className="blocked" key={i} />)}
      </div>) : null,
    [puzzle, frame?.cell, selected, entry, game?.play, busy, errors, onSelect]);
  return <div ref={area} className="board-stage" aria-busy={busy} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={e => up(e, true)} onLostPointerCapture={e => { gesture.current.up(e.pointerId, transform.current, true); }} onContextMenu={e => e.preventDefault()}>
    {puzzle && frame && <div className="board-shell" style={{ width: frame.boardWidth, height: frame.boardHeight, '--cell': `${frame.cell}px`, '--cell-height': `${frame.cellHeight}px`, transform: `translate(${view.x}px,${view.y}px) scale(${view.scale})` }}>
      {cells}
    </div>}
    {busy && <div className="generating" role="status"><span className="spinner" /><span>Generating…</span></div>}
  </div>;
}
