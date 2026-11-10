import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
import {app} from './auth-helpers.mjs';
import {LEGAL_RULES,LEGAL_VERSION} from '../server/legal-catalog.mjs';
import {inputContext,validateOutput,promptFor,redact,reserveAI} from '../server/ai.mjs';
const client={type:'m',stage:1,tone:'warm',facts:{situation:'yes'},profile:{regime:'rgps'},incoming:'Meu bebê nasceu há um mês. Estou desempregada.',history:[{incoming:'Olá',reply:'Você já teve algum vínculo com o INSS?'}]};
const answer={reply:'Entendi. Quando terminou seu último vínculo de trabalho? Podemos organizar essa informação para uma análise individual.',intent:'Completar triagem',reason:'Falta confirmar o último vínculo e a proteção previdenciária.',sourceIds:['quality'],needsHuman:true};
async function account(){const a=await app();const setup=await a.request('/api/auth/setup',{method:'POST',body:{username:'admin',password:'AI test password 98723!',setupToken:'test-bootstrap-token'}});const token=setup.headers.get('Set-Cookie').match(/elo_session=([^;]+)/)[1];return {...a,token}}
test('Base revisada igual na interface e servidor; contexto limitado e sem identificadores conhecidos',()=>{
 const context={};vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../public/legal.js',import.meta.url),'utf8'),context);assert.equal(vm.runInContext('LEGAL_VERSION',context),LEGAL_VERSION);assert.deepEqual(JSON.parse(vm.runInContext('JSON.stringify(LEGAL_RULES)',context)),LEGAL_RULES);
 const c=inputContext({client:{...client,name:'Nome que não deve sair',incoming:'CPF 123.456.789-01, telefone (11) 99999-8888, email teste@example.com, senha: segredo123'}});assert(!JSON.stringify(c.context).includes('Nome que não deve sair'));assert(!JSON.stringify(c.context).includes('123.456.789-01'));assert(!JSON.stringify(c.context).includes('segredo123'));assert(!JSON.stringify(c.context).includes('teste@example.com'));assert(!JSON.stringify(c.context).includes('99999-8888'));
 assert(c.sources.every(r=>r.benefit!=='d'));assert.equal(inputContext({client:{...client,profile:{regime:'rpps'}}}).sources.length,1);
 assert(!promptFor(c)[0].content.includes('STF - Tema 1102'));assert.equal(redact('token: segredo123'),'token: [removido]');
 const long=inputContext({client:{...client,incoming:'a'.repeat(5000),history:Array.from({length:10},()=>({incoming:'x'.repeat(1500),reply:'oi'}))}});assert(long.truncated);assert.equal(long.context.conversaRecente.length,6);assert.equal(long.context.mensagemAtual.length,4000);
});
test('Autenticação, origem, cota e geração estruturada sem envio externo',async()=>{
 const a=await account();let called=0,captured;
 a.env.AI={run:async(model,input)=>{called++;captured=input;return {response:answer}}};
 assert.equal((await a.request('/api/ai/suggest',{method:'POST',body:{client}})).status,401);assert.equal(called,0);
 assert.equal((await a.request('/api/ai/suggest',{token:a.token,method:'POST',body:{client},origin:'https://evil.test'})).status,403);assert.equal(called,0);
 assert.equal((await a.request('/api/ai/suggest',{token:a.token,method:'POST',body:{client:{}}})).status,400);assert.equal(called,0);
 const r=await a.request('/api/ai/suggest',{token:a.token,method:'POST',body:{client}});assert.equal(r.status,200);const data=await r.json();assert.equal(data.engine,'ai');assert.equal(data.reply,answer.reply);assert.equal(data.baseVersion,LEGAL_VERSION);assert.equal(called,1);assert(captured.messages[1].content.includes('Você já teve algum vínculo'));assert.equal(captured.response_format.type,'json_schema');
 assert.equal((await a.request('/api/ai/suggest',{token:a.token,method:'POST',body:{client}})).status,429);assert.equal(called,1);
 const quota={day:new Date().toISOString().slice(0,10),count:60,lastAt:0};await a.db.put('ai-quota',quota);assert.equal((await a.request('/api/ai/suggest',{token:a.token,method:'POST',body:{client}})).status,429);
 await a.db.put('ai-quota',{day:'2020-01-01',count:60,lastAt:0});assert.equal((await reserveAI(a.db,{limit:60})).status,200);
});
test('Saídas inválidas, referências inventadas e promessas são recusadas',()=>{
 const input=inputContext({client});assert.throws(()=>validateOutput({response:'not JSON'},input));assert.throws(()=>validateOutput({response:{...answer,sourceIds:['STF-999']}},input));assert.throws(()=>validateOutput({response:{...answer,reply:'Você tem direito garantido ao benefício.'}},input));assert.throws(()=>validateOutput({response:{...answer,reply:'Envie sua senha do gov.br para continuar.'}},input));assert.throws(()=>validateOutput({response:{...answer,reply:'A carência é dispensada.',sourceIds:[]}},input));assert.throws(()=>validateOutput({response:{...answer,reply:'Segundo a Lei 999/2026 você pode requerer.'}},input));assert.throws(()=>validateOutput({response:{...answer,reply:'Você receberá R$ 5.000 em 30 dias.'}},input));assert.equal(validateOutput({response:JSON.stringify(answer)},input).reply,answer.reply);
});
test('Falha de IA é explícita e encerramento respeita o cliente sem inferência',async()=>{
 const a=await account();let r=await a.request('/api/ai/suggest',{token:a.token,method:'POST',body:{client}});assert.equal(r.status,503);assert((await r.json()).error.includes('modelo por regras'));
 a.env.AI={run:async()=>{throw Error('provider error secret internal')}};await a.db.delete('ai-quota');r=await a.request('/api/ai/suggest',{token:a.token,method:'POST',body:{client}});assert.equal(r.status,502);assert(!(await r.text()).includes('secret internal'));
 await a.db.delete('ai-quota');let called=false;a.env.AI.run=async()=>{called=true};r=await a.request('/api/ai/suggest',{token:a.token,method:'POST',body:{client:{...client,incoming:'Não quero mais contato'}}});assert.equal(r.status,200);assert.equal((await r.json()).engine,'rules');assert.equal(called,false);
});
