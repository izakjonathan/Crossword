// Original alternative-sense and contextual clues, reviewed as tier 2.
// Direct tier-1 clues remain unchanged. Sources document the answer senses.
const source=`
BRIDGE|Card game played by two partnerships
SPRING|Coiled component that stores mechanical energy
FROST|Cover a cake with icing, in American usage
SNOW|Overwhelm with paperwork, figuratively
STORM|Rush angrily into a room, say
STONE|Unit equal to fourteen pounds
EARTH|Connect an appliance to ground, in British usage
MOON|Natural companion of a planet
STAR|Leading performer in a production
SPACE|Gap between words on a page
LIGHT|Not heavy
SHADOW|Follow someone secretly
MIRROR|Reflect another person's behaviour
DOOR|Opportunity, in 'open a ___'
CHAIR|Preside over a meeting
TABLE|Postpone a proposal, in American usage
PENCIL|Tentatively schedule, with 'in'
STORY|Account that might begin 'Once upon a time'
POEM|Writing that may be arranged in stanzas
MUSIC|What a conductor directs an orchestra to play
PIANO|Softly, on a musical score
DRUM|Cylindrical container for oil
COLOUR|Influence someone's interpretation, figuratively
CANVAS|Material stretched over a painter's frame
FRAME|Surround a picture with a border
TRAIN|Prepare an athlete for competition
PLANE|Flat surface extending in every direction, in geometry
WHEEL|Steering control on a car
BREAD|Dough, as a slang term for money
BUTTER|Flatter excessively, with 'up'
HONEY|Term of affection derived from a sweet food
SUGAR|Sweeten a drink with white crystals
SALT|Seasoned sailor, informally
LEMON|Unreliable car, informally
ONION|Bulb whose layers may bring tears during chopping
PASTA|Food shaped into penne or fusilli
RICE|Push cooked potatoes through small holes
ROSE|Went up
LEAF|Removable extension in a dining table
BIRD|Shuttlecock, informally
HEART|Central or essential part
BRAIN|Mastermind behind an operation
SMILE|Expression often requested by a photographer
PEACE|State disturbed by a noisy neighbour
HOPE|Person regarded as a chance of success
CHILD|Someone's son or daughter, whatever their age
ANSWER|Pick up a ringing telephone
PUZZLE|Leave someone baffled
SECRET|Ingredient deliberately kept undisclosed
BALANCE|Amount remaining in a bank account
STEEL|Prepare oneself mentally for something difficult
CURRENT|Happening or in use now
HARBOUR|Give shelter to a fugitive
ANCHOR|Presenter leading a news broadcast
SAIL|Pass an examination easily, with 'through'
MEADOW|Land whose grass may be cut for hay
ALBUM|Book for a collection of photographs
ARROW|Symbol indicating a direction
BADGE|Emblem identifying a member of a group
BUDGET|Set aside money for a planned expense
CABLE|Bundle of wires carrying electrical signals
CELLAR|Keep wine below ground for ageing
`;
export const VARIED_CLUES={};
for(const line of source.trim().split('\n')){const [answer,text]=line.split('|');VARIED_CLUES[answer]=[{level:2,text,source:`https://www.merriam-webster.com/dictionary/${answer.toLowerCase()}`}];}
