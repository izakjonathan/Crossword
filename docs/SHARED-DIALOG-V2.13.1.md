# Shared dialog dismissal · v2.13.1

Baseline: v2.13.0, commit deed45d6bacb09514a85d9c161b5b4cf1eab6cac. Reviewed 20 October 2026.

## Reproduction and cause

In an isolated production test lobby, opening All clues returned `clues`. Sending `{modal:null}` to close it returned `clues` again, and the next GET still returned `clues`. The temporary lobby was closed after reproduction. This is the same path as the reported popup repeatedly reopening after Close.

The client optimistically applies a null modal and sends a queued PATCH. Upstash's Lua JSON handling drops null object members while decoding the operation. The Lua view merge therefore receives no modal field and retains the previous `clues` value. Acknowledging the PATCH removes the optimistic close, so the next rendered room reopens the popup. Native Redis preserves the null and did not expose this provider difference in earlier tests.

## Fix

The server validates the original public operation, makes a shallow copy, and encodes explicit null clears for `modal` and `board` as the private Redis sentinel `false`. The existing Lua merge stores that value reliably. Room normalization restores those fields to public `null` in every PATCH/GET response. Missing keys still mean leave unchanged. Unrelated view fields remain intact. The client's queued operation is not mutated, preserving retries and optimistic state.

Public callers still cannot send false for either field. Existing null-based clients and existing lobbies work with this server patch; there is no migration, puzzle reset or membership reset. Shared dialogs still intentionally open on both devices when someone explicitly opens one. Either device can close them for the shared session. Board-view clears receive the same correction because they cross the same nullable boundary.

## Verification

- Live baseline reproduction: open=`clues`, close response=`clues`, next poll=`clues`.
- Two new null-dropping codec regression tests failed against v2.13.0, then passed with the fix. They cover Close, later polls, unrelated updates, reopening intentionally, board clear, immutability, and rejection of public false values.
- An additional real Redis test uses two SharedClient instances: one opens All clues, the other closes it, repeated polling leaves both closed, and unrelated updates do not reopen it.
- `npm test`: 125 passed with disposable real Redis, zero skipped.
- `npm run build`: passed. `LAYOUT_BUILD=1 node --test tests/layout.test.mjs`: three passed. Live verification follows deployment.

No generator, word-bank, input, theme, authentication, cooldown or session-version changes. The production close/poll reproduction will be repeated after release, followed by browser verification. This fix prevents stale retained database state from reopening the popup; an explicit open action by another connected player still opens it by design.
