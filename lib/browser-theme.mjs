import { DEFAULT_THEME, THEME_KEY } from './theme.mjs';

// This function deliberately has no module-scope dependencies: the same code
// runs in the initial head script and when the user previews or saves colours.
export function applyBrowserTheme(doc, value) {
  const valid = value && ['background', 'content'].every(key => typeof value[key] === 'string' && /^#[0-9a-f]{6}$/i.test(value[key]));
  if (!valid) return false;
  const luminance = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const a = luminance(value.background), b = luminance(value.content);
  if ((Math.max(a, b) + .05) / (Math.min(a, b) + .05) < 4.5) return false;
  const scheme = a > .179 ? 'light' : 'dark';
  const root = doc.documentElement;
  root.style.setProperty('--bg', value.background);
  root.style.setProperty('--content', value.content);
  root.style.backgroundColor = value.background;
  root.style.colorScheme = scheme;
  if (doc.body) doc.body.style.backgroundColor = value.background;
  doc.querySelectorAll('meta[name="theme-color"]').forEach(meta => meta.setAttribute('content', value.background));
  doc.querySelectorAll('meta[name="color-scheme"]').forEach(meta => meta.setAttribute('content', scheme));
  return true;
}

export function browserThemeBootstrap() {
  return `(()=>{const apply=${applyBrowserTheme.toString()};let value;try{value=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_KEY)}));}catch{}if(!apply(document,value))apply(document,${JSON.stringify(DEFAULT_THEME)});})();`;
}
