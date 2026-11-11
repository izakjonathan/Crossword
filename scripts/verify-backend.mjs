// Full local HTTP verification. Requires disposable Redis binaries; never uses
// Vercel credentials or a production Redis endpoint.
import {spawn,execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {writeFileSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const cli=process.env.REDIS_TEST_CLI;if(!cli)throw Error('Set REDIS_TEST_CLI to a disposable local Redis installation');
const port=process.env.REDIS_HTTP_TEST_PORT||'6497',redis=spawn(cli.replace(/redis-cli$/,'redis-server'),['--port',port,'--bind','127.0.0.1','--save','','--appendonly','no'],{stdio:'ignore'});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));let app;
const command=args=>{const values=args.map(String),input=values.at(-1)?.length>50000?values.pop():undefined;return JSON.parse(execFileSync(cli,['-p',port,'--json',...(input===undefined?[]:['-x']),...values],{encoding:'utf8',input,maxBuffer:4000000}));};
const gateway=createServer(async(req,res)=>{try{if(req.headers.authorization!=='Bearer local-test-token'){res.writeHead(401);res.end('{}');return;}const chunks=[];for await(const chunk of req)chunks.push(chunk);const result=command(JSON.parse(Buffer.concat(chunks).toString('utf8')));res.setHeader('Content-Type','application/json');res.end(JSON.stringify({result}));}catch{res.writeHead(500);res.end(JSON.stringify({error:'Disposable Redis command failed'}));}});
try{
 for(let i=0;i<50;i++){try{if(command(['PING'])==='PONG')break;}catch{}await pause(100);}
 const imported=process.env.BACKEND_HISTORY_FILE?JSON.parse(readFileSync(process.env.BACKEND_HISTORY_FILE,'utf8')).answers:[];
 if(!Array.isArray(imported)||imported.some(a=>!/^[A-Z]{3,11}$/.test(a)))throw Error('Invalid disposable history fixture');
 const protectedAnswers=new Set(imported);
 if(imported.length)command(['HSET','crossword:answer-history:v1',...imported.flatMap(answer=>[answer,'disposable-import'])]);
 await new Promise(resolve=>gateway.listen(0,'127.0.0.1',resolve));
 const gatewayPort=gateway.address().port,base='http://127.0.0.1:3097';
 app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3097','-H','127.0.0.1'],{env:{...process.env,UPSTASH_REDIS_REST_URL:`http://127.0.0.1:${gatewayPort}`,UPSTASH_REDIS_REST_TOKEN:'local-test-token',CRON_SECRET:'local-cron-test-only'},stdio:['ignore','pipe','pipe']});
 let logs='';app.stdout.on('data',chunk=>logs+=chunk);app.stderr.on('data',chunk=>logs+=chunk);
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await pause(100);}
 async function request(path,body,token,method='POST'){
  let response,result;for(let retry=0;retry<60;retry++){response=await fetch(base+path,{method,headers:{...(body?{'Content-Type':'application/json',Origin:base}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});result=await response.json();if(response.status===503&&result.code==='SUPPLY_REPLENISHING'){await pause(500);continue;}break;}assert.ok(response.ok,JSON.stringify({path,status:response.status,result}));return result;
 }
 await request('/api/answer-history',{action:'sync',answers:[]});
 const health=await request('/api/puzzles',null,null,'GET');assert.deepEqual(health.ready,{easy:8,medium:8,hard:8});
 const games=[];for(const mode of ['easy','medium','hard']){
  const id=randomUUID(),start=performance.now(),{puzzle}=await request('/api/puzzles',{mode,requestId:id});
  assert.equal(puzzle.publication.requestId,id);assert.deepEqual((await request('/api/puzzles',{mode,requestId:id})).puzzle,puzzle);
  assert.ok(puzzle.entries.every(e=>!protectedAnswers.has(e.answer)&&!games.some(p=>p.entries.some(old=>old.answer===e.answer))));games.push(puzzle);
  console.log(mode,Math.round(performance.now()-start)+'ms',puzzle.entries.length+' answers');
 }
 const host=randomUUID(),guest=randomUUID(),created=await request('/api/lobbies',{action:'host',name:'Backend test',game:{puzzle:games[0],play:{answers:{},assisted:false,entryId:games[0].entries[0].id,selected:games[0].entries[0].cells[0]}},playerId:host});
 await request('/api/lobbies',{action:'join',lobbyId:created.lobby.id,playerId:guest});
 const lease=randomUUID(),baseRound=created.room.roundId;
 await request('/api/shared',{id:lease,kind:'begin',roundId:baseRound,changes:[],assisted:false},created.token,'PATCH');
 const next=(await request('/api/puzzles',{mode:'hard',requestId:lease,roundId:baseRound},created.token)).puzzle;
 assert.ok(next.entries.every(e=>!protectedAnswers.has(e.answer)&&!games.some(p=>p.entries.some(old=>old.answer===e.answer))));
 const replacement={id:randomUUID(),kind:'replace',roundId:baseRound,leaseId:lease,puzzle:next,changes:[],assisted:false};
 const replaced=await request('/api/shared',replacement,created.token,'PATCH');assert.equal(replaced.puzzle.id,next.id);
 const room=await request('/api/shared',null,created.token,'GET');assert.equal(room.roundId,replacement.id);assert.equal(room.puzzle.publication.digest,next.publication.digest);
 const cell=next.entries[0].cells[0];for(const value of ['A',''])await request('/api/shared',{id:randomUUID(),roundId:room.roundId,changes:[{cell:String(cell),value}],assisted:false},created.token,'PATCH');
 assert.equal((await request('/api/shared',null,created.token,'GET')).answers[cell],'');
 await request('/api/feedback',{eventId:randomUUID(),publicationId:games[0].publication.requestId,clueId:games[0].entries[0].clueId,kind:'report',reason:'wording',comment:'Disposable backend test.'});
 const unauthorized=await fetch(base+'/api/puzzles/replenish');assert.equal(unauthorized.status,401);
 // Wait for real off-thread replenishment and inspect its persisted result.
 for(let i=0;i<70;i++){if(!command(['EXISTS',`crossword:inventory:v1:${health.catalogVersion}:refill`]))break;await pause(500);}
 const final=await request('/api/puzzles',null,null,'GET'),diagnostics=final.diagnostics;
 assert.ok(!Object.keys(diagnostics||{}).some(key=>key.includes('WORKER_FAILED')),JSON.stringify(diagnostics));
 assert.ok(JSON.stringify(diagnostics).includes('lastReplenishment'));
 assert.ok(final.ready.hard>0,'Hard inventory was not replenished after mixed-mode publication: '+JSON.stringify(final));
 const report={importedHistory:imported.length,catalogVersion:health.catalogVersion,publishedModes:games.map(g=>g.mode),sharedReplacement:true,concurrentMembership:true,letterDeletion:true,feedback:true,ready:final.ready,diagnostics};
 writeFileSync(process.env.BACKEND_REPORT_FILE||'/workspace/scratch/crossword-http-verification.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
 if(/Cannot find module|ENOENT/.test(logs))throw Error(logs);
}finally{app?.kill();await new Promise(resolve=>gateway.close(resolve));redis.kill();}
