# Longer-answer clue review · v2.9.0

Baseline: delivered v2.8.2 source. Research and editorial revision: 19 October 2026.

## What changed

Of 197 bank answers containing eight or more letters, v2.8.2 offered reviewed tier-2 alternatives for only four and no tier-3 alternatives. The new authored set adds **83 variants across 74 answers**: **59 tier-2 and 24 tier-3 clues**. Coverage is now 63 longer answers with tier 2 and 24 with tier 3. The total vocabulary remains 1,906 answers, with every existing direct clue retained.

The new clues use alternate senses, contextual descriptions and precise technical definitions. Examples include a web BOOKMARK, the legislative and computing senses of ASSEMBLY, a musical TRIANGLE, the printing sense of SIGNATURE and the sporting sense of SKELETON. Difficulty is assigned independently of answer length. A different sense is not automatically difficult for every solver, and these are editorial starting bands rather than human-calibrated scores.

The source checks changed several drafts: ASSEMBLY describes conversion into machine code rather than conflating it with a language name; LANDSCAPE is clued as an adjective; NOTEBOOK avoids insisting it is identical to a laptop; TRANSLATE specifies a fixed vector; SIGNATURE identifies a group of folded sheets. British/North American usage and specialist domains are signalled where needed.

## Rules and compatibility

Only reviewed variants are appended to the existing word objects. Unknown answers, duplicate tiers, duplicate normalized text, invalid source URLs, same-length clue collisions and answer leakage are rejected. Source references stay in the authored bank and review record; generation makes no reference-site requests. They are not displayed as new controls or labels during play.

Easy continues to use only the existing direct clues. Medium can choose tier 2, while Hard can choose tier 2 or 3 under the existing quotas. Specialist crossing restrictions, gentler support for tier-3 clues, minimum checking, longer-answer requirements, field counts and dated repeat exclusions remain unchanged. Direct longer clues remain available as footholds; every long entry is not forced to use a difficult variant.

Existing saved puzzles retain their original clues and entered letters. The save schema remains version 3, with difficultyVersion:1 and fairnessVersion:1 unchanged. Generate a new puzzle to see the revised bank. Source metadata is not required on older saved clues.

This is an intentional editorial content revision, so some seeded Medium/Hard fills and clue text change. Nine accepted v2.9 output hashes replace the active reference fixture; the historical v2.8.1 hash file is retained. The cached filler itself is unchanged from v2.8.2. The previous matched-performance report remains historical; an exact-output comparison across different editorial banks should fail rather than silently declaring equivalence.

## Measured use

For 100 fixed fresh seeds per mode, audit-0 through audit-99:

| Metric | v2.8.2 | v2.9.0 |
| --- | --- | --- |
| Medium puzzles with a reviewed harder clue on an 8+ answer | 25/100 | 76/100 |
| Hard puzzles with a reviewed harder clue on an 8+ answer | 0/100 | 90/100 |
| Hard puzzles with a tier-3 clue on an 8+ answer | 0/100 | 32/100 |

Each sampled puzzle had one 8+ answer, so the final row is both clue-use and puzzle count. These are matched seed sets, not a claim of identical grids after the content change or guaranteed coverage in every puzzle. See [raw comparison](benchmarks/v2.9.0-long-clue-comparison.json), [full audit](benchmarks/v2.9.0-audit.json) and [validation](VALIDATION-V2.9.0.md).

## Source-backed review record

The references below were consulted for the relevant meanings. The clue wording is original; sources do not certify the chosen difficulty tier or independently test-solve the resulting grids. For contextual clues such as BOOKCASE, the reference establishes the underlying object rather than supplying the clue's inference. This review concerns these 83 variants, not an independent semantic certification of the entire bank. Wider human test-solving remains necessary.

| Answer | Tier | Authored clue | Reference |
| --- | --- | --- | --- |
| APPETITE | 2 | Enthusiasm for taking risks, for example | [Source](https://www.merriam-webster.com/dictionary/appetite) |
| ARCHITECT | 2 | Originator of an elaborate plan | [Source](https://www.merriam-webster.com/dictionary/architect) |
| ASSEMBLY | 2 | Legislative body | [Source](https://www.merriam-webster.com/dictionary/assembly) |
| ASSEMBLY | 3 | Conversion of symbolic instructions into machine code | [Source](https://www.merriam-webster.com/dictionary/assembly) |
| AUDIENCE | 2 | Formal meeting with a monarch | [Source](https://www.merriam-webster.com/dictionary/audience) |
| BOOKCASE | 2 | Furniture whose contents have spines | [Source](https://www.merriam-webster.com/dictionary/bookcase) |
| BOOKMARK | 2 | Saved link to a web page | [Source](https://www.merriam-webster.com/dictionary/bookmark) |
| BROADCAST | 3 | Sow by scattering seed over a wide area | [Source](https://www.merriam-webster.com/dictionary/broadcast) |
| BUTTERFLY | 2 | Swimming stroke using simultaneous movements of both arms | [Source](https://www.merriam-webster.com/dictionary/butterfly) |
| CHARACTER | 2 | Letter or symbol in a text | [Source](https://www.merriam-webster.com/dictionary/character) |
| COMPLAINT | 2 | Minor bodily ailment | [Source](https://www.merriam-webster.com/dictionary/complaint) |
| CONDUCTOR | 2 | Railway employee who checks tickets | [Source](https://www.merriam-webster.com/dictionary/conductor) |
| CONDUCTOR | 3 | Copper's role in an electrical circuit | [Source](https://www.merriam-webster.com/dictionary/conductor) |
| CONDITION | 2 | Stipulation attached to an agreement | [Source](https://www.merriam-webster.com/dictionary/condition) |
| CONTRAST | 2 | Set side by side to show differences | [Source](https://www.merriam-webster.com/dictionary/contrast) |
| CROSSROADS | 2 | Point at which an important decision must be made | [Source](https://www.merriam-webster.com/dictionary/crossroads) |
| DELICATE | 2 | Requiring tact in handling | [Source](https://www.merriam-webster.com/dictionary/delicate) |
| DEPARTURE | 2 | Deviation from the usual approach | [Source](https://www.merriam-webster.com/dictionary/departure) |
| DIRECTION | 2 | Management or supervision of a project | [Source](https://www.merriam-webster.com/dictionary/direction) |
| DISCOVERY | 3 | Pre-trial disclosure of evidence, in legal usage | [Source](https://www.merriam-webster.com/dictionary/discovery) |
| ENCOURAGE | 2 | Promote the growth or spread of | [Source](https://www.merriam-webster.com/dictionary/encourage) |
| ENTERTAIN | 2 | Consider an idea or proposal | [Source](https://www.merriam-webster.com/dictionary/entertain) |
| ENTRANCE | 3 | Hold spellbound | [Source](https://www.merriam-webster.com/dictionary/entrance) |
| EVERGREEN | 2 | Song or book whose popularity endures | [Source](https://www.merriam-webster.com/dictionary/evergreen) |
| EXCEPTION | 2 | Objection, in 'take ___ to' | [Source](https://www.merriam-webster.com/dictionary/exception) |
| EXPRESSION | 2 | Phrase or turn of speech | [Source](https://www.merriam-webster.com/dictionary/expression) |
| EXPRESSION | 3 | Combination of mathematical symbols representing a value | [Source](https://www.merriam-webster.com/dictionary/expression) |
| FOLLOWING | 2 | Next in sequence | [Source](https://www.merriam-webster.com/dictionary/following) |
| FOUNDATION | 2 | Cosmetic base applied before other make-up | [Source](https://www.merriam-webster.com/dictionary/foundation) |
| GENERATION | 2 | Production of electricity | [Source](https://www.merriam-webster.com/dictionary/generation) |
| HIGHLIGHT | 2 | Mark a passage with fluorescent ink | [Source](https://www.merriam-webster.com/dictionary/highlight) |
| INDEPENDENT | 2 | Candidate standing without a party affiliation | [Source](https://www.merriam-webster.com/dictionary/independent) |
| INSTRUMENT | 3 | Written legal document, such as a deed | [Source](https://www.merriam-webster.com/dictionary/instrument) |
| INVITATION | 2 | Opportunity that tempts someone to act | [Source](https://www.merriam-webster.com/dictionary/invitation) |
| KEYBOARD | 2 | Piano's array of black and white keys | [Source](https://www.merriam-webster.com/dictionary/keyboard) |
| LANDSCAPE | 2 | Wider than tall, for a printed page | [Source](https://www.merriam-webster.com/dictionary/landscape) |
| LITERATURE | 2 | Printed promotional material for a product | [Source](https://www.merriam-webster.com/dictionary/literature) |
| NOTEBOOK | 2 | Small portable computer | [Source](https://www.merriam-webster.com/dictionary/notebook) |
| OBSERVATION | 2 | Comment based on something noticed | [Source](https://www.merriam-webster.com/dictionary/observation) |
| ORCHESTRA | 3 | Ground-floor seating area in a US theatre | [Source](https://www.merriam-webster.com/dictionary/orchestra) |
| PARACHUTE | 3 | Install an outsider in a job, informally | [Source](https://dictionary.cambridge.org/dictionary/english/parachute) |
| PASSENGER | 3 | Team member contributing little, in British informal usage | [Source](https://www.oxfordlearnersdictionaries.com/us/definition/english/passenger) |
| PERFORMANCE | 2 | Manner in which a machine carries out its work | [Source](https://www.merriam-webster.com/dictionary/performance) |
| PLATFORM | 2 | Political party's stated policies | [Source](https://www.merriam-webster.com/dictionary/platform) |
| PLATFORM | 3 | Computing environment on which software runs | [Source](https://www.merriam-webster.com/dictionary/platform) |
| POPULATION | 3 | Entire set from which a statistical sample is selected | [Source](https://www.merriam-webster.com/dictionary/population) |
| PORTRAIT | 2 | Detailed account of someone's character in words | [Source](https://www.merriam-webster.com/dictionary/portrait) |
| PRACTICAL | 2 | Hands-on examination, in British education | [Source](https://www.merriam-webster.com/dictionary/practical) |
| PRESIDENT | 2 | Presiding officer of a society or club | [Source](https://www.merriam-webster.com/dictionary/president) |
| PROCEDURE | 3 | Named set of instructions that a program can call | [Source](https://www.merriam-webster.com/dictionary/procedure) |
| PROFESSION | 2 | Open declaration of a belief | [Source](https://www.merriam-webster.com/dictionary/profession) |
| PROMOTION | 2 | Publicity designed to increase sales | [Source](https://www.merriam-webster.com/dictionary/promotion) |
| RECEPTION | 2 | Formal social gathering | [Source](https://www.merriam-webster.com/dictionary/reception) |
| REFERENCE | 2 | Testimonial supplied by a former employer | [Source](https://www.merriam-webster.com/dictionary/reference) |
| REFLECTION | 2 | Careful consideration of a subject | [Source](https://www.merriam-webster.com/dictionary/reflection) |
| REFLECTION | 3 | Geometrical transformation that produces a mirror image | [Source](https://www.merriam-webster.com/dictionary/reflection) |
| REMAINDER | 2 | What is left after whole-number division | [Source](https://www.merriam-webster.com/dictionary/remainder) |
| REMAINDER | 3 | Sell unsold books at a reduced price | [Source](https://www.merriam-webster.com/dictionary/remainder) |
| REVOLUTION | 2 | One complete turn about an axis | [Source](https://www.merriam-webster.com/dictionary/revolution) |
| SATELLITE | 3 | State controlled by a more powerful country | [Source](https://www.merriam-webster.com/dictionary/satellite) |
| SIGNATURE | 2 | Distinctive identifying feature of an artist's work | [Source](https://www.merriam-webster.com/dictionary/signature) |
| SIGNATURE | 3 | Group of folded printed sheets forming a section of a book | [Source](https://www.merriam-webster.com/dictionary/signature) |
| SKELETON | 2 | Basic supporting framework of a plan | [Source](https://www.merriam-webster.com/dictionary/skeleton) |
| SKELETON | 3 | Winter sport in which a rider races head-first on a small sled | [Source](https://www.teamusa.com/sports/skeleton) |
| SNOWBALL | 2 | Grow rapidly by accumulating more of the same | [Source](https://www.merriam-webster.com/dictionary/snowball) |
| SOLUTION | 2 | Liquid mixture in which a substance has dissolved | [Source](https://www.merriam-webster.com/dictionary/solution) |
| STATEMENT | 2 | Document summarising transactions on a bank account | [Source](https://www.merriam-webster.com/dictionary/statement) |
| SUBMARINE | 3 | Long filled bread roll, in North American usage | [Source](https://www.merriam-webster.com/dictionary/submarine) |
| TELESCOPE | 3 | Shorten by sliding one section inside another | [Source](https://www.merriam-webster.com/dictionary/telescope) |
| TEMPERATURE | 2 | Level of tension in a debate, figuratively | [Source](https://www.merriam-webster.com/dictionary/temperature) |
| TERRITORY | 2 | Salesperson's assigned district | [Source](https://www.merriam-webster.com/dictionary/territory) |
| TRANSLATE | 3 | Shift a figure by a fixed vector, in geometry | [Source](https://mathworld.wolfram.com/Translation.html) |
| TRANSPORT | 3 | Carry away with strong emotion | [Source](https://www.merriam-webster.com/dictionary/transport) |
| TREASURE | 2 | Value and cherish deeply | [Source](https://www.merriam-webster.com/dictionary/treasure) |
| TRIANGLE | 2 | Percussion instrument struck with a metal beater | [Source](https://www.merriam-webster.com/dictionary/triangle) |
| UMBRELLA | 2 | Organisation bringing several smaller groups together | [Source](https://dictionary.cambridge.org/dictionary/english/umbrella) |
| UNDERGROUND | 2 | Urban railway system, in Britain | [Source](https://www.merriam-webster.com/dictionary/underground) |
| UNDERGROUND | 3 | Secret resistance organisation | [Source](https://www.merriam-webster.com/dictionary/underground) |
| VELOCITY | 3 | Frequency at which money changes hands, in economics | [Source](https://fred.stlouisfed.org/series/M2V) |
| VOLUNTEER | 2 | Offer information without being asked | [Source](https://www.merriam-webster.com/dictionary/volunteer) |
| WALLPAPER | 2 | Decorative background image on a computer screen | [Source](https://www.merriam-webster.com/dictionary/wallpaper) |
| WARDROBE | 2 | Person's complete collection of clothes | [Source](https://www.merriam-webster.com/dictionary/wardrobe) |
| WORKSHOP | 2 | Session devoted to practising a particular skill | [Source](https://www.merriam-webster.com/dictionary/workshop) |
