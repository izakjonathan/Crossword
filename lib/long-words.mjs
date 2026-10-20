// Original direct definitions; explicit vocabulary bands independent of length.
// Additional clue senses are reviewed in clue-ratings.mjs.
const source = `
AIRCRAFT|1|Vehicle designed to fly
BATHROOM|1|Room containing a bath or shower
BEDROOM|1|Room used for sleeping
BIRTHDAY|1|Anniversary of the day someone was born
BOOKCASE|1|Piece of furniture with shelves for books
BREAKFAST|1|First meal of the day
CHILDHOOD|1|Period of life before adulthood
CLASSROOM|1|Room in which lessons are taught
DOORBELL|1|Button-operated chime at a house entrance
DOWNSTAIRS|1|On a lower floor
EVERYBODY|1|All the people
FOOTBALL|1|Team sport played with a round ball and goals
GRANDFATHER|1|Father of one's parent
GRANDMOTHER|1|Mother of one's parent
HAIRBRUSH|1|Tool with bristles for grooming the head
HAMBURGER|1|Ground-meat patty served in a bun
HOMEWORK|1|School tasks done outside lessons
HOUSEWORK|1|Cleaning and similar domestic tasks
KEYBOARD|1|Set of keys used for typing
NEWSPAPER|1|Printed publication reporting current events
NOTEBOOK|1|Bound pages for making written records
PLAYGROUND|1|Outdoor area with equipment for children
RAINCOAT|1|Garment worn to keep out wet weather
SANDWICH|1|Filling between slices of bread
SHOPPING|1|Buying goods in stores
SNOWBALL|1|Rounded lump of compacted frozen flakes
SUNGLASSES|1|Tinted spectacles worn in bright light
TELEPHONE|1|Device for speaking to someone at a distance
TOOTHBRUSH|1|Bristled tool used to clean the mouth
UMBRELLA|1|Folding canopy carried in the rain
UPSTAIRS|1|On a higher floor
VEGETABLE|1|Edible plant such as a carrot or cabbage
WARDROBE|1|Tall cupboard for hanging clothes
WATERFALL|1|Cascade flowing over a steep drop
WEDNESDAY|1|Day between Tuesday and Thursday
WEEKEND|1|Saturday and Sunday together
AFTERNOON|1|Period between midday and evening
ADVENTURE|2|Exciting or unusual experience
AGREEMENT|2|Arrangement accepted by all parties
APPETITE|2|Desire for food
ARCHITECT|2|Person who designs buildings
ASSEMBLY|2|Gathering of people for a shared purpose
AUDIENCE|2|People watching a performance
BACKWARDS|2|Towards the rear
BLUEPRINT|2|Detailed technical plan
BOOKMARK|2|Marker used to keep one's place while reading
BROADCAST|2|Transmit a programme by radio or television
BUTTERFLY|2|Insect with broad, often colourful wings
CARDBOARD|2|Stiff material used to make packing boxes
CATHEDRAL|2|Church containing a bishop's official seat
CELEBRATE|2|Mark a special occasion with festivities
CHARACTER|2|Person portrayed in a story
CHOCOLATE|1|Sweet food made from cacao
COMPLAINT|2|Expression of dissatisfaction
CONDUCTOR|2|Person directing an orchestra
CONDITION|2|State in which something exists
CONTRAST|2|Striking difference between things
CREATURE|2|Living being, especially an animal
CROSSROADS|2|Junction where two routes intersect
DAFFODIL|2|Spring flower with a trumpet-shaped centre
DEADLINE|2|Latest time for completing a task
DELICATE|2|Easily damaged or broken
DEPARTURE|2|Act of leaving a place
DESCRIBE|2|Give an account in words
DESTINATION|2|Place towards which someone travels
DICTIONARY|2|Reference book explaining the meanings of words
DIRECTION|2|Course along which something moves
DISCOVERY|2|Finding something previously unknown
DOWNSPOUT|2|Pipe carrying rainwater down from a roof
DRAWBRIDGE|2|Movable crossing that can be raised for boats
EDUCATION|2|Process of acquiring knowledge and skills
EMERGENCY|2|Serious situation requiring immediate action
ENCOUNTER|2|Unexpected meeting
ENCOURAGE|2|Give someone confidence or support
ENTERTAIN|2|Provide amusement for guests
ENTRANCE|2|Opening through which one goes into a building
EQUIPMENT|2|Set of tools needed for a particular activity
EVERGREEN|2|Plant retaining leaves throughout the year
EXCEPTION|2|Case that does not follow the rule
EXHIBITION|2|Public display of works of art or other items
EXPERIMENT|2|Scientific test of an idea
EXPRESSION|2|Look on someone's face
FIREPLACE|1|Hearth in which a domestic fire burns
FOLLOWING|2|Group of supporters
FORMATION|2|Arrangement of people or objects
FOUNDATION|2|Supporting base of a building
FRIENDSHIP|1|Relationship between people who like each other
FURNITURE|1|Movable household items such as tables and chairs
GENERATION|2|People born at roughly the same time
GOVERNMENT|2|Body that administers a country
GREENHOUSE|2|Glass building used for growing plants
GUIDELINE|2|Recommendation for how to proceed
HARMONICA|2|Small wind instrument held to the mouth
HIGHLIGHT|2|Most memorable part of an event
HORIZONTAL|2|Parallel to level ground
IMAGINATION|2|Ability to form ideas beyond present reality
IMPORTANT|1|Of great significance
INDEPENDENT|2|Free from outside control
INFORMATION|2|Facts provided about a subject
INGREDIENT|2|One component of a recipe
INSTRUMENT|2|Tool used for precise work
INVITATION|2|Request to attend an event
LANDSCAPE|2|Visible features of an area of countryside
LIGHTHOUSE|2|Coastal tower with a warning lamp for ships
LITERATURE|2|Written works considered for their artistic value
MICROSCOPE|2|Instrument that magnifies very small objects
NEIGHBOUR|1|Person living next door
NIGHTMARE|1|Frightening dream
OBSERVATION|2|Careful watching of something
OPPORTUNITY|2|Favourable chance to do something
ORCHESTRA|2|Large group of instrumental musicians
PARACHUTE|2|Fabric canopy used to slow a descent through the air
PASSENGER|1|Traveller who is not driving
PERFORMANCE|2|Presentation of a play or piece of music
PHOTOGRAPH|1|Image captured by a camera
PLATFORM|2|Raised surface on which people may stand
POLICEMAN|1|Male officer who enforces the law
POPULATION|2|All the inhabitants of a place
PORTRAIT|2|Picture of a particular person
PRACTICAL|2|Suited to actual use
PRESIDENT|2|Elected head of a republic
PRINCIPLE|2|Fundamental rule or belief
PROCEDURE|2|Established sequence of steps
PROFESSION|2|Occupation requiring specialised training
PROGRESS|2|Movement towards a goal
PROMOTION|2|Advancement to a higher rank
PROTECTION|2|Action that keeps something safe
QUESTIONS|1|Requests for answers
RAILWAY|1|Transport system using tracks and trains
RECEPTION|2|Welcoming area at a hotel
RECTANGLE|2|Four-sided figure with four right angles
REFERENCE|2|Mention of something else
REFLECTION|2|Image seen in a mirror
REMAINDER|2|Amount left after the rest has been taken
RESTAURANT|1|Business where customers pay to eat meals
REVOLUTION|2|Complete overthrow of a political system
SATELLITE|2|Object orbiting a larger body in space
SIGNATURE|2|Person's name written to authenticate a document
SITUATION|2|Set of circumstances at a particular time
SKELETON|2|Framework of bones inside a body
SOLUTION|2|Answer to a problem
SOMETHING|1|An unspecified thing
STAIRCASE|1|Set of steps connecting floors
STATEMENT|2|Formal expression of facts or an opinion
STRUCTURE|2|Arrangement of connected parts
SUBMARINE|2|Vessel that can operate underwater
SUNFLOWER|1|Tall plant with a large yellow flower head
SURPRISE|1|Unexpected event
SWIMMING|1|Moving through water using one's body
TELESCOPE|2|Instrument for viewing distant objects
TEMPERATURE|2|Measure of how hot or cold something is
TERRITORY|2|Area of land under a particular authority
THOUSAND|1|Ten hundreds
TIMETABLE|1|Schedule of departure times or lessons
TRADITION|2|Custom passed down through generations
TRANSLATE|2|Express in another language
TRANSPORT|2|Carry people or goods from one place to another
TREASURE|2|Accumulated wealth of precious objects
TRIANGLE|1|Shape with three sides
UNDERGROUND|2|Below the surface of the earth
UNIVERSITY|2|Institution offering higher education and degrees
VACATION|1|Holiday, in American English
VELOCITY|3|Speed in a specified direction
VERTICAL|2|At right angles to level ground
VOLUNTEER|2|Person offering to help without being forced
WALLPAPER|1|Decorative covering pasted onto a room's walls
WONDERFUL|1|Extremely good or pleasing
WORKSHOP|2|Room equipped for making or repairing things
`;
export const LONG_WORDS = source.trim().split('\n').map(line=>{const [answer,level,easy]=line.split('|');return {answer,vocabularyLevel:Number(level),easy,hard:easy};});
