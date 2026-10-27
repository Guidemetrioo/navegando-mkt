# Navegando CRM

Base preparada para uma única agência com os 20 membros da hierarquia oficial.

- `docs/IMPLANTACAO.md`: contas, banco, hospedagem, equipe, backups e critérios de liberação.
- `docs/ESTADO-DA-ENTREGA.md`: implementado, validado localmente e pendências reais.
- `config/team-emails.example.csv`: preencher os e-mails antes de convidar a equipe.
- `supabase/migrations/`: aplicar os cinco arquivos em ordem, sem executar o seed demonstrativo.

Use Node 24 e execute `npm ci`, `npm run check`, `npm run lint`, `npm test` e `npm run build`.
O modo de produção é o padrão e bloqueia o acesso quando falta infraestrutura.
Para explorar a demonstração local, configure `NEXT_PUBLIC_APP_MODE=demo` em `.env.local` e use `npm run dev`.
Nenhuma senha de demonstração é aceita em produção.
