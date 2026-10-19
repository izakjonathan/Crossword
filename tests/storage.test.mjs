import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePuzzle } from '../lib/engine.mjs';
import { initialState, enterText } from '../lib/input.mjs';
import { saveSession, loadSession, loadHistory, SESSION_KEY, HISTORY_KEY } from '../lib/storage.mjs';
function memory(){const values = new Map();return {setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k)||null};}
test('saved puzzles restore answers and selection without carrying transient undo history',()=>{
 const store=memory(),puzzle=generatePuzzle({mode:'easy',seed:'restore'}),play=enterText(puzzle,initialState(puzzle),'AB');
 saveSession(store,{puzzle,play});const restored=loadSession(store);
 assert.deepEqual(restored.puzzle,puzzle);assert.deepEqual(restored.play.answers,play.answers);assert.equal(restored.play.selected,play.selected);assert.deepEqual(restored.play.undo,[]);
});
test('damaged or old saved puzzles are rejected rather than crashing the screen',()=>{
 const store=memory();store.setItem(SESSION_KEY,'not-json');assert.equal(loadSession(store),null);
 store.setItem(SESSION_KEY,JSON.stringify({puzzle:{version:2},play:{}}));assert.equal(loadSession(store),null);
 const puzzle=generatePuzzle({mode:'easy',seed:'damage-save'}),play={...initialState(puzzle),selected:-100};saveSession(store,{puzzle,play});assert.equal(loadSession(store),null);
});
test('repeat history is filtered and bounded before use',()=>{
 const store=memory();store.setItem(HISTORY_KEY,JSON.stringify([null,'bad!',42,...Array(510).fill('APPLE')]));
 const history=loadHistory(store);assert.equal(history.length,500);assert.ok(history.every(w=>w==='APPLE'));
});

test('corrupt stored answer maps never reach rendering or input handling', () => {
  const puzzle=generatePuzzle({mode:'easy',seed:'corrupt-answers'});
  for(const answers of [null,[],{'-1':'A'},{'9999':'A'},{'0':'<script>'},{'00':'A'}]){
    const value={puzzle,play:{...initialState(puzzle),answers}};
    const s={getItem:()=>JSON.stringify(value)};
    assert.equal(loadSession(s),null);
  }
});
