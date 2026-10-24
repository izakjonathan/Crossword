# Answer repetition policy · v2.16.0

The app retains a versioned word ledger across difficulties, but only answers from the latest **five puzzles** are hard exclusions. There is no same-day lockout, seven-day wait or twenty-game requirement. This policy supersedes the v2.3 rules.

## Hard rules

1. No answer may repeat within a puzzle or appear in any of the five protected rounds.
2. Proposed puzzles are revalidated against the current history before committing them.
3. Failed generation or storage writes preserve the current puzzle.
4. Shared rooms protect their latest five shared rounds; this room history also governs the local commit of a shared replacement.

## Preference order and capacity

Try never-used answers first. If they cannot form a valid grid, introduce the oldest eligible answers in progressively larger pools. Protected answers remain excluded throughout. The exact oldest eligible answer is not guaranteed to appear because crossing, clue and difficulty constraints determine the fill.

The bank contains **5,730 distinct answers**: 1,910 authored answers and 3,820 supplemental WordNet-derived definitions. Supplemental entries have provisional vocabulary band 2 and direct tier-1 clues only. They do not receive fabricated difficult clue variants. Difficulty requirements and specialist-crossing safeguards still apply, so the full bank is not equally useful in every mode.

The generator distinguishes insufficient eligible words from failure to find a valid grid within its search budget. A search-limit failure does not prove no valid fill exists. See [continuous play, provenance and release verification](CONTINUOUS-PLAY-V2.16.md).

## Transaction and persistence

A Web Lock covers the read → worker generation → revalidation → save transaction. Waiting requests read fresh history after the previous commit. Worker errors and timeouts release the lock; stale responses are ignored. If saving fails, the new puzzle is not published.

The existing ledger key and complete seen-word history remain intact. A bounded recentRounds array records the five actual round boundaries. Legacy ledgers recover identifiable recent game groups. Undated/game-zero legacy imports remain seen-word preferences rather than blocking the vocabulary. The current saved puzzle is reserved during migration. Damaged ledgers are not silently erased.

Viewing a shared puzzle reserves its round locally without counting reloads as new generated games. Shared rooms maintain a bounded five-round history, atomically updated in Redis. Old rooms without round metadata migrate from their current puzzle while preserving membership, edits and room identity.

Web Locks coordinate tabs under one site origin; they do not synchronise browser profiles or devices. Solo history remains browser-local. Shared-room history is server-backed. Copenhagen timestamps remain in the ledger for compatibility and ordering, but calendar days no longer control eligibility.

## Verification

Regression coverage includes exhausted legacy ledgers, five-round rollover, bounded exclusions with complete seen-word history, concurrent generators, failed storage commits, shared-room migration and distinct shortage/search-limit errors. Automated validation does not replace human clue review or mobile performance checks.
