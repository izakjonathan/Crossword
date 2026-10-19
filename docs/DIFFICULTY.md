# Difficulty policy · v2.8

Research and editorial revision: 19 October 2026. These are initial editorial bands for general adult English speakers, not measured frequency, CEFR levels or estimates of human solve time. Mechanical compliance is enforceable; perceived difficulty still needs test-solving.

## Separate three influences

More white squares increase workload. Vocabulary familiarity influences whether the answer is available to a solver at all. The clue's sense and wording influence how readily that answer can be retrieved. A longer everyday word can be easier than a short word in an unfamiliar sense; neither answer length nor different wording alone earns a higher rating.

The Puzzle Society's [editor guidelines](https://submissions.puzzlesociety.com/) favour recognisable fill and approachable harder clues over obscurity. Patrick Merrell's [clue-writing guidance](https://amuselabs.com/resources/guides/writing-crossword-clues/) stresses agreement in tense, number and part of speech. Efron's [Shannon meets Shortz](https://experts.illinois.edu/en/publications/shannon-meets-shortz-a-probabilistic-model-of-crossword-puzzle-di/) models difficulty through the probability of an answer given its clue. The app follows the distinction between answer familiarity and clue retrieval; it does not implement or claim validation by that model. [Research on crossword solving](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2014.01018/full) also supports keeping both semantic information and letter constraints useful.

## Explicit ratings

`vocabulary-ratings.mjs` assigns each original answer to everyday (1), broader (2), or specialist/less familiar (3). Added answers declare a band in `long-words.mjs`. These judgments depend on audience and can be revised independently of clues. They are not automatically inferred from spelling length, uniqueness or the old `hard` field.

Every answer retains a direct tier-1 definition. `clue-ratings.mjs` explicitly selects 515 existing tier-2 alternatives and authors 109 tier-3 variants. Tier 2 includes alternate senses, narrower descriptions or bounded cultural references. Tier 3 uses less expected senses or more demanding technical/indirect descriptions, with regional usage marked where needed. Legacy alternative text without an explicit selection is not promoted. Selected tier-3 answers have one challenging variant rather than labelling two paraphrases as separate difficulty steps.

For example, BANK has familiar vocabulary but its Hard clue asks for an aircraft's tilt; NORMAL asks for the geometrical sense; BEAM asks for a ship's breadth. This is a quick crossword, with no unannounced cryptic wordplay. Not every clue in a Hard puzzle is hard: direct footholds remain.

## Enforced profiles

Percentages are rounded up for minima and down for maxima by answer count. Means use the stored 1–3 editorial bands, not a claim that the bands are a psychometric interval scale.

| Rule | Easy | Medium | Hard |
| --- | --- | --- | --- |
| Grid | 9×9 | 11×11 | 13×13 |
| Playable squares | 50–58 | 75–85 | 105–115 |
| Mean vocabulary band | 1.00–1.15 | 1.30–1.65 | 1.75–2.35 |
| Broader/specialist answers | At most 15% broader through mean limit | At least 25% | At least 50% |
| Specialist/less familiar answers | None | At most 10% | 10–25% |
| Challenging clues (tiers 2–3) | None | At least 35%, tier 2 only | At least 65% |
| Tier-3 clues | None | None | At least 20% |
| Mean clue band | 1.00 | 1.35–1.70 | At least 1.85 |
| Longer answer requirement | None; current layouts 3–5 | At least one 8–9 | At least one 9–11 |

A legal layout is selected before filling. Medium/Hard include a longer boundary lane with the same checking guarantees as other slots. Constraint search checks achievable lower and upper bounds for vocabulary and clue availability, rejecting branches that cannot meet the profile. A final validator checks the actual selected clues and fields. Search budgets remain fixed; no fallback silently reduces difficulty, weakens checking or uses a repeated answer.

Every new answer still has at least `ceil(length/2)` crossing letters, no consecutive unchecked letters, a connected grid, authentic clued runs, unique fill and proper numbering. From v2.8.1, new puzzles additionally forbid two tier-3 vocabulary answers from crossing and require a gentler crossing clue for each tier-3 clue; see `CROSSING-FAIRNESS.md`. Older saves keep their original rules. Human review must still judge whether a particular crossing is fair. The editorial metadata does not prove that a puzzle has a unique solution among all possible English words.

## Definition checks and provenance

Clues are original wording, not copied dictionary definitions or publisher clue lists. The following primary dictionary entries were consulted for the less familiar senses during this revision:

| Entries | Sense checked |
| --- | --- |
| [DIE](https://www.merriam-webster.com/dictionary/die) | Tool for shaping/stamping material |
| [LOW](https://www.merriam-webster.com/dictionary/low), [SKY](https://www.merriam-webster.com/dictionary/sky) | Cattle vocalisation; hit a ball high |
| [STAFF](https://www.merriam-webster.com/dictionary/staff), [NORMAL](https://www.merriam-webster.com/dictionary/normal) | Musical notation lines; perpendicular |
| [ISSUE](https://www.merriam-webster.com/dictionary/issue) | Offspring/descendants |
| [BEAM](https://www.merriam-webster.com/dictionary/beam), [WILL](https://www.merriam-webster.com/dictionary/will) | Ship's width; conscious choice |
| [URN](https://www.merriam-webster.com/dictionary/urn) | Vessel serving hot beverages |
| [RUM](https://dictionary.cambridge.org/dictionary/english/rum), [SHEET](https://www.oxfordlearnersdictionaries.com/definition/english/sheet) | Informal British 'peculiar'; sail-control rope |

These are targeted checks, not a claim that an independent editor has certified all 1,906 answers and their variants. Bank validation also rejects duplicate answers, invalid text, same-length normalized clue collisions and answer giveaways across all used variants.

## Compatibility and next calibration

The save schema remains engine version 3. New puzzles carry `difficultyVersion:1` and per-entry ratings; older valid saves keep their original wording and answers without retroactively applying new quotas. Progress, assisted status, colours and the dated repeat ledger are preserved. Generate a new puzzle to see the new policy.

Before claiming calibrated difficulty, collect actual clue/word feedback from novice and experienced solvers: solve time, wrong guesses, hints, abandoned clues and ambiguous definitions. Review outliers by answer familiarity, clue sense and crossing support separately, then revise the explicit bands and mixtures. The 300-seed audit checks algorithmic compliance, not human enjoyment or universal difficulty ordering.
