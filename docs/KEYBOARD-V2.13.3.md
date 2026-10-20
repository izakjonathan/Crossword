# Clue simplification and home-screen keyboard spacing · v2.13.3

Baseline: v2.13.2, commit 0729f3f2852e7198521633c768a78a542517a997.

Removed the active clue number/direction and filled-count row, its unused computations and CSS. Clue text, enumeration, two-line scrolling, navigation and the small All clues button remain. In standalone display mode, keyboard bottom padding is 12px plus the device safe-area inset; regular browser spacing is unchanged. Padding belongs to the keyboard so the gap uses its existing colour. The flex layout reserves the space by reducing the board viewport. No game, storage or shared-session logic changed.

Validation: 125 tests passed with disposable real Redis (zero skipped); production build and all three built-CSS layout checks passed. The required 300-puzzle audit completed with no failures. Physical iPhone home-screen behavior requires device confirmation; desktop browser verification cannot reproduce its system inset.
