import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as candidate from '../lib/engine.mjs';
import { gridQuality, rotationallySymmetric } from '../lib/grid-quality.mjs';
import { checkingQuality } from '../lib/validate.mjs';
const root = process.argv[2], count = Number(process.argv[3] || 30);
if (!root || !Number.isInteger(count) || count < 1 || count > 1000) throw new Error('Usage: node scripts/benchmark-geometry.mjs BASELINE_ROOT [1–1000 seeds per mode]');
const baseline = await import(pathToFileURL(join(resolve(root), 'lib/engine.mjs')));
const report = { method: 'Same-process alternating execution order; identical inputs, intentionally different geometry; generation only timed. No history exclusions.', seedsPerMode: count, modes: {} };
for (const mode of ['easy', 'medium', 'hard']) {
  const samples = { baseline: [], candidate: [] }, failures = { baseline: [], candidate: [] };
  for (let seed = 0; seed < count; seed++) {
    const run = (name, engine) => {
      const start = performance.now();
      try {
        const p = engine.generatePuzzle({ mode, seed: `audit-${seed}` }), ms = performance.now() - start;
        const errors = engine.validatePuzzle(p);
        if (errors.length) throw new Error(errors.join('; '));
        const quality = gridQuality(p.grid, p.cols, p.rows), checking = checkingQuality(p);
        samples[name].push({ ms, black: quality.blackRatio, clumps: quality.solidBlackSquares, checking: checking.entries.reduce((sum, e) => sum + e.ratio, 0) / checking.entries.length, symmetric: Number(rotationallySymmetric(p.grid)) });
      } catch (e) { failures[name].push({ seed, message: e.message }); }
    };
    const order = seed % 2 ? [['candidate', candidate], ['baseline', baseline]] : [['baseline', baseline], ['candidate', candidate]];
    for (const [name, engine] of order) run(name, engine);
  }
  report.modes[mode] = Object.fromEntries(Object.entries(samples).map(([name, values]) => {
    const mean = key => values.reduce((sum, v) => sum + v[key], 0) / values.length;
    const times = values.map(v => v.ms).sort((a, b) => a - b);
    return [name, { successes: values.length, failures: failures[name], meanMs: mean('ms'), p95Ms: times[Math.ceil(times.length * .95) - 1], maxMs: times.at(-1), meanBlack: mean('black'), meanChecking: mean('checking'), meanClumps: mean('clumps'), maxClumps: Math.max(...values.map(v => v.clumps)), symmetricPuzzles: values.reduce((sum, v) => sum + v.symmetric, 0) }];
  }));
}
console.log(JSON.stringify(report, null, 2));
if (Object.values(report.modes).some(mode => Object.values(mode).some(result => result.failures.length))) process.exitCode = 1;
