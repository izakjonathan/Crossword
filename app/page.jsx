'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MODES } from '../lib/config.mjs';
import { initialState, currentEntry, selectCell, nextEntry, enterText, backspace, undoInput, moveCell, revealWord, selectEntry, clearWord, revealLetter, clearAndAdvance } from '../lib/input.mjs';
import { DEFAULT_THEME, THEME_KEY, loadLocalTheme, saveLocalTheme } from '../lib/theme.mjs';
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
import { TOKEN_PATTERN, playWithRoom, roundId, sharedHistory, SHARED_MODALS } from '../lib/shared-model.mjs';
import SharedGameDialog from '../components/shared-game-dialog';
import { playerId, loadSharedSession, saveSharedSession, clearSharedSession, lobbyRequest } from '../lib/lobby-session.mjs';
import GameLibrary from '../features/library/game-library';
import { saveLibraryGame } from '../features/library/store.mjs';
import {writePencilCell} from '../features/solve/pencil-model.mjs';
import PreferencesDialog from '../features/solve/preferences-dialog';
import SolveSummary from '../features/solve/solve-summary';
import ClueSidebar from '../features/solve/clue-sidebar';
import { loadPreferences, savePreferences, DEFAULT_PREFERENCES, solveStats, updateStats, checkProgress, elapsedSeconds, formatTime } from '../features/solve/model.mjs';
import { usePlayers } from '../features/players/use-players';
import { GlobalThemeClient } from '../lib/global-theme-client.mjs';

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
  const deviceRef = useRef(null), [leavingShare, setLeavingShare] = useState(false), leavingRef = useRef(false);
  const deviceId = useCallback(() => {
    if (!deviceRef.current) { try { deviceRef.current = playerId(localStorage); } catch { deviceRef.current = crypto.randomUUID(); } }
    return deviceRef.current;
  }, []);
  const sharedRef = useRef(null), shareRequestRef = useRef(null), creatingShareRef = useRef(false);
  const [savedTheme, setSavedTheme] = useState(DEFAULT_THEME);
  const [preview, setPreview] = useState(DEFAULT_THEME), [view, setView] = useState(null), [themeLoaded, setThemeLoaded] = useState(false);
  const generatorRef = useRef(null), gameRef = useRef(null), modalRef = useRef(null), lastModeRef = useRef('medium'), busyRef = useRef(busy);
  const [preferences,setPreferences]=useState(DEFAULT_PREFERENCES),preferencesRef=useRef(preferences);preferencesRef.current=preferences;
  const [clock,setClock]=useState(Date.now()),summaryRef=useRef(null);
  const themeClientRef = useRef(null);
  const zoomRef = useRef(null), savedThemeRef = useRef(savedTheme), lifecycleRef = useRef(0);
  gameRef.current = game; busyRef.current = busy; modalRef.current = modal; savedThemeRef.current = savedTheme;
  const entry = game ? currentEntry(game.puzzle, game.play) : null;
  const solved = !!game && game.puzzle.grid.every((cell, i) => !cell || game.play.answers[i] === cell.letter);

  const players=usePlayers(shared?.lobby?.id,deviceId,preferences.playerName);
  const archiveCurrent = useCallback(() => {
    if(!gameRef.current)return true;
    try { const client=sharedRef.current;saveLibraryGame(localStorage,gameRef.current,client?{token:client.token,lobby:client.lobby}:null);return true; }
    catch(error){setNotice(error.message || 'This game could not be saved in your library.');return false;}
  }, []);
  function changePreferences(patch) {
    const next={...preferencesRef.current,...patch};preferencesRef.current=next;setPreferences(next);
    try{savePreferences(localStorage,next);}catch{setNotice('Preferences could not be saved on this device.');}
  }
  useEffect(()=>{try{const value=loadPreferences(localStorage);preferencesRef.current=value;setPreferences(value);}catch{/* Defaults remain usable without browser storage. */}},[]);
  useEffect(()=>{if(!preferences.showTimer||!game||solved)return;const timer=setInterval(()=>setClock(Date.now()),1000);return()=>clearInterval(timer);},[preferences.showTimer,!!game,solved]);
  useEffect(()=>{
    if(!game)return;
    const timer=setTimeout(archiveCurrent,300),save=()=>archiveCurrent();window.addEventListener('pagehide',save);
    return()=>{clearTimeout(timer);window.removeEventListener('pagehide',save);};
  },[game,archiveCurrent]);
  useEffect(()=>{
    if(!solved)return;
    const key=game.sharedRound||game.puzzle.id;if(summaryRef.current===key)return;summaryRef.current=key;
    if(sharedRef.current){try{sharedRef.current.setView({modal:'summary'});}catch{/* Can reopen summary from controls after syncing. */}}
    else {modalRef.current='summary';setModal('summary');}
  },[solved,game?.puzzle.id,game?.sharedRound]);

  const startPuzzle = useCallback(async mode => {
    if (!generatorRef.current || generatorRef.current.pending || creatingShareRef.current) return;
    if(archiveCurrent()===false)return;
    const client = sharedRef.current;
    const lifecycle = lifecycleRef.current;
    if (!client && new URLSearchParams(location.hash.slice(1)).has('game')) history.replaceState(null, '', location.pathname + location.search);
    lastModeRef.current = mode;
    setModal(null); setBusy(true); setNotice(''); setGenerationError('');
    try {
      const generate = async room => generateAndRecord({ storage:localStorage, locks:navigator.locks, currentPuzzle:gameRef.current?.puzzle, signal:AbortSignal.timeout(30000), historyForGeneration:(history,now) => room ? sharedHistory(history,room,now) : history, makePuzzle:(history, now) => {
        if (lifecycle !== lifecycleRef.current || !generatorRef.current) throw new Error('Generation cancelled.');
        return generatorRef.current.generate({mode,seed:makeSeed(),history,now});
      }});
      if (client) await client.newRound(generate);
      else {
        const puzzle = await generate();
        if (lifecycle !== lifecycleRef.current) return;
        const next = {puzzle,play:initialState(puzzle),stats:solveStats()}; gameRef.current = next;
        setGame(next); setErrors([]);
        try { saveSession(localStorage,next); } catch { setNotice('Word history is saved, but puzzle progress could not be saved.'); }
      }
    } catch (error) {
      if (lifecycle === lifecycleRef.current) { const message = error.name === 'TimeoutError' ? 'Another tab is generating a puzzle. Try again shortly.' : error.message || 'Could not generate a puzzle.'; setNotice(message); setGenerationError(message); }
    } finally { if (lifecycle === lifecycleRef.current) setBusy(!!sharedRef.current?.generating()); }
  }, [archiveCurrent]);

  const connectShared = useCallback((token, room, lobby = null) => {
    sharedRef.current?.stop();
    let pendingStorage; try { pendingStorage = sessionStorage; } catch { /* Edits still sync in memory. */ }
    let reservedRound, seenNotice;
    const client = new SharedClient({ token, room, storage:pendingStorage, onChange:update => {
      setShared({ token, lobby, ...update });
      const active = update.room, current = gameRef.current;
      const same = current?.sharedRound === roundId(active);
      if(!same&&current?.sharedRound)archiveCurrent();
      const play = same ? current.play : initialState(active.puzzle);
      const next = { stats:active.stats||solveStats(), puzzle:active.puzzle, play:playWithRoom(play, active), sharedRound:roundId(active) };
      if(!same||JSON.stringify(current.play)!==JSON.stringify(next.play)||JSON.stringify(current.stats)!==JSON.stringify(next.stats)){gameRef.current=next;setGame(next);}
      setBusy(update.generating);
      setErrors(active.view?.errors || []);
      if (SHARED_MODALS.includes(modalRef.current) || (!same && !['studio','share'].includes(modalRef.current))) {
        modalRef.current = active.view?.modal || null; setModal(modalRef.current);
      }
      if (active.view?.notice && (active.view.noticeId || active.view.notice) !== seenNotice) setNotice(active.view.notice);
      seenNotice = active.view?.noticeId || active.view?.notice;
      if (update.message) setNotice(update.message);
      if (reservedRound !== roundId(active)) {
        reservedRound = roundId(active);
        (async () => {
          try {
            if (!navigator.locks?.request) throw new Error('Browser locks unavailable');
            await navigator.locks.request('daily-cross:word-generation', { signal:AbortSignal.any([client.controller.signal, AbortSignal.timeout(30000)]) }, () => {
              if (sharedRef.current === client) reserveSharedAnswers(localStorage, active.puzzle);
            });
          } catch { if (sharedRef.current === client) setNotice('Shared game opened, but its answers could not be added to this browser’s repeat history.'); }
        })();
      }
    }});
    client.lobby = lobby;
    try { saveSharedSession(localStorage, {token,lobby}); } catch { setNotice('Connected. Keep this page open; this browser cannot save the session for reopening.'); }
    sharedRef.current = client; client.start();
  }, [archiveCurrent]);

  const joinShared = useCallback(async token => {
    shareRequestRef.current?.abort();
    const controller = new AbortController(); shareRequestRef.current = controller;
    setBusy(true); setGenerationError('');
    try {
      if (!TOKEN_PATTERN.test(token)) throw new Error('This shared game link is incorrect.');
      const room = await sharedRequest(token, 'GET', undefined, controller.signal);
      if (!controller.signal.aborted) connectShared(token, room);
    } catch (error) { if (!controller.signal.aborted) setGenerationError(error.message || 'Could not open this shared game.'); }
    finally { if (!controller.signal.aborted) setBusy(!!sharedRef.current?.generating()); }
  }, [connectShared]);

  const joinLobby = useCallback(async (id, resuming = false) => {
    if (creatingShareRef.current || sharedRef.current) return;
    if(archiveCurrent()===false)return;
    shareRequestRef.current?.abort();
    const controller = new AbortController(); shareRequestRef.current = controller;
    creatingShareRef.current = true; setCreatingShare(true); setShareNotice(''); setGenerationError(''); setBusy(true);
    try {
      if (gameRef.current) { try { saveSession(localStorage, gameRef.current); } catch { /* Joining works without persistence. */ } }
      const result = await lobbyRequest({action:'join',lobbyId:id,playerId:deviceId()}, controller.signal);
      if (controller.signal.aborted) return;
      history.replaceState(null, '', location.pathname + location.search);
      connectShared(result.token, result.room, result.lobby); setModal(null);
    } catch (error) {
      if (!controller.signal.aborted) {
        setShareNotice(error.message); setModal('share');
        if (resuming && error.status === 404) { try { clearSharedSession(localStorage); } catch { /* No saved session. */ } }
        if (!gameRef.current) {
          let restored; try { restored = loadSession(localStorage); } catch { /* No solo progress. */ }
          if (restored) { gameRef.current = restored; setGame(restored); }
          else setGenerationError(error.message);
        }
      }
    } finally { if (!controller.signal.aborted) { creatingShareRef.current = false; setCreatingShare(false); setBusy(!!sharedRef.current?.generating()); } }
  }, [connectShared, deviceId, archiveCurrent]);

  async function createShared(name) {
    if (!gameRef.current || creatingShareRef.current || sharedRef.current) return;
    archiveCurrent();
    try { saveSession(localStorage, gameRef.current); } catch { /* Hosting works without persistence. */ }
    creatingShareRef.current = true; setCreatingShare(true); setShareNotice('');
    const controller = new AbortController(); shareRequestRef.current = controller;
    try {
      const result = await lobbyRequest({action:'host',name,game:gameRef.current,playerId:deviceId()}, controller.signal);
      if (controller.signal.aborted) return;
      history.replaceState(null, '', location.pathname + location.search);
      connectShared(result.token, result.room, result.lobby);
    } catch (error) { if (!controller.signal.aborted) setShareNotice(error.message || 'Could not host this game.'); }
    finally { creatingShareRef.current = false; setCreatingShare(false); }
  }

  async function leaveShared() {
    if (leavingRef.current) return;
    const client = sharedRef.current;
    if (client?.generating()) { setShareNotice('Wait for the new shared puzzle to finish.'); return; }
    if (client?.pending.length && !client.fatal) return;
    archiveCurrent();
    leavingRef.current = true; setLeavingShare(true); setShareNotice('');
    try {
      if (client?.lobby) await lobbyRequest({action:'leave',lobbyId:client.lobby.id,playerId:deviceId()});
      const copy = client?.fatal && client?.pending.length ? gameRef.current : null;
      shareRequestRef.current?.abort(); client?.stop(); sharedRef.current = null;
      try { clearSharedSession(localStorage); } catch { /* Browser storage unavailable. */ }
      history.replaceState(null, '', location.pathname + location.search);
      setShared(null); setModal(null); setGenerationError(''); setErrors([]); setNotice('');
      let restored = copy; try { restored ||= loadSession(localStorage); if (copy) saveSession(localStorage, copy); } catch { /* Restore in memory when storage is unavailable. */ }
      gameRef.current = restored; setGame(restored);
      if (!restored) startPuzzle('medium');
    } catch (error) { setShareNotice(error.message || 'Could not leave this lobby. Try again.'); setModal('share'); }
    finally { leavingRef.current = false; setLeavingShare(false); }
  }

  useEffect(() => {
    lifecycleRef.current++;
    const generator = new GenerationClient(() => new Worker(new URL('../lib/puzzle.worker.mjs', import.meta.url), { type: 'module' }));
    generatorRef.current = generator;
    let restored = null; try { restored = loadSession(localStorage); } catch { /* No browser storage. */ }
    const token = new URLSearchParams(location.hash.slice(1)).get('game');
    let saved; try { saved = loadSharedSession(localStorage); } catch { /* Browser storage unavailable. */ }
    creatingShareRef.current = false;
    if (token !== null) joinShared(token);
    else if (saved?.lobby) joinLobby(saved.lobby.id, true);
    else if (saved?.token) joinShared(saved.token);
    else if (restored) { gameRef.current = restored; setGame(restored); setBusy(false); } else startPuzzle('medium');
    return () => { lifecycleRef.current++; shareRequestRef.current?.abort(); sharedRef.current?.stop(); sharedRef.current = null; generator.dispose(); generatorRef.current?.dispose(); generatorRef.current = null; };
  }, [startPuzzle, joinShared, joinLobby]);

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
    const client = new GlobalThemeClient({ onTheme:theme => {
      setSavedTheme(theme); savedThemeRef.current = theme;
      try { saveLocalTheme(localStorage, theme); } catch { /* Global saves work without browser storage. */ }
      if (modalRef.current !== 'studio') { setPreview(theme); applyBrowserTheme(document, theme); }
    }});
    themeClientRef.current = client;
    const sync = event => { if (event.key === THEME_KEY || event.key === null) client.refresh(); };
    const focus = () => client.refresh();
    const visible = () => { if (!document.hidden) client.refresh(); };
    window.addEventListener('storage', sync); window.addEventListener('focus', focus); document.addEventListener('visibilitychange', visible);
    client.start();
    return () => {
      client.stop(); if (themeClientRef.current === client) themeClientRef.current = null;
      window.removeEventListener('storage', sync); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', visible);
    };
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

  const edit = useCallback((action, metrics) => {
    const current = gameRef.current;
    if (!current || creatingShareRef.current) return;
    const play = action(current.puzzle, current.play);
    const client = sharedRef.current;
    if (client) {
      try { client.edit(current.play, play, metrics); }
      catch (error) { setNotice(error.message); return; }
      const next = { ...current, play:playWithRoom({...play, undo:[]}, client.view()) };
      gameRef.current = next; setGame(next);
    } else { const next = {...current, stats:updateStats(current.stats,current.puzzle,play,metrics), play}; gameRef.current = next; setGame(next); }
    if (!client) setErrors([]);
  }, []);
  const undo = useCallback(() => {
    if (sharedRef.current) { try { sharedRef.current.undo(); } catch (error) { setNotice(error.message); } }
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
      } else if (token === null && sharedRef.current && !sharedRef.current.lobby) leaveShared();
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
    else if (event.key === ' ' && event.target.closest('.board')) { event.preventDefault(); edit(preferencesRef.current.spaceAction==='clear'?clearAndAdvance:(p, s) => selectCell(p, s, s.selected)); }
    else if (inGame && /^[a-z]$/i.test(event.key)) { event.preventDefault(); edit((p, s) => enterText(p, s, event.key, preferencesRef.current)); }

  }, [edit, undo]);
  useEffect(() => { window.addEventListener('keydown', keyHandler); return () => window.removeEventListener('keydown', keyHandler); }, [keyHandler]);

  function check(scope='puzzle') {
    if(!game)return;
    const result=checkProgress(game.puzzle,game.play,scope);
    if(sharedRef.current) {try{sharedRef.current.setView({errors:result.wrong,notice:result.message,noticeId:crypto.randomUUID(),modal:null},result.entered?{checks:1}:undefined);}catch(error){setNotice(error.message);}}
    else {setErrors(result.wrong);setNotice(result.message);setModal(null);if(result.entered){const next={...game,stats:updateStats(game.stats,game.puzzle,game.play,{checks:1})};gameRef.current=next;setGame(next);}}
  }
  async function openSaved(row,soloCopy=false){
    if(sharedRef.current||busyRef.current)return;
    if(archiveCurrent()===false)return;
    if(row.shared&&!soloCopy){setModal('share');if(row.shared.lobby)await joinLobby(row.shared.lobby.id);else await joinShared(row.shared.token);return;}
    const restored={...row.game,play:{...row.game.play,undo:[]}};
    gameRef.current=restored;setGame(restored);setModal(null);setErrors([]);setGenerationError('');
    try{saveSession(localStorage,restored);}catch{setNotice('This game could not be saved as your current game.');}
  }

  function publishView(value) {
    try { sharedRef.current?.setView(value); } catch (error) { setNotice(error.message); }
  }
  function openModal(name) {
    if (sharedRef.current && SHARED_MODALS.includes(name)) publishView({modal:name});
    else { modalRef.current = name; setModal(name); }
  }
  function closeModal() {
    if (modal === 'studio') setPreview(savedThemeRef.current);
    if (sharedRef.current && SHARED_MODALS.includes(modalRef.current)) publishView({modal:null});
    else { modalRef.current = null; setModal(null); }
  }
  const visibleErrors=preferences.autoCheck&&game?checkProgress(game.puzzle,game.play).wrong:errors;
  const viewportStyle = view && view.scale < 1.05 ? { height: view.height, top: view.top, left: view.left, width: view.width } : {};

  return <main className={`app${shared?' has-shared':''}`} style={viewportStyle}>
    <header className="header" aria-label="Crossword controls"><div className="header-actions">
      <button className="icon-button" onClick={() => openModal('tools')} aria-label="More puzzle controls" aria-haspopup="dialog"><span aria-hidden="true">···</span></button>
      <button className="icon-button" disabled={!game || busy} onClick={() => openModal('reveal')} aria-label="Reveal current word" title="Reveal word"><Icon name="eye" /></button>
      <div className="zoom-controls" role="group" aria-label="Board zoom"><button disabled={!game || busy} onClick={() => zoomRef.current?.(-1)} aria-label="Zoom out">−</button><button disabled={!game || busy} onClick={() => zoomRef.current?.(0)} aria-label="Fit entire board">Fit</button><button disabled={!game || busy} onClick={() => zoomRef.current?.(1)} aria-label="Zoom in">+</button></div>
      <button className="icon-button" onClick={() => openModal('studio')} aria-label="UI Studio" title="UI Studio"><Icon name="palette" /></button>
      <button className="icon-button new-puzzle" aria-label="Generate a new crossword" aria-haspopup="dialog" disabled={busy || creatingShare} onClick={() => openModal('new')}><Icon name="plus" /></button>
    </div></header>
    {shared && <button className="shared-status" onClick={() => openModal('share')} aria-label="Shared session and players"><span>{shared.lobby?.name||'Playing together'}{players.participants.length?` · ${players.participants.filter(p=>p.online).length} online`:''}</span><span role="status">{shared.generating ? 'Building a new puzzle…' : shared.status === 'ended' ? 'Game unavailable' : shared.status === 'reconnecting' ? 'Reconnecting…' : shared.pending ? 'Saving…' : 'All changes saved'}</span></button>}
    {game&&preferences.showTimer&&<div className="solve-timer" aria-label="Elapsed solving time">{formatTime(elapsedSeconds(game.stats,clock))}{shared?' · Session time':''}</div>}
    <div className="solve-workspace">
    <CrosswordBoard game={game} entry={entry} errors={visibleErrors} busy={busy} onSelect={tapCell} zoomRef={zoomRef} sharedBoard={shared?.room.view?.board} onBoardView={board => publishView({board})} pencilMode={preferences.inputMode==='pencil'} onPencilWrite={(index,letter)=>{if(!busy&&!modal)edit((p,s)=>writePencilCell(p,s,index,letter));}} generationError={generationError} onRetry={() => { const token = new URLSearchParams(location.hash.slice(1)).get('game'); token !== null ? joinShared(token) : startPuzzle(lastModeRef.current); }} />
    {game&&<ClueSidebar game={game} busy={busy||!!modal} onSelect={id=>edit((p,s)=>selectEntry(p,s,id))}/>}
    </div>
    <div className="keyboard-dock">
    <section className="clue-bar" aria-label="Active clue">
      <button className="icon-button" disabled={!game || busy} onMouseDown={e => e.preventDefault()} onClick={() => changeClue(-1)} aria-label="Previous clue"><Icon name="prev" /></button>
      <div className="clue-body">
        <span className="clue-text" aria-live="polite">{entry ? (solved ? (game.play.assisted ? 'Completed with a little help.' : 'Every letter in place. Well done.') : <>{entry.clue} <span className="enumeration">({entry.answer.length})</span></>) : (busy ? 'Building your crossword…' : 'Tap + to start a crossword.')}</span>
      </div>
      <button className="all-clues-button" disabled={!game || busy} onClick={() => openModal('clues')} aria-label="All clues" aria-haspopup="dialog">All<br />clues</button>
      <button className="icon-button" disabled={!game || busy} onMouseDown={e => e.preventDefault()} onClick={() => changeClue(1)} aria-label="Next clue"><Icon name="next" /></button>
    </section>
    {preferences.inputMode==='pencil'?<div className="pencil-controls" role="group" aria-label="Pencil controls"><span>Apple Pencil · write in a square</span><button disabled={!game||busy||!!modal} onClick={()=>edit((p,s)=>writePencilCell(p,s,s.selected,''))}>Clear square</button><button disabled={!game||busy||!!modal} onClick={undo}>Undo</button><button onClick={()=>changePreferences({inputMode:'keyboard'})}>Use keyboard</button></div>:<PuzzleKeyboard disabled={!game || busy || !!modal} onLetter={letter => edit((p, s) => enterText(p, s, letter, preferencesRef.current))} onDelete={() => edit(backspace)} />}

    </div>
    <div className="toast-region" role="status" aria-live="polite">{notice && <div className="toast">{notice}</div>}</div>
    {modal === 'clues' && game && <ClueList game={game} sharedDirection={shared?.room.view?.clueDirection} onDirection={clueDirection => publishView({clueDirection})} onClose={closeModal} onSelect={id => { edit((p, s) => selectEntry(p, s, id)); closeModal(); }} />}
    {modal === 'new' && <Dialog title="New crossword" onClose={closeModal} className="difficulty-dialog"><p className="dialog-copy">Hard clues may use wordplay, signalled by a question mark (?).</p><div className="difficulty-options">{Object.entries(MODES).map(([key, mode]) => <button className="difficulty-option" key={key} onClick={() => startPuzzle(key)}><span>{mode.label}<small className="difficulty-detail">{mode.cols} × {mode.rows} · {key === 'easy' ? 'Familiar words · Direct clues' : key === 'medium' ? 'Broader words · Mixed clues' : 'Challenging words & clues'}</small></span><Icon name="next" /></button>)}</div></Dialog>}
    {modal === 'tools' && <Dialog title="Puzzle controls" onClose={closeModal}><div className="difficulty-options"><button className="difficulty-option" disabled={!game || busy} onClick={() => { setShareNotice(''); openModal('share'); }}><span>Play together</span><Icon name="next" /></button><button className="difficulty-option" disabled={busy} onClick={()=>{archiveCurrent();openModal('library');}}><span>Saved games</span><Icon name="next"/></button><button className="difficulty-option" onClick={()=>openModal('preferences')}><span>Solving preferences</span><Icon name="next"/></button>{solved&&<button className="difficulty-option" onClick={()=>openModal('summary')}><span>Solve summary</span><Icon name="next"/></button>}{generationError && !game && <button className="difficulty-option" onClick={leaveShared}><span>Return to solo game</span><Icon name="next" /></button>}<button className="difficulty-option" disabled={!game || busy} onClick={() => openModal('clues')}><span>All clues</span><Icon name="next" /></button><button className="difficulty-option" disabled={!(shared ? shared.canUndo : game?.play.undo?.length) || busy} onClick={() => { undo(); closeModal(); }}><span>Undo last entry</span><Icon name="undo" /></button><button className="difficulty-option" disabled={!game || busy} onClick={() => openModal('check')}><span>Check answers</span><Icon name="check" /></button><button className="difficulty-option" disabled={!game || busy || !entry?.cells.some(i => game.play.answers[i])} onClick={() => { edit(clearWord); closeModal(); const message = 'Word cleared. Use Undo to restore it.'; if (sharedRef.current) publishView({notice:message,noticeId:crypto.randomUUID()}); else setNotice(message); }}><span>Clear current word</span><Icon name="undo" /></button></div></Dialog>}
    {modal === 'reveal' && game && <Dialog title="Need a hint?" onClose={closeModal}><p className="dialog-copy">Reveal one letter or {entry.number} {entry.dir}. This solve will be marked as assisted.</p><div className="dialog-actions"><button className="outline-button" onClick={() => { edit(revealLetter,{hints:1}); closeModal(); }}>Reveal letter</button><button className="solid-button" onClick={() => { edit(revealWord,{hints:1}); closeModal(); }}>Reveal word</button></div></Dialog>}
    {modal === 'library' && <GameLibrary shared={shared} busy={busy} onOpen={openSaved} onClose={closeModal}/>}
    {modal === 'preferences' && <PreferencesDialog value={preferences} onChange={changePreferences} onClose={closeModal}/>}
    {modal === 'summary' && game && <SolveSummary game={game} shared={shared} onClose={closeModal} onNew={()=>openModal('new')}/>}
    {modal === 'check' && game && <Dialog title="Check answers" onClose={closeModal}><div className="difficulty-options">{['letter','word','puzzle'].map(scope=><button key={scope} className="difficulty-option" onClick={()=>check(scope)}>Check {scope}</button>)}</div></Dialog>}
    {modal === 'share' && <SharedGameDialog playerName={preferences.playerName} onPlayerName={playerName=>changePreferences({playerName})} players={players} shared={shared} creating={creatingShare} leaving={leavingShare} canHost={!!game && !busy} onJoin={joinLobby} notice={shareNotice} onCreate={createShared} onLeave={leaveShared} onClose={closeModal} />}
    {modal === 'studio' && <UiStudio saved={savedTheme} preview={preview} onPreview={setPreview} onClose={closeModal} onSave={theme => themeClientRef.current.save(theme)} onSaved={theme => { setSavedTheme(theme); savedThemeRef.current = theme; setPreview(theme); setNotice('Colours saved for everyone.'); }} />}
  </main>;
}
