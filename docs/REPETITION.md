# Answer repetition policy · v2.20.0

Baseline: v2.19.0, d8361980c16b162bee3c9f81187a9e0408d587f3. This release prepares history protection before any further bank/backend rebuild. It does not replace the active 1,520-answer bank or edit saved puzzles.

## Current publication rule

All recoverable previously played answers are permanent exclusions for new games, regardless of their age, difficulty or clue wording. Newly published games add their answers too. The global registry is independent of release and bank version; a later content release must not reset it. This supersedes five-round-only reuse in production. Direct engine fixtures without exclusions retain historical rolling-window behavior for compatibility.

## Recovery and storage

- The existing dated word ledger retains every known answer, including answers beyond the five-round window. Device sync imports all of its keys, available legacy history (already capped by old versions), the current saved game and the saved-game library (up to 50 existing slots).
- `daily-cross:answer-exclusions:v1` stores an untruncated union locally. Deleting a library item does not remove its exclusions. Damaged exclusions/ledgers are not silently cleared.
- `crossword:answer-history:v1` is a Redis hash of answer to reservation owner or `imported`, with no TTL. Import uses HSETNX so it cannot destroy an in-flight reservation's retry identity.
- On the first sync, a checkpointed SCAN recovers existing shared-room current puzzles, available recentRounds and legacy usedAnswers. It never uses KEYS or changes room data. Four pages are processed per API request. Multiple requests continue a larger scan.
- All recognized archived/current-bank answers are preserved conservatively, including older answers from before v2.19.0. This is deliberately a superset of words used since the last update; no timestamp filter guesses at missing historical data.
- Every browser/device must reopen the updated app online. Its storage is inaccessible to another device until uploaded. Clearing local storage before sync can lose unuploaded history; already uploaded answers survive in Redis.

## Generation transaction

A Web Lock serializes tabs on one origin. The app captures local history, syncs server history, passes permanent exclusions to both prepared selection and CSP, then re-syncs and validates before committing. Solo publication atomically claims all answers in one Lua operation. Racing devices cannot both reserve an answer. An identical reservation retries safely after a lost response. A failed claim cannot publish a puzzle.

Shared games keep the same lobby/session and generation lease. Their replacement Lua script checks and reserves answers in the same operation as changing the room. Old rounds, concurrent solo reservations and lost-response retries are fenced. Hosting or reopening an existing puzzle remains allowed; its original progress/clues are preserved and its answers are registered for future exclusion. Existing rolling metadata remains compatible.

The registry contains answers only; it does not expose letters entered, identity, room tokens or clue progress. The same-origin API accepts bounded imports of known vocabulary. Like this app's public shared/theme tools, it has no account authorization; anyone using this installation contributes to the common history. An unrelated-player/account product would need scoped histories and authentication before using this policy.

## Failure and capacity

New games require online Redis history. Existing games remain playable when offline. Never silently clear history, reuse an excluded answer, relax clue/difficulty constraints, or replace a current game on error. A server reservation can conservatively remain consumed if a later browser write fails or a client disconnects before display; releasing it could reintroduce a played answer after an uncertain outcome.

The 1,520-answer bank and 64 Hard packets are finite. Permanent exclusions can exhaust prepared inventory, make a layout unfillable, or exhaust the eligible bank. CSP may supply an eligible alternative within its existing bounded budget; success is not guaranteed. A future edited bank must be checked against this registry. A different clue does not make a used answer eligible.

## Recovery limits and verification

Expired Redis rooms, answers rolled out of their five-round metadata, deleted device data and library items deleted before capture cannot be reconstructed unless another surviving device ledger/save still contains them. This release does not claim a complete historical census. Open every participating device before rebuilding the bank.

Tests cover complete-ledger/library recovery, no mutation of saved games, persistent exclusions after deletion/reload, failed network/storage, post-five-round exclusions, prepared/CSP filtering, exhausted supply, atomic competing reservations, idempotent retries and shared/solo races. See docs/testing.md for actual release results.
