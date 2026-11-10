const aiState={busy:false,configured:null};
function aiInput(c){return {type:c.type,stage:c.stage,tone:c.tone,facts:c.facts||{},profile:c.profile||{},incoming:c.incoming||'',history:(c.history||[]).slice(-6).map(h=>({date:h.date,stage:h.stage,incoming:h.incoming,reply:h.reply}))}}
async function aiHash(value){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function invalidateAI(c,stale=true){if(c?.ai){c.ai.reviewedAt='';if(stale)c.ai.stale=true}}
function aiReview(c){if(!c.ai)return '';return `<div class="ai-review"><div class="labelrow"><strong>${c.ai.engine==='ai'?'✧ Sugestão de IA':'Modelo de encerramento'}</strong><span class="badge">Revisão humana</span></div><p>${c.ai.stale?'A conversa ou a triagem mudou. Gere uma nova sugestão ou use o modelo por regras.':c.ai.needsHuman?'Este caso precisa de análise individual. Confira as informações antes de responder.':'Confira os fatos e as referências antes de usar a mensagem.'}</p><label><input id="ai-reviewed" type="checkbox" ${c.ai.reviewedAt&&!c.ai.stale?'checked':''} ${c.ai.stale?'disabled':''}> Li, revisei e aprovo esta mensagem para copiar e enviar manualmente.</label><small>${c.ai.truncated?'Foram usados trechos das últimas 6 interações. ':''}A IA pode errar. As referências indicam a base consultada, sem validar automaticamente a conclusão.</small></div>`}
function aiCanUse(c){return !c?.ai||!!c.ai.reviewedAt&&!c.ai.stale}
function paintAIReview(){const c=current();if(!c)return;const copy=document.querySelector('#copy'),sent=document.querySelector('#sent');if(copy)copy.disabled=!aiCanUse(c);if(sent)sent.disabled=!aiCanUse(c);const box=document.querySelector('#ai-review');if(box)box.innerHTML=aiReview(c);const check=document.querySelector('#ai-reviewed');if(check)check.onchange=()=>{c.ai.reviewedAt=check.checked?new Date().toISOString():'';save();const copy=document.querySelector('#copy'),sent=document.querySelector('#sent');if(copy)copy.disabled=!aiCanUse(c);if(sent)sent.disabled=!aiCanUse(c)}}
function bindAI(){const button=document.querySelector('#generate-ai');if(button){button.disabled=aiState.busy;button.textContent=aiState.busy?'Preparando com IA…':'✧ Gerar resposta com IA';button.onclick=generateWithAI}paintAIReview()}
async function generateWithAI(){
 const c=current();if(!c||aiState.busy)return;if(!c.incoming?.trim())return toast('Cole primeiro a mensagem do cliente.');
 const previousError=document.querySelector('#ai-error');if(previousError)previousError.textContent='';
 const id=c.id,input=aiInput(c),before=JSON.stringify(input),oldReply=c.reply||'';aiState.busy=true;bindAI();
 try{
 const contextHash=await aiHash(input);const r=await fetch('/api/ai/suggest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client:input})});let data;try{data=await r.json()}catch{throw Error('A IA não respondeu corretamente. Tente novamente.')}
 if(r.status===401){cachePending();location.replace('/auth');return}if(!r.ok)throw Error(data.error||'Não foi possível gerar a resposta.');
 const target=clients.find(x=>x.id===id);if(!target||JSON.stringify(aiInput(target))!==before||(target.reply||'')!==oldReply)throw Error('O atendimento mudou durante a geração. Sua edição foi mantida; gere novamente.');
 if(data.baseVersion!==LEGAL_VERSION)throw Error('A base jurídica mudou. Atualize a página antes de gerar.');
 if(!data.sourceIds.every(id=>LEGAL_RULES.some(s=>s.id===id)))throw Error('Referências da sugestão inválidas. Gere novamente.');
 target.reply=data.reply;target.intent=data.intent;target.reason=data.reason;
 target.legal={version:data.baseVersion,sourceIds:data.sourceIds,fingerprint:legalFingerprint(target),generatedReply:data.reply,note:'Sugestão para revisão humana. '+data.reason};
 target.ai={engine:data.engine,model:data.model||'',generatedAt:data.generatedAt,contextHash,reviewedAt:'',needsHuman:data.needsHuman,stale:false,truncated:data.truncated};save();if(active===id)render();toast('Sugestão pronta. Revise e marque a aprovação antes de copiar.');
 }catch(e){const error=document.querySelector('#ai-error');if(error&&active===id)error.textContent=e.message;toast(e.message||'Não foi possível gerar. Você pode usar o modelo por regras.')}finally{aiState.busy=false;bindAI()}
}
if(typeof document!=='undefined'){
 document.addEventListener('input',event=>{const target=event.target;if(!['incoming','reply'].includes(target.id))return;invalidateAI(current(),target.id!=='reply');paintAIReview()},true);
 document.addEventListener('change',event=>{const target=event.target;if(['type','tone'].includes(target.id)||target.dataset?.field||target.dataset?.profile){invalidateAI(current());paintAIReview()}},true);
}
