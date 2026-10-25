# Editorial recovery and Hard loading · v2.18.0

Baseline: 627d423c3bf8dc8c663d786b7c751ca07536dd3e (v2.17.1). User requested removal of Pencil, better word/clue quality, and recovery of Hard generation.

## Findings and corrections

The v2.16 expansion mistook exact dictionary provenance for crossword suitability. WordNet glosses describe synonym sets and may use uncommon senses; even the ordering of senses has sparse/random evidence. Examples included FOUND as provided food/lodging, SMALL as the lower back and FAST as fasting. Those are dictionary senses, not helpful default clues for this app. The expansion should not have been treated as an editorially approved crossword bank.

All 3,820 raw additions are excluded from construction unless explicitly listed in edited-additions.mjs. Its 100 original rewrites choose common senses and natural short wording: FOUND / Discovered after searching; SMALL / Limited in size; FAST / Moving at great speed; VERY / To a high degree. The direct ELM clue now refers to a beetle-spread fungal disease instead of the ambiguous phrase Dutch disease. Active bank: 2,010. Archived bank: 5,730. Saved puzzles retain their existing wording and answers. No storage reset is required.

Rewriting 100 additions and auditing bank guardrails does not mean that every original clue has been individually test-solved. The original authored alternatives remain; further editorial work is warranted. New ratings are provisional. Raw additions stay quarantined until their exact senses and wording are reviewed. No fabricated tier-2/3 variants were added just to satisfy quotas.

## What the research supports

Crossword Compiler assigns fill scores and permits cutoffs, rather than treating every dictionary word as equally desirable. Its clue databases associate wording with answers and can restrict filling to answers with clues. WordNet's own documentation explains shared synset glosses and cautions about sense ordering. The Down and Across paper states the agreement requirements for tense, part of speech and language, as well as abbreviation and question-mark conventions. Setter/editor Richard Browne identifies vague indications and nonsense surfaces as unsuccessful clues.

Clue-Instruct demonstrates source-context-conditioned LLM drafts and uses both human and automatic evaluation. Its authors explicitly say automatic metrics alone are insufficient for judging the generated data. A separate educational extraction study reports 84% classifier accuracy on its own dataset, not a guarantee for English newspaper crossword quality. These results support an assisted editorial pipeline; they do not establish that fresh unreviewed clues at play time would fix this app.

## Recommended content pipeline

1. Choose a standalone, recognisable answer with a deliberate sense, grammatical form and spelling.
2. Write an original clue that matches that sense, tense, number and part of speech. Signal slang, abbreviations, foreign or regional usage when relevant. Do not manufacture difficulty with vagueness.
3. Record factual sources for specialist claims; separate clue difficulty from answer obscurity.
4. Reject answer leakage, duplicate same-length clues, malformed text, unindicated wordplay and unsupported factual claims. These checks catch mechanical faults, not every semantic fault.
5. Have a second reader solve the clue without seeing the answer; revise ambiguous or awkward wording. Only then promote a raw/AI-assisted draft into the active bank.
6. Run grid and crossing audits on completed puzzles. Keep flawed content out of new construction without invalidating old saves.

A live LLM could draft clues after the grid answers are fixed, but would introduce network latency, API cost and a new factual-error path during loading. The chosen release uses ahead-of-play wording and selects variants while assembling puzzles. No paid API or account setup is required. AI-assisted drafting can be added offline behind the same review gate later.

## Hard reliability

Old browser generation attempted multiple large CSP pool searches under a 20-second worker timer. A desktop success did not demonstrate mobile completion before that timer. Hard also required a minimum 10% specialist fill, restricting useful common crossings and increasing search work. Removing raw direct-only additions and the mandatory specialist quota addresses both content quality and feasibility.

Profile v2 keeps every Hard clue quota (65% challenging, 20% hardest tier, minimum mean 1.85), geometric checks, long-answer requirement and crossing fairness. Vocabulary mean minimum changes from 1.75 to 1.5, broader fraction from .5 to .4, specialist minimum from .1 to zero and maximum from .25 to .2. This is an intentional editorial rebalance, not a cost-only solver change. Version-1 saves use the old profile and remain valid.

64 complete Hard puzzles are CSP-built offline. Runtime reconstructs their grids and validates them again, checks that each answer/clue is active, excludes every answer in the latest five puzzles, and ranks unused/oldest answers. Each packet excludes the five preceding packets’ answers. Before serving a candidate, a five-round look-ahead establishes a valid continuation along that sequence. At its end the last six disjoint packets provide a safe continuation, while the selection ranking can choose other eligible packets. Candidate records are cloned before use. A finite prepared pool can eventually repeat a cooled puzzle; this is not infinite novel content.

Older/mixed-mode histories may block the prepared supply. In that case ordinary CSP is available with a shared seven-second cooperative deadline across layouts/pools, plus the existing worker watchdog. Checks occur at layout/recursive-search boundaries, so this is not a hard real-time bound on a slow device. It preserves the current game on failure and never silently relaxes repeat rules. No blanket promise that every mixed history has an immediate prepared match is made.

## Validation

Production build and all three built-CSS layout tests passed. All 300 audited puzzles passed. A 2,000-game prepared Hard selection stress test completed with zero protected repeats: host-only mean 0.51 ms, maximum 5.27 ms per selection. The full suite initially passed 134 cases with seven disposable-Redis checks skipped; a further mixed-mode recovery case was then added. The final full suite passed 135 tests with zero failures and seven disposable-Redis checks skipped. Host-only prepared-selection timings are in v218-prepared-timing.json; these exclude network, worker startup and physical-phone performance. No whole-bank human quality guarantee is inferred from automated passing tests.

## Primary sources

- https://wordnet.princeton.edu/frequently-asked-questions
- https://crossword-compiler.com/en/help/html/aboutwordlistscoring.htm
- https://ftp.crossword-compiler.com/en/help/html/convertingwordlists.htm
- https://par.nsf.gov/servlets/purl/10400763
- https://www.theguardian.com/crosswords/crossword-blog/2020/dec/07/crossword-blog-meet-the-setter-vulcan
- https://aclanthology.org/2024.lrec-main.297/
- https://aclanthology.org/2024.bea-1.31/

ELM factual correction source: https://www.rhs.org.uk/disease/dutch-elm-disease .

Replenishing the supply: run `node scripts/prepare-hard.mjs` after editing/reviewing the active bank, then run the full tests/build/audit. The script atomically replaces the inventory only after all 64 puzzles are valid; failed runs preserve the previous file. The release stress sequence exercised 62 distinct prepared puzzles.
