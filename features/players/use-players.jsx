'use client';
import {useEffect,useRef,useState} from 'react';
import {lobbyRequest} from '../../lib/lobby-session.mjs';
export function usePlayers(lobbyId,deviceId,name){
  const [state,setState]=useState({participants:[],error:''}),nameRef=useRef(name);nameRef.current=name;
  useEffect(()=>{
    if(!lobbyId)return;
    const controller=new AbortController();let timer,inFlight=false;
    setState({participants:[],error:''});
    async function heartbeat(){
      if(inFlight||controller.signal.aborted)return;inFlight=true;
      try{const result=await lobbyRequest({action:'heartbeat',lobbyId,playerId:deviceId(),name:nameRef.current},controller.signal);if(!controller.signal.aborted)setState({...result,error:''});}
      catch(error){if(!controller.signal.aborted)setState(old=>({...old,error:'Player list reconnecting…'}));}
      finally{inFlight=false;if(!controller.signal.aborted)timer=setTimeout(heartbeat,10000);}
    }
    heartbeat();const refresh=()=>{if(document.visibilityState==='visible'){clearTimeout(timer);heartbeat();}};document.addEventListener('visibilitychange',refresh);
    return()=>{controller.abort();clearTimeout(timer);document.removeEventListener('visibilitychange',refresh);};
  },[lobbyId,deviceId]);
  return lobbyId?state:{participants:[],error:''};
}
