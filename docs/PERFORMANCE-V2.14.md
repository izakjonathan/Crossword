# CSP dictionary indexing · v2.14.0

Baseline: v2.13.3, commit e8a8d51c45312d54255c2380fd7266831deb19d7. This release applies the supplied generator-methodology brief to the existing CSP implementation.

## Architecture review

The app already designs rotationally symmetric blocks before extracting real Across/Down runs and their intersections. It selects the slot with the fewest candidate words, breaks ties by crossing degree and distance from the centre, ranks candidates by neighbour support, and backtracks when crossing or editorial constraints fail. All-different answer constraints and history exclusions remain mandatory. Final starts receive row-major numbers, with one shared number when Across and Down start in the same cell. These features are covered by independent construction, validation and engine tests.

The layout mask, candidate domains and assigned words already distinguish blocked, unfilled and confirmed cells. Retaining this representation avoids changing the public grid/save schema merely to use a literal two-dimensional array. Backtracking uses child domain arrays, so reverting a branch cannot erase a previously assigned crossing letter. Entry cells encode coordinates and direction without introducing duplicate coordinate metadata.

## Improvement

`lib/dictionary-index.mjs` now owns per-fill word-length buckets, letter groups at arbitrary positions, answer membership and bounded excluded-answer results. Arbitrary-position queries handle crossing patterns such as `.A..E`, as well as prefixes, through indexed lookups rather than scanning an entire length bucket with a regular expression.

The old index eagerly built both full and non-specialist groups every time a position was queried. The new index builds full groups first, then builds non-specialist groups only if a specialist crossing actually needs them. It also reuses up to 16 excluded-answer variants per domain during backtracking. The bound prevents retaining every possible exclusion variant. Indexed arrays retain the original dictionary order and are treated as immutable; all caches are local to one fill and become unreachable afterwards. Editorial bounds have their own per-fill WeakMap.

Search order, random-number consumption, node limits, layouts, acceptance/backtracking, word bank, difficulty, fairness, numbering and dated repeat rules are unchanged. Broader conflict propagation or a greedy fallback would change seeded search and has not been introduced as a performance shortcut.

## Matched performance

Command: `node scripts/benchmark-generation.mjs ../keyboard-release 100`. The baseline and candidate run in one process, alternating execution order, after three untimed warm-ups. Only generation is timed; complete-object equality and independent puzzle validation run outside the timed section. No build or audit was running during the comparison. The package still said 2.13.3 when this development benchmark started; the raw report preserves that fact and identifies the final release separately.

| Average generation | v2.13.3 | v2.14.0 implementation | Reduction |
| --- | ---: | ---: | ---: |
| Easy, 100 seeds | 19.9 ms | 11.0 ms | 45% |
| Medium, 100 seeds | 24.0 ms | 16.1 ms | 33% |
| Hard, 100 seeds | 85.7 ms | 57.9 ms | 32% |
| Twelve-game history-aware sequence | 184.8 ms | 105.0 ms | 43% |

Hard p95 fell from 225.5 to 146.7 ms. All 300 fresh puzzles and all twelve history-aware puzzles matched the baseline in their complete public objects. All 309 answers in the consecutive-game sequence were distinct. Raw results: [matched benchmark](benchmarks/v2.14-performance.json).

## Validation and limits

The new index is tested against independent linear filtering over the entire curated bank, at every answer length and letter position, both with and without specialist answers. Backtracking tests check duplicate removal, unchanged parent domains, reuse and isolation between differently restricted banks. Existing fixed-output hashes and acceptance/backtracking tests continue to apply.

Release checks: all 127 tests passed with disposable real Redis (zero skipped); production build passed; all three built-CSS layout checks passed; the independent 300-puzzle audit completed with zero failures, zero specialist-to-specialist crossings and zero unsupported hardest-tier clues. No lint or standalone typecheck script is configured. These are measurements on one host and fixed seeds, not an iPhone latency or memory guarantee. Strict repeat protection can still exhaust the finite vocabulary. This remains a partially checked quick crossword; it does not claim full American newspaper-grid compliance or human-calibrated difficulty. Existing saved/shared games and UI are unchanged.
