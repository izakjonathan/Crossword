# Crossword puzzle · v2.22.0

A mobile-first Next.js crossword app with solo saves, discoverable shared lobbies, a global two-colour UI Studio and a versioned editorial publication backend.

Production: https://crosswordapp.vercel.app/ · Repository: izakjonathan/Crossword.

## Play and saved games

- Easy 9×9, Medium 11×11 and Hard 13×13 quick crosswords, with symmetric blocks, connected entries, minimum three-letter answers, at least half of each answer checked and no consecutive unchecked letters. These are not fully checked American publication grids.
- Tap a square or clue to select; tap a selected crossing to switch direction. QWERTY controls support typing, deletion and undo. Typing advances one square even when the next square already contains a letter.
- Small All clues button, separate hint/check controls, optional timer/preferences and a saved-game library. Old games retain their original grids, clues and progress.
- Home-screen layout leaves safe-area space below the custom keyboard. Apple Pencil input is not included.

## Shared play and colours

Players can host a named lobby, discover it on another device, join and explicitly leave. Letters, deletions, selection, clue direction, checks and shared dialogs synchronize through Redis. Creating a new game changes the puzzle inside the existing session; joined players stay together. Round fencing rejects late edits from an earlier puzzle. Original room capabilities, membership and expiry remain intact.

UI Studio changes the background and content colours for everyone. Local preview/cancel remains immediate; validated saved colours synchronize through the server. Do not put Redis credentials in browser code.

## Answer and clue backend

The active catalog contains **1,803 approved answers**, including the 123 everyday additions and 19 newly sourced recent entertainment answers and 227 fresh everyday short answers. Entertainment accounts for 317 answers; every generated grid requires 15–35% entertainment and at most 25% abbreviations. Every active answer remains absent from the archived 5,730-answer bank.

Answers, display forms, normalized grid forms, meanings, grammatical information, clues, evidence, assessments and revisions are separate linked records. New/changed content must match an explicit review decision before entering generation. Low-quality, draft, rejected, quarantined or unapproved meanings/clues stay outside the pool.

**Review limits:** 1,519 unchanged records retain documented prior-release acceptance. Their migrated meaning/grammar metadata is flagged for further semantic review. New content and the TRAVIS correction were reviewed by the assistant, not independently certified by human editors. Difficulty ratings remain provisional. Automated checks do not prove that every clue is natural, factually correct or universally fair.

New-game requests load immutable ready puzzles from the server. Scored MAC/CSP runs off-thread during preparation and replenishment. An independent publisher checks structure, active clue revisions, geometry, crossing fairness, subject concentration, clue leakage and freshness before accepting a packet. There are initially eight ready packets per difficulty. Compatible-stock planning protects future choices across modes.

After selections, fenced background jobs replenish usable stock. A protected daily 04:00 UTC Vercel job provides another retry opportunity. Clients wait with the same request identity during bounded refill; failures keep the current board. A finite bank cannot supply unlimited permanently unique games.

See [the backend design, source workflow and limitations](docs/EDITORIAL-BACKEND-V2.21.md).

## Permanent answer exclusions

All recoverable device ledgers, legacy history, saved libraries/current games and surviving shared-room history are merged into non-expiring exclusions. Each device must open the updated app online to contribute local-only history. Deleted or expired history cannot be reconstructed without another surviving record.

Publication atomically reserves answers and a receipt. Repeated requests return the same puzzle; different requests cannot consume the same answer. Shared replacements verify the publication's room/lease and use the authoritative stored snapshot. Changing a clue does not make a used answer new. Existing games remain playable; new games require online synchronization. See [repetition policy](docs/REPETITION.md).

## Editorial operations

```bash
npm ci
npm run editorial:build
npm run editorial:audit
node scripts/editorial.mjs brief TRAVIS
node scripts/editorial.mjs candidates '.A..E'
node scripts/editorial.mjs check-draft /path/to/draft.json
node scripts/editorial.mjs review /path/to/review-request.json
node scripts/editorial.mjs import-reviewed /path/to/reviewed-record.json
```

The reviewed import is a versioned source change, not a production write. Increment the catalog revision, rebuild and independently revalidate the inventory before releasing content changes. AI drafting briefs preserve meaning, grammar and evidence context; model output is never approved automatically. No model API key or publisher clue corpus is required.

Prepare all difficulties against an exported current exclusion snapshot:

```bash
node scripts/prepare-inventory.mjs --history=/path/to/history.json
```

`history.json` contains an `answers` array from the existing answer-history sync API. `--reuse` independently rechecks compatible existing packets. Failed preparation retains the previous complete inventory. Generation diagnostics and `editorial priorities HEALTH.json HISTORY.json` identify scarce lengths and failing letter patterns.

## Feedback and calibration

Published games offer Report this clue in Puzzle controls. Reports and aggregate hint/check/completion events are validated against publication receipts and deduplicated. Free-text reports expire after thirty days; short-lived address hashes enforce rate limits. Typed letters and raw IP addresses are not stored in these metrics.

Sample-size and error/hint/report indicators flag editorial review. They do not automatically rewrite clues or certify difficulty. Active time excludes hidden-tab time but cannot identify every distraction.

## Development and verification

Node 24.x is configured. No new dependency was added for the editorial backend.

```bash
npm run dev
npm test
npm run build
LAYOUT_BUILD=1 node --test tests/layout.test.mjs
npm run audit:puzzles
REDIS_TEST_CLI=/path/to/redis-cli npm run verify:backend
```

Real Redis tests require disposable local Redis binaries. The HTTP verifier starts its own local Redis and REST adapter; it never connects to production credentials. Tests cover catalog gating, multi-sense clues, scored backtracking, worker deadlines, immutable receipts, publication races/refills, saved games, shared round replacement and feedback. There is no configured lint or standalone typecheck script.

See [testing evidence](docs/testing.md), [architecture](docs/architecture.md) and [development workflow](docs/development-workflow.md). Historical release documents remain under docs and CHANGELOG.md.

## Deployment configuration

Vercel builds main using the existing Next.js project. Redis uses a complete server-only pair:

- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, or
- `KV_REST_API_URL` and `KV_REST_API_TOKEN` from the Marketplace integration.

`CRON_SECRET` authenticates scheduled replenishment; never expose it as a NEXT_PUBLIC variable. The production scheduler credential was configured for this release. The endpoint returns 401 when authorization is missing or incorrect. `next.config.mjs` includes the ESM worker sources in the relevant function traces. `vercel.json` schedules the daily job.

Do not reset the permanent history, replace existing publication receipts, or fall back to unchecked client-generated puzzles when stock is empty.

## v2.22 audience and topic policy

New games use a clue-level pop-culture allowlist: familiar older associations or explicitly selected references from 2010 onward. Fame alone does not approve obscure biographical trivia. The active pool contains 1,803 answers, including 317 pop-culture answers; other records remain preserved for saved games and editorial work. Easy/Medium permit at most two capital clues, Hard four; every mode permits at most two sports clues. Limits are checked during clue selection and independently before publication. Difficulty profile v3 removes compulsory uncommon vocabulary; Hard keeps at least 50% challenging clues and at least one tier-3 clue with a minimum clue mean of 1.50, allowing approachable footholds instead of forcing excluded trivia. Versions 1 and 2 remain readable with their original profiles. Permanent answer exclusions are preserved.
