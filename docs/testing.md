# Testing

Use Node 24 and install the exact dependencies with `npm ci`.

```bash
npm test
npm run build
LAYOUT_BUILD=1 node --test tests/layout.test.mjs
npm run audit:puzzles
```

The project has no configured lint or standalone typecheck script. Its source is JavaScript/JSX; the production build verifies compilation and bundling. Do not describe an unrun lint/typecheck command as passing.

Final v2.9.0 evidence on 19 October 2026: **72/72 source tests passed**, production build passed, **3/3 production CSS checks passed**, and **300/300 audit puzzles passed**. Raw metrics and methodology are in `docs/VALIDATION-V2.9.0.md` and `docs/benchmarks`.

Chromium production-flow checks passed at mobile portrait/landscape sizes: generation, typing, clue browsing and selection, hints, clear/undo, UI Studio preview/cancel/save/reload, restored progress, dark colours and no horizontal overflow. Modal focus/inert behaviour and the persistent first-load recovery action were also exercised. The recovery test used a synthetic malformed history record in a new test context, removed it, then retried; it did not erase a real user's ledger. Worker timeout/crash/constructor-failure recovery is tested with controlled worker doubles.

Manual iPhone checks still needed: Safari browser chrome tint, native colour/text keyboard interactions, physical pinch/drag gestures, VoiceOver and touch-target comfort. Human clue test-solving and broader difficulty calibration remain outside automated certification.

A targeted manual solve checklist:

1. Generate each difficulty; solve from clues and crossings, recording ambiguous or unnatural definitions.
2. Tap a crossing twice, type through prefilled crossings, delete backwards, undo a hint and confirm assisted status remains.
3. Open All clues, switch direction, select a partially filled clue and verify its first square is selected.
4. Change each UI Studio colour, cancel, save, reload, rotate and expand/collapse Safari controls.
5. Open a dialog using a hardware keyboard, cycle Tab/Shift+Tab, close with Escape and verify focus restoration.
6. Resume a genuine v2.8.2 save without losing answers; generate a new puzzle to see the new longer-answer clue variants.

The historical v2.8.2 performance comparison requires matching editorial banks: use the v2.8.2 source and extracted v2.8.1 source. v2.9.0 intentionally changes seeded clue outputs, so its exact-output benchmark against an older bank must fail. For the historical comparison, extract the delivered v2.8.1 ZIP to a separate directory and run `node scripts/benchmark-generation.mjs /path/to/v2.8.1-source 100`. The script fails on any complete-puzzle difference or repeat in its twelve-game sequence. See `PERFORMANCE-V2.8.2.md` for benchmark limits; do not add machine-dependent timing assertions to unit tests.

## Shared-session lifecycle review

The expanded shared tests cover shared view changes, new games from both devices, simultaneous requests, lost replacement responses, old offline queues, recovery and actual Redis round fencing. Input tests now assert sequential overwriting rather than filled-square skipping. See [SHARED-SESSION-REVIEW.md](SHARED-SESSION-REVIEW.md) for final evidence and limits.

## Discoverable shared lobbies

The lobby suite covers persisted device identity and session restoration, public discovery without token disclosure, idempotent joins/leaves, forwarded-origin validation, invalid/oversized requests, real Redis membership/expiry, editing/deletion, new-round rejoining and last-player closure. See [LOBBIES.md](LOBBIES.md) for current validation evidence and limitations.

Validation: 103/103 tests passed with real Redis enabled (zero skipped), production build passed, 3/3 built CSS checks passed and 300/300 audited puzzles passed. Physical two-device UI interaction remains unverified in this environment.
