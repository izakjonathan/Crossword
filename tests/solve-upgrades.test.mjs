import {SharedClient} from '../lib/shared-client.mjs';
import {GlobalThemeClient} from '../lib/global-theme-client.mjs';
import {createRoom} from '../lib/shared-model.mjs';
import {DEFAULT_THEME} from '../lib/theme.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {generatePuzzle} from '../lib/engine.mjs';
import {initialState,enterText,clearAndAdvance} from '../lib/input.mjs';
import {saveSession,loadSession,SESSION_KEY} from '../lib/storage.mjs';
import {loadLibrary,saveLibraryGame,removeLibraryGame,LIBRARY_KEY,LIBRARY_LIMIT} from '../features/library/store.mjs';
import {loadPreferences,savePreferences,solveStats,updateStats,elapsedSeconds,formatTime,checkProgress} from '../features/solve/model.mjs';
import {sharedStore,roomKey} from '../lib/shared-store.mjs';
import {validateOperation} from '../lib/shared-model.mjs';
import {lobbyStore,lobbyKey} from '../lib/lobby-store.mjs';
import {WORDS} from '../lib/words.mjs';
import {VARIED_CLUES} from '../lib/varied-clues.mjs';
import {validatePuzzle} from '../lib/validate.mjs';
const memory=()=>{const data=new Map();return {getItem:key=>data.get(key)||null,setItem:(k,v)=>data.set(k,v),removeItem:key=>data.delete(key)};};
const puzzle=generatePuzzle({mode:'easy',seed:'upgrade-suite'}),game=()=>({puzzle,play:initialState(puzzle),stats:solveStats()});
test('saved library retains several boards and completed/unfinished progress without changing solo or word history',()=>{
  const storage=memory(),one=game();storage.setItem('history','unchanged');saveSession(storage,one);
  saveLibraryGame(storage,one);const next=generatePuzzle({mode:'medium',seed:'library-second'}),two={puzzle:next,play:initialState(next),stats:solveStats()};saveLibraryGame(storage,two);
  assert.equal(loadLibrary(storage).length,2);assert.equal(loadSession(storage).puzzle.id,puzzle.id);assert.equal(storage.getItem('history'),'unchanged');
  one.play.answers=Object.fromEntries(puzzle.grid.flatMap((cell,i)=>cell?[[i,cell.letter]]:[]));saveLibraryGame(storage,one);
  let list=loadLibrary(storage);assert.equal(list.length,2);assert.equal(list.find(row=>row.game.puzzle.id===puzzle.id).completed,true);
  const shared={token:'a'.repeat(64),lobby:{id:'b'.repeat(16),name:'Friends'}};saveLibraryGame(storage,{...two,sharedRound:'round-a'},shared);saveLibraryGame(storage,{...two,sharedRound:'round-b'},shared);
  list=loadLibrary(storage);assert.equal(list.length,4);assert.equal(list.filter(row=>row.shared).length,2);assert.equal(list[0].shared.lobby.name,'Friends');
  removeLibraryGame(storage,list[0].id);assert.equal(loadLibrary(storage).length,3);
});
test('library rejects corrupt boards and reports capacity/storage errors without silently evicting games',()=>{
  const storage=memory();storage.setItem(LIBRARY_KEY,'{broken');assert.deepEqual(loadLibrary(storage),[]);
  storage.setItem(LIBRARY_KEY,JSON.stringify([{id:'bad',updatedAt:1,game:{puzzle:{},play:{}}}]));assert.deepEqual(loadLibrary(storage),[]);
  const rows=Array.from({length:LIBRARY_LIMIT},(_,i)=>({id:`old-${i}`,updatedAt:Date.now(),game:game()}));storage.setItem(LIBRARY_KEY,JSON.stringify(rows));
  assert.throws(()=>saveLibraryGame(storage,game()),/full/);assert.equal(loadLibrary(storage).length,LIBRARY_LIMIT);
  assert.throws(()=>saveLibraryGame({getItem:()=>null,setItem:()=>{throw new Error('Quota');}},game()),/Quota/);
});
test('preferences are local, validated and leave filled-square skipping disabled',()=>{
  const storage=memory();assert.equal(loadPreferences(storage).showTimer,false);assert.equal(loadPreferences(storage).advanceWord,false);
  savePreferences(storage,{showTimer:true,autoCheck:true,advanceWord:true,spaceAction:'clear',playerName:'  Izak  '});assert.deepEqual(loadPreferences(storage),{showTimer:true,autoCheck:true,advanceWord:true,spaceAction:'clear',playerName:'Izak'});
  storage.setItem('daily-cross:preferences:v1','{bad');assert.equal(loadPreferences(storage).autoCheck,false);
  const entry=puzzle.entries[0],play={...initialState(puzzle),selected:entry.cells.at(-1)};
  assert.equal(enterText(puzzle,play,'Z').selected,entry.cells.at(-1));assert.notEqual(enterText(puzzle,play,'Z',{advanceWord:true}).entryId,entry.id);
  const cleared=clearAndAdvance(puzzle,{...initialState(puzzle),answers:{[entry.cells[0]]:'A'}});assert.equal(cleared.answers[entry.cells[0]],'');assert.equal(cleared.selected,entry.cells[1]);assert.equal(cleared.undo.length,1);
});
test('letter, word and puzzle checks use different scopes and never reveal unfilled answers',()=>{
  const play=initialState(puzzle),first=puzzle.entries[0];const other=puzzle.grid.findIndex((c,i)=>c&&!first.cells.includes(i));
  play.answers={[first.cells[0]]:puzzle.grid[first.cells[0]].letter==='Z'?'A':'Z',[other]:puzzle.grid[other].letter==='Z'?'A':'Z'};
  assert.deepEqual(checkProgress(puzzle,play,'letter').wrong,[first.cells[0]]);assert.deepEqual(checkProgress(puzzle,play,'word').wrong,[first.cells[0]]);assert.equal(checkProgress(puzzle,play).wrong.length,2);assert.equal(Object.values(play.answers).length,2);
  assert.equal(checkProgress(puzzle,initialState(puzzle)).entered,0);
});
test('solve timing persists through reload, freezes at completion and counts assistance monotonically',()=>{
  const storage=memory(),one=game(),now=Date.now();one.stats={startedAt:now-65000,completedAt:null,hints:2,checks:1};saveSession(storage,one);assert.equal(elapsedSeconds(loadSession(storage).stats,now),65);assert.equal(formatTime(3661),'1:01:01');
  const solved={...one.play,answers:Object.fromEntries(puzzle.grid.flatMap((c,i)=>c?[[i,c.letter]]:[]))};
  const stats=updateStats(one.stats,puzzle,solved,{hints:1,checks:1},now);assert.equal(stats.completedAt,now);assert.equal(elapsedSeconds(stats,now+9999),65);assert.equal(stats.hints,3);assert.equal(stats.checks,2);
  const undone=updateStats(stats,puzzle,one.play,{},now+2000);assert.equal(undone.completedAt,null);assert.equal(undone.hints,3);
  storage.setItem(SESSION_KEY,JSON.stringify({puzzle,play:initialState(puzzle)}));assert.ok(loadSession(storage).stats.startedAt);
});
test('62 original alternative clues retain direct wording, provenance and difficulty/crossing guarantees',()=>{
  assert.equal(Object.keys(VARIED_CLUES).length,62);
  for(const [answer,clues] of Object.entries(VARIED_CLUES)){const word=WORDS.find(w=>w.answer===answer);assert.equal(word.clues.find(c=>c.level===1).text,word.easy);assert.ok(word.clues.some(c=>c.text===clues[0].text&&c.level===2&&c.source.startsWith('https://')));}
  let seen=0;for(const mode of ['easy','medium','hard'])for(let i=0;i<12;i++){const next=generatePuzzle({mode,seed:`varied-review-${i}`});assert.deepEqual(validatePuzzle(next),[]);for(const entry of next.entries){if(VARIED_CLUES[entry.answer]?.some(c=>c.text===entry.clue)){assert.notEqual(mode,'easy');seen++;}}}assert.ok(seen>0);
});
test('shared operations reject forged count fields',()=>{
  for(const metrics of [{hints:-1},{checks:50},{hints:1,unknown:1},[]])assert.throws(()=>validateOperation(puzzle,{id:randomUUID(),changes:[],assisted:false,metrics}),/statistics/);
});
test('real Redis owns the shared clock/counts, resets each round, and provides named live/away membership',{skip:!process.env.REDIS_TEST_CLI},async()=>{
  const command=async args=>JSON.parse(execFileSync(process.env.REDIS_TEST_CLI,['-p',process.env.REDIS_TEST_PORT||'6397','--json',...args.map(String)],{encoding:'utf8'}));
  const lobbies=lobbyStore(command),rooms=sharedStore(command),host=randomUUID(),guest=randomUUID();
  const created=await lobbies.host(game(),'Stats and players',host,randomUUID()),id=created.lobby.id,token=created.token,profiles=`${lobbyKey(id)}:profiles`;
  let current=created.room;
  const op=(kind,extra={})=>({id:randomUUID(),kind,roundId:current.roundId,changes:[],assisted:false,...extra});
  try{
    await lobbies.join(id,guest);await lobbies.heartbeat(id,guest,'Emer');const roster=await lobbies.heartbeat(id,host,'Izak');assert.equal(roster.participants.length,2);assert.ok(roster.participants.every(p=>p.online));assert.ok(roster.participants.find(p=>p.name==='Izak').self);assert.equal(JSON.stringify(roster).includes(host),false);
    const guestHash=createHash('sha256').update(guest).digest('hex');await command(['HSET',profiles,guestHash,JSON.stringify({name:'Emer',lastSeen:1})]);assert.equal((await lobbies.heartbeat(id,host,'Izak')).participants.find(p=>p.name==='Emer').online,false);
    await assert.rejects(lobbies.heartbeat(id,randomUUID(),'Outsider'),e=>e.status===404);await assert.rejects(lobbies.heartbeat(id,host,'x'.repeat(25)),e=>e.status===400);
    const counted=op('edit',{metrics:{hints:1,checks:1},assisted:true});current=await rooms.patch(token,counted);await rooms.patch(token,counted);assert.equal((await rooms.get(token)).stats.hints,1);assert.equal((await rooms.get(token)).stats.checks,1);
    const startedAt=current.stats.startedAt;current=await rooms.patch(token,op('edit',{changes:puzzle.grid.flatMap((c,i)=>c?[{cell:String(i),value:c.letter}]:[])}));assert.ok(current.stats.completedAt>=startedAt);const stored=JSON.parse(await command(['GET',roomKey(token)]));assert.equal(stored.puzzle.grid.length,puzzle.grid.length);assert.ok(stored.puzzle.grid.some(cell=>cell===false));assert.deepEqual((await rooms.get(token)).puzzle.grid,puzzle.grid);assert.equal((await rooms.get(token)).stats.completedAt,current.stats.completedAt);
    const lease=op('begin');await rooms.patch(token,lease);const next=generatePuzzle({mode:'medium',seed:'stats-second',recent:current.usedAnswers});current=await rooms.patch(token,op('replace',{leaseId:lease.id,puzzle:next}));assert.equal(current.stats.hints,0);assert.equal(current.stats.checks,0);assert.equal(current.stats.completedAt,null);assert.ok(current.stats.startedAt>=startedAt);assert.equal((await lobbies.join(id,guest)).room.puzzle.id,next.id);
    await lobbies.leave(id,guest);assert.equal((await lobbies.heartbeat(id,host,'Izak')).participants.length,1);await lobbies.leave(id,host);assert.equal(await command(['EXISTS',profiles]),0);
  }finally{await command(['DEL',roomKey(token),lobbyKey(id),`${lobbyKey(id)}:members`,profiles]);await command(['ZREM','crossword:lobbies:v1',id]);}
});

test('Upstash-style collapsed legacy grids recover exact coordinates without losing progress',async()=>{
  const room={puzzle:{...puzzle,grid:puzzle.grid.filter(Boolean)},roundId:puzzle.id,answers:{[puzzle.entries[0].cells[0]]:'Z'},writers:{},view:{},revision:4,expiresAt:Date.now()+604800000,stats:{startedAt:Date.now()-1000,hints:2,checks:1}};
  const store=sharedStore(async()=>JSON.stringify(room));const restored=await store.get('a'.repeat(64));
  assert.deepEqual(restored.puzzle.grid,puzzle.grid);assert.deepEqual(validatePuzzle(restored.puzzle),[]);assert.equal(restored.answers[puzzle.entries[0].cells[0]],'Z');assert.equal(restored.stats.hints,2);assert.equal(restored.stats.completedAt,null);
});

test('shared and global-colour polling use browser timers with a valid receiver and stop cleanly',async()=>{
  const originalSet=globalThis.setTimeout,originalClear=globalThis.clearTimeout;let scheduled=0,cancelled=0;
  globalThis.setTimeout=function(){assert.ok(this===undefined||this===globalThis);scheduled++;return 42;};
  globalThis.clearTimeout=function(){assert.ok(this===undefined||this===globalThis);cancelled++;};
  try{
    const shared=new SharedClient({token:'a'.repeat(64),room:createRoom(game()),onChange:()=>{},request:async()=>createRoom(game())});await shared.poll();shared.stop();
    const theme=new GlobalThemeClient({onTheme:()=>{},request:async()=>({theme:DEFAULT_THEME,revision:0})});await theme.poll();theme.stop();
    assert.equal(scheduled,2);assert.equal(cancelled,2);
  }finally{globalThis.setTimeout=originalSet;globalThis.clearTimeout=originalClear;}
});
