# Word and clue quality review — 19 October 2026

## Findings and changes

The old merged bank had 1,242 answers, but 1,153 used exactly the same clue at both difficulty levels. Its 600-entry expansion ended at L. Two duplicate answers, BRAIN and ECHO, were silently replaced during Map construction. Several definitions were too broad or grammatically misleading: LYRIC was defined as the plural words of a song; SQUARE omitted right angles; METEOR described the incoming object rather than its visible atmospheric effect; LILY implied a pond plant. MINT's harder clue included peppermint, practically revealing its answer.

This release revises 143 existing entries and adds 286 familiar answers from M to Z, for 1,528 unique answers. It provides 505 distinct direct/less-direct clue pairs rather than 89. New vocabulary includes everyday verbs, adjectives and abstract nouns, balancing a bank previously heavy on objects, food and animals. No external publisher clues or grids were imported. Definitions were written for this application. This is a substantial editorial improvement, not a claim that every clue now meets newspaper editing standards.

## Research and editorial decisions

1. The Puzzle Society's [official Apple News+ submission guidelines](https://submissions.puzzlesociety.com/) prefer recognisable vocabulary and approachable wording. They discourage contrived forms, crossword-only obscurities, trivia saturation and clues revealing their answers. We retain ordinary words at every level, using alternative everyday senses for many harder clues. Increasing difficulty must not simply mean swapping familiar language for obscure taxonomy. For example, the revised MINT pair contrasts a culinary herb with a coin factory.

2. Constructor Patrick Merrell's [24 clue-writing principles](https://amuselabs.com/resources/guides/writing-crossword-clues/) emphasise number, tense, part of speech, substitution in a sentence, abbreviation signals and factual accuracy. We use these as editorial review questions, not a pretence that a regex can understand grammar. A clue for a noun can be a noun phrase, and a word with noun and verb senses can legitimately be clued differently at each level. Clipped forms such as PHOTO are explicitly signalled.

3. The [RHS guide to lilies](https://www.rhs.org.uk/plants/lilies/how-to-grow-lilies) distinguishes the bulb-grown garden flowers and describes their varied shapes. LILY now describes a bulb-grown bloom rather than conflating it with a water plant.

4. The Natural History Museum's [explanation of spider silk](https://www.nhm.ac.uk/discover/what-are-spider-webs-made-of.html) notes that prey-catching webs are not universal. SPIDER now points to eight legs and silk production, without requiring all species to build trapping webs.

5. [NASA's meteor explanation](https://science.nasa.gov/solar-system/meteors-meteorites/) distinguishes a meteoroid from the visible event associated with atmospheric entry. METEOR now describes a streak of light; the alternative clue is the familiar expression shooting star.

## Enforcement and limits

Bank assembly now fails on duplicate answers instead of overwriting clues silently. The worker checks answer spelling/length, missing or malformed clues, a 100-character maximum, whole-answer leakage, common inflections, and a small explicit list of giveaway compounds/derivatives. Accidental substrings are not rejected indiscriminately: EAR in hearing is not a giveaway in the way MINT in peppermint is. Tests also reject identical clues assigned to two different answers of the same length.

These checks catch concrete content regressions. They do not certify semantic truth, determine every possible synonym, or prove a clue's difficulty. Remaining single-clue entries deliberately retain a straightforward definition; they have not been given automatic paraphrases merely to claim two levels. Existing saved puzzles preserve their stored clue text and progress. New puzzles use the edited bank. The full dated repeat ledger, exclusions and grid-density constraints remain in force.

Before adding an entry: check that it is a natural standalone answer; verify any specialist fact with an authoritative source; try substituting the clue and answer into a sentence; check number/tense; remove answer derivatives; and consider whether the definition still singles out the intended sense at the displayed length. Use a direct clue when a fair harder version is unavailable. Further editorial review and real solver feedback remain necessary.

## Second editorial pass — v2.6

A further 400 existing entries were rewritten. The bank remains 1,528 answers; 904 now have distinct direct and less-direct clues. The first pass added breadth; this pass concentrates on clarity and natural alternative senses in existing words. Examples include BANK as a river edge, CLIP as a film extract, COAT as a paint layer, CHORD as a geometric line, and IRIS as a camera aperture. Definitions were written for this bank, rather than copied from publisher clues. Not every alternate clue will be harder for every solver, and 624 entries still retain a single direct clue.

The continuing review follows the two constructor/editor sources above: grammatical substitutions, factual precision, recognisable vocabulary and fair definitions. A hard clue is not improved simply by adding scientific terminology. A proposed taxonomic clue for BEETLE was discarded in favour of an ordinary description of its wing covers. Definitions for CACTUS and BULB were made more precise; GAZELLE no longer implies its distribution is exclusively African; LYRIC now uses a clear poetic sense; SCISSORS is clued with a plural construction.

BAIL previously implied that release always involves payment. The replacement describes conditional release awaiting trial. The [UK government's explanation](https://www.gov.uk/charged-crime/bail) describes release pending court proceedings and lists possible conditions. This is an editorial correction for an English-language puzzle, not guidance about an individual legal case.

The existing exact duplicate-clue test caught a proposed CREEK clue colliding with BROOK at the same answer length. CREEK now distinguishes a coastal inlet from the North American stream sense. This failure motivated moving normalized same-length clue collision detection into runtime bank validation, so an omitted test run cannot silently publish such a collision. Normalization handles whitespace, case, typographic apostrophes/quotes and a final full stop. It does not remove question marks, which can change a clue's interpretation.

Leak detection now includes standard final-E dropping (DANCE/DANCING), Y inflection (BERRY/BERRIES) and final-consonant doubling (BUD/BUDDING). Regression tests retain EAR/hearing and RING/spring as valid accidental overlaps. These spelling rules are guardrails, not a complete morphological or semantic model.

A before/after sample used identical seeds and the unchanged bank order/geometry algorithm: Easy 7 to 19, Medium 16 to 20, Hard 10 to 21 answers with separate clue pairs. Across six puzzles this is 33 to 60 of 105 entries. It demonstrates increased coverage in generated puzzles without asserting a measured increase in human-rated quality or difficulty. Repeat protection and storage behaviour are unchanged. Existing stored puzzles retain their clue text until the user generates another puzzle.

## v2.7 review

The current bank contains 1,738 unique answers: 210 additional familiar three-letter words support the new strongly checked layout families. Original direct/alternative clues include everyday nouns, verbs and adjectives, with explicit abbreviation and regional tags where needed. CLOUD now includes ice crystals; ELEPHANT identifies the trunk rather than assuming visible tusks; PRIME specifies whole-number factors; CACTUS avoids a desert-only definition. The research, objective acceptance rules and limits of mechanical editorial checks are recorded in `RESEARCH-V2.7.md`. Prior bank-size figures in this document are historical.
