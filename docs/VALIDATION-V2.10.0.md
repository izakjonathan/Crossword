# Shared games validation — v2.10.0

Baseline: v2.9.0 / main commit be618255dbaed9fdf9fbda7f5b1a72127a3db36a. Node 24.19.0. No dependency additions or schema changes to existing solo saves.

## Automated evidence

- `npm test` after the feature: 82 passed, zero failures; the one real-Redis integration test skips by default without `REDIS_TEST_CLI`.
- Full `node --test tests/*.test.mjs` with `REDIS_TEST_CLI` against an isolated Redis 7 instance: 83 passed, zero failures/skips.
- `npm run build`: successful production compilation and prerendering; `/api/shared` is dynamic, the root page remains static.
- `LAYOUT_BUILD=1 node --test tests/layout.test.mjs`: 3/3 passed.
- `npm run audit:puzzles`: all 300 puzzles valid across Easy, Medium and Hard. No puzzle generator, editorial bank or checking rules changed.

New tests cover two-client edits/deletions, independent cursors, simultaneous square conflicts, consecutive own-edit undo, preservation of later foreign edits, monotonic assistance, out-of-order responses, failed/lost responses, refresh retry queues, expired rooms, invalid capabilities, origin checks behind a forwarded host, request limits, missing storage configuration, creation rate limits and shared-answer reservation in the dated ledger.

The real Redis integration exercises the actual Lua script, including operation deduplication after another writer changes the same cell, conditional undo, isolation, TTL preservation and room expiry. To rerun it, start disposable Redis, set `REDIS_TEST_CLI` to the redis-cli executable and optionally `REDIS_TEST_PORT` (default 6397), then run `node --test tests/shared-redis.test.mjs`. Never point this at production.

## Production HTTP check

A local production Next server was connected to a disposable Redis instance through a local HTTP adapter using the documented REST command-body protocol. The static HTML rendered without credentials. Room creation, token-based reads, concurrent different-square writes, deletes, duplicate retry handling, missing/invalid capability responses, invalid-cell rejection and private/no-store response headers passed over HTTP.

This exposed the need to compare browser Origin against the browser-facing Host and forwarded scheme rather than Next's internal request URL. The route and regression coverage were corrected, then the HTTP check passed.

## Release limits

Live cross-device play is not yet activated: neither `crossword` nor `crosswordapp` had database environment variables, the Vercel connector returned 403 for integration discovery, and no authenticated Vercel CLI was installed. Connect Upstash Redis and redeploy using docs/SHARED-GAMES.md. The local adapter validates the Redis/HTTP boundary; it does not certify production provider credentials or latency.

Chromium downloads were unavailable in this execution environment, so the new rendered controls and full browser interaction were not verified. Physical iPhone/Safari testing, touch/VoiceOver review and a real two-device smoke test remain outstanding. No claim is made that users are already able to collaborate live.
