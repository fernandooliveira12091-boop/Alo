# Elo — Triagem e conversão

Atendimento manual para salário-maternidade e benefício por incapacidade temporária (auxílio-doença).

Cadastre um cliente, cole a mensagem recebida, preencha a triagem e gere a próxima resposta. Revise, copie e envie manualmente. Registre o envio e avance o funil.

As sugestões usam regras e modelos locais. Não há API de IA, envio automático ao WhatsApp ou garantia de concessão de benefícios.

## Dados e acesso

Os atendimentos ficam no localStorage deste navegador. Os registros dos clientes não têm banco remoto nem sincronização entre dispositivos. O login é validado no servidor. Exporte os registros para backup. Registros do endereço anterior não migram automaticamente para outro domínio. Evite inserir senhas, CPF completo ou documentos médicos.

O endereço workers.dev exige autenticação para abrir a interface e os arquivos. Cada navegador mantém seus próprios registros. Há uma única conta administradora; não há cadastro público de usuários.

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

A entrada fica em `/auth`. O Worker verifica a sessão antes de servir qualquer arquivo. Credenciais e sessões ficam no Durable Object SQLite `AuthStore`; os registros dos clientes continuam no navegador. Nenhuma senha é gravada no GitHub ou em localStorage. A senha usa PBKDF2-SHA-256 com salt aleatório e 100 mil iterações, compatíveis com Web Crypto do Workers. Cookies de sessão são Secure, HttpOnly, SameSite=Strict e expiram em 12 horas. Logout revoga a sessão; troca de senha exige a senha atual e invalida todas as sessões anteriores. Tentativas incorretas têm limite por origem de rede.

O primeiro acesso exige um link privado com um token aleatório de 256 bits, entregue separadamente ao responsável. Apenas o hash desse token e a data de expiração são configurados em `wrangler.jsonc`. Ele expira após 48 horas e não permite outro cadastro depois que a conta é criada. O fragmento do link não é enviado no GET nem em referências de navegação e é removido do endereço ao carregar a tela. Não publique esse link nem compartilhe a sessão.

Há alteração de senha autenticada em `/auth?mode=password`. Não há recuperação por e-mail nem cadastro de equipe nesta versão; recuperação exige intervenção do administrador da hospedagem. Preserve o namespace Durable Objects entre publicações para manter a conta. O login não criptografa os registros já salvos no navegador: use um perfil de navegador de confiança e exporte backups.
