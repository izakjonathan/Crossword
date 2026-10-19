import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { applyBrowserTheme, browserThemeBootstrap } from '../lib/browser-theme.mjs';
import { DEFAULT_THEME } from '../lib/theme.mjs';
function documentFixture(withBody = true) {
  const style = () => ({ setProperty(key, value) { this[key] = value; } });
  const tags = { 'theme-color': [{ setAttribute(key,value) { this[key]=value; } }], 'color-scheme': [{ setAttribute(key,value) { this[key]=value; } }] };
  return { documentElement: { style:style() }, body:withBody ? { style:style() } : null, querySelectorAll(selector) { return tags[selector.includes('theme-color') ? 'theme-color' : 'color-scheme']; }, tags };
}
test('a palette colours the page canvas, both viewport edges and browser metadata together', () => {
  const doc=documentFixture(), theme={background:'#123456',content:'#ffffff'};
  assert.equal(applyBrowserTheme(doc,theme),true);
  assert.equal(doc.documentElement.style.backgroundColor,theme.background);
  assert.equal(doc.body.style.backgroundColor,theme.background);
  assert.equal(doc.documentElement.style['--bg'],theme.background);
  assert.equal(doc.documentElement.style.colorScheme,'dark');
  assert.equal(doc.tags['theme-color'][0].content,theme.background);
  applyBrowserTheme(doc,DEFAULT_THEME); assert.equal(doc.documentElement.style.colorScheme,'light');
});
test('the pre-paint script restores a valid saved palette before body exists', () => {
  const doc=documentFixture(false), theme={background:'#123456',content:'#ffffff'};
  vm.runInNewContext(browserThemeBootstrap(),{document:doc,localStorage:{getItem:()=>JSON.stringify(theme)}});
  assert.equal(doc.documentElement.style.backgroundColor,theme.background);
});
test('invalid, corrupt and blocked storage use the default canvas without throwing', () => {
  for(const storage of [{getItem:()=>'{bad'},{getItem:()=>JSON.stringify({background:'#fffFFF',content:'#ffffff'})},{getItem(){throw new Error('Denied');}}]){
    const doc=documentFixture(false);
    vm.runInNewContext(browserThemeBootstrap(),{document:doc,localStorage:storage});
    assert.equal(doc.documentElement.style.backgroundColor,DEFAULT_THEME.background);
  }
});
