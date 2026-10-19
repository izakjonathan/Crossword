# Answer repetition policy · v2.3

The old rolling 500-answer exclusion has been replaced in the app generation path by a versioned ledger retaining each answer's last timestamp, Copenhagen calendar day and generated-puzzle sequence number. It is shared between difficulties and is not truncated to 500 answers.

## Hard rules

1. No answer from the same Copenhagen calendar day may appear again. The day does not depend on the UTC server date or a traveller's changed device time zone.
2. An answer cannot return until at least seven elapsed days and twenty intervening generated puzzles have passed.
3. Every proposed grid is checked against the ledger again before publishing it to the screen.
4. If no suitable grid can be formed without violating those rules, retain the current puzzle and report that generation is unavailable. The finite bank does not justify silently repeating a word.

The Copenhagen zone is deliberate for this app's user. Device clock correctness is assumed. There is no remote trusted clock or cross-device account history.

## Preference order

Within the difficulty's word-length allowance:

- Try never-used answers alone first.
- Add the oldest answers that have rested at least thirty days AND forty intervening puzzles, starting with a small batch and widening it only after unsuccessful arrangements.
- If that cannot form a grid, add the oldest other eligible answers in progressively larger batches, still respecting the hard seven-day/twenty-game minimum.
- Exclude every other answer from the underlying construction engine. The low-level engine now honours its full exclusion set, rather than silently keeping only the latest 500 items.

A candidate pool gets two seed variations; each construction run retains the existing connected-grid validator. Minimum viable candidate counts are kept so scarcity does not result in a malformed puzzle. The oldest eligible candidate pool is prioritised; the exact single oldest answer is not guaranteed to appear, because crossing constraints still determine the grid.

## Transaction and persistence

A Web Lock covers the whole read → worker generation → revalidation → save transaction. Two updated tabs cannot both choose against an outdated ledger. Waiting requests read fresh history after the previous request commits. A worker error or timeout rejects the request and releases the lock. Replies from stale worker requests are ignored. If saving fails, the generated puzzle is not published.

The old undated history is migrated conservatively by treating all surviving legacy records as used today. It is impossible to reconstruct records already discarded by an older version. Restored puzzle answers absent from the ledger are also reserved conservatively. The ledger must be readable; a damaged current ledger is not silently erased.

Web Locks are an origin-scoped coordination API, not a cloud synchronisation service. Updated tabs under the same site origin cooperate. Different Vercel aliases, browser profiles, private sessions and devices have separate storage. Clearing browser data clears the ledger. Old tabs running a previous release should be reloaded to participate in the new policy.

Primary API reference: https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API

## Capacity and tests

The curated clue bank contains 1,242 distinct answers. Difficulty length constraints reduce the eligible pool. It cannot produce unlimited non-repeating puzzles. Under heavy usage, generation will eventually stop rather than break the restrictions.

Tests generate more than 500 distinct same-day answers across all three modes, verify full-history reload and conservative migration, test Copenhagen summer/winter midnight boundaries, verify cooldown preference ordering, exclude all answers to exercise exhaustion, and simulate concurrent generators and failed storage commits. Worker tests exercise both the legacy low-level engine contract and the app's dated-history generation path.
