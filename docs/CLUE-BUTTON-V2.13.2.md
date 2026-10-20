# Dedicated All clues button · v2.13.2

Baseline: v2.13.1, commit 88e2526b458e646f9af89a4ea61fdf60650af8c0.

The active clue's full text area used to open All clues. That area is now plain, non-focusable text, retaining its live announcement and two-line scrolling. A separate 44×40-pixel All clues button sits beside it, with an explicit accessible label and dialog semantics. Previous/next controls and the existing clue list access in Puzzle controls remain available.

The clue bar's 76-pixel portrait / 66-pixel short-landscape height, keyboard, two-colour palette, saved progress and shared-dialog synchronization are unchanged. The compact trigger reduces accidental openings without relying on a timing delay or changing sharing behavior. No engine, Redis, input or repeat-history code changed.

Validation: 125 tests passed with disposable real Redis, production build passed, and three built-CSS checks passed. No generator changes were made, so a new generation audit was not required. Live browser verification follows deployment: click the clue text without opening a dialog, open with the dedicated button, and close normally.
