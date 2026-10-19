# Play together

Open **··· → Play together**, name the lobby and press **Host this game**. On another device, open the same app address, choose **Play together** and press **Join** beside that name under **Available games**. No link is required. Hosting publishes the game to everyone using this app. See [lobby details](LOBBIES.md).

Both players can type, erase, clear words and use hints on the same crossword. Devices follow the active clue and square, clue-list direction, gameplay dialogs, checks, zoom and board movement. Changes normally appear on the other device in about a second, plus network latency.

Either player can press + and choose a difficulty to start another puzzle for everyone without leaving the lobby. Refreshing or reopening automatically rejoins the current round until **Leave shared game** is used. Tap **Playing together** to see the lobby name and leave. Leaving restores that device's previous solo save; other players continue. The lobby disappears after its last explicit leave, or its fixed seven-day expiry. Joined counts include devices currently away. Browser storage must be available for automatic reconnection. Legacy private links still work and are not automatically listed.

Joining does not replace the browser's solo save. Shared answers are reserved in the existing dated ledger so future solo generation still avoids recently seen answers; reloading does not increment the game counter.

Different-square edits merge. If two people edit the same square, the last edit received by the server wins. Undo only reverses your own changes on squares that have not subsequently been changed by another player. Hints keep the shared solve marked as assisted even after undo.

The status strip shows saving or reconnecting when edits have not reached the server. Keep the page open until saved. Pending operations are retained in this tab's sessionStorage when permitted, so refreshing can retry. Closing the tab can lose unsent changes. Seven-day room expiry is fixed and is not extended by polling. If a room ends with pending changes, **Keep a solo copy** preserves the visible board locally where storage permits.

## Vercel setup

1. Add an Upstash Redis database from the Vercel Marketplace and connect it to the crossword project you use.
2. Verify a complete pair of server environment variables is set for Production (and Preview if wanted): either `KV_REST_API_URL` and `KV_REST_API_TOKEN` from Vercel Marketplace, or `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from Upstash. Complete Upstash credentials take precedence; pairs are never mixed. The read-only token cannot save edits. Do not use `NEXT_PUBLIC_` names.
3. Redeploy the project, then host a named lobby and join it from a second device. Type and delete from each device; reload each and confirm progress.
4. If both `crossword` and `crosswordapp` should accept the same room tokens, connect the same database to both projects and redeploy both. Otherwise use links on the original project's host.

Solo play needs no database. If Redis is not configured or reachable, the app reports sharing unavailable and keeps the solo game.

The app uses Redis commands `GET`, `MGET`, `SET`, `EVAL`, `EXISTS`, `PTTL`, `PEXPIRE`, `INCR`, `EXPIRE`, `SADD`, `SREM`, `SCARD`, `ZADD`, `ZREM`, `ZREMRANGEBYSCORE`, `ZREVRANGEBYSCORE` and `DEL`. Lua performs atomic cell updates and deduplication. Do not replace this with a process-local Map, local filesystem or non-atomic read/replace operation on Vercel. The official REST command-body format is documented at https://upstash.com/docs/redis/features/restapi.

## Data and limits

Rooms store the supplied puzzle, answers, assistance flag, revision, per-cell writer IDs, expiry and shared view. Discoverable lobbies additionally store a name, timestamps, a room reference and hashed device memberships. The active selection, gameplay dialogs, check highlights, clue direction and board view are shared. UI Studio colours remain global, while its in-progress preview and the lobby dialog stay on the editing device. Redis room keys hash the link token. Operation deduplication keys expire with the room. API responses use private/no-store caching and do not include credentials. There are no accounts, named player profiles or online-presence indicators. Lobby counts reflect joined browser identities. Automatic polling makes service requests while the shared page is open; provider plan quotas apply.

## Successive puzzles and safe reconnection

Rooms now support successive rounds. The server grants a 45-second generation lease to one participant, validates the replacement puzzle, rejects repeated answers from the session and resets answers/checks/undo for the new round. The room token, lobby identity and original seven-day expiry stay unchanged. Both devices see generation status. Failed generation cancels the lease and retains the previous puzzle; a crashed participant cannot hold the room forever.

Every edit includes its round identifier. Late/offline edits from an earlier puzzle are rejected and never replayed into the new grid. Their pending data is retained in a previous-round sessionStorage backup when browser storage permits. Reloading a joined session opens the current round, not the first puzzle. Both players should reload once after this update to use the new protocol.

Typing now advances exactly one square, including filled crossings; typing on a filled square replaces its letter. Clue selection starts at its first square. Backspace, hints, clear and guarded own-edit undo remain available.
