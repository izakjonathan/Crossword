// A timed-out worker must be terminated: leaving it alive queues every retry
// behind the same stuck search. A fresh worker is created on the next request.
export class GenerationClient {
  constructor(createWorker, { timeoutMs = 20000, schedule = (fn, delay) => setTimeout(fn, delay), cancel = id => clearTimeout(id) } = {}) {
    this.createWorker = createWorker;
    this.timeoutMs = timeoutMs;
    this.schedule = schedule;
    this.cancel = cancel;
    this.worker = null;
    this.pending = null;
    this.sequence = 0;
    this.closed = false;
  }
  generate(options) {
    if (this.closed) return Promise.reject(new Error('Generation cancelled.'));
    if (this.pending) return Promise.reject(new Error('A puzzle is already being generated.'));
    return new Promise((resolve, reject) => {
      const requestId = ++this.sequence;
      this.pending = { requestId, resolve, reject };
      try {
        if (!this.worker) {
          const worker = this.createWorker();
          this.worker = worker;
          worker.onmessage = ({ data }) => {
            if (this.worker !== worker || data?.requestId !== this.pending?.requestId) return;
            if (data.error) this.finish(new Error(data.error));
            else if (!data.puzzle) this.fail(new Error('The generator returned an incomplete response. Try again.'));
            else this.finish(null, data.puzzle);
          };
          worker.onerror = () => { if (this.worker === worker) this.fail(new Error('The generator stopped unexpectedly. Try again. Your current puzzle has been kept.')); };
        }
        this.timer = this.schedule(() => this.fail(new Error('Generation took too long. Try again. Your current puzzle has been kept.')), this.timeoutMs);
        this.worker.postMessage({ requestId, options });
      } catch { this.fail(new Error('Your browser could not start the generator. Try again.')); }
    });
  }
  finish(error, puzzle) {
    const pending = this.pending;
    this.pending = null;
    this.cancel(this.timer);
    if (error) pending?.reject(error); else pending?.resolve(puzzle);
  }
  fail(error) {
    this.worker?.terminate();
    this.worker = null;
    this.finish(error);
  }
  dispose() {
    this.closed = true;
    this.fail(new Error('Generation cancelled.'));
  }
}
