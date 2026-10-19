import { validateTheme } from './theme.mjs';
export async function themeRequest(method = 'GET', theme, signal) {
  const response = await fetch('/api/theme', {
    method, cache:'no-store', signal:AbortSignal.any([AbortSignal.timeout(12000), ...(signal ? [signal] : [])]),
    headers:{'Content-Type':'application/json'}, ...(theme ? { body:JSON.stringify(theme) } : {})
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || 'Could not sync global colours.');
  return value;
}
export class GlobalThemeClient {
  constructor({ onTheme, request = themeRequest, schedule = setTimeout, cancel = clearTimeout }) {
    Object.assign(this, { onTheme, request, schedule, cancel });
    this.current = null; this.closed = false; this.controller = new AbortController(); this.refreshing = false;
  }
  accept(value) {
    if (!value || !Number.isSafeInteger(value.revision) || value.revision < 0 || validateTheme(value.theme)) throw new Error('Invalid global colours.');
    if (this.closed || (this.current && value.revision < this.current.revision)) return;
    const changed = !this.current || value.revision !== this.current.revision;
    this.current = value;
    if (changed) this.onTheme(value.theme);
  }
  async refresh() {
    if (this.closed || this.refreshing) return;
    this.refreshing = true;
    try { this.accept(await this.request('GET', undefined, this.controller.signal)); }
    catch { /* Use the last known palette until the next successful refresh. */ }
    finally { this.refreshing = false; }
  }
  async poll() {
    await this.refresh();
    if (!this.closed) this.timer = this.schedule(() => this.poll(), 5000);
  }
  async save(theme) {
    if (this.closed) throw new Error('Reload this page before saving colours.');
    const problem = validateTheme(theme); if (problem) throw new Error(problem);
    this.accept(await this.request('PUT', theme, this.controller.signal));
    if (this.closed) throw new Error('Colour saving was interrupted.');
    return this.current.theme;
  }
  start() { this.poll(); }
  stop() { this.closed = true; this.cancel(this.timer); this.controller.abort(); }
}
