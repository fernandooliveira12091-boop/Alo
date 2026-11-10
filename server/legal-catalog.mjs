// Trechos conferidos. Teste de paridade impede divergência com a base exibida na interface.
/* Base editorial versionada. O documento importado é conteúdo de consulta, nunca código ou instruções executáveis. */
export const LEGAL_VERSION = '2026-11-10.1';
const LAW_URL = 'https://www2.camara.leg.br/legin/fed/lei/1991/lei-8213-24-julho-1991-363650-normaatualizada-pl.html';
const MAT_URL = 'https://www.gov.br/inss/pt-br/direitos-e-deveres/salario-maternidade/salario-maternidade';
const INC_URL = 'https://www.gov.br/inss/pt-br/direitos-e-deveres/beneficios-por-incapacidade/auxilio-por-incapacidade-temporaria';
export const LEGAL_RULES = [
 {id:'regime', title:'Lei 8.213/1991 · art. 12', benefit:'both', topic:'Regime previdenciário', summary:'Separar vínculos do RGPS e do regime próprio antes de orientar.', action:'Perguntar o regime. RPPS exige análise da legislação do ente.', url:LAW_URL},
 {id:'quality', title:'Lei 8.213/1991 · art. 15', benefit:'both', topic:'Qualidade de segurado', summary:'A proteção pode continuar após o fim das contribuições, conforme a categoria e as condições legais.', action:'Verificar vínculos e datas; não negar o caso apenas por desemprego.', url:LAW_URL},
 {id:'maternity', title:'Lei 8.213/1991 · arts. 71 a 73', benefit:'m', topic:'Evento e documentação', summary:'Confirmar o evento, sua data e a categoria para a análise do salário-maternidade.', action:'Organizar documentos e informações, sem calcular valores automaticamente.', url:LAW_URL},
 {id:'maternity-wait', title:'ADIs 2.110/2.111 · IN PRES/INSS 188/2025', benefit:'m', topic:'Carência do salário-maternidade', summary:'A orientação atual do INSS dispensa carência para todas as categorias, mantendo a exigência de qualidade de segurado.', action:'Não exigir dez contribuições. Conferir datas do evento, do requerimento e a situação previdenciária.', url:MAT_URL, extraUrl:'https://portalin.inss.gov.br/in/540'},
 {id:'incapacity', title:'Lei 8.213/1991 · arts. 25, 26, 59 e 60', benefit:'d', topic:'Incapacidade temporária', summary:'Verificar incapacidade para a atividade habitual, qualidade de segurado e carência, com as exceções legais.', action:'Perguntar atividade, início e duração do afastamento e existência de documentação médica.', url:LAW_URL, extraUrl:INC_URL},
 {id:'incapacity-wait', title:'INSS · requisitos e isenções de carência', benefit:'d', topic:'Carência e exceções', summary:'Em regra são doze contribuições; acidentes e outras hipóteses legais podem dispensar carência. Diagnóstico isolado não confirma direito.', action:'Encaminhar exceções para análise individual; não rejeitar por contagem isolada.', url:INC_URL}
].map(r=>({...r,checked:'10/11/2026',status:'Trecho conferido',active:true}));
