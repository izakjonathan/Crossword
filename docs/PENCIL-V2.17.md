# Experimental Pencil mode · v2.17.0

Baseline: 33c287f7784cc8ac2980382fb21385d02a487b69 (latest confirmed v2.16.0 documentation commit).

The original keyboard interface is the default. Device preferences add a validated inputMode with keyboard/pencil values. Switching never replaces the puzzle or session. Shared players may choose different input modes.

Pencil mode displays native text inputs over individual white squares, positioned inside the existing transformed board. iPadOS Scribble performs recognition and native field hit testing. This is a first experimental version, not a canvas-wide stroke classifier or a single giant editable field. Web content has no UIKit UIIndirectScribbleInteraction API for custom spatial recognition. Whole-word handwriting across multiple cells is not supported. No external handwriting service receives ink.

Pen events on editable tiles bypass the application's pan/pointer-capture logic. Finger/mouse board gestures and zoom controls retain their existing route. Native inputMode=none requests suppression of the system keyboard; the app's keyboard is not rendered in Pencil mode. iPadOS may still display its own Scribble toolbar. Actual Scribble compatibility with inputMode=none, transformed fields, palm rejection, scratch-out gestures and installed home-screen operation must be confirmed on physical hardware; desktop typing tests cannot establish handwriting recognition.

Composition text stays local until committed. Only one ASCII A–Z letter or an empty string is accepted; multi-character results are rejected without filling neighbours. Writes carry the square index, so a remote selection change cannot redirect a delayed result. Local undo snapshots, completion statistics and shared edits use the existing action pipeline. Clear square always clears the selected cell and never backs into a neighbour. Same-value operations do not add undo snapshots.

New domain tests cover coordinate-independent target indexes, overwrite/clear/undo, blocked/invalid targets, rejection of multi-letter results, and device preference defaults/persistence. Production build and built CSS validation apply. No generator or database rules changed. No lint/typecheck scripts are configured.

Sources: https://developer.apple.com/design/human-interface-guidelines/apple-pencil-and-scribble ; https://developer.apple.com/documentation/uikit/handwriting-recognition .

Release validation: production build passed; three built-CSS layout tests passed; 300/300 generator audit puzzles passed. Full npm test run: 131 passed, one preferences object expectation failed because it omitted the new default inputMode, seven Redis integration cases skipped (no disposable Redis configured). Updated that expected object and reran the affected preference test: passed. Thus all 132 executed test cases passed across the initial run and focused correction. Three new Pencil model tests also passed independently. Physical iPad/Pencil recognition remains unverified.
