// Original clue pairs. Familiar vocabulary across the rest of the alphabet,
// not specialist names or invented inflections added merely to fill a grid.
const source = `
MAGIC|Tricks that appear to defy natural laws|Art of creating an illusion of impossible events
MAJOR|More important or serious|Army rank above captain
MANAGE|Be in charge of something|Cope successfully with a difficulty
MANNER|Way in which something is done|Style of behaviour
MARKET|Place where goods are bought and sold|Demand for a particular product
MASK|Covering worn over the face|Conceal from view
MATCH|Small stick used to start a fire|Contest between opponents
MATTER|Physical substance|Subject under discussion
MEAL|Food eaten at a regular sitting|Ground grain used for cooking
MEAN|Signify or intend|Average calculated by dividing a total by the number of values
MEASURE|Find the size or quantity of something|Step taken to achieve a purpose
MEMBER|Person belonging to a group|Part of a larger body
MEMORY|Ability to recall past experiences|Computer capacity for storing data
MENTION|Refer to something briefly|Short reference to a subject
MERIT|Quality deserving praise|Worth or excellence
MESSAGE|Communication sent to someone|Underlying point of a work of art
METHOD|Way of doing something|Orderly procedure
MIDDLE|Point halfway between two ends|Central part
MIGHT|Past tense of may|Great strength or power
MILD|Not severe or strong|Gentle in temperament
MINOR|Less important or serious|Person below the legal age of adulthood
MINUTE|One sixtieth of an hour|Extremely small
MIST|Fine droplets of water suspended near the ground|Light haze that reduces visibility
MODEL|Small representation of a larger object|Person posing for an artist
MODERN|Relating to the present rather than the past|Contemporary
MOMENT|Very short period of time|Importance or consequence
MONDAY|Day of the week after Sunday|Day immediately before Tuesday
MONTH|One of the twelve divisions of a year|Period shown on a single calendar page
MOOD|Temporary state of mind|Emotional atmosphere
MORNING|Part of the day before noon|Period between dawn and midday
MOTION|Movement from one position to another|Formal proposal put to a vote
MOTOR|Machine that converts energy into movement|Device driving an electric fan
MOUTH|Opening used for eating and speaking|Place where a river meets the sea
MOVE|Change position|Single turn in a board game
MUD|Wet soft earth|Mixture of soil and water
MYSTERY|Something not yet explained|Fictional case for a detective
NARROW|Having little width|Restrict the range of possibilities
NATION|Country and its people|Political community sharing a territory
NATURE|The living world and its physical surroundings|Essential character of something
NEAR|Close in distance|Approach in space or time
NEAT|Tidy and well arranged|Undiluted, when describing spirits
NECK|Part of the body joining the head and shoulders|Narrow part of a bottle
NEED|Require something|Lack of something essential
NERVE|Fibre carrying signals between the brain and body|Courage in a difficult situation
NEWS|Information about recent events|Reports presented in a bulletin
NIGHT|Period of darkness between sunset and sunrise|Time when nocturnal animals are active
NOISE|Unwanted or unpleasant sound|Interference obscuring a signal
NORMAL|Usual or expected|Perpendicular, in geometry
NOTE|Short written message|Single musical tone
NOTICE|Become aware of something|Advance warning of an intention to leave
OATH|Solemn promise|Sworn declaration
OBJECT|Thing that can be seen or touched|Express disapproval
OFFER|Present something for acceptance|Proposal put forward for consideration
OFFICE|Room or building used for administrative work|Position of public responsibility
OFTEN|Many times|Frequently
ORDER|Instruction that must be obeyed|Sequence in which things are arranged
OTHER|Different from the one already mentioned|Alternative
OUTLINE|Line showing an object's outer shape|Brief account of the main points
OWNER|Person to whom something belongs|Proprietor
PACE|Speed of walking or running|Single step
PACK|Bundle of things wrapped together|Group of wolves
PAGE|One side of a sheet in a book|Summon someone over a public-address system
PAIR|Two things used or considered together|Couple
PART|Piece of a whole|Role played by an actor
PARTY|Social gathering to celebrate something|Organised political group
PASS|Go past or through something|Route through a mountain range
PAST|Time before the present|Beyond in position
PAUSE|Short interruption in an activity|Stop briefly before continuing
PAY|Give money in return for goods or work|Wages
PERFECT|Without any faults|Complete and flawless
PERSON|Individual human being|Character in a story
PHRASE|Small group of words forming a unit|Express in particular words
PIECE|Portion of something|Single item in a set
PILOT|Person who flies an aircraft|Trial episode of a television series
PITCH|Sports field marked for a game|How high or low a musical sound is
PLACE|Particular position or location|Rank achieved in a competition
PLAN|Detailed proposal for doing something|Drawing showing a building from above
PLANT|Living organism such as a tree or flower|Factory or industrial equipment
PLAY|Take part in a game|Dramatic work written for performance
PLENTY|More than enough|Abundance
POINT|Sharp end of an object|Main purpose of an argument
POLITE|Showing good manners|Courteous
POWER|Ability to control people or events|Rate at which work is done
PRAISE|Express approval or admiration|Commendation
PRESS|Push firmly against something|Newspapers and journalists collectively
PRICE|Amount charged for something|Cost of a purchase
PRIDE|Pleasure in one's achievements|Group of lions
PRIME|First-rate or most important|Number greater than one divisible only by itself and one
PRINT|Produce words or images on paper|Impression left by a foot or finger
PRIZE|Award given to a winner|Value highly
PROOF|Evidence establishing that something is true|Trial copy checked before publication
PROUD|Feeling pleased with an achievement|Having a sense of personal dignity
PUBLIC|Open to everyone|People in general
PULL|Draw something towards oneself|Influence over a decision
PUNCH|Strike with a closed fist|Drink served from a communal bowl
PUPIL|Child taught at a school|Opening at the centre of the iris
PURE|Not mixed with anything else|Free from contamination
PUSH|Move something away by applying force|Determined effort to achieve a goal
QUALITY|How good or bad something is|Distinctive characteristic
QUARREL|Angry argument|Dispute noisily
QUEEN|Female monarch|Most powerful piece in chess
QUEST|Long search for something|Mission undertaken to achieve a goal
QUICK|Moving or happening fast|Prompt to understand
QUIET|Making little or no noise|Free from disturbance
RACE|Competition to see who is fastest|Move at great speed
RADIO|Device receiving programmes transmitted through the air|Wireless broadcasting medium
RAIN|Water falling from clouds in drops|Precipitation caught in a gauge
RANGE|Set of different things available|Series of mountains
RANK|Position in a hierarchy|Row of soldiers standing side by side
RARE|Not common|Lightly cooked, when describing steak
RATE|Speed at which something happens|Assess the worth of something
REACH|Stretch out an arm towards something|Extent of influence
READY|Prepared for use or action|Available without delay
REASON|Explanation for why something happens|Ability to think logically
RECORD|Written account kept for future use|Best performance yet achieved
REFUSE|Decline to accept something|Waste material
REGRET|Feel sorry about something that happened|Remorse
REMAIN|Stay in the same place or condition|Continue to exist
REPAIR|Mend something damaged|Restore to working order
REPEAT|Say or do something again|Broadcast shown for a second time
REPORT|Account of an event or investigation|Present oneself for duty
REST|Stop working to recover energy|Remainder
RETURN|Come or go back|Profit on an investment
REWARD|Something given for good work or behaviour|Benefit gained through effort
RHYME|Similarity of sound at the ends of words|Verse with matching line endings
RICH|Having a lot of money|Full of flavour
RIGHT|Opposite of left|Entitlement protected by law
RISE|Move upwards|Increase in wages
RISK|Possibility of harm or loss|Expose to danger
ROLE|Character played by an actor|Function performed by someone
ROLL|Small individual portion of bread|Turn over and over
ROOM|Part of a building enclosed by walls|Space available for something
ROUND|Circular in shape|Stage of a competition
RULE|Instruction governing how something is done|Exercise authority over
RUSH|Move in great haste|Sudden surge of activity
SAFE|Protected from danger|Strong lockable box for valuables
SAILOR|Person who works on a ship|Seafarer
SAMPLE|Small portion used to judge a larger whole|Try a little of something
SAVE|Rescue from danger|Keep money for future use
SCALE|Set of ordered musical notes|Instrument for weighing
SCENE|Place where an event happens|Subdivision of a play
SCORE|Number of points won in a game|Written music for an orchestra
SEARCH|Look carefully for something|Attempt to find a missing person or object
SEASON|Spring, summer, autumn or winter|Add salt, herbs or spices to food
SECOND|Unit of time equal to one sixtieth of a minute|Support a proposal at a meeting
SENSE|Ability such as sight or touch|Meaning of a word
SERIES|Set of related things in order|Sequence of television programmes
SERVE|Bring food to a diner|Start a rally in tennis
SETTLE|Resolve a dispute|Make a home in a new place
SHADE|Shelter from direct sunlight|Slight variation of a colour
SHAPE|Outline or form of an object|Give a particular form to
SHARE|Portion allocated to someone|Unit of ownership in a company
SHARP|Having an edge that cuts easily|Raised by a semitone, in music
SHEET|Single large piece of paper|Rope used to control a sail
SHIFT|Move from one position to another|Scheduled period of work
SHINE|Give out or reflect light|Excel at an activity
SHORT|Having little length|Insufficient in quantity
SIGN|Notice giving information|Write one's name on a document
SIMPLE|Easy to understand or do|Uncomplicated
SINGLE|Only one|Unmarried
SKILL|Ability gained through practice|Proficiency
SLOW|Moving at a low speed|Reduce the pace of something
SMART|Neatly dressed|Quick-witted
SMOOTH|Having an even surface without rough patches|Free from interruptions
SOFT|Yielding easily to pressure|Quiet and gentle in sound
SOUND|Vibrations perceived by the ears|Reliable and in good condition
SPARE|Additional and kept for possible use|Refrain from harming
SPEAK|Say words aloud|Address an audience
SPEED|Rate at which something moves|Travel quickly
SPELL|Write or say the letters of a word in order|Period of time with a particular character
SPIRIT|Ghost or supernatural being|Courage and determination
SPLIT|Divide into separate parts|Disagreement that divides a group
SPOT|Small round mark|Notice or detect
STAFF|People employed by an organisation|Long stick carried for support
STAGE|Raised platform for a performance|Point reached in a process
STAND|Be upright on one's feet|Stall displaying goods for sale
START|Begin an activity|Sudden movement caused by surprise
STATE|Condition of someone or something|Express formally in words
STEADY|Firm and not shaking|Regular and continuous
STEP|Single movement of a foot when walking|Action in a sequence
STICK|Thin piece of wood|Adhere to a surface
STILL|Not moving|Nevertheless
STORE|Place where goods are kept or sold|Supply held for future use
STRAIN|Injury caused by overstretching a muscle|Filter liquid through a sieve
STRIKE|Hit with force|Organised refusal to work
STRING|Thin cord used for tying|Sequence of characters in computing
STRONG|Having great physical power|Able to withstand considerable force
STYLE|Distinctive way of doing something|Fashion in clothing
SUDDEN|Happening without warning|Abrupt
SUIT|Matching jacket and trousers or skirt|One of the four divisions of a pack of cards
SUN|Star at the centre of our solar system|Source of daylight
SUPPLY|Provide something that is needed|Stock available for use
SURE|Certain about something|Confident
SWITCH|Device used to turn a light on or off|Change from one thing to another
TAKE|Pick up or obtain something|Single filmed attempt at a scene
TALE|Story about real or imaginary events|Narrative
TALK|Speak to someone|Informal lecture
TASTE|Sense used to detect flavours|Personal preference
TEAM|Group playing together in a sport|People cooperating on a task
TELL|Give information in words|Distinguish one thing from another
TERM|One division of a school year|Word used with a particular meaning
TEST|Procedure used to check ability or quality|Put something through its paces
THANK|Express gratitude to someone|Show appreciation for a kindness
THICK|Having a large distance between opposite surfaces|Dense in consistency
THING|Object whose name is not specified|Matter under consideration
THINK|Use the mind to form ideas|Hold an opinion
THIRD|Coming after second|One of three equal parts
THOUGHT|Idea formed in the mind|Consideration given to a matter
TIGHT|Firmly held or fastened|Allowing little room to move
TIME|What is measured in hours and minutes|Occasion on which something happens
TINY|Very small|Minute in size
TITLE|Name of a book or film|Legal right to ownership
TOOL|Implement used to carry out a task|Instrument used by a craftsperson
TOOTH|Hard structure used for biting and chewing|Projection on the rim of a gear
TOTAL|Sum of all the parts|Complete
TOUCH|Make physical contact with something|Small finishing detail
TOUGH|Strong and difficult to damage|Hard to deal with
TOWN|Settlement larger than a village|Urban community
TRACK|Path left by passing people or animals|Single song on an album
TRADE|Buying and selling goods|Skilled occupation
TRAIL|Path through the countryside|Follow behind
TREAT|Give medical care to someone|Something especially enjoyable
TREND|General direction of change|Current fashion
TRIAL|Formal examination of evidence in court|Test of performance or suitability
TRICK|Act intended to deceive someone|Cards won in one round of bridge
TRIP|Journey to a place and back|Stumble
TRUE|In accordance with the facts|Loyal and faithful
TUNE|Melody|Adjust an instrument to the correct pitch
TURN|Change direction|Opportunity to act in sequence
TWELVE|Number after eleven|Number of items in a dozen
TWIST|Bend into a spiral|Unexpected development in a story
TYPE|Category of things with shared features|Enter text using a keyboard
UNCLE|Brother of one's parent|Male relative who may be married to an aunt
UNDER|Below something|Less than a stated amount
UNION|Organisation representing workers|Joining of separate things
UNIT|Single element of a larger whole|Standard quantity of measurement
UNTIL|Up to the time that|Not before a specified time
UPPER|Higher in position|Part of a shoe above the sole
URGE|Strongly encourage someone to act|Powerful desire
USUAL|Happening most of the time|Customary
VALUE|Amount something is worth|Regard highly
VERSE|Section of a song between choruses|Writing arranged in lines with rhythm
VIEW|What can be seen from a particular place|Opinion on a subject
VILLAGE|Settlement smaller than a town|Small rural community
VISIT|Go to see a person or place|Brief stay as a guest
VOICE|Sound produced when someone speaks|Express an opinion aloud
VOTE|Formal choice made in an election|Ballot
WAIT|Stay until something happens|Delay before being served
WALK|Travel on foot|Route suitable for a stroll
WALL|Vertical structure enclosing a room|Barrier separating two areas
WANT|Wish to have something|Lack of necessities
WARM|Moderately hot|Friendly and welcoming
WASTE|Use carelessly or without purpose|Material no longer needed
WATER|Liquid needed by living things|Give a plant a drink
WAVE|Moving ridge on the surface of the sea|Gesture of greeting made with the hand
WEAK|Lacking strength|Unconvincing
WEAR|Have clothing on the body|Damage caused by repeated use
WEATHER|Conditions of the atmosphere|Survive a difficult period
WEEK|Period of seven days|Monday to Sunday, for example
WEIGHT|How heavy something is|Importance or influence
WELCOME|Greet a visitor warmly|Pleasant to receive
WHITE|Colour of fresh snow|Part of an egg surrounding the yolk
WHOLE|Complete, with nothing missing|All the parts considered together
WIDE|Extending a long way from side to side|Delivery outside a batter's reach in cricket
WILD|Living in a natural state|Uncontrolled or unrestrained
WILL|Legal document directing inheritance|Determination to achieve something
WIN|Succeed in a competition|Victory
WIND|Air moving over the Earth's surface|Turn repeatedly around something
WISH|Desire for something to happen|Hope expressed while blowing out birthday candles
WIT|Ability to make clever amusing remarks|Quick intelligence
WONDER|Feel curiosity about something|Sense of astonishment
WOOD|Hard material beneath a tree's bark|Small area covered with trees
WORD|Unit of language with a meaning|Promise or assurance
WORK|Activity involving effort to achieve a result|Piece of art or literature
WORLD|Earth and its inhabitants|Sphere of activity or experience
WORRY|Feel anxious about something|Cause of unease
WORTH|Value of something|Merit
WRAP|Cover something in paper or cloth|Loose outer garment
WRITE|Form letters or words on a surface|Compose a text
WRONG|Not correct|Unjust act
YEAR|Period of twelve months|Time taken by Earth to orbit the Sun
YELLOW|Colour of ripe lemons|Golden hue
YIELD|Produce a crop or result|Give way to pressure
YOUNG|Not old|Offspring collectively
YOUTH|Period between childhood and adulthood|Young person
ZERO|Number representing none|Point from which a scale is measured
`;
export const NEW_WORDS = source.trim().split('\n').map(line => {
  const [answer, easy, hard] = line.split('|');
  return {answer, easy, hard};
});
