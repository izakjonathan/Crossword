# Construction and clue refinement · v2.13.0

Baseline: v2.12.0, commit 934fd781cad352674ab47c656b11fbd9867b590d. Reviewed 20 October 2026. The user's prior choice of quick grids, current sizes and curated bank remains the scope.

## What changed

Construction version 5 rejects every solid all-black 2×2 patch. Version 4 permitted two; older construction versions retain their own limits. Symmetric segmentation, opposite long slots, paired endpoint trims and added crossings are retained. Density caps remain 31% / 34% / 37% for Easy / Medium / Hard. Three-letter minimum, half checking with no adjacent unchecked letters, connectivity, complete entry coverage and row-major numbering remain mandatory.

The filler retains minimum remaining values and crossing degree as its first priorities. When those are tied, a slot whose centroid is nearest the centre wins. This implements a useful centre-first preference without ignoring a much more constrained edge slot. Maskless callers retain their previous slot order. Each fill still has local caches. The total 48,000-node cap and 20-second client deadline remain. Up to 1,024 candidate layouts may now be considered, because zero-clump filtering rejects more layouts. This does not widen the eligible word pool or relax repeats.

Nine clue phrases were edited to preserve singular/collective number more clearly: TABLE, BED, RECIPE, CLUE, COUPLE, PAIR, BRIEF's legal sense, BOOKCASE's alternative and EQUIPMENT. For example, RECIPE now uses “Set of instructions for preparing a dish”; BRIEF uses “Set of instructions given to a barrister”. Different senses of the same spelling may still have different parts of speech. This is a targeted editorial review, not an automated proof of all 1,910 definitions' grammar.

Four ordinary dictionary words were added with direct clues and explicit vocabulary bands: ENAMEL (2), FREEZER (1), NURSERY (1), TENT (1). Six reviewed Hard-only wordplay variants are stored with their source and explanation:

| Answer | Clue | Intended reading |
| --- | --- | --- |
| ENAMEL | Canine coat? | Covering of a canine tooth, not a dog's fur |
| FREEZER | Cold case? | A cold storage cabinet, not an investigation |
| NURSERY | Growing business? | A business raising plants |
| TENT | Pitcher's shelter? | A camper pitches the shelter |
| RIVER | Runner with a bed and a mouth? | A flowing watercourse |
| LETTER | Character in the mail? | Alphabetic character / posted message |

Wordplay is explicitly marked, source-backed and explained in the authored bank; a question mark is mandatory. Unreviewed question-mark clues are rejected. Hard clue allocation prefers these variants when the selected words and gentler-crossing safeguards support them. They are not required in every Hard puzzle. Easy keeps direct definitions; Medium keeps reviewed alternative senses. Existing vocabulary/clue mixture limits and the prohibition on specialist-to-specialist crossings remain unchanged. Hardness is not manufactured by increasing obscurity.

`cluePolicyVersion:1` accompanies new puzzles. Entries carry clue-style, answer-form and register annotations. Known shortened senses require a clear abbreviation indicator, and reviewed informal senses require an informal/slang signal. These are sense-specific: VET as a doctor is shortened, while VET as a verb is normal; VAT as tax is shortened, while VAT as a tank is normal. The policy is checked in the bank and independently on tagged published puzzles. The UI explains the question-mark convention in the new-game dialog. Grammar and factual meaning still require human editorial review.

## Applying the supplied guide accurately

| Guide area | Current behavior and limit |
| --- | --- |
| Geometry | Exact rotational symmetry; odd 9×9, 11×11 and 13×13 generated grids. No 15×15 or 21×21 mode added. |
| Block density | Local quick-grid caps above, with zero solid 2×2 patches. 16% of 225 is 36 blocks; 38–42 is approximately 17–19%. |
| Checking | At least half of each answer checked, no consecutive unchecked letters. These remain partially checked quick crosswords, as selected previously. |
| Word count | Audit maxima were 28 / 26 / 38 answers in the current sizes. A 15×15 publication's 78-word cap is not applied mechanically to these sizes. |
| Theme-first | Existing paired long slots are anchored first. Semantic theme sets and a manual grid editor were not introduced. |
| Fill order | Constraint-first search, then centre preference on true ties. Always starting centrally can ignore the hardest constraint. |
| Vowels/consonants | Actual permitted word domains decide feasibility; there is no blanket preference that would exclude valid vowel-starting fill. |
| Cheater squares | Endpoint trims remain paired, checking and renumbering all real runs before fill. No one-sided edits or invented answers. |
| Cluing | Nine number/collective-wording fixes, shortened/informal indicators, and six signalled Hard wordplay variants. |

[The Puzzle Society's current editor guidelines](https://submissions.puzzlesociety.com/) require all letters checked for their American 15×15 puzzles, but allow asymmetry, apply no hard black-square limit and discourage excess obscure/trivia-dependent fill. [Patrick Merrell's first-person clue guidance](https://amuselabs.com/resources/guides/writing-crossword-clues/) discusses number, tense, part of speech, abbreviation signals and question marks, with exceptions rather than blanket rules. [Harvard CS50](https://cs50.harvard.edu/ai/projects/3/crossword/) explains constraint-based fill. These inform this app's local policies; they do not certify publication compliance.

The supplied “Flower holder?” / VIOLET example was not adopted: its proposed explanation does not establish the intended answer. Dictionary links in `professional-clues.mjs` support the new answer senses; they do not certify the difficulty of the authored puns.

## Compatibility and validation

Engine/session version 3, storage keys, dated ledger, cooldowns and shared-room format stay intact. Genuine v2.12 fixtures with black clumps restore with original clues and entered letters under construction v4. Genuine older fixtures remain covered. New rooms and replacement rounds use the same independent validator. Redis's entry-based grid reconstruction and false/null conversion are preserved. Typing still advances one square through occupied cells.

New construction and editorial behavior intentionally changes seeded fills and complete JSON. The v2.12 hash fixture remains historical; v2.13 has its own fixture. The strict equality benchmark remains available for future changes that only reduce search cost. The matched geometry benchmark compares identical inputs without claiming puzzle identity.

- `npm test`: 122 passed, zero skipped, using disposable real Redis. Includes both twelve-game repeat-protected sequences, saved games, shared edits/rounds, bank and clue policy, and centre-tie behavior.
- `npm run build`: passed. `LAYOUT_BUILD=1 node --test tests/layout.test.mjs`: three passed. No lint or standalone typecheck script exists.
- `npm run audit:puzzles`: 300/300 successes, distinct filled grids within each mode, all symmetric, zero solid 2×2 patches, no specialist-to-specialist crossings and no unsupported hardest clues.
- Final audit: 25 wordplay clues across 22/100 Hard puzzles; zero wordplay in Easy/Medium. The earlier prototype's 26/100 figure is superseded by this final filler result.
- Matched 30 seeds per mode against v2.12: all 90 baseline and 90 candidate generations succeeded. Mean generation times were 31.1→26.9 ms, 44.5→41.9 ms and 121.0→92.9 ms. Candidate maximum was 376 ms; the separate 300-puzzle audit maximum was 555 ms. This is container timing, not physical-phone timing or a promise for depleted histories.

| Mode | Mean block fraction before → after | Mean per-entry checking before → after | Mean solid 2×2 patches before → after |
| --- | --- | --- | --- |
| Easy | 29.2% → 30.0% | 77.5% → 74.5% | 0 → 0 |
| Medium | 33.3% → 32.8% | 63.4% → 62.6% | 1.33 → 0 |
| Hard | 35.4% → 35.3% | 59.9% → 60.7% | 1.47 → 0 |

Eliminating clumps does not improve every metric on every seeded sample: Easy/Medium average checking decreased slightly, while the original checking minima remain enforced. The finite bank can still exhaust under history exclusions; failure preserves the current game rather than publishing a worse or repeated puzzle. Human test-solving remains necessary for perceived difficulty. A fully checked American generator and semantic theme construction are outside the previously selected quick-grid scope.

Raw evidence: [audit](PROFESSIONAL-V2.13-AUDIT.json), [matched benchmark](PROFESSIONAL-V2.13-BENCHMARK.json). Live deployment checks are reported after release.
