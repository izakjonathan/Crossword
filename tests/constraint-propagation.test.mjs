import test from 'node:test';
import assert from 'node:assert/strict';
import { createDictionaryIndex } from '../lib/dictionary-index.mjs';
import { createConstraintPropagator } from '../lib/constraint-propagation.mjs';
import { fillLayout } from '../lib/grid-fill.mjs';
import { random } from '../lib/engine.mjs';

const words = answers => answers.map(answer => ({ answer, vocabularyLevel: 1 }));
function graph(count, edges) {
  const slots = Array.from({ length: count }, (_, id) => ({ id, cells: [id*3, id*3+1, id*3+2], crossings: [] }));
  for (const [a, p, b, q] of edges) {
    slots[a].crossings.push({ other: b, position: p, otherPosition: q });
    slots[b].crossings.push({ other: a, position: q, otherPosition: p });
  }
  return slots;
}
function solutions(slots, domains, fairness = false) {
  const found = [], chosen = [];
  function visit(i) {
    if (i === slots.length) { found.push(chosen.map(word => word.answer).join('/')); return; }
    for (const word of domains[i]) {
      if (chosen.some(other => other.answer === word.answer)) continue;
      if (slots[i].crossings.some(c => c.other < i &&
        (word.answer[c.position] !== chosen[c.other].answer[c.otherPosition] ||
        (fairness && word.vocabularyLevel === 3 && chosen[c.other].vocabularyLevel === 3)))) continue;
      chosen.push(word); visit(i+1); chosen.pop();
    }
  }
  visit(0); return found.sort();
}

test('incremental MAC propagates beyond the assigned neighbour and keeps sibling branches independent', () => {
  const slots = graph(3, [[0,2,1,0], [1,1,2,0]]);
  const domains = [words(['CAT','CAR']), words(['TOP','RIP']), words(['OWL','INK'])];
  const propagator = createConstraintPropagator(slots, createDictionaryIndex(domains.flat()));
  const snapshot = structuredClone(domains);
  assert.equal(propagator.propagate(domains), true);
  for (const [word, expected] of [['CAT',['CAT','TOP','OWL']], ['CAR',['CAR','RIP','INK']]]) {
    const child = domains.slice(); child[0] = domains[0].filter(w => w.answer === word);
    assert.equal(propagator.propagate(child, [0]), true);
    assert.deepEqual(child.map(domain => domain.map(w => w.answer)), expected.map(answer => [answer]));
    assert.deepEqual(domains, snapshot);
  }
});

test('arc consistency agrees with exhaustive solutions across domains, cycles and fairness restrictions', () => {
  const bank = words(['CAT','CAR','BAT','BAR','RAT','TAR']); bank[0].vocabularyLevel = 3; bank[2].vocabularyLevel = 3;
  const rng = random('exhaustive-mac');
  for (let sample = 0; sample < 120; sample++) {
    const slots = graph(3, sample%2 ? [[0,1,1,1],[1,2,2,0],[2,1,0,1]] : [[0,2,1,0],[1,1,2,1]]);
    const domains = slots.map(() => bank.filter(() => rng() < .6));
    const fairness = sample%3 === 0, expected = solutions(slots, domains, fairness);
    const original = structuredClone(domains), reduced = domains.slice();
    const propagator = createConstraintPropagator(slots, createDictionaryIndex(bank), fairness);
    const possible = propagator.propagate(reduced);
    assert.deepEqual(domains, original, 'Propagation mutated parent arrays');
    if (!possible) assert.equal(expected.length, 0, 'Propagation removed a valid solution');
    else assert.deepEqual(solutions(slots, reduced, fairness), expected);
  }
});

test('specialist crossing support and disconnected answer uniqueness are propagated', () => {
  const bank = [{answer:'CAT',vocabularyLevel:3},{answer:'BAT',vocabularyLevel:3},{answer:'BAR',vocabularyLevel:1}];
  const slots = graph(2, [[0,1,1,1]]), domains = [[bank[0]],[bank[1],bank[2]]];
  assert.equal(createConstraintPropagator(slots,createDictionaryIndex(bank),true).propagate(domains),true);
  assert.deepEqual(domains[1],[bank[2]]);
  const repeated = [[bank[0]],[bank[0]]];
  assert.equal(createConstraintPropagator(graph(2,[]),createDictionaryIndex(bank)).propagate(repeated),false);
});

test('MAC plus backtracking rejects a globally impossible all-different assignment and honours limits', () => {
  const layout = { slots: graph(3, []) }, bank = words(['CAT','BAT']);
  assert.equal(fillLayout(layout,bank,random('hall'),100).words,null);
  assert.equal(fillLayout({slots:graph(2,[])},words(['CAT','BAT','BAR']),random('limit'),0).words,null);
});

test('full MAC backtracking enumerates exactly the exhaustive valid fills, including rejected complete branches', () => {
  const bank = words(['CAT','CAR','BAT','BAR','RAT','TAR']);
  for (const edges of [[[0,1,1,1]], [[0,2,1,0],[1,1,2,1]], []]) {
    const slots = graph(edges.length === 1 ? 2 : 3, edges);
    const expected = solutions(slots, slots.map(() => bank)), found = [];
    const result = fillLayout({ slots }, bank, random(JSON.stringify(edges)), 10000, null, assignment => {
      found.push(assignment.map(word => word.answer).join('/'));
      return false;
    });
    assert.equal(result.words, null);
    assert.deepEqual(found.sort(), expected);
    assert.ok(result.propagation.propagations > 0);
  }
});
