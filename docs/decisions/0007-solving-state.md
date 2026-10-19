# Local archives and server-owned shared solve state

The saved-game library and navigation preferences belong to each browser. Shared entries are snapshots; Join resolves the live session's current round, while Solo copy is explicit. No account or globally browsable private archive is added.

Shared timing and counts belong to the room and update inside its existing atomic, idempotent Lua transaction. Time is elapsed wall time rather than attempting to infer group activity from unreliable mobile background timers. Displaying/hiding time is personal. New rounds reset stats and retain lobby identity.

Player aliases and last-seen times use an additive expiring hash beside existing membership. Heartbeats require existing membership; stale heartbeats never recreate closed lobbies. Names/statuses are shown to joined participants, while public discovery retains only lobby name and joined count.
