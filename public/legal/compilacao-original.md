# Compilação de Legislação Previdenciária e Precedentes Vigentes para Sistemas

Este documento reúne a estrutura fundamental das normas, precedentes e julgados vinculantes que regem o **RPPS (Regime Próprio de Previdência Social)** e o **RGPS (Regime Geral de Previdência Social - INSS)**, organizados para parametrização em engines de regras e cálculo previdenciário.

---

## 1. Norma Hipotética Fundamental / Constituição Federal

| Categoria | Identificador | Título / Objeto | Impacto Principal no Sistema | Status | 
| ----- | ----- | ----- | ----- | ----- | 
| **Constituição** | Art. 40, CF/88 | Regras do RPPS | Diretrizes e regras gerais dos servidores públicos | Vigente com alterações | 
| **Constituição** | Art. 201 a 204, CF/88 | Regras do RGPS e Assistência Social | Regras gerais de benefícios e custeio previdenciário | Vigente com alterações | 

---

## 2. Reforma da Previdência & Transição

| Categoria | Identificador | Título / Objeto | Impacto Principal no Sistema | Status | 
| ----- | ----- | ----- | ----- | ----- | 
| **Emenda Constitucional** | **EC nº 103/2019** | Reforma da Previdência Social | Novas idades mínimas, regras de transição (pedágios 50% e 100%, pontos, idade progressiva), alíquotas progressivas e novo cálculo da RMI. | **Vigente (Marco Legal)** | 
| **Emenda Constitucional** | EC nº 41/2003 | Reforma Previdenciária de 2003 | Regras de paridade/integralidade para servidores antigos. | Vigente (Direito Adquirido/Transição) | 
| **Emenda Constitucional** | EC nº 47/2005 | Regra da "Formula 85/95" para RPPS | Regras de aposentadoria de servidores. | Vigente (Direito Adquirido/Transição) | 

---

## 3. Leis Ordinárias Principais (Estatutos e Planos)

### 3.1. Regime Geral de Previdência Social (RGPS)

| Legislação | Objeto / Escopo | Módulos do Sistema Afetados | 
| ----- | ----- | ----- | 
| **Lei nº 8.212/1991** | Organização da Seguridade Social e Plano de Custeio. | Módulo de Arrecadação, Alíquotas de Contribuição, Salário de Contribuição. | 
| **Lei nº 8.213/1991** | Planos de Benefícios da Previdência Social. | Engine de Concessão, Carência, Qualidade de Segurado, Tipos de Benefícios. | 
| **Lei nº 8.742/1993 (LOAS)** | Lei Orgânica da Assistência Social. | Regras de Concessão do BPC (Idoso e Pessoa com Deficiência). | 

### 3.2. Regime Próprio de Previdência Social (RPPS - Âmbito Federal)

| Legislação | Objeto / Escopo | Módulos do Sistema Afetados | 
| ----- | ----- | ----- | 
| **Lei nº 8.112/1990** | Estatuto dos Servidores Públicos Civis da União. | Licenças, Afastamentos, Gratificações com reflexo previdenciário. | 
| **Lei nº 9.717/1998** | Regras Gerais para Organização e Funcionamento dos RPPS. | Validação de Certificado de Regularidade Previdenciária (CRP) e Atuária. | 
| **Lei nº 10.887/2004** | Aplicação da EC 41/2003 no RPPS e cálculo da média aritmética. | Módulo de Cálculo de Proventos e Bases de Contribuição. | 

---

## 4. Decretos Regulamentadores

| Decreto | Ementa / Descrição | Relevância para Implementação | 
| ----- | ----- | ----- | 
| **Decreto nº 3.048/1999** | Regulamento da Previdência Social (RPS). | **Essencial.** Contém a regulamentação detalhada de benefícios, moléstias graves, auxílios e fórmulas operacionais. | 
| **Decreto nº 10.410/2020** | Altera o Decreto 3.048/1999 para adequá-lo à EC 103/2019. | Atualização dos critérios de carência, dependentes e cálculos pós-reforma. | 

---

## 5. Instruções Normativas e Portarias (Regras de Negócio Detalhadas)

| Órgão / Tipo | Número | Assunto | Aplicação em Sistemas | 
| ----- | ----- | ----- | ----- | 
| **INSS / PRES** | **IN nº 128/2022** | Disciplina as regras, procedimentos e rotinas de reconhecimento de direitos no RGPS. | Manual prático de validação de regras de negócio para análise de concessão e averbação de tempo de contribuição. | 
| **MPS / MTP** | **Portaria MTP nº 1.467/2022** | Disciplina as normas gerais dos RPPS. | Parâmetros de cálculo, compensação previdenciária e gestão dos regimes próprios. | 
| **MPS** | **Portarias Anuais de Reajuste** *(Ex: Portaria MPS/MF anual)* | Reajuste dos benefícios e tabela progressiva do INSS. | Variáveis de sistema: Tabela de alíquotas, Teto do INSS e Salário Mínimo vigente. | 

---

## 6. Precedentes Judiciais, Súmulas e Temas Repetitivos (STF, STJ e TNU)

Esta seção lista as teses jurídicas firmadas que alteram a aplicação direta das leis e decretos, indispensáveis para a parametrização de cálculos judiciais e administrativas.

### 6.1. Supremo Tribunal Federal (STF) - Repercussão Geral

| Identificador | Tese / Objeto | Regra de Negócio a Parametrizar no Sistema | 
| ----- | ----- | ----- | 
| **STF - Tema 1102** | **"Revisão da Vida Toda"** | Regra de cálculo que permite (ou restringe) a inclusão de contribuições anteriores a julho de 1994 no PBC (conforme atualizações jurisprudenciais do STF). | 
| **STF - Tema 709** | Aposentadoria Especial e continuidade na atividade nociva | Sinaliza a suspensão do pagamento do benefício se o segurado retornar a trabalho com agentes nocivos. | 
| **STF - Tema 334** | Direito Adquirido à melhor regra de cálculo | Permite simular o cálculo da RMI na data de aquisição do direito (Data do Direito Adquirido vs. DER). | 
| **STF - Tema 1095** | Extensão do auxílio-acompanhante (25%) para outras aposentadorias | Restringe o acréscimo de 25% (previsto no art. 45 da Law 8.213/91) exclusivamente à Aposentadoria por Incapacidade Permanente. | 

### 6.2. Superior Tribunal de Justiça (STJ) - Recursos Repetitivos

| Identificador | Tese / Objeto | Regra de Negócio a Parametrizar no Sistema | 
| ----- | ----- | ----- | 
| **STJ - Tema 995** | **DIB da DER Reafirmada** | Permite reafirmar a DER para o momento em que o segurado preencher os requisitos (computando tempo/contribuições posteriores ao requerimento). | 
| **STJ - Tema 1018** | Recebimento de benefício administrativo concomitante com execução judicial | Permite ao segurado manter o benefício concedido administrativamente mais vantajoso enquanto executa parcelas vencidas de outro concedido em juízo. | 
| **STJ - Tema 1057** | Legitimação dos sucessores para revisão da RMI do de cujus | Define a possibilidade de dependentes/herdeiros pleitearem a revisão de benefício de segurado falecido. | 
| **STJ - Súmula 555** | Contribuições previdenciárias e o teto limite | Regras para limitação ao teto nos salários de contribuição e benefícios. | 

### 6.3. Turma Nacional de Uniformização (TNU) - Enunciados e Temas

| Identificador | Tese / Objeto | Regra de Negócio a Parametrizar no Sistema | 
| ----- | ----- | ----- | 
| **TNU - Tema 243** | Conversão de tempo especial em comum pós-EC 103/2019 | Proíbe a conversão de tempo especial trabalhado após 13/11/2019 em tempo comum. | 
| **TNU - Tema 256** | Comprovação de atividade rural (Início de prova material) | Parâmetros de aceite de documentos para validação de tempo rural sem contribuição direta. | 
| **TNU - Súmula 77** | Julgamento da incapacidade laboral habitual | A incapacidade deve ser analisada considerando as condições socioeconômicas e culturais do segurado. | 
| **TNU - Súmula 85** | Uso de Equipamento de Proteção Individual (EPI) em Ruído | O uso de EPI eficaz não descaracteriza a especialidade do tempo se o agente for **Ruído** acima dos limites de tolerância. | 
| **TNU - Súmula 49** | Manutenção da qualidade de segurado (Seguro-Desemprego) | Prorrogação do período de graça por mais 12 meses mediante comprovação de desemprego involuntário. | 

---

## 7. Mapeamento de Regras de Negócio para Engine de Cálculo

Ao parametrizar a legislação no motor de regras do sistema, deve-se considerar a seguinte precedência normativa e divisão de escopo:

```
┌────────────────────────────────────────────────────────┐
│               CONSTITUIÇÃO FEDERAL / EC 103             │
│    (Idades Mínimas, Pontuações, Alíquotas Progressivas)│
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│      TESES VINCULANTES DOS TRIBUNAIS (STF/STJ/TNU)     │
│   (Reafirmação da DER, EPI/Ruído, Direito Adquirido)   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│              LEIS ORDINÁRIAS (8.212 / 8.213)            │
│       (Conceitos de Segurado, Carência, Dependentes)    │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│               DECRETO REGULAMENTADOR (3.048)            │
│         (Fórmulas de RMI, Fator Previdenciário)        │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│               INSTRUÇÃO NORMATIVA (IN 128/2022)         │
│     (Comprovações Documentais, Averbação, CNIS)        │
└───────────────────────────┘
```

---

## 8. Variáveis Dinâmicas Globais a Configurar no Sistema

Para garantir que o sistema esteja sempre atualizado com a legislação e jurisprudência vigentes sem necessidade de refatoração de código, estruture as seguintes variáveis em banco de dados:

1. **`SALARIO_MINIMO_VIGENTE`**: Atualizado anualmente por Decreto/Lei.
2. **`TETO_INSS`**: Teto máximo para salário de benefício e contribuição no RGPS.
3. **`TABELA_ALIQUOTAS_PROGRESSIVAS`**: Faixas de contribuição progressiva para RGPS e RPPS.
4. **`EXPECTATIVA_DE_VIDA_IBGE`**: Tabela de mortalidade anual utilizada para o cálculo do Fator Previdenciário (para regras de direito adquirido anteriores a 13/11/2019).
5. **`INDICES_REAJUSTE_BENEFICIO`**: Índices de correção monetária (INPC, IPCA-E, SELIC, etc.).
6. **`MARCOS_JURISPRUDENCIAIS`**: Datas-limite decorrentes de teses de tribunais (ex.: 13/11/2019 para conversão de tempo especial em comum via Tema 243 TNU).