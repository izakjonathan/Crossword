import test from 'node:test';
import assert from 'node:assert/strict';
import { WORDS } from '../lib/words.mjs';
import { LONG_CLUES } from '../lib/long-clues.mjs';
import { validateWordBank } from '../lib/word-quality.mjs';
import { generatePuzzle } from '../lib/engine.mjs';
import { validatePuzzle } from '../lib/validate.mjs';

test('longer-answer alternatives are explicit, sourced, distinct and integrated without replacing direct clues',()=>{
  const entries=Object.entries(LONG_CLUES),variants=entries.flatMap(([,clues])=>clues);
  assert.equal(entries.length,74);assert.equal(variants.length,83);
  assert.equal(variants.filter(c=>c.level===2).length,59);
  assert.equal(variants.filter(c=>c.level===3).length,24);
  for(const [answer,clues] of entries){
    const word=WORDS.find(w=>w.answer===answer);
    assert.ok(word);assert.ok(answer.length>=8);
    assert.equal(word.clues.find(c=>c.level===1).text,word.easy);
    for(const clue of clues){
      assert.ok(word.clues.some(c=>c.text===clue.text && c.level===clue.level && c.source===clue.source));
      assert.equal(new URL(clue.source).protocol,'https:');
      assert.notEqual(clue.text,word.easy);
    }
  }
  assert.deepEqual(validateWordBank(WORDS),[]);
});
test('new variants reach Medium/Hard games, keep Easy direct and preserve crossing/difficulty rules',()=>{
  const counts={easy:0,medium:0,hard:0,hardestLong:0};
  for(const mode of ['easy','medium','hard']) for(let seed=0;seed<18;seed++){
    const p=generatePuzzle({mode,seed:`long-clues-${seed}`});
    assert.deepEqual(validatePuzzle(p),[]);
    for(const entry of p.entries){
      const word=WORDS.find(w=>w.answer===entry.answer);
      assert.ok(word.clues.some(c=>c.text===entry.clue && c.level===entry.clueLevel));
      if(mode==='easy'){assert.equal(entry.clueLevel,1);assert.equal(entry.clue,word.easy);}
      if(LONG_CLUES[entry.answer]?.some(c=>c.text===entry.clue && c.level===entry.clueLevel))counts[mode]++;
      if(mode==='hard'&&entry.answer.length>=8&&entry.clueLevel===3)counts.hardestLong++;
    }
  }
  assert.equal(counts.easy,0);assert.ok(counts.medium>0);assert.ok(counts.hard>0);assert.ok(counts.hardestLong>0);
});
test('source metadata rejects insecure/malformed references while legacy data stays valid',()=>{
  const base={answer:'CAT',easy:'Domestic feline',hard:'Household pet',vocabularyLevel:1};
  assert.deepEqual(validateWordBank([base]),[]);
  for(const source of ['not a URL','http://example.com','https://user:password@example.com']){
    assert.ok(validateWordBank([{...base,clues:[{level:1,text:base.easy,source}]}]).includes('CAT: invalid clue source'));
  }
});
