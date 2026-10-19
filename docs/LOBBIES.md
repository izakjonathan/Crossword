# Discoverable shared lobbies

Baseline: main `674f8535760344639358a834bf84881972c141c6`. No dependency or database-install change is required.

## Use

1. Open the same app address on both devices: https://crosswordapp.vercel.app.
2. On the first device, open **··· → Play together**, choose a recognisable lobby name and press **Host this game**. The current board becomes publicly discoverable. No link is needed.
3. On the other device, open **··· → Play together**, find the name under **Available games** and press **Join**. The list refreshes every three seconds while open.
4. Both devices can type, delete, change selection, use hints and use **+** to create the next puzzle. The session and lobby identity remain the same across new puzzles. Every operation retains the existing round fencing and generation lease safeguards.
5. Reopening or refreshing the app automatically rejoins the remembered lobby and loads its current puzzle. Closing a tab does not leave. Browser storage must be available; clearing site storage loses the saved device identity and automatic reconnection.
6. Use **Playing together → Leave shared game** to disconnect that device and restore its previous solo save. Other joined devices continue. After the last explicit leave, the lobby closes and disappears. Expiry is fixed at seven days from hosting, even if devices remain joined.

Joined counts refer to browser identities, including devices currently away; they are not online-presence counts. Tabs in the same browser profile share one identity. Different profiles count separately. There are no accounts, owners with extra powers, passwords or private lobby names. Anyone on this app can discover and join a hosted game; choosing Host is the explicit publication step. Existing private capability-link rooms are not indexed automatically and their legacy links still work.

## Storage and races

`/api/lobbies` GET returns up to 50 recent unexpired lobby names, IDs, timestamps and joined counts. It never returns room capability tokens or player identities. POST supports host, join and leave. A successful join returns the existing room token and current room snapshot. Body bounds, same-origin writes, validation and server-only Redis credentials are retained. Hosting uses the existing per-IP room creation limit.

Redis uses an expiry-scored lobby index, a metadata key and a membership set of SHA-256 browser-identity hashes. Metadata/membership TTLs match the room's remaining fixed lifetime. Lua makes registration, idempotent joins and last-member cleanup atomic. A join racing the final leave either joins before closure or receives a recoverable unavailable response. A failed leave leaves the local session connected and offers retry. Closing the public lobby does not delete the underlying expiring room or interrupt another private capability holder. Expired/missing metadata is pruned from discovery.

Active-session metadata and a stable random UUID are saved under separate versioned localStorage keys. They do not replace the solo puzzle save or dated answer ledger. Round replacement updates the room in place, so remembered lobby membership always resolves to the current round. Unsent edits remain governed by the existing per-tab queue and old-round backup behavior; closing a tab before changes save can lose those unsent edits.

## Verification

- 103/103 source tests passed with a disposable real Redis instance; none skipped.
- Real Redis coverage includes public discovery, token/identity non-disclosure, duplicate joins, two joined identities, writing/deleting, rejoining after round replacement, matching TTLs, leaving one player without affecting the other, idempotent leave, last-player closure and stale index cleanup.
- Session-helper tests cover saved identity, reload metadata, explicit clearing and preservation of solo data. API tests cover forwarded origins, cross-origin rejection, invalid bodies, names and identities, request size bounds and fresh response caching.
- Production Next.js build passed; 3/3 production CSS checks passed; 300/300 fixed-seed audit puzzles passed across all difficulties.

Physical two-device browser interaction, iPhone gestures and pixel-level comparisons are not certified by these API, store and client tests. The app synchronises gameplay state; each device renders it for its own screen. UI Studio preview, the lobby dialog and browser controls remain local. Saved UI Studio colours remain global.
