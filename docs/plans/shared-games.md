# Shared crossword games — v2.10.0

Baseline: v2.9.0, main commit be618255dbaed9fdf9fbda7f5b1a72127a3db36a.

Add a Play together action to the existing controls. Share the current puzzle and answers through a private capability link. Keep selection, zoom and palette personal. Preserve the solo save and existing dated word ledger. A shared room contains one immutable puzzle; leave it to generate a new solo puzzle.

Use Next.js route handlers and persistent Redis through the Upstash REST API. Poll once per second; edits display optimistically and are sent immediately. Apply only changed cells in an atomic Lua script, with server order deciding simultaneous writes to the same cell. A separate per-operation Redis key prevents replay for the full room lifetime. Undo checks writer IDs and cannot erase someone else's newer change. Assistance is monotonic.

Rooms expire seven days after creation. The capability is 256 random bits, carried in the URL fragment and Authorization header; Redis keys contain its hash. API responses bypass caches. Credentials remain server-side. Creation is limited to 30 rooms/hour per forwarded client IP. Payloads are bounded and validated. This is anonymous collaboration by private link, not an account/permissions system.

Offline edits retry and persist in sessionStorage when available. Status distinguishes pending, reconnecting and ended rooms. A refresh reconnects via the fragment. Pending changes block ordinary room departure; expired rooms allow keeping an unsynced solo copy. Local browser storage restrictions may prevent retry persistence across refresh.

Provisioning is a release dependency. Both existing Vercel projects have no storage env vars; the available connector cannot list/install integrations (403), and no authenticated Vercel CLI is installed. Finish code and review first; report the exact setup needed without claiming live collaboration is enabled.
