# Continuous play and dictionary expansion · v2.16.0

Baseline: v2.15.0, d4c6ad207bca0a2827bfab0235e4ecba1d279709. User approved replacing the seven-day AND twenty-game restriction and shared-session lifetime blacklist with a rolling five-puzzle policy, alongside expanding the vocabulary.

## Recovery and repeat policy

Only answers from the latest five puzzles are hard exclusions. Unused answers are attempted first; if those cannot form a valid puzzle, oldest eligible answers are introduced in progressively larger pools. Waiting for a date or generating twenty other games is no longer necessary. Repetition within one puzzle remains forbidden, and the five protected puzzles are never silently relaxed.

The existing ledger key, complete seen-word history and save schema are retained. A bounded recentRounds array records actual round boundaries. Legacy dated ledgers recover identifiable recent game groups; undated/game-zero imports remain seen-word preferences instead of blocking an entire vocabulary. The current saved puzzle is reserved during migration. Corrupt histories and failed storage writes still stop generation, preserving the current game.

Shared rooms now store the same five-round window. The server checks proposed puzzles against that window, and Redis atomically appends/trims it while preserving room token, lease fencing, membership, revision, expiry and edits. usedAnswers remains a compatibility field containing the window's flattened answers. Existing rooms without round metadata migrate from their current puzzle; their historical lifetime blacklist is not reinstated. Shared generation and its local ledger commit use the same room history so different personal histories cannot reject a valid shared replacement.

## Expanded bank and provenance

The bank grows from 1,910 to 5,730 answers. The 3,820 additions use direct definitions adapted from Princeton WordNet 3.0. Selection used wordfreq 3.1.1, a minimum English Zipf frequency of 3.4, alphabetic standalone forms of 3–11 letters, canonical lemmas, and filters for unsuitable categories, proper names, marked slang/obsolete meanings, answer giveaways, combining forms, excessive clue length and same-length clue collisions. Definitions use the first semicolon-delimited sense segment and initial capitalisation; each record retains its WordNet sense identifier and source URL. No live dictionary API, credentials or paid service is needed.

New entries have provisional vocabulary band 2 and only a direct tier-1 clue. They do not receive fabricated harder variants or specialist ratings. Frequency is a screening aid, not evidence of human difficulty. Automated checks and targeted screening do not amount to independently editing or fact-checking all 3,820 definitions. Existing authored alternatives, specialist safeguards and difficulty quotas remain mandatory; the larger total is not a promise of an equally large Hard-qualified pool. Further editorial refinement remains useful.

The supplemental selection is distributed under CC BY-SA 4.0 with WordNet's notice and wordfreq's complete credits. This applies to the supplemental data, not the original authored bank or application code. Public licence files and a Word sources link in Solving preferences make attribution accessible. See public/licenses/sources.html.

## Generation and errors

The CSP/MAC constraints and grid rules remain enforced. To avoid putting thousands of extra direct definitions into every domain at once, each seed selects up to 16 supplemental answers per length initially, widening to 32 and 64 as search proceeds. Seeds rotate that selection through the full supplemental vocabulary; the authored pool remains available subject to history. A bounded request does not enumerate every supplemental answer. Global distinct-word capacity checks reject layouts whose available vocabulary/clue bands cannot meet their required quotas before spending time on filling.

Too few eligible answers and failure to find a valid grid within search limits now have different messages. Budget exhaustion does not prove that no English fill exists. The existing worker deadline still protects the UI; occasional generation failures remain possible. Current progress is preserved on failure. New IDs use mac2 and a new regression fixture; earlier saved puzzles retain their own grids, answers and IDs.

## Verification

Focused tests cover five intervening games, migration from a fully seen legacy bank, retaining more than 500 seen words while bounding exclusions, storage failures, concurrent generators, and distinction between pool exhaustion and search failure. A real Redis integration test seeds an old lobby with the entire bank blacklisted, migrates it through six new rounds, checks protection and the bounded window, and then accepts a cooled-off original puzzle. Dictionary provenance, direct-only variants, existing geometry/editorial safeguards and saved-game compatibility are checked too.

Release verification passed: 136 tests (including real Redis integration), production build, three built-layout checks, and all 300 audited puzzles. All 3,820 supplemental definitions matched their recorded WordNet senses in the offline provenance check. An 18-game Easy/Medium/Hard continuous-play run started with all 5,730 answers already seen and completed with zero protected repeats; the final exclusion window remained five rounds. Recorded generation times ranged from 502 to 15,852 ms on this test machine. These results do not guarantee every seed completes within the worker deadline or represent mobile performance. See the adjacent JSON reports. The test runner limits concurrency to two files because the larger dictionary increases memory use; an earlier unrestricted run terminated a test worker without an assertion trace. No production dependency was added for the dictionary or Redis testing. No standalone lint/typecheck scripts are configured.

Sources: https://wordnet.princeton.edu/license-and-commercial-use ; https://www.nltk.org/howto/wordnet.html ; https://github.com/rspeer/wordfreq .
