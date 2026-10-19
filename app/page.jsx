'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MODES } from '../lib/config.mjs';
import { initialState, currentEntry, selectCell, nextEntry, enterText, backspace, undoInput, moveCell, revealWord, selectEntry, clearWord, revealLetter } from '../lib/input.mjs';
import { DEFAULT_THEME, THEME_KEY, loadLocalTheme } from '../lib/theme.mjs';
import { applyBrowserTheme } from '../lib/browser-theme.mjs';
import { loadSession, saveSession } from '../lib/storage.mjs';
import { generateAndRecord, reserveSharedAnswers } from '../lib/repetition.mjs';
import Dialog from '../components/dialog';
import UiStudio from '../components/ui-studio';
import CrosswordBoard from '../components/crossword-board';
import PuzzleKeyboard from '../components/puzzle-keyboard';
import ClueList from '../components/clue-list';
import { GenerationClient } from '../lib/generation-client.mjs';
import { SharedClient, sharedRequest } from '../lib/shared-client.mjs';
import { TOKEN_PATTERN, playWithRoom } from '../lib/shared-model.mjs';
import SharedGameDialog from '../components/shared-game-dialog';

function Icon({ name }) {
  const paths = { plus: 'M12 5v14M5 12h14', prev: 'm14 6-6 6 6 6', next: 'm10 6 6 6-6 6', undo: 'M9 6 4 11l5 5M4 11h10a6 6 0 0 1 0 12', check: 'm5 12 4 4L19 6', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0', palette: 'M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 0-4h-1a1 1 0 0 1 0-2h4a5 5 0 0 0 5-5c0-4-4-7-9-7Z M7 9h.01M11 6h.01M16 8h.01', keyboard: 'M3 6h18v12H3zM6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 15h8' };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
function makeSeed() { return `${Date.now().toString(36)}-${crypto.randomUUID()}`; }

export default function Home() {
  const [game, setGame] = useState(null), [busy, setBusy] = useState(true), [modal, setModal] = useState(null);
  const [notice, setNotice] = useState(''), [errors, setErrors] = useState([]);
  const [generationError, setGenerationError] = useState('');
  const [shared, setShared] = useState(null), [creatingShare, setCreatingShare] = useState(false), [shareNotice, setShareNotice] = useState('');
  const sharedRef = useRef(null), shareRequestRef = useRef(null), creatingShareRef = useRef(false);
  const [savedTheme, setSavedTheme] = useState(DEFAULT_THEME);
  const [preview, setPreview] = useState(DEFAULT_THEME), [view, setView] = useState(null), [themeLoaded, setThemeLoaded] = useState(false);
  const generatorRef = useRef(null), gameRef = useRef(null), modalRef = useRef(null), lastModeRef = useRef('medium'), busyRef = useRef(busy);
  const zoomRef = useRef(null), savedThemeRef = useRef(savedTheme), lifecycleRef = useRef(0);
  gameRef.current = game; busyRef.current = busy; modalRef.current = modal; savedThemeRef.current = savedTheme;
  const entry = game ? currentEntry(game.puzzle, game.play) : null;
  const solved = !!game && game.puzzle.grid.every((cell, i) => !cell || game.play.answers[i] === cell.letter);

  const startPuzzle = useCallback(async mode => {
    if (!generatorRef.current || generatorRef.current.pending || sharedRef.current || creatingShareRef.current) return;
    const lifecycle = lifecycleRef.current;
    if (new URLSearchParams(location.hash.slice(1)).has('game')) history.replaceState(null, '', location.pathname + location.search);
    lastModeRef.current = mode;
    setModal(null); setBusy(true); setNotice(''); setGenerationError('');
    try {
      const puzzle = await generateAndRecord({ storage:localStorage, locks:navigator.locks, currentPuzzle:gameRef.current?.puzzle, signal:AbortSignal.timeout(30000), makePuzzle:(history, now) => {
        if (lifecycle !== lifecycleRef.current || !generatorRef.current) throw new Error('Generation cancelled.');
        return generatorRef.current.generate({mode,seed:makeSeed(),history,now});
      }});
      if (lifecycle !== lifecycleRef.current) return;
      const next = {puzzle,play:initialState(puzzle)};
      setGame(next); setErrors([]);
      try { saveSession(localStorage,next); } catch { setNotice('Word history is saved, but puzzle progress could not be saved.'); }
    } catch (error) {
      if (lifecycle === lifecycleRef.current) { const message = error.name === 'TimeoutError' ? 'Another tab is generating a puzzle. Try again shortly.' : error.message || 'Could not generate a puzzle.'; setNotice(message); setGenerationError(message); }
    } finally { if (lifecycle === lifecycleRef.current) setBusy(false); }
  }, []);

  const connectShared = useCallback((token, room) => {
    sharedRef.current?.stop();
    let pendingStorage; try { pendingStorage = sessionStorage; } catch { /* Edits still sync in memory. */ }
    const client = new SharedClient({ token, room, storage:pendingStorage, onChange:update => {
      setShared({ token, ...update });
      const current = gameRef.current;
      const play = current?.puzzle?.id === room.puzzle.id ? current.play : initialState(room.puzzle);
      const next = { puzzle:room.puzzle, play:playWithRoom(play, update.room) };
      gameRef.current = next; setGame(next);
      setErrors([]);
    }});
    sharedRef.current = client;
    const reserve = async () => {
      try {
        if (!navigator.locks?.request) throw new Error('Browser locks unavailable');
        await navigator.locks.request('daily-cross:word-generation', { signal:AbortSignal.any([client.controller.signal, AbortSignal.timeout(30000)]) }, () => {
          if (sharedRef.current === client) reserveSharedAnswers(localStorage, room.puzzle);
        });
      } catch {
        if (sharedRef.current === client) setNotice('Shared game opened, but its answers could not be added to this browser’s repeat history.');
      }
    };
    reserve(); client.start();
  }, []);

  const joinShared = useCallback(async token => {
    shareRequestRef.current?.abort();
    const controller = new AbortController(); shareRequestRef.current = controller;
    setBusy(true); setGenerationError('');
    try {
      if (!TOKEN_PATTERN.test(token)) throw new Error('This shared game link is incorrect.');
      const room = await sharedRequest(token, 'GET', undefined, controller.signal);
      if (!controller.signal.aborted) connectShared(token, room);
    } catch (error) { if (!controller.signal.aborted) setGenerationError(error.message || 'Could not open this shared game.'); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }, [connectShared]);

  async function createShared() {
    if (!gameRef.current || creatingShareRef.current || sharedRef.current) return;
    try { saveSession(localStorage, gameRef.current); } catch { /* Sharing still works without local persistence. */ }
    creatingShareRef.current = true; setCreatingShare(true); setShareNotice('');
    const controller = new AbortController(); shareRequestRef.current = controller;
    try {
      const result = await sharedRequest(null, 'POST', { game:gameRef.current }, controller.signal);
      if (controller.signal.aborted) return;
      history.replaceState(null, '', `#game=${result.token}`);
      connectShared(result.token, result.room);
    } catch (error) { if (!controller.signal.aborted) setShareNotice(error.message || 'Could not create a game link.'); }
    finally { creatingShareRef.current = false; setCreatingShare(false); }
  }

  function leaveShared() {
    if (sharedRef.current?.pending.length && !sharedRef.current.fatal) return;
    const keepCopy = sharedRef.current?.fatal && sharedRef.current?.pending.length;
    const copy = keepCopy ? gameRef.current : null;
    shareRequestRef.current?.abort(); sharedRef.current?.stop(); sharedRef.current = null;
    history.replaceState(null, '', location.pathname + location.search);
    setShared(null); setModal(null); setGenerationError('');
    const restored = copy || loadSession(localStorage);
    if (copy) { try { saveSession(localStorage, copy); } catch { setNotice('This solo copy could not be saved.'); } }
    gameRef.current = restored; setGame(restored);
    if (!restored) startPuzzle('medium');
  }

  useEffect(() => {
    lifecycleRef.current++;
    const generator = new GenerationClient(() => new Worker(new URL('../lib/puzzle.worker.mjs', import.meta.url), { type: 'module' }));
    generatorRef.current = generator;
    let restored = null; try { restored = loadSession(localStorage); } catch { /* No browser storage. */ }
    const token = new URLSearchParams(location.hash.slice(1)).get('game');
    if (token !== null) joinShared(token);
    else if (restored) { gameRef.current = restored; setGame(restored); setBusy(false); } else startPuzzle('medium');
    return () => { lifecycleRef.current++; shareRequestRef.current?.abort(); sharedRef.current?.stop(); sharedRef.current = null; generator.dispose(); generatorRef.current?.dispose(); generatorRef.current = null; };
  }, [startPuzzle, joinShared]);

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
    if (!game || sharedRef.current) return;
    const save = () => { if (sharedRef.current) return; try { saveSession(localStorage, gameRef.current); } catch { setNotice('Progress could not be saved in this browser.'); } };
    const timer = setTimeout(save, 200);
    window.addEventListener('pagehide', save);
    return () => { clearTimeout(timer); window.removeEventListener('pagehide', save); };
  }, [game]);

  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 6500); return () => clearTimeout(t); }, [notice]);

  const edit = useCallback(action => {
    const current = gameRef.current;
    if (!current || creatingShareRef.current) return;
    const play = action(current.puzzle, current.play);
    const client = sharedRef.current;
    if (client) {
      try { client.edit(current.play, play); }
      catch (error) { setNotice(error.message); return; }
      const next = { puzzle:current.puzzle, play:playWithRoom({...play, undo:[]}, client.view()) };
      gameRef.current = next; setGame(next);
    } else { const next = {...current, play}; gameRef.current = next; setGame(next); }
    setErrors([]);
  }, []);
  const undo = useCallback(() => {
    if (sharedRef.current) sharedRef.current.undo();
    else edit((p, s) => undoInput(s));
  }, [edit]);
  useEffect(() => {
    const navigate = () => {
      const token = new URLSearchParams(location.hash.slice(1)).get('game');
      if (sharedRef.current?.pending.length) {
        history.replaceState(null, '', `#game=${sharedRef.current.token}`);
        setNotice('Wait for your changes to save before switching games.'); return;
      }
      if (token !== null && token !== sharedRef.current?.token) {
        lifecycleRef.current++;
        generatorRef.current?.dispose();
        generatorRef.current = new GenerationClient(() => new Worker(new URL('../lib/puzzle.worker.mjs', import.meta.url), { type:'module' }));
        sharedRef.current?.stop(); sharedRef.current = null; setShared(null); setGame(null); gameRef.current = null;
        joinShared(token);
      } else if (token === null && sharedRef.current) leaveShared();
    };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, [joinShared]);
  useEffect(() => {
    const warn = event => { if (sharedRef.current?.pending.length) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);
  function tapCell(i) { if (!busy && !modal) edit((p, s) => selectCell(p, s, i)); }
  function changeClue(delta) { edit((p, s) => nextEntry(p, s, delta)); }
  const keyHandler = useCallback(event => {
    if (event.isComposing || modalRef.current || busyRef.current || generatorRef.current?.pending || !gameRef.current || event.target.closest('input,textarea,select')) return;
    const inGame = !!event.target.closest('.board-stage,.keyboard-dock') || event.target === document.body;
    if (event.key === 'Backspace' && inGame) { event.preventDefault(); edit(backspace); }
    else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); }
    else if (event.metaKey || event.ctrlKey || event.altKey) return;
    else if (event.key.startsWith('Arrow') && inGame) { event.preventDefault(); edit((p, s) => moveCell(p, s, event.key)); }
    else if (event.key === 'Enter' && event.target.closest('.board')) { event.preventDefault(); edit((p, s) => nextEntry(p, s, 1)); }
    else if (event.key === ' ' && event.target.closest('.board')) { event.preventDefault(); edit((p, s) => selectCell(p, s, s.selected)); }
    else if (inGame && /^[a-z]$/i.test(event.key)) { event.preventDefault(); edit((p, s) => enterText(p, s, event.key)); }

  }, [edit, undo]);
  useEffect(() => { window.addEventListener('keydown', keyHandler); return () => window.removeEventListener('keydown', keyHandler); }, [keyHandler]);

  function check() {
    if (!game) return;
    if (!Object.values(game.play.answers).some(Boolean)) { setNotice('Enter a few letters first.'); return; }
    const wrong = game.puzzle.grid.flatMap((c, i) => c && game.play.answers[i] && game.play.answers[i] !== c.letter ? [i] : []);
    setErrors(wrong); setNotice(wrong.length ? `${wrong.length} ${wrong.length === 1 ? 'letter needs' : 'letters need'} another look.` : 'All entered letters are correct.');
  }
  const filled = game ? game.puzzle.grid.filter((cell, i) => cell && game.play.answers[i]).length : 0;
  const total = game ? game.puzzle.grid.filter(Boolean).length : 0;
  function openModal(name) { setModal(name); }
  function closeModal() { if (modal === 'studio') setPreview(savedThemeRef.current); setModal(null); }
  const viewportStyle = view && view.scale < 1.05 ? { height: view.height, top: view.top, left: view.left, width: view.width } : {};

  return <main className="app" style={viewportStyle}>
    <header className="header" aria-label="Crossword controls"><div className="header-actions">
      <button className="icon-button" onClick={() => openModal('tools')} aria-label="More puzzle controls" aria-haspopup="dialog"><span aria-hidden="true">···</span></button>
      <button className="icon-button" disabled={!game || busy} onClick={() => openModal('reveal')} aria-label="Reveal current word" title="Reveal word"><Icon name="eye" /></button>
      <div className="zoom-controls" role="group" aria-label="Board zoom"><button disabled={!game || busy} onClick={() => zoomRef.current?.(-1)} aria-label="Zoom out">−</button><button disabled={!game || busy} onClick={() => zoomRef.current?.(0)} aria-label="Fit entire board">Fit</button><button disabled={!game || busy} onClick={() => zoomRef.current?.(1)} aria-label="Zoom in">+</button></div>
      <button className="icon-button" onClick={() => openModal('studio')} aria-label="UI Studio" title="UI Studio"><Icon name="palette" /></button>
      <button className="icon-button new-puzzle" aria-label="Generate a new crossword" aria-haspopup="dialog" disabled={busy || !!shared || creatingShare} onClick={() => openModal('new')}><Icon name="plus" /></button>
    </div></header>
    {shared && <button className="shared-status" onClick={() => openModal('share')} aria-label="Shared game status and invite link"><span>Playing together</span><span role="status">{shared.status === 'ended' ? 'Game unavailable' : shared.status === 'reconnecting' ? 'Reconnecting…' : shared.pending ? 'Saving…' : 'All changes saved'}</span></button>}
    <CrosswordBoard game={game} entry={entry} errors={errors} busy={busy} onSelect={tapCell} zoomRef={zoomRef} generationError={generationError} onRetry={() => { const token = new URLSearchParams(location.hash.slice(1)).get('game'); token !== null ? joinShared(token) : startPuzzle(lastModeRef.current); }} />
    <div className="keyboard-dock">
    <section className="clue-bar" aria-label="Active clue">
      <button className="icon-button" disabled={!game || busy} onMouseDown={e => e.preventDefault()} onClick={() => changeClue(-1)} aria-label="Previous clue"><Icon name="prev" /></button>
      <button className="clue-body" disabled={!game || busy} onClick={() => openModal('clues')} aria-label={entry ? `All clues. Current clue ${entry.number} ${entry.dir}: ${entry.clue}` : 'All clues'} aria-haspopup="dialog">
        <span className="clue-meta"><span>{entry ? `${entry.number} ${entry.dir}` : 'Crossword'}</span><span>{game ? `${filled}/${total} filled` : ''}</span></span>
        <span className="clue-text" aria-live="polite">{entry ? (solved ? (game.play.assisted ? 'Completed with a little help.' : 'Every letter in place. Well done.') : <>{entry.clue} <span className="enumeration">({entry.answer.length})</span></>) : (busy ? 'Building your crossword…' : 'Tap + to start a crossword.')}</span>
      </button>
      <button className="icon-button" disabled={!game || busy} onMouseDown={e => e.preventDefault()} onClick={() => changeClue(1)} aria-label="Next clue"><Icon name="next" /></button>
    </section>
    <PuzzleKeyboard disabled={!game || busy || !!modal} onLetter={letter => edit((p, s) => enterText(p, s, letter))} onDelete={() => edit(backspace)} />

    </div>
    <div className="toast-region" role="status" aria-live="polite">{notice && <div className="toast">{notice}</div>}</div>
    {modal === 'clues' && game && <ClueList game={game} onClose={closeModal} onSelect={id => { edit((p, s) => selectEntry(p, s, id)); closeModal(); }} />}
    {modal === 'new' && <Dialog title="New crossword" onClose={closeModal} className="difficulty-dialog"><div className="difficulty-options">{Object.entries(MODES).map(([key, mode]) => <button className="difficulty-option" key={key} onClick={() => startPuzzle(key)}><span>{mode.label}<small className="difficulty-detail">{mode.cols} × {mode.rows} · {key === 'easy' ? 'Familiar words · Direct clues' : key === 'medium' ? 'Broader words · Mixed clues' : 'Challenging words & clues'}</small></span><Icon name="next" /></button>)}</div></Dialog>}
    {modal === 'tools' && <Dialog title="Puzzle controls" onClose={closeModal}><div className="difficulty-options"><button className="difficulty-option" disabled={!game || busy} onClick={() => { setShareNotice(''); openModal('share'); }}><span>Play together</span><Icon name="next" /></button>{generationError && !game && <button className="difficulty-option" onClick={leaveShared}><span>Return to solo game</span><Icon name="next" /></button>}<button className="difficulty-option" disabled={!game || busy} onClick={() => openModal('clues')}><span>All clues</span><Icon name="next" /></button><button className="difficulty-option" disabled={!(shared ? shared.canUndo : game?.play.undo?.length) || busy} onClick={() => { undo(); closeModal(); }}><span>Undo last entry</span><Icon name="undo" /></button><button className="difficulty-option" disabled={!game || busy} onClick={() => { closeModal(); check(); }}><span>Check letters</span><Icon name="check" /></button><button className="difficulty-option" disabled={!game || busy || !entry?.cells.some(i => game.play.answers[i])} onClick={() => { edit(clearWord); closeModal(); setNotice('Word cleared. Use Undo to restore it.'); }}><span>Clear current word</span><Icon name="undo" /></button></div></Dialog>}
    {modal === 'reveal' && game && <Dialog title="Need a hint?" onClose={closeModal}><p className="dialog-copy">Reveal one letter or {entry.number} {entry.dir}. This solve will be marked as assisted.</p><div className="dialog-actions"><button className="outline-button" onClick={() => { edit(revealLetter); closeModal(); }}>Reveal letter</button><button className="solid-button" onClick={() => { edit(revealWord); closeModal(); }}>Reveal word</button></div></Dialog>}
    {modal === 'share' && <SharedGameDialog shared={shared} creating={creatingShare} notice={shareNotice} onCreate={createShared} onLeave={leaveShared} onClose={closeModal} />}
    {modal === 'studio' && <UiStudio saved={savedTheme} preview={preview} onPreview={setPreview} onClose={closeModal} onSaved={theme => { setSavedTheme(theme); savedThemeRef.current = theme; setPreview(theme); setNotice('Colours saved on this device.'); }} />}
  </main>;
}
