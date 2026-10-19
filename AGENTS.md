# Development rules

Start from the latest confirmed working version. Inspect before editing; keep focused changes and preserve the two-colour UI, mobile layout, stored progress and dated word ledger.

All new puzzle construction must satisfy `validatePuzzle`, including versioned checking rules. Never relax repeat protection, silently add invented fill or bypass bank validation. Describe authored difficulty tiers accurately. New factual clues need authoritative references when specialist or uncertain.

Keep `app` for route/UI composition, with generation and input logic in the existing `lib` modules. Do not move the whole application merely to change folder conventions. New components belong in `components`; engine/editorial tests stay next to related tests in `tests`.

Run `npm test`, `npm run build`, `LAYOUT_BUILD=1 node --test tests/layout.test.mjs`, and `npm run audit:puzzles` after engine/layout changes. No lint or standalone typecheck scripts are currently configured. Review `docs/RESEARCH-V2.7.md`, update testing evidence and report actual limitations. Exclude dependencies, build output and credentials from deliverables.
