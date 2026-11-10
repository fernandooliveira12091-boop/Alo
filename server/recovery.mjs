import {digest,random,equal,passwordHash} from './auth-crypto.mjs';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const EMAIL=/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i;
const mask=s=>s?s.slice(0,2)+'***@'+s.split('@')[1]:'';
export async function mailConfig(db,env){const c=await db.get('mail-config');return {key:env.RESEND_API_KEY||c?.key||'',from:env.MAIL_FROM||c?.from||''}}
async function sendMail(env,config,to,link,verify){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);try{const r=await (env.EMAIL_FETCH||fetch)('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+config.key,'Content-Type':'application/json','Idempotency-Key':'elo-'+await digest(link)},body:JSON.stringify({from:config.from,to:[to],subject:verify?'Confirme seu e-mail de recuperação · Elo':'Redefina sua senha · Elo',text:(verify?'Confirme este e-mail para recuperar o acesso ao Elo:':'Você solicitou uma nova senha para o Elo:')+'\n\n'+link+'\n\nO link expira em 20 minutos e pode ser usado uma única vez. Se não foi você, ignore esta mensagem.'}),signal:controller.signal});if(!r.ok)throw Error('send failed')}finally{clearTimeout(timer)}}
export async function recoveryAction(db,env,action,data,user,valid,now=Date.now()){
 const body=data.body||{},config=await mailConfig(db,env),configured=!!config.key&&!!config.from;
 if(action==='recovery-status'){if(!valid)return json({error:'Entre para continuar.'},401);return json({configured,verified:!!user.recoveryEmail,emailMasked:mask(user.recoveryEmail),suggestedEmail:EMAIL.test(user.username)?user.username:''})}
 const publicAction=['forgot','reset'].includes(action);if(!publicAction&&!valid)return json({error:'Entre para continuar.'},401);
 const rateKey='recovery-rate:'+(data.ip||'unknown'),rate=await db.get(rateKey);if(rate?.until>now&&rate.count>=5)return json({error:'Muitas tentativas. Aguarde uma hora.'},429);
 const bump=()=>db.put(rateKey,{count:rate?.until>now?rate.count+1:1,until:rate?.until>now?rate.until:now+3600000});
 const origin=env.PUBLIC_ORIGIN||'https://elo-triagem-beneficios.fernandooliveira12091.workers.dev';
 if(action==='recovery-email'){
  await bump();const password=typeof body.currentPassword==='string'?body.currentPassword:'';
  if(password.length>128||!equal(await passwordHash(password,user.salt),user.hash))return json({error:'Senha atual incorreta.'},401);
  const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';if(email.length>254||!EMAIL.test(email))return json({error:'Informe um e-mail válido.'},400);
  let selected=config;
  if(body.apiKey||body.from){if(typeof body.apiKey!=='string'||body.apiKey.length<10||body.apiKey.length>300||typeof body.from!=='string'||body.from.length>254||!EMAIL.test(body.from))return json({error:'Informe uma chave de envio Resend e um remetente verificado válido.'},400);selected={key:body.apiKey.trim(),from:body.from.trim()}}
  if(!selected.key||!selected.from)return json({error:'Conecte um serviço de envio na seção abaixo para enviar a confirmação.'},503);
  const token=random(),hash=await digest(token);await db.put('recovery-pending',{hash,email,version:user.version,expires:now+1200000});
  try{await sendMail(env,selected,email,origin+'/auth?mode=recovery#verify='+token,true)}catch{await db.delete('recovery-pending');return json({error:'O serviço não aceitou o envio. Confira a chave, o domínio remetente e o destinatário permitido no Resend.'},502)}
  if(body.apiKey)await db.put('mail-config',selected);
  return json({ok:true,message:'Enviamos um link de confirmação. Abra-o neste navegador, mantendo o login ativo.'});
 }
 if(action==='recovery-verify'){
  await bump();const pending=await db.get('recovery-pending');if(!pending||pending.expires<=now||pending.version!==user.version||!equal(await digest(String(body.token||'')),pending.hash))return json({error:'Link inválido ou expirado. Solicite outra confirmação.'},400);
  await db.put('owner',{...user,recoveryEmail:pending.email});await db.delete('recovery-pending');return json({ok:true});
 }
 if(action==='forgot'){
  await bump();if(!configured)return json({error:'A recuperação por e-mail ainda não foi ativada. Entre em contato com o responsável pelo sistema.'},503);
  const generic={ok:true,message:'Se os dados corresponderem a uma conta com e-mail confirmado, você receberá um link para redefinir a senha.'};
  const login=String(body.login||'').trim().toLowerCase();const cooldown=await db.get('recovery-cooldown');
  if(!user?.recoveryEmail||![user.username,user.recoveryEmail].includes(login)||cooldown?.until>now)return json(generic);
  const global=await db.get('recovery-global-forgot');if(global?.until>now&&global.count>=5)return json(generic);await db.put('recovery-global-forgot',{count:global?.until>now?global.count+1:1,until:global?.until>now?global.until:now+3600000});await db.put('recovery-cooldown',{until:now+60000});const token=random(),hash=await digest(token);await db.put('recovery-token:active',{hash,version:user.version,expires:now+1200000});
  try{await sendMail(env,config,user.recoveryEmail,origin+'/auth?mode=recovery#reset='+token,false)}catch{await db.delete('recovery-token:active')}
  return json(generic);
 }
 if(action==='reset'){
  await bump();const record=await db.get('recovery-token:active');if(!user||!record||record.expires<=now||record.version!==user.version||!equal(await digest(String(body.token||'')),record.hash))return json({error:'Link inválido ou expirado. Solicite uma nova recuperação.'},400);
  const password=typeof body.password==='string'?body.password:'';if(password.length<12||password.length>128)return json({error:'Use uma senha de 12 a 128 caracteres.'},400);
  const salt=random();await db.put('owner',{...user,salt,hash:await passwordHash(password,salt),version:user.version+1});await db.delete('recovery-token:active');await db.delete('recovery-pending');await db.delete(rateKey);
  return json({ok:true,message:'Senha redefinida. Entre com seu usuário e a nova senha.'});
 }
 return json({error:'Não encontrado.'},404);
}
