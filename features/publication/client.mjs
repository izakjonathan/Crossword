export class PublishedPuzzleClient {
 constructor({fetcher=fetch,timeoutMs=30000}={}){this.fetcher=fetcher;this.timeoutMs=timeoutMs;this.pending=null;this.closed=false;}
 async generate({mode,room,token}){
  if(this.closed)throw new Error('Generation cancelled.');if(this.pending)throw new Error('A puzzle is already being loaded.');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),this.timeoutMs);this.pending=controller;
  const requestId=room?.generating?.id||crypto.randomUUID(),body=JSON.stringify({mode,requestId,...(room?{roundId:room.roundId||room.puzzle.id}:{})});
  try{
   let networkFailures=0;
   while(!controller.signal.aborted){
    let response;
    try{response=await this.fetcher('/api/puzzles',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body,cache:'no-store',signal:controller.signal});}
    catch(error){if(controller.signal.aborted||++networkFailures>1)throw error;continue;}
    const result=await response.json();
    if(!response.ok){
     if(result.code==='SUPPLY_REPLENISHING'){
      await new Promise((resolve,reject)=>{const onAbort=()=>{clearTimeout(delay);reject(new Error('Fresh puzzles are still being prepared. Try again shortly. Your current game has been kept.'));};const delay=setTimeout(()=>{controller.signal.removeEventListener('abort',onAbort);resolve();},1000);controller.signal.addEventListener('abort',onAbort,{once:true});});
      continue;
     }
     const error=new Error(result.error||'A fresh puzzle is not ready yet. Your current game has been kept.');error.code=result.code;throw error;
    }
    if(result.puzzle?.publication?.requestId!==requestId)throw new Error('The puzzle service returned an invalid receipt. Your current game has been kept.');
    return result.puzzle;
   }
   throw new Error('Fresh puzzles are still being prepared. Your current game has been kept.');
  }catch(error){if(controller.signal.aborted)throw new Error('The next puzzle was not ready in time. Try again shortly. Your current game has been kept.');throw error;}
  finally{clearTimeout(timer);this.pending=null;}
 }
 dispose(){this.closed=true;this.pending?.abort();}
}
