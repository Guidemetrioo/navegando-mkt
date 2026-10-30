-- APENAS PARA UM PROJETO NOVO E VAZIO. Em uma base existente aplique somente migrações pendentes.


-- 001_initial_schema.sql
-- ==============================================================================
-- NAVEGANDO MKT - CRM & AGENDA DA EQUIPE
-- Migration: 001_initial_schema.sql
-- ==============================================================================

-- 1. ENUMS
CREATE TYPE event_tipo AS ENUM ('gravacao', 'foto', 'edicao', 'reuniao');
CREATE TYPE event_status AS ENUM ('agendado', 'realizado', 'cancelado');
CREATE TYPE user_role AS ENUM ('admin', 'funcionario');

-- 2. TABELA: employees (10 funcionários base com cores em HSL Hue)
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cor INTEGER NOT NULL, -- HSL Hue (ex: 8, 32, 48, 95, 150, 178, 205, 238, 275, 320)
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA: clients (restaurantes e parceiros da Navegando MKT)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  contato TEXT,
  endereco TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABELA: events (data e hora salvas sem deslocamento de timezone)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  tipo event_tipo NOT NULL DEFAULT 'gravacao',
  data DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  local TEXT,
  observacoes TEXT,
  status event_status NOT NULL DEFAULT 'agendado',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT check_horario CHECK (hora_fim > hora_inicio)
);

-- 5. TABELA: event_assignments (relação N:N entre eventos e funcionários)
CREATE TABLE IF NOT EXISTS event_assignments (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, employee_id)
);

-- 6. TABELA: profiles (vinculada aos usuários do Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  papel user_role NOT NULL DEFAULT 'funcionario',
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_events_data ON events (data);
CREATE INDEX IF NOT EXISTS idx_events_client ON events (client_id);
CREATE INDEX IF NOT EXISTS idx_event_assignments_employee ON event_assignments (employee_id);

-- 8. TRIGGER: Criação automática de profile ao cadastrar usuário no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, papel)
  VALUES (new.id, 'funcionario');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. FUNÇÃO RPC: Verificação no servidor de Conflito de Horário
CREATE OR REPLACE FUNCTION check_event_conflicts(
  p_date DATE,
  p_start TIME,
  p_end TIME,
  p_employee_ids UUID[],
  p_exclude_event_id UUID DEFAULT NULL
)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  event_id UUID,
  client_name TEXT,
  hora_inicio TIME,
  hora_fim TIME,
  local TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    emp.id,
    emp.nome,
    e.id,
    c.nome,
    e.hora_inicio,
    e.hora_fim,
    e.local
  FROM events e
  JOIN event_assignments ea ON ea.event_id = e.id
  JOIN employees emp ON emp.id = ea.employee_id
  JOIN clients c ON c.id = e.client_id
  WHERE e.data = p_date
    AND e.status != 'cancelado'
    AND (p_exclude_event_id IS NULL OR e.id != p_exclude_event_id)
    AND ea.employee_id = ANY(p_employee_ids)
    AND (e.hora_inicio < p_end AND e.hora_fim > p_start);
END;
$$;

-- 10. ROW LEVEL SECURITY (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura (Qualquer usuário logado pode ler a escala geral)
CREATE POLICY "Leitura autenticados employees" ON employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticados clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticados events" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticados assignments" ON event_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura proprio perfil" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- Políticas de Mutação (Apenas Admin cria, atualiza e remove)
CREATE POLICY "Admin total employees" ON employees FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND papel = 'admin'));

CREATE POLICY "Admin total clients" ON clients FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND papel = 'admin'));

CREATE POLICY "Admin total events" ON events FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND papel = 'admin'));

CREATE POLICY "Admin total event_assignments" ON event_assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND papel = 'admin'));

CREATE POLICY "Admin total profiles" ON profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND papel = 'admin'));


-- 002_instagram_metrics_and_mentions.sql
-- ==============================================================================
-- NAVEGANDO MKT - CRM: INSTAGRAM GRAPH API, MÉTRICAS DE REELS E MURAL DE UGC
-- Migration: 002_instagram_metrics_and_mentions.sql
-- ==============================================================================

-- 1. TABELA: Contas Sociais Conectadas por Restaurante
CREATE TABLE IF NOT EXISTS client_social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  instagram_business_id TEXT NOT NULL,
  instagram_handle TEXT NOT NULL, -- ex: @cantinabellamassa
  profile_picture_url TEXT,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  followers_count INTEGER DEFAULT 0,
  follows_count INTEGER DEFAULT 0,
  media_count INTEGER DEFAULT 0,
  connected_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_client_instagram UNIQUE (client_id, instagram_business_id)
);

-- 2. TABELA: Métricas de Reels e Vídeos Gastronômicos
CREATE TABLE IF NOT EXISTS reel_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL, -- Vínculo opcional com a gravação da agenda!
  instagram_media_id TEXT NOT NULL UNIQUE,
  permalink TEXT NOT NULL,
  media_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  media_type TEXT DEFAULT 'VIDEO', -- 'VIDEO', 'REELS'
  published_at TIMESTAMPTZ NOT NULL,
  plays INTEGER DEFAULT 0, -- Visualizações do Reel
  reach INTEGER DEFAULT 0, -- Contas únicas alcançadas
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saved INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0.00,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA: Mural de UGC (Marcações em fotos/Reels e menções em Stories)
CREATE TYPE mention_type AS ENUM ('POST_TAG', 'STORY_MENTION', 'CAPTION_MENTION', 'COMMENT_MENTION');
CREATE TYPE mention_sentiment AS ENUM ('positivo', 'neutro', 'destaque_gourmet');

CREATE TABLE IF NOT EXISTS client_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  author_username TEXT NOT NULL, -- ex: @gabrielafoodie
  author_name TEXT,
  author_followers INTEGER DEFAULT 0,
  is_influencer BOOLEAN DEFAULT false, -- True se tiver > 10k seguidores
  mention_type mention_type NOT NULL DEFAULT 'POST_TAG',
  media_url TEXT,
  permalink TEXT,
  caption TEXT,
  sentiment mention_sentiment DEFAULT 'positivo',
  reposted BOOLEAN NOT NULL DEFAULT false, -- Se a equipe da agência já repostou nos Stories
  reposted_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_reels_client ON reel_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_reels_event ON reel_metrics(event_id);
CREATE INDEX IF NOT EXISTS idx_reels_published ON reel_metrics(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentions_client ON client_mentions(client_id);
CREATE INDEX IF NOT EXISTS idx_mentions_reposted ON client_mentions(reposted);
CREATE INDEX IF NOT EXISTS idx_mentions_posted ON client_mentions(posted_at DESC);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE client_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura autenticados social" ON client_social_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticados reels" ON reel_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticados mentions" ON client_mentions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gerencia social" ON client_social_accounts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND papel = 'admin'));

CREATE POLICY "Admin gerencia reels" ON reel_metrics FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND papel = 'admin'));

CREATE POLICY "Admin gerencia mentions" ON client_mentions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND papel = 'admin'));


-- 003_ponto_eletronico_geolocalizacao.sql
-- ==============================================================================
-- NAVEGANDO MKT - PONTO ELETRÔNICO COM FOTO E GEOLOCALIZAÇÃO (GPS)
-- Migration: 003_ponto_eletronico_geolocalizacao.sql
-- ==============================================================================

-- 1. ENUMS PARA PONTO
DO $$ BEGIN
  CREATE TYPE ponto_tipo AS ENUM ('entrada', 'saida');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ponto_status AS ENUM ('no_local', 'fora_do_raio', 'manual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. ADICIONAR COORDENADAS GEOGRÁFICAS NA TABELA CLIENTS (SE NÃO EXISTIREM)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

-- 3. ADICIONAR CARGO NA TABELA EMPLOYEES
ALTER TABLE employees ADD COLUMN IF NOT EXISTS funcao TEXT DEFAULT 'filmmaker';

-- 4. TABELA: ponto_registros
CREATE TABLE IF NOT EXISTS ponto_registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  tipo ponto_tipo NOT NULL DEFAULT 'entrada',
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  foto_url TEXT NOT NULL, -- URL do Supabase Storage ou Base64 data URL
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  precisao_metros NUMERIC(8, 2) NOT NULL DEFAULT 10,
  distancia_metros NUMERIC(10, 2), -- Distância calculada até o restaurante
  status_localizacao ponto_status NOT NULL DEFAULT 'no_local',
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_ponto_employee ON ponto_registros(employee_id);
CREATE INDEX IF NOT EXISTS idx_ponto_client ON ponto_registros(client_id);
CREATE INDEX IF NOT EXISTS idx_ponto_data_hora ON ponto_registros(data_hora DESC);

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE ponto_registros ENABLE ROW LEVEL SECURITY;

-- Qualquer membro autenticado pode registrar seu ponto
CREATE POLICY "Membros podem registrar ponto"
  ON ponto_registros FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Todos podem visualizar os pontos da equipe (ou Admin vê todos)
CREATE POLICY "Membros podem ler registros de ponto"
  ON ponto_registros FOR SELECT
  TO authenticated
  USING (true);


-- 004_agency_workspace.sql
-- Apply after 001, 002 and 003. No customers or demonstration activity are seeded.
begin;
create table public.agency_members (
  employee_id text primary key,
  user_id uuid unique references auth.users(id) on delete set null,
  role text not null check (role in ('dono','gerente','filmmaker','modelo','interno')),
  employee jsonb not null check (jsonb_typeof(employee) = 'object'),
  active boolean not null default true
);
create table public.agency_records (
  kind text not null check (kind in ('clients','events','pontos','deliverables','reels','mentions')),
  id text not null,
  data jsonb not null check (jsonb_typeof(data) = 'object' and data->>'id' = id),
  revision bigint not null default 1 check (revision > 0),
  deleted_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (kind,id)
);
create index agency_records_client on public.agency_records(kind,(data->>'client_id')) where deleted_at is null;
create index agency_records_employee on public.agency_records(kind,(data->>'employee_id')) where deleted_at is null;
create table public.agency_audit (
  seq bigint generated always as identity primary key,
  actor uuid not null,
  kind text not null,
  record_id text not null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  happened_at timestamptz not null default now()
);
create table public.agency_requests (
  actor uuid not null,
  request_id uuid not null,
  payload_hash text not null,
  created_at timestamptz not null default now(),
  primary key(actor,request_id)
);
alter table public.agency_members enable row level security;
alter table public.agency_records enable row level security;
alter table public.agency_audit enable row level security;
alter table public.agency_requests enable row level security;
-- Browser roles have no direct table access. Checked RPCs below are the only interface.
revoke all on public.agency_members, public.agency_records, public.agency_audit, public.agency_requests from anon, authenticated;
grant all on public.agency_members, public.agency_records, public.agency_audit, public.agency_requests to service_role;
grant usage,select on sequence public.agency_audit_seq_seq to service_role;
-- Retire the permissive demonstration schema from the browser API.
revoke all on public.employees, public.clients, public.events, public.event_assignments, public.profiles,
  public.client_social_accounts, public.reel_metrics, public.client_mentions, public.ponto_registros from anon, authenticated;
revoke all on function public.check_event_conflicts(date,time,time,uuid[],uuid) from public,anon,authenticated;
drop trigger if exists on_auth_user_created on auth.users;
revoke all on function public.handle_new_user() from public,anon,authenticated;

create or replace function public.agency_snapshot() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.agency_members; rows jsonb;
begin
  select * into m from public.agency_members where user_id = auth.uid() and active;
  if m.employee_id is null then raise exception 'Conta não vinculada à equipe.' using errcode = '42501'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('kind',r.kind,'id',r.id,'revision',r.revision,'data',
    case when r.kind='clients' and m.role not in ('dono','gerente') then
      jsonb_strip_nulls(jsonb_build_object('id',r.id,'nome',r.data->'nome','endereco',r.data->'endereco',
        'latitude',r.data->'latitude','longitude',r.data->'longitude','drive_folder_url',r.data->'drive_folder_url','cardapio_link',r.data->'cardapio_link'))
    when r.kind='events' and m.role in ('modelo','interno') then r.data - 'relatorio_filmmaker'
    else r.data end) order by r.kind,r.id),'[]'::jsonb) into rows
  from public.agency_records r where r.deleted_at is null and (
    m.role in ('dono','gerente') or r.kind in ('clients','events')
    or (r.kind='pontos' and r.data->>'employee_id'=m.employee_id)
    or (r.kind='deliverables' and (m.role='interno' or (m.role='filmmaker' and r.data->>'filmmaker_id'=m.employee_id)))
    or (r.kind='reels' and m.role='filmmaker' and exists (select 1 from public.agency_records e where e.kind='events' and e.id=r.data->>'event_id' and e.deleted_at is null and coalesce(e.data->'assigned_employee_ids','[]'::jsonb) ? m.employee_id))
  );
  return jsonb_build_object('member',jsonb_build_object('employee_id',m.employee_id,'role',m.role,'user_id',auth.uid()),
    'records', rows || (select coalesce(jsonb_agg(jsonb_build_object('kind','employees','id',employee_id,'revision',1,'data',employee)),'[]'::jsonb) from public.agency_members where active));
end $$;

create or replace function public.agency_commit(p_changes jsonb,p_request uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.agency_members; c jsonb; d jsonb; old public.agency_records; k text; rid text; admin boolean;
  expected bigint; fingerprint text; prior text; v_client jsonb; distance_m double precision; local_day date;
begin
  select * into m from public.agency_members where user_id=auth.uid() and active;
  if m.employee_id is null then raise exception 'Sem acesso.' using errcode='42501'; end if;
  admin := m.role in ('dono','gerente');
  if jsonb_typeof(p_changes)<>'array' or jsonb_array_length(p_changes) not between 1 and 100 or p_request is null then raise exception 'Lote inválido.'; end if;
  -- Serialize commits for this single agency: validation, revisions and audit are one transaction.
  perform pg_advisory_xact_lock(717001);
  fingerprint:=md5(p_changes::text);
  select payload_hash into prior from public.agency_requests where actor=auth.uid() and request_id=p_request;
  if prior is not null then
    if prior<>fingerprint then raise exception 'Identificador reutilizado com outro conteúdo.' using errcode='22023'; end if;
    return public.agency_snapshot();
  end if;
  if exists(select 1 from jsonb_array_elements(p_changes) x group by x->>'kind',x->>'id' having count(*)>1) then raise exception 'Registro repetido no lote.'; end if;
  for c in select value from jsonb_array_elements(p_changes) loop
    k:=c->>'kind'; rid:=c->>'id'; d:=nullif(c->'data','null'::jsonb); expected:=(c->>'expected')::bigint;
    if k not in ('clients','events','pontos','deliverables','reels','mentions') or rid !~ '^[a-zA-Z0-9_-]{1,100}$' or expected is null or expected<0 then raise exception 'Registro inválido.'; end if;
    select * into old from public.agency_records where kind=k and id=rid;
    if coalesce(old.revision,0)<>expected or old.deleted_at is not null then raise exception 'Registro alterado por outra pessoa. Recarregue antes de continuar.' using errcode='40001'; end if;
    if d is not null and (jsonb_typeof(d)<>'object' or d->>'id' is distinct from rid or octet_length(d::text)>1600000) then raise exception 'Conteúdo inválido.'; end if;
    if k='clients' then
      if not admin then raise exception 'Somente gestão altera restaurantes.' using errcode='42501'; end if;
      if d is not null and (nullif(btrim(d->>'nome'),'') is null or coalesce((d->>'valor_mensalidade')::numeric,0)<0) then raise exception 'Restaurante inválido.'; end if;
      if d is null and exists(select 1 from public.agency_records r where r.deleted_at is null and r.data->>'client_id'=rid) then raise exception 'Cliente possui histórico. Pause o contrato em vez de excluir.'; end if;
    elsif k='events' then
      if not admin then
        if m.role<>'filmmaker' or old.id is null or d is null or not (coalesce(old.data->'assigned_employee_ids','[]'::jsonb) ? m.employee_id) or (d-'relatorio_filmmaker') is distinct from (old.data-'relatorio_filmmaker') then raise exception 'Sem permissão para alterar a gravação.' using errcode='42501'; end if;
      end if;
      if d is not null then
        if not (d ?& array['data','hora_inicio','hora_fim','tipo','status','assigned_employee_ids','client_id']) or d->>'data' is null or d->>'hora_inicio' is null or d->>'hora_fim' is null or d->>'tipo' is null or d->>'status' is null then raise exception 'Dados obrigatórios da gravação ausentes.'; end if;
        if (d->>'hora_fim')::time <= (d->>'hora_inicio')::time or d->>'tipo' not in ('gravacao','foto','edicao','reuniao') or d->>'status' not in ('agendado','realizado','cancelado') or jsonb_typeof(d->'assigned_employee_ids') is distinct from 'array' then raise exception 'Horário ou tipo de gravação inválido.'; end if;
        perform (d->>'data')::date;
        if exists(select 1 from jsonb_array_elements_text(d->'assigned_employee_ids') a where not exists(select 1 from public.agency_members am where am.employee_id=a and am.active)) then raise exception 'Colaborador inválido na escala.'; end if;
        if d->'relatorio_filmmaker' is distinct from old.data->'relatorio_filmmaker' and d ? 'relatorio_filmmaker' then
          d:=jsonb_set(d,'{relatorio_filmmaker}',(d->'relatorio_filmmaker')||jsonb_build_object('preenchido_por_id',m.employee_id,'preenchido_em',clock_timestamp(),'preenchido',true));
        end if;
        if d->>'status'<>'cancelado' and exists(select 1 from public.agency_records e where e.kind='events' and e.id<>rid and e.deleted_at is null and e.data->>'status'<>'cancelado' and e.data->>'data'=d->>'data' and (e.data->>'hora_inicio')::time<(d->>'hora_fim')::time and (e.data->>'hora_fim')::time>(d->>'hora_inicio')::time and exists(select 1 from jsonb_array_elements_text(d->'assigned_employee_ids') a where coalesce(e.data->'assigned_employee_ids','[]'::jsonb) ? a)) then raise exception 'Conflito de horário na escala.' using errcode='23514'; end if;
      end if;
      if d is null and exists(select 1 from public.agency_records r where r.deleted_at is null and r.data->>'event_id'=rid) then raise exception 'Gravação com histórico deve ser cancelada, não excluída.'; end if;
    elsif k='pontos' then
      if old.id is not null or d is null or d->>'employee_id' is distinct from m.employee_id then raise exception 'O ponto é pessoal e não pode ser reescrito ou excluído.' using errcode='42501'; end if;
      if not(d ?& array['tipo','foto_url','latitude','longitude','precisao_metros']) or d->>'tipo' is null or jsonb_typeof(d->'foto_url') is distinct from 'string' then raise exception 'Evidências de ponto incompletas.'; end if;
      if d->>'tipo' not in ('entrada','almoco','saida') or d->>'foto_url' not like ('private:ponto-evidencias/'||auth.uid()::text||'/%') or jsonb_typeof(d->'latitude') is distinct from 'number' or jsonb_typeof(d->'longitude') is distinct from 'number' or abs((d->>'latitude')::numeric)>90 or abs((d->>'longitude')::numeric)>180 or coalesce((d->>'precisao_metros')::numeric,0)<=0 then raise exception 'Foto e coordenadas válidas são obrigatórias.'; end if;
      if not exists(select 1 from storage.objects where bucket_id='ponto-evidencias' and name=substring(d->>'foto_url' from length('private:ponto-evidencias/')+1)) then raise exception 'A foto precisa estar armazenada antes do ponto.'; end if;
      d:=d||jsonb_build_object('data_hora',clock_timestamp(),'created_at',clock_timestamp(),'status_localizacao','manual');
      if m.employee->>'regime'='interno' then d:=d||jsonb_build_object('client_id',null,'event_id',null); end if;
      local_day:=(clock_timestamp() at time zone 'America/Sao_Paulo')::date;
      if exists(select 1 from public.agency_records p where p.kind='pontos' and p.deleted_at is null and p.data->>'employee_id'=m.employee_id and p.data->>'tipo'=d->>'tipo' and coalesce(p.data->>'client_id','')=coalesce(d->>'client_id','') and ((p.data->>'data_hora')::timestamptz at time zone 'America/Sao_Paulo')::date=local_day) then raise exception 'Este tipo de ponto já foi registrado hoje neste local.' using errcode='23505'; end if;
      if d->>'tipo' in ('almoco','saida') and not exists(select 1 from public.agency_records p where p.kind='pontos' and p.deleted_at is null and p.data->>'employee_id'=m.employee_id and p.data->>'tipo'='entrada' and coalesce(p.data->>'client_id','')=coalesce(d->>'client_id','') and ((p.data->>'data_hora')::timestamptz at time zone 'America/Sao_Paulo')::date=local_day) then raise exception 'Registre a entrada antes de registrar intervalo ou saída.'; end if;
      if m.employee->>'regime'='interno' and d->>'tipo'='saida' and not exists(select 1 from public.agency_records p where p.kind='pontos' and p.deleted_at is null and p.data->>'employee_id'=m.employee_id and p.data->>'tipo'='almoco' and ((p.data->>'data_hora')::timestamptz at time zone 'America/Sao_Paulo')::date=local_day) then raise exception 'Registre o intervalo antes da saída na rotina interna.'; end if;
      if m.employee->>'regime'='externo' and d->>'tipo'='almoco' then raise exception 'A rotina externa utiliza entrada e saída por restaurante.'; end if;
      if m.employee->>'regime'='externo' then
        select data into v_client from public.agency_records where kind='clients' and id=d->>'client_id' and deleted_at is null;
        if v_client is null or v_client->>'latitude' is null or v_client->>'longitude' is null then raise exception 'Cadastre as coordenadas reais do restaurante antes do ponto externo.'; end if;
        distance_m:=6371000*2*asin(least(1.0,sqrt(power(sin(radians(((d->>'latitude')::double precision-(v_client->>'latitude')::double precision)/2)),2)+cos(radians((d->>'latitude')::double precision))*cos(radians((v_client->>'latitude')::double precision))*power(sin(radians(((d->>'longitude')::double precision-(v_client->>'longitude')::double precision)/2)),2))));
        d:=d||jsonb_build_object('distancia_metros',round(distance_m::numeric,2),'status_localizacao',case when distance_m<=300 and (d->>'precisao_metros')::numeric<=100 then 'no_local' else 'fora_do_raio' end);
      end if;
    elsif k='deliverables' then
      if not admin and not (m.role='interno' or (m.role='filmmaker' and coalesce(old.data,d)->>'filmmaker_id'=m.employee_id)) then raise exception 'Sem acesso ao entregável.' using errcode='42501'; end if;
      if not admin and (d is null or d->>'status' in ('aprovado','publicado','ajustes_solicitados') and d->>'status' is distinct from old.data->>'status' or old.id is not null and (d->>'filmmaker_id' is distinct from old.data->>'filmmaker_id' or d->>'client_id' is distinct from old.data->>'client_id')) then raise exception 'Aprovação, exclusão e reatribuição exigem gestão.' using errcode='42501'; end if;
      if d is not null and (nullif(btrim(d->>'titulo'),'') is null or d->>'status' not in ('captado_raw','em_edicao','aguardando_aprovacao','ajustes_solicitados','aprovado','publicado')) then raise exception 'Entregável inválido.'; end if;
      if d is not null and (d->>'status' is null or d->>'formato' is null or d->>'formato' not in ('reels_9_16','feed_post','carrossel','stories','fotos_menu','bruto_raw') or coalesce((d->>'versao')::integer,0)<1 or d->>'data_gravacao' is null) then raise exception 'Formato, versão e data são obrigatórios no entregável.'; end if;
    else
      if not admin then raise exception 'Somente gestão altera métricas e menções.' using errcode='42501'; end if;
    end if;
    if d is not null and k in ('events','deliverables','reels','mentions') and not exists(select 1 from public.agency_records where kind='clients' and id=d->>'client_id' and deleted_at is null) then raise exception 'Restaurante não encontrado.'; end if;
    if d is not null and nullif(d->>'event_id','') is not null and not exists(select 1 from public.agency_records where kind='events' and id=d->>'event_id' and deleted_at is null and data->>'client_id'=d->>'client_id') then raise exception 'Gravação não pertence ao restaurante informado.'; end if;
    insert into public.agency_audit(actor,kind,record_id,action,before_data,after_data)
      values(auth.uid(),k,rid,case when d is null then 'delete' when old.id is null then 'create' else 'update' end,old.data,d);
    if d is null then update public.agency_records set deleted_at=now(),revision=revision+1,updated_at=now() where kind=k and id=rid;
    else insert into public.agency_records(kind,id,data,revision) values(k,rid,d,1)
      on conflict(kind,id) do update set data=excluded.data,revision=agency_records.revision+1,updated_at=now(); end if;
  end loop;
  insert into public.agency_requests(actor,request_id,payload_hash) values(auth.uid(),p_request,fingerprint);
  return public.agency_snapshot();
end $$;
revoke all on function public.agency_snapshot() from public, anon;
revoke all on function public.agency_commit(jsonb,uuid) from public, anon;
grant execute on function public.agency_snapshot(), public.agency_commit(jsonb,uuid) to authenticated;

create function public.agency_health() returns boolean language sql stable set search_path='' as $$ select true; $$;
revoke all on function public.agency_health() from public;
grant execute on function public.agency_health() to anon,authenticated;

create function public.agency_audit_page(p_before bigint default null,p_limit integer default 50) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.agency_members where user_id=auth.uid() and active and role in ('dono','gerente')) then raise exception 'Auditoria exige gestão.' using errcode='42501'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(a) order by a.seq desc),'[]'::jsonb) from
    (select seq,actor,kind,record_id,action,happened_at from public.agency_audit where p_before is null or seq<p_before order by seq desc limit greatest(1,least(p_limit,100))) a);
end $$;
revoke all on function public.agency_audit_page(bigint,integer) from public,anon;
grant execute on function public.agency_audit_page(bigint,integer) to authenticated;

-- Private evidence bucket. URLs are signed by the authenticated route, never public.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
  values('ponto-evidencias','ponto-evidencias',false,1048576,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
-- Helper avoids granting the browser direct access to the roster table.
create function public.agency_evidence_access(owner_folder text) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.agency_members where user_id=auth.uid() and active and (user_id::text=owner_folder or role in ('dono','gerente')));
$$;
create policy "agency_evidence_insert" on storage.objects for insert to authenticated
  with check(bucket_id='ponto-evidencias' and (storage.foldername(name))[1]=auth.uid()::text and public.agency_evidence_access((storage.foldername(name))[1]));
create policy "agency_evidence_read" on storage.objects for select to authenticated
  using(bucket_id='ponto-evidencias' and public.agency_evidence_access((storage.foldername(name))[1]));
revoke all on function public.agency_evidence_access(text) from public,anon;
grant execute on function public.agency_evidence_access(text) to authenticated;
commit;


-- 005_official_roster.sql
-- Official roster only. Auth accounts are linked later using the provisioning script.
begin;
insert into public.agency_members(employee_id,role,employee) values
('usr-felipe','dono','{"id": "usr-felipe", "nome": "Felipe Assis", "username": "felipe", "funcao": "dono", "regime": "interno", "cargo_detalhado": "Dono & Diretor Executivo", "cor": 12, "ativo": true}'::jsonb),
('usr-gabriela','dono','{"id": "usr-gabriela", "nome": "Gabriela Lorente", "username": "gabriela", "funcao": "dono", "regime": "interno", "cargo_detalhado": "Dona & Diretora de Operações", "cor": 340, "ativo": true}'::jsonb),
('usr-alexandre','gerente','{"id": "usr-alexandre", "nome": "Alexandre", "username": "alexandre", "funcao": "gerente", "regime": "interno", "cargo_detalhado": "Gerente Geral & Contas", "cor": 215, "ativo": true}'::jsonb),
('usr-vitinho','gerente','{"id": "usr-vitinho", "nome": "Victor Cordoba", "username": "vitinho", "funcao": "gerente", "regime": "externo", "cargo_detalhado": "Gerente de Produção & Filmmaker Líder", "cor": 205, "ativo": true}'::jsonb),
('usr-matheus-ger','gerente','{"id": "usr-matheus-ger", "nome": "Matheus", "username": "matheus", "funcao": "gerente", "regime": "interno", "cargo_detalhado": "Gerente Operacional", "cor": 155, "ativo": true}'::jsonb),
('usr-larissa','gerente','{"id": "usr-larissa", "nome": "Larissa", "username": "larissa", "funcao": "gerente", "regime": "interno", "cargo_detalhado": "Gerente de Atendimento & Social Media", "cor": 285, "ativo": true}'::jsonb),
('usr-victor','filmmaker','{"id": "usr-victor", "nome": "Victor", "username": "victor", "funcao": "filmmaker", "regime": "externo", "cargo_detalhado": "Filmmaker Gastronômico", "cor": 178, "ativo": true}'::jsonb),
('usr-gimenez','filmmaker','{"id": "usr-gimenez", "nome": "Matheus Gimenez", "username": "gimenez", "funcao": "filmmaker", "regime": "externo", "cargo_detalhado": "Filmmaker Gastronômico", "cor": 148, "ativo": true}'::jsonb),
('usr-henry','filmmaker','{"id": "usr-henry", "nome": "Henry", "username": "henry", "funcao": "filmmaker", "regime": "externo", "cargo_detalhado": "Filmmaker Gastronômico", "cor": 238, "ativo": true}'::jsonb),
('usr-isa','modelo','{"id": "usr-isa", "nome": "Isa", "username": "isa", "funcao": "modelo", "regime": "externo", "cargo_detalhado": "Apresentadora & Modelo Gastronômica", "cor": 275, "ativo": true}'::jsonb),
('usr-gi','modelo','{"id": "usr-gi", "nome": "Gi", "username": "gi", "funcao": "modelo", "regime": "externo", "cargo_detalhado": "Apresentadora & Modelo Gastronômica", "cor": 320, "ativo": true}'::jsonb),
('usr-mi','modelo','{"id": "usr-mi", "nome": "Mi", "username": "mi", "funcao": "modelo", "regime": "externo", "cargo_detalhado": "Apresentadora & Modelo Gastronômica", "cor": 8, "ativo": true}'::jsonb),
('usr-ju','modelo','{"id": "usr-ju", "nome": "Ju", "username": "ju", "funcao": "modelo", "regime": "externo", "cargo_detalhado": "Apresentadora & Modelo Gastronômica", "cor": 38, "ativo": true}'::jsonb),
('usr-carol','interno','{"id": "usr-carol", "nome": "Carol", "username": "carol", "funcao": "interno", "regime": "interno", "cargo_detalhado": "Editora de Vídeo & Pós-Produção", "cor": 310, "ativo": true}'::jsonb),
('usr-bruna','interno','{"id": "usr-bruna", "nome": "Bruna", "username": "bruna", "funcao": "interno", "regime": "interno", "cargo_detalhado": "Social Media & Copywriter", "cor": 25, "ativo": true}'::jsonb),
('usr-lucas','interno','{"id": "usr-lucas", "nome": "Lucas Verraz", "username": "lucas", "funcao": "interno", "regime": "interno", "cargo_detalhado": "Editor de Vídeo & Colorista", "cor": 180, "ativo": true}'::jsonb),
('usr-evelin','interno','{"id": "usr-evelin", "nome": "Evelin", "username": "evelin", "funcao": "interno", "regime": "interno", "cargo_detalhado": "Designer Gráfica & Criativos", "cor": 290, "ativo": true}'::jsonb),
('usr-juliaint','interno','{"id": "usr-juliaint", "nome": "Julia Int", "username": "juliaint", "funcao": "interno", "regime": "interno", "cargo_detalhado": "Gestora de Tráfego & Performance", "cor": 45, "ativo": true}'::jsonb),
('usr-augusto','interno','{"id": "usr-augusto", "nome": "Augusto", "username": "augusto", "funcao": "interno", "regime": "interno", "cargo_detalhado": "Atendimento & Suporte ao Cliente", "cor": 165, "ativo": true}'::jsonb)
on conflict(employee_id) do nothing;
commit;


-- 006_shared_finance.sql
-- Extends the same versioned, audited workspace to reimbursements and finance.
-- Apply after 001-005. Existing records and photographs are preserved.
alter table public.agency_records drop constraint agency_records_kind_check;
alter table public.agency_records add constraint agency_records_kind_check
 check(kind in ('clients','events','pontos','deliverables','reels','mentions','despesas','transacoes','salarios'));

create or replace function public.agency_snapshot() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.agency_members; rows jsonb;
begin
  select * into m from public.agency_members where user_id = auth.uid() and active;
  if m.employee_id is null then raise exception 'Conta não vinculada à equipe.' using errcode = '42501'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('kind',r.kind,'id',r.id,'revision',r.revision,'data',
    case when r.kind='clients' and m.role not in ('dono','gerente') then
      jsonb_strip_nulls(jsonb_build_object('id',r.id,'nome',r.data->'nome','endereco',r.data->'endereco',
        'latitude',r.data->'latitude','longitude',r.data->'longitude','drive_folder_url',r.data->'drive_folder_url','cardapio_link',r.data->'cardapio_link'))
    when r.kind='events' and m.role in ('modelo','interno') then r.data - 'relatorio_filmmaker' - 'despesas'
    when r.kind='events' and m.role='filmmaker' then r.data - 'despesas'
    else r.data end) order by r.kind,r.id),'[]'::jsonb) into rows
  from public.agency_records r where r.deleted_at is null and (
    m.role in ('dono','gerente') or r.kind in ('clients','events')
    or (r.kind in ('pontos','despesas','transacoes') and r.data->>'employee_id'=m.employee_id)
    or (r.kind='deliverables' and (m.role='interno' or (m.role='filmmaker' and r.data->>'filmmaker_id'=m.employee_id)))
    or (r.kind='reels' and m.role='filmmaker' and exists (select 1 from public.agency_records e where e.kind='events' and e.id=r.data->>'event_id' and e.deleted_at is null and coalesce(e.data->'assigned_employee_ids','[]'::jsonb) ? m.employee_id))
  );
  return jsonb_build_object('member',jsonb_build_object('employee_id',m.employee_id,'role',m.role,'user_id',auth.uid()),
    'records', rows || (select coalesce(jsonb_agg(jsonb_build_object('kind','employees','id',employee_id,'revision',1,'data',employee)),'[]'::jsonb) from public.agency_members where active));
end $$;

create or replace function public.agency_commit(p_changes jsonb,p_request uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.agency_members; c jsonb; d jsonb; old public.agency_records; k text; rid text; admin boolean;
  expected bigint; fingerprint text; prior text; v_client jsonb; distance_m double precision; local_day date;
begin
  select * into m from public.agency_members where user_id=auth.uid() and active;
  if m.employee_id is null then raise exception 'Sem acesso.' using errcode='42501'; end if;
  admin := m.role in ('dono','gerente');
  if jsonb_typeof(p_changes)<>'array' or jsonb_array_length(p_changes) not between 1 and 100 or p_request is null then raise exception 'Lote inválido.'; end if;
  -- Serialize commits for this single agency: validation, revisions and audit are one transaction.
  perform pg_advisory_xact_lock(717001);
  fingerprint:=md5(p_changes::text);
  select payload_hash into prior from public.agency_requests where actor=auth.uid() and request_id=p_request;
  if prior is not null then
    if prior<>fingerprint then raise exception 'Identificador reutilizado com outro conteúdo.' using errcode='22023'; end if;
    return public.agency_snapshot();
  end if;
  if exists(select 1 from jsonb_array_elements(p_changes) x group by x->>'kind',x->>'id' having count(*)>1) then raise exception 'Registro repetido no lote.'; end if;
  for c in select value from jsonb_array_elements(p_changes) loop
    k:=c->>'kind'; rid:=c->>'id'; d:=nullif(c->'data','null'::jsonb); expected:=(c->>'expected')::bigint;
    if k not in ('clients','events','pontos','deliverables','reels','mentions','despesas','transacoes','salarios') or rid !~ '^[a-zA-Z0-9_-]{1,100}$' or expected is null or expected<0 then raise exception 'Registro inválido.'; end if;
    select * into old from public.agency_records where kind=k and id=rid;
    if coalesce(old.revision,0)<>expected or old.deleted_at is not null then raise exception 'Registro alterado por outra pessoa. Recarregue antes de continuar.' using errcode='40001'; end if;
    if d is not null and (jsonb_typeof(d)<>'object' or d->>'id' is distinct from rid or octet_length(d::text)>1600000) then raise exception 'Conteúdo inválido.'; end if;
    if k='clients' then
      if not admin then raise exception 'Somente gestão altera restaurantes.' using errcode='42501'; end if;
      if d is not null and (nullif(btrim(d->>'nome'),'') is null or coalesce((d->>'valor_mensalidade')::numeric,0)<0) then raise exception 'Restaurante inválido.'; end if;
      if d is null and exists(select 1 from public.agency_records r where r.deleted_at is null and r.data->>'client_id'=rid) then raise exception 'Cliente possui histórico. Pause o contrato em vez de excluir.'; end if;
    elsif k='events' then
      if not admin then
        if m.role<>'filmmaker' or old.id is null or d is null or not (coalesce(old.data->'assigned_employee_ids','[]'::jsonb) ? m.employee_id) or (d-'relatorio_filmmaker') is distinct from (old.data-'relatorio_filmmaker') then raise exception 'Sem permissão para alterar a gravação.' using errcode='42501'; end if;
      end if;
      if d is not null then
        if not (d ?& array['data','hora_inicio','hora_fim','tipo','status','assigned_employee_ids','client_id']) or d->>'data' is null or d->>'hora_inicio' is null or d->>'hora_fim' is null or d->>'tipo' is null or d->>'status' is null then raise exception 'Dados obrigatórios da gravação ausentes.'; end if;
        if (d->>'hora_fim')::time <= (d->>'hora_inicio')::time or d->>'tipo' not in ('gravacao','foto','edicao','reuniao') or d->>'status' not in ('agendado','realizado','cancelado') or jsonb_typeof(d->'assigned_employee_ids') is distinct from 'array' then raise exception 'Horário ou tipo de gravação inválido.'; end if;
        perform (d->>'data')::date;
        if exists(select 1 from jsonb_array_elements_text(d->'assigned_employee_ids') a where not exists(select 1 from public.agency_members am where am.employee_id=a and am.active)) then raise exception 'Colaborador inválido na escala.'; end if;
        if d->'relatorio_filmmaker' is distinct from old.data->'relatorio_filmmaker' and d ? 'relatorio_filmmaker' then
          d:=jsonb_set(d,'{relatorio_filmmaker}',(d->'relatorio_filmmaker')||jsonb_build_object('preenchido_por_id',m.employee_id,'preenchido_em',clock_timestamp(),'preenchido',true));
        end if;
        if d->>'status'<>'cancelado' and exists(select 1 from public.agency_records e where e.kind='events' and e.id<>rid and e.deleted_at is null and e.data->>'status'<>'cancelado' and e.data->>'data'=d->>'data' and (e.data->>'hora_inicio')::time<(d->>'hora_fim')::time and (e.data->>'hora_fim')::time>(d->>'hora_inicio')::time and exists(select 1 from jsonb_array_elements_text(d->'assigned_employee_ids') a where coalesce(e.data->'assigned_employee_ids','[]'::jsonb) ? a)) then raise exception 'Conflito de horário na escala.' using errcode='23514'; end if;
      end if;
      if d is null and exists(select 1 from public.agency_records r where r.deleted_at is null and r.data->>'event_id'=rid) then raise exception 'Gravação com histórico deve ser cancelada, não excluída.'; end if;
    elsif k='pontos' then
      if old.id is not null or d is null or d->>'employee_id' is distinct from m.employee_id then raise exception 'O ponto é pessoal e não pode ser reescrito ou excluído.' using errcode='42501'; end if;
      if not(d ?& array['tipo','foto_url','latitude','longitude','precisao_metros']) or d->>'tipo' is null or jsonb_typeof(d->'foto_url') is distinct from 'string' then raise exception 'Evidências de ponto incompletas.'; end if;
      if d->>'tipo' not in ('entrada','almoco','saida') or d->>'foto_url' not like ('private:ponto-evidencias/'||auth.uid()::text||'/%') or jsonb_typeof(d->'latitude') is distinct from 'number' or jsonb_typeof(d->'longitude') is distinct from 'number' or abs((d->>'latitude')::numeric)>90 or abs((d->>'longitude')::numeric)>180 or coalesce((d->>'precisao_metros')::numeric,0)<=0 then raise exception 'Foto e coordenadas válidas são obrigatórias.'; end if;
      if not exists(select 1 from storage.objects where bucket_id='ponto-evidencias' and name=substring(d->>'foto_url' from length('private:ponto-evidencias/')+1)) then raise exception 'A foto precisa estar armazenada antes do ponto.'; end if;
      d:=d||jsonb_build_object('data_hora',clock_timestamp(),'created_at',clock_timestamp(),'status_localizacao','manual');
      if m.employee->>'regime'='interno' then d:=d||jsonb_build_object('client_id',null,'event_id',null); end if;
      local_day:=(clock_timestamp() at time zone 'America/Sao_Paulo')::date;
      if exists(select 1 from public.agency_records p where p.kind='pontos' and p.deleted_at is null and p.data->>'employee_id'=m.employee_id and p.data->>'tipo'=d->>'tipo' and coalesce(p.data->>'client_id','')=coalesce(d->>'client_id','') and ((p.data->>'data_hora')::timestamptz at time zone 'America/Sao_Paulo')::date=local_day) then raise exception 'Este tipo de ponto já foi registrado hoje neste local.' using errcode='23505'; end if;
      if d->>'tipo' in ('almoco','saida') and not exists(select 1 from public.agency_records p where p.kind='pontos' and p.deleted_at is null and p.data->>'employee_id'=m.employee_id and p.data->>'tipo'='entrada' and coalesce(p.data->>'client_id','')=coalesce(d->>'client_id','') and ((p.data->>'data_hora')::timestamptz at time zone 'America/Sao_Paulo')::date=local_day) then raise exception 'Registre a entrada antes de registrar intervalo ou saída.'; end if;
      if m.employee->>'regime'='interno' and d->>'tipo'='saida' and not exists(select 1 from public.agency_records p where p.kind='pontos' and p.deleted_at is null and p.data->>'employee_id'=m.employee_id and p.data->>'tipo'='almoco' and ((p.data->>'data_hora')::timestamptz at time zone 'America/Sao_Paulo')::date=local_day) then raise exception 'Registre o intervalo antes da saída na rotina interna.'; end if;
      if m.employee->>'regime'='externo' and d->>'tipo'='almoco' then raise exception 'A rotina externa utiliza entrada e saída por restaurante.'; end if;
      if m.employee->>'regime'='externo' then
        select data into v_client from public.agency_records where kind='clients' and id=d->>'client_id' and deleted_at is null;
        if v_client is null or v_client->>'latitude' is null or v_client->>'longitude' is null then raise exception 'Cadastre as coordenadas reais do restaurante antes do ponto externo.'; end if;
        distance_m:=6371000*2*asin(least(1.0,sqrt(power(sin(radians(((d->>'latitude')::double precision-(v_client->>'latitude')::double precision)/2)),2)+cos(radians((d->>'latitude')::double precision))*cos(radians((v_client->>'latitude')::double precision))*power(sin(radians(((d->>'longitude')::double precision-(v_client->>'longitude')::double precision)/2)),2))));
        d:=d||jsonb_build_object('distancia_metros',round(distance_m::numeric,2),'status_localizacao',case when distance_m<=300 and (d->>'precisao_metros')::numeric<=100 then 'no_local' else 'fora_do_raio' end);
      end if;
    elsif k='despesas' then
      if d is null then raise exception 'Reembolsos não podem ser excluídos; registre a decisão.'; end if;
      if old.id is null then
        if d->>'employee_id' is distinct from m.employee_id or d->>'status' is distinct from 'pendente' then raise exception 'O pedido deve ser pessoal e pendente.' using errcode='42501'; end if;
        if coalesce((d->>'valor')::numeric,0)<=0 or nullif(btrim(d->>'descricao'),'') is null or coalesce(d->>'comprovante_arquivo','') !~ '^data:(image/(jpeg|png|webp)|application/pdf);base64,[A-Za-z0-9+/=]+$' then raise exception 'Valor, descrição e comprovante válidos são obrigatórios.'; end if;
        if d->>'event_id' is distinct from 'reembolso-direto' and not exists(select 1 from public.agency_records e where e.kind='events' and e.id=d->>'event_id' and e.deleted_at is null and (admin or coalesce(e.data->'assigned_employee_ids','[]'::jsonb) ? m.employee_id)) then raise exception 'Gravação inválida para o reembolso.'; end if;
        d:=d||jsonb_build_object('employee_nome',m.employee->>'nome','created_at',clock_timestamp(),'status','pendente');
      else
        if not admin then raise exception 'Somente gestão analisa reembolsos.' using errcode='42501'; end if;
        if (d-'status'-'observacao_gestor') is distinct from (old.data-'status'-'observacao_gestor') then raise exception 'A evidência e os dados originais do reembolso são imutáveis.'; end if;
      end if;
      if d->>'status' is null or d->>'status' not in ('pendente','aprovado','recusado','reembolsado') then raise exception 'Status inválido.'; end if;
    elsif k='transacoes' then
      if not admin then
        if old.id is not null or d is null or d->>'employee_id' is distinct from m.employee_id or d->>'status' is distinct from 'pendente' or d->>'tipo' is distinct from 'despesa' or d->>'categoria' is distinct from 'custo_gravacao' then raise exception 'Lançamento financeiro exige gestão.' using errcode='42501'; end if;
        if not exists(select 1 from public.agency_records r where r.kind='despesas' and r.id=d->>'despesa_gravacao_id' and r.deleted_at is null and r.data->>'employee_id'=m.employee_id and (r.data->>'valor')::numeric=(d->>'valor')::numeric) or exists(select 1 from public.agency_records r where r.kind='transacoes' and r.deleted_at is null and r.data->>'despesa_gravacao_id'=d->>'despesa_gravacao_id') then raise exception 'Reembolso vinculado inválido ou já lançado.'; end if;
      end if;
      if d is not null and (coalesce((d->>'valor')::numeric,-1)<0 or nullif(btrim(d->>'descricao'),'') is null or d->>'status' is null or d->>'status' not in ('pendente','pago','atrasado','cancelado')) then raise exception 'Transação inválida.'; end if;
    elsif k='salarios' then
      if not admin then raise exception 'Somente gestão altera salários.' using errcode='42501'; end if;
      if d is not null and (d->>'employee_id' is distinct from rid or not exists(select 1 from public.agency_members am where am.employee_id=rid) or coalesce((d->>'valor_base')::numeric,-1)<0) then raise exception 'Salário inválido.'; end if;
    elsif k='deliverables' then
      if not admin and not (m.role='interno' or (m.role='filmmaker' and coalesce(old.data,d)->>'filmmaker_id'=m.employee_id)) then raise exception 'Sem acesso ao entregável.' using errcode='42501'; end if;
      if not admin and (d is null or d->>'status' in ('aprovado','publicado','ajustes_solicitados') and d->>'status' is distinct from old.data->>'status' or old.id is not null and (d->>'filmmaker_id' is distinct from old.data->>'filmmaker_id' or d->>'client_id' is distinct from old.data->>'client_id')) then raise exception 'Aprovação, exclusão e reatribuição exigem gestão.' using errcode='42501'; end if;
      if d is not null and (nullif(btrim(d->>'titulo'),'') is null or d->>'status' not in ('captado_raw','em_edicao','aguardando_aprovacao','ajustes_solicitados','aprovado','publicado')) then raise exception 'Entregável inválido.'; end if;
      if d is not null and (d->>'status' is null or d->>'formato' is null or d->>'formato' not in ('reels_9_16','feed_post','carrossel','stories','fotos_menu','bruto_raw') or coalesce((d->>'versao')::integer,0)<1 or d->>'data_gravacao' is null) then raise exception 'Formato, versão e data são obrigatórios no entregável.'; end if;
    else
      if not admin then raise exception 'Somente gestão altera métricas e menções.' using errcode='42501'; end if;
    end if;
    if d is not null and k in ('events','deliverables','reels','mentions') and not exists(select 1 from public.agency_records where kind='clients' and id=d->>'client_id' and deleted_at is null) then raise exception 'Restaurante não encontrado.'; end if;
    if d is not null and k not in ('despesas','transacoes') and nullif(d->>'event_id','') is not null and not exists(select 1 from public.agency_records where kind='events' and id=d->>'event_id' and deleted_at is null and data->>'client_id'=d->>'client_id') then raise exception 'Gravação não pertence ao restaurante informado.'; end if;
    insert into public.agency_audit(actor,kind,record_id,action,before_data,after_data)
      values(auth.uid(),k,rid,case when d is null then 'delete' when old.id is null then 'create' else 'update' end,old.data,d);
    if d is null then update public.agency_records set deleted_at=now(),revision=revision+1,updated_at=now() where kind=k and id=rid;
    else insert into public.agency_records(kind,id,data,revision) values(k,rid,d,1)
      on conflict(kind,id) do update set data=excluded.data,revision=agency_records.revision+1,updated_at=now(); end if;
  end loop;
  insert into public.agency_requests(actor,request_id,payload_hash) values(auth.uid(),p_request,fingerprint);
  return public.agency_snapshot();
end $$;
revoke all on function public.agency_snapshot() from public, anon;
revoke all on function public.agency_commit(jsonb,uuid) from public, anon;
grant execute on function public.agency_snapshot(), public.agency_commit(jsonb,uuid) to authenticated;


create or replace function public.agency_workspace_version() returns integer language sql stable set search_path='' as $$ select 2; $$;
revoke all on function public.agency_workspace_version() from public;
grant execute on function public.agency_workspace_version() to anon,authenticated;
