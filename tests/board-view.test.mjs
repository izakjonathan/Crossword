import test from 'node:test';
import assert from 'node:assert/strict';
import { fitBoard, fitView, zoomAt, constrain, revealCell, KEY_ROWS, cellAtPoint } from '../lib/board-view.mjs';
const close = (a, b) => assert.ok(Math.abs(a - b) < .00001, `${a} ≠ ${b}`);
test('slightly taller cells fit above the dock on short and tall mobile screens and landscape', () => {
  for (const [w, h] of [[320,250],[390,440],[430,560],[420,180]]) {
    const f = fitBoard(w,h,13,13), v = fitView(f);
    assert.ok(f.boardWidth <= w && f.boardHeight <= h);
    assert.ok(f.cellHeight >= f.cell && f.cellHeight <= f.cell * 1.2 + .001); assert.ok(v.x >= 0 && v.y >= 0);
  }
});
test('pinch preserves its grid anchor while moving with the fingers', () => {
  const f = fitBoard(390,390,13,13), base = fitView(f), origin={x:190,y:180}, destination={x:200,y:195};
  const v=zoomAt(base,f,2,origin,destination);
  close((origin.x-base.x)/base.scale,(destination.x-v.x)/v.scale);
  close((origin.y-base.y)/base.scale,(destination.y-v.y)/v.scale);
});
test('zoom and pan are bounded and fit resets without drift', () => {
  const f=fitBoard(390,440,13,13);
  const v=constrain({scale:99,x:-99999,y:99999},f);
  assert.equal(v.scale,3); close(v.x,390-f.boardWidth*3); assert.equal(v.y,0);
  assert.deepEqual(zoomAt(v,f,0,{x:40,y:40}),fitView(f));
});
test('typing brings offscreen cells back into view without resetting zoom', () => {
  const f=fitBoard(320,290,13,13), v=zoomAt(fitView(f),f,2,{x:160,y:145});
  for(const [col,row] of [[0,0],[12,12],[6,6]]) {
    const next=revealCell(v,f,col,row), size=f.cell*next.scale, height=f.cellHeight*next.scale;
    assert.equal(next.scale,2);
    assert.ok(next.x+col*size>=-.001 && next.x+(col+1)*size<=f.width+.001);
    assert.ok(next.y+row*height>=-.001 && next.y+(row+1)*height<=f.height+.001);
  }
});
test('the compact keyboard contains each alphabet letter once in QWERTY order', () => {
  assert.equal(KEY_ROWS.join(''),'QWERTYUIOPASDFGHJKLZXCVBNM');
  assert.equal(new Set(KEY_ROWS.join('')).size,26);
});
import { BoardGesture } from '../lib/board-view.mjs';
test('a tap selects once, while drag, pinch and cancellation never select', () => {
  const f=fitBoard(390,390,13,13), v=fitView(f), g=new BoardGesture();
  g.down(1,{x:50,y:50},v); g.move(1,{x:53,y:51},f); assert.equal(g.up(1,v),true);
  assert.equal(g.up(1,v),false);
  g.down(1,{x:50,y:50},v); g.move(1,{x:80,y:50},f); assert.equal(g.up(1,v),false);
  g.down(1,{x:50,y:50},v); assert.equal(g.up(1,v,true),false);
  g.down(1,{x:100,y:190},v); g.down(2,{x:290,y:190},v);
  const zoomed=g.move(2,{x:350,y:190},f); assert.ok(zoomed.scale>1);
  assert.equal(g.up(2,zoomed),false);
  assert.deepEqual(g.move(1,{x:100,y:190},f),zoomed);
  assert.equal(g.up(1,zoomed),false);
  g.down(3,{x:50,y:50},zoomed); assert.equal(g.up(3,zoomed),true);
});
test('layout changes discard old pointers and cannot create a stale tap', () => {
  const g=new BoardGesture(), f=fitBoard(390,390,13,13), v=fitView(f);
  g.down(1,{x:50,y:50},v); g.reset();
  assert.equal(g.move(1,{x:70,y:50},f),null); assert.equal(g.up(1,v),false);
});

test('tall cells use spare height and taps map to the correct row after zooming',()=>{
 const f=fitBoard(390,440,13,13), v=zoomAt(fitView(f),f,2,{x:195,y:220});
 assert.ok(f.cellHeight > f.cell);
 for(let row=0;row<13;row++)for(let col=0;col<13;col++){
  const point={x:v.x+(col+.5)*f.cell*v.scale,y:v.y+(row+.5)*f.cellHeight*v.scale};
  assert.equal(cellAtPoint(f,v,13,13,point),row*13+col);
 }
 assert.equal(cellAtPoint(f,fitView(f),13,13,{x:-1,y:-1}),null);
});
