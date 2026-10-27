# Estado da base central — 22/10/2026

## Implementado no código

- Modos explícitos de demonstração e produção; produção bloqueia acesso sem configuração.
- Cadastro inicial dos 20 membros oficiais, sem clientes nem atividades fictícias na base central.
- Login por Supabase Auth, definição/recuperação de senha e conferência da conta no servidor.
- Permissões por cargo aplicadas na interface, nas rotas e nas funções transacionais do PostgreSQL. Cargos não identificados não recebem acesso.
- Contratos e dados comerciais de clientes omitidos das respostas para equipe sem acesso a esse módulo.
- Persistência central dos clientes, agenda, relatórios, pontos, entregáveis, métricas cadastradas e menções cadastradas.
- Revisões por registro, rejeição de conflitos, transações de lote, recibos de requisição para evitar duplicação e histórico de alterações.
- Fotos privadas, endereços temporários, horário do servidor e cálculo de distância no banco para ponto externo.
- Estado explícito de confirmação, rascunhos recuperáveis por download, repetição de requisições e consulta periódica de alterações.
- Salvamento local da demonstração sem truncar listas/fotos quando falta espaço e sem sobrescrever dados antes de concluir a leitura inicial.
- Cópia criptografada complementar de dados e evidências, com teste de integridade. Workflow manual preparado; nenhuma automação externa foi ativada.
- Atualização corretiva do Next.js para 16.4.2, headers de proteção, rota de disponibilidade e configuração de verificações no GitHub.

## Verificado localmente

- Migrações executadas em PostgreSQL local via PGlite, com simulação das identidades e do esquema do Supabase.
- Testes de acesso anônimo, promoção indevida de cargo, isolamento dos pontos, restrição de contratos, relatórios do filmmaker, concorrência, transações e repetição de requisições.
- Exportação/restauração de snapshot do banco local, preservando registros e regras de acesso.
- Criptografia, recuperação binária e rejeição de backup alterado ou chave incorreta.
- Testes do cálculo de alterações e da preservação de edições feitas durante uma requisição.

Consulte o relatório de verificação entregue para o resultado final de lint, TypeScript, compilação e auditoria das dependências. PGlite não reproduz o serviço Auth, o serviço Storage, a rede e a hospedagem do Supabase; esses itens precisam ser validados na homologação real.

## Ainda depende da infraestrutura e da agência

- Criar os projetos empresariais, contratar/configurar os serviços adequados e cadastrar o domínio.
- Configurar SMTP, ativar os membros por e-mail e testar convite/recuperação de senha com o serviço real.
- Aplicar as migrações no Supabase, validar cookies, arquivos privados e sincronização em dois dispositivos reais.
- Ativar backups transacionais, retenção, alertas e agendamento da cópia independente; realizar o ensaio de recuperação na nuvem.
- Fornecer e cadastrar os clientes reais.
- Definir a geocerca da sede, eventuais exceções de jornada e validação pelo responsável por pessoal. O módulo de presença não é declarado como sistema de ponto certificado.
- Configurar a integração Meta/Instagram. As rotas antigas sem autenticação e assinatura deixaram de simular uma integração pronta.

## Limites desta etapa

- Esta é uma preparação técnica para uma única agência. Não é uma certificação de segurança, disponibilidade ou conformidade trabalhista.
- Dados são consultados por snapshots com atualização periódica. A sincronização não é instantânea e não usa assinatura Realtime. Antes de crescer significativamente o histórico, medir o volume e implementar paginação de relatórios/histórico conforme o uso real.
- Rascunhos podem conter dados internos e ficam temporariamente no navegador do usuário que editou. Use computadores protegidos; em conflito ou após expiração da sessão, a recuperação é por download e revisão, sem importação automática sobre a base central.
- Pontos são imutáveis e não podem ser excluídos pela interface. Fluxos de retificação e justificativa precisam ser definidos com a agência antes do uso formal.
- Campos de escala não podem ser sobrescritos por filmmakers; aprovação/publicação exige gestão. Exclusões com histórico relacionado são recusadas.
- O backup complementar pela API não é atomicamente consistente sob gravações simultâneas. Backups transacionais do provedor e recuperação dos arquivos são necessários.
- O backup complementar não restaura credenciais do Auth ou configurações do provedor; recuperação real deve seguir o procedimento validado em homologação.
- A auditoria npm de ferramentas de desenvolvimento ainda pode apontar avisos na cadeia do ESLint; isso não foi resolvido com downgrade incompatível ou atualização forçada. A auditoria de dependências de produção é verificada separadamente.

**Situação de liberação: não liberar como única base operacional antes de concluir os testes de homologação e recuperação descritos no guia.**
