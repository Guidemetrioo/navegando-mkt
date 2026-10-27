# Navegando MKT — ativação da base central

Preparado em 22/10/2026. Este guia acompanha o código da pasta `navegando crm`.

A aplicação tem dois modos. **Demonstração** usa dados locais e aparece identificada na interface. **Produção** usa Supabase Auth, banco central e arquivos privados. Sem configuração, produção bloqueia o acesso; não utiliza dados fictícios como substituição.

## 1. Separe as informações que só a agência pode fornecer

- E-mail de trabalho de cada um dos 20 membros. Preencha `config/team-emails.example.csv` e salve uma cópia como `config/team-emails.csv`. Mantenha os identificadores e os cargos; preencha apenas os e-mails. Não use um mesmo e-mail para duas pessoas.
- Defina Felipe e Gabriela como responsáveis pela infraestrutura, com meios de recuperação separados. A hierarquia do aplicativo continua exatamente como enviada, incluindo os acessos dos gerentes.
- Os clientes reais podem ser cadastrados depois. A instalação prepara a equipe e deixa clientes, gravações, pontos e entregas vazios.
- Confirme com o responsável pelo departamento pessoal a rotina de jornada, os intervalos e o uso de fotos/GPS. A configuração recebida de três registros internos é uma regra operacional da agência; este software não é apresentado como registrador de ponto certificado.

## 2. Crie as contas em nome da empresa

1. GitHub: crie uma organização ou conta controlada pela agência e um repositório **privado**, por exemplo `navegando-crm`. Ative autenticação em duas etapas e guarde os códigos de recuperação. O repositório preservará o código e seu histórico; ele não é um backup do banco.
2. Supabase: crie uma organização e um projeto para homologação. Depois de validar os fluxos, crie um projeto separado para produção, repetindo a instalação. Escolha uma região próxima dos usuários e armazene a senha do banco em um gerenciador de senhas.
3. Vercel: crie uma equipe da empresa e conecte o repositório privado. Para operação comercial, escolha um plano que permita esse uso; o Hobby é destinado a uso pessoal não comercial. Confira as condições e os preços antes de contratar. [Condições do Hobby](https://vercel.com/docs/plans/hobby).
4. Configure um serviço SMTP para os e-mails de convite e recuperação de senha do Supabase. Não é necessário contratar um domínio antes do teste: pode-se começar com o endereço HTTPS fornecido pela Vercel, e conectar um subdomínio da agência depois.

Não envie senhas, chave administrativa do Supabase ou chave de backup pelo chat. As contas, o domínio e o método de pagamento devem pertencer à agência.

## 3. Instale o banco em um projeto Supabase novo

1. Abra o projeto e entre no **SQL Editor**.
2. No pacote de entrega, abra `01-instalar-base.sql`. Ele reúne as cinco migrações, em ordem. Execute esse arquivo **somente em um projeto novo destinado ao CRM**. Não execute sobre outro sistema ou sobre uma instalação já existente.
3. O resultado esperado é a criação das tabelas `agency_members`, `agency_records`, `agency_audit` e `agency_requests`, das funções de acesso e do bucket privado `ponto-evidencias`.
4. Em **Table Editor → agency_members**, confira os 20 membros: dois donos, quatro gerentes, três filmmakers, quatro modelos e sete internos. O campo `user_id` estará vazio até a ativação das contas.
5. **Não execute `supabase/seed.sql`**: esse é o seed legado de demonstração. O arquivo `supabase/config.toml` já desativa seu uso automático no desenvolvimento local.
6. Mantenha o bucket de evidências privado. O sistema gera endereços temporários para as pessoas autorizadas; não é necessário torná-lo público.

As tabelas legadas das três primeiras migrações ficam sem acesso direto pelos usuários. A base central nova utiliza registros de negócio em JSONB versionados, com autorização, validação e auditoria nas funções do banco. É uma base para uma única agência; não representa isolamento entre múltiplas empresas.

## 4. Publique primeiro a homologação

1. Envie o código ao repositório privado. Não envie `.env.local`, `.env.admin.local`, a planilha preenchida de e-mails ou arquivos de backup. O `.gitignore` já os exclui.
2. Na Vercel, importe o repositório como projeto Next.js e selecione Node.js 24.
3. Cadastre estas variáveis em **Settings → Environment Variables**, usando o projeto Supabase de homologação:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_APP_MODE` | `production` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL HTTPS do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública/anon do projeto |

4. A chave administrativa `service_role` **não é necessária no aplicativo publicado**. Ela só será usada em ambiente protegido para vincular usuários e gerar cópias independentes.
5. Faça o deploy. Ao mudar variáveis, gere um novo deploy para que sejam incorporadas ao aplicativo. [Variáveis na Vercel](https://vercel.com/docs/environment-variables).
6. Copie o endereço HTTPS publicado. Em Supabase → **Authentication → URL Configuration**, configure esse endereço como **Site URL** e autorize os retornos `/auth/confirm`, `/auth/callback` e `/account/password` desse domínio. Não use permissões amplas para domínios desconhecidos.
7. Em Authentication, desabilite cadastro público e acesso anônimo; o acesso será por convite. Configure senha mínima de 12 caracteres e SMTP próprio. Proteja também as contas administrativas da infraestrutura com autenticação em duas etapas. [Checklist Supabase](https://supabase.com/docs/guides/deployment/going-into-prod).
8. Em **Authentication → Email Templates**, ajuste os links abaixo, preservando as variáveis entre chaves:

Convite:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite">Ativar meu acesso</a>
```

Recuperação de senha:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Definir nova senha</a>
```

Esse retorno confirma o token no servidor e encaminha a pessoa para criar a própria senha. Não distribua as senhas da demonstração. [Templates de e-mail](https://supabase.com/docs/guides/auth/auth-email-templates).

## 5. Ative os membros

Você pode entregar a planilha de e-mails preenchida para que a etapa técnica seja executada junto com você. Os comandos preparados são:

1. Em um computador protegido, disponibilize `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `SITE_URL` como variáveis de ambiente. O exemplo está em `.env.admin.example`; não salve chaves em pastas compartilhadas. Se utilizar arquivo local, o script reconhece `.env.admin.local`, que não deve ser enviado ao GitHub.
2. Na pasta do projeto, valide a planilha, sem enviar convites:

```powershell
npm run setup:team -- --file config/team-emails.csv
```

3. Confira os cadastros e, quando estiverem corretos, envie os convites:

```powershell
npm run setup:team -- --file config/team-emails.csv --apply
```

4. Cada pessoa abre o próprio e-mail e define sua senha. O script vincula o UUID da conta ao membro correspondente. Ele não aceita cargo vindo da planilha nem troca silenciosamente um membro já vinculado a outro e-mail.
5. Se um convite for criado e o vínculo falhar, pare e confira Authentication e `agency_members` antes de repetir. Não crie contas duplicadas. A conta sem vínculo permanece sem acesso aos dados.

## 6. Faça o teste de aceitação com a agência

Use dados fictícios de teste apenas na homologação. Verifique:

1. Entrar como dono, gerente, filmmaker, modelo e interno; conferir a matriz de módulos enviada.
2. Cadastrar um restaurante em um computador e encontrá-lo em outro. Usuários sem acesso comercial não devem receber valores e contratos na resposta do servidor.
3. Editar o mesmo registro em dois computadores. A segunda gravação com versão antiga deve ser recusada, com rascunho disponível para download.
4. Desconectar a internet durante um cadastro. O sistema deve indicar que ainda falta confirmação, preservar o rascunho e permitir repetir a operação sem duplicar registros.
5. Testar convite, definição de senha, recuperação, saída e revogação de um membro. O seletor de pessoa usado na demonstração fica bloqueado em produção.
6. Criar gravação, atribuir dupla e verificar que o banco recusa conflitos de horário. Um filmmaker atribuído pode preencher o relatório, mas não mudar arbitrariamente a escala.
7. Testar entregáveis e aprovação. A equipe operacional não pode se atribuir aprovação de gestão.
8. Testar fotos e GPS reais, com permissão do usuário. A foto tem limite de 1 MB. Para ponto externo, cadastre as coordenadas reais do restaurante; sem elas a validação será recusada. O horário e a distância são calculados no servidor/banco. GPS enviado pelo dispositivo não é prova antifraude absoluta.
9. No ponto interno, a localização fica marcada como manual: não há uma geocerca da sede cadastrada nesta entrega. Configure e valide essa regra antes de utilizá-la para controle formal de jornada.
10. Na área de dados, consultar a auditoria e identificar ação, registro, usuário e horário.

A integração com Instagram está explicitamente desativada e responde como não configurada. Ela precisa de uma implantação própria com as contas e autorizações reais da Meta. O sistema não simula sucesso dessa integração.

## 7. Ative backups e recuperação antes da produção

1. Ative e confira backups do banco no provedor; defina a retenção e, se necessário, recuperação por instante (PITR). Projetos gratuitos não devem ser tratados como infraestrutura com a mesma garantia operacional dos planos com backups adequados. [Backups Supabase](https://supabase.com/docs/guides/platform/backups).
2. Proteja separadamente os objetos do Storage. O backup de banco do Supabase não inclui os arquivos enviados ao Storage. Links de Google Drive também não copiam os vídeos: a agência precisa manter seu próprio controle e backup desses arquivos.
3. Gere uma chave aleatória de backup de 32 bytes em Base64 e guarde-a no gerenciador de senhas, separada das cópias. Sem essa chave, a cópia criptografada não pode ser recuperada.
4. Configure `BACKUP_ENCRYPTION_KEY` e execute a cópia complementar:

```powershell
npm run backup -- --out C:\BackupsNavegando
```

5. Verifique um arquivo gerado:

```powershell
npm run backup:verify -- C:\BackupsNavegando\ARQUIVO.backup
```

O pacote criptografado inclui membros, registros, auditoria, recibos de operações e fotos privadas, com verificação de integridade. Ele **não inclui senhas do Auth nem configuração do provedor**. Como lê páginas pela API, não é um snapshot transacional; é complementar ao backup do provedor.

6. O workflow GitHub `Encrypted operational backup` está preparado para disparo manual. Crie o ambiente protegido `production-backup` e seus secrets `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `BACKUP_ENCRYPTION_KEY`. Rode e confira o primeiro arquivo antes de habilitar qualquer agendamento. O arquivo de workflow guarda o artefato criptografado por 14 dias; ajuste a retenção e mantenha outra cópia fora dessa conta.
7. Antes da liberação, restaure uma cópia do provedor em um projeto separado e valide também a recuperação das fotos. Confira vínculos dos usuários, permissões, clientes, agenda, entregas e histórico. Não restaure diretamente sobre a produção ativa nem copie apenas o JSON da interface imaginando que isso recupera tudo.
8. Registre responsáveis, data do ensaio, tempo de recuperação e quantidade de dados que a empresa aceita eventualmente refazer. O ensaio local com PostgreSQL foi realizado; o ensaio no Supabase real ainda depende da infraestrutura e permanece obrigatório.

## 8. Monitore e publique a produção

1. Monitore `https://SEU-DOMINIO/api/health`. Em produção, o retorno esperado é HTTP 200, `status: ok` e `databaseVerified: true`; erro de configuração ou de conexão retorna HTTP 503. A verificação não substitui testes de login e arquivos.
2. Ative alertas de indisponibilidade e erros da hospedagem para pelo menos dois responsáveis. O código gera eventos de falha sem registrar senhas ou o conteúdo das requisições. Uma plataforma externa de alertas ainda precisa ser conectada.
3. Exija aprovação das verificações do GitHub antes de publicar: TypeScript, lint, testes, auditoria de dependências de produção e compilação.
4. Depois da homologação e do teste de recuperação, repita a instalação em um projeto de produção separado. Vincule os e-mails reais e cadastre/importe os clientes fornecidos pela agência. Não copie as atividades fictícias de homologação.
5. Confirme as variáveis da Vercel de produção, os links de e-mail, os backups, os alertas e o domínio definitivo. Proteja o projeto de homologação para não receber dados reais sem necessidade.
6. Faça um piloto com poucas pessoas, acompanhe os registros e só então libere a equipe inteira. Mantenha o procedimento de voltar ao deploy anterior; alterações futuras no banco devem ser compatíveis com essa volta.

## O que você pode me entregar a seguir

- A planilha dos 20 e-mails preenchida.
- A confirmação de que as contas empresariais foram criadas e o projeto Supabase/hospedagem escolhido.
- O endereço HTTPS da homologação.
- Os clientes reais, quando estiverem prontos.

As chaves serão configuradas por conexão autorizada ou diretamente no ambiente protegido. A partir disso, ainda será necessário concluir a conexão real, os testes em dois computadores e a validação de recuperação para liberar o sistema.
