import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { generatePuzzle } from '../lib/engine.mjs';
import { initialState } from '../lib/input.mjs';
import { createRoom } from '../lib/shared-model.mjs';
import { sharedStore, PATCH_SCRIPT } from '../lib/shared-store.mjs';

const puzzle=generatePuzzle({mode:'easy',seed:'shared-dialog-regression'});
// Production drops JSON-null object members while decoding Lua operations.
// Exercise that boundary, rather than only the in-memory JavaScript reducer.
const withoutNulls=value=>JSON.parse(JSON.stringify(value,(_,v)=>v===null?undefined:v));
function nullDroppingStore() {
  let room=createRoom({puzzle,play:initialState(puzzle)});
  const writes=[];
  const store=sharedStore(async command=>{
    if(command[0]==='GET')return JSON.stringify(room);
    assert.equal(command[0],'EVAL');assert.equal(command[1],PATCH_SCRIPT);
    const operation=withoutNulls(JSON.parse(command[5]));writes.push(operation);
    room={...room,view:{...room.view,...operation.view},revision:room.revision+1};
    return JSON.stringify(withoutNulls(room));
  });
  const token='a'.repeat(64);
  const patch=view=>store.patch(token,{id:randomUUID(),roundId:puzzle.id,changes:[],assisted:false,view});
  return {store,token,patch,writes};
}
test('closing a shared dialog stays closed across null-dropping responses and later polls',async()=>{
  const {store,token,patch}=nullDroppingStore();
  await patch({modal:'clues',clueDirection:'down',board:{scale:2,x:-.1,y:-.2}});
  assert.equal((await store.get(token)).view.modal,'clues');
  const closed=await patch({modal:null});
  assert.equal(closed.view.modal,null);
  assert.equal(closed.view.clueDirection,'down');assert.equal(closed.view.board.scale,2);
  await patch({notice:'Saved',noticeId:randomUUID()});
  for(let i=0;i<3;i++)assert.equal((await store.get(token)).view.modal,null);
  await patch({modal:'new'});assert.equal((await store.get(token)).view.modal,'new');
  await patch({modal:null});assert.equal((await store.get(token)).view.modal,null);
});
test('nullable view clears stay internal and never mutate the public operation',async()=>{
  const {store,token,patch,writes}=nullDroppingStore();
  await patch({modal:'clues',board:{scale:2,x:0,y:0}});
  const operation={id:randomUUID(),roundId:puzzle.id,changes:[],assisted:false,view:{modal:null,board:null}};
  const before=structuredClone(operation),response=await store.patch(token,operation);
  assert.deepEqual(operation,before);assert.equal(response.view.modal,null);assert.equal(response.view.board,null);
  assert.equal((await store.get(token)).view.board,null);
  assert.equal(writes.at(-1).view.modal,false);assert.equal(writes.at(-1).view.board,false);
  for(const view of [{modal:false},{board:false}])await assert.rejects(patch(view),error=>error.status===400);
});
