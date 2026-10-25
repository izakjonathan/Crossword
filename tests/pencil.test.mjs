import test from 'node:test';
import assert from 'node:assert/strict';
import {writePencilCell,pencilLetter} from '../features/solve/pencil-model.mjs';
import {preferences,loadPreferences,savePreferences} from '../features/solve/model.mjs';
import {initialState,undoInput} from '../lib/input.mjs';
const puzzle={grid:[{letter:'C'},null,{letter:'A'},{letter:'T'}],entries:[{id:'a',dir:'across',cells:[0,2,3]}]};
test('Pencil edits the written square despite a different shared selection; no advance and undo restores it',()=>{
 const state=initialState(puzzle),next=writePencilCell(puzzle,state,2,'a');
 assert.equal(next.answers[2],'A');assert.equal(next.selected,2);assert.equal(next.answers[0],undefined);
 assert.deepEqual(undoInput(next),{...state,undo:[]});
 const overwritten=writePencilCell(puzzle,next,2,'B');assert.equal(overwritten.answers[2],'B');
 const cleared=writePencilCell(puzzle,overwritten,2,'');assert.equal(cleared.answers[2],'');assert.equal(cleared.selected,2);
 assert.equal(undoInput(cleared).answers[2],'B');
});
test('Pencil rejects blocks, invalid locations and multi-letter recognition without spilling into adjacent squares',()=>{
 const state=initialState(puzzle);
 for(const [index,text] of [[1,'A'],[-1,'A'],[100,'A'],[0,'AB'],[0,'12'],[0,'🖊']])assert.equal(writePencilCell(puzzle,state,index,text),state);
 assert.equal(pencilLetter('a'),'A');assert.equal(pencilLetter(''), '');
 const next=writePencilCell(puzzle,state,0,'A');assert.equal(writePencilCell(puzzle,next,0,'A'),next);
});
test('Input mode is opt-in, device-local and survives preferences storage without changing other options',()=>{
 assert.equal(preferences().inputMode,'keyboard');assert.equal(preferences({inputMode:'unexpected'}).inputMode,'keyboard');
 const data=new Map(),storage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)};
 savePreferences(storage,{inputMode:'pencil',showTimer:true});assert.equal(loadPreferences(storage).inputMode,'pencil');assert.equal(loadPreferences(storage).showTimer,true);
});
