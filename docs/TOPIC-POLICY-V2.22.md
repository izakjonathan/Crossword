# Familiar language and recent pop culture · v2.22

The user requested fewer capital and sports questions, and pop culture that is very common knowledge or from 2010 onward. New games now use an explicit, text-bound audience selection. A famous answer or an old difficulty label cannot automatically admit a new obscure clue. Familiarity remains a provisional editorial judgment, not a survey or an independent human certification.

## Content

The active pool contains 1,803 answers, including 317 entertainment answers. All 1,889 editorial records remain available for revision and old saves, but 86 answer records lack an audience-eligible direct clue and are quarantined from new generation. The 495 eligible entertainment clue texts are frozen in data/editorial/audience-clues.mjs. New or changed pop-culture text needs an explicit audience selection as well as semantic review.

This release adds 227 unused everyday answers, 62 alternate senses and 19 primary-source-backed recent entertainment answers. Short supply was especially important: the final production snapshot contained 1,969 used answers and very few unused four-letter entries. No history was cleared, expired or relaxed to prepare the new supply. Everyday entries were checked against both the retired 5,730-answer bank and the recoverable production history before admission. Grammatical records distinguish inflections and homographs such as DOES (a verb or female deer), FELL (cut down or dropped) and MUM (a mother or silent).

The original everyday wording and explicit assistant reviews are under data/editorial/short-fill-v222.tsv and data/editorial/reviewed/. They are not copied dictionary clue extracts. Existing inherited-review limitations remain; no automated test certifies that every clue is enjoyable or every solver will find it familiar.

## Puzzle mix and difficulty

Easy/Medium permit at most two capital-related questions; Hard permits four. All modes permit at most two sports questions. The generator prefers other topics, and publication recomputes topics from authoritative selected clue text. An inverse country/capital question counts. A phone battery or Pinocchio's cricket companion does not count as sport. The classifier is an explicit conservative rule set, not semantic AI.

Word-bank profile 2 uses 15–35% entertainment entries and retains the 25% abbreviation cap. This avoids forcing obscure cultural fill into every grid. Version-1 saves retain their original 20–35% profile.

Difficulty profile 3 does not require uncommon vocabulary in Medium or Hard. Medium keeps at least 35% challenging clues and clue mean 1.35. Hard keeps at least 50% challenging clues, at least one tier-3 clue on the current board sizes, and clue mean 1.50. Board sizes, checking, connectivity, symmetry and crossing fairness remain enforced. Hard varies its valid layouts rather than always forcing two 11-letter anchors. Earlier difficulty-version 1/2 snapshots continue to validate under their original rules.

## Publication and supply

Catalog release 2026-11-09.3 uses its own ready-inventory namespace. Receipts, saved games and the permanent global answer registry are retained. The final 24 ready packets (eight per mode) were built and independently validated against the 1,969-answer snapshot, and are checked again against live exclusions at selection and commit. Background manufacturing remains bounded, fenced and retry-safe. A finite permanently unique bank still needs future expansion.

## Primary references

Sources support work identity, date and the precise named association; they do not certify the whole inherited bank or universal familiarity. Individual new records pin their own source URLs.

- Disney animated filmography: https://www.disneyanimation.com/films/
- Frozen: https://movies.disney.com/frozen
- Tangled: https://movies.disney.com/tangled
- Pixar filmography: https://www.pixar.com/feature-films/
- Star Wars character databank: https://www.starwars.com/databank/
- Netflix Sex Education cast: https://about.netflix.com/en/news/sex-education-its-the-final-season
- Disney The Owl House: https://d23.com/a-to-z/owl-house-the-television/
- SZA: https://www.sonymusic.ca/press_release/sza-and-doja-cat
- PSY: https://blog.youtube/creator-and-artist-stories/10-years-of-youtubes-billion-views-club-psy-gangnam-style/
- BTS: https://ibighit.com/legacy/bts/dynamite-en.html
- Jin: https://bts.ibighit.com/eng/discography/jin/detail/astronaut/
- TXT: https://txt.ibighit.com/eng/profile/
- EXO's official artist video: https://www.youtube.com/watch?v=I3dezFzsNss
- Tate McRae: https://www.sonymusic.ca/press_release/tate-mcrae-release-new-single-and-video
- Arya Stark: https://www.hbomax.com/show/4f6b4985-2dc9-4ab6-ac79-d60f0860b0ac/cast-and-crew
- The Handmaid's Tale: https://press.hulu.com/pressrelease/hulu-announces-straight-to-series-order-for-the-handmaids-tale-from-mgm-television/
- Raya: https://movies.disney.com/raya-and-the-last-dragon
- Elio: https://movies.disney.com/elio
- Aloy: https://sonyinteractive.com/en/press-releases/horizon-zero-dawn-global-sales-exceed-26-million/
- Ayo Edebiri: https://www.fxnetworks.com/shows/the-bear/cast/ayo-edebiri-sydney-adamu
- Elle Fanning: https://press.hulu.com/bios/elle-fanning/
- Brian Cox: https://www.hbomax.com/show/a8484031-f244-4661-9fb7-0932bd1ba872/s2

## Release verification

181 tests passed with real disposable Redis and no skips. Production build passed. A full local HTTP run imported all 1,969 protected answers, loaded all three modes, replaced a shared game while preserving membership, tested letter deletion and confirmed background refill (four packets created; Hard available afterward). The first six prepared packets are mutually answer-disjoint, providing two games per mode before later overlapping stock. Empty modes refill against permanent history first; no protected-answer exclusion is relaxed.
