# Crossword puzzle · v2.6

A minimal Next.js crossword app for phones, redesigned from the supplied Baros operation theme.

## Run

Node 24, then `npm ci` and `npm run dev`. Production: `npm run build` and `npm start`. Validation: `npm test`.

## The screen

A borderless, title-free header with seven evenly spaced controls and a plain + in the content colour. The + dialog starts a new Easy, Medium or Hard puzzle immediately when an option is tapped. The board occupies the remaining screen above a dock with the clue and QWERTY keys. The Baros two-colour theme is retained.

- Grid counts: Easy 9×9, Medium 11×11, Hard 13×13. Cells grow vertically into spare space, up to 20% taller than wide; short layouts retain square cells. Existing portrait puzzles and progress remain playable; tap + for the new square format.
- Board-only pinch zoom (1–3×), drag to pan, and − / Fit / + controls. The entire grid fits initially; zoom does not move the header, clue or keyboard. Zoom is anchored beneath the fingers, panning is bounded, and the active cell is brought into view when typing. Rotation resets gesture state and preserves zoom level.
- A game-owned three-row QWERTY keyboard with backspace, as shown in the latest Mirror reference. This replaces the earlier native-keyboard requirement. No hidden text input opens the iOS keyboard during solving. UI Studio colour text fields still use the native keyboard.
- Current clue directly above the keys, with previous/next arrows. Tap the selected crossing to switch Across/Down. Active word shading and selected-cell shading derive from the chosen two colours.
- Hardware letters, arrows, Backspace and Cmd/Ctrl+Z. Enter on the board advances clues; Space switches direction. Tab remains available to leave the board and navigate controls.
- Normal typing skips filled crossing letters. Explicitly tapping a filled square overwrites that letter and activates the immediate next square; subsequent normal typing resumes skipping filled squares.
- Undo, check and confirmed word reveal. Reveals permanently mark the solve assisted even when undone. Current progress and the answer repeat window persist in this browser.

## Generation and clue quality

The original literal clue bank contains 1,528 unique answers. No AI credentials, external puzzle API, licensed publisher grids or invented cryptic clue generation are used. Definitions and grammatical answer forms are stored together. Automated bank checks catch missing clues, duplicate answers, invalid answer forms and answer leakage, common inflections and known giveaway compounds; they do not replace editorial judgment.

Each request has a fresh seed and uses a persistent dated ledger of every answer seen by this browser on this site origin. There is no 500-answer rollover in the current generation path. All difficulties share the same history.

- Same-day answers are excluded without exception. The day uses Europe/Copenhagen, including daylight-saving transitions.
- Reuse requires at least **7 elapsed days and 20 intervening generated puzzles**. Never-used answers are tried first. Next preference is the oldest answers rested for **30 days and 40 puzzles**; smaller oldest-first batches are widened only when needed for a valid grid. The 30/40 target is a preference, not an additional hard minimum.
- If eligible answers cannot form a valid grid, generation stops and preserves the current puzzle. It does not relax same-day or minimum-cooldown rules.
- Generation holds an exclusive Web Lock while reading history, generating and committing it. This serialises requests from tabs on the same origin. The ledger must persist before a new puzzle is shown; a storage error rejects the new puzzle.
- Old undated 500-answer history and any unknown restored puzzle answers are conservatively treated as used today. Older records that previous versions had already discarded cannot be reconstructed.
- History survives reloads. It is local to a browser profile/site origin, not shared between devices, aliases, private sessions or browsers. Clearing site storage clears that history. Updated clients, HTTPS and Web Locks support are required for coordinated generation.

The bank remains finite at 1,528 unique answers, with fewer available for short-word modes. No finite bank can supply unlimited unique daily puzzles or guarantee a fixed number of new grids under these constraints.

Generation runs in a dedicated Web Worker. It normally tries up to 120 arrangements, with up to 200 when needed, scores covered area and penalises solid black patches, and validates all runs, intersections, numbering, coverage, connectivity and unique answers before returning a result. These are freeform blocked crosswords; full American-style checking and rotational symmetry are not claimed. Request IDs prevent stale worker replies from replacing a newer request. A 20-second client deadline prevents indefinite loading.

## Local UI Studio

The two colours default to Baros canvas `#fff4c4` and ink `#000000`. UI Studio previews both and saves to this browser's localStorage when **Save** is pressed. Changes persist after reload and synchronise between tabs on this device, without a server, account, database, environment variable or network request. Other devices keep their own palette. Cancel restores the saved colours. Invalid colours and low contrast are rejected; unavailable browser storage produces an explicit save error.

The unused shared-theme API and Blob dependency have been removed.

## Compact mobile layout (v2.2)

The current header is 48px tall, with evenly sized 44px-high controls and no title. Reveal, zoom − / Fit / +, UI Studio and new puzzle are in the header; Undo and Check letters are in its ··· menu. There is no toolbar or extra padding below the keyboard. The clue strip contains only the clue and previous/next arrows. It now reserves two lines of text so clue changes do not resize the board. Selection uses stronger shading with no inset border or direction triangle. Across/Down still toggles by tapping the selected crossing.

## Validation and limits

`npm test` covers randomized square grids, sequential generations and more than 500 dated answer reservations, input skipping and overwrites, direction changes, deletion, undo, multi-character entry, assisted reveals, theme contrast, local theme persistence, storage failures and CSS layout regression checks. Gesture tests cover anchoring, bounds, fit reset, selected-cell visibility, tap/drag separation, pointer cancellation, and pinch-to-pan transitions. `npm run build` verifies production compilation, worker bundling .

Physical iPhone touch behaviour and comparative performance against other crossword apps have not been tested in this environment. There is no claim of outperforming publishers or of human-edited newspaper construction quality. See [research and implementation rationale](docs/RESEARCH.md) for primary sources and tradeoffs.

## Deployment

Existing Vercel project: `daily-cross` (`prj_WGNWhHvLtU77WANBFmbHWPD8sxEO`). Node 24.x, `npm ci`, `npm run build`, default Next.js output directory. Preserve the current deployment protection settings.

Independent of The Guardian. No Guardian clues, assets, branding or grids are included.

## v2.1.1 layout repair

Restores the header, board and keyboard rules accidentally removed in v2.1.0. A PostCSS regression check rejects that released broken stylesheet, checks the restored layout, and can validate built assets with `LAYOUT_BUILD=1 node --test tests/layout.test.mjs` after a production build. No gameplay or saved progress changes.

## v2.2.1 browser canvas and clue stability

The local palette is restored in the head before hydration, and applied explicitly to html/body backgrounds, CSS variables, theme-color and colour-scheme metadata. This covers the browser-exposed page canvas; Safari retains control of its native translucent toolbar material. Portrait clues reserve 62px (two 22px lines), with a stable 52px two-line landscape variant. Longer clues scroll inside the field. The broader square-board layout proposal and research are in [docs/LAYOUT-PLAN.md](docs/LAYOUT-PLAN.md); that redesign is not yet applied.

## v2.3 geometry and repetition validation

The grid uses separate cell width/height in rendering, hit testing and selected-cell auto-pan. Pinch zoom keeps both dimensions in proportion. Tests cover tall-cell taps after zoom, all-day histories beyond 500 answers, all difficulties, Copenhagen day boundaries, history migration/reload, cooldown tiers, exhaustion, concurrent reservations and failed final writes. See [repetition policy](docs/REPETITION.md).

## v2.4 denser construction

New grids accept at most 42% black cells and at most three solid 2×2 black patches. Longer-answer candidate ordering, extra fill passes and area-based scoring reduce sparse boards. Ordinary adjacent black cells remain allowed. New grids are validated against these limits; old saved grids retain progress and use the earlier restore rules. See [research and measurements](docs/GRID-CONSTRUCTION.md).

## v2.5 content editing

Revised 143 existing entries and added 286 familiar answers with original direct/less-direct clue pairs. There are now 505 answers with distinct Easy and Hard clues (previously 89). Remaining entries retain one direct definition at both levels; difficulty is not presented as a calibrated human editorial rating. The bank now extends through Z instead of the large expansion stopping at L. Silent duplicate-answer overrides have been removed. Runtime bank validation runs in the worker as well as in tests. Existing saved puzzles retain their original clues and progress; generate a new puzzle for the edited bank. See [editorial review](docs/CLUE-QUALITY.md).

## v2.6 second editorial pass

Revised another 400 existing answer entries, without adding more fill or changing the grid algorithm. There are now 904 of 1,528 answers with distinct direct/less-direct clues. The review covers the A–C portion of the expansion and a broad selection of objects, plants, food, animals and everyday words from the other bank. Alternative senses use natural English; harder clues are not automatically certified harder for every solver.

Runtime validation now also rejects the same normalized clue attached to different answers of equal length. Typography, repeated spaces and a terminal full stop cannot bypass this check. Answer-leak detection handles dropped final E, consonant doubling and Y-to-IES changes. It still avoids rejecting coincidental substrings. Tests exercise the checks with real editorial failure examples.

A six-puzzle fixed-seed sample (two per difficulty) contained 60 answers with distinct direct/less-direct clue pairs after editing, versus 33 before, out of 105 entries. This is a small content-coverage check, not a broad benchmark or a rating of solver difficulty. No layout, progress, reuse-window or history changes were made.
