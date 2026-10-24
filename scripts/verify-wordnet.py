"""Verify frozen supplemental definitions against a local WordNet 3.0 corpus.

Development only: install nltk, then pass an nltk_data directory containing
corpora/wordnet. This script never downloads data or modifies the word bank.
"""
import argparse, json
from pathlib import Path
import nltk
from nltk.corpus import wordnet

parser=argparse.ArgumentParser()
parser.add_argument('corpus_root')
args=parser.parse_args()
nltk.data.path.insert(0,args.corpus_root)
source=(Path(__file__).resolve().parents[1]/'lib/supplemental-words.mjs').read_text()
rows=json.loads(source.split('export const SUPPLEMENTAL_WORDS = ',1)[1].rsplit(';',1)[0])
for row in rows:
    sense=wordnet.synset(row['wordnetSense'])
    definition=sense.definition().split(';')[0]
    expected=definition[0].upper()+definition[1:]
    assert sense.lemmas()[0].name().upper()==row['answer'], row['answer']
    assert row['easy']==row['hard']==expected, row['answer']
print(json.dumps({'definitionsChecked':len(rows),'source':'Princeton WordNet 3.0','mismatches':0}))
