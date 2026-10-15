# Navegando MKT • CRM, Agenda da Equipe & Social Media Intelligence

Sistema integrado de agenda, escala operacional e inteligência de redes sociais da agência de marketing para restaurantes **Navegando MKT** (Reels, fotografia gastronômica, social media).

Desenvolvido para dar máxima clareza sobre quem grava, onde e para qual cliente, em cada dia — integrando a agenda de produção com métricas de Reels do Instagram e monitoramento de marcações/UGC em tempo real.

---

## 🛠 Stack Tecnológica

- **Framework:** Next.js (App Router) + React 19 + TypeScript
- **Estilização:** Tailwind CSS (tema Dark/Light, Bricolage Grotesque para títulos e Instrument Sans para textos)
- **Cores da Marca:** Tomate (`#D93A22` no claro, `#FF5A3C` no escuro) e base em grafite/preto
- **Banco de Dados & Auth:** Supabase (PostgreSQL + RLS + RPC de verificação de conflitos de horários)
- **Redes Sociais:** Meta / Instagram Graph API (Reels Insights + Webhook de marcações e mentions)
- **Padrão de Fuso:** Idioma `pt-BR`, semana iniciando na segunda-feira, datas e horários armazenados puros (`DATE` e `TIME`) para eliminação de deslocamentos de fuso.

---

## 🚀 Como Rodar o Projeto Localmente

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.local.example` para `.env.local`:

```bash
cp .env.local.example .env.local
```

Preencha com as credenciais do seu projeto Supabase e Meta:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Meta / Instagram Graph API
INSTAGRAM_VERIFY_TOKEN=navegando_mkt_webhook_secret
INSTAGRAM_APP_ID=seu-app-id
INSTAGRAM_APP_SECRET=seu-app-secret
```

> **Dica:** O sistema possui suporte a modo de demonstração interativo com seed em memória caso as variáveis ainda não tenham sido configuradas.

### 3. Executar as Migrations e Seed no Supabase

1. Acesse o **SQL Editor** no painel do seu projeto no Supabase.
2. Execute `supabase/migrations/001_initial_schema.sql` (estrutura da agenda, 10 funcionários base, enums, RLS).
3. Execute `supabase/migrations/002_instagram_metrics_and_mentions.sql` (tabelas de contas sociais, métricas de Reels e menções/UGC).
4. Execute `supabase/seed.sql` (cadastra funcionários com os hues exatos da paleta, restaurantes clientes e agenda inicial).

### 4. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 📱 Telas e Recursos Implementados

### 📅 Agenda & Escala Operacional
1. **Mês:** Grade de 7 colunas (Seg a Dom). No desktop exibe até 3 eventos por dia com cliente, horário e bolinhas com os números dos funcionários atribuídos (+N mais). No mobile, pontos coloridos por tipo de trabalho, com toque abrindo o detalhe do dia.
2. **Semana:** Cartões completos organizados em 7 colunas (empilhadas no mobile), exibindo horário, tipo, cliente, local, equipe escalada e botão rápido `+ Adicionar`.
3. **Escala da equipe:** Matriz com funcionários nas linhas e dias da semana nas colunas. Coluna do funcionário fixa no scroll horizontal (`sticky`). Células vazias mostram `"Livre"` com textura listrada. Coluna final com total de gravações na semana.
4. **Detalhe do dia (modal):** Lista os eventos do dia e exibe dinamicamente `"Livres neste dia: Funcionário X, Y..."` com botão `Nova gravação neste dia`.
5. **Formulário de Evento:** Cliente com autocomplete em tempo real e cadastro inline de novos restaurantes, data, início, fim, tipo, local, seleção múltipla de funcionários via chips coloridos e notas de produção.
6. **Detector de Conflitos de Horário:** Alerta imediato no cliente e bloqueio no servidor caso qualquer funcionário já possua outro compromisso no mesmo intervalo de horário, com botão para `"Salvar mesmo assim"`.
7. **Minha Agenda (Papel Funcionário):** Feed cronológico diário pensado especialmente para o celular da equipe na rua, com link de rota para Google Maps / Waze.
8. **Filtros e Legenda:** Multi-seleção de funcionários por chips coloridos em todas as telas e legenda dos 4 tipos: Gravação (tomate), Foto (azul), Edição (roxo) e Reunião (cinza).

### 📊 Instagram & Inteligência de Social Media
9. **Métricas dos Reels (`/` na aba *Métricas Reels*):**
   - KPIs de visualizações totais, contas alcançadas, salvamentos e taxa de engajamento médio.
   - Vínculo inteligente entre a gravação na agenda e o resultado do Reel publicado.
   - Grade visual de Reels com thumbnails dos pratos, contadores de reproduções e link direto.
   - Filtro individual por restaurante cliente.
10. **Mural de UGC & Marcações (`/` na aba *Mural UGC / Menções*):**
    - Monitoramento de fotos, vídeos e Stories onde os clientes marcaram os restaurantes.
    - **Radar de Influenciadores:** Detecta criadores com +10k seguidores que visitaram a casa espontaneamente.
    - **Ação de Repost:** Botão com um clique para a equipe de social media marcar como repostado nos Stories do cliente.
    - **Simulador de Webhook:** Botão interativo para testar o recebimento em tempo real de novos Stories ou marcações.

---

## 🔗 Endpoints de Integração Meta / Instagram

- `GET /api/instagram/webhook`: Validação do Webhook da Meta (`hub.challenge`).
- `POST /api/instagram/webhook`: Ingestão de eventos em tempo real (novas menções e marcações de clientes).
- `POST /api/instagram/sync`: Sincronização de mídia e insights via Instagram Graph API.
