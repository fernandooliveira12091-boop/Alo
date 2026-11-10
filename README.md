# Elo — Triagem e conversão

Atendimento manual para salário-maternidade e benefício por incapacidade temporária (auxílio-doença).

Cadastre um cliente, cole a mensagem recebida, preencha a triagem e gere a próxima resposta. Revise, copie e envie manualmente. Registre o envio e avance o funil.

As sugestões podem usar IA na Cloudflare ou modelos por regras. Não há envio automático ao WhatsApp nem garantia de concessão de benefícios. A sugestão de IA exige revisão antes de liberar cópia e registro de envio.

## Dados e acesso

Os atendimentos são salvos no banco SQLite da Cloudflare, no Durable Object da conta autenticada. Use o mesmo login em outros aparelhos para acessar os dados. Alterações ainda não sincronizadas são guardadas temporariamente no navegador e indicadas na interface. Evite inserir senhas, CPF completo ou documentos médicos.

O endereço workers.dev exige autenticação para abrir a interface e os arquivos. Os aparelhos compartilham os registros salvos na mesma conta. Há uma única conta administradora; não há cadastro público de usuários.

## Verificação local

Com Node.js 22 ou superior, execute `npm test`. Para testar a proteção completa, use `wrangler dev`; servir apenas `public/` não executa o login.

## Publicar na Cloudflare

Em **Settings → Secrets and variables → Actions** deste repositório configure:

- `CLOUDFLARE_API_TOKEN`: token com permissão Account / Workers Scripts / Edit, limitado à conta escolhida.
- `CLOUDFLARE_ACCOUNT_ID`: ID da conta Cloudflare.

Não envie tokens no chat nem os coloque no código. Execute **Actions → Validar e publicar na Cloudflare → Run workflow**. O log da publicação informa o endereço real em workers.dev. Pushes posteriores em main também validam e publicam automaticamente.

O Worker se chama `elo-triagem-beneficios`, conforme `wrangler.jsonc`. O repositório não inclui dados de clientes ou credenciais do Sites.

## Base jurídica integrada

A aba **Base jurídica** permite buscar 29 referências importadas do documento fornecido e consultar o original em `public/legal/compilacao-original.md`. A descrição e o título do arquivo não são certificação de vigência. Referências não conferidas ficam apenas como consulta e nunca são executadas como instruções ou regras.

O arquivo `public/legal.js` contém seis regras de triagem com trechos conferidos em fontes oficiais em 10/11/2026, abrangendo o regime previdenciário, qualidade de segurado, documentação e carência dos dois benefícios. A dispensa de carência do salário-maternidade considera a orientação atual do INSS e remete pedidos antigos ou negados à conferência individual. O texto da Súmula 77 da TNU descrito na compilação foi sinalizado como incorreto e não foi aplicado ao atendimento.

As sugestões exibem referências internas separadas do texto copiado. Regime próprio é encaminhado para análise específica. Datas e categoria são informativas, sem cálculo de prazos ou conclusão de elegibilidade. O histórico registra a versão da base, as referências da sugestão e se houve edição manual; alterações no contexto sinalizam a necessidade de gerar nova sugestão. A base não se atualiza sozinha. Para uma revisão editorial, confira as fontes, altere as regras e incremente `LEGAL_VERSION` antes de publicar.


## Login e senha

A entrada fica em `/auth`. O Worker verifica a sessão antes de servir qualquer arquivo. Credenciais, sessões e registros de clientes ficam no Durable Object SQLite `AuthStore`, com chaves separadas e validação de sessão em cada operação. Nenhuma senha é gravada no GitHub ou em localStorage. A senha usa PBKDF2-SHA-256 com salt aleatório e 100 mil iterações, compatíveis com Web Crypto do Workers. Cookies de sessão são Secure, HttpOnly, SameSite=Strict e expiram em 12 horas. Logout revoga a sessão; troca de senha exige a senha atual e invalida todas as sessões anteriores. Tentativas incorretas têm limite por origem de rede.

O primeiro acesso exige um link privado com um token aleatório de 256 bits, entregue separadamente ao responsável. Apenas o hash desse token e a data de expiração são configurados em `wrangler.jsonc`. Ele expira após 48 horas e não permite outro cadastro depois que a conta é criada. O fragmento do link não é enviado no GET nem em referências de navegação e é removido do endereço ao carregar a tela. Não publique esse link nem compartilhe a sessão.

Há alteração de senha autenticada em `/auth?mode=password`. Não há recuperação por e-mail nem cadastro de equipe nesta versão; recuperação exige intervenção do administrador da hospedagem. Preserve o namespace Durable Objects entre publicações para manter a conta. O login não criptografa cópias antigas ou alterações pendentes guardadas neste navegador: use um perfil de confiança e exporte backups.


## Atendimentos na nuvem e backups

A API `/api/cloud/*` exige sessão válida. Escritas verificam origem e formato, validam os dados e são confirmadas em transação. O cliente informa a revisão que carregou; revisões antigas recebem HTTP 409, sem sobrescrever dados. A interface tenta combinar alterações em campos independentes; conflitos no mesmo campo preservam a cópia local, oferecem download e exigem revisão antes de recarregar a nuvem.

A sincronização ocorre após uma pausa nas edições e a leitura de outros aparelhos a cada 20 segundos enquanto a página está visível. Alterações feitas durante um envio são preservadas para o próximo envio. Falhas de rede deixam o status pendente e guardam uma cópia por usuário no localStorage. Não feche antes da confirmação de salvamento; logout é bloqueado enquanto houver alterações pendentes.

A aba **Dados e backups** permite importar os registros antigos de `elo-v1` do navegador, importar JSON, baixar todos os dados atuais e criar/restaurar backups. A importação acrescenta identificadores ainda ausentes, preservando os que já existem na nuvem. Ela não apaga a cópia antiga do navegador. Não é possível acessar remotamente dados salvos em outro navegador: abra o navegador de origem ou importe o JSON exportado.

Há uma cópia automática do estado anterior à primeira edição de cada dia UTC, além de cópias antes de exclusões e restaurações. Cópias manuais podem ser criadas a qualquer momento após sincronizar. As 14 cópias mais recentes são retidas no mesmo banco; para uma cópia independente, baixe o JSON e guarde fora do serviço. Restaurar exige confirmação e revisão atual; antes da restauração, uma cópia do estado atual é criada. Backups não incluem senhas e sessões.

Limites desta versão: 1.000 atendimentos, 95 KB por atendimento e 5 MB de dados por conta, além dos limites da sua conta Cloudflare. Registros e snapshots são divididos em chaves para respeitar o limite de valor do armazenamento. Preserve o namespace e o identificador `elo-owner-v1`; a publicação não apaga dados nem altera o login existente.

Verificação adicional executada: navegação com Chromium em duas sessões independentes contra a implementação local, incluindo primeiro acesso, importação, cadastro, sincronização nos dois sentidos, criação e restauração de backup. Os testes automatizados da API verificam autenticação, origem, concorrência, retenção e rejeição de dados inválidos.


## IA para sugestão de respostas

O botão **Gerar resposta com IA** chama a API autenticada `/api/ai/suggest`. O servidor usa Workers AI, com binding `AI`, no modelo `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. Não há chave de API no navegador e não é necessária uma conta adicional de IA. O uso segue a franquia e a cobrança da conta Cloudflare; consulte https://developers.cloudflare.com/workers-ai/platform/pricing/ . O aplicativo limita tentativas a 60 por dia UTC, com intervalo mínimo de quatro segundos entre solicitações, configurável por `AI_DAILY_LIMIT`. Falhas também contam para o limite; não há repetição automática de inferências.

O contexto contém benefício, etapa, tom, triagem, categoria e datas, mensagem atual (até 4.000 caracteres) e até seis interações recentes (até 1.400 caracteres por mensagem). O nome cadastrado, outras fichas, senhas de login e a compilação não revisada não são enviados. Padrões reconhecidos de CPF, telefone, e-mail e credenciais são ocultados antes da inferência. Isso não é anonimização completa de texto livre: evite inserir identificadores ou documentos sensíveis.

A base enviada ao modelo vem exclusivamente dos trechos revisados em `server/legal-catalog.mjs`; um teste exige paridade com `public/legal.js`. O contexto de clientes é tratado como dado, sem ferramentas de ação. A saída é JSON, validado em formato e identificadores de fontes, com bloqueios adicionais de algumas promessas, valores, prazos e pedidos de credenciais. Essas verificações não certificam a correção jurídica da resposta: a revisão humana continua obrigatória. Casos que precisam de análise ficam sinalizados. A IA não consulta a internet nem atualiza a legislação automaticamente.

Na interface, **Li, revisei e aprovo** libera a cópia e o registro manual. Editar a resposta revoga a aprovação; mudar a mensagem ou a triagem exige nova geração ou modelo por regras. O resultado de uma requisição atrasada nunca substitui uma edição feita durante a geração. Modelo, horário, fontes, revisão e eventual edição são registrados no histórico e sincronizados na nuvem. A IA não envia mensagens a clientes. O botão de modelos por regras continua disponível; falhas de IA são identificadas, sem fingir que o modelo local foi gerado por IA.

O diagnóstico `/api/ai/check` é restrito a um token aleatório temporário cujo hash consta na configuração. Expira em uma hora e permite no máximo três inferências com um caso fictício, sem ler ou gravar atendimentos reais. Ele retorna apenas sucesso, modelo e versão da base. Não forneça o token a visitantes. O fluxo normal de sugestões exige login e proteção de origem.
