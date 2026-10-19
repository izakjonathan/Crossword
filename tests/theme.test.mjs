import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTheme, contrast, DEFAULT_THEME, THEME_KEY, loadLocalTheme, saveLocalTheme } from '../lib/theme.mjs';
test('two-colour theme validation checks syntax and readable contrast', () => {
  assert.equal(validateTheme(DEFAULT_THEME), null);
  assert.equal(contrast('#000000', '#ffffff'), 21);
  assert.ok(validateTheme({ background: '#ffffff', content: '#eeeeee' }));
  assert.ok(validateTheme({ background: 'red', content: '#000000' }));
  assert.ok(validateTheme(null));
});

test('local colours persist across reloads without any server setup', () => {
  const values = new Map(), storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  assert.deepEqual(loadLocalTheme(storage), DEFAULT_THEME);
  const palette = { background: '#ffffff', content: '#123456' };
  saveLocalTheme(storage, palette);
  assert.deepEqual(loadLocalTheme(storage), palette);
  assert.ok(values.has(THEME_KEY));
  assert.throws(() => saveLocalTheme(storage, { background: '#ffffff', content: '#ffffff' }));
  assert.deepEqual(loadLocalTheme(storage), palette);
});
test('corrupt or inaccessible local storage falls back safely and a failed save surfaces an error', () => {
  assert.deepEqual(loadLocalTheme({ getItem: () => '{broken' }), DEFAULT_THEME);
  assert.deepEqual(loadLocalTheme({ getItem: () => JSON.stringify({ background: 'bad' }) }), DEFAULT_THEME);
  const denied = { getItem() { throw new Error('Denied'); }, setItem() { throw new Error('Denied'); } };
  assert.deepEqual(loadLocalTheme(denied), DEFAULT_THEME);
  assert.throws(() => saveLocalTheme(denied, DEFAULT_THEME), /Denied/);
});
