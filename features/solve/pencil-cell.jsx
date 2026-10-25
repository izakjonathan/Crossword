'use client';
import {useRef,useState} from 'react';
import {pencilLetter} from './pencil-model.mjs';

export default function PencilCell({value,onWrite,onSelect,label,disabled}) {
  const [draft,setDraft]=useState(null),composing=useRef(false);
  function commit(text) {
    const letter=pencilLetter(text);
    if(letter!==null)onWrite(letter);
  }
  return <input className="pencil-cell-input" type="text" inputMode="none" autoComplete="off" autoCorrect="off" autoCapitalize="characters" spellCheck={false}
    aria-label={label} disabled={disabled} value={draft===null?value:draft}
    onFocus={e=>{onSelect();e.target.select();}}
    onCompositionStart={e=>{composing.current=true;setDraft(e.currentTarget.value);}}
    onCompositionEnd={e=>{composing.current=false;setDraft(null);commit(e.currentTarget.value);}}
    onChange={e=>{const text=e.target.value;if(composing.current||e.nativeEvent.isComposing)setDraft(text);else commit(text);}} />;
}
