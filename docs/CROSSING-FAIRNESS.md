# Crossing safeguards · v2.8.1

Baseline: v2.8.0, with the same 1,906-answer bank and difficulty profiles. Reviewed 19 October 2026.

## Why this change

A well-checked grid can still concentrate its harder material in one place. In a fixed 30-seed sample per mode (`fairness-0` through `fairness-29`), the unmodified v2.8.0 engine produced specialist-to-specialist crossings in 8 Medium and 27 Hard puzzles. The Hard sample contained 60 such crossing pairs and 11 tier-3 clue entries whose crossing neighbours all also had tier-3 clues. Easy had neither condition.

The [Puzzle Society's editor guidelines](https://submissions.puzzlesociety.com/) warn against unguessable crossings and sections saturated with unfamiliar answers. The app-specific rules below are a conservative interpretation of that guidance, not a publisher specification or proof of universal fairness.

## New rules

1. Two answers rated vocabulary level 3 cannot cross. Every crossing of such an answer must instead be with vocabulary level 1 or 2.
2. Each tier-3 clue must have at least one crossing entry with a tier-1 or tier-2 clue. Tier-3 clues can still cross each other when they also have gentler support elsewhere.
3. Tier-3 clues remain exclusive to Hard mode.

The original minimum checking, no-adjacent-unchecked-letter rule, connectivity, square counts, vocabulary/clue mixtures, longer-answer requirements and dated repeat exclusions are unchanged. A gentler crossing clue can still refer to a word a particular solver does not know. The safeguards reduce a measured risk; they do not certify that every clue is unambiguous or every solver will find a solution.

## Implementation

The filler rejects specialist-to-specialist crossings during forward checking, before completing a grid. Clue allocation is a separate bounded subset search in `clue-selection.mjs`: it chooses actual reviewed variants jointly, checks gentler crossing support and retains the mode's required mixture. When no valid allocation exists, word filling backtracks rather than publishing the first completed fill. The clue search uses a fixed 4,096-node budget; layout and word-search budgets and the 20-second client deadline remain bounded as before.

`crossing-safety.mjs` independently reconstructs entry neighbours from shared cells and checks the published result. New puzzles carry `fairnessVersion:1`. Existing v2.8 and earlier saves without that marker retain their original clues, entered letters, ratings and validity; new restrictions are not applied retroactively. A genuine v2.8 save with two specialist crossing pairs is included as a compatibility test fixture. Unknown fairness versions and missing ratings on tagged puzzles are rejected.

## Editorial corrections

The RAY mathematical clue now identifies part of a straight line extending indefinitely from one endpoint. PLANE now specifies a flat two-dimensional surface extending without limit. The [Wolfram MathWorld RAY](https://mathworld.wolfram.com/Ray.html) and [PLANE](https://mathworld.wolfram.com/Plane.html) entries were consulted to distinguish these from a complete line or an arbitrary curved surface. Wording is original.

The unused legacy PIE alternative now explicitly asks for the missing word in “___ chart”, rather than defining the complete chart as PIE. It has not been promoted to a harder tier. Reviewed variant data must contain the actual direct clue, distinct tier identities and distinct normalized texts; duplicate text cannot masquerade as another difficulty level. These checks supplement, rather than replace, grammatical and semantic review.

See [validation evidence](VALIDATION-V2.8.1.md) and [the original difficulty policy](DIFFICULTY.md). Ratings remain editorial starting bands and need human test-solving for calibration.
