# Development rules

Start from the latest confirmed working version. Inspect before editing; keep focused changes and preserve the two-colour UI, mobile layout, stored progress and dated word ledger.

All new puzzle construction must satisfy `validatePuzzle`, including versioned checking rules. Repeat protection uses the approved last-five-puzzle window; prefer unused words, then oldest eligible answers. Never silently repeat a protected answer, add invented fill or bypass bank validation. Describe authored difficulty tiers accurately. New factual clues need authoritative references when specialist or uncertain.

Keep `app` for route/UI composition, with generation and input logic in the existing `lib` modules. Do not move the whole application merely to change folder conventions. Reusable components belong in `components`; new domain logic and UI are colocated in `features/library`, `features/solve` and `features/players`. Engine/editorial tests stay next to related tests in `tests`.

Run `npm test`, `npm run build`, `LAYOUT_BUILD=1 node --test tests/layout.test.mjs`, and `npm run audit:puzzles` after engine/layout changes. No lint or standalone typecheck scripts are currently configured. Review `docs/RESEARCH-V2.7.md` and `docs/DIFFICULTY.md` / `docs/CROSSING-FAIRNESS.md`, update testing evidence and report actual limitations. Exclude dependencies, build output and credentials from deliverables.

For search-cost changes, preserve seeded output and benchmark against the previous source using `scripts/benchmark-generation.mjs`. Keep domain caches local to each fill and never reuse a cached pool across history exclusions. Record relative timings and limitations in `docs/PERFORMANCE-V2.8.2.md` / the next versioned report.

Raw WordNet additions are quarantined from new puzzles except individually rewritten clues. Hard profile v2 keeps clue quotas but drops mandatory specialist vocabulary. Preserve v1 save validation. Prepared Hard supply must pass active-clue, geometry, difficulty and last-five-answer checks.
