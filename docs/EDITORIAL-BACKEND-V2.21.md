# Editorial generation and publication · v2.21.0

Baseline: v2.20.0 / 9f3f93f2a5efee41455200ce120266a74453c789. This release separates content acceptance, scored construction, independent puzzle checks and publication. Existing engine-v3 saves and persistent room identities remain compatible.

## Content and provenance

The active catalog has 1,643 answers: the previously accepted 1,520-answer replacement plus 123 original everyday phrases/household answers. Thirty explicit alternative senses add new clue options, including harder clues for familiar phrases. The TRAVIS relationship clues were replaced by first-name identification supported by the Chiefs' official player record. Entertainment remains 384 answers (23.37% of the bank); every new grid retains the 20–35% entertainment share and 25% abbreviation ceiling.

Each record has an answer ID, display and normalized grid forms, language/region, familiarity and desirability; separate meaning IDs with grammatical information; clue IDs, levels, explanations, evidence links and revisions; and recorded status and review provenance. Multiple clues at one demand tier are supported, with seeded selection among approved variants. New or changed wording is identified by content, so an old review does not automatically approve a changed draft.

`features/editorial/schema.mjs` validates records and compiles only approved answers with an approved direct clue and approved linked meanings. Low-score, draft, review, rejected and quarantined records cannot enter the eligible pool. Ordinary Latin diacritics, spaces, apostrophes and hyphens have explicit normalization rules. Digits, unsupported scripts and arbitrary punctuation are rejected rather than silently discarded.

Legacy acceptance is deliberately visible. **1,519 unchanged records retain prior-release acceptance**, with a frozen list of accepted clue hashes in `legacy-acceptance.json`. Their meanings are imported from distinct clue contexts; inferred/unspecified grammar is marked as needing semantic review. They are not newly certified definitions. The 123 new records and the TRAVIS correction have assistant editorial reviews, not independent human certification. The new review manifest records all eight rubric checks and honestly marks independence false. Difficulty tiers remain provisional. This infrastructure does not magically establish that every inherited clue is excellent.

No publisher clue corpus or unlicensed word-list download is added. New phrases and clues are original assistant-authored text; the primary sports reference supports a factual identification, not copied clue wording. Raw WordNet additions remain archived and quarantined. All active answers remain disjoint from the retired 5,730-answer bank.

## Editorial workflow

Canonical sources are `data/replacement`, `data/editorial/additions.mjs`, `decisions.json`, the frozen legacy acceptance and content-specific reviews. Generated `source-data.mjs` is rebuilt with `npm run editorial:build`.

- `node scripts/editorial.mjs audit` checks the catalog and reports inherited acceptance.
- `node scripts/editorial.mjs brief ANSWER` exports a structured AI drafting brief, linked meaning/grammar and the basis of its supporting context. Inherited context is labelled rather than presented as independently verified evidence.
- `node scripts/editorial.mjs check-draft FILE` checks a supplied JSON draft. It never approves it. Evidence must belong to the answer record; unknown meanings/evidence and leaked/duplicate wording fail.
- `node scripts/editorial.mjs review FILE` requires an explicit reviewer, reason, timestamp, decision and all eight affirmative rubric checks for approval. It writes a reviewed record with revision history. Independence is an explicit declaration, never inferred from different labels.
- `node scripts/editorial.mjs import-reviewed FILE` validates and imports a reviewed record (and optional additional sources) under `data/editorial/reviewed`. This is a local versioned source change, not an unauthenticated production edit.
- Increment `decisions.json`'s version, rebuild the catalog and prepared inventory, run checks and commit the reviewed change. Automatic generation does not approve AI proposals or change production clues.
- `node scripts/editorial.mjs candidates '.A..E'` searches approved positional matches. `priorities HEALTH.json HISTORY.json` ranks recorded failing patterns and counts eligible matches after history exclusions, guiding the next content batch.

No model API key or paid drafting service is required. The app uses the compiled catalog, not live unchecked model output. Drafts from an external model can use the same brief/check/review/import process.

## Scored CSP and geometry

The filler keeps length/position indexing, all-different answers, crossing propagation, AC-3/MAC, minimum remaining values, degree tie breaking, centre preference and support-aware value ordering. The background path additionally ranks desirability and retains the best of up to three accepted fills within the node/time budget. Each retained fill carries its own accepted clue assignment; later alternatives cannot accidentally attach their clues to a different best fill. Familiarity, clue demand and crossing support remain distinct inputs.

Quality scores reward approved desirable fill and subject variety and penalize abbreviations and simple repeated-root families. These are explicit app heuristics, not learned human enjoyment scores. Search failures expose shortage, empty-domain patterns, search exhaustion, timeout, editorial rejection and worker failure separately. Diagnostics sample at most forty pattern events per attempt and batch their counters; they are not a complete trace of every failed branch.

The HTTP event loop does not run the CPU search. `worker_threads` executes background CSP with a hard parent timeout as well as cooperative search deadlines. Easy/Medium attempts use up to two seconds and Hard up to four, inside a shared job budget. Worker sources/dependencies are explicitly traced into both Vercel functions.

The existing symmetric partially checked quick grids remain the playable default. Named American 15×15 profiles implement fully checked letters, 16% blocks and 78/72-word ceilings for validation; they are **not** claimed as the current 9/11/13 game format. Existing field-count, minimum-length, connectivity, numbering, symmetry, no-solid-block and crossing-fairness rules remain independently checked.

## Inventory and publication

`lib/ready-puzzles.mjs` initially contains eight packets per difficulty, prepared offline with the protected 168-answer migration snapshot. Preparation writes the destination only after a complete inventory validates. Reuse rechecks active clue text/revisions and convention metadata; changed or protected packets are discarded. The initial 24 packets cover 520 distinct answers. Future inventory must be evaluated against live history, not assumed fresh from this seed count.

`GET /api/puzzles` reports approved/eligible answer counts by length, usable ready counts and generation diagnostics. `POST /api/puzzles` accepts a mode and UUID request identity; a shared request also needs the existing room capability and live generation lease. It serves a ready, independently checked packet. There is no synchronous CSP fallback inside the HTTP selection path.

The independent publisher checks grid validity, named geometry, exact active clue identity/revision/convention/rating, approved meanings, duplicate clues, complete-answer leakage into other clues, subject concentration and permanent freshness. A canonical SHA-256 digest pins the puzzle content; receipts preserve the actual words and clues independently of later catalog edits. This is deterministic editorial screening, explicitly marked `humanTestSolved:false`.

Selection protects future supply before using quality as a tie breaker. It examines compatible inventories across all modes and a bounded search for further disjoint packets, preventing a locally attractive choice from immediately starving Hard after mixed-mode play. This is a finite-horizon heuristic, not an endless-supply guarantee.

A Redis Lua transaction checks all answers, reserves them in the permanent history and stores the publication receipt atomically. Lost-response retries return the same receipt without consuming a second game. Separate UUIDs cannot reserve the same answer. Already played answers never become eligible because their clue wording changed. The legacy public answer-only claim endpoint now asks old clients to refresh.

New solo games record the server's already-reserved publication locally without treating its own reservation as a conflict. Shared replacement verifies its receipt and scope, then uses the authoritative stored puzzle. The existing room transaction accepts that lease's reservation and keeps membership, room identity, expiry and round fencing. Old saved/hosted games remain accessible; creating a new published game uses the new service.

## Automatic replenishment and operational limits

After selection, Next.js `after` starts a bounded background replenishment. A fenced Redis lease prevents overlapping jobs; each valid packet is committed separately and checked against history again. Sequence numbers, duplicate detection and the persistent inventory make retries safe. Partial success survives a later timeout. The default goal is eight currently usable packets per mode, not eight guaranteed future mutually disjoint games.

A daily 04:00 UTC Vercel cron calls `/api/puzzles/replenish`, authenticated with a production-only secret. The endpoint fails closed without that credential. Scheduled jobs use up to forty-five seconds; selection-triggered work uses twenty. No new paid queue or relational service is required. `after` and cron are retry opportunities, not a promise that every platform interruption is automatically replayed immediately; the next selection/daily job resumes from committed stock.

If compatible stock is empty, the client keeps the same request identity and waits, within its thirty-second deadline, while a background job works. It does not start duplicate games or clear the current board. If search cannot replenish in time, the current game remains available and the app reports the shortage. A finite bank with permanent exclusions still eventually runs short. Neither geometry, clue quality nor exclusions are silently relaxed.

## Feedback and calibration

New published games offer **Report this clue** in Puzzle controls. Reports are validated against a real publication and clue, rate-limited and stored for thirty days. Aggregate check/wrong/hint and completion events use event IDs to deduplicate retries (seven-day deduplication). No typed letters or raw IP addresses are stored; address hashes only enforce a short-lived rate limit. These public-installation metrics are observational and can be noisy.

Active-time measurement excludes hidden-tab time but cannot identify every distraction. Reports, wrong-check totals, hints and sample size can flag a clue for review. They do not automatically rewrite the bank or assign statistically validated difficulty. Review tools, static editor checks and human/assistant editorial judgment remain separate from solver performance.

## Verification and limits

See testing.md for actual checks. Validation includes schema/approval gating, multiple meanings/tiers, score-based backtracking, standalone Node workers, immutable digesting, real Redis publication races/refills and shared-room replacement, plus a built Next.js HTTP flow through a disposable Redis REST adapter. Historical saves and the permanent registry retain their existing identities. Every device must still open online to contribute local-only historical answers; missing deleted/expired history cannot be reconstructed by this release.
