'use client';
import {useRef,useState} from 'react';
import {pencilReplacement} from './pencil-model.mjs';

export default function PencilCell({value,onWrite,label,disabled}) {
  const [draft,setDraft]=useState(null),composing=useRef(false);
  function commit(text) {
    // A new single letter can be inserted beside the previous letter by Scribble.
    const letter=pencilReplacement(value,text);
    if(letter!==null)onWrite(letter);
  }
  return <input className="pencil-cell-input" type="text" inputMode="text" autoComplete="off" autoCorrect="off" autoCapitalize="characters" spellCheck={false}
    aria-label={label} disabled={disabled} value={draft===null?value:draft}
    onPointerDown={e=>{if(e.pointerType!=='pen')e.preventDefault();}}
    onCompositionStart={e=>{composing.current=true;setDraft(e.currentTarget.value);}}
    onCompositionEnd={e=>{composing.current=false;setDraft(null);commit(e.currentTarget.value);}}
    onChange={e=>{const text=e.target.value;if(composing.current||e.nativeEvent.isComposing)setDraft(text);else commit(text);}} />;
}
