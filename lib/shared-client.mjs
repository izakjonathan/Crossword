import { applyOperation, changesBetween, validateOperation, roundId, defaultView } from './shared-model.mjs';

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
    this.pending = []; this.history = []; this.closed = false; this.changing = false; this.error = ''; this.fatal = false;
    this.controller = new AbortController();
    try {
      const saved = JSON.parse(storage?.getItem(this.key) || 'null');
      if (saved && Array.isArray(saved.pending) && saved.pending.length <= 200 && Array.isArray(saved.history)) {
        if (saved.roundId === roundId(room) || (!saved.roundId && !room.roundId)) {
          saved.pending.forEach(op => validateOperation(room.puzzle, op));
          this.pending = saved.pending.map(op=>({...op,roundId:roundId(room)})); this.history = saved.history.filter(item=>Array.isArray(item?.changes)).slice(-100);
        } else if (saved.pending.length) {
          storage?.setItem(this.key + ':previous-round', JSON.stringify(saved));
          this.message = 'Unsent edits belonged to the previous puzzle and were kept on this device.';
        }
      }
    } catch { /* Sync remains usable without session storage. */ }
  }
  view() { return this.pending.reduce(applyOperation, this.room); }
  generating() { return this.changing || (this.room.generating?.untilAt || 0) > Date.now(); }
  emit() {
    if (!this.closed) this.onChange({ room:this.view(), pending:this.pending.length, canUndo:this.history.length > 0, generating:this.generating(), message:this.message, status:this.fatal ? 'ended' : this.error ? 'reconnecting' : this.generating() ? 'generating' : this.pending.length ? 'syncing' : 'connected', error:this.error });
    this.message = '';
  }
  persist() { try { this.storage?.setItem(this.key, JSON.stringify({ roundId:roundId(this.room), pending:this.pending, history:this.history })); } catch { /* Network retries continue in memory. */ } }
  accept(room) {
    if (room.revision < this.room.revision) return;
    if (roundId(room) !== roundId(this.room)) {
      if (this.pending.length) {
        try { this.storage?.setItem(this.key + ':previous-round', JSON.stringify({roundId:roundId(this.room),pending:this.pending,history:this.history})); } catch {}
        this.message = 'The shared puzzle changed. Old unsent edits were kept on this device.';
      }
      this.pending = []; this.history = [];
    }
    this.room = room; this.persist();
  }
  fail(error) {
    if (this.closed) return;
    this.error = error.message || 'Connection lost. Retrying…';
    this.fatal = [400,401,404,413,415].includes(error.status); this.emit();
  }
  start() { this.emit(); this.flush(); this.poll(); }
  async poll() {
    try {
      const room = await this.request(this.token, 'GET', undefined, this.controller.signal);
      if (this.closed) return;
      this.accept(room); this.error = ''; this.emit(); this.flush();
    } catch (error) { this.fail(error); }
    finally { if (!this.closed && !this.fatal) this.timer = this.schedule(() => this.poll(), 750); }
  }
  enqueue(operation) { this.pending.push({ ...operation, roundId:roundId(this.room) }); this.persist(); this.emit(); this.flush(); }
  editable() {
    if (this.closed || this.fatal || this.generating() || this.pending.length >= 200) throw new Error('Wait for the shared game to finish syncing before editing.');
  }
  edit(before, after, metrics) {
    const changes = changesBetween(before.answers, after.answers);
    const currentView = this.view().view || defaultView(this.room.puzzle);
    const selection = Number.isInteger(after.selected) && Number.isInteger(after.entryId) && (after.selected !== currentView.selected || after.entryId !== currentView.entryId) ? {selected:after.selected,entryId:after.entryId} : {};
    if (!changes.length && !Object.keys(selection).length && !metrics && (before.assisted || !after.assisted)) return;
    this.editable(); const id = this.uuid();
    if (changes.length) this.history.push({ view:{selected:currentView.selected,entryId:currentView.entryId}, changes:changes.map(change=>({ cell:change.cell, value:before.answers[change.cell] || '', expected:id, previousWriter:this.view().writers[change.cell] })) });
    this.history = this.history.slice(-100);
    this.enqueue({ id, changes, ...(metrics?{metrics}:{}), assisted:after.assisted, view:{...selection,errors:[]} });
  }
  setView(view, metrics) {
    this.editable(); const current = this.view().view || defaultView(this.room.puzzle);
    if (!metrics && Object.keys(view).every(key=>JSON.stringify(view[key])===JSON.stringify(current[key]))) return;
    this.enqueue({id:this.uuid(),changes:[],assisted:false,view,...(metrics?{metrics}:{})});
  }
  undo() {
    if (!this.history.length) return;
    this.editable(); const previous = this.history.pop(), id = this.uuid();
    for (const change of previous.changes) for (const item of this.history) for (const older of item.changes) if (older.cell === change.cell && older.expected === change.previousWriter) older.expected = id;
    this.enqueue({ id, changes:previous.changes.map(({cell,value,expected})=>({cell,value,expected})), assisted:false, view:{...previous.view,errors:[]} });
  }
  async flush() {
    if (this.flushPromise) return this.flushPromise;
    if (this.closed || this.fatal) return;
    this.flushPromise = this.drain();
    try { await this.flushPromise; } finally { this.flushPromise = null; }
  }
  async drain() {
    try {
      while (this.pending.length && !this.closed) {
        const sent = this.pending[0];
        const room = await this.request(this.token, 'PATCH', sent, this.controller.signal);
        if (this.closed) return;
        this.accept(room); this.pending = this.pending.filter(op=>op.id!==sent.id); this.error = ''; this.persist(); this.emit();
      }
    } catch (error) {
      if (error.status === 409) {
        try { this.accept(await this.request(this.token, 'GET', undefined, this.controller.signal)); this.error = ''; this.emit(); }
        catch (refreshError) { this.fail(refreshError); }
      } else this.fail(error);
    }
  }
  async send(operation) {
    try { return await this.request(this.token,'PATCH',operation,this.controller.signal); }
    catch (error) {
      if (error.status || this.closed) throw error;
      return this.request(this.token,'PATCH',operation,this.controller.signal);
    }
  }
  async newRound(makePuzzle) {
    if (this.generating() || this.closed || this.fatal) throw new Error('Another player is already creating a puzzle.');
    this.changing = true; this.emit();
    let lease;
    const base = roundId(this.room);
    const operation = kind=>({id:this.uuid(),kind,roundId:base,changes:[],assisted:false});
    try {
      await this.flush();
      if (this.pending.length || roundId(this.room) !== base) throw new Error('Wait for your edits to save, then try again.');
      lease = operation('begin'); this.accept(await this.send(lease)); this.emit();
      const puzzle = await makePuzzle(this.room);
      const replace = {...operation('replace'),leaseId:lease.id,puzzle};
      this.accept(await this.send(replace)); this.error = ''; this.emit();
    } catch (error) {
      if (error.status === 409) { try { this.accept(await this.request(this.token,'GET',undefined,this.controller.signal)); } catch {} }
      throw error;
    } finally {
      if (lease && roundId(this.room) === base && !this.closed) {
        try { this.accept(await this.send({...operation('cancel'),leaseId:lease.id})); } catch { /* Server lease expires after 45 seconds. */ }
      }
      this.changing = false; this.emit();
    }
  }
  stop() { this.closed = true; this.cancel(this.timer); this.controller.abort(); }
}
