# Play together

Open **··· → Play together → Create game link**. Send the link to another player. They open it on their device; both players can type, erase, clear words and use hints on the same crossword. Each player can select a different clue and use their own zoom. Changes normally appear on the other device in about a second, plus network latency.

Tap the **Playing together** strip to copy or share the link again or leave. Anyone holding the link can edit; send it privately. Links expire seven days after creation. To start another puzzle, leave the shared game first. Leaving normally returns to the previous solo save. Shared progress remains in the room until expiry; reopening the link resumes it. Joining does not replace the browser's solo save. Shared answers are reserved in the existing dated ledger so future solo generation still avoids recently seen answers; reloading does not increment the game counter.

Different-square edits merge. If two people edit the same square, the last edit received by the server wins. Undo only reverses your own changes on squares that have not subsequently been changed by another player. Hints keep the shared solve marked as assisted even after undo.

The status strip shows saving or reconnecting when edits have not reached the server. Keep the page open until saved. Pending operations are retained in this tab's sessionStorage when permitted, so refreshing can retry. Closing the tab can lose unsent changes. Seven-day room expiry is fixed and is not extended by polling. If a room ends with pending changes, **Keep a solo copy** preserves the visible board locally where storage permits.

## Vercel setup

1. Add an Upstash Redis database from the Vercel Marketplace and connect it to the crossword project you use.
2. Verify a complete pair of server environment variables is set for Production (and Preview if wanted): either `KV_REST_API_URL` and `KV_REST_API_TOKEN` from Vercel Marketplace, or `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from Upstash. Complete Upstash credentials take precedence; pairs are never mixed. The read-only token cannot save edits. Do not use `NEXT_PUBLIC_` names.
3. Redeploy the project, then create a link and open it on a second device. Type and delete from each device; reload each and confirm progress.
4. If both `crossword` and `crosswordapp` should accept the same room tokens, connect the same database to both projects and redeploy both. Otherwise use links on the original project's host.

Solo play needs no database. If Redis is not configured or reachable, the app reports sharing unavailable and keeps the solo game.

The app uses Redis commands `GET`, `SET`, `EVAL`, `EXISTS`, `PTTL`, `INCR`, `EXPIRE`. Lua performs atomic cell updates and deduplication. Do not replace this with a process-local Map, local filesystem or non-atomic read/replace operation on Vercel. The official REST command-body format is documented at https://upstash.com/docs/redis/features/restapi.

## Data and limits

Only the supplied puzzle, answers, assistance flag, revision, per-cell writer IDs and expiry are stored. Selection stays local; UI Studio colours are shared globally through the same database. Redis room keys hash the link token. Operation deduplication keys expire with the room. API responses use private/no-store caching and do not include credentials. There are no accounts, participant names or online-presence indicators. Automatic polling makes service requests while the shared page is open; provider plan quotas apply.
