# Architecture

Next.js App Router renders a static app shell. `app/page.jsx` composes the interactive solve; `components` contains the board, keyboard, dialogs, clue list and UI Studio. `app/layout.jsx` bootstraps the saved browser palette before first paint.

`lib/grid-layout.mjs` builds and checks candidate layouts. `lib/grid-fill.mjs` performs bounded constraint search. `lib/engine.mjs` constructs the public puzzle object; `lib/validate.mjs` independently checks its geometry and versioned fairness rules. The published vocabulary is assembled and validated in `lib/words.mjs` from authored source modules.

The engine runs in `lib/puzzle.worker.mjs`. `GenerationClient` owns worker lifecycle, request identity and timeout recovery. `fresh-puzzle.mjs` obtains allowed candidate pools; `repetition.mjs` locks and commits the dated local word ledger. A rejected/timed-out generation does not replace the current game.

`input.mjs` contains pure solve transitions and bounded undo snapshots. `storage.mjs` validates persisted puzzle/play state. Solo puzzle progress and word history remain local to this browser and origin; the palette is now shared through Redis, with a local last-known cache. Solo play has no server dependency. Shared play adds an optional Redis-backed API; there are no accounts, external puzzle-generation services, AI credentials or analytics.

`difficulty.mjs` defines versioned mode profiles and validates actual published ratings. `vocabulary-ratings.mjs`, `clue-ratings.mjs` and `long-words.mjs` hold explicit editorial data. The filler prunes impossible vocabulary/clue mixtures using cached domain bounds; final clue allocation uses only available reviewed variants. `difficultyVersion:1` applies to new puzzles while version-3 saves without that tag keep their original rules. See `DIFFICULTY.md`.

`clue-selection.mjs` allocates variants using a bounded subset search; `grid-fill.mjs` backtracks when this allocation is impossible. `crossing-safety.mjs` reconstructs the published crossing graph and validates `fairnessVersion:1`, independently of the filler. The new version tag leaves older saves valid.

The filler retains per-call WeakMap domain caches for letter groups, answer membership and rating bounds. Unchanged domains reuse their arrays; affected-slot relationships are fixed per layout. Caches are never shared across candidate pools or games. Search order, randomness and node budgets are unchanged from v2.8.1; see `PERFORMANCE-V2.8.2.md`.

`long-clues.mjs` appends explicitly reviewed, source-referenced variants to existing words. Bank assembly rejects unknown answers and duplicate tiers/text. The worker retains source metadata in the bank but publishes only clue text and rating in the puzzle object; it makes no source-site requests. Older saves retain their stored wording.

`shared-model.mjs` validates rooms and defines changed-cell operations. `shared-client.mjs` handles polling, optimistic edits, pending queues, guarded undo and revision ordering. `shared-store.mjs` provides server-only Redis access with atomic Lua updates. `app/api/shared/route.js` enforces request bounds, same-origin writes and capability authentication. Room tokens use the URL fragment; credentials stay server-side. See SHARED-GAMES.md.

Global UI Studio uses `global-theme-client.mjs`, `global-theme-store.mjs` and `/api/theme`. A permanent, atomically versioned palette is shared by every device on the configured database. Preview remains local; Save is public and global. See GLOBAL-THEME.md.
