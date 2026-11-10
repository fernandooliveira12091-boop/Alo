import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{AuthStore,digest} from '../server/worker.mjs';
class Storage{
 constructor(){this.map=new Map();this.alarm=null}
 async get(k){return structuredClone(this.map.get(k))}async put(k,v){this.map.set(k,structuredClone(v))}async delete(k){this.map.delete(k)}async getAlarm(){return this.alarm}async setAlarm(a){this.alarm=a}async list({prefix}){return new Map([...this.map].filter(([k])=>k.startsWith(prefix)))}
}
async function app(){const db=new Storage();let queue=Promise.resolve();const state={storage:db,blockConcurrencyWhile(fn){const next=queue.then(fn);queue=next.catch(()=>{});return next}};const env={BOOTSTRAP_TOKEN_HASH:await digest('test-bootstrap-token'),BOOTSTRAP_EXPIRES:String(Date.now()+100000)};const store=new AuthStore(state,env);env.AUTH={idFromName:x=>x,get:()=>store};env.ASSETS={fetch:async()=>new Response('private-application')};return {env,db,store,request:async(path,{method='GET',body,token,origin='https://elo.test',ip='192.0.2.1'}={})=>worker.fetch(new Request('https://elo.test'+path,{method,headers:{'Content-Type':'application/json','Origin':origin,'CF-Connecting-IP':ip,...(token?{'Cookie':'__Host-elo_session='+token}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})}),env)}}
const tokenFrom=r=>r.headers.get('Set-Cookie').match(/elo_session=([^;]+)/)[1];
const credentials={username:'Admin',password:'A long initial password 9817!'};
test('Primeiro acesso, sessão, troca de senha e logout protegem todos os arquivos',async()=>{
 const a=await app();for(const path of ['/','/index.html','/app.js','/legal.js','/legal/compilacao-original.md','/auth-client.js']){const r=await a.request(path);assert.equal(r.status,303);assert.equal(r.headers.get('location'),'/auth');assert(r.headers.get('Cache-Control').includes('no-store'))}
 let r=await a.request('/auth');assert.equal(r.status,200);const page=await r.text();assert(page.includes('Acesse seu atendimento'));assert(r.headers.get('Content-Security-Policy').includes('frame-ancestors'));
 r=await a.request('/api/auth/setup',{method:'POST',body:{...credentials,setupToken:'wrong'}});assert.equal(r.status,403);
 r=await a.request('/api/auth/setup',{method:'POST',body:{...credentials,password:'short',setupToken:'test-bootstrap-token'}});assert.equal(r.status,400);
 r=await a.request('/api/auth/setup',{method:'POST',body:{...credentials,setupToken:'test-bootstrap-token'}});assert.equal(r.status,200);assert.match(r.headers.get('Set-Cookie'),/Secure; HttpOnly; SameSite=Strict/);const first=tokenFrom(r);
 r=await a.request('/api/auth/setup',{method:'POST',body:{...credentials,setupToken:'test-bootstrap-token'}});assert.equal(r.status,409);
 r=await a.request('/api/auth/me',{token:first});assert.deepEqual(await r.json(),{username:'admin'});r=await a.request('/',{token:first});assert.equal(await r.text(),'private-application');
 const owner=await a.db.get('owner');assert.notEqual(owner.hash,credentials.password);assert.equal(owner.password,undefined);assert(owner.salt);
 r=await a.request('/api/auth/login',{method:'POST',body:{...credentials,password:'wrong'}});assert.equal(r.status,401);
 r=await a.request('/api/auth/login',{method:'POST',body:credentials});assert.equal(r.status,200);const second=tokenFrom(r);
 r=await a.request('/api/auth/password',{method:'POST',token:first,body:{currentPassword:credentials.password,password:'New long password 9873!'}});assert.equal(r.status,200);const latest=tokenFrom(r);
 assert.equal((await a.request('/api/auth/me',{token:first})).status,401);assert.equal((await a.request('/api/auth/me',{token:second})).status,401);assert.equal((await a.request('/api/auth/me',{token:latest})).status,200);
 r=await a.request('/api/auth/logout',{method:'POST',token:latest,body:{}});assert.equal(r.status,200);assert.match(r.headers.get('Set-Cookie'),/Max-Age=0/);assert.equal((await a.request('/api/auth/me',{token:latest})).status,401);
});
test('Origem, expiração, abuso e corrida de cadastro',async()=>{
 const a=await app();assert.equal((await a.request('/api/auth/setup',{method:'POST',origin:'https://evil.test',body:credentials})).status,403);
 a.env.BOOTSTRAP_EXPIRES='1';assert.equal((await a.request('/api/auth/setup',{method:'POST',body:{...credentials,setupToken:'test-bootstrap-token'}})).status,403);
 a.env.BOOTSTRAP_EXPIRES=String(Date.now()+100000);const result=await Promise.all([1,2].map(()=>a.request('/api/auth/setup',{method:'POST',body:{...credentials,setupToken:'test-bootstrap-token'}})));assert.deepEqual(result.map(r=>r.status).sort(),[200,409]);
 for(let i=0;i<5;i++){const r=await a.request('/api/auth/login',{method:'POST',body:{...credentials,password:'incorrect'},ip:'192.0.2.2'});assert.equal(r.status,401)}
 const r=await a.request('/api/auth/login',{method:'POST',body:credentials,ip:'192.0.2.2'});assert.equal(r.status,429);assert(r.headers.has('Retry-After'));
 const login=await a.request('/api/auth/login',{method:'POST',body:credentials,ip:'192.0.2.3'});const token=tokenFrom(login);const key='session:'+await digest(token),session=await a.db.get(key);await a.db.put(key,{...session,expires:1});assert.equal((await a.request('/api/auth/me',{token})).status,401);await a.store.alarm();assert.equal(await a.db.get(key),undefined);
});
