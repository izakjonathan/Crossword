// Individually selected alternative senses, technical descriptions and cultural
// references. Legacy `hard` text is NOT automatically promoted to a higher tier.
export const REVIEWED_ALTERNATIVES = new Set(`APPLE SILVER WINDOW HOUSE CHAIR TABLE SHELF CLOCK WATCH KEY LOCK PAPER LETTER STAMP BOOK NOVEL SCREEN PAINT BRUSH FRAME TRAIN PLANE PATH MAP COMPASS TICKET PEPPER OLIVE PEACH PEAR CHERRY CARROT POTATO TOMATO SALAD SOUP CURRY MINT SAGE ROSE PETAL ROOT LEAF STEM SEED EAGLE SWAN HORSE SHARK DREAM TRUST FAMILY SCHOOL LESSON NUMBER RIDDLE SILENCE PATTERN CIRCLE SQUARE ANGLE EDGE CENTRE CORNER THREAD NEEDLE BUTTON POCKET COTTON VELVET CORAL COPPER IRON BRASS TIN STREAM CHAMPION QUARTZ FERN MOSS IVY APRON RECIPE DOUGH CRUST ANVIL BALLET BANNER BARREL BASKET BEACON BEARD BEETLE BELT BENCH BLANKET BLOSSOM BONNET BOTTLE BOWLER BRANCH BUCKET BUFFET CABIN CANAL CANARY CAPTAIN CARPET CEMENT CHIMNEY CLOAK COAST COLLAR COLUMN COUCH CROWN CUBE CUSHION DAWN DESERT DIAMOND DRAWER DUCK ECHO ELBOW ENGINE ENVELOPE ESSAY FEAST FENCE FERRY FINCH FLAME FLINT FLUTE FOG FORK FOX FUDGE GATE GOLD HAMMER HANDLE HINGE HORN HOST HOUND IRIS JACKET JOURNAL JURY KITE KNOT LADDER LARK LIME LOOM LYRIC MAGNET MARBLE MENU METEOR MILL MUG NET NOSE NURSE OASIS OBOE PAGODA PAW PITCHER POSTER PRISM PULLEY QUIVER RAFT RATTLE REED RIBBON ROOF SEAL SHELL SHIELD SHOE SKATE SKIRT SLATE SOAP SPADE SPONGE STABLE SWING TAPE TART THRONE TOAST TRAY TRUNK TUNNEL VEIL WHARF WING YARN ZIP ANTLER ACCENT ADAPT ADDRESS AFFORD AFTER AGREE ALARM ALIEN ALLOW ALONE ANNUAL APPEAL ARRANGE ARTERY ASLEEP AUTHOR BABY BACK BAIL BAIT BAKE BAND BANK BASE BATTLE BEAD BEAM BEAT BECOME BEFORE BEHIND BETTER BILL BIND BIRTH BLIND BLOW BLUE BLUNT BOLD BOLT BOND BORROW BOTTOM BOUNDARY BRIEF BUD BUILD BUNDLE BURST BUSY BUYER CAB CACHE CANDID CANDY CAP CASH CAUSE CEILING CENTURY CHAIN CHANGE CHANNEL CHARGE CHARM CHECK CHEEK CHOICE CHOP CHORD CLASS CLAW CLEAN CLIMATE CLIMB CLIP CLOSE COAT COIN COLD COLLECT COLONY COMB COMMON CONCERT CONSENT CONSTANT CONTROL COOL COPY CORD COUNT COUPLE COVER COW CRAFT CRAWL CREAM CRUSH CURE EAR IMPORT MAJOR MANAGE MARKET MASK MATTER MEAL MEAN MEASURE MEMORY MESSAGE MIGHT MINOR MINUTE MODEL MOMENT MOOD MOTION MOUTH MOVE NARROW NATURE NEAR NEAT NECK NERVE NOISE NORMAL NOTE NOTICE OBJECT OFFICE ORDER PACK PAGE PART PARTY PASS PAST PHRASE PILOT PITCH PLACE PLAN PLANT PLAY POINT POWER PRESS PRIDE PRIME PRINT PRIZE PROOF PULL PUNCH PUPIL PUSH QUALITY QUEEN QUICK RANGE RANK RARE RATE REACH RECORD REFUSE REPEAT REPORT REST RETURN RICH RIGHT RISE RISK ROLE ROLL ROOM ROUND RULE RUSH SAFE SAMPLE SCALE SCENE SCORE SEASON SECOND SENSE SERVE SHADE SHARE SHARP SHEET SHIFT SHINE SHORT SIGN SINGLE SLOW SOFT SOUND SPARE SPELL SPIRIT SPLIT SPOT STAFF STAGE STAND START STATE STEP STICK STILL STORE STRAIN STRIKE STRING SUIT SUPPLY SWITCH TAKE TALK TASTE TELL TERM THING THOUGHT TIME TITLE TOOTH TOUCH TRACK TRADE TRAIL TRIAL TRICK TRIP TRUE TUNE TURN TWIST TYPE UNDER UNION UNIT UPPER URGE VALUE VIEW VOICE WANT WARM WATER WAVE WEAK WEAR WEATHER WEIGHT WHITE WIDE WILD WILL WIND WIT WOOD WORD WORK WORLD WRAP WRONG YIELD YOUNG ZERO AIR ARM AXE BAG BAR BED BID BIG BIN BIT BOW BOX BUG CAN CAR COG CUB DAM DEN DIE DIG DOG DOE EBB EGO EVE EWE FIN FIR FOE FRY GEL GEM GUM HAM HIP HOG HOP HUB HUE HUM ION IRK KIN LAW LEG LOT MAD MAY MOB NAP NOD NUT ODD ODE OPT ORB ORE OWN PAD PAN PAR PAT PEN PEW PIT PLY POP PRY RAG RAM RAT RAY RIB RIG RIM ROB ROE ROT RUB RUN RUT SAP SAW SHY SIP SIT SIX SOW SPY STY TAB TAN TAR TAX TEA TIE TRY TUG VAT VET VIE WAX WED`.split(/\s+/));

// Tier 3 asks for a less expected sense or a more oblique but bounded definition.
// Original wording; quick clues, not unannounced cryptic constructions.
const source = `
BAR|The legal profession collectively
BOW|Incline in acknowledgement
DAM|Female parent recorded in a pedigree
DIE|Stamping tool used to shape metal
END|Objective pursued by a course of action
FLY|Opening at the front of trousers
FRY|Fish before they reach maturity, collectively
JAR|Clash unpleasantly, as colours may
LAP|Overtake by a complete circuit
LIE|Position in which a golf ball comes to rest
LOW|Make a cow's characteristic sound
NAP|Raised fibres on the face of cloth
NUT|Enthusiast, informally
ODD|Left without a partner
ORE|A smelter's raw material
PAD|Walk with muffled footfalls
PAR|Equality of standing
PAY|Prove worthwhile
PEG|Fix a currency at a specified rate
PET|Particularly favoured, as a project
PIN|Chess tactic that restricts a piece to protect one behind it
PLY|Work steadily at an occupation
POD|Detachable compartment of a spacecraft
RAT|Informer, informally
RAY|Part of a straight line extending endlessly from one endpoint
RIP|Copy audio from a CD
ROT|Nonsense, in informal British speech
ROW|Noisy dispute
RUB|Snag that complicates a plan
RUM|Peculiar, in informal British speech
SAW|A proverb or maxim
SET|Become firm, as concrete does
SHY|Short of a specified amount
SIT|Be in session, as a court
SKY|Hit a ball high into the air
SOW|Spread the beginnings of dissent
STY|Inflamed swelling at the edge of an eyelid
TAN|Prepare hide for use as leather
TAR|Seafarer, informally
TAX|Strain someone's ingenuity
TIE|Fixture in a knockout tournament
TOY|Consider without commitment, with 'with'
TRY|Hear a case in court
URN|Large spigoted vessel for serving hot drinks
WAX|Approach fullness, as the Moon does
BANK|Tilt while turning, as an aircraft does
BEAM|Width of a vessel at its broadest point
BILL|A proposed statute
BOND|A debt security
BRIEF|Set of instructions given to a barrister
CHAIR|Preside over a committee
CHORD|Segment whose endpoints lie on a circle
COIN|Invent, as a new expression
COUNT|Noble of equivalent rank to an earl
COURT|Seek to win someone's favour
CRANE|Stretch one's neck to see
CURE|Preserve by salting or smoking
DRAFT|Compulsory recruitment for military service
DRAW|Pull money from an account
DRIVE|A sustained fundraising campaign
FAIR|Neither favourable nor poor, as a rating
FILE|March in a single line
FIRM|Partnership conducting a business
FLAT|Lowered by a semitone, in music
FOIL|Thin sword used in fencing
FRAME|Falsely incriminate
GROUND|Electrical connection to the earth
ISSUE|Children or descendants, in legal usage
JOINT|A cut of meat for roasting, in Britain
LARK|A light-hearted escapade
LEAD|Principal role in a play
LEAF|One sheet of a bound volume
LOOM|Appear large and threatening
MAJOR|Rank immediately above captain
MATCH|Equal in ability or strength
MEAL|Grain ground into coarse particles
MINUTE|Almost imperceptibly small
MORTAR|Bowl paired with a pestle
NORMAL|At right angles, in geometry
ORDER|Taxonomic rank between class and family
PART|Separate, as ways may
PITCH|A sales presentation
PLANE|Flat two-dimensional surface extending without limit
PRESS|Journalists considered collectively
PRIME|Prepare a surface for painting
PROOF|A printer's trial impression
QUAIL|Lose courage
RANK|Offensively strong, as a smell
REED|Vibrating strip in a clarinet's mouthpiece
REFUSE|Material destined for disposal
REST|A prescribed silence in music
ROSE|Advanced in rank, in the past
SCALE|Remove a fish's outer plates
SECOND|Formally support a motion
SHARP|Raised by a semitone, in music
SHEET|Rope controlling a sail
SLATE|List of candidates put forward for election
SOUND|A stretch of sea between land masses
SPRING|An elastic mechanical component
STAFF|Five parallel lines used for musical notation
STRAIN|A particular variety of microorganism
STRIKE|Discover oil while drilling
TABLE|Postpone consideration of, in US parliamentary usage
TERM|One quantity in an algebraic expression
TITLE|Legal right of ownership
TRAIN|Long trailing portion of a gown
TRUNK|Main communications line
WILL|Faculty of conscious choice
YIELD|Return from an investment
`;
export const CHALLENGING_CLUES = Object.fromEntries(source.trim().split('\n').map(line=>line.split('|')));
