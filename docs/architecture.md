# Architecture

Next.js App Router renders a static app shell. `app/page.jsx` composes the interactive solve; `components` contains the board, keyboard, dialogs, clue list and UI Studio. `app/layout.jsx` bootstraps the saved browser palette before first paint.

`lib/grid-layout.mjs` builds and checks candidate layouts. `lib/grid-fill.mjs` performs bounded constraint search. `lib/engine.mjs` constructs the public puzzle object; `lib/validate.mjs` independently checks its geometry and versioned fairness rules. The published vocabulary is assembled and validated in `lib/words.mjs` from authored source modules.

The engine runs in `lib/puzzle.worker.mjs`. `GenerationClient` owns worker lifecycle, request identity and timeout recovery. `fresh-puzzle.mjs` obtains allowed candidate pools; `repetition.mjs` locks and commits the dated local word ledger. A rejected/timed-out generation does not replace the current game.

`input.mjs` contains pure solve transitions and bounded undo snapshots. `storage.mjs` validates persisted puzzle/play state. Puzzle progress, word history and theme are local to this browser and origin. There are no API routes, external puzzle services, accounts, database, AI credentials or analytics in the solve path.
