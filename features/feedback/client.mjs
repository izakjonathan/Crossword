export async function sendFeedback(puzzle,event,{fetcher=fetch,eventId=crypto.randomUUID()}={}){
 if(!puzzle?.publication)return {saved:false,legacy:true};
 const response=await fetcher('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({publicationId:puzzle.publication.requestId,eventId,...event}),cache:'no-store',signal:AbortSignal.timeout(8000)});
 const result=await response.json();if(!response.ok)throw new Error(result.error||'Feedback could not be saved.');return result;
}
