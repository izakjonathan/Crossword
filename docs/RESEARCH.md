# Mobile crossword research and design decisions

## Evidence and what follows from it

Apple's iPhone crossword guide explicitly supports skipping filled squares, advancing between clues, toggling Across/Down by tapping the selected square, and marking assisted solves. These are established interaction patterns. This app uses skip-filled typing by default, preserves an explicit tap as an overwrite, and keeps clue navigation next to the clue.

Source: [Apple iPhone crossword guide](https://support.apple.com/en-ca/guide/iphone/iph9c11382ff/ios).

## Latest Mirror reference: layout and gestures (19 October 2026)

The supplied Mirror screenshots show a square blocked grid, one highlighted word, a selected-cell outline and direction marker (replaced by shading only in the latest requested design), and a clue strip with previous/next buttons immediately above a game-owned three-row keyboard. Safari browser chrome sits below that keyboard. This is evidence of an app-rendered keyboard rather than a native iOS input accessory. The latest instruction to match this reference supersedes the earlier native-keyboard design.

The live reference URL was attempted with both web retrieval and the research browser but returned an unavailable page. Consequently exact Mirror zoom thresholds, auto-zoom triggers, animation timings, double-tap handling, and keyboard repeat behaviour were **not observed**. We do not claim an exact reproduction of those unseen mechanics. No Mirror code, clues, assets or puzzle data are copied.

Reference supplied by the user: https://games.mirror.co.uk/games/mirror_CrossUSVariants_4/?locale=enUK&path=%2F

Arkadium's own crossword documentation explicitly describes mobile pinch-to-zoom on the grid. This supports board zoom as an established crossword interaction, but does not establish Mirror's particular implementation. The app uses 1–3× board-only pinch zoom and one-finger panning, with explicit − / Fit / + alternatives. Selected cells are brought into view during typing; manual zoom does not scale the clue or keyboard. There is no unverified automatic zoom-on-tap rule.

Source: [Arkadium crossword support](https://support.arkadium.com/en/support/solutions/articles/44001739824--crossword-tips-settings-scoring-useful-shortcuts).

MDN's multi-pointer guide caches independent pointer IDs and removes cancelled pointers. Its touch-action documentation explains how browser gesture handling can cancel application pointers. Here, `touch-action:none` is restricted to the board surface and descendants, with pointer capture and explicit pointer-cancel/lost-capture cleanup. Browser zoom is not globally disabled. The transform anchors the board coordinate under the pinch midpoint, clamps panning to content edges, rebases when one finger is released, and prevents pinch/drag completion from becoming a cell tap. A game-owned keyboard avoids iOS text selection, autocorrect and automatic input scrolling during solving. VisualViewport sizing is retained for Safari toolbar changes and native input in UI Studio.

Sources: [MDN pinch zoom gestures](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures), [MDN touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action), [MDN VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport).

New puzzles are square (9×9, 11×11, 13×13), matching the reference's square board format rather than the previous portrait experiment. Difficulty still varies word length and clue definition. This is a product/layout decision based on the user's latest reference, not a claim that square grids universally outperform rectangles. Older saved puzzles keep their real dimensions and progress. The board fits into available space without distorting cells. Zoom controls provide an alternative when the initial cells are small, especially in landscape or with large text.

W3C target-size guidance distinguishes dense layouts from ordinary controls. Main navigation targets remain 44px; letter keys and toolbar controls are compact, with spacing. Pinch and explicit zoom let players enlarge grid cells. This is not a claim of a completed WCAG audit.

Source: [W3C Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

## Construction and clues

Patrick Merrell's construction guidance stresses matching the answer's part of speech, tense and number, signalling abbreviations and examples, not repeating an answer within its own grid, and ensuring clues are factually correct. Difficulty should not come from incoherent prose. This app uses a curated bank of direct definitions, more technical but literal hard clues, and no automatic invented cryptic wordplay. The automated checks can catch structure, duplication, answer leakage, and missing clues; they cannot certify every editorial judgment. Clue-specificity still benefits from human review.

Source: [Patrick Merrell, 24 Tips for Writing Crossword Clues](https://amuselabs.com/resources/guides/writing-crossword-clues/).

The new generator validates all horizontal and vertical runs, crossing consistency, connectivity, entry lengths and unique answers. These are freeform blocked crosswords. It does not claim American newspaper construction rules such as every letter being checked or rotational symmetry.

Fresh puzzles use independent seeds. The v2.3 dated ledger excludes same-day answers across all difficulties, requires seven days and twenty intervening puzzles before reuse, and prioritises unused and oldest eligible answers. See REPETITION.md for the current policy. This addresses repeat generation on the same day; the earlier date-only seed recreated the same puzzle. A finite bank eventually repeats, and clearing browser storage clears that device's history. Repeat history is not a cloud account feature.

## Responsiveness and validation

Puzzle generation runs in a dedicated worker, so generation does not run on the same thread as typing, colour previews, or opening controls. Worker requests have IDs, stale responses are ignored, unsuccessful arrangements retry with a fresh seed, errors are surfaced, and a time limit prevents an indefinite busy state. No external generation or AI service is required.

Source: [MDN Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers).

Automated validation covers input navigation, direct overwrite, skipping, backspace, multi-character input, randomized puzzle invariants, repeat-history windows and theme validation. Production builds are checked. Physical iPhone touch behaviour and comparative performance against other publishers have not been verified; no superiority claim is made.

## Baros reference

The supplied rc.130 source defines Work Sans, a cream `#fff4c4` canvas and black `#000000` ink for the operation theme, rounded cards, pill controls and a 1.5px border. The redesign uses those foundations with exactly two configurable colours; selection and feedback derive from the same pair.

## Local settings

The latest instruction explicitly replaces global palette persistence with browser-local settings. Colours are validated and saved under a versioned localStorage key, restored on load, and synchronised between same-origin tabs through the storage event. Cancel discards previews. Blocked storage surfaces an error rather than claiming persistence. The app no longer polls or writes a theme API, and the obsolete shared storage route and dependency have been removed. No database or additional setup is required.
