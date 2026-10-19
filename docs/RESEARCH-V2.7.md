# v2.7 construction and solving review

Baseline: recovered v2.6.0 source plus the v2.6.1 browser-background update. Research and measurements: 19 October 2026.

## What kind of crossword this is

This app uses original **straight/quick definitions**, with British-style partial checking. It does not generate cryptic wordplay. Its generated layouts are asymmetric; every letter is not required to belong to two answers. These are deliberate product choices, not claims of compliance with a particular newspaper's submission specification.

The review covered structure, checking, word lengths, coverage, numbering, crossings, connectivity, vocabulary, clue wording, difficulty, repeats, latency, input, accessibility, persistence, mobile space and failure recovery. No publisher puzzles, clue lists or solution grids were copied.

## Evidence and implementation decisions

| Area | Research/evidence | Implemented decision |
| --- | --- | --- |
| Grid checking | MyCrossword's setter guidance describes approximately half-checked entries, stronger checking of three-letter answers, connected grids and limits on adjacent unchecked cells. | Every new answer has at least `ceil(length / 2)` checked letters. Three-letter answers therefore have at least two checks. No adjacent unchecked cells are allowed in a word. This is a stricter app-specific choice than some publishers require. |
| Construction model | Harvard CS50 describes length constraints, matching overlaps, distinct words, minimum-remaining-values selection, degree tie-breaks and least-constraining values for crossword filling. | Choose a legal layout first; fill its slots with bounded backtracking, forward checking, answer uniqueness and seeded value ordering. This implementation is original JavaScript, not copied course code. It does not claim full AC-3 inference. |
| Other puzzle traditions | Apple News+ requires every letter to be checked in its 15×15 puzzles, while allowing asymmetric layouts. | Do not present this partially checked app as an American-style or Apple News+ specification puzzle. Rotational symmetry is not imposed at the cost of bad fill. |
| Vocabulary | The Puzzle Society prioritises recognisable answers and warns against obscure filler, manufactured forms and unfair trivia crossings. | Keep the original answer whitelist. Add 210 familiar short standalone words rather than fabricating abbreviations or inflections. All words have original literal clue pairs. |
| Clue grammar | Constructor Patrick Merrell emphasises tense, number, part of speech, sense and the substitution test. | Review new clue pairs as noun/verb/adjective senses, signal clipped forms such as LAB, mark regional senses such as North American PIT, and retain a direct clue where an indirect one would be forced. |
| Clue facts | NOAA describes cloud droplets and ice crystals. Smithsonian notes elephants do not all have prominent tusks. | Correct CLOUD to include ice and ELEPHANT to identify the trunk without implying that all elephants have large tusks. Clarify PRIME as a whole number with exactly two positive factors. CACTUS no longer implies a desert-only habitat. |
| Difficulties | The Puzzle Society distinguishes approachable harder clues from simple obscurity. | Easy uses direct definitions; Medium mixes direct and alternative clues; Hard uses the alternative clue. Size also increases. These are authored tiers, not a calibrated human difficulty model. |
| Accessibility | W3C's modal-dialog pattern requires contained focus, inert background content, Escape and logical focus restoration. | Trap Tab/Shift+Tab, make dialog siblings inert while open, restore their previous state, restore the invoking control and retain a visible Close button. Selected cells use the inverse two-colour palette with an inset frame. |
| Trust and provenance | Research on crossword generation models construction as a constraint satisfaction/optimisation task; it does not certify semantic correctness automatically. | Publish objective validity checks separately from editorial judgement. Include reproducible metrics and document the remaining uncertainty. |

## Why the old generator needed more than tuning

The old greedy construction rewarded new covered cells much more than useful crossings. An answer could therefore extend a long arm with only one checked letter. In nine fixed-seed baseline puzzles, minimum per-answer checking ranged down to 1/7, and one sample had six consecutive unchecked letters. A small black-cell percentage did not imply a fair or well-supported solve.

The new layout generator builds interleaved lanes, varies the separator positions, then trims eligible endpoints to introduce even-length answers. Each candidate layout must already satisfy the checking, connectivity and black-cell requirements before any word is placed. Runs are extracted from the actual grid rather than trusting a placement log. Layouts that cannot be filled within the search budget are discarded. No partial fill, invented word, repeated answer or weakened quality threshold is published.

Each fill first restricts candidate domains by answer length. It selects the unfilled slot with the fewest remaining candidates, breaking ties by crossing count. Candidate values are ranked by support in neighbouring domains plus seeded variation. Assignments filter crossing domains and remove the same answer from every other compatible-length domain. Empty domains cause immediate backtracking. Fixed node and layout budgets keep requests finite and reproducible. The browser's independent worker timeout terminates a stuck search and allows a fresh worker on retry.

## Exact acceptance contract

- Square grid: Easy 9×9, Medium 11×11, Hard 13×13.
- New templates use lengths 3–7, including even lengths introduced by trimming. Longer bank entries are retained but are not used by these templates. The current vocabulary is too small at lengths 8–11 to promise varied, strongly checked long-answer grids.
- Every entry is a real contiguous horizontal or vertical run, at least three letters long.
- Every occupied cell is covered; every multi-letter run has a clue.
- No duplicate answers, duplicate IDs, parallel overlaps, mismatched crossing letters or disconnected entry groups.
- Row-major numbers are assigned to entry starts; Across and Down beginning in one cell share a number.
- Every entry has at least half its letters checked, rounded up, and at most one consecutive unchecked letter.
- Retain the app's existing maximum 42% black area and maximum three all-black 2×2 patches. These are local design limits, not universal publishing rules.
- The dated history excludes same-day answers across all difficulties. Reuse still requires seven days and twenty intervening games; finite-bank exhaustion produces an error instead of relaxing restrictions.
- Existing valid saved puzzles keep their layout, clues and progress. The stronger new checking/numbering contract is attached to construction version 3, without changing the session version or discarding the repeat ledger.

## Editorial checks and limits

All 1,738 bank entries pass spelling/length format, duplicate-answer, required-clue, clue-length, normalized same-length exact-clue collision and mechanical answer-leak tests. These checks do **not** understand all synonyms, grammar or facts. The 210 new short answers have authored direct/alternative definitions; definitions and senses were reviewed during this pass. Specialist spot checks were made against the sources below. This is not a claim that every retained clue was independently fact-checked against a dictionary in this release.

Unique grid filling is not the same as a unique natural-language solution. Unchecked letters can leave alternative dictionary words that only the clue disambiguates. The engine certifies a consistent whitelisted answer assignment, not that every English speaker will interpret every clue identically. A human test-solver/editor remains the next meaningful quality check. Hard clues sometimes share their direct wording, and alternate meanings are not harder for every person. Avoid claiming a numerical human difficulty rating.

Repeat protection is local to the site's origin and browser storage. Clearing storage or using a different device creates a different history. A finite word bank cannot provide an endless strict no-repeat session. The 300-puzzle audit samples independent fresh histories, while separate tests exercise consecutive protected generation; those are different checks.

## Sources consulted

1. [MyCrossword — Guidance for Featured Setters](https://www.mycrossword.co.uk/blog/guidance-for-featured-setters) — grid checking/connectivity and fairness; cryptic-specific rules were not applied to these literal clues.
2. [Harvard CS50 AI — Crossword](https://cs50.harvard.edu/ai/projects/3/crossword/) — constraint model and search heuristics.
3. [The Puzzle Society — Apple News+ submission guidelines](https://submissions.puzzlesociety.com/) — fill quality, approachable clues, avoidance of artificial forms and the distinction from fully checked American grids.
4. [Patrick Merrell / Amuse Labs — 24 Tips for Writing Crossword Clues](https://amuselabs.com/resources/guides/writing-crossword-clues/) — grammatical and editorial review questions.
5. [Majima and Ishihara — Generating News-Centric Crossword Puzzles as a Constraint Satisfaction and Optimization Problem](https://arxiv.org/abs/2308.04688) — research context; this app does not generate news clues or reproduce that system.
6. [W3C — Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — focus and modality.
7. [NOAA — Clouds](https://www.noaa.gov/jetstream/clouds) — droplets and ice.
8. [Smithsonian National Zoo — Asian elephant](https://nationalzoo.si.edu/animals/asian-elephant) — tusk qualification.
9. [RHS — Award-winning small-garden conifers](https://www.rhs.org.uk/plants/trials-awards/using-award-winning-plants/10-award-winning-small-garden-conifers) — upright fir cones.
10. [RHS — Cacti and succulents](https://www.rhs.org.uk/plants/types/cacti-succulents) — fleshy water storage and the existence of humid-growing types.
11. [Wolfram MathWorld — Prime Number](https://mathworld.wolfram.com/PrimeNumber.html) — integer restriction and positive divisors.
12. [Cambridge Dictionary — shy](https://dictionary.cambridge.org/dictionary/english/shy) — alternate verb sense reviewed, then excluded from the new clue pair because its old-fashioned register adds avoidable obscurity.

Previous editorial research is retained in `CLUE-QUALITY.md`; it is historical evidence, not a claim that the older bank-size figures are current.
