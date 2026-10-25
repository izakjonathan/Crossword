import { generatePuzzle } from './engine.mjs';
import { generateFreshPuzzle } from './fresh-puzzle.mjs';
self.onmessage = ({ data }) => {
  try {
    let puzzle, lastError;
    const deadline=Date.now()+7000;
    for (let retry = 0; retry < 3 && Date.now()<deadline; retry++) {
      try { puzzle = data.options.history ? generateFreshPuzzle(data.options) : generatePuzzle({ ...data.options, deadline, seed: retry ? `${data.options.seed}:retry-${retry}` : data.options.seed }); break; }
      catch (error) { lastError = error; if (data.options.history) break; }
    }
    if (!puzzle) throw lastError;
    self.postMessage({ requestId: data.requestId, puzzle });
  } catch (error) { self.postMessage({ requestId: data.requestId, error: error?.message || 'Could not generate a puzzle.' }); }
};
