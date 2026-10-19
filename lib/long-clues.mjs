// Original quick clues, independently rated for retrieval demand, not length.
// Sources support the sense; they do not certify the editorial difficulty band.
const source = `
APPETITE|2|Enthusiasm for taking risks, for example
ARCHITECT|2|Originator of an elaborate plan
ASSEMBLY|2|Legislative body
ASSEMBLY|3|Conversion of symbolic instructions into machine code
AUDIENCE|2|Formal meeting with a monarch
BOOKCASE|2|Furniture whose contents have spines
BOOKMARK|2|Saved link to a web page
BROADCAST|3|Sow by scattering seed over a wide area
BUTTERFLY|2|Swimming stroke using simultaneous movements of both arms
CHARACTER|2|Letter or symbol in a text
COMPLAINT|2|Minor bodily ailment
CONDUCTOR|2|Railway employee who checks tickets
CONDUCTOR|3|Copper's role in an electrical circuit
CONDITION|2|Stipulation attached to an agreement
CONTRAST|2|Set side by side to show differences
CROSSROADS|2|Point at which an important decision must be made
DELICATE|2|Requiring tact in handling
DEPARTURE|2|Deviation from the usual approach
DIRECTION|2|Management or supervision of a project
DISCOVERY|3|Pre-trial disclosure of evidence, in legal usage
ENCOURAGE|2|Promote the growth or spread of
ENTERTAIN|2|Consider an idea or proposal
ENTRANCE|3|Hold spellbound
EVERGREEN|2|Song or book whose popularity endures
EXCEPTION|2|Objection, in 'take ___ to'
EXPRESSION|2|Phrase or turn of speech
EXPRESSION|3|Combination of mathematical symbols representing a value
FOLLOWING|2|Next in sequence
FOUNDATION|2|Cosmetic base applied before other make-up
GENERATION|2|Production of electricity
HIGHLIGHT|2|Mark a passage with fluorescent ink
INDEPENDENT|2|Candidate standing without a party affiliation
INSTRUMENT|3|Written legal document, such as a deed
INVITATION|2|Opportunity that tempts someone to act
KEYBOARD|2|Piano's array of black and white keys
LANDSCAPE|2|Wider than tall, for a printed page
LITERATURE|2|Printed promotional material for a product
NOTEBOOK|2|Small portable computer
OBSERVATION|2|Comment based on something noticed
ORCHESTRA|3|Ground-floor seating area in a US theatre
PARACHUTE|3|Install an outsider in a job, informally
PASSENGER|3|Team member contributing little, in British informal usage
PERFORMANCE|2|Manner in which a machine carries out its work
PLATFORM|2|Political party's stated policies
PLATFORM|3|Computing environment on which software runs
POPULATION|3|Entire set from which a statistical sample is selected
PORTRAIT|2|Detailed account of someone's character in words
PRACTICAL|2|Hands-on examination, in British education
PRESIDENT|2|Presiding officer of a society or club
PROCEDURE|3|Named set of instructions that a program can call
PROFESSION|2|Open declaration of a belief
PROMOTION|2|Publicity designed to increase sales
RECEPTION|2|Formal social gathering
REFERENCE|2|Testimonial supplied by a former employer
REFLECTION|2|Careful consideration of a subject
REFLECTION|3|Geometrical transformation that produces a mirror image
REMAINDER|2|What is left after whole-number division
REMAINDER|3|Sell unsold books at a reduced price
REVOLUTION|2|One complete turn about an axis
SATELLITE|3|State controlled by a more powerful country
SIGNATURE|2|Distinctive identifying feature of an artist's work
SIGNATURE|3|Group of folded printed sheets forming a section of a book
SKELETON|2|Basic supporting framework of a plan
SKELETON|3|Winter sport in which a rider races head-first on a small sled
SNOWBALL|2|Grow rapidly by accumulating more of the same
SOLUTION|2|Liquid mixture in which a substance has dissolved
STATEMENT|2|Document summarising transactions on a bank account
SUBMARINE|3|Long filled bread roll, in North American usage
TELESCOPE|3|Shorten by sliding one section inside another
TEMPERATURE|2|Level of tension in a debate, figuratively
TERRITORY|2|Salesperson's assigned district
TRANSLATE|3|Shift a figure by a fixed vector, in geometry
TRANSPORT|3|Carry away with strong emotion
TREASURE|2|Value and cherish deeply
TRIANGLE|2|Percussion instrument struck with a metal beater
UMBRELLA|2|Organisation bringing several smaller groups together
UNDERGROUND|2|Urban railway system, in Britain
UNDERGROUND|3|Secret resistance organisation
VELOCITY|3|Frequency at which money changes hands, in economics
VOLUNTEER|2|Offer information without being asked
WALLPAPER|2|Decorative background image on a computer screen
WARDROBE|2|Person's complete collection of clothes
WORKSHOP|2|Session devoted to practising a particular skill
`;
const sourceOverrides = {
  'SKELETON:3': 'https://www.teamusa.com/sports/skeleton',
  UMBRELLA: 'https://dictionary.cambridge.org/dictionary/english/umbrella',
  PARACHUTE: 'https://dictionary.cambridge.org/dictionary/english/parachute',
  PASSENGER: 'https://www.oxfordlearnersdictionaries.com/us/definition/english/passenger',
  VELOCITY: 'https://fred.stlouisfed.org/series/M2V',
  TRANSLATE: 'https://mathworld.wolfram.com/Translation.html',
};
export const LONG_CLUES = {};
for (const line of source.trim().split('\n')) {
  const [answer,level,text] = line.split('|');
  (LONG_CLUES[answer] ||= []).push({level:Number(level),text,source:sourceOverrides[`${answer}:${level}`] || sourceOverrides[answer] || `https://www.merriam-webster.com/dictionary/${answer.toLowerCase()}`});
}
