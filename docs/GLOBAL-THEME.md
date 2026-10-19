# Global UI Studio

Baseline: b0fca5bca65d0edffc5768ec35190507ae2e9b39 (working shared games with Marketplace credentials).

Everyone is allowed to publish a global palette. Open UI Studio, adjust Background/Content, then Save. Preview changes only the editing device. Save writes one permanent Redis record, `crossword:global-theme:v1`; it does not expire with shared games. New clients fetch it, and open clients poll every five seconds plus on focus/visibility changes. All solo and shared games on the same configured database use the palette. The latest server-accepted save wins.

Incoming updates refresh the saved palette while leaving an open editor's preview alone. Cancel restores the latest global palette. Saving a draft deliberately publishes it even if another person has saved since the editor was opened. A monotonically increasing revision, committed atomically with the palette in Lua, prevents delayed GET responses from reverting newer saves.

`app/api/theme/route.js` exposes GET and public PUT. Writes enforce browser-facing origin, JSON size limits, valid six-digit colours and the existing 4.5 contrast minimum. The token remains server-side through `redisCommand`; both Marketplace KV and Upstash credential pairs are supported. No accounts or admin access are required by design. Requests bypass caches. Redis is required for saving; failures keep the draft and show an error, rather than claiming a local save succeeded.

`global-theme-client.mjs` owns polling, revisions and cancellation. `global-theme-store.mjs` owns persistent Redis access. The existing localStorage palette remains a last-known initial-paint/offline cache, not the source of truth. Browser theme metadata, page backgrounds and CSS variables follow the effective local preview/global palette together. A returning device may briefly show its cached palette before the initial request completes.

The current Upstash connection is on `crosswordapp`. The separate `crossword` project needs the same database connected if it should participate. No new service, secret or dependency is required on crosswordapp.

Validation: seven new tests cover two-client propagation, fresh clients, stale responses, failed saves, payload/origin/contrast validation, public API roundtrips and actual Redis persistence/revisions without TTL. Full suite: 91 tests with disposable Redis enabled; production build and three production CSS checks pass. This change does not alter layout or puzzle generation. Browser downloads remain unavailable, so actual browser/iPhone UI checks are not claimed.
