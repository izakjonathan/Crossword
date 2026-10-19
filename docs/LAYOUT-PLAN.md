# Square-board mobile layout: research and proposed design

Superseded in part by v2.3: the latest instruction removes the title, evenly spaces the controls and permits cells up to 20% taller than wide. The square-cell and title recommendations below are retained as prior research, not the current specification.

19 October 2026. The Safari colour and fixed two-line clue fixes are implemented in v2.2.1. The broader layout below is a proposal, not a claim that it has been implemented or tested with people.

## Main finding

The board has two constraints: equal width and height, and the space left after the controls and keyboard. On a tall phone, width can be the limiting factor. Once a square reaches that width, reducing surrounding controls only adds blank vertical space. On a short screen or in landscape, height can be the limiting factor instead. A single fixed-height header for every situation cannot optimise both cases.

The goal is a stable square puzzle with comfortably sized controls and a readable clue, with spare height assigned deliberately. Available space should improve solving rather than introduce additional information competing with the board.

## Evidence

### Browser colour

WebKit's safe-area guidance states that the page background fills the inset areas and recommends viewport-fit=cover with appropriate safe-area padding. A WebKit engineer's Safari 26 explanation says viewport-constrained elements near obscured browser edges can trigger solid colour extension. This makes the actual canvas and edge backgrounds relevant, rather than relying solely on a theme-color hint.

The existing app already updated its theme-color meta tag and CSS variables. That was insufficient evidence that Safari would colour both surrounding regions correctly on this phone. v2.2.1 explicitly paints html and body, synchronises theme metadata and light/dark colour-scheme, and restores the saved local palette in the head before the app hydrates. UI Studio preview, save, cancel and cross-tab updates use the same canvas-colour function. Safari controls its toolbar materials and may alter their appearance; exact RGB matching of native browser controls is not promised.

Sources:
- https://webkit.org/blog/7929/designing-websites-for-iphone-x/
- https://bugs.webkit.org/show_bug.cgi?id=301756 (engineer response, comment 2; distinguish it from the reporter's assumptions)
- https://bugs.webkit.org/show_bug.cgi?id=302272 (historical overlay-tint bug; marked fixed upstream, not evidence that this device has that bug)

### Touch accuracy and grouping

NN/g explains that small, crowded targets increase selection difficulty and accidental taps. Spacing cannot fully compensate for undersized targets. W3C's enhanced target-size criterion uses 44×44 CSS pixels, with stated exceptions. A 44px target is an appropriate design goal for ordinary controls here; it is not a claim that this app has completed an accessibility audit.

The current 28px header controls are a consequence of forcing every action into one small row. Extra vertical room is better spent making those actions easier to hit. NN/g's hierarchy and proximity guidance supports separating global actions from solving actions while keeping related controls together. These principles inform the proposal; the exact dimensions below are our design choices, not measurements proven optimal by the sources.

Sources:
- https://www.nngroup.com/articles/touch-target-size/
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html
- https://www.nngroup.com/articles/visual-hierarchy-ux-definition/
- https://www.nngroup.com/articles/gestalt-proximity/

## Space budget

Use the measured visual viewport and actual safe-area insets, not a named iPhone model or the full physical screen height. Exclude the browser-owned controls. For planning:

- H: usable application height after safe-area padding.
- W: usable application width after side insets.
- S: square board side, initially up to W−4px, capped appropriately on larger screens.
- Header: 56px baseline, or 100px when a second control row fits.
- Clue: 62px fixed, containing two 22px text lines and 18px of combined padding/borders.
- Keyboard: measured rendered height; approximately 169px at the current maximum key size.
- Gaps: a controlled budget, initially 16px total.

S = min(W−4, H−header−clue−keyboard−gaps).

These examples are illustrative application viewports, not asserted dimensions of a particular Safari configuration:

| Usable viewport | Header | Clue | Keyboard | Gaps | Square side | Remaining height |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 390×700 | 56 | 62 | 169 | 16 | 386 | 11 |
| 390×780 | 100 | 62 | 169 | 16 | 386 | 47 |
| 390×600 | 56 | 62 | 169 | 16 | 297 | 0 |

The 780px case has room for better controls and breathing space while retaining the maximum-width board. The 600px case cannot retain that same full-width board alongside all the controls, so its fit view must be smaller; pinch zoom remains available.

## Options considered

| Option | Effect | Assessment |
| --- | --- | --- |
| Keep the compressed header and distribute all surplus around the board | Preserves the largest square but leaves tiny targets and weak hierarchy | Acceptable fallback for short viewports, poor tall-phone default |
| Adaptive header plus stable clue dock | Uses spare height for readable typography, larger controls and grouping | Recommended |
| Add a second clue list, statistics, date or progress panel | Fills space but increases information and navigation burden | Does not serve the requested minimal solving screen |

## Recommended layout

### 1. Header: two levels when space permits

Baseline: a 56px borderless header with the title at about 17px, a plain +, UI Studio, Reveal and the more menu. Each action has a 44px touch target, with an icon around 20px. On narrower widths, move secondary actions into the more menu rather than crowding the title or reducing targets.

When the measured height budget leaves at least 44px after reserving the maximum-width square, stable clue dock, keyboard and baseline spacing, add a 44px second header row. Put the zoom group there, with real 44px targets for −, Fit and +. Solving tools form one group; new puzzle and appearance remain global actions. Undo and Check remain available in the more menu. The extra row is part of the header, so no toolbar returns below the keyboard.

This preserves a larger, readable title and avoids placing two visually similar + actions next to each other. Keep controls in predictable positions within each layout mode. Use a small threshold margin/hysteresis so Safari toolbar movement does not repeatedly switch modes.

### 2. Board: an explicitly square visual frame

Use a real square frame for the initial board, with square cells and only a very small side gutter. Allocate remaining space outside the frame, not by stretching its cells. A zoomed board may overflow its clipped viewport and pan normally; the clue and keyboard stay fixed outside it.

Use restrained gaps of roughly 8–24px above and below the square where the budget allows. If more space remains, distribute it as a quiet frame rather than continuing to enlarge the title or adding content. Align the title, board and clue text to consistent horizontal guides. The exact spacing should be tuned against rendered screenshots.

Retain the two selected colours, derived word/cell shading, Work Sans and plain icon treatment. Avoid adding surface colours, selected-cell decorations or a header divider.

### 3. Clue: fixed two-line reading area

Implemented now: 62px portrait height regardless of whether the clue takes one or two lines. Text uses 16px size and 22px line height; a one-line clue is vertically centred within the reserved space. Longer clues remain scrollable within the two-line window, without truncating away the answer length. Landscape uses its own fixed 52px two-line area.

The proposal's next refinement is 44px-wide previous/next targets within that same fixed height, while keeping the clue readable between them. No separate Across/Down line returns. Tapping the selected crossing continues to change direction.

A clue transition must not change board dimensions or zoom. Only an active cell moving outside the board viewport should cause automatic panning.

### 4. Keyboard: keep its position and rhythm

Keep the keyboard immediately below the clue, with no footer. Do not spend surplus height on enormous keys: current maximum key height is already about 49px. Preserve QWERTY row offsets, consistent gaps and a wider backspace key. Safe-area protection must be verified separately in ordinary Safari and in a home-screen installation so the bottom row never falls under the home indicator.

## Implementation sequence

1. Ship the direct fixes: shared canvas colour application, pre-paint local palette restore and fixed two-line clue sizing. This is v2.2.1.
2. Build a viewport budget using measured header, clue and keyboard dimensions. Select one-row or two-row header based on remaining space, not user-agent detection.
3. Give the board an explicit square frame and controlled external gaps. Preserve the current transform and active-cell visibility across layout changes; do not reset zoom on clue transitions.
4. Increase header/clue touch targets and title readability. Keep secondary functions reachable through the header menu on short/narrow screens.
5. Verify the complete interaction in Safari and adjust spacing only against observed rendering.

## Acceptance checks

- Square board and equal cell dimensions at every fit size; no page-level horizontal overflow.
- One-line → two-line → long-clue navigation leaves the board rectangle and zoom scale unchanged. Long text can be read without making the dock grow.
- Header layout mode does not oscillate when Safari expands/collapses its controls.
- Thumb taps on adjacent header controls do not activate neighbours; keyboard focus can leave the board.
- UI Studio preview, Save, Cancel and reload update html/body backgrounds and theme metadata consistently, with valid light and dark palettes.
- Inspect the actual status-area and lower browser region, not just an app screenshot cropped inside the viewport.
- Test ordinary Safari's supported toolbar configurations, rotation, UI Studio's native text keyboard, larger text/page zoom, and home-screen mode.
- Pinch, pan, direct overwrite, filled-letter skipping and clue navigation continue to work without unintended selections.

Automated CSS/math/bootstrap checks can catch regressions. They cannot establish native Safari toolbar appearance, physical touch accuracy or the best whitespace distribution. Those require real-device verification. No iPhone visual test has been performed in this environment.
