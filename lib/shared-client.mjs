import { applyOperation, changesBetween, validateOperation } from './shared-model.mjs';

export async function sharedRequest(token, method = 'GET', body, signal) {
  const response = await fetch('/api/shared', {
    method, cache:'no-store', signal:AbortSignal.any([AbortSignal.timeout(12000), ...(signal ? [signal] : [])]),
    headers:{ 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) },
    ...(body ? { body:JSON.stringify(body) } : {})
  });
  const result = await response.json();
  if (!response.ok) { const error = new Error(result.error || 'Could not sync this game.'); error.status = response.status; throw error; }
  return result;
}
export class SharedClient {
  constructor({ token, room, onChange, request = sharedRequest, storage, uuid = () => crypto.randomUUID(), schedule = setTimeout, cancel = clearTimeout }) {
    Object.assign(this, { token, room, onChange, request, storage, uuid, schedule, cancel });
    this.key = `daily-cross:shared-pending:${token}`;
    this.pending = []; this.history = []; this.closed = false; this.sending = false; this.error = ''; this.fatal = false;
    this.controller = new AbortController();
    try {
      const saved = JSON.parse(storage?.getItem(this.key) || 'null');
      if (saved && Array.isArray(saved.pending) && saved.pending.length <= 200 && Array.isArray(saved.history)) { saved.pending.forEach(operation => validateOperation(room.puzzle, operation)); this.pending = saved.pending; this.history = saved.history.filter(item => Array.isArray(item?.changes)).slice(-100); }
    } catch { /* Still usable without session storage. */ }
  }
  view() { return this.pending.reduce(applyOperation, this.room); }
  emit() {
    if (!this.closed) this.onChange({ room:this.view(), pending:this.pending.length, canUndo:this.history.length > 0, status:this.fatal ? 'ended' : this.error ? 'reconnecting' : this.pending.length ? 'syncing' : 'connected', error:this.error });
  }
  persist() { try { this.storage?.setItem(this.key, JSON.stringify({ pending:this.pending, history:this.history })); } catch { /* Network retries continue in memory. */ } }
  accept(room) { if (room.revision >= this.room.revision) this.room = room; }
  fail(error) {
    if (this.closed) return;
    this.error = error.message || 'Connection lost. Retrying…';
    this.fatal = [400,401,404,413,415].includes(error.status);
    this.emit();
  }
  start() { this.emit(); this.flush(); this.poll(); }
  async poll() {
    try {
      const room = await this.request(this.token, 'GET', undefined, this.controller.signal);
      if (this.closed) return;
      this.accept(room); this.error = ''; this.emit(); this.flush();
    } catch (error) { this.fail(error); }
    finally { if (!this.closed && !this.fatal) this.timer = this.schedule(() => this.poll(), 1000); }
  }
  enqueue(operation) { this.pending.push(operation); this.persist(); this.emit(); this.flush(); }
  edit(before, after) {
    const changes = changesBetween(before.answers, after.answers);
    if (!changes.length && (before.assisted || !after.assisted)) return;
    if (this.closed || this.fatal || this.pending.length >= 200) throw new Error('Reconnect or leave this shared game before editing further.');
    const id = this.uuid();
    if (changes.length) this.history.push({ changes:changes.map(change => ({ cell:change.cell, value:before.answers[change.cell] || '', expected:id, previousWriter:this.view().writers[change.cell] })) });
    this.history = this.history.slice(-100);
    this.enqueue({ id, changes, assisted:after.assisted });
  }
  undo() {
    if (!this.history.length || this.closed || this.fatal || this.pending.length >= 200) return;
    const previous = this.history.pop(), id = this.uuid();
    for (const change of previous.changes) for (const item of this.history) for (const older of item.changes) {
      if (older.cell === change.cell && older.expected === change.previousWriter) older.expected = id;
    }
    this.enqueue({ id, changes:previous.changes.map(({ cell, value, expected }) => ({ cell, value, expected })), assisted:false });
  }
  async flush() {
    if (this.sending || this.closed || this.fatal) return;
    this.sending = true;
    try {
      while (this.pending.length && !this.closed) {
        const room = await this.request(this.token, 'PATCH', this.pending[0], this.controller.signal);
        if (this.closed) return;
        this.accept(room); this.pending.shift(); this.error = ''; this.persist(); this.emit();
      }
    } catch (error) { this.fail(error); }
    finally { this.sending = false; }
  }
  stop() { this.closed = true; this.cancel(this.timer); this.controller.abort(); }
}
