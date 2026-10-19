import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import postcss from 'postcss';

const source = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
function declarations(css, selector) {
  const values = {};
  postcss.parse(css).walkRules(rule => {
    if (rule.parent.type !== 'root' || !rule.selectors.includes(selector)) return;
    rule.walkDecls(d => { values[d.prop] = d.value; });
  });
  return values;
}
function assertLayout(css) {
  assert.equal(declarations(css, '.app').display, 'flex');
  assert.equal(declarations(css, '.app')['flex-direction'], 'column');
  assert.equal(declarations(css, '.board-stage').flex, '1');
  assert.equal(declarations(css, '.board-stage').overflow, 'hidden');
  assert.equal(declarations(css, '.board-shell').position, 'absolute');
  assert.equal(declarations(css, '.board').display, 'grid');
  assert.equal(declarations(css, '.cell').background, 'var(--bg)');
  assert.equal(declarations(css, '.blocked').background, 'var(--content)');
  assert.equal(declarations(css, '.cell-number').position, 'absolute');
  assert.equal(declarations(css, '.keyboard-dock')['flex-shrink'], '0');
  assert.equal(declarations(css, '.puzzle-keyboard').display, 'grid');
  assert.equal(declarations(css, '.key-row').display, 'flex');
  assert.ok(declarations(css, '.letter-key').height);
  assert.equal(declarations(css, '.header')['min-height'], '48px');
  assert.equal(declarations(css, '.clue-bar').height, '62px');
  assert.equal(declarations(css, '.clue-bar')['min-height'], '62px');
  assert.equal(declarations(css, '.clue-bar')['max-height'], '62px');
  assert.equal(declarations(css, '.clue-body p')['max-height'], 'calc(2 * var(--clue-line))');
  assert.equal(declarations(css, '.clue-body p').overflow, 'auto');
  assert.equal(declarations(css, '.keyboard-dock')['padding-bottom'], '0');
  assert.equal(declarations(css, '.cell.selected').outline, 'none');
  const selectors = [];
  postcss.parse(css).walkRules(rule => selectors.push(...rule.selectors));
  assert.ok(!selectors.some(selector => selector.includes('.cell.selected::after')));
  assert.equal(declarations(css, '.header-actions')['grid-template-columns'], 'repeat(7,minmax(0,1fr))');
  assert.equal(declarations(css, '.header').border, '0');
  assert.match(declarations(css, '.new-puzzle').background, /^(none|0 0)$/); // Lightning CSS serializes a transparent reset as 0 0.
}
test('essential mobile layout rules exist independently of shared selectors', () => assertLayout(source));
test('layout regression check catches the accidentally deleted style block', () => {
  const broken = readFileSync(new URL('./fixtures/v2.1.0-missing-layout.css', import.meta.url), 'utf8');
  assert.throws(() => assertLayout(broken));
});

if (process.env.LAYOUT_BUILD === '1') test('production CSS assets retain the complete mobile layout', () => {
  const root = new URL('../.next/static/', import.meta.url);
  const files = readdirSync(root, { recursive: true }).filter(name => name.endsWith('.css'));
  assert.ok(files.length, 'Production CSS assets are missing');
  assertLayout(files.map(name => readFileSync(new URL(name, root), 'utf8')).join('\n'));
});
