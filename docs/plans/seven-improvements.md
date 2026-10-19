# Seven solving improvements

Baseline: `6b59113`. Deliver v2.11.0 as one release with saved games, reviewed clue alternatives, scoped checks, optional timing/completion summary, responsive clue sidebar, personal solving preferences and named multiplayer presence.

Use existing lib/components architecture and colocate new domain logic/UI under features/library, features/solve and features/players. Preserve current repeat protection, solo progress, public UI Studio saves and shared-session identity across rounds. Additive Redis fields/keys need no destructive migration. Do not replace the engine or copy Vox content.

Verify stored-game migration, library filtering/restoring, keyboard policy, granular checks, timer completion/reset, idempotent metrics, membership/presence TTL and two-player round continuity with real Redis. Run the complete test suite, production build, CSS checks and 300-puzzle audit. Check deployed UI and APIs before reporting completion; record any physical-device limits.
