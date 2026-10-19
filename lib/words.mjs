import { SHORT_WORDS } from './short-words.mjs';
import {NEW_WORDS} from './new-words.mjs';
import {validateWordBank} from './word-quality.mjs';
import {EXTENDED_WORDS} from './extended-words.mjs';
import {MORE_WORDS} from './more-words.mjs';
// Original quick-crossword clues. Hard pairs use alternative senses or less direct
// definitions, not purported cryptic wordplay.
const source = `
APPLE|Fruit used to make cider|Fruit in a traditional tarte Tatin
RIVER|Large natural stream of water|Watercourse with a source and a mouth
GARDEN|Place for growing flowers and vegetables|A cultivated plot for flowers or vegetables
COFFEE|Hot drink made from roasted beans|Drink brewed from roasted ground beans
BRIDGE|Structure carrying a road over water|Structure spanning a river or other obstacle
ORANGE|Citrus fruit with a thick peel|Citrus fruit with a segmented interior
PLANET|World orbiting a star|Celestial body orbiting a star
SILVER|Precious metal used for jewellery|Precious metal with the chemical symbol Ag
CANDLE|Wax stick with a wick|A source of light made from wax and a wick
CASTLE|Fortified home with towers|A large fortified residence
FOREST|Large area covered with trees|Extensive land covered by trees
WINTER|Coldest season of the year|Season between autumn and spring
SUMMER|Season between spring and autumn|Season between spring and autumn
SPRING|Season when many flowers bloom|Season between winter and summer
AUTUMN|Season when leaves turn and fall|Season between summer and winter
OCEAN|Vast expanse of salt water|One of the major divisions of the world’s salt water
ISLAND|Land surrounded by water|An area of land entirely surrounded by water
BEACH|Sandy or pebbly shore|An area of sand or pebbles beside the sea
CLOUD|Visible mass of water droplets or ice crystals in the sky|White or grey formation suspended in the atmosphere
THUNDER|Loud sound following lightning|The sound caused by the rapid expansion of air after lightning
RAINBOW|Coloured arc seen after rain|A spectrum of colours forming an arc in the sky
BREEZE|Gentle wind|A light wind
FROST|Thin layer of ice on a cold morning|A thin coating of ice crystals on a cold surface
SNOW|Frozen flakes falling from clouds|Frozen flakes falling from clouds
STORM|Violent spell of wind and rain|Violent spell of wind and rain
STONE|Small piece of rock|Small piece of rock
EARTH|The planet we live on|The planet we live on
MOON|Earth's natural satellite|Earth's natural satellite
STAR|Bright point in the night sky|Bright point in the night sky
COMET|Space object with a glowing tail|An icy body that can develop a tail near the Sun
ORBIT|Path of a planet around a star|The curved path of one celestial body around another
SPACE|Region beyond Earth's atmosphere|Region beyond Earth's atmosphere
LIGHT|What allows us to see|What allows us to see
SHADOW|Dark shape cast by blocked light|A dark area where an object blocks the light
MIRROR|Glass surface that shows a reflection|A smooth surface that reflects an image
WINDOW|Glazed opening in a wall|Opportunity available for a limited time
DOOR|Hinged or sliding panel at an entrance|Way into a room
HOUSE|Building used as a home|Chamber of a parliament
CHAIR|Seat with a back|Person presiding over a meeting
TABLE|Furniture with a flat top supported by legs|Data arranged in rows and columns
SHELF|Horizontal board for storing objects|Shallow underwater ledge
CLOCK|Device that displays the time|Time a runner's performance
WATCH|Small timepiece worn on the wrist|Keep under observation
KEY|Object used to turn a lock|List explaining symbols on a map
LOCK|Device that secures a door|Canal chamber used to raise or lower boats
PAPER|Material used for writing and printing|Academic article
PENCIL|Writing tool with a graphite core|Drawing tool whose marks can be rubbed out
LETTER|Written message sent to someone|Character in an alphabet
STAMP|Adhesive label showing postage has been paid|Bring a foot down heavily
BOOK|Set of bound pages|Reserve a seat or room
NOVEL|Long work of fiction|New and unlike anything seen before
STORY|Account of events, real or imagined|Narrative
POEM|Piece of writing arranged in verse|Literary work with lines and stanzas
MUSIC|Art made with melody and rhythm|Vocal or instrumental sounds arranged artistically
PIANO|Keyboard instrument with strings|Keyboard instrument whose hammers strike strings
GUITAR|Fretted instrument usually having six strings|Instrument played with a plectrum
DRUM|Percussion instrument struck with sticks|Percussion instrument struck with sticks
VIOLIN|Small bowed instrument with four strings|A bowed string instrument tuned in fifths
DANCE|Move rhythmically to music|Move rhythmically to music
SINGER|Person who performs songs|Vocalist
THEATRE|Building for plays and performances|Building in which plays are performed
SCREEN|Surface on which a film is projected|Examine applicants before selection
CAMERA|Device used to take photographs|A device for recording photographs or video
PHOTO|Picture taken with a camera, for short|Snapshot, for short
COLOUR|Red, blue or green, for example|Hue
PAINT|Coloured coating applied with a brush|Portray in words
BRUSH|Tool with bristles used for painting|Brief encounter with danger
CANVAS|Fabric on which an artist paints|A strong woven fabric used as a painting surface
FRAME|Border around a picture|Single image in a film sequence
TRAIN|Railway vehicle that carries passengers|Teach a skill through practice
PLANE|Fixed-wing aircraft|Carpenter's tool for smoothing wood
BOAT|Small waterborne vessel|Craft propelled by oars, sails or a motor
BICYCLE|Two-wheeled vehicle powered by pedals|A pedal-driven vehicle with two wheels
WHEEL|Circular component that rotates on an axle|Steering device on a ship
ROAD|Route surfaced for vehicles|Highway or lane
STREET|Public road lined with buildings|Urban thoroughfare
PATH|Track made for walking|Course taken to reach a goal
MAP|Drawing showing the features of an area|Chart a route
NORTH|Direction opposite south|Direction opposite south
SOUTH|Direction opposite north|Direction opposite north
EAST|Direction of sunrise|Direction of sunrise
WEST|Direction of sunset|Direction of sunset
COMPASS|Instrument with a needle that points north|Scope or range
TRAVEL|Go from one place to another|Go from one place to another
TICKET|Proof of a right to travel or enter an event|Official notice of a parking offence
HOTEL|Building offering paid overnight accommodation|Lodging with a reception desk
BREAD|Food baked from dough|Food traditionally broken at a shared meal
BUTTER|Dairy spread often put on toast|A dairy product made by churning cream
CHEESE|Dairy food such as cheddar|Food made from the pressed curds of milk
HONEY|Sweet food made by bees|Sweet substance produced by bees from nectar
SUGAR|Sweet crystals used in cooking|Sweet crystals used in cooking
SALT|Seasoning made of white crystals|Seasoning made of white crystals
PEPPER|Spice commonly paired with salt|Bombard with questions
OLIVE|Small fruit pressed for cooking oil|Yellowish-green colour
LEMON|Sour yellow citrus fruit|Fruit squeezed into a traditional drizzle cake
MELON|Large fruit with sweet flesh and many seeds|Cantaloupe, for example
GRAPE|Small fruit used to make wine|Small fruit used to make wine
PEACH|Soft stone fruit with fuzzy skin|Fruit used in a traditional Melba dessert
PEAR|Fruit with a narrow neck and broad base|Conference or Comice fruit
CHERRY|Small stone fruit commonly red|Fruit topping a traditional Bakewell tart
BERRY|Small juicy fruit|Currant or gooseberry, for example
CARROT|Orange root vegetable|Incentive offered to encourage action
ONION|Edible bulb with pungent layered flesh|Vegetable sliced into rings for frying
POTATO|Vegetable used to make chips and mash|Edible tuber with eyes
TOMATO|Red fruit commonly sliced into salads|Main ingredient of passata
SALAD|Cold dish of mixed vegetables|Waldorf or Caesar dish
SOUP|Liquid dish commonly served as a starter|Broth or bisque
PASTA|Food such as spaghetti or macaroni|Dough shaped into tubes, ribbons or shells
RICE|Grain used in risotto|Crop traditionally grown in flooded paddies
CURRY|Spiced dish commonly served with rice|Vindaloo or korma, for example
THYME|Herb with tiny aromatic leaves|Aromatic herb with small leaves used in cooking
BASIL|Herb commonly used in pesto|Aromatic herb traditionally used in green pesto
MINT|Herb used in a sauce served with lamb|Factory that produces coins
SAGE|Culinary herb with grey-green leaves|Person respected for wisdom
ROSE|Flower traditionally given on Valentine's Day|Moved upwards
LILY|Bulb-grown flower with large showy blooms|Flower with trumpet-shaped or swept-back blooms
DAISY|Flower with a yellow centre and white rays|Flower linked into a traditional chain
TULIP|Cup-shaped spring flower grown from a bulb|Bloom associated with Dutch bulb fields
PETAL|One of the coloured parts surrounding a flower's centre|Part plucked in a game of romantic uncertainty
ROOT|Plant part that anchors it and absorbs water|Underlying cause of a problem
LEAF|Flat part of a plant that carries out photosynthesis|Single sheet in a book
STEM|Main supporting stalk of a plant|Stop the flow of something
SEED|Plant structure that can germinate|Ranked player placed in a tournament draw
BIRD|Animal with feathers and a beak|Feathered vertebrate
ROBIN|Small bird with an orange-red breast|Small bird with an orange-red breast
EAGLE|Large bird of prey with a hooked beak|Golf score two strokes under par
HERON|Long-legged bird that catches fish|Long-legged wading bird with a long pointed bill
SWAN|Large waterbird with a long neck|Waterbird whose young are cygnets
OWL|Bird of prey with a facial disc|Bird associated with wisdom in folklore
RAVEN|Large black bird related to the crow|A large black bird of the crow family
HORSE|Animal ridden with a saddle|Gymnastics apparatus used for vaulting
SHEEP|Farm animal raised for wool|Flock member
TIGER|Large wild cat with dark stripes|Largest living species of cat
ZEBRA|African equine with black-and-white stripes|Wild relative of a donkey
OTTER|Swimming mammal with a thick tail|A semi-aquatic mammal of the weasel family
BADGER|Black-and-white woodland mammal|A burrowing mammal with a striped face
WHALE|Large marine mammal that breathes through a blowhole|Baleen or toothed sea mammal
SHARK|Cartilaginous fish with rows of teeth|Ruthless swindler
SNAIL|Slow-moving mollusc with a coiled shell|Garden visitor leaving a trail of slime
SPIDER|Eight-legged animal that produces silk|Arachnid with spinnerets
ANT|Small insect living in a colony|Colony insect with a queen
BEE|Insect that gathers pollen and nectar|Hive resident
HEART|Organ that pumps blood|Muscular organ that circulates blood
BRAIN|Organ used for thinking|Organ forming the main part of the central nervous system
SMILE|Facial expression of pleasure with upturned mouth corners|Beam with happiness
DREAM|Sequence of images experienced during sleep|Cherished ambition
SLEEP|Natural state of rest with reduced awareness|Slumber
PEACE|Freedom from war or conflict|Tranquillity
HOPE|Feeling that something desired may happen|Grounds for optimism
TRUST|Confidence in someone's honesty|Legal arrangement for managing assets for another
LAUGH|Make sounds expressing amusement|Chuckle or guffaw
FRIEND|Person one knows and likes|Ally or companion
FAMILY|Group of related people|Category in biological classification
CHILD|Young person below adulthood|Son or daughter
SCHOOL|Place where children are taught|Group of fish swimming together
LESSON|Period of instruction|Experience that teaches a useful truth
NUMBER|Word or symbol representing a quantity|Song performed in a musical
ANSWER|Response to a question|Solution to a problem
RIDDLE|Question designed to test ingenuity|Sieve used to separate soil from stones
PUZZLE|Problem or game that needs solving|Problem or game that needs solving
SECRET|Fact deliberately kept hidden|Known only to a select few
SILENCE|Absence of sound|Make someone stop speaking
BALANCE|Steady position without falling|An even distribution of weight that provides stability
PATTERN|Repeated decorative design|Model used as a guide for making something
CIRCLE|Round plane shape with every boundary point equally far from its centre|Group sharing an interest
SQUARE|Shape with four equal sides and four right angles|Product of a number multiplied by itself
ANGLE|Figure formed by two rays meeting at a point|Particular way of viewing a situation
EDGE|Boundary of a surface|Slight advantage over a rival
CENTRE|Middle point|Player positioned between the wings
CORNER|Point where two sides meet|Trap with no way to escape
THREAD|Fine strand used for sewing|Series of connected online messages
NEEDLE|Sewing tool with an eye|Slender pointer on a gauge
BUTTON|Small fastener passed through a hole in fabric|Control pressed to operate a machine
POCKET|Small pouch sewn into clothing|Area enclosed within a larger region
COTTON|Soft plant fibre used to make cloth|Fibre used in denim
WOOL|Fibre sheared from sheep|Material spun into yarn for knitting
LINEN|Fabric made from flax|Fabric made from flax fibres
VELVET|Soft fabric with a dense pile|Woven fabric with a short dense pile
AMBER|Golden fossilised tree resin|Fossilised tree resin used in jewellery
OPAL|Gemstone with changing colours|A gemstone valued for its changing display of colours
PEARL|Gem formed inside an oyster|A hard lustrous sphere formed within a mollusc
CORAL|Hard substance built by colonies of tiny marine animals|Pinkish-orange colour
COPPER|Reddish-brown metal used in wires|Reddish metal with the chemical symbol Cu
IRON|Metal used to make steel|Metal with the chemical symbol Fe
STEEL|Strong metal alloy made with iron|Strong metal alloy made with iron
BRASS|Yellow alloy of copper and zinc|Alloy made principally from copper and zinc
TIN|Metal used to coat food cans|Metal with the chemical symbol Sn
TIDE|Regular rise and fall of the sea|The regular rise and fall of the sea’s surface
CURRENT|Flow of water or electricity|Flow of water or electricity
HARBOUR|Sheltered place where boats moor|A sheltered area of water where vessels can moor
ANCHOR|Heavy object used to hold a ship in place|A heavy device used to hold a vessel in place
SAIL|Sheet of fabric that catches wind to propel a boat|Travel by water
REEF|Ridge of rock or coral near the sea surface|A ridge of rock or coral near the surface of the sea
COVE|Small sheltered coastal inlet|A small sheltered coastal inlet
CLIFF|High steep rock face|Precipice
VALLEY|Low land between hills or mountains|Elongated depression carved by a river or glacier
MOUNTAIN|Large natural elevation of the land|Peak with steep slopes
MEADOW|Field of grass and wild flowers|A field of grass, often grown for hay
STREAM|Small flowing watercourse|Transmit video continuously over the internet
SPRINT|Run fast over a short distance|Short burst of maximum-speed running
CRICKET|Bat-and-ball sport with wickets|A bat-and-ball game played between two teams of eleven
TENNIS|Racket sport played over a net|A racket sport in which a ball is hit over a net
CHESS|Board game with kings and queens|A strategy board game played with sixteen pieces per side
CHAMPION|Winner of a competition|Defend or support a cause
UMPIRE|Official overseeing a cricket or tennis match|Official who enforces the rules in cricket or tennis
QUARTZ|Common mineral used in watches|A crystalline mineral made of silicon dioxide
SONNET|Poem traditionally of fourteen lines|A poem traditionally consisting of fourteen lines
ACORN|Nut produced by an oak tree|The fruit of an oak tree
ELM|Deciduous tree affected by Dutch disease|Tree with rough leaves and winged seeds
OAK|Tree that produces acorns|Tree that produces acorns
FERN|Plant with fronds and no flowers|A non-flowering plant with fronds that reproduces by spores
MOSS|Small non-flowering plant forming soft green clumps|Plant without true roots that reproduces by spores
IVY|Evergreen climber with lobed leaves|Wall-clinging plant with aerial roots
LANTERN|Portable lamp with a protective enclosure|Light carried inside a case
KETTLE|Vessel used to boil water for tea|Container with a spout, lid and handle
TEAPOT|Vessel used to brew and pour tea|Pouring vessel holding an infused leaf drink
APRON|Protective garment worn over the front of clothes|Area of an airfield where aircraft are parked
RECIPE|Instructions for preparing a dish|Method likely to produce a particular result
PANTRY|Room or cupboard used to store food|Larder
YEAST|Organism that makes bread dough rise|Microorganism used to ferment dough and make it rise
DOUGH|Mixture of flour and liquid before baking|Money, informally
CRUST|Outer layer of a loaf|Outermost solid layer of the Earth
`;
const ORIGINAL_WORDS=source.trim().split('\n').map(line=>{const [answer,easy,hard]=line.split('|'); return {answer,easy,hard}});

// Prefer explicit editorial changes over silent last-write-wins clue replacement.
const bank = [...ORIGINAL_WORDS,...MORE_WORDS,...EXTENDED_WORDS,...NEW_WORDS,...SHORT_WORDS];
const errors = validateWordBank(bank);
if (errors.length) throw new Error(`Invalid clue bank: ${errors.join('; ')}`);
export const WORDS = bank;
