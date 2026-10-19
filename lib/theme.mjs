export const DEFAULT_THEME = { background: '#fff4c4', content: '#000000' };
export function contrast(a, b) {
  const luminance = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + .05) / (values[1] + .05);
}
export function validateTheme(value) {
  if (!value || !['background', 'content'].every(key => typeof value[key] === 'string' && /^#[0-9a-f]{6}$/i.test(value[key]))) return 'Choose two valid six-digit hex colours.';
  if (contrast(value.background, value.content) < 4.5) return 'These colours are too similar. Choose a stronger contrast.';
  return null;
}

export const THEME_KEY = 'daily-cross:theme:v1';
export function loadLocalTheme(storage) {
  try {
    const theme = JSON.parse(storage.getItem(THEME_KEY));
    return validateTheme(theme) ? DEFAULT_THEME : { background: theme.background, content: theme.content };
  } catch { return DEFAULT_THEME; }
}
export function saveLocalTheme(storage, theme) {
  const error = validateTheme(theme);
  if (error) throw new Error(error);
  storage.setItem(THEME_KEY, JSON.stringify({ background: theme.background, content: theme.content }));
}
