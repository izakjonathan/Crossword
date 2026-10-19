# v2.8.1 validation

Baseline: delivered v2.8.0 source ZIP. Evidence recorded 19 October 2026 using Node 24.19.

## Results

- `npm test`: 67/67 tests passed. The existing twelve-game same-day sequence still passes with shared exclusions across all three modes. Added tests cover specialist pair counting, clue support, bounded clue selection/backtracking, impossible allocations, corrupted metadata, rated-bank validation and an actual v2.8 saved-game fixture.
- `npm run build`: production compilation and prerendering passed.
- `LAYOUT_BUILD=1 node --test tests/layout.test.mjs`: 3/3 checks passed, including the production CSS assets.
- `npm run audit:puzzles` / `node scripts/audit-puzzles.mjs`: 300/300 fresh-seed puzzles passed; 100 fixed seeds per mode, `audit-0` through `audit-99`. Every published puzzle passed the structural, difficulty and crossing-safety validators. Each mode had 100 distinct filled grids.

Raw results: [v2.8.1 audit](benchmarks/v2.8.1-audit.json).

| Observed result | Easy | Medium | Hard |
| --- | --- | --- | --- |
| Valid audit grids | 100/100 | 100/100 | 100/100 |
| Specialist-to-specialist crossing pairs | 0 | 0 | 0 |
| Hardest clues without gentler crossing support | 0 | 0 | 0 |
| Playable squares | 51–54 | 78–79 | 105–111 |
| Mean vocabulary band | 1.15 | 1.56 | 1.79 |
| Mean clue band | 1.00 | 1.39 | 1.90 |
| Mean generation time | 11 ms | 19 ms | 398 ms |
| p95 generation time | 23 ms | 31 ms | 1,544 ms |
| Slowest sample | 114 ms | 602 ms | 4,601 ms |

No difficulty or checking thresholds were reduced. All sampled answers still had at least half their letters checked with no consecutive unchecked letters. Hardest-tier clues may still cross each other: the Hard audit averaged 1.78 such pairs per puzzle, but every one of those entries had at least one gentler crossing elsewhere.

Timings are machine-specific, with other checks running concurrently. Hard search is more expensive than v2.8.0; this is a tradeoff of the extra constraints, not a phone-latency guarantee. The fixed search budgets and 20-second client deadline remain in place. The bank is finite and strict history exclusions can still prevent a new puzzle; failure preserves the current game. A proposed pruning optimisation caused the consecutive-game regression test to fail and was removed before final verification.

## Production browser flow

Chromium checked the production build at mobile 390×844 and landscape 844×390. A genuine v2.8 puzzle restored with an entered letter. The flow exercised typing, clue selection/direction, hints, clear/undo, UI Studio preview/cancel/save/reload, restored puzzle identity, rotation and no horizontal overflow. It then generated Easy, Medium and Hard through the actual worker, checked `fairnessVersion:1` and validated the stored result. The sequence had no repeated answers, including the restored puzzle's answers.

Modal focus/inert behaviour and recovery from a synthetic malformed ledger passed in disposable contexts. The solve path is browser UI → worker → validated puzzle → locked local ledger/session → rendered grid; there is no server puzzle API or database in that path. No uncaught page errors were observed.

## Remaining limits

Real iPhone Safari chrome tint, physical touch/VoiceOver behaviour and phone generation times remain unverified. Editorial ratings and the new safeguards do not establish human-calibrated difficulty, unique natural-language solutions or a full independent semantic audit of every clue. The targeted mathematical corrections are sourced in [crossing fairness](CROSSING-FAIRNESS.md); wider human test-solving remains necessary.
