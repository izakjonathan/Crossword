export const MAX_ZOOM = 3;
export function fitBoard(width, height, cols, rows) {
  const cell = Math.max(1, Math.min((width - 4) / cols, (height - 4) / rows, 64));
  const cellHeight = Math.max(1, Math.min((height - 4) / rows, cell * 1.2));
  return { width, height, boardWidth:cell * cols, boardHeight:cellHeight * rows, cell, cellHeight };
}
export function cellAtPoint(frame, view, cols, rows, point) {
  const col = Math.floor((point.x - view.x) / (frame.cell * view.scale));
  const row = Math.floor((point.y - view.y) / (frame.cellHeight * view.scale));
  return col >= 0 && row >= 0 && col < cols && row < rows ? row * cols + col : null;
}
export function constrain(view, frame) {
  const scale = Math.max(1, Math.min(MAX_ZOOM, view.scale));
  const axis = (position, size, available) => size <= available ? (available - size) / 2 : Math.max(available - size, Math.min(0, position));
  return { scale, x: axis(view.x, frame.boardWidth * scale, frame.width), y: axis(view.y, frame.boardHeight * scale, frame.height) };
}
export function fitView(frame) { return constrain({ scale: 1, x: 0, y: 0 }, frame); }
export function zoomAt(view, frame, scale, origin, destination = origin) {
  const next = Math.max(1, Math.min(MAX_ZOOM, scale));
  return constrain({ scale: next, x: destination.x - (origin.x - view.x) * next / view.scale, y: destination.y - (origin.y - view.y) * next / view.scale }, frame);
}
export function revealCell(view, frame, col, row) {
  const cellWidth = frame.cell * view.scale, cellHeight = frame.cellHeight * view.scale;
  const margin = Math.min(8, cellWidth / 4, cellHeight / 4);
  const adjust = (offset, index, size, available) => {
    const start = offset + index * size, end = start + size;
    if (start < margin) return offset + margin - start;
    if (end > available - margin) return offset + available - margin - end;
    return offset;
  };
  return constrain({ ...view, x: adjust(view.x, col, cellWidth, frame.width), y: adjust(view.y, row, cellHeight, frame.height) }, frame);
}

export const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

// Pointer bookkeeping is independent of rendering so cancelled gestures and
// the two-finger → one-finger transition can be verified without a browser.
export class BoardGesture {
  constructor() { this.reset(); }
  reset() { this.pointers = new Map(); this.startPoints = []; this.moved = false; this.base = null; }
  rebase(view) { this.startPoints = [...this.pointers.values()]; this.base = view; }
  down(id, point, view) {
    if (!this.pointers.size) this.moved = false;
    this.pointers.set(id, point);
    if (this.pointers.size > 1) this.moved = true;
    this.rebase(view);
  }
  move(id, point, frame) {
    if (!this.pointers.has(id) || !this.base) return null;
    this.pointers.set(id, point);
    const now = [...this.pointers.values()], start = this.startPoints;
    if (now.length >= 2 && start.length >= 2) {
      const mid = a => ({ x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 });
      const dist = a => Math.hypot(a[1].x - a[0].x, a[1].y - a[0].y);
      return dist(start) < 1 ? null : zoomAt(this.base, frame, this.base.scale * dist(now) / dist(start), mid(start), mid(now));
    }
    const dx = now[0].x - start[0].x, dy = now[0].y - start[0].y;
    if (Math.hypot(dx, dy) > 6) this.moved = true;
    return this.moved ? constrain({ ...this.base, x: this.base.x + dx, y: this.base.y + dy }, frame) : null;
  }
  up(id, view, cancelled = false) {
    if (!this.pointers.has(id)) return false;
    if (cancelled) this.moved = true;
    const tap = !this.moved && this.pointers.size === 1;
    this.pointers.delete(id); this.rebase(view);
    return tap;
  }
}
