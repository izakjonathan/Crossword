// Original phrase meanings and clues. Each sense has its own grammatical record.
// Author/reviewer are recorded transparently as assistant work, not human certification.
const rows=`
Wash up|Clean plates and cutlery after a meal|Wash used dishes|verb
Wipe down|Clean a surface by rubbing it with a cloth|Clean a tabletop with a cloth|verb
Tidy up|Put an untidy place into order|Make a messy room neat|verb
Pack away|Put items into storage after using them|Return equipment to its storage place|verb
Put away|Return something to its usual storage place|Store an item after use|verb
Hang up|End a telephone conversation|Finish a phone call|verb
Hang out|Spend time relaxing in a place, informally|Spend leisure time with friends, informally|verb
Turn off|Stop a device operating using its control|Stop a lamp from shining using its switch|verb
Turn on|Start a device operating using its control|Start a lamp shining using its switch|verb
Switch off|Stop an electrical device using its control|Stop a television operating with its power button|verb
Switch on|Start an electrical device using its control|Start an electrical appliance with its power button|verb
Log in|Enter credentials to access a computer account|Access an account using a username and password|verb
Log out|End a session in a computer account|End a signed-in computer session|verb
Sign in|Record your arrival or access an account|Record your arrival in a visitors' book|verb
Sign out|Record your departure from a place|Record that you are leaving in a visitors' book|verb
Check in|Register your arrival at a hotel or airport|Register your arrival at a hotel reception|verb
Get up|Rise from bed after sleeping|Leave your bed after waking|verb
Sit down|Lower yourself onto a seat|Take a seat|verb
Lie down|Place yourself in a horizontal resting position|Rest in a horizontal position|verb
Wake up|Stop sleeping|Become conscious after sleeping|verb
Stand up|Rise to an upright position on your feet|Rise from your chair onto your feet|verb
Come in|Enter the place where the speaker is|Enter, as an invitation from inside a room|verb
Go out|Leave a building or home|Leave home for an evening activity|verb
Go back|Return to an earlier place|Return to the place you left|verb
Walk away|Leave a place on foot|Leave on foot|verb
Look up|Search for information in a reference source|Search for a word in a dictionary|verb
Look out|Be alert to possible danger|Be alert to approaching danger|verb
Find out|Discover previously unknown information|Discover information you did not know|verb
Work out|Exercise to improve physical fitness|Exercise at a gym|verb
Figure out|Understand something after thinking about it|Understand after considering the problem|verb
Carry on|Continue an activity|Continue what you were doing|verb
Keep up|Maintain the same pace as someone else|Maintain another person's pace|verb
Catch up|Reach someone who has gone ahead|Reach a person who is ahead of you|verb
Slow down|Reduce the speed of an activity or movement|Reduce your speed|verb
Speed up|Increase the speed of an activity or movement|Increase your speed|verb
Calm down|Become less upset or excited|Become less agitated|verb
Cheer up|Become happier|Become more cheerful|verb
Grow up|Develop from childhood into adulthood|Develop into an adult|verb
Dress up|Wear special or unusually smart clothes|Wear fancy clothes for an occasion|verb
Show up|Arrive at an expected place, informally|Arrive at the expected place, informally|verb
Set off|Begin a journey|Begin a journey|verb
Set out|Begin a journey or undertaking|Begin a planned journey|verb
Take off|Leave the ground in flight|Leave the ground, as a plane does|verb
Put on|Place clothes on your body|Dress yourself in a garment|verb
Try on|Wear a garment briefly to assess its fit|Test a garment's fit by wearing it|verb
Try out|Test something to assess how it works|Test a new piece of equipment|verb
Give up|Stop trying to do something|Stop trying|verb
Give in|Stop resisting a demand|Stop resisting a demand|verb
Hand in|Submit a document or assignment|Submit an assignment to a teacher|verb
Hand out|Distribute items to people|Distribute leaflets to people|verb
Fill in|Write information in blank spaces on a form|Complete the blanks on a form|verb
Fill out|Complete a form with required information|Complete a form with the required details|verb
Cross out|Draw a line through written text to delete it|Delete written text with a line through it|verb
Rub out|Remove a pencil mark with an eraser|Remove a pencil mark with an eraser|verb
Cut out|Remove a shape from material using scissors|Remove a shape from paper with scissors|verb
Cut off|Stop a supply or connection|Disconnect a supply|verb
Break up|End a romantic relationship|End a romantic relationship|verb
Break in|Enter a building by force|Enter a building by force|verb
Break out|Escape from confinement|Escape from confinement|verb
Break down|Stop functioning, as a machine|Stop functioning, as a car engine might|verb
Dry off|Remove moisture from a surface or body|Remove moisture with a towel|verb
Dry out|Lose contained moisture|Lose moisture after becoming soaked|verb
Dry up|Become empty of liquid|Become empty of water, as a well might|verb
Fold up|Bend an object into a smaller shape for storage|Bend into a compact shape for storage|verb
Roll up|Wind material into a cylindrical shape|Wind a sheet into a cylinder|verb
Roll out|Flatten dough using a cylindrical kitchen tool|Flatten pastry dough with a kitchen tool|verb
Wrap up|Cover an object with paper or another material|Cover a present in decorative paper|verb
Run out|Have no remaining supply of something|Have no supply left|verb
Run into|Meet someone unexpectedly|Meet an acquaintance unexpectedly|verb
Run over|Pass over something with a vehicle|Drive over something in a vehicle|verb
Drop off|Take someone to a place and leave them there|Take a passenger to their destination|verb
Drop in|Visit someone without a formal arrangement|Visit briefly without an appointment|verb
Join in|Take part in an activity with others|Take part in an activity already under way|verb
Hold on|Wait for a short time|Wait a moment|verb
Hang on|Wait for a short time, informally|Wait a moment, informally|verb
Move on|Proceed to the next place or topic|Proceed to the next topic|verb
Step up|Increase the amount or intensity of an activity|Increase the intensity of an effort|verb
Step down|Resign from a position of responsibility|Resign from a position|verb
Save up|Accumulate money for a purpose|Accumulate money for a purchase|verb
Pay off|Settle a debt completely|Settle a debt in full|verb
Pay up|Pay money that is owed|Pay an outstanding amount|verb
Put off|Postpone an activity|Postpone a planned activity|verb
Call off|Cancel a planned event|Cancel a planned event|verb
Call back|Return a telephone call|Return someone's telephone call|verb
Ring up|Telephone someone, in British usage|Telephone someone, in British usage|verb
Brush off|Dismiss someone or something casually|Dismiss a suggestion casually|verb
Brush up|Refresh previously learned knowledge or skills|Refresh a skill you learned earlier|verb
Clean up|Remove dirt or mess from a place|Remove the mess from a place|verb
Clear up|Resolve a misunderstanding|Resolve a misunderstanding|verb
Clear out|Remove unwanted items from a place|Remove unwanted items from a room|verb
Sort out|Resolve a problem or put things in order|Resolve a problem|verb
Throw out|Discard an unwanted item|Discard an unwanted item|verb
Throw away|Discard something no longer wanted|Discard something no longer wanted|verb
Ice cube|Small solid piece of frozen water|Small piece of frozen water put in a drink|noun
Coat hook|Wall fitting used to hang outerwear|Wall fitting for hanging a jacket|noun
Shoe rack|Storage frame for footwear|Storage frame for footwear|noun
Key fob|Small item attached to a set of keys|Small attachment carried with a set of keys|noun
Dust pan|Small flat receptacle used with a brush to collect dirt|Small flat receptacle used with a cleaning brush|noun
Bin bag|Disposable liner for a rubbish container|Disposable liner for a rubbish container|noun
Bath towel|Large absorbent cloth used after washing your body|Large absorbent cloth used after a shower|noun
Hand towel|Small cloth used to dry washed hands|Small cloth beside a sink for drying yourself|noun
Face cloth|Small cloth used for washing your face|Small cloth used to wash your cheeks and forehead|noun
Curtain rod|Horizontal pole supporting window drapes|Horizontal pole supporting window drapes|noun
Sink plug|Stopper that closes the drain in a washbasin|Stopper that keeps water in a washbasin|noun
Earplug|Small device inserted in an ear to reduce sound|Small insert that reduces sound reaching your ear|noun
Lip balm|Protective preparation applied to the lips|Protective preparation for chapped lips|noun
Sun cream|Skin preparation that helps protect against ultraviolet light|Skin preparation for protection against ultraviolet light|noun
Milk jug|Small vessel for serving milk|Small vessel used for serving dairy liquid with tea|noun
Sugar bowl|Container for serving granulated sugar|Table container for granulated sweetener|noun
Jam jar|Glass container used to store fruit preserve|Glass container for fruit preserve|noun
Jam tart|Small pastry case filled with fruit preserve|Small pastry case filled with fruit preserve|noun
Cake tin|Metal container used for baking a cake|Metal container for baking a sponge|noun
Bread tin|Rectangular container used for baking a loaf|Rectangular container for baking a loaf|noun
Bread knife|Serrated cutting tool used to slice a loaf|Serrated tool for slicing a loaf|noun
Butter knife|Blunt table utensil used to spread butter|Blunt table utensil for spreading a dairy product|noun
Soup spoon|Rounded utensil used to eat soup|Rounded utensil for eating broth|noun
Can opener|Tool that cuts the lid from a metal food container|Tool that cuts the lid from a metal food container|noun
Tin opener|British name for a tool that opens metal food containers|British name for a tool that opens metal food containers|noun
Spice rack|Storage frame for jars of culinary seasonings|Storage frame for jars of culinary seasonings|noun
Dish rack|Frame that holds washed plates while they drain|Frame for draining washed plates|noun
Colander|Perforated bowl used to drain food|Perforated bowl for draining pasta|noun
Rolling pin|Cylindrical tool used to flatten pastry dough|Cylindrical tool used to flatten pastry|noun
Chopsticks|Pair of slender sticks used for eating|Pair of slender sticks used for eating|noun
`.trim().split('\n');
export const ADDITIONS=rows.map(line=>{const[display,definition,text,partOfSpeech]=line.split('|');return{display,score:90,subject:partOfSpeech==='verb'?'everyday-actions':'household',clues:[{level:1,text,definition,partOfSpeech,grammar:{form:partOfSpeech==='verb'?'base':'common-noun',number:partOfSpeech==='verb'?'not-applicable':display==='Chopsticks'?'plural':'singular',tense:partOfSpeech==='verb'?'base':'none'},style:'literal',register:/informally/.test(text)?'informal':'standard',answerForm:'normal'}]};});

// Explicit alternate meanings, not paraphrases promoted to an invented tier.
const alternatives=[
 ['ROLL OUT',3,'Launch for wider use, as a new service','Introduce a product or service for general use','verb'],
 ['WORK OUT',3,'Come to a satisfactory conclusion','Develop or end successfully','verb'],
 ['LOOK UP',3,"Improve, as someone's prospects",'Become better or more promising','verb'],
 ['TURN ON',3,'Become hostile toward, as an ally might','Suddenly attack or oppose someone previously supported','verb'],
 ['TURN OFF',2,'Cause someone to lose interest','Make someone feel uninterested or repelled','verb'],
 ['SET OFF',3,'Cause to explode, as fireworks','Trigger an explosion or an alarm','verb'],
 ['SET OUT',3,'Present in an orderly written form','Explain or arrange information clearly','verb'],
 ['TAKE OFF',3,"Imitate someone's mannerisms, informally",'Impersonate a person for humorous effect','verb'],
 ['GIVE UP',2,'Relinquish possession of','Surrender or cease to hold something','verb'],
 ['HANG UP',3,'An emotional inhibition, as a hyphenated noun','A psychological inhibition or source of anxiety','noun'],
 ['BREAK DOWN',3,'Analyze by separating into smaller parts','Divide a complex subject into components for examination','verb'],
 ['BREAK OUT',3,'Begin suddenly, as a conflict','Start suddenly, especially something unwelcome','verb'],
 ['BREAK IN',3,'Make new footwear comfortable through wear','Soften or adapt a new item by using it','verb'],
 ['BREAK UP',3,'Disperse, as a gathering','Cause a group or gathering to separate','verb'],
 ['CUT OUT',3,'Stop working unexpectedly, as an engine','Cease operating suddenly','verb'],
 ['CUT OFF',3,'Prevent from receiving an inheritance','Disinherit someone','verb'],
 ['PUT OFF',3,'Cause to lose enthusiasm','Discourage or deter someone from an activity','verb'],
 ['PAY OFF',3,'Bring a worthwhile return, as an investment','Produce a beneficial result','verb'],
 ['CLEAR UP',3,'Become brighter after rain, as the weather','Improve after cloudy or wet weather','verb'],
 ['WRAP UP',3,'Bring a discussion to a conclusion, informally','Finish or conclude a matter','verb'],
 ['RUN OUT',2,'Expire, as a permit','Reach the end of a period of validity','verb'],
 ['RUN INTO',3,'Encounter unexpectedly, as a complication','Experience an unforeseen difficulty','verb'],
 ['RUN OVER',3,'Continue beyond an allotted time','Exceed a scheduled duration','verb'],
 ['COME IN',3,'Become available, as election results','Arrive or become known, especially reports or results','verb'],
 ['DROP OFF',3,'Fall asleep, informally','Begin to sleep','verb'],
 ['STAND UP',3,'Fail to keep a date with, informally','Fail to attend a meeting with someone who expects you','verb'],
 ['SHOW UP',3,"Expose someone's shortcomings, informally",'Make a person appear inadequate or foolish by comparison','verb'],
 ['DRESS UP',3,'Make an idea seem more attractive than it is','Present something in a more impressive or appealing way','verb'],
 ['RING UP',3,'Record a sale on a cash register','Enter the amount of a purchase on a till','verb'],
 ['SIGN OUT',3,'Borrow by recording your name, as equipment','Record responsibility for an item when taking it away','verb']
];
for(const [display,level,text,definition,partOfSpeech]of alternatives){
 const entry=ADDITIONS.find(row=>row.display.toUpperCase()===display);
 entry.clues.push({level,text,definition,partOfSpeech,grammar:{form:partOfSpeech==='verb'?'base':'hyphenated-noun',number:partOfSpeech==='verb'?'not-applicable':'singular',tense:partOfSpeech==='verb'?'base':'none'},style:'literal',register:/informally/.test(text)?'informal':'standard',answerForm:'normal'});
}
