const encoder=new TextEncoder();
const LIMIT=5*1024*1024;
export const DATA_LIMIT=LIMIT;
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
function text(value,max=20000){if(value==null)return '';if(typeof value!=='string'||value.length>max)throw Error('Há um campo de texto maior que o limite permitido.');return value}
function legal(value){if(value==null)return null;if(typeof value!=='object'||!Array.isArray(value.sourceIds)||value.sourceIds.length>32)throw Error('Referências da sugestão inválidas.');return {version:text(value.version,100),sourceIds:value.sourceIds.map(x=>text(x,100)),fingerprint:text(value.fingerprint,60000),generatedReply:text(value.generatedReply),note:text(value.note,3000)}}
export function normalizeClients(input){
 if(!Array.isArray(input)||input.length>1000)throw Error('O limite é de 1.000 atendimentos por conta.');
 const ids=new Set();const result=input.map(c=>{
  if(!c||typeof c!=='object'||typeof c.id!=='string'||!(/^[a-zA-Z0-9_-]{1,80}$/.test(c.id))||ids.has(c.id))throw Error('Identificador de atendimento inválido ou repetido.');ids.add(c.id);
  if(!['m','d'].includes(c.type)||!Number.isInteger(c.stage)||c.stage<0||c.stage>4)throw Error('Benefício ou etapa inválidos.');
  const name=text(c.name,80).trim();if(!name)throw Error('O atendimento precisa ter um nome.');
  const facts={};for(const k of ['situation','insured','docs','request']){const v=c.facts?.[k];if(v!=null&&!['','yes','no','review'].includes(v))throw Error('Triagem inválida.');if(v!=null)facts[k]=v}
  const profile={};for(const k of ['regime','category','eventDate','requestDate']){if(c.profile?.[k]!=null)profile[k]=text(c.profile[k],100)}
  if(c.history!=null&&!Array.isArray(c.history)||c.history?.length>2000)throw Error('Histórico inválido ou muito extenso.');
  const history=(c.history||[]).map(h=>{if(!h||typeof h!=='object')throw Error('Histórico inválido.');return {date:text(h.date,100),stage:text(h.stage,100),incoming:text(h.incoming),reply:text(h.reply),legal:legal(h.legal),manualEdit:!!h.manualEdit}});
  const record={id:c.id,name,type:c.type,stage:c.stage,facts,profile,history,incoming:text(c.incoming),reply:text(c.reply),tone:c.tone==='direct'?'direct':'warm',won:!!c.won,demo:!!c.demo,intent:text(c.intent,200),reason:text(c.reason,3000),legal:legal(c.legal)};
  if(encoder.encode(JSON.stringify(record)).length>95000)throw Error('Um atendimento ultrapassou 95 KB. Exporte seu histórico antes de continuar.');return record;
 });
 if(encoder.encode(JSON.stringify(result)).length>LIMIT)throw Error('Os dados ultrapassaram o limite de 5 MB.');return result;
}
export async function snapshot(db){const meta=await db.get('cloud-meta')||{revision:0,updatedAt:null};const rows=await db.list({prefix:'client:'});return {...meta,clients:[...rows.values()].sort((a,b)=>(a.order??0)-(b.order??0)).map(x=>x.record)}}
async function backup(db,snap,reason,id){
 id||='manual-'+crypto.randomUUID();if(await db.get('backup-meta:'+id))return id;
 const data=JSON.stringify(snap);let parts=0;for(let i=0;i<data.length;i+=16000){await db.put('backup:'+id+':'+parts,data.slice(i,i+16000));parts++}
 await db.put('backup-meta:'+id,{id,date:new Date().toISOString(),count:snap.clients.length,reason,parts,revision:snap.revision});
 const records=[...(await db.list({prefix:'backup-meta:'})).values()].sort((a,b)=>b.date.localeCompare(a.date));for(const old of records.slice(14)){for(let i=0;i<old.parts;i++)await db.delete('backup:'+old.id+':'+i);await db.delete('backup-meta:'+old.id)}return id;
}
async function writeSnapshot(db,old,records){const wanted=new Set(records.map(c=>c.id));for(const c of old.clients)if(!wanted.has(c.id))await db.delete('client:'+c.id);const previous=new Map(old.clients.map((c,i)=>[c.id,{record:c,order:i}]));for(let i=0;i<records.length;i++){const value={record:records[i],order:i};if(JSON.stringify(previous.get(records[i].id))!==JSON.stringify(value))await db.put('client:'+records[i].id,value)}const meta={revision:old.revision+1,updatedAt:new Date().toISOString()};await db.put('cloud-meta',meta);return {...meta,clients:records}}
export async function cloudAction(db,action,body){
 try{
 if(action==='cloud/list')return json(await snapshot(db));
 if(action==='cloud/backups')return json({backups:[...(await db.list({prefix:'backup-meta:'})).values()].sort((a,b)=>b.date.localeCompare(a.date))});
 if(action==='cloud/download'){
  const meta=await db.get('backup-meta:'+body.id);if(!meta)return json({error:'Backup não encontrado.'},404);let data='';for(let i=0;i<meta.parts;i++)data+=await db.get('backup:'+meta.id+':'+i);return json({backup:JSON.parse(data),meta});
 }
 return await db.transaction(async tx=>{
  const old=await snapshot(tx);
  if(action==='cloud/backup'){const id=await backup(tx,old,'manual');return json({ok:true,id})}
  if(!['cloud/save','cloud/import','cloud/restore'].includes(action))return json({error:'Não encontrado.'},404);
  if(!Number.isInteger(body.baseRevision)||body.baseRevision!==old.revision)return json({error:'Os dados foram alterados em outro aparelho.',...old},409);
  let records;
  if(action==='cloud/restore'){
   const meta=await tx.get('backup-meta:'+body.id);if(!meta)return json({error:'Backup não encontrado.'},404);let data='';for(let i=0;i<meta.parts;i++)data+=await tx.get('backup:'+meta.id+':'+i);records=normalizeClients(JSON.parse(data).clients);await backup(tx,old,'antes de restaurar');
  }else{
   records=normalizeClients(body.clients);
   if(action==='cloud/import'){const existing=new Set(old.clients.map(c=>c.id));records=normalizeClients([...records.filter(c=>!existing.has(c.id)),...old.clients])}
   if(old.clients.length){await backup(tx,old,'automático diário','daily-'+new Date().toISOString().slice(0,10));const recordIds=new Set(records.map(c=>c.id));if(old.clients.some(c=>!recordIds.has(c.id)))await backup(tx,old,'antes de excluir')}
  }
  const next=await writeSnapshot(tx,old,records);return json(next);
 });
 }catch(e){return json({error:e.message||'Não foi possível salvar.'},400)}
}
