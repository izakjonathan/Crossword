# v2.7 validation record

## Automated evidence

- Full source tests: see the final testing entry in `docs/testing.md`.
- Next.js production build: passed.
- Production CSS regression checks: passed, including the generated CSS assets rather than source alone.
- The whole 1,738-answer bank passes its mechanical editorial guards.
- Additional construction invariants exercise 90 seeded grids across all three difficulties, independently of the existing 72-grid invariant test.
- Consecutive protected generation, same-day exclusions, seven-day/twenty-game reuse, storage failures, corrupted saves and a ledger exceeding 500 used answers remain covered.
- Native timer invocation, worker constructor failure, crash, malformed response, timeout termination, stale response identity, clean retry and disposal have regression coverage.
- Clue selection, letter hints, clear-word/undo and persistent assisted status are covered by pure input-transition tests.

## 300 fresh-seed audit

Command: `npm run audit:puzzles` (100 seeds per difficulty, `audit-0` through `audit-99`). Measurements include the generator and structural validation in this container's Node 24 runtime. They exclude worker startup, browser rendering, locks and storage. They are not iPhone timings or a guarantee about every device/seed. Each audited puzzle starts from the full allowed bank rather than a shared no-repeat session; consecutive-session behaviour is tested separately.

| Mode | Valid grids | Distinct grids | Mean clues | Mean black cells | Mean per-answer checking | Mean generation | P95 generation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Easy | 100/100 | 100 | 20.0 | 36.3% | 62.8% | 4.0 ms | 7.1 ms |
| Medium | 100/100 | 100 | 24.0 | 34.7% | 59.2% | 4.0 ms | 6.4 ms |
| Hard | 100/100 | 100 | 32.5 | 35.8% | 59.5% | 5.8 ms | 10.6 ms |

Across every sample, the worst per-answer checking ratio was 50% and the longest consecutive unchecked run was one letter. Every grid was connected, covered, correctly numbered, free of repeated answers and consistent at crossings. Zero sample failures were observed. This supports these measured invariants, not a claim that every English clue has only one possible interpretation.

Raw output, answer-frequency diagnostics and vocabulary diversity are retained in `benchmarks/v2.7.0.json`; rerun the script to reproduce the audit with machine-dependent timings. The most frequent answer is not guaranteed to be uniformly distributed across independent histories; the dated ledger prevents its immediate reuse within an actual local session.

## Before/after comparison

A separate nine-puzzle sample uses the same `review-0` through `review-2` seeds per difficulty on v2.6.1 and v2.7.0. Both the construction algorithm and the bank changed, so this is a release comparison, not an isolated algorithm experiment.

| Mode | Mean answer checking before | After | Mean generation before | After |
| --- | --- | --- | --- | --- |
| Easy | 45.3% | 63.1% | 635 ms | 12 ms |
| Medium | 42.5% | 59.6% | 2,528 ms | 6 ms |
| Hard | 44.2% | 58.9% | 3,210 ms | 7 ms |

The lowest single-answer checking in the baseline sample was 1/7. New samples have no single-crossing answers and no neighbouring unchecked letters. Baseline and new raw comparison records are included alongside the larger audit. Nine seeds are a small sample; timing differences are not a device performance SLA.

## Browser evidence

The production build was exercised through Playwright/Chromium at 390×844 and 844×390, including generation, on-screen typing, Across/Down clue browsing and jumping, letter hints, clear/undo, theme preview/cancel/save/reload, saved puzzle restore, generation of Hard, dark palette, and a horizontal-overflow check. No page errors occurred in the completed flow. Screenshots were inspected internally; they are not part of the source deliverable.

The browser check caught and led to a fix for an illegal native timer receiver in the worker client. A regression test now simulates a browser-style timer receiver restriction. This illustrates why passing pure generator tests alone was insufficient.

A real iPhone's Safari toolbar tint, native keyboard, VoiceOver and pinch handling remain manual checks. The environment did not have a runnable WebKit browser. Chromium mobile emulation cannot certify Safari's browser chrome or physical touch behaviour.

## Remaining editorial and product limits

The new templates deliberately use 3–7-letter answers. Difficulty is based on authored clue variants and board size, not solver-trial calibration. No external dictionary or live web verifier runs when a puzzle is generated. Mechanical checks do not establish the semantic uniqueness of every clue, and the entire retained bank has not been individually re-fact-checked in this release. See the source-backed review in `RESEARCH-V2.7.md`.

No GitHub commit or Vercel deployment was performed for this ZIP deliverable.
