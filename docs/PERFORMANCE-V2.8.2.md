# v2.8.2 generation performance

Baseline: delivered v2.8.1 source. Measured 19 October 2026 with Node 24.19. The only production-code change is inside `lib/grid-fill.mjs`; no layout, word, clue, difficulty, crossing or repetition policy changed.

## Finding and implementation

A CPU profile of twenty Hard requests (`audit-0` through `audit-19`) attributed approximately 60% of samples to recursive candidate search, 15% to editorial-domain bounds and 6% to garbage collection. Sampling locates expensive functions; it is not an exact accounting of individual operations. Candidate domains and letter support were repeatedly reconstructed while exploring alternative branches.

The filler now caches letter groups, non-specialist letter groups, answer membership and editorial bounds for an immutable domain array. When a constraint leaves a domain unchanged, the same array is reused instead of allocating and scanning an equivalent copy. A layout's affected-slot/crossing relationships are calculated once. Candidate letter-support logarithms are calculated per available letter, rather than per candidate answer.

These caches exist only inside one layout-fill call. They are not shared between puzzles, history pools or browsers and cannot reintroduce an excluded word. Cache keys use WeakMap; all cache state becomes unreachable after the fill finishes. Arrays remain in original bank order. Candidate scores, tie-breaking, ascending affected-slot order, node counting, acceptance/backtracking and random-number consumption are retained. The 3,000-node per-fill limit, 48,000-node arrangement budget, clue-selection budget and 20-second browser deadline remain unchanged.

## Matched benchmark

Command, from the candidate source tree:

```bash
node scripts/benchmark-generation.mjs /path/to/extracted-v2.8.1-source 100
```

The two engines run in the same process with alternating execution order. Three untimed comparisons warm up the modules. Each mode uses seeds `audit-0` through `audit-99`, empty recent exclusions. Only generation is timed; complete-puzzle equality and independent validation run afterwards. A difference is an error, not a result silently omitted from the report.

A second comparison follows the existing twelve-game Easy/Medium/Hard same-day sequence (`day-0` through `day-11`), recording every answer in the dated ledger before the next request. This exercises progressively restricted candidate pools. All 301 answers in that sequence were distinct.

| Metric | v2.8.1 | v2.8.2 |
| --- | --- | --- |
| Easy mean | 6.2 ms | 6.8 ms |
| Medium mean | 10.4 ms | 10.2 ms |
| Hard mean | 455 ms | 334 ms |
| Hard p95 | 1,852 ms | 1,401 ms |
| Slowest fresh Hard request | 4,103 ms | 2,908 ms |
| Consecutive-game mean | 1,398 ms | 858 ms |
| Slowest consecutive-game request | 8,123 ms | 5,623 ms |

Hard mean generation time fell about 27%, and the consecutive-game mean fell about 39%. Easy's measured mean increased by 0.6 ms; Medium was similar. This is a Hard-search improvement, not a claim of speed gains in every mode.

All 300 fresh puzzles and all twelve history-aware puzzles were identical in their complete public objects, including grids, answers, clue wording, selection tiers, IDs and numbering. Nine additional baseline-output hashes are included as regular regression fixtures. Hashes test output stability; structural, difficulty and crossing validators continue to test correctness separately.

Raw matched results: [performance comparison](benchmarks/v2.8.2-performance.json). The standard audit is recorded separately in [v2.8.2 audit](benchmarks/v2.8.2-audit.json).

## Limits

This is one machine and fixed input sets, not a guarantee for every phone, seed, browser or exhausted ledger. The standard test/audit run may have concurrent CPU load, so its timings should not be substituted for the matched comparison. The caches add memory bookkeeping during a fill; no device memory benchmark or real iPhone Safari latency measurement was performed. Hard generation can still take seconds, and strict repeat protection can still make a puzzle unavailable. Wider human clue calibration remains outside this performance change.
