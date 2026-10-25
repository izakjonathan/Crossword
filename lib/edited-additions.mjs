// Original, individually rewritten clues for common standalone answer senses.
// These replace raw database glosses; vocabulary band remains provisional 2.
const rows=`
NOT|Word that makes a statement negative
OUT|Opposite of in
NEW|Recently made or introduced
NOW|At this very moment
ANY|One or more, whichever you choose
OFF|Switched out of operation
SAY|Express in spoken words
LET|Allow to happen
YET|Up to this point in time
YES|Affirmative reply
ASK|Put a question to someone
AGE|Number of years a person has lived
BUY|Obtain in exchange for money
ADD|Combine numbers to find a total
GUN|Weapon that fires bullets
WOW|Exclamation of amazement
LAY|Put something down flat
RID|Free of something unwanted
BYE|Informal word on parting
SIN|Act considered morally wrong
CON|Disadvantage weighed against a pro
ARC|Curved part of a circle
MAR|Spoil the appearance of
RAP|Musical style featuring rhythmic spoken lyrics
ACE|Playing card that can rank above a king
BEG|Ask earnestly for something
GUT|Informal term for the digestive tract
GIG|Informal term for a live musical performance
COL|Mountain pass between two peaks
BOO|Sound used to startle someone
WEE|Very small, in Scottish usage
WOO|Try to win someone's affection
WAN|Pale and looking unwell
APT|Well suited to the circumstances
ALE|Beer fermented with a top-fermenting yeast
LAG|Fall behind in movement or progress
SAC|Pouchlike structure in the body
FAX|Document sent through a telephone-line machine
GAG|Joke told to get a laugh
SIC|Latin word indicating an error was copied exactly
LEA|Meadow or grassy field, poetically
TOR|Rocky hill or summit, especially in southwest England
DIN|Loud and unpleasant continuing noise
JUST|Fair and morally right
LIKE|Similar to
MUCH|A large amount of
VERY|To a high degree
BEING|Existence itself
LIFE|Period between birth and death
WHILE|A period of time
BEST|Better than all the rest
USED|Previously owned rather than new
BOTH|The two taken together
COME|Move towards the speaker
THREE|Number after two
ALWAYS|At all times without exception
FIND|Discover the location of
GIVE|Hand over to someone else
NEXT|Immediately following in order
EACH|Every one considered separately
FOUND|Discovered after searching
MUST|Be obliged to
SHOW|Display for others to see
MONEY|Coins and banknotes used for payment
NAME|Word by which a person is known
DONE|Finished or completed
GROUP|Collection of people or things
CASE|Container made to hold or protect something
NOTHING|Not a single thing
TODAY|The day that includes the present moment
STOP|Come to a halt
CALL|Contact someone by telephone
SMALL|Limited in size
THANKS|Expression of gratitude
FIVE|Number after four
VIDEO|Recording of moving images
MIND|Faculty used for thinking and reasoning
BODY|Physical form of a person or animal
DEATH|End of a person's life
KNOWN|Recognised rather than unfamiliar
NICE|Pleasant and agreeable
STAY|Remain in the same place
SOON|Before much time has passed
EASY|Requiring little effort
BRING|Carry something towards the speaker
HEARD|Perceived a sound
SONG|Musical composition intended to be sung
STUDY|Devote time to learning a subject
SELF|One's own identity
HELD|Grasped and kept in one's hands
MAIN|Most important or principal
FINE|Financial penalty for an offence
SHOT|An attempt to score in a game
EYES|Organs used for sight
GONE|No longer present
FAST|Moving at great speed
FELT|Fabric made from compressed fibres
SIZE|How large or small something is
PAID|Gave money that was owed
SEND|Cause something to be delivered elsewhere
`;
export const EDITED_ADDITIONS=Object.fromEntries(rows.trim().split('\n').map(line=>{const [answer,text]=line.split('|');return [answer,text];}));
