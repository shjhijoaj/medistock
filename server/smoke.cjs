const { spawn } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const assert = require('node:assert/strict');
const directory = mkdtempSync(join(tmpdir(),'medistock-smoke-'));
const filename = join(directory,'test.sqlite');
let child;
const port = 44313;
async function start() {
  child = spawn(process.execPath,[join(__dirname,'index.cjs')],{env:{...process.env,PORT:String(port),MEDISTOCK_DB:filename},stdio:['ignore','pipe','pipe'],windowsHide:true});
  child.stderr.on('data',chunk=>process.stderr.write(chunk));
  await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',code=>reject(new Error('server exit '+code)));setTimeout(()=>reject(new Error('startup timeout')),5000).unref()});
}
async function stop(){if(!child||child.exitCode!==null)return;await new Promise(resolve=>{child.once('exit',resolve);child.kill()})}
async function api(path,body,method='POST') {const response=await fetch(`http://127.0.0.1:${port}/api${path}`,body?{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});return {status:response.status,data:await response.json()}}
(async()=>{try{
  await start();
  const initial=await api('/snapshot');assert.equal(initial.status,200);assert.equal(initial.data.medicines.length,8);
  const created=await api('/medicines',{name:'HTTP 验证药品',spec:'测试 1片',category:'测试',unit:'盒',minStock:2,priceCents:100,location:'QA-01'});assert.equal(created.status,200);const id=created.data.id;
  const expiry=new Date(Date.now()+365*86400000).toISOString().slice(0,10);
  const received=await api('/inbound',{medicineId:id,quantity:10,batchNo:'QA-HTTP',expiryDate:expiry,supplierId:1,party:'自动验证',idempotencyKey:'http-in'});assert.equal(received.status,200);
  const withdrawals=await Promise.all(Array.from({length:2},(_,i)=>api('/outbound',{medicineId:id,quantity:7,party:'自动验证',idempotencyKey:'http-out-'+i})));
  assert.deepEqual(withdrawals.map(r=>r.status).sort(),[200,409]);
  const successIndex=withdrawals.findIndex(r=>r.status===200);
  const repeated=await api('/outbound',{medicineId:id,quantity:7,party:'自动验证',idempotencyKey:'http-out-'+successIndex});assert.equal(repeated.data.duplicate,true);
  const snapshot=await api('/snapshot');assert.equal(snapshot.data.medicines.find(m=>m.id===id).stock,3);
  const bad=await api('/restore',{format:'medistock',version:1,medicines:[]});assert.equal(bad.status,400);
  const forbidden=await fetch(`http://127.0.0.1:${port}/api/outbound`,{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://example.com'},body:'{}'});assert.equal(forbidden.status,403);
  await stop();await start();const persisted=await api('/snapshot');assert.equal(persisted.data.medicines.find(m=>m.id===id).stock,3);
  console.log('PASS HTTP：档案创建、入库、并发超卖保护、幂等重试、恢复失败、来源校验与重启持久化');
}finally{await stop();rmSync(directory,{recursive:true,force:true})}})().catch(error=>{console.error(error);process.exitCode=1});
