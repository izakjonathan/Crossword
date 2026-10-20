# Symmetric quick-grid construction · v2.12.0

Baseline: 053b074627f9d835336892394c1c55d583159325 (v2.11.0). Reviewed 20 October 2026.

## Scope and geometry contract

The user selected improved quick grids with the existing sizes and curated word bank. These are partially checked quick crosswords, not fully checked American publication grids. The 1,906-answer bank, clue ratings, difficulty profiles, crossing safeguards and repeat rules are unchanged.

New puzzles carry `constructionVersion:4`. They have exact 180-degree rotational block symmetry; maximum block ratios of 31% / 34% / 37% for Easy / Medium / Hard; and at most two all-black 2×2 patches (previously 42% / three patches). Every answer remains at least three letters long, at least half checked with no adjacent unchecked letters, with connected entries and complete white-cell coverage. Numbering is recomputed row by row, sharing one number when Across and Down start together. White cells form a single orthogonally connected region.

Opposite long slots are anchored before other segmentation. Separator placement, endpoint trimming and added white crossings operate in rotational pairs. Transposition varies long-answer direction. Tighter density is moderate so real bank words can still fill the slots. No invented fill, partial grids, asymmetric fallback or relaxed repeats are allowed. Search remains capped at 48,000 nodes; it tries up to 512 layouts with increasing per-layout budgets, starting at 300 nodes. The filler and clue allocator themselves are unchanged.

The often quoted 16% American-grid target is not imposed here. In a 15×15 grid, 16% is 36 blocks, whereas 38–42 is roughly 17–19%. [Constructor guidance](https://giveacrossword.org/rules.pdf) describes symmetry, all-over interlock, three-letter minimum and approximately 16% blocks. [Historical Shortz rules](https://www.barelybad.com/xwdrulesreal.htm) distinguish the former density limit from later practice. Neither reference establishes a current universal publication requirement. Fully checked layouts sampled against the existing bank did not fill reliably, so this release preserves the chosen quick-crossword format. It does not add themed construction or a manual block editor.

## Compatibility

Session/engine version remains 3 and the storage keys remain unchanged. Construction v2/v3 saves are validated under their original geometry rules, with genuine v2.11.0 puzzles retained as fixtures. Old games keep their letters, clues, numbers and progress; only newly generated games receive symmetric geometry. Saved library and shared Redis rounds use the same version-aware validator. Redis grid reconstruction from entry coordinates is retained. Shared lobby membership persists through new rounds. Typing still advances one square, including occupied squares.

New seeds intentionally produce different layouts, fills and clue allocation. Historical fixtures remain; v2.12.0 has a new complete-output hash fixture. The old search-cost benchmark still requires exact output equality. The new `scripts/benchmark-geometry.mjs` compares reliability, geometry and timings with identical inputs and alternating execution order, without asserting identical puzzles.

## Verification

- `npm test`: 116 passed, zero skipped, with disposable real Redis. Includes 12-game repeat-protected sequences, shared edits/deletes, replacement rounds, library/storage, numbering and crossing safety.
- `npm run build`: passed; `LAYOUT_BUILD=1 node --test tests/layout.test.mjs`: 3 passed.
- `npm run audit:puzzles`: 300/300 valid, symmetric puzzles; zero specialist-to-specialist crossings or unsupported hardest clues. Easy had no solid black 2×2 patches; Medium/Hard had at most two.
- Independent geometry tests check rotational counterparts, density, black patches and orthogonal white-cell connectivity. Legacy fixtures remain valid and fail the new geometry contract when deliberately relabelled.

Matched 30-seed-per-mode comparison (`audit-0` through `audit-29`):

| Mode | Mean blocks before → after | Mean entry checking before → after | Mean generation ms before → after |
| --- | --- | --- | --- |
| Easy | 36.3% → 29.2% | 62.7% → 77.5% | 6.4 → 26.8 |
| Medium | 35.5% → 33.3% | 59.2% → 63.4% | 5.3 → 36.2 |
| Hard | 36.4% → 35.4% | 59.4% → 59.9% | 145.5 → 124.1 |

All 90 baseline and 90 candidate generations succeeded. The largest candidate time was 369 ms in that benchmark; the separate 300-puzzle audit peaked at 426 ms. These are container measurements, not physical-phone latency guarantees. Geometry improves Easy/Medium checking substantially; Hard improves only modestly. Finite bank/history exclusions can still exhaust generation, which preserves the current puzzle. Human test-solving remains needed for editorial difficulty.

Raw evidence: [audit](GEOMETRY-V2.12-AUDIT.json), [matched benchmark](GEOMETRY-V2.12-BENCHMARK.json). Live deployment verification is reported separately after release.
