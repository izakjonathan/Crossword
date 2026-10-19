# Architecture

Next.js App Router renders a static app shell. `app/page.jsx` composes the interactive solve; `components` contains the board, keyboard, dialogs, clue list and UI Studio. `app/layout.jsx` bootstraps the saved browser palette before first paint.

`lib/grid-layout.mjs` builds and checks candidate layouts. `lib/grid-fill.mjs` performs bounded constraint search. `lib/engine.mjs` constructs the public puzzle object; `lib/validate.mjs` independently checks its geometry and versioned fairness rules. The published vocabulary is assembled and validated in `lib/words.mjs` from authored source modules.

The engine runs in `lib/puzzle.worker.mjs`. `GenerationClient` owns worker lifecycle, request identity and timeout recovery. `fresh-puzzle.mjs` obtains allowed candidate pools; `repetition.mjs` locks and commits the dated local word ledger. A rejected/timed-out generation does not replace the current game.

`input.mjs` contains pure solve transitions and bounded undo snapshots. `storage.mjs` validates persisted puzzle/play state. Puzzle progress, word history and theme are local to this browser and origin. There are no API routes, external puzzle services, accounts, database, AI credentials or analytics in the solve path.

`difficulty.mjs` defines versioned mode profiles and validates actual published ratings. `vocabulary-ratings.mjs`, `clue-ratings.mjs` and `long-words.mjs` hold explicit editorial data. The filler prunes impossible vocabulary/clue mixtures using cached domain bounds; final clue allocation uses only available reviewed variants. `difficultyVersion:1` applies to new puzzles while version-3 saves without that tag keep their original rules. See `DIFFICULTY.md`.

`clue-selection.mjs` allocates variants using a bounded subset search; `grid-fill.mjs` backtracks when this allocation is impossible. `crossing-safety.mjs` reconstructs the published crossing graph and validates `fairnessVersion:1`, independently of the filler. The new version tag leaves older saves valid.

The filler retains per-call WeakMap domain caches for letter groups, answer membership and rating bounds. Unchanged domains reuse their arrays; affected-slot relationships are fixed per layout. Caches are never shared across candidate pools or games. Search order, randomness and node budgets are unchanged from v2.8.1; see `PERFORMANCE-V2.8.2.md`.
