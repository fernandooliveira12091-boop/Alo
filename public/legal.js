/* Base editorial versionada. O documento importado é conteúdo de consulta, nunca código ou instruções executáveis. */
const LEGAL_VERSION = '2026-11-10.1';
const LAW_URL = 'https://www2.camara.leg.br/legin/fed/lei/1991/lei-8213-24-julho-1991-363650-normaatualizada-pl.html';
const MAT_URL = 'https://www.gov.br/inss/pt-br/direitos-e-deveres/salario-maternidade/salario-maternidade';
const INC_URL = 'https://www.gov.br/inss/pt-br/direitos-e-deveres/beneficios-por-incapacidade/auxilio-por-incapacidade-temporaria';
const LEGAL_RULES = [
 {id:'regime', title:'Lei 8.213/1991 · art. 12', benefit:'both', topic:'Regime previdenciário', summary:'Separar vínculos do RGPS e do regime próprio antes de orientar.', action:'Perguntar o regime. RPPS exige análise da legislação do ente.', url:LAW_URL},
 {id:'quality', title:'Lei 8.213/1991 · art. 15', benefit:'both', topic:'Qualidade de segurado', summary:'A proteção pode continuar após o fim das contribuições, conforme a categoria e as condições legais.', action:'Verificar vínculos e datas; não negar o caso apenas por desemprego.', url:LAW_URL},
 {id:'maternity', title:'Lei 8.213/1991 · arts. 71 a 73', benefit:'m', topic:'Evento e documentação', summary:'Confirmar o evento, sua data e a categoria para a análise do salário-maternidade.', action:'Organizar documentos e informações, sem calcular valores automaticamente.', url:LAW_URL},
 {id:'maternity-wait', title:'ADIs 2.110/2.111 · IN PRES/INSS 188/2025', benefit:'m', topic:'Carência do salário-maternidade', summary:'A orientação atual do INSS dispensa carência para todas as categorias, mantendo a exigência de qualidade de segurado.', action:'Não exigir dez contribuições. Conferir datas do evento, do requerimento e a situação previdenciária.', url:MAT_URL, extraUrl:'https://portalin.inss.gov.br/in/540'},
 {id:'incapacity', title:'Lei 8.213/1991 · arts. 25, 26, 59 e 60', benefit:'d', topic:'Incapacidade temporária', summary:'Verificar incapacidade para a atividade habitual, qualidade de segurado e carência, com as exceções legais.', action:'Perguntar atividade, início e duração do afastamento e existência de documentação médica.', url:LAW_URL, extraUrl:INC_URL},
 {id:'incapacity-wait', title:'INSS · requisitos e isenções de carência', benefit:'d', topic:'Carência e exceções', summary:'Em regra são doze contribuições; acidentes e outras hipóteses legais podem dispensar carência. Diagnóstico isolado não confirma direito.', action:'Encaminhar exceções para análise individual; não rejeitar por contagem isolada.', url:INC_URL}
].map(r=>({...r,checked:'10/11/2026',status:'Trecho conferido',active:true}));
const LEGAL_CORRECTIONS = [{title:'TNU · Súmula 77',summary:'A descrição da compilação não corresponde ao enunciado: ele trata da dispensa de exame de condições pessoais e sociais quando não reconhecida incapacidade para a atividade habitual. Não foi ativado nas respostas.',url:'https://www.cjf.jus.br/cjf/corregedoria-da-justica-federal/turma-nacional-de-uniformizacao/temas-representativos/tema-36'}];
function legalSources(ids){return ids.map(id=>LEGAL_RULES.find(r=>r.id===id)).filter(Boolean)}
function legalFingerprint(c){return JSON.stringify([c.type,c.incoming,c.stage,c.tone,c.facts,c.profile||{}])}
function legalGenerate(c,base){
 const m=norm(c.incoming||''), p=c.profile||{}, sources=[];
 let result={...base};
 const protectedIntents=['Respeitar decisão','Esclarecer honorários','Orientar envio seguro'];
 if(protectedIntents.includes(base.intent))return {...result,legal:{version:LEGAL_VERSION,sourceIds:[],fingerprint:legalFingerprint(c),generatedReply:result.reply,note:'Resposta de relacionamento; nenhuma tese jurídica foi aplicada.'}};
 const prefix=c.tone==='direct'?'':`Entendi, ${c.name.split(' ')[0]}. `;
 const set=(intent,reply,ids,note)=>{result={reply:prefix+reply,intent,reason:note};sources.push(...ids)};
 if(p.regime==='rpps'){
  set('Analisar regime próprio','Como você informou vínculo com regime próprio, precisamos conferir as regras do seu órgão e do ente responsável. Qual é o órgão e há também algum vínculo com o INSS?', ['regime'],'RPPS: as regras do RGPS não foram aplicadas ao vínculo informado.');
 }else if(/servidor|funcionari[oa] public|regime proprio|rpps/.test(m)&&p.regime!=='rgps'){
  set('Confirmar regime','Seu vínculo é pelo INSS ou por um regime próprio do serviço público? Essa informação define quais regras precisamos consultar.', ['regime'],'Não presumir que todo servidor está vinculado a RPPS.');
 }else if(c.type==='m'&&/carencia|contribui/.test(m)){
  set('Esclarecer carência','A orientação atual do INSS dispensa carência para o salário-maternidade, mas ainda é necessário comprovar a qualidade de segurado. Quando ocorreu ou está previsto o evento e qual era sua situação de trabalho ou contribuição?', ['maternity-wait','quality'],'Não prometer benefício com uma contribuição. Pedidos antigos ou indeferidos exigem análise das datas e da decisão.');
 }else if(c.type==='d'&&/carencia|contribui|acidente/.test(m)){
  set('Verificar carência e exceções','Em regra, há carência de 12 contribuições, mas existem hipóteses de dispensa, como acidentes. Também precisamos verificar a incapacidade e a qualidade de segurado. Qual atividade você exerce e desde quando está afastado?', ['incapacity-wait','incapacity','quality'],'A eventual dispensa de carência não substitui os demais requisitos.');
 }else if(/desempreg|parei de contribuir|sem contribuir|periodo de graca/.test(m)){
  set('Verificar proteção previdenciária','O fim do emprego ou das contribuições não encerra necessariamente a proteção previdenciária. Quando terminou seu último vínculo ou recolhimento e qual era sua categoria?', ['quality'],'Não calcular período de graça automaticamente sem histórico e categoria.');
 }else{
  if(['Completar triagem','Organizar documentos','Alinhar expectativas','Encaminhar para análise','Agendar análise'].includes(base.intent))sources.push(c.type==='m'?'maternity':'incapacity','quality');
 }
 return {...result,legal:{version:LEGAL_VERSION,sourceIds:[...new Set(sources)],fingerprint:legalFingerprint(c),generatedReply:result.reply,note:result.reason}};
}
function legalSourceMarkup(ids){return legalSources(ids).map(r=>`<li><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)} ↗</a><small>${esc(r.topic)} · trecho conferido em ${r.checked}</small></li>`).join('')}
function legalPanel(c){const l=c.legal,stale=l&&(l.version!==LEGAL_VERSION||l.fingerprint!==legalFingerprint(c));return `<section class="legal-panel"><div class="labelrow"><h3>Base da sugestão</h3><button onclick="openLegal()">Consultar base jurídica ↗</button></div>${!l?'<p>Prepare uma nova mensagem para ver as referências utilizadas.</p>':`${stale?'<p class="legal-warning">Os dados ou a base mudaram. Gere uma nova sugestão para atualizar as referências.</p>':''}<p>${esc(l.note)}</p>${l.sourceIds.length?`<ul>${legalSourceMarkup(l.sourceIds)}</ul>`:'<p>Nenhuma regra jurídica aplicada a esta resposta.</p>'}${c.reply!==l.generatedReply?'<p class="legal-warning">Texto editado manualmente. As fontes se referem à sugestão original e não validam as suas alterações.</p>':''}<small>Base ${esc(l.version)} · uso interno · fontes não incluídas ao copiar</small>`}</section>`}
function profileFields(c){const p=c.profile||{};return `<div class="fields legal-profile"><label>Regime informado<select data-profile="regime">${[['','Ainda não confirmado'],['rgps','INSS / RGPS'],['rpps','Regime próprio / RPPS']].map(([v,t])=>`<option value="${v}" ${p.regime===v?'selected':''}>${t}</option>`).join('')}</select></label><label>Categoria informada<select data-profile="category">${[['','Ainda não confirmada'],['employee','Empregado / doméstico / avulso'],['individual','Contribuinte individual / MEI'],['optional','Facultativo'],['rural','Atividade rural / segurado especial'],['unemployed','Desempregado'],['other','Outra / precisa de análise']].map(([v,t])=>`<option value="${v}" ${p.category===v?'selected':''}>${t}</option>`).join('')}</select></label><label>Data do evento / início do afastamento<input type="date" data-profile="eventDate" value="${esc(p.eventDate||'')}"></label><label>Data do requerimento, se houver<input type="date" data-profile="requestDate" value="${esc(p.requestDate||'')}"></label></div><p class="hint">Campos informativos: datas e categoria apoiam a revisão manual. Sem cálculo automático de prazos ou elegibilidade.</p>`}
function openLegal(){view='legal';render()}
function legalLibrary(){return `<section class="card legal-library"><div class="cardhead"><div><h2>Base jurídica do atendimento</h2><p>Referências para revisar cada orientação, com escopo e origem visíveis.</p></div><span class="badge">Base ${LEGAL_VERSION}</span></div><div class="bodypad"><p class="legal-warning">A compilação foi importada como material de consulta. O título “vigentes” do arquivo não certifica sua atualização. Apenas os trechos conferidos abaixo orientam o atendimento; não há atualização automática nem análise jurídica integral.</p><div class="row"><input id="legal-search" aria-label="Buscar na base jurídica" placeholder="Buscar norma, tema ou benefício…"><select id="legal-filter" aria-label="Filtrar referências"><option value="all">Todas as referências</option><option value="active">Aplicadas ao atendimento</option><option value="pending">Importadas para consulta</option><option value="m">Salário-maternidade</option><option value="d">Auxílio-doença</option></select></div><p><a href="legal/compilacao-original.md" target="_blank" rel="noopener noreferrer">Abrir compilação original (.md) ↗</a></p><details class="legal-warning"><summary>Revisão da compilação · correção identificada</summary>${LEGAL_CORRECTIONS.map(r=>`<p><b>${esc(r.title)}</b>: ${esc(r.summary)} <a href="${r.url}" target="_blank" rel="noopener noreferrer">Conferir no CJF ↗</a></p>`).join('')}<p>Demais temas e súmulas importados aguardam conferência individual e não geram respostas automáticas. Normas de RPPS e aposentadorias exigem análise do escopo e do período aplicável.</p></details><div id="legal-results"></div></div></section>`}
function renderLegalResults(){const q=norm($('#legal-search').value),filter=$('#legal-filter').value;const items=[...LEGAL_RULES,...LEGAL_IMPORTED].filter(r=>(filter==='all'||filter==='active'&&r.active||filter==='pending'&&!r.active||['m','d'].includes(filter)&&r.active&&(r.benefit===filter||r.benefit==='both'))&&norm([r.title,r.topic,r.summary].join(' ')).includes(q));$('#legal-results').innerHTML=items.map(r=>`<article class="legal-item"><span class="badge">${esc(r.status)}</span><h3>${esc(r.title)}</h3><p>${esc(r.summary)}</p>${r.active?`<p><b>No atendimento:</b> ${esc(r.action)}</p><small>Trecho conferido em ${r.checked}. Sem certificação de vigência integral.</small><p><a href="${r.url}" target="_blank" rel="noopener noreferrer">Fonte oficial ↗</a>${r.extraUrl?` · <a href="${r.extraUrl}" target="_blank" rel="noopener noreferrer">Orientação complementar ↗</a>`:''}</p>`:'<small>Descrição recebida no arquivo, não validada. Não aplicada às mensagens.</small>'}</article>`).join('')||'<p>Nenhuma referência encontrada.</p>'}
function bindLegal(){if(view==='legal'){renderLegalResults();$('#legal-search').oninput=renderLegalResults;$('#legal-filter').onchange=renderLegalResults;return}if(view!=='desk'||!current())return;document.querySelectorAll('[data-profile]').forEach(el=>el.onchange=()=>{const c=current();c.profile||={};c.profile[el.dataset.profile]=el.value;save();render()})}

const LEGAL_IMPORTED = [
  {
    "id": "import-1",
    "title": "Art. 40, CF/88",
    "summary": "Regras do RPPS. Diretrizes e regras gerais dos servidores públicos",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-2",
    "title": "Art. 201 a 204, CF/88",
    "summary": "Regras do RGPS e Assistência Social. Regras gerais de benefícios e custeio previdenciário",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-3",
    "title": "EC nº 103/2019",
    "summary": "Reforma da Previdência Social. Novas idades mínimas, regras de transição (pedágios 50% e 100%, pontos, idade progressiva), alíquotas progressivas e novo cálculo da RMI.",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-4",
    "title": "EC nº 41/2003",
    "summary": "Reforma Previdenciária de 2003. Regras de paridade/integralidade para servidores antigos.",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-5",
    "title": "EC nº 47/2005",
    "summary": "Regra da \"Formula 85/95\" para RPPS. Regras de aposentadoria de servidores.",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-6",
    "title": "Lei nº 8.212/1991",
    "summary": "Organização da Seguridade Social e Plano de Custeio.",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-7",
    "title": "Lei nº 8.213/1991",
    "summary": "Planos de Benefícios da Previdência Social.",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-8",
    "title": "Lei nº 8.742/1993 (LOAS)",
    "summary": "Lei Orgânica da Assistência Social.",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-9",
    "title": "Lei nº 8.112/1990",
    "summary": "Estatuto dos Servidores Públicos Civis da União.",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-10",
    "title": "Lei nº 9.717/1998",
    "summary": "Regras Gerais para Organização e Funcionamento dos RPPS.",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-11",
    "title": "Lei nº 10.887/2004",
    "summary": "Aplicação da EC 41/2003 no RPPS e cálculo da média aritmética.",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-12",
    "title": "Decreto nº 3.048/1999",
    "summary": "Regulamento da Previdência Social (RPS).",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-13",
    "title": "Decreto nº 10.410/2020",
    "summary": "Altera o Decreto 3.048/1999 para adequá-lo à EC 103/2019.",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-14",
    "title": "INSS / PRES · IN nº 128/2022",
    "summary": "Disciplina as regras, procedimentos e rotinas de reconhecimento de direitos no RGPS.",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-15",
    "title": "MPS / MTP · Portaria MTP nº 1.467/2022",
    "summary": "Disciplina as normas gerais dos RPPS.",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-16",
    "title": "MPS · Portarias Anuais de Reajuste (Ex: Portaria MPS/MF anual)",
    "summary": "Reajuste dos benefícios e tabela progressiva do INSS.",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-17",
    "title": "STF - Tema 1102",
    "summary": "\"Revisão da Vida Toda\"",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-18",
    "title": "STF - Tema 709",
    "summary": "Aposentadoria Especial e continuidade na atividade nociva",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-19",
    "title": "STF - Tema 334",
    "summary": "Direito Adquirido à melhor regra de cálculo",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-20",
    "title": "STF - Tema 1095",
    "summary": "Extensão do auxílio-acompanhante (25%) para outras aposentadorias",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-21",
    "title": "STJ - Tema 995",
    "summary": "DIB da DER Reafirmada",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-22",
    "title": "STJ - Tema 1018",
    "summary": "Recebimento de benefício administrativo concomitante com execução judicial",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-23",
    "title": "STJ - Tema 1057",
    "summary": "Legitimação dos sucessores para revisão da RMI do de cujus",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-24",
    "title": "STJ - Súmula 555",
    "summary": "Contribuições previdenciárias e o teto limite",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-25",
    "title": "TNU - Tema 243",
    "summary": "Conversão de tempo especial em comum pós-EC 103/2019",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-26",
    "title": "TNU - Tema 256",
    "summary": "Comprovação de atividade rural (Início de prova material)",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-27",
    "title": "TNU - Súmula 77",
    "summary": "Julgamento da incapacidade laboral habitual",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-28",
    "title": "TNU - Súmula 85",
    "summary": "Uso de Equipamento de Proteção Individual (EPI) em Ruído",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  },
  {
    "id": "import-29",
    "title": "TNU - Súmula 49",
    "summary": "Manutenção da qualidade de segurado (Seguro-Desemprego)",
    "status": "Consulta · não aplicada",
    "active": false,
    "benefit": "archive"
  }
];
function refreshLegalPanel(c){const panel=document.querySelector('.legal-panel');if(panel)panel.outerHTML=legalPanel(c)}
