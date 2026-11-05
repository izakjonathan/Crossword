# Replacement-bank search verification · v2.19.0

The bank and explicit mix constraints intentionally change seeded outputs. This is an editorial/search change, not a cost-only refactor. The existing per-fill dictionary index and local domain caches remain isolated from each history exclusion set. The new regression fixture freezes final 2.19.0 output; historical fixtures are retained.

Matched command: node scripts/benchmark-generation.mjs /tmp/crossword-baseline 3 --changed-search. The baseline reproduces the relevant v2.18.0 source from 2beb818566fee6745662066208816c4188173883. The same process alternates execution order, warms up each mode, independently validates both outputs and keeps each solver's own dated ledger. All nine direct comparisons and the twelve-game mixed sequence passed. Identical grids are deliberately not required for this bank change.

| Mean milliseconds | v2.18.0 | v2.19.0 |
|---|---:|---:|
| Easy direct CSP | 176.8 | 233.8 |
| Medium direct CSP | 99.0 | 34.2 |
| Hard direct CSP | 3319.5 | 403.6 |
| Twelve-game app sequence | 270.3 | 161.5 |

These are a small sample on a shared runner during concurrent checks, not a representative mobile benchmark or general speed claim. The wider 300-grid audit reports its own timing distribution in docs/benchmarks/v2.19-audit.json. Direct unbounded audit searches can exceed the interactive request budget; bounded runtime fallback retains the current game on failure.

Hard normally uses the 64 independently validated prepared packets. Selection excludes every protected answer, checks current clue approval and tries bounded alternative continuations across the cache; if none can be proven, a legal current packet can still be served. Continuation is a preference, never permission to repeat a protected answer. The same shared seven-second runtime CSP budget is distributed across unused/oldest eligible candidate pools, preventing an unfillable first pool from starving later pools. No archived answer is used as a fallback. Finite supply and arbitrary histories cannot guarantee every future seed succeeds.
