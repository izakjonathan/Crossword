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
3. Open All clues, switch direction, select a partially filled clue and verify its first empty square is selected.
4. Change each UI Studio colour, cancel, save, reload, rotate and expand/collapse Safari controls.
5. Open a dialog using a hardware keyboard, cycle Tab/Shift+Tab, close with Escape and verify focus restoration.
6. Resume a genuine v2.8.2 save without losing answers; generate a new puzzle to see the new longer-answer clue variants.

The historical v2.8.2 performance comparison requires matching editorial banks: use the v2.8.2 source and extracted v2.8.1 source. v2.9.0 intentionally changes seeded clue outputs, so its exact-output benchmark against an older bank must fail. For the historical comparison, extract the delivered v2.8.1 ZIP to a separate directory and run `node scripts/benchmark-generation.mjs /path/to/v2.8.1-source 100`. The script fails on any complete-puzzle difference or repeat in its twelve-game sequence. See `PERFORMANCE-V2.8.2.md` for benchmark limits; do not add machine-dependent timing assertions to unit tests.

## Shared dialog clearing (v2.13.1)

`tests/shared-dialog.test.mjs` models the production null-dropping JSON boundary; native Redis alone does not reproduce that behavior. `tests/shared-redis.test.mjs` also exercises opening on one SharedClient, closing on another and repeated polls. See [failure and fix](SHARED-DIALOG-V2.13.1.md).

## Replacement bank release · v2.19.0 · 5 November 2026

Baseline: v2.18.0, 2beb818566fee6745662066208816c4188173883. Final source verification: npm test completed with 138 passing, 0 failing and 7 skipped tests (145 total); npm run build passed; LAYOUT_BUILD=1 node --test tests/layout.test.mjs passed 3/3; npm run audit:puzzles passed 300/300 (100 seeds per mode) against the final 1,520-answer bank. The skipped cases require a disposable real Redis server unavailable in this environment. Mocked shared-state and storage checks ran normally.

The focused history run passed 19/19 checks after fixing prepared continuation and candidate-pool budget starvation. New coverage proves disjointness from all 5,730 retired answers, the 384-entry entertainment share, active-clue membership, retained legacy data, classification and abbreviation limits, rejection of invalid proper-name spellings, exhausted-history recovery and protected mixed-mode rounds. All 64 rebuilt Hard packets passed active-answer and geometry/difficulty/mix checks; 120 consecutive prepared selections respected protected rounds. New exact-output hashes identify the deliberately changed bank; older fixtures remain intact.

Source tests that previously expected original answers in new grids now test their archived metadata and exclusion from new construction. The production build and layout checks cover compilation and CSS, not a new iPhone/Safari device test. Clue ambiguity, enjoyment and human difficulty calibration still need play-testing. Factual reference checks are documented separately; there is no claim of independent human certification of every clue.

## v2.20.0 · Permanent answer history (2026-11-09)

Baseline v2.19.0 / d8361980c16b162bee3c9f81187a9e0408d587f3. No replacement bank or solver-search refactor in this release.

- `REDIS_TEST_CLI=/workspace/scratch/redis-7.4.2/src/redis-cli npm test`: 154 passed, 0 failed, 0 skipped. Disposable Redis 7.4.2 built from the official release source; no production Redis tests. Added recovery/preservation, permanent CSP/prepared filtering, offline failure, reservation rejection/retry, concurrent-device claims, and shared/solo collision tests. Existing Redis fixtures now isolate their permanent history and exercise the updated Lua argument boundary.
- `npm run build`: passed for v2.20.0, including `/api/answer-history`.
- `LAYOUT_BUILD=1 node --test tests/layout.test.mjs`: 3 passed against production CSS.
- `npm run audit:puzzles`: 300/300 valid puzzles, 100 distinct per mode; results in benchmarks/v2.20-audit.json. This is a fresh-seed structural audit, not a guarantee that an arbitrarily depleted permanent history can produce another grid.
- Deterministic generation regression fixtures passed unchanged. The actual CSP search implementation and bank are unchanged; history eligibility is deliberately stricter for published games.
- `git diff --check`: passed. No configured lint or standalone typecheck scripts.

An initial full run found two test doubles reading the old Lua positional argument index; they now derive the argument boundary from the number of keys. A later run lost its disposable Redis process when the originating command finished; the final full run started its own Redis instance and passed all real Redis cases. No failed/skipped cases are represented as passing.

Device-only history cannot be collected remotely. Each browser must open online after deployment; deleted storage and expired/overwritten room history remain unrecoverable without another surviving ledger/save. See REPETITION.md. The live endpoint and browser smoke checks are reported separately after deployment.

## v2.21.0 · Editorial publication backend (2026-11-09)

Baseline v2.20.0 / 9f3f93f2a5efee41455200ce120266a74453c789.

- Full suite with disposable Redis 7.4.2: **176 passed, 0 failed, 0 skipped**. Coverage includes schema and review gating, explicit meanings, multiple clues at one tier, retired-bank exclusions, best-fill/clue pairing, positional pattern queries, Node worker deadlines, canonical digests, publication/receipt races, mixed-mode cache planning, shared replacement, idempotent feedback and all historical solve/layout/storage regressions.
- Production build passed; three built-CSS layout checks passed. Worker and editorial source files were confirmed in the API's output trace. No configured lint or standalone typecheck scripts.
- Structural audit: **300/300** fresh puzzles validated, 100 per mode. Results: benchmarks/v2.21-audit.json. This is not a human clue-quality audit or a guarantee for arbitrarily depleted history.
- Alternating same-process baseline comparison: three seeds per mode plus twelve mixed-history constructions independently validated. Changed output is intentional because the bank and metadata changed. Results: benchmarks/v2.21-comparison.json. The sample is small and ran on a shared host; it does not establish mobile/server speedup or compare HTTP publication latency.
- Built Next.js HTTP verification through a disposable Redis REST adapter passed Easy/Medium/Hard publication, idempotent retries, two distinct lobby memberships, same-room replacement, letter write/deletion, receipt persistence, feedback and scheduler authorization. Replenishment used actual worker threads and left usable Hard stock after mixed play. Results: benchmarks/v2.21-http-verification.json. Individual attempts can still time out or fail editorial screening; only accepted packets enter stock.
- In this local verification, the initial ready request plus its duplicate receipt took approximately 133ms Easy, 214ms Medium and 190ms Hard. These are local service observations, not promised phone/network timings.
- The initial cache was rebuilt/revalidated against 168 protected answers: 24 accepted packets, eight per mode, 520 distinct answers. Each packet passed current approval, convention, geometry and active-clue checks.
- Catalog audit: 1,643 answers; 123 new everyday additions, thirty alternate senses, 384 entertainment answers. The 1,519 unchanged prior-release acceptances remain labelled as inherited semantic-review debt. Neither the catalog audit nor the publisher claims independent human test-solving.

Integration testing caught immediate Hard starvation after quality-only selection, so the final selection considers compatible future stock across all modes. It also caught a replenisher declaring completion from a stock snapshot taken before concurrent publications; the worker now refreshes live exclusions/stock before declaring the inventory full. The final built HTTP flow passed after both fixes. A Redis CLI argument-size failure in an early test was fixed by sending large values through stdin; no production request/body limit was weakened.

Current content and receipt formats preserve historical saves. Old clients must refresh to start a new published game. Existing games remain available when Redis, refill or network work fails. See EDITORIAL-BACKEND-V2.21.md for finite-supply, inherited-review and geometry limits. Live deployment checks are reported separately.

Final focused verification after publication/refill boundary review: **46 passed, 0 failed**, including real Redis, shared API rules, clue conventions, editorial gates and published-client retry behavior. Production checks additionally use the authoritative stored receipt when replacing a shared puzzle, so client-supplied publication labels cannot change the stored snapshot.
