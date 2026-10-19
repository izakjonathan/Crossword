# Black-square research and construction changes

## Finding

The claim that published crosswords never have adjacent black squares is false. The Guardian Quick 17,309 PDF provides a direct visual counterexample. Ordinary runs of adjacent black squares separate answers. American construction guidance discourages large clumps, requires all-over interlock and checked letters, and gives a roughly 16% black-square guideline; that is an American-style convention, not a universal rule for British grids.

References:
- Published Guardian grid: https://crosswords-static.guim.co.uk/gdn.quick.20251027.pdf
- Constructor guidance compiled from Will Shortz materials: https://giveacrossword.org/rules.pdf

No publisher's grid or clue data is used in this app. The PDF was inspected for the layout question only.

## Actual defect

The app used a word-first freeform construction algorithm. It stopped at a word-count target, heavily rewarded crossings, and gave little weight to covered area. All remaining cells became black. It neither measured nor limited black-cell density or solid patches.

On the fixed baseline seeds density-0 through density-11, using each mode:

| Mode | Previous average black cells | Previous worst | Previous average solid 2×2 patches |
| --- | ---: | ---: | ---: |
| Easy | 43.4% | 46.9% | 2.58 |
| Medium | 46.1% | 48.8% | 5.25 |
| Hard | 45.9% | 48.5% | 5.92 |

These are measurements of this app, not a representative comparison with other apps.

## Implemented fix

- Candidates favour longer answers, with seeded random variation. All eligible bank answers remain available instead of truncating the pool at 420.
- Placement rewards newly covered cells more strongly and avoids concentrating only on dense crossings at the centre.
- Continue filling after the old target, within a bounded search.
- Score covered area and penalise solid black patches.
- Require at most 42% black cells and at most three solid 2×2 patches. A solid 3×3 block necessarily exceeds the patch limit and is rejected.
- Still validate every answer, crossing, clued run, minimum length, uniqueness and connectivity.
- Hard mode's minimum clue-count target is adjusted for longer answers occupying more cells; it retains the longest vocabulary allowance.

The search normally evaluates up to 120 arrangements and can use up to 200 to obtain an acceptable grid. Easy searches can finish earlier once they reach a strong fill. The app still runs this work in its dedicated worker. If neither density nor repeat restrictions can be satisfied, it returns an error and keeps the current puzzle. It never fills holes with invented answers or removes repeat protection to make a denser board.

During tuning on the same twelve baseline seeds, experimental averages were about 34.1% Easy, 38.1% Medium and 38.4% Hard, with no generation failures in that sample. All accepted grids had at most 42% black cells and at most three solid 2×2 patches. This is a fixed-seed sample, not a universal latency or quality benchmark.

## Compatibility and limits

New grids carry constructionVersion:2 and are subject to the new quality checks in the structural validator. Old saved grids retain their shape and progress, and do not suddenly fail restore because they predate the stricter construction limits. Generate a new puzzle to see the new construction.

This remains a freeform blocked crossword generator backed by a finite original clue bank. It does not claim American-style 100% checked letters, rotational symmetry, or the roughly 16% American black-cell convention. Reaching those goals reliably would require a different template/fill solver and a substantially larger editorial answer bank. The implemented fix directly reduces the observed sparse-fill and clump problem without falsely claiming those additional standards.

The earlier stress tests assumed a fixed number of grids could always be generated from the finite bank. With both strict density and strict repeat exclusions, that is no longer a sound capacity assumption. Tests now separately verify randomized dense construction, multi-mode same-day sessions, a ledger exceeding 500 actual bank answers, full exclusion-set enforcement and explicit exhaustion. Density and repetition rules are not relaxed to preserve an arbitrary generation count.
