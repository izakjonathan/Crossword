# v2.8.2 validation

Baseline: delivered v2.8.1 source ZIP. Node 24.19; evidence recorded 19 October 2026.

## Automated checks

- `npm test`: 69/69 source tests passed, including the twelve-game same-day repeat-exclusion sequence, cached-domain backtracking/all-different behaviour and nine baseline-output hash cases.
- `npm run build`: production compilation and prerendering passed.
- `LAYOUT_BUILD=1 node --test tests/layout.test.mjs`: 3/3 source/production CSS checks passed.
- Standard puzzle audit: 300/300 valid puzzles, 100 fixed seeds per mode. Zero specialist-to-specialist crossing pairs and zero hardest-tier clues without gentler crossing support. All original difficulty/checking rules passed independently.
- Matched comparison against extracted v2.8.1: 300 fresh and twelve history-aware puzzles were identical as complete objects, with 301 distinct answers in the consecutive-game sequence.

Commands and results: [performance methodology](PERFORMANCE-V2.8.2.md), [matched benchmark](benchmarks/v2.8.2-performance.json), [standard audit](benchmarks/v2.8.2-audit.json). Only generation is timed in the matched comparison; equality and validators run outside the timed interval. The standard test/audit commands were run concurrently and are not used as the matched latency comparison.

The project has no configured lint or standalone typecheck command. No new dependencies, external APIs, environment variables or server data paths were introduced.

## Browser flow

Production Chromium at mobile 390×844 and landscape 844×390: restore a genuine v2.8.1 saved puzzle with an entered letter; type, open/select clues, switch direction, reveal, clear/undo, preview/cancel/save UI Studio, reload palette/progress and rotate without horizontal overflow. Generate all three new difficulties through the real worker and validate their stored puzzle objects, fairness tag and shared answer exclusions. Modal focus/inert checks and synthetic ledger-error recovery also passed, with no uncaught page errors.

The unchanged flow is page → worker → validated puzzle → committed local ledger/session → board. Caches are scoped to a layout fill, so previous requests cannot supply words to a later history-restricted request. Existing unit tests continue to cover worker timeouts, crashes, stale request identity, failed persistence, history migration and exhaustion without weakening exclusions.

## Limits

The matched desktop benchmark recorded about 27% lower mean Hard generation time and 39% lower mean time over its twelve-game sequence. Easy was 0.6 ms slower on average; Medium was similar. Real phone latency and memory use were not benchmarked, and iPhone Safari chrome/VoiceOver/touch verification remains outstanding. Hard generation can still take seconds or fail when strict history exclusions exhaust usable fill. This update does not expand or independently recalibrate the editorial clue bank.
