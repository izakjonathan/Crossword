# v2.9.0 validation

Baseline: delivered v2.8.2 source ZIP. Node 24.19; evidence recorded 19 October 2026.

## Automated checks

- `npm test`: 72/72 tests passed. New coverage checks the 83 variants, bank integration, optional source URL validation and actual mode-appropriate use across 54 generated puzzles. Existing difficulty, crossing, worker recovery, persistence and repetition checks remain passing.
- `npm run build`: production compilation and prerendering passed.
- `LAYOUT_BUILD=1 node --test tests/layout.test.mjs`: 3/3 production CSS checks passed.
- `npm run audit:puzzles`: 300/300 valid puzzles, 100 fixed seeds per mode. Zero specialist-to-specialist crossing pairs and zero tier-3 clues without gentler crossing support. All field-count, vocabulary, clue-band and checking requirements passed independently.
- The bank still has 1,906 answers. The new set adds 59 tier-2 and 24 tier-3 variants across 74 existing answers of eight or more letters. Existing direct clues and vocabulary ratings are preserved.

The nine active seeded-output hashes were deliberately regenerated for the editorial revision, after review of the changed bank. The historical v2.8.1 fixture remains available. No change was made to the cached filler, allocation algorithm or save schema. The previous exact-output performance comparison is historical and is not a valid equality test across different editorial banks.

## Measured clue use

Using audit-0 through audit-99 in each mode, Medium puzzles with a harder clue on an 8+ answer increased from 25/100 to 76/100. Hard increased from 0/100 to 90/100, including 32/100 with a tier-3 clue on an 8+ answer. Every sampled puzzle had one 8+ answer. Easy used no harder variants. These observations measure selection, not human solve difficulty or guaranteed coverage for every seed.

See [full audit](benchmarks/v2.9.0-audit.json), [baseline comparison](benchmarks/v2.9.0-long-clue-comparison.json) and [editorial source review](LONG-CLUES-V2.9.md). The baseline comparison used the unmodified delivered v2.8.2 bank. Timings in the audit are not a controlled performance comparison.

## Browser flow

Production Chromium at mobile 390×844 and landscape 844×390 passed: restoration of a genuine v2.8.2 puzzle and entered letter; typing; clue browsing and selection; hints; clear/undo; UI Studio preview/cancel/save/reload; palette/progress persistence; and no horizontal overflow. All three difficulties generated through the real worker, validated, committed to shared history and rendered without repeated answers across the tested sequence. Modal focus containment and inert background, dark colours and synthetic first-load ledger-error recovery passed, with no uncaught page errors.

A generated Hard puzzle containing the new tier-3 POPULATION clue was also restored with that entry selected, rendered without horizontal overflow and selected again from its direction in All clues. These browser checks used the production build. A local browser-test locator initially required correction to include the clue's enumeration; no app change was needed.

No dependencies, environment variables, network calls during play or external services were introduced. The project has no configured lint or standalone typecheck script; neither is claimed as run.

## Limits

References verify the relevant meanings of these 83 authored variants. They do not certify editorial difficulty, uniqueness for every solver or the entire historic bank. Wider human test-solving remains necessary. Real iPhone Safari chrome tint, native keyboards, physical gestures and VoiceOver remain unverified. Source references are build-time editorial metadata; the app does not fetch them during generation. Existing saved games retain their original clue text; generate a new puzzle to use the expanded bank.
