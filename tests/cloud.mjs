import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './auth-helpers.mjs';
const client=(id,name='Ana')=>({id,name,type:'m',stage:0,facts:{},history:[],incoming:'',reply:'',tone:'warm',won:false});
async function account(){const a=await app();const r=await a.request('/api/auth/setup',{method:'POST',body:{username:'admin',password:'cloud testing password 987',setupToken:'test-bootstrap-token'}});const token=r.headers.get('Set-Cookie').match(/elo_session=([^;]+)/)[1];return {...a,token,api:(action,body)=>a.request('/api/cloud/'+action,{token,...(body===undefined?{}:{method:'POST',body})})}}
test('Dados protegidos, persistência, concorrência e importação sem sobrescrever',async()=>{
 const a=await account();assert.equal((await a.request('/api/cloud/list')).status,401);assert.equal((await a.request('/api/cloud/save',{method:'POST',body:{baseRevision:0,clients:[]}})).status,401);
 assert.equal((await a.request('/api/cloud/save',{token:a.token,method:'POST',origin:'https://evil.test',body:{baseRevision:0,clients:[]}})).status,403);
 let r=await a.api('save',{baseRevision:0,clients:[client('a')]});assert.equal(r.status,200);let data=await r.json();assert.equal(data.revision,1);assert.equal((await (await a.api('list')).json()).clients[0].name,'Ana');
 r=await a.api('save',{baseRevision:0,clients:[client('a','Sobrescrever')]});assert.equal(r.status,409);assert.equal((await r.json()).clients[0].name,'Ana');
 r=await a.api('import',{baseRevision:1,clients:[client('a','Versão antiga'),client('b','Bruna')]});assert.equal(r.status,200);data=await r.json();assert.equal(data.clients.length,2);assert.equal(data.clients.find(c=>c.id==='a').name,'Ana');
 const before=await a.api('list').then(r=>r.json());r=await a.api('save',{baseRevision:2,clients:[client("bad');alert(1)" )]});assert.equal(r.status,400);assert.deepEqual(await a.api('list').then(r=>r.json()),before);
 const login=await a.request('/api/auth/login',{method:'POST',body:{username:'admin',password:'cloud testing password 987'}});const otherToken=login.headers.get('Set-Cookie').match(/elo_session=([^;]+)/)[1];const other=await a.request('/api/cloud/list',{token:otherToken});assert.deepEqual((await other.json()).clients,before.clients);
});
test('Backups, restauração reversível, validação, retenção e chunks',async()=>{
 const a=await account();let records=[client('a','Nome original')];let data=await a.api('save',{baseRevision:0,clients:records}).then(r=>r.json());const manual=await a.api('backup',{}).then(r=>r.json());
 data=await a.api('save',{baseRevision:data.revision,clients:[client('a','Nome editado')]}).then(r=>r.json());assert.equal(data.clients[0].name,'Nome editado');
 let list=await a.api('backups').then(r=>r.json());assert(list.backups.some(b=>b.reason==='automático diário'));
 const file=await a.api('download',{id:manual.id}).then(r=>r.json());assert.equal(file.backup.clients[0].name,'Nome original');assert.equal((await a.api('download',{id:'not-found'})).status,404);
 data=await a.api('restore',{id:manual.id,baseRevision:data.revision}).then(r=>r.json());assert.equal(data.clients[0].name,'Nome original');
 list=await a.api('backups').then(r=>r.json());const rollback=list.backups.find(b=>b.reason==='antes de restaurar');assert(rollback);assert.equal((await a.api('download',{id:rollback.id}).then(r=>r.json())).backup.clients[0].name,'Nome editado');
 data=await a.api('save',{baseRevision:data.revision,clients:[]}).then(r=>r.json());list=await a.api('backups').then(r=>r.json());assert(list.backups.some(b=>b.reason==='antes de excluir'));
 assert.equal((await a.api('restore',{id:manual.id,baseRevision:1})).status,409);
 for(let i=0;i<15;i++)assert.equal((await a.api('backup',{})).status,200);assert.equal((await a.api('backups').then(r=>r.json())).backups.length,14);
 const long=client('long');long.incoming='é'.repeat(20000);data=await a.api('save',{baseRevision:data.revision,clients:[long]}).then(r=>r.json());const big=await a.api('backup',{}).then(r=>r.json());assert.equal((await a.api('download',{id:big.id}).then(r=>r.json())).backup.clients[0].incoming.length,20000);
 assert.equal((await a.api('save',{baseRevision:data.revision,clients:[client('x'),client('x')]})).status,400);
});
