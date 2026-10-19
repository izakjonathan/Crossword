# Shared-session review — 20 October 2026

Baseline: main commit 12208d1287966896a5a4607bddcbec5105abc820 (working global UI Studio and single-puzzle shared rooms).

## Findings and corrections

1. The shared room contained one immutable puzzle; + was disabled for shared players. Rooms now hold successive rounds under one capability link and fixed expiry. Either device can choose a difficulty and create the next puzzle.
2. The Home callback closed over the first puzzle even if a newer room snapshot arrived. It now reads the snapshot's puzzle and resets play state on round changes, while retaining the connection.
3. Queued edits had no puzzle boundary, so replacing a puzzle would let delayed writes target unrelated squares. Every request is now fenced to its round. Old pending queues are backed up in sessionStorage when possible and never replayed into a new grid. Old browser builds need a reload.
4. Cursor, clue-list direction, dialogs and check highlights were personal. The room now shares active square/clue, gameplay dialogs, clue direction, checks/notices and normalised zoom/pan. Each device still adapts its layout to its own screen dimensions. Private invite controls and in-progress UI Studio previews remain local; saved colours are global as before.
5. Filled crossings were skipped during ordinary typing. Input now replaces the selected square and advances exactly one square, including filled crossings. Clue navigation begins at the first square. It stays at the last square of a word until the player navigates away. Backspace, hints and undo remain functional.

## Concurrency and recovery

One 45-second server generation lease permits a new puzzle to be built at a time. New puzzles are independently validated and cannot reuse answers from earlier rounds in that shared session. The worker also combines session exclusions with the actor's dated local ledger. Both devices see generation state; successful replacement clears answers/checks/undo and changes the round identifier. The original seven-day room expiry stays unchanged.

Atomic Lua checks the round and lease when committing the replacement. Duplicate request IDs remain idempotent across round transitions. Losing generation requests cannot replace the winner, and a failed generation cancels only its own lease. A crashed tab's lease expires. Observers reserve newly received answers in their own dated ledger under the existing browser lock.

Board gesture changes publish at most four intermediate positions per second, plus final gesture/zoom positions. Positions are normalised and constrained to each device's viewport. Polling runs at 750 ms plus network latency. This is synchronised application state, not a pixel/video screen stream.

## Validation

- 97/97 source tests with disposable Redis enabled, including real Lua execution.
- Production Next build passed; 3/3 production CSS checks passed.
- 300/300 independently audited puzzles passed, across Easy/Medium/Hard.
- Two independent client simulations cover new-game creation from either device, multiple rounds, refresh into the current round, lost replacement responses, old offline edits, shared selection/dialogs/checks/board view, failed generation and simultaneous generation attempts.
- Actual Redis tests cover leases, replacement, repeat rejection, stale-round rejection, idempotent replacement retries, preserved expiry and continued edits in the same room.

No dependency, environment-variable or existing saved-game schema change is required. Live deployment smoke testing uses a new disposable room, not an existing user's session. Physical iPhone interactions and pixel-level view matching across differing screen sizes are not certified; browser downloads were unavailable in this environment. The existing generated puzzle bank, difficulty profiles and fairness rules remain unchanged.
