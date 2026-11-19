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

 const games=[],signatures=[],recent=[];
 for(let i=0;i<100;i++){
  const id=randomUUID(),mode=i%2?'hard':'medium';
  const {puzzle}=await request('/api/continuous',{requestId:id,mode,recent:recent.slice(-30).flat(),signatures});
  assert.ok(puzzle.entries.every(e=>!recent.slice(-30).flat().includes(e.answer)));
  assert.ok(!signatures.includes(puzzle.publication.digest));signatures.push(puzzle.publication.digest);
  recent.push(puzzle.entries.map(e=>e.answer));games.push(puzzle);
 }
 const created=await request('/api/shared',{game:{puzzle:games.at(-1),play:{answers:{},assisted:false,entryId:games.at(-1).entries[0].id,selected:games.at(-1).entries[0].cells[0]}}});
 let room=created.room;
 for(let i=0;i<40;i++){
  const lease=randomUUID(),baseRound=room.roundId;
  await request('/api/shared',{id:lease,kind:'begin',roundId:baseRound,changes:[],assisted:false},created.token,'PATCH');
  const body={requestId:lease,roundId:baseRound,mode:i%2?'hard':'medium',recent:[],signatures:[]};
  const {puzzle}=await request('/api/continuous',body,created.token);
  assert.deepEqual((await request('/api/continuous',body,created.token)).puzzle,puzzle);
  assert.ok(puzzle.entries.every(e=>!(room.recentRounds||[]).slice(-30).flat().includes(e.answer)));
  const replacement={id:randomUUID(),kind:'replace',roundId:baseRound,leaseId:lease,puzzle,changes:[],assisted:false};
  room=await request('/api/shared',replacement,created.token,'PATCH');
  assert.deepEqual(await request('/api/shared',replacement,created.token,'PATCH'),room);
  assert.ok(room.recentRounds.length<=30);
 }
 console.log(JSON.stringify({soloGames:games.length,sharedGames:40,sharedRecentRounds:room.recentRounds.length,receiptRetries:true,replacementRetries:true}));
}finally{app?.kill();await new Promise(resolve=>gateway.close(resolve));redis.kill();}
