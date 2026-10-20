import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WORDS } from '../lib/words.mjs';
import { validateWordBank } from '../lib/word-quality.mjs';
import { annotateClue, validateClueConvention, validateCluePolicy } from '../lib/clue-policy.mjs';
import { generatePuzzle, random } from '../lib/engine.mjs';
import { validatePuzzle } from '../lib/validate.mjs';
import { gridQuality } from '../lib/grid-quality.mjs';
import { loadSession } from '../lib/storage.mjs';
import { initialState } from '../lib/input.mjs';
import { selectClues } from '../lib/clue-selection.mjs';

test('question marks flag reviewed wordplay, not arbitrary difficulty or trivia', () => {
  const clues = WORDS.flatMap(word => word.clues.filter(c => c.style === 'wordplay').map(clue => ({ word, clue })));
  assert.equal(clues.length, 6);
  for (const { word, clue } of clues) {
    assert.equal(clue.level, 3);
    assert.ok(clue.text.endsWith('?'));
    assert.ok(clue.rationale.length > 20 && clue.source.startsWith('https://'));
    assert.deepEqual(validateClueConvention(word.answer, clue, true), []);
    assert.ok(validateWordBank([{...word,clues:word.clues.map(c=>c===clue?{...c,rationale:undefined}:c)}]).some(e=>e.includes('unreviewed wordplay')));
  }
  const literal = { text:'Watercourse?', level:1, style:'literal', answerForm:'normal', register:'standard' };
  assert.ok(validateClueConvention('RIVER', literal, true).length);
  assert.ok(validateClueConvention('RIVER', {...literal,style:'wordplay',level:3,text:'Watercourse'},true).length);
  assert.ok(validateClueConvention('RIVER', {...literal,style:'unknown'},true).length);
});
test('shortened and informal senses require signals without mistagging ordinary senses', () => {
  const noun = annotateClue('VET', {text:'Animal doctor, for short',level:1});
  assert.deepEqual(validateClueConvention('VET', noun, true), []);
  assert.ok(validateClueConvention('VET', {...noun,text:'Animal doctor'},true).includes('Missing abbreviation indicator'));
  const verb = annotateClue('VET', {text:"Check someone's suitability carefully",level:2});
  assert.equal(verb.answerForm,'normal');assert.deepEqual(validateClueConvention('VET',verb,true),[]);
  const tank = annotateClue('VAT', {text:'Large tank for holding liquid',level:1});
  assert.equal(tank.answerForm,'normal');assert.deepEqual(validateClueConvention('VAT',tank,true),[]);
  const informal = annotateClue('RAT', {text:'Informer, informally',level:3});
  assert.deepEqual(validateClueConvention('RAT',informal,true),[]);
  assert.ok(validateClueConvention('RAT',{...informal,text:'Informer'},true).includes('Missing informal-language indicator'));
});
test('Hard allocation can prefer a reviewed wordplay clue while preserving gentler support', () => {
  const words = Array.from({length:6},(_,i)=>({clues:[{level:1,text:`Direct ${i}`},{level:2,text:`Mixed ${i}`},...(i<3?[{level:3,text:`Hard ${i}`,style:i===0?'wordplay':'literal'}]:[])]}));
  const slots = [[1,2],[0,3],[0,4],[1,5],[2],[3]].map((others,id)=>({id,crossings:others.map(other=>({other}))}));
  const selected=selectClues(words,'hard',slots,random('prefer-wordplay'));
  assert.equal(selected[0].style,'wordplay');assert.ok(selected.some(c=>c.level<3));
  assert.ok(slots[0].crossings.some(c=>selected[c.other].level<3));
});
test('new published clues reject damaged convention metadata and unsupported policy versions', () => {
  const puzzle=generatePuzzle({mode:'hard',seed:'clue-policy-validation'});
  assert.equal(puzzle.cluePolicyVersion,1);assert.deepEqual(validateCluePolicy(puzzle),[]);
  for (const field of ['clueStyle','answerForm','clueRegister']) {
    const copy=structuredClone(puzzle);delete copy.entries[0][field];assert.ok(validatePuzzle(copy).length);
  }
  assert.ok(validatePuzzle({...puzzle,cluePolicyVersion:99}).includes('Unsupported clue policy version'));
});
test('genuine v2.12 saves restore their clues, clumps and entered letters under v4 rules', () => {
  const puzzles=JSON.parse(readFileSync(new URL('./fixtures/v2.12.0-saved-puzzles.json',import.meta.url)));
  let preservedClumps=0;
  for (const puzzle of puzzles) {
    const play=initialState(puzzle);play.answers[play.selected]='X';
    const restored=loadSession({getItem:()=>JSON.stringify({puzzle,play})});
    assert.deepEqual(restored.puzzle,puzzle);assert.equal(restored.play.answers[play.selected],'X');
    if (gridQuality(puzzle.grid,puzzle.cols,puzzle.rows).solidBlackSquares) {
      preservedClumps++;assert.ok(validatePuzzle({...puzzle,constructionVersion:5}).includes('Invalid symmetric quick-grid geometry'));
    }
  }
  assert.ok(preservedClumps>0);
});
