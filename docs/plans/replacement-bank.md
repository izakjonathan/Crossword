# Replacement word bank · v2.19.0

Baseline: v2.18.0, commit 2beb818566fee6745662066208816c4188173883.

The approved scope is a new bank excluding every answer in the old 5,730-answer bank, with an explicit pop-culture share. The replacement contains 1,520 authored answers, including 384 entertainment entries (25.26%). It includes music, actors, fictional characters, films, TV, games, everyday objects, food, geography, language and general knowledge. No WordNet definitions are imported into this bank. The old bank remains in legacy-words.mjs for historical data and to prevent accidental reintroduction.

Source TSVs contain the editorial candidates; the build script normalises standard crossword spelling, filters the retired bank and unsupported answer lengths, resolves exact duplicates in a defined order and runs the bank validator. It does not invent harder clues or derive them from dictionary senses. Alternate facts and word senses are explicitly written. The two named editorial lists select provisional clue tiers; they are not calibrated human difficulty scores. Familiar food and geographic names have explicit vocabulary exceptions so Easy is not deprived of ordinary answers. Rebuild with node scripts/build-replacement-bank.mjs.

New grids carry wordBankVersion 1, category and answer-style annotations. Both the CSP bounds and the independent puzzle validator require 20–35% entertainment answers and at most 25% abbreviated answers. Existing difficulty, checking, crossing, geometry and last-five-round safeguards remain in force. Earlier saves do not acquire the new content constraints retroactively.

The replacement is smaller than the archived dictionary but has 365 three-letter answers and deliberately written clues. It is not an unlimited no-repeat supply. The dated seen-word ledger still prefers unseen entries and keeps five rounds protected. All previously supplied answers are absent from the new bank regardless of whether browser history recorded them. Renewing the bank does not imply that an answer can never recur in future games.

The prepared Hard supply must be rebuilt from the replacement before release. Its normal active-answer and exact-clue checks reject old prepared entries; saved historical puzzles remain readable. Do not fall back to the retired bank on failure.

Editorial review includes spelling, clue-answer agreement, first-name/surname signals, abbreviation and informal-language signals, alternate senses, duplicate clues and factual spot checks. A questionable TARAMA clue was removed because it gave away its answer through a longer word. NIP and TOT received distinct clues. This is an assistant-authored bank; automated tests and source checks do not constitute independent human test-solving of every clue.

Reference checks and editorial sources are recorded in docs/replacement-sources.md. See docs/testing.md for this release's actual validation results.

Final history regressions also exposed two selection problems. Prepared continuation is now searched across the complete cache rather than a fixed adjacent sequence, with a legal current grid retained as a fallback when a future continuation cannot be proven. The five-round exclusion is never relaxed. Runtime CSP distributes its shared seven-second budget across candidate pools, so an unsuccessful unused-only search cannot consume the entire budget before older eligible answers are tried. Canonical source TSVs retain only accepted authored candidates; compact compilation reduces the replacement module to approximately 149 KB.
