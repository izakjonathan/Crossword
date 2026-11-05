import {readFileSync,writeFileSync} from 'node:fs';
import {WORDS as legacy} from '../lib/legacy-words.mjs';
import {annotateClue} from '../lib/clue-policy.mjs';
import {validateWordBank} from '../lib/word-quality.mjs';
const retired=new Set(legacy.map(w=>w.answer));
const normalise=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z]/g,'');
const rows=[];
const removed=new Set(['ENA','ERI','DEB','TEF','IPV','TARAMA','LOUKOUM','FIERO','LORELAX','DOSAI','SABLE','SABL E','INVALID_ANA','PYX','WEN','UDO','QAT','ERI','IPV','TARAMA']);
const fixes={MOUSTRAP:'MOUSETRAP','CARK EYS':'CAR KEYS'};
const popInGeneral=new Set('EMI JED LEE LEN LIZ MEL NIA NOA OLI PAM RAE REN UMA VAL VIC VIN WES ZAC ZOE KIM'.split(' '));
// Explicit editorial selections: these secondary facts demand more recall than
// the direct identification clue. These are provisional tiers, not human scores.
const challenging=new Set('ADELE BEYONCE RIHANNA MADONNA CHER DOLLY ELTON BOWIE FREDDIE BONO SADE LORDE LIZZO LANA DUA LIPA ARIANA GRANDE BILLIE EILISH OLIVIA RODRIGO SABRINA CARPENTER SELENA GOMEZ MILEY CYRUS STYLES ZAYN NIALL LIAM LOUIS SIA KATY BRUNO MARS USHER DRAKE EMINEM KENDRICK LAMAR TUPAC NAS NICKI MINAJ MEGAN CARDI DOJA SVEN KRISTOFF MAUI URSULA ERIC IAGO JAFAR TIMON PUMBAA RAFIKI MUSHU TIANA RAPUNZEL MERIDA REX HAMM FORKY LUCA MIGUEL ANXIETY DOBBY LUNA NEVILLE FRODO GANDALF ARAGORN LEGOLAS GIMLI GOLLUM FINN POE KYLO GROGU GRU SNOOPY ASTA TINTIN ASTERIX OBELIX YOSHI KIRBY TAILS EEVEE KRATOS RYU KEN GOSLING ROBBIE DICAPRIO WINSLET HANKS ALLEN CARREY HAMM LOGAN SHIV ROMAN KENDALL PHOEBE CHANDLER MOE APU SEYMOUR THURMAN MIA DWIGHT NEO TRINITY MORPHEUS KEANU REEVES SID SCRAT MANNY DIEGO EDNA FROZONE TONY BAFTA EGOT'.split(' '));
const hardFood=new Set('DOENJANG YAKITORI BULGOGI KIMBAP RENDANG SAMBAL TEMPEH TAMARI LABNEH DOSA IDLI JALFREZI PAPADUM BULGUR FREEKEH TEFF INJERA FONIO ORZO FARFALLE LINGUINE TAGLIATELLE ARANCINI PANETTONE TIRAMISU GRANITA CANNOLO CANNOLI GANACHE COULIS CHOUX ECLAIR MADELEINE FINANCIER FRIAND AMARETTI BIALY AREPA TAMALE JAMON GUMBO SPAETZLE BORSCHT GOULASH ZAATAR SUMAC DUKKAH BERBERE AJVAR SKORDALIA PECORINO GORGONZOLA GRUYERE EMMENTAL ROQUEFORT TALEGGIO HAVARTI ROOIBOS MATE OOLONG SENCHA PUERH ROBUSTA ARABICA RISTRETTO LUNGO MACCHIATO CORTADO AFFOGATO AMERICANO CAPPUCCINO'.split(' '));
const broad=new Set('ADELE BEYONCE RIHANNA MADONNA CHER ELTON BOWIE LENNON MCCARTNEY RINGO NIRVANA METALLICA RADIOHEAD FREDDIE MERCURY ENYA SADE LORDE LIZZO LANA LIPA ZAYN NIALL USHER NAS TUPAC IAGO RAFIKI ASTA OBELIX CHUNLI KRATOS EEG ECG RNA ADP ATP CSS XML SQL DNS UDP NFC RFID CET BST PHD BSC MSC GPA ENT BMI SPF GDP GNP IPO CFO COO PAYE DARTBOARD GOALPOST SHINPAD OFFSIDE FULLBACK SCRUMHALF FLYHALF LINEOUT TIEBREAK BOGEY ALBATROSS CADDIE FAIRWAY YORKER GOOGLY OFFBREAK LEGSPIN POWERPLAY BULLPEN SHORTSTOP POMMEL HEPTATHLON OCTET NONET DECET RAJ RIA URI LEK LEU LEV SEN LINTEL GROUT GREASEPROOF KITCHENETTE LAVATORY MANTEL TRIVET UPHOLSTERY INDUCTION VENETIAN PUMPERNICKEL'.split(' '));
const familiarFood=new Set('PHO POI DAL MISO UDON SOBA RAMEN SATAY TOFU TAHINI HUMMUS FALAFEL HALLOUMI PANEER GHEE NAAN ROTI RAITA CHUTNEY KORMA BIRYANI PAKORA SAMOSA PILAF COUSCOUS QUINOA POLENTA GNOCCHI RISOTTO ORZO PENNE FUSILLI RIGATONI FARFALLE RAVIOLI FOCACCIA CIABATTA TIRAMISU GELATO SORBET BAKLAVA HALVA NOUGAT MARZIPAN FONDANT MERINGUE PAVLOVA MACARON MACAROON BISCOTTI CHURRO BEIGNET DOUGHNUT BAGEL PRETZEL SOURDOUGH TORTILLA TACO NACHO SALSA GUACAMOLE GAZPACHO PAELLA TAPAS CHORIZO GUMBO SCHNITZEL SAUERKRAUT BORSCHT GOULASH TAGINE TZATZIKI FETA RICOTTA BURRATA STILTON BRIE EDAM GOUDA HAVARTI SKYR KEFIR KOMBUCHA MATCHA CHAI ESPRESSO DECAF LATTE CAPPUCCINO MOCHA'.split(' '));
for(const file of ['pop-culture','general','everyday','food-nature','short-answers']){
 for(const line of readFileSync(new URL('../data/replacement/'+file+'.tsv',import.meta.url),'utf8').split('\n')){
  if(!line||line.startsWith('#'))continue;
  let [raw,easy,other,third]=line.split('|');raw=fixes[raw]||raw;
  const answer=normalise(raw);
  if((removed.has(raw)||removed.has(answer))||retired.has(answer)||answer.length<3||answer.length>11)continue;
  const category=file==='pop-culture'||popInGeneral.has(answer)?'pop-culture':'general';
  if(answer==='ABE')other=undefined;
  if(answer==='IVO')other=undefined;
  if(answer==='DEE')other='Cheshire river reaching the Irish Sea near the Wirral';
  const word={answer,easy,hard:third||other||easy,category,vocabularyLevel:broad.has(answer)||(file==='food-nature'&&!familiarFood.has(answer))?2:1,editorialStatus:'authored',clues:[]};
  word.clues.push(annotateClue(answer,{text:easy,level:1,answerForm:/for short|\babbr\./i.test(easy)?'shortened':'normal',register:/informal|slang/i.test(easy)?'informal':'standard'}));
  if(other)word.clues.push(annotateClue(answer,{text:other,level:(challenging.has(answer)||hardFood.has(answer))&&!third?3:2}));
  if(third)word.clues.push(annotateClue(answer,{text:third,level:3}));
  rows.push(word);
 }
}
for(const line of readFileSync(new URL('../data/replacement/capitals.tsv',import.meta.url),'utf8').split('\n')){
 if(!line||line.startsWith('#'))continue;
 const [country,capital,medium,hard]=line.split('|');
 for(const [name,easy,c2,c3]of [[country,country==='Switzerland'?`Country whose federal city is ${capital}`:country==='Eswatini'?`Country whose administrative capital is ${capital}`:`Country whose capital is ${capital}`],[capital,country==='Switzerland'?`Federal city of ${country}`:country==='Eswatini'?`Administrative capital of ${country}`:`Capital of ${country}`,medium,hard&&normalise(hard).includes(normalise(capital))?undefined:hard]]){
  const answer=normalise(name);if(retired.has(answer)||answer.length<3||answer.length>11)continue;
  if(normalise(easy).includes(answer))continue;
  rows.push({answer,easy,hard:c3||c2||easy,category:'general',vocabularyLevel:new Set('LIMA ROME PARIS OSLO TOKYO SEOUL BERLIN LONDON CAIRO DELHI CHINA INDIA JAPAN CHILE DENMARK SWEDEN NORWAY FRANCE GERMANY ITALY SPAIN GREECE TURKEY CANADA MEXICO BRAZIL AUSTRALIA AUSTRIA IRELAND'.split(' ')).has(answer)?1:2,editorialStatus:'authored',clues:[{text:easy,level:1},...(c2?[{text:c2,level:2}]:[]),...(c3?[{text:c3,level:3}]:[])].map(c=>annotateClue(answer,c))});
 }
}
const unique=new Map();
for(const row of rows)if(!unique.has(row.answer))unique.set(row.answer,row);
const bank=[...unique.values()];
const errors=validateWordBank(bank);if(errors.length){console.error(errors.join('\n'));process.exit(1);}
const report={answers:bank.length,popCulture:bank.filter(w=>w.category==='pop-culture').length,overlap:bank.filter(w=>retired.has(w.answer)).length,lengths:Object.fromEntries([...Map.groupBy(bank,w=>w.answer.length)].map(([n,v])=>[n,v.length])),tier3:bank.filter(w=>w.clues.some(c=>c.level===3)).length};
console.log(JSON.stringify(report,null,2));
const records=bank.map(w=>[w.answer,w.vocabularyLevel,w.category,w.clues.map(c=>[c.level,c.text])]);
const output=`// Authored replacement bank. Rebuild with scripts/build-replacement-bank.mjs.
import {annotateClue} from './clue-policy.mjs';
const records=${JSON.stringify(records)};
export const REPLACEMENT_WORDS=records.map(([answer,vocabularyLevel,category,variants])=>{
 const clues=variants.map(([level,text])=>annotateClue(answer,{level,text,
  answerForm:/for short|\\babbr\\./i.test(text)?'shortened':'normal',
  register:/informal|slang/i.test(text)?'informal':'standard'}));
 return {answer,vocabularyLevel,category,editorialStatus:'authored',easy:clues[0].text,hard:clues.at(-1).text,clues};
});
`;
writeFileSync(new URL('../lib/replacement-words.mjs',import.meta.url),output);
