import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePuzzle, random } from '../lib/engine.mjs';
import { checkingQuality, validatePuzzle } from '../lib/validate.mjs';
import { createLayout } from '../lib/grid-layout.mjs';
import { fillLayout } from '../lib/grid-fill.mjs';
import { WORDS } from '../lib/words.mjs';

test('every new answer has at least half its letters checked, no adjacent unches and natural varied lengths', () => {
  const lengths = new Set();
  for (const mode of ['easy', 'medium', 'hard']) for (let seed = 0; seed < 30; seed++) {
    const p = generatePuzzle({ mode, seed: `checking-${seed}` });
    assert.deepEqual(validatePuzzle(p), []);
    for (const e of checkingQuality(p).entries) {
      assert.ok(e.checked >= Math.ceil(e.length / 2));
      assert.ok(e.longestUnchecked <= 1);
      lengths.add(e.length);
    }
    assert.ok(p.entries.every(e => WORDS.some(w => w.answer === e.answer)));
  }
  for (const length of [3, 4, 5, 6, 7]) assert.ok(lengths.has(length), `No ${length}-letter answers`);
});
test('constraint filler rejects impossible crossings and cannot reuse the sole answer', () => {
  const layout = { slots: [
    { id:0, cells:[0,1,2], crossings:[{other:1,position:1,otherPosition:1}] },
    { id:1, cells:[3,1,4], crossings:[{other:0,position:1,otherPosition:1}] },
  ] };
  assert.equal(fillLayout(layout, [{answer:'CAT'},{answer:'DOG'}], random('bad')).words, null);
  assert.equal(fillLayout(layout, [{answer:'CAT'}], random('duplicate')).words, null);
  const valid = fillLayout(layout, [{answer:'CAT'},{answer:'BAR'}], random('good'));
  assert.deepEqual(new Set(valid.words.map(w => w.answer)), new Set(['CAT','BAR']));
  assert.equal(fillLayout(layout, [{answer:'CAT'},{answer:'BAR'}], random('limited'), 0).words, null);
});
test('slot layouts have bounded black area, full connectivity and stable seeded output', () => {
  let a; for (let i = 0; !a && i < 20; i++) a = createLayout(11, random(`layout-${i}`));
  assert.ok(a); assert.ok(a.slots.length >= 20);
  assert.deepEqual(createLayout(11, random('same-layout')), createLayout(11, random('same-layout')));
});
test('validator rejects corrupt paths, IDs, numbering, dimensions, entries and untrusted saved data', () => {
  const p = generatePuzzle({mode:'easy',seed:'validator-adversarial'});
  const variants = [null, {}, {...p,cols:-1}, {...p,grid:[]}, {...p,entries:[]}, {...p,entries:[null]}];
  const duplicate = structuredClone(p); duplicate.entries[1].id = duplicate.entries[0].id; variants.push(duplicate);
  const numbering = structuredClone(p); numbering.entries[0].number = 99; variants.push(numbering);
  const path = structuredClone(p); path.entries[0].cells.reverse(); variants.push(path);
  const letter = structuredClone(p); letter.grid[p.entries[0].cells[0]].letter = 'AA'; variants.push(letter);
  for (const bad of variants) assert.ok(validatePuzzle(bad).length);
});

test('equally constrained fill slots prefer the centre while maskless callers retain stable order', () => {
  const slots = [[0,1,2],[11,12,13],[22,23,24]].map((cells,id)=>({id,cells,crossings:[]}));
  const bank=['CAT','DOG','PIG'].map(answer=>({answer}));
  const ranks=()=>{let index=0;return()=>[.9,.6,.3][index++];};
  const centered=fillLayout({mask:Array(25).fill(true),slots},bank,ranks());
  assert.equal(centered.words[1].answer,'CAT');
  const legacy=fillLayout({slots},bank,ranks());
  assert.equal(legacy.words[0].answer,'CAT');
});
