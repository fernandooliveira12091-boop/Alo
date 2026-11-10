import test from 'node:test';import assert from 'node:assert/strict';import {app} from './auth-helpers.mjs';
const PASSWORD='Recovery test password 987!';
async function account(){const a=await app();const r=await a.request('/api/auth/setup',{method:'POST',body:{username:'admin',password:PASSWORD,setupToken:'test-bootstrap-token'}});const token=r.headers.get('Set-Cookie').match(/elo_session=([^;]+)/)[1];const messages=[];a.env.EMAIL_FETCH=async(url,init)=>{messages.push(JSON.parse(init.body));return new Response(JSON.stringify({id:'mail-test'}),{status:200})};return {...a,token,messages,api:(action,body,ip='192.0.2.5')=>a.request('/api/auth/'+action,{token,ip,...(body===undefined?{}:{method:'POST',body})})}}
test('E-mail precisa de sessão, senha atual e confirmação; credencial não é exposta',async()=>{
 const a=await account();assert.equal((await a.request('/api/auth/recovery-email',{method:'POST',body:{}})).status,401);assert.equal((await a.api('recovery-status')).status,200);
 let r=await a.api('recovery-email',{email:'admin@example.com',currentPassword:PASSWORD});assert.equal(r.status,503);r=await a.api('recovery-email',{email:'admin@example.com',currentPassword:'wrong',apiKey:'re_test_1234567890',from:'elo@example.com'});assert.equal(r.status,401);
 r=await a.api('recovery-email',{email:'admin@example.com',currentPassword:PASSWORD,apiKey:'re_test_1234567890',from:'elo@example.com'});assert.equal(r.status,200);assert.equal(a.messages.length,1);assert(!(await r.text()).includes('re_test'));
 const pending=await a.db.get('recovery-pending');assert(pending.hash);assert.equal(pending.token,undefined);const verify=a.messages[0].text.match(/verify=([a-f0-9]{64})/)[1];r=await a.api('recovery-verify',{token:verify});assert.equal(r.status,200);assert.equal((await a.db.get('owner')).recoveryEmail,'admin@example.com');assert.equal((await a.api('recovery-verify',{token:verify})).status,400);
 const status=await a.api('recovery-status').then(r=>r.json());assert(status.verified);assert(!JSON.stringify(status).includes('re_test'));
 const clients=await a.api('me').then(r=>r.json());assert.equal(clients.username,'admin');
});
test('Recuperação uniforme, expiração, uso único e revogação de sessões',async()=>{
 const a=await account();a.env.RESEND_API_KEY='re_test_secret';a.env.MAIL_FROM='elo@example.com';let owner=await a.db.get('owner');await a.db.put('owner',{...owner,recoveryEmail:'admin@example.com'});
 let r=await a.api('forgot',{login:'unknown@example.com'});const unknown=await r.json();assert.equal(a.messages.length,0);r=await a.api('forgot',{login:'admin'});assert.deepEqual(await r.json(),unknown);assert.equal(a.messages.length,1);let reset=a.messages[0].text.match(/reset=([a-f0-9]{64})/)[1];const next='New recovery password 654321!';
 r=await a.api('reset',{token:reset,password:next});assert.equal(r.status,200);assert.equal((await a.api('me')).status,401);assert.equal((await a.api('reset',{token:reset,password:next},'192.0.2.6')).status,400);
 r=await a.request('/api/auth/login',{method:'POST',body:{username:'admin',password:next},ip:'192.0.2.8'});assert.equal(r.status,200);assert.equal((await a.db.get('owner')).recoveryEmail,'admin@example.com');
 await a.db.delete('recovery-cooldown');await a.api('forgot',{login:'admin'},'192.0.2.7');reset=a.messages.at(-1).text.match(/reset=([a-f0-9]{64})/)[1];const state=await a.db.get('recovery-token:active');await a.db.put('recovery-token:active',{...state,expires:1});assert.equal((await a.api('reset',{token:reset,password:next},'192.0.2.7')).status,400);
});
test('Falhas de entrega não ativam o endereço e não revelam chaves ou tokens',async()=>{
 const a=await account();a.env.EMAIL_FETCH=async()=>new Response('not authorized',{status:403});const r=await a.api('recovery-email',{email:'admin@example.com',currentPassword:PASSWORD,apiKey:'re_test_123456789',from:'elo@example.com'});assert.equal(r.status,502);assert.equal(await a.db.get('mail-config'),undefined);assert.equal(await a.db.get('recovery-pending'),undefined);assert.equal((await a.db.get('owner')).recoveryEmail,undefined);
});
