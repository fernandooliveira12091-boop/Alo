import {digest,random,equal,passwordHash} from './auth-crypto.mjs';
export {digest,passwordHash} from './auth-crypto.mjs';
import {recoveryAction} from './recovery.mjs';
import { authPage } from './auth-page.mjs';
import { cloudAction, DATA_LIMIT } from './cloud-data.mjs';
import { suggestAI, reserveAI, inputContext, AI_MODEL } from './ai.mjs';
const encoder = new TextEncoder();
const SESSION_MS = 12 * 60 * 60 * 1000;
const COOKIE = '__Host-elo_session';
function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}})}
const cookie = (token,clear=false) => `${COOKIE}=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${clear?0:43200}`;
export function sessionToken(request){return (request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||''}
function secured(response){const h=new Headers(response.headers);h.set('Cache-Control','no-store, private');h.set('X-Content-Type-Options','nosniff');h.set('X-Frame-Options','DENY');h.set('Referrer-Policy','no-referrer');h.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');return new Response(response.body,{status:response.status,headers:h})}
export default {async fetch(request,env){
 try{
 const url=new URL(request.url),path=url.pathname;
 if(!['GET','HEAD','POST'].includes(request.method))return secured(json({error:'Método não permitido.'},405));
 const token=sessionToken(request);
 const stub=env.AUTH.get(env.AUTH.idFromName('elo-owner-v1'));
 const call=async(action,data={})=>stub.fetch(new Request('https://auth.internal/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}));
 if(path.startsWith('/api/auth/')){
  const action=path.slice('/api/auth/'.length);
  if(action==='state'&&request.method==='GET')return secured(await call('state'));
  if(action==='me'&&request.method==='GET')return secured(await call('me',{token}));
  if(action==='recovery-status'&&request.method==='GET')return secured(await call(action,{token}));
  if(!['login','setup','logout','password','forgot','reset','recovery-email','recovery-verify'].includes(action)||request.method!=='POST')return secured(json({error:'Não encontrado.'},404));
  if(request.headers.get('Origin')!==url.origin)return secured(json({error:'Origem inválida.'},403));
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return secured(json({error:'Formato inválido.'},415));
  if(Number(request.headers.get('Content-Length')||0)>4096)return secured(json({error:'Solicitação muito grande.'},413));
  const text=await request.text();if(text.length>4096)return secured(json({error:'Solicitação muito grande.'},413));
  let body;try{body=JSON.parse(text)}catch{return secured(json({error:'Solicitação inválida.'},400))}
  const ip=await digest(request.headers.get('CF-Connecting-IP')||'unknown');
  return secured(await call(action,{body,token,ip}));
 }
 if(path.startsWith('/api/ai/')){
  // Diagnóstico de publicação: token aleatório temporário, máximo de três testes, somente dados fictícios.
  if(path==='/api/ai/check'&&request.method==='POST'&&Date.now()<Number(env.AI_PROBE_EXPIRES)&&env.AI_PROBE_HASH){
   const hash=await digest(request.headers.get('X-Elo-Deploy-Check')||'');
   if(equal(hash,env.AI_PROBE_HASH)){
    const allowed=await call('ai/probe',{probeHash:hash});if(allowed.status!==200)return secured(allowed);
    const check=await suggestAI(env,{client:{type:'m',stage:1,tone:'warm',facts:{},profile:{regime:'rgps'},history:[],incoming:'Meu bebê nasceu há um mês. Estou desempregada. Como podemos analisar meu caso?'}});
    if(check.status!==200)return secured(check);const result=await check.json();return secured(json({ok:result.engine==='ai',model:result.model,baseVersion:result.baseVersion}));
   }
  }
  const session=await call('me',{token});if(session.status!==200)return secured(session);
  if(path==='/api/ai/status'&&request.method==='GET')return secured(json({configured:!!env.AI?.run,model:env.AI_MODEL||AI_MODEL,dailyLimit:Number(env.AI_DAILY_LIMIT)||60}));
  if(path!=='/api/ai/suggest'||request.method!=='POST')return secured(json({error:'Não encontrado.'},404));
  if(request.headers.get('Origin')!==url.origin)return secured(json({error:'Origem inválida.'},403));
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return secured(json({error:'Formato inválido.'},415));
  if(Number(request.headers.get('Content-Length')||0)>110000)return secured(json({error:'O contexto ultrapassou o limite permitido.'},413));
  const raw=await request.text();if(encoder.encode(raw).length>110000)return secured(json({error:'O contexto ultrapassou o limite permitido.'},413));
  let body;try{body=JSON.parse(raw);inputContext(body)}catch(e){return secured(json({error:'Contexto inválido. Confira a mensagem e a triagem.'},400))}
  const quota=await call('ai/reserve',{token,body:{limit:Number(env.AI_DAILY_LIMIT)||60}});if(quota.status!==200)return secured(quota);
  return secured(await suggestAI(env,body));
 }
 if(path.startsWith('/api/cloud/')){
  const session=await call('me',{token});if(session.status!==200)return secured(session);
  const action=path.slice('/api/'.length);
  if(['cloud/list','cloud/backups'].includes(action)&&request.method==='GET')return secured(await call(action,{token,body:{}}));
  if(!['cloud/save','cloud/import','cloud/backup','cloud/download','cloud/restore'].includes(action)||request.method!=='POST')return secured(json({error:'Não encontrado.'},404));
  if(request.headers.get('Origin')!==url.origin)return secured(json({error:'Origem inválida.'},403));
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return secured(json({error:'Formato inválido.'},415));
  if(Number(request.headers.get('Content-Length')||0)>DATA_LIMIT+20000)return secured(json({error:'Limite de 5 MB excedido.'},413));
  const text=await request.text();if(encoder.encode(text).length>DATA_LIMIT+20000)return secured(json({error:'Limite de 5 MB excedido.'},413));
  let body;try{body=JSON.parse(text);if(!body||typeof body!=='object')throw Error()}catch{return secured(json({error:'Dados inválidos.'},400))}
  return secured(await call(action,{token,body}));
 }
 const session=await call('me',{token});const signedIn=session.status===200;
 if(path==='/auth'){
  if(signedIn&&url.searchParams.get('mode')!=='password'&&url.searchParams.get('mode')!=='recovery')return secured(new Response(null,{status:303,headers:{Location:'/'}}));
  return secured(authPage(signedIn));
 }
 if(path.startsWith('/api/'))return secured(json({error:'Não encontrado.'},404));
 if(!signedIn)return secured(new Response(null,{status:303,headers:{Location:'/auth'}}));
 if(!['GET','HEAD'].includes(request.method))return secured(json({error:'Método não permitido.'},405));
 return secured(await env.ASSETS.fetch(request));
 }catch{return secured(json({error:'Não foi possível concluir. Tente novamente.'},503))}
}};
export class AuthStore {
 constructor(state,env){this.state=state;this.env=env;this.db=state.storage}
 async fetch(request){return this.state.blockConcurrencyWhile(async()=>{
  const action=new URL(request.url).pathname.slice(1),data=await request.json(),now=Date.now();
  if(action==='ai/probe'){
   if(now>=Number(this.env.AI_PROBE_EXPIRES)||!equal(data.probeHash,this.env.AI_PROBE_HASH))return json({error:'Não autorizado.'},401);
   const key='ai-probe:'+data.probeHash,count=await this.db.get(key)||0;if(count>=3)return json({error:'Diagnóstico já executado.'},429);await this.db.put(key,count+1);return json({ok:true});
  }
  const user=await this.db.get('owner');
  if(action==='state')return json({initialized:!!user});
  const token=data.token,session=/^[a-f0-9]{64}$/.test(token||'')?await this.db.get('session:'+await digest(token)):null;
  const valid=!!user&&session?.expires>now&&session.version===user.version;
  if(action==='me')return valid?json({username:user.username}):json({error:'Entre para continuar.'},401);
  const body=data.body||{};
  if(['forgot','reset','recovery-status','recovery-email','recovery-verify'].includes(action)){await this.schedule();return recoveryAction(this.db,this.env,action,data,user,valid,now)}
  if(action==='ai/reserve'){if(!valid)return json({error:'Entre para continuar.'},401);return reserveAI(this.db,body,now)}
  if(action.startsWith('cloud/')){if(!valid)return json({error:'Entre para continuar.'},401);return cloudAction(this.db,action,body)}
  if(action==='logout'){if(token)await this.db.delete('session:'+await digest(token));return json({ok:true},200,{'Set-Cookie':cookie('',true)})}
  const key='rate:'+data.ip,limit=await this.db.get(key);
  if(limit?.until>now&&limit.count>=5)return json({error:'Muitas tentativas. Aguarde 15 minutos.'},429,{'Retry-After':String(Math.ceil((limit.until-now)/1000))});
  const fail=async(message='Usuário ou senha incorretos.',status=401)=>{await this.db.put(key,{count:limit?.until>now?limit.count+1:1,until:limit?.until>now?limit.until:now+900000});await this.schedule();return json({error:message},status)};
  const username=typeof body.username==='string'?body.username.trim().toLowerCase():'';
  const password=typeof body.password==='string'?body.password:'';
  const validPassword=password.length>=12&&password.length<=128;
  if(action==='setup'){
   if(user)return json({error:'O acesso inicial já foi configurado.'},409);
   if(now>Number(this.env.BOOTSTRAP_EXPIRES)||!equal(await digest(String(body.setupToken||'')),this.env.BOOTSTRAP_TOKEN_HASH))return fail('Link de configuração inválido ou expirado.',403);
   if(!/^[a-z0-9@._+-]{3,80}$/.test(username)||!validPassword)return json({error:'Use um usuário de 3 a 80 caracteres e uma senha de 12 a 128 caracteres.'},400);
   const salt=random();await this.db.put('owner',{username,salt,hash:await passwordHash(password,salt),version:1});
   await this.db.delete(key);return this.newSession(1,now);
  }
  if(action==='login'){
   if(!user)return fail('Defina seu primeiro acesso pelo link de configuração.',403);
   const hash=await passwordHash(password.length<=128?password:'',user.salt);
   if(username!==user.username||!equal(hash,user.hash))return fail();
   await this.db.delete(key);return this.newSession(user.version,now);
  }
  if(action==='password'){
   if(!valid)return json({error:'Entre para continuar.'},401);
   const old=typeof body.currentPassword==='string'?body.currentPassword:'';
   if(old.length>128||!equal(await passwordHash(old,user.salt),user.hash))return fail('Senha atual incorreta.');
   if(!validPassword)return json({error:'A nova senha precisa ter entre 12 e 128 caracteres.'},400);
   const salt=random(),version=user.version+1;await this.db.put('owner',{...user,salt,hash:await passwordHash(password,salt),version});await this.db.delete(key);
   // Invalida todas as sessões antigas, inclusive em outros dispositivos.
   return this.newSession(version,now);
  }
  return json({error:'Não encontrado.'},404);
 })}
 async newSession(version,now){const token=random();await this.db.put('session:'+await digest(token),{version,expires:now+SESSION_MS});await this.schedule();return json({ok:true},200,{'Set-Cookie':cookie(token)})}
 async schedule(){if(!await this.db.getAlarm())await this.db.setAlarm(Date.now()+3600000)}
 async alarm(){let remains=false;for(const prefix of ['session:','rate:','recovery-rate:','recovery-token:']){const records=await this.db.list({prefix});for(const [key,v] of records){if((v.expires||v.until)<=Date.now())await this.db.delete(key);else remains=true}}if(remains)await this.db.setAlarm(Date.now()+3600000)}
}
