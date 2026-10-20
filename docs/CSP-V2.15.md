# Maintaining arc consistency · v2.15.0

Baseline: v2.14.0, commit 28eb32bc17a388c54d665a728ce5e029d619bf90. Reviewed 21 October 2026. This is an intentional change to the puzzle-building search, beyond the previous dictionary-cost optimization.

## Solver implementation

The existing layout mask defines blocked and playable cells. Actual Across/Down runs are the CSP variables; curated words of matching length are their initial domains. Extracted crossings encode the letter positions that must agree. The new `constraint-propagation.mjs` creates directed arcs for all crossing pairs and all equal-length answer pairs.

Before search, AC-3 revises all arcs until no candidate can be removed. After every tentative assignment, the assigned domain becomes a singleton and incoming arcs are queued again. Any reduced domain queues its own incoming dependencies, so consequences propagate through unassigned neighbours to a fixed point. A candidate needs a distinct matching word on every crossing, and specialist answers require non-specialist crossing support. Equal-length non-crossing slots also enforce different answers. Pairwise consistency does not prove a whole grid is solvable: recursive backtracking still explores assignments and rejects globally impossible combinations.

Minimum remaining values selects the next slot. Ties use the number of crossings to still-unassigned slots, then the existing distance-to-centre preference. Value ranking counts actual surviving support, including crossing fairness and answer inequality. A logarithmic penalty for eliminated candidates, authored difficulty deficits and seeded variation guide values; the least-eliminating choice breaks a remaining score tie. This is a difficulty-aware least-constraining-value heuristic, not a claim that pure minimum-elimination ordering always produces the best puzzle or fastest search.

Editorial feasibility bounds run before and after propagation; complete fills still require valid clue allocation. When a complete fill cannot receive suitable clues, the solver backtracks. The independent final validator remains mandatory. There is no greedy fallback, invented fill or relaxation of difficulty, checking, fairness or repeat rules.

## Restoration, bounds and compatibility

Each branch copies the domain-vector array; individual candidate arrays are immutable. Parent and sibling domains remain available unchanged for backtracking. Word-length/letter indexes, revision memoization and support summaries are scoped to one fill and released afterwards. Inequality arcs whose target has two distinct answers are already consistent, so they need no source scan. Revisions are cached by both immutable domain arrays and crossing positions.

The existing per-layout and total node limits, maximum layout attempts and 20-second worker deadline remain in place. Propagation is finite because domains only shrink; it cannot certify unsatisfiability when a search budget was exhausted. Strict history can still exhaust the finite bank.

The layout-generation rules, word bank, clue policy, save schema and sharing protocol remain unchanged. Solver order can change the accepted words, clues and layout attempt for a seed. New puzzle IDs include `professional:mac1` to avoid colliding with the prior solver's IDs. Existing games retain their original grids and IDs. The v2.13 fixed-output fixture is preserved; a new v2.15 fixture freezes deterministic results for this solver.

## Correctness evidence

Tests compare propagation with exhaustive enumeration on 120 small domain networks, including cycles, empty domains and specialist crossings. Additional cases check multi-hop incremental inference, restoration across sibling branches, disconnected duplicate answers and a globally impossible all-different problem that requires search despite pairwise support. A complete enumeration test checks that accepting/rejecting full assignments traverses exactly the brute-force valid fills. Existing geometry, editorial, storage, worker, shared-session and repeat-ledger tests also apply.

Release checks: all 132 tests passed with disposable real Redis and zero skipped tests; the production build and all three built-CSS layout checks passed. The independent audit produced 100 valid puzzles per difficulty (300 total), with zero specialist-to-specialist crossings and zero unsupported hardest-tier clues. The audit ran alongside other checks, so its timing is not used as an uncontended performance measurement. Raw structural/editorial results: [300-puzzle audit](benchmarks/v2.15-audit.json). No standalone lint or typecheck command is configured.

## Matched performance and tradeoff

Command: `node scripts/benchmark-generation.mjs ../csp-release 30 --changed-search`. Both engines run in the same process, alternating order, after three untimed warm-ups. Generation alone is timed and both outputs are independently validated. No test, build or audit ran alongside this final benchmark. The explicit changed-search mode permits intentional differences; the benchmark's default still requires complete output equality for cost-only changes.

| Mean generation | v2.14.0 | v2.15.0 |
| --- | ---: | ---: |
| Easy, 30 seeds | 13.2 ms | 38.1 ms |
| Medium, 30 seeds | 22.9 ms | 54.1 ms |
| Hard, 30 seeds | 73.6 ms | 1,099.5 ms |
| Twelve-game protected sequence | 123.3 ms | 901.6 ms |

Every fresh comparison and both twelve-game sequences succeeded. Each sequence uses its own solver's ledger, because different fills produce different exclusions. The candidate's 315 sequence answers were distinct (baseline: 309). Candidate Hard p95 was 4.64 seconds and the slowest protected request was 7.92 seconds on this host. Raw results: [matched solver comparison](benchmarks/v2.15-performance.json).

This stronger solver is slower on these inputs, especially Hard. MAC detects more contradictions before branching, but that bookkeeping does not guarantee lower total time. Different accepted fills also change clue-allocation search and history. This release implements the requested search method; it does not claim a speedup, denser grids, better human-rated clues or guaranteed success before the worker deadline on every phone. The independent audit's larger input set and concurrent load are reported separately above.

## Research

- Harvard CS50 AI [crossword model and AC-3 specification](https://cs50.harvard.edu/ai/projects/3/crossword/).
- Harvard CS50 AI [backtracking, MAC and search heuristics](https://cs50.harvard.edu/ai/notes/3/).

MAC makes more deductions; its bookkeeping can cost more than forward checking on easy problems. Measurements must distinguish this stronger search from a speed-only optimization. Automated consistency does not certify clue enjoyment, uniquely interpretable definitions or American-style full checking. No physical-phone memory/latency guarantee is made.
