'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MODES } from '../lib/config.mjs';
import { initialState, currentEntry, selectCell, nextEntry, enterText, backspace, undoInput, moveCell, revealWord } from '../lib/input.mjs';
import { DEFAULT_THEME, THEME_KEY, loadLocalTheme } from '../lib/theme.mjs';
import { applyBrowserTheme } from '../lib/browser-theme.mjs';
import { loadSession, saveSession } from '../lib/storage.mjs';
import { generateAndRecord } from '../lib/repetition.mjs';
import Dialog from '../components/dialog';
import UiStudio from '../components/ui-studio';
import CrosswordBoard from '../components/crossword-board';
import PuzzleKeyboard from '../components/puzzle-keyboard';

function Icon({ name }) {
  const paths = { plus: 'M12 5v14M5 12h14', prev: 'm14 6-6 6 6 6', next: 'm10 6 6 6-6 6', undo: 'M9 6 4 11l5 5M4 11h10a6 6 0 0 1 0 12', check: 'm5 12 4 4L19 6', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0', palette: 'M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 0-4h-1a1 1 0 0 1 0-2h4a5 5 0 0 0 5-5c0-4-4-7-9-7Z M7 9h.01M11 6h.01M16 8h.01', keyboard: 'M3 6h18v12H3zM6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 15h8' };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
function makeSeed() { return `${Date.now().toString(36)}-${crypto.randomUUID()}`; }

export default function Home() {
  const [game, setGame] = useState(null), [busy, setBusy] = useState(true), [modal, setModal] = useState(null);
  const [notice, setNotice] = useState(''), [errors, setErrors] = useState([]);
  const [savedTheme, setSavedTheme] = useState(DEFAULT_THEME);
  const [preview, setPreview] = useState(DEFAULT_THEME), [view, setView] = useState(null), [themeLoaded, setThemeLoaded] = useState(false);
  const workerRef = useRef(null), pendingRef = useRef(null), timeoutRef = useRef(null), gameRef = useRef(null), modalRef = useRef(null);
  const zoomRef = useRef(null), savedThemeRef = useRef(savedTheme), taskRef = useRef(null), lifecycleRef = useRef(0);
  gameRef.current = game; modalRef.current = modal; savedThemeRef.current = savedTheme;
  const entry = game ? currentEntry(game.puzzle, game.play) : null;
  const solved = !!game && game.puzzle.grid.every((cell, i) => !cell || game.play.answers[i] === cell.letter);

  const startPuzzle = useCallback(async mode => {
    if (!workerRef.current) { setNotice('The generator is unavailable. Reload the page and try again.'); return; }
    const lifecycle = lifecycleRef.current;
    setModal(null); setBusy(true); setNotice('');
    try {
      const puzzle = await generateAndRecord({ storage:localStorage, locks:navigator.locks, currentPuzzle:gameRef.current?.puzzle, signal:AbortSignal.timeout(30000), makePuzzle:(history, now) => {
        if (lifecycle !== lifecycleRef.current || !workerRef.current) throw new Error('Generation cancelled.');
        return new Promise((resolve,reject) => {
          const requestId = crypto.randomUUID(); pendingRef.current = requestId; taskRef.current = {resolve,reject};
          workerRef.current.postMessage({requestId,options:{mode,seed:makeSeed(),history,now}});
          clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            if (pendingRef.current === requestId) { pendingRef.current = null; taskRef.current = null; reject(new Error('Generation took too long. Your current puzzle has been kept.')); }
          },20000);
        });
      }});
      if (lifecycle !== lifecycleRef.current) return;
      const next = {puzzle,play:initialState(puzzle)};
      setGame(next); setErrors([]);
      try { saveSession(localStorage,next); } catch { setNotice('Word history is saved, but puzzle progress could not be saved.'); }
    } catch (error) {
      if (lifecycle === lifecycleRef.current) setNotice(error.name === 'TimeoutError' ? 'Another tab is generating a puzzle. Try again shortly.' : error.message || 'Could not generate a puzzle.');
    } finally { if (lifecycle === lifecycleRef.current) setBusy(false); }
  }, []);

  useEffect(() => {
    let worker;
    lifecycleRef.current++;
    try {
      worker = new Worker(new URL('../lib/puzzle.worker.mjs', import.meta.url), { type: 'module' });
      workerRef.current = worker;
      worker.onmessage = ({data}) => {
        if (data.requestId !== pendingRef.current) return;
        clearTimeout(timeoutRef.current); pendingRef.current = null;
        const task = taskRef.current; taskRef.current = null;
        if (data.error) task?.reject(new Error(data.error)); else task?.resolve(data.puzzle);
      };
      worker.onerror = () => { clearTimeout(timeoutRef.current); pendingRef.current = null; taskRef.current?.reject(new Error('The generator could not start. Reload the page to try again.')); taskRef.current = null; };
      let restored = null; try { restored = loadSession(localStorage); } catch { /* No browser storage. */ }
      if (restored) { setGame(restored); setBusy(false); } else startPuzzle('medium');
    } catch { setBusy(false); setNotice('Your browser could not start the puzzle generator. Try reloading.'); }
    return () => { lifecycleRef.current++; pendingRef.current = null; clearTimeout(timeoutRef.current); taskRef.current?.reject(new Error('Generation cancelled.')); taskRef.current = null; worker?.terminate(); workerRef.current = null; };
  }, [startPuzzle]);

  useEffect(() => {
    const sync = () => {
      const v = window.visualViewport;
      setView({ height: v?.height || window.innerHeight, width: v?.width || window.innerWidth, top: v?.offsetTop || 0, left: v?.offsetLeft || 0, scale: v?.scale || 1 });
    };
    sync(); window.addEventListener('resize', sync); window.visualViewport?.addEventListener('resize', sync); window.visualViewport?.addEventListener('scroll', sync);
    return () => { window.removeEventListener('resize', sync); window.visualViewport?.removeEventListener('resize', sync); window.visualViewport?.removeEventListener('scroll', sync); };
  }, []);

  useEffect(() => {
    function refresh() {
      let theme = DEFAULT_THEME;
      try { theme = loadLocalTheme(localStorage); } catch { /* Defaults remain usable when browser storage is unavailable. */ }
      setSavedTheme(theme); savedThemeRef.current = theme;
      if (modalRef.current !== 'studio') { setPreview(theme); applyBrowserTheme(document, theme); }
      setThemeLoaded(true);
    }
    refresh();
    const sync = event => { if (event.key === THEME_KEY || event.key === null) refresh(); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => { if (themeLoaded) applyBrowserTheme(document, preview); }, [preview, themeLoaded]);

  useEffect(() => {
    if (!game) return;
    const save = () => { try { saveSession(localStorage, gameRef.current); } catch { setNotice('Progress could not be saved in this browser.'); } };
    const timer = setTimeout(save, 200);
    window.addEventListener('pagehide', save);
    return () => { clearTimeout(timer); window.removeEventListener('pagehide', save); };
  }, [game]);

  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 6500); return () => clearTimeout(t); }, [notice]);

  const edit = useCallback(action => {
    setGame(current => current ? { ...current, play: action(current.puzzle, current.play) } : current);
    setErrors([]);
  }, []);
  function tapCell(i) { if (!busy) edit((p, s) => selectCell(p, s, i)); }
  function changeClue(delta) { edit((p, s) => nextEntry(p, s, delta)); }
  const keyHandler = useCallback(event => {
    if (event.isComposing || modalRef.current || pendingRef.current || !gameRef.current || event.target.closest('input,textarea,select')) return;
    const inGame = !!event.target.closest('.board-stage,.keyboard-dock') || event.target === document.body;
    if (event.key === 'Backspace' && inGame) { event.preventDefault(); edit(backspace); }
    else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); edit((p, s) => undoInput(s)); }
    else if (event.metaKey || event.ctrlKey || event.altKey) return;
    else if (event.key.startsWith('Arrow') && inGame) { event.preventDefault(); edit((p, s) => moveCell(p, s, event.key)); }
    else if (event.key === 'Enter' && event.target.closest('.board')) { event.preventDefault(); edit((p, s) => nextEntry(p, s, 1)); }
    else if (event.key === ' ' && event.target.closest('.board')) { event.preventDefault(); edit((p, s) => selectCell(p, s, s.selected)); }
    else if (inGame && /^[a-z]$/i.test(event.key)) { event.preventDefault(); edit((p, s) => enterText(p, s, event.key)); }

  }, [edit]);
  useEffect(() => { window.addEventListener('keydown', keyHandler); return () => window.removeEventListener('keydown', keyHandler); }, [keyHandler]);

  function check() {
    if (!game) return;
    if (!Object.values(game.play.answers).some(Boolean)) { setNotice('Enter a few letters first.'); return; }
    const wrong = game.puzzle.grid.flatMap((c, i) => c && game.play.answers[i] && game.play.answers[i] !== c.letter ? [i] : []);
    setErrors(wrong); setNotice(wrong.length ? `${wrong.length} ${wrong.length === 1 ? 'letter needs' : 'letters need'} another look.` : 'All entered letters are correct.');
  }
  function openModal(name) { setModal(name); }
  function closeModal() { if (modal === 'studio') setPreview(savedThemeRef.current); setModal(null); }
  const viewportStyle = view && view.scale < 1.05 ? { height: view.height, top: view.top, left: view.left, width: view.width } : {};

  return <main className="app" style={viewportStyle}>
    <header className="header" aria-label="Crossword controls"><div className="header-actions">
      <button className="icon-button" onClick={() => openModal('tools')} aria-label="More puzzle controls" aria-haspopup="dialog"><span aria-hidden="true">···</span></button>
      <button className="icon-button" disabled={!game || busy} onClick={() => openModal('reveal')} aria-label="Reveal current word" title="Reveal word"><Icon name="eye" /></button>
      <div className="zoom-controls" role="group" aria-label="Board zoom"><button disabled={!game || busy} onClick={() => zoomRef.current?.(-1)} aria-label="Zoom out">−</button><button disabled={!game || busy} onClick={() => zoomRef.current?.(0)} aria-label="Fit entire board">Fit</button><button disabled={!game || busy} onClick={() => zoomRef.current?.(1)} aria-label="Zoom in">+</button></div>
      <button className="icon-button" onClick={() => openModal('studio')} aria-label="UI Studio" title="UI Studio"><Icon name="palette" /></button>
      <button className="icon-button new-puzzle" aria-label="Generate a new crossword" aria-haspopup="dialog" disabled={busy} onClick={() => openModal('new')}><Icon name="plus" /></button>
    </div></header>
    <CrosswordBoard game={game} entry={entry} errors={errors} busy={busy} onSelect={tapCell} zoomRef={zoomRef} />
    <div className="keyboard-dock">
    <section className="clue-bar" aria-label="Active clue">
      <button className="icon-button" disabled={!game || busy} onMouseDown={e => e.preventDefault()} onClick={() => changeClue(-1)} aria-label="Previous clue"><Icon name="prev" /></button>
      <div className="clue-body"><p aria-live="polite">{entry ? (solved ? (game.play.assisted ? 'Completed with a little help.' : 'Every letter in place. Well done.') : <>{entry.clue} <span>({entry.answer.length})</span></>) : (busy ? 'Generating your crossword…' : 'Tap + to generate a crossword.')}</p></div>
      <button className="icon-button" disabled={!game || busy} onMouseDown={e => e.preventDefault()} onClick={() => changeClue(1)} aria-label="Next clue"><Icon name="next" /></button>
    </section>
    <PuzzleKeyboard disabled={!game || busy || !!modal} onLetter={letter => edit((p, s) => enterText(p, s, letter))} onDelete={() => edit(backspace)} />

    </div>
    <div className="toast-region" role="status" aria-live="polite">{notice && <div className="toast">{notice}</div>}</div>
    {modal === 'new' && <Dialog title="New crossword" onClose={closeModal} className="difficulty-dialog"><div className="difficulty-options">{Object.entries(MODES).map(([key, mode]) => <button className="difficulty-option" key={key} onClick={() => startPuzzle(key)}><span>{mode.label}</span><Icon name="next" /></button>)}</div></Dialog>}
    {modal === 'tools' && <Dialog title="Puzzle controls" onClose={closeModal}><div className="difficulty-options"><button className="difficulty-option" disabled={!game?.play.undo?.length || busy} onClick={() => { edit((p, s) => undoInput(s)); closeModal(); }}><span>Undo last entry</span><Icon name="undo" /></button><button className="difficulty-option" disabled={!game || busy} onClick={() => { closeModal(); check(); }}><span>Check letters</span><Icon name="check" /></button></div></Dialog>}
    {modal === 'reveal' && <Dialog title="Reveal this word?" onClose={closeModal}><p className="dialog-copy">This adds the answer for {entry.number} {entry.dir} and marks this solve as assisted.</p><div className="dialog-actions"><button className="outline-button" onClick={closeModal}>Cancel</button><button className="solid-button" onClick={() => { edit(revealWord); closeModal(); }}>Reveal</button></div></Dialog>}
    {modal === 'studio' && <UiStudio saved={savedTheme} preview={preview} onPreview={setPreview} onClose={closeModal} onSaved={theme => { setSavedTheme(theme); savedThemeRef.current = theme; setPreview(theme); setNotice('Colours saved on this device.'); }} />}
  </main>;
}
