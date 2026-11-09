'use client';
import {useCallback,useEffect,useRef} from 'react';
import {sendFeedback} from './client.mjs';
export function useQualityEvents(game,solved){
 const state=useRef({id:null,seconds:0,started:null,completed:false}),gameRef=useRef(game);gameRef.current=game;
 useEffect(()=>{
  const id=game?.puzzle.publication?.requestId;if(!id)return;
  const value={id,seconds:0,started:document.visibilityState==='visible'?performance.now():null,completed:false};state.current=value;
  const visibility=()=>{if(value.started!==null)value.seconds+=(performance.now()-value.started)/1000;value.started=document.visibilityState==='visible'?performance.now():null;};
  document.addEventListener('visibilitychange',visibility);
  return()=>{document.removeEventListener('visibilitychange',visibility);if(value.started!==null)value.seconds+=(performance.now()-value.started)/1000;};
 },[game?.puzzle.publication?.requestId]);
 useEffect(()=>{const value=state.current;if(!solved||!game?.puzzle.publication||value.completed)return;value.completed=true;const activeSeconds=value.seconds+(value.started===null?0:(performance.now()-value.started)/1000);sendFeedback(game.puzzle,{kind:'complete',activeSeconds},{eventId:game.puzzle.publication.requestId}).catch(()=>{});},[solved,game?.puzzle.publication?.requestId]);
 return useCallback(event=>{if(gameRef.current)sendFeedback(gameRef.current.puzzle,event).catch(()=>{});},[]);
}
