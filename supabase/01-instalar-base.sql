-- ==============================================================================
-- NAVEGANDO MKT - SCRIPT UNIFICADO DE IMPLANTAÇÃO DA BASE CENTRAL (SUPABASE)
-- Execute este arquivo no SQL Editor do Supabase para inicializar o banco completo.
-- ==============================================================================

-- ==============================================================================
-- PARTE 1: SCHEMA INICIAL, TIPOS E TABELAS BASE (001)
-- ==============================================================================

DO $$ BEGIN
  CREATE TYPE event_tipo AS ENUM ('gravacao', 'foto', 'edicao', 'reuniao');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('agendado', 'realizado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'funcionario');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cor INTEGER NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  contato TEXT,
  endereco TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS event_assignments (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, employee_id)
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  papel user_role NOT NULL DEFAULT 'funcionario',
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_data ON events (data);
CREATE INDEX IF NOT EXISTS idx_events_client ON events (client_id);
CREATE INDEX IF NOT EXISTS idx_event_assignments_employee ON event_assignments (employee_id);

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

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Leitura autenticados employees" ON employees FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Leitura autenticados clients" ON clients FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Leitura autenticados events" ON events FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Leitura autenticados assignments" ON event_assignments FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Leitura proprio perfil" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- PARTE 2: INSTAGRAM GRAPH API, MÉTRICAS E MURAL DE UGC (002)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS client_social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  instagram_business_id TEXT NOT NULL,
  instagram_handle TEXT NOT NULL,
  profile_picture_url TEXT,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  followers_count INTEGER DEFAULT 0,
  follows_count INTEGER DEFAULT 0,
  media_count INTEGER DEFAULT 0,
  connected_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_client_instagram UNIQUE (client_id, instagram_business_id)
);

CREATE TABLE IF NOT EXISTS reel_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  instagram_media_id TEXT NOT NULL UNIQUE,
  permalink TEXT NOT NULL,
  media_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  media_type TEXT DEFAULT 'VIDEO',
  published_at TIMESTAMPTZ NOT NULL,
  plays INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saved INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0.00,
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  CREATE TYPE mention_type AS ENUM ('POST_TAG', 'STORY_MENTION', 'CAPTION_MENTION', 'COMMENT_MENTION');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE mention_sentiment AS ENUM ('positivo', 'neutro', 'destaque_gourmet');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS client_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  author_username TEXT NOT NULL,
  author_name TEXT,
  author_followers INTEGER DEFAULT 0,
  is_influencer BOOLEAN DEFAULT false,
  mention_type mention_type NOT NULL DEFAULT 'POST_TAG',
  media_url TEXT,
  permalink TEXT,
  caption TEXT,
  sentiment mention_sentiment DEFAULT 'positivo',
  reposted BOOLEAN NOT NULL DEFAULT false,
  reposted_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reels_client ON reel_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_reels_event ON reel_metrics(event_id);
CREATE INDEX IF NOT EXISTS idx_reels_published ON reel_metrics(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentions_client ON client_mentions(client_id);
CREATE INDEX IF NOT EXISTS idx_mentions_reposted ON client_mentions(reposted);
CREATE INDEX IF NOT EXISTS idx_mentions_posted ON client_mentions(posted_at DESC);

ALTER TABLE client_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_mentions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Leitura autenticados social" ON client_social_accounts FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Leitura autenticados reels" ON reel_metrics FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Leitura autenticados mentions" ON client_mentions FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- PARTE 3: PONTO ELETRÔNICO COM FOTO E GPS (003)
-- ==============================================================================

DO $$ BEGIN
  CREATE TYPE ponto_tipo AS ENUM ('entrada', 'saida');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE ponto_status AS ENUM ('no_local', 'fora_do_raio', 'manual');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE clients ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS funcao TEXT DEFAULT 'filmmaker';

CREATE TABLE IF NOT EXISTS ponto_registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  tipo ponto_tipo NOT NULL DEFAULT 'entrada',
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  foto_url TEXT NOT NULL,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  precisao_metros NUMERIC(8, 2) NOT NULL DEFAULT 10,
  distancia_metros NUMERIC(10, 2),
  status_localizacao ponto_status NOT NULL DEFAULT 'no_local',
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ponto_employee ON ponto_registros(employee_id);
CREATE INDEX IF NOT EXISTS idx_ponto_client ON ponto_registros(client_id);
CREATE INDEX IF NOT EXISTS idx_ponto_data_hora ON ponto_registros(data_hora DESC);

ALTER TABLE ponto_registros ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Membros podem registrar ponto" ON ponto_registros FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Membros podem ler registros de ponto" ON ponto_registros FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- PARTE 4: BASE CENTRAL PROTEGIDA, RLS RESTRITO E FUNÇÕES ATÔMICAS (004)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.agency_members (
  employee_id text primary key,
  user_id uuid unique references auth.users(id) on delete set null,
  role text not null check (role in ('dono','gerente','filmmaker','modelo','interno')),
  employee jsonb not null check (jsonb_typeof(employee) = 'object'),
  active boolean not null default true
);

CREATE TABLE IF NOT EXISTS public.agency_records (
  kind text not null check (kind in ('clients','events','pontos','deliverables','reels','mentions')),
  id text not null,
  data jsonb not null check (jsonb_typeof(data) = 'object' and data->>'id' = id),
  revision bigint not null default 1 check (revision > 0),
  deleted_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (kind,id)
);

CREATE INDEX IF NOT EXISTS agency_records_client on public.agency_records(kind,(data->>'client_id')) where deleted_at is null;
CREATE INDEX IF NOT EXISTS agency_records_employee on public.agency_records(kind,(data->>'employee_id')) where deleted_at is null;

CREATE TABLE IF NOT EXISTS public.agency_audit (
  seq bigint generated always as identity primary key,
  actor uuid not null,
  kind text not null,
  record_id text not null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  happened_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.agency_requests (
  actor uuid not null,
  request_id uuid not null,
  payload_hash text not null,
  created_at timestamptz not null default now(),
  primary key(actor,request_id)
);

ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.agency_members, public.agency_records, public.agency_audit, public.agency_requests FROM anon, authenticated;
GRANT ALL ON public.agency_members, public.agency_records, public.agency_audit, public.agency_requests TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.agency_audit_seq_seq TO service_role;

REVOKE ALL ON public.employees, public.clients, public.events, public.event_assignments, public.profiles,
  public.client_social_accounts, public.reel_metrics, public.client_mentions, public.ponto_registros FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.check_event_conflicts(date,time,time,uuid[],uuid) FROM public,anon,authenticated;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public,anon,authenticated;

CREATE OR REPLACE FUNCTION public.agency_snapshot() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE m public.agency_members; rows jsonb;
BEGIN
  SELECT * INTO m FROM public.agency_members WHERE user_id = auth.uid() AND active;
  IF m.employee_id IS NULL THEN RAISE EXCEPTION 'Conta não vinculada à equipe.' USING errcode = '42501'; END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('kind',r.kind,'id',r.id,'revision',r.revision,'data',
    CASE WHEN r.kind='clients' AND m.role NOT IN ('dono','gerente') THEN
      jsonb_strip_nulls(jsonb_build_object('id',r.id,'nome',r.data->'nome','endereco',r.data->'endereco',
        'latitude',r.data->'latitude','longitude',r.data->'longitude','drive_folder_url',r.data->'drive_folder_url','cardapio_link',r.data->'cardapio_link'))
    WHEN r.kind='events' AND m.role IN ('modelo','interno') THEN r.data - 'relatorio_filmmaker'
    ELSE r.data END) ORDER BY r.kind,r.id),'[]'::jsonb) INTO rows
  FROM public.agency_records r WHERE r.deleted_at IS NULL AND (
    m.role IN ('dono','gerente') OR r.kind IN ('clients','events')
    OR (r.kind='pontos' AND r.data->>'employee_id'=m.employee_id)
    OR (r.kind='deliverables' AND (m.role='interno' OR (m.role='filmmaker' AND r.data->>'filmmaker_id'=m.employee_id)))
    OR (r.kind='reels' AND m.role='filmmaker' AND exists (SELECT 1 FROM public.agency_records e WHERE e.kind='events' AND e.id=r.data->>'event_id' AND e.deleted_at IS NULL AND coalesce(e.data->'assigned_employee_ids','[]'::jsonb) ? m.employee_id))
  );
  RETURN jsonb_build_object('member',jsonb_build_object('employee_id',m.employee_id,'role',m.role,'user_id',auth.uid()),
    'records', rows || (SELECT coalesce(jsonb_agg(jsonb_build_object('kind','employees','id',employee_id,'revision',1,'data',employee)),'[]'::jsonb) FROM public.agency_members WHERE active));
END $$;

CREATE OR REPLACE FUNCTION public.agency_commit(p_changes jsonb,p_request uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE m public.agency_members; c jsonb; d jsonb; old public.agency_records; k text; rid text; admin boolean;
  expected bigint; fingerprint text; prior text; v_client jsonb; distance_m double precision; local_day date;
BEGIN
  SELECT * INTO m FROM public.agency_members WHERE user_id=auth.uid() AND active;
  IF m.employee_id IS NULL THEN RAISE EXCEPTION 'Sem acesso.' USING errcode='42501'; END IF;
  admin := m.role IN ('dono','gerente');
  IF jsonb_typeof(p_changes)<>'array' OR jsonb_array_length(p_changes) NOT BETWEEN 1 AND 100 OR p_request IS NULL THEN RAISE EXCEPTION 'Lote inválido.'; END IF;
  PERFORM pg_advisory_xact_lock(717001);
  fingerprint:=md5(p_changes::text);
  SELECT payload_hash INTO prior FROM public.agency_requests WHERE actor=auth.uid() AND request_id=p_request;
  IF prior IS NOT NULL THEN
    IF prior<>fingerprint THEN RAISE EXCEPTION 'Identificador reutilizado com outro conteúdo.' USING errcode='22023'; END IF;
    RETURN public.agency_snapshot();
  END IF;
  IF exists(SELECT 1 FROM jsonb_array_elements(p_changes) x GROUP BY x->>'kind',x->>'id' HAVING count(*)>1) THEN RAISE EXCEPTION 'Registro repetido no lote.'; END IF;
  FOR c IN SELECT value FROM jsonb_array_elements(p_changes) LOOP
    k:=c->>'kind'; rid:=c->>'id'; d:=nullif(c->'data','null'::jsonb); expected:=(c->>'expected')::bigint;
    IF k NOT IN ('clients','events','pontos','deliverables','reels','mentions') OR rid !~ '^[a-zA-Z0-9_-]{1,100}$' OR expected IS NULL OR expected<0 THEN RAISE EXCEPTION 'Registro inválido.'; END IF;
    SELECT * INTO old FROM public.agency_records WHERE kind=k AND id=rid;
    IF coalesce(old.revision,0)<>expected OR old.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'Registro alterado por outra pessoa. Recarregue antes de continuar.' USING errcode='40001'; END IF;
    IF d IS NOT NULL AND (jsonb_typeof(d)<>'object' OR d->>'id' IS DISTINCT FROM rid OR octet_length(d::text)>1600000) THEN RAISE EXCEPTION 'Conteúdo inválido.'; END IF;
    IF k='clients' THEN
      IF NOT admin THEN RAISE EXCEPTION 'Somente gestão altera restaurantes.' USING errcode='42501'; END IF;
      IF d IS NOT NULL AND (nullif(btrim(d->>'nome'),'') IS NULL OR coalesce((d->>'valor_mensalidade')::numeric,0)<0) THEN RAISE EXCEPTION 'Restaurante inválido.'; END IF;
      IF d IS NULL AND exists(SELECT 1 FROM public.agency_records r WHERE r.deleted_at IS NULL AND r.data->>'client_id'=rid) THEN RAISE EXCEPTION 'Cliente possui histórico. Pause o contrato em vez de excluir.'; END IF;
    ELSIF k='events' THEN
      IF NOT admin THEN
        IF m.role<>'filmmaker' OR old.id IS NULL OR d IS NULL OR NOT (coalesce(old.data->'assigned_employee_ids','[]'::jsonb) ? m.employee_id) OR (d-'relatorio_filmmaker') IS DISTINCT FROM (old.data-'relatorio_filmmaker') THEN RAISE EXCEPTION 'Sem permissão para alterar a gravação.' USING errcode='42501'; END IF;
      END IF;
      IF d IS NOT NULL THEN
        IF NOT (d ?& array['data','hora_inicio','hora_fim','tipo','status','assigned_employee_ids','client_id']) OR d->>'data' IS NULL OR d->>'hora_inicio' IS NULL OR d->>'hora_fim' IS NULL OR d->>'tipo' IS NULL OR d->>'status' IS NULL THEN RAISE EXCEPTION 'Dados obrigatórios da gravação ausentes.'; END IF;
        IF (d->>'hora_fim')::time <= (d->>'hora_inicio')::time OR d->>'tipo' NOT IN ('gravacao','foto','edicao','reuniao') OR d->>'status' NOT IN ('agendado','realizado','cancelado') OR jsonb_typeof(d->'assigned_employee_ids') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Horário ou tipo de gravação inválido.'; END IF;
        PERFORM (d->>'data')::date;
        IF exists(SELECT 1 FROM jsonb_array_elements_text(d->'assigned_employee_ids') a WHERE NOT exists(SELECT 1 FROM public.agency_members am WHERE am.employee_id=a AND am.active)) THEN RAISE EXCEPTION 'Colaborador inválido na escala.'; END IF;
        IF d->'relatorio_filmmaker' IS DISTINCT FROM old.data->'relatorio_filmmaker' AND d ? 'relatorio_filmmaker' THEN
          d:=jsonb_set(d,'{relatorio_filmmaker}',(d->'relatorio_filmmaker')||jsonb_build_object('preenchido_por_id',m.employee_id,'preenchido_em',clock_timestamp(),'preenchido',true));
        END IF;
        IF d->>'status'<>'cancelado' AND exists(SELECT 1 FROM public.agency_records e WHERE e.kind='events' AND e.id<>rid AND e.deleted_at IS NULL AND e.data->>'status'<>'cancelado' AND e.data->>'data'=d->>'data' AND (e.data->>'hora_inicio')::time<(d->>'hora_fim')::time AND (e.data->>'hora_fim')::time>(d->>'hora_inicio')::time AND exists(SELECT 1 FROM jsonb_array_elements_text(d->'assigned_employee_ids') a WHERE coalesce(e.data->'assigned_employee_ids','[]'::jsonb) ? a)) THEN RAISE EXCEPTION 'Conflito de horário na escala.' USING errcode='23514'; END IF;
      END IF;
      IF d IS NULL AND exists(SELECT 1 FROM public.agency_records r WHERE r.deleted_at IS NULL AND r.data->>'event_id'=rid) THEN RAISE EXCEPTION 'Gravação com histórico deve ser cancelada, não excluída.'; END IF;
    ELSIF k='pontos' THEN
      IF old.id IS NOT NULL OR d IS NULL OR d->>'employee_id' IS DISTINCT FROM m.employee_id THEN RAISE EXCEPTION 'O ponto é pessoal e não pode ser reescrito ou excluído.' USING errcode='42501'; END IF;
      IF NOT (d ?& array['tipo','foto_url','latitude','longitude','precisao_metros']) OR d->>'tipo' IS NULL OR jsonb_typeof(d->'foto_url') IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'Evidências de ponto incompletas.'; END IF;
      IF d->>'tipo' NOT IN ('entrada','almoco','saida') OR d->>'foto_url' NOT LIKE ('private:ponto-evidencias/'||auth.uid()::text||'/%') OR jsonb_typeof(d->'latitude') IS DISTINCT FROM 'number' OR jsonb_typeof(d->'longitude') IS DISTINCT FROM 'number' OR abs((d->>'latitude')::numeric)>90 OR abs((d->>'longitude')::numeric)>180 OR coalesce((d->>'precisao_metros')::numeric,0)<=0 THEN RAISE EXCEPTION 'Foto e coordenadas válidas são obrigatórias.'; END IF;
      IF NOT exists(SELECT 1 FROM storage.objects WHERE bucket_id='ponto-evidencias' AND name=substring(d->>'foto_url' FROM length('private:ponto-evidencias/')+1)) THEN RAISE EXCEPTION 'A foto precisa estar armazenada antes do ponto.'; END IF;
      d:=d||jsonb_build_object('data_hora',clock_timestamp(),'created_at',clock_timestamp(),'status_localizacao','manual');
      IF m.employee->>'regime'='interno' THEN d:=d||jsonb_build_object('client_id',null,'event_id',null); END IF;
      local_day:=(clock_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date;
      IF exists(SELECT 1 FROM public.agency_records p WHERE p.kind='pontos' AND p.deleted_at IS NULL AND p.data->>'employee_id'=m.employee_id AND p.data->>'tipo'=d->>'tipo' AND coalesce(p.data->>'client_id','')=coalesce(d->>'client_id','') AND ((p.data->>'data_hora')::timestamptz AT TIME ZONE 'America/Sao_Paulo')::date=local_day) THEN RAISE EXCEPTION 'Este tipo de ponto já foi registrado hoje neste local.' USING errcode='23505'; END IF;
      IF d->>'tipo' IN ('almoco','saida') AND NOT exists(SELECT 1 FROM public.agency_records p WHERE p.kind='pontos' AND p.deleted_at IS NULL AND p.data->>'employee_id'=m.employee_id AND p.data->>'tipo'='entrada' AND coalesce(p.data->>'client_id','')=coalesce(d->>'client_id','') AND ((p.data->>'data_hora')::timestamptz AT TIME ZONE 'America/Sao_Paulo')::date=local_day) THEN RAISE EXCEPTION 'Registre a entrada antes de registrar intervalo ou saída.'; END IF;
      IF m.employee->>'regime'='interno' AND d->>'tipo'='saida' AND NOT exists(SELECT 1 FROM public.agency_records p WHERE p.kind='pontos' AND p.deleted_at IS NULL AND p.data->>'employee_id'=m.employee_id AND p.data->>'tipo'='almoco' AND ((p.data->>'data_hora')::timestamptz AT TIME ZONE 'America/Sao_Paulo')::date=local_day) THEN RAISE EXCEPTION 'Registre o intervalo antes da saída na rotina interna.'; END IF;
      IF m.employee->>'regime'='externo' AND d->>'tipo'='almoco' THEN RAISE EXCEPTION 'A rotina externa utiliza entrada e saída por restaurante.'; END IF;
      IF m.employee->>'regime'='externo' THEN
        SELECT data INTO v_client FROM public.agency_records WHERE kind='clients' AND id=d->>'client_id' AND deleted_at IS NULL;
        IF v_client IS NULL OR v_client->>'latitude' IS NULL OR v_client->>'longitude' IS NULL THEN RAISE EXCEPTION 'Cadastre as coordenadas reais do restaurante antes do ponto externo.'; END IF;
        distance_m:=6371000*2*asin(least(1.0,sqrt(power(sin(radians(((d->>'latitude')::double precision-(v_client->>'latitude')::double precision)/2)),2)+cos(radians((d->>'latitude')::double precision))*cos(radians((v_client->>'latitude')::double precision))*power(sin(radians(((d->>'longitude')::double precision-(v_client->>'longitude')::double precision)/2)),2))));
        d:=d||jsonb_build_object('distancia_metros',round(distance_m::numeric,2),'status_localizacao',CASE WHEN distance_m<=300 AND (d->>'precisao_metros')::numeric<=100 THEN 'no_local' ELSE 'fora_do_raio' END);
      END IF;
    ELSIF k='deliverables' THEN
      IF NOT admin AND NOT (m.role='interno' OR (m.role='filmmaker' AND coalesce(old.data,d)->>'filmmaker_id'=m.employee_id)) THEN RAISE EXCEPTION 'Sem acesso ao entregável.' USING errcode='42501'; END IF;
      IF NOT admin AND (d IS NULL OR d->>'status' IN ('aprovado','publicado','ajustes_solicitados') AND d->>'status' IS DISTINCT FROM old.data->>'status' OR old.id IS NOT NULL AND (d->>'filmmaker_id' IS DISTINCT FROM old.data->>'filmmaker_id' OR d->>'client_id' IS DISTINCT FROM old.data->>'client_id')) THEN RAISE EXCEPTION 'Aprovação, exclusão e reatribuição exigem gestão.' USING errcode='42501'; END IF;
      IF d IS NOT NULL AND (nullif(btrim(d->>'titulo'),'') IS NULL OR d->>'status' NOT IN ('captado_raw','em_edicao','aguardando_aprovacao','ajustes_solicitados','aprovado','publicado')) THEN RAISE EXCEPTION 'Entregável inválido.'; END IF;
      IF d IS NOT NULL AND (d->>'status' IS NULL OR d->>'formato' IS NULL OR d->>'formato' NOT IN ('reels_9_16','feed_post','carrossel','stories','fotos_menu','bruto_raw') OR coalesce((d->>'versao')::integer,0)<1 OR d->>'data_gravacao' IS NULL) THEN RAISE EXCEPTION 'Formato, versão e data são obrigatórios no entregável.'; END IF;
    ELSE
      IF NOT admin THEN RAISE EXCEPTION 'Somente gestão altera métricas e menções.' USING errcode='42501'; END IF;
    END IF;
    IF d IS NOT NULL AND k IN ('events','deliverables','reels','mentions') AND NOT exists(SELECT 1 FROM public.agency_records WHERE kind='clients' AND id=d->>'client_id' AND deleted_at IS NULL) THEN RAISE EXCEPTION 'Restaurante não encontrado.'; END IF;
    IF d IS NOT NULL AND nullif(d->>'event_id','') IS NOT NULL AND NOT exists(SELECT 1 FROM public.agency_records WHERE kind='events' AND id=d->>'event_id' AND deleted_at IS NULL AND data->>'client_id'=d->>'client_id') THEN RAISE EXCEPTION 'Gravação não pertence ao restaurante informado.'; END IF;
    INSERT INTO public.agency_audit(actor,kind,record_id,action,before_data,after_data)
      VALUES(auth.uid(),k,rid,CASE WHEN d IS NULL THEN 'delete' WHEN old.id IS NULL THEN 'create' ELSE 'update' END,old.data,d);
    IF d IS NULL THEN UPDATE public.agency_records SET deleted_at=now(),revision=revision+1,updated_at=now() WHERE kind=k AND id=rid;
    ELSE INSERT INTO public.agency_records(kind,id,data,revision) VALUES(k,rid,d,1)
      ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data,revision=agency_records.revision+1,updated_at=now(); END IF;
  END LOOP;
  INSERT INTO public.agency_requests(actor,request_id,payload_hash) VALUES(auth.uid(),p_request,fingerprint);
  RETURN public.agency_snapshot();
END $$;

REVOKE ALL ON FUNCTION public.agency_snapshot() FROM public, anon;
REVOKE ALL ON FUNCTION public.agency_commit(jsonb,uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.agency_snapshot(), public.agency_commit(jsonb,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.agency_health() RETURNS boolean LANGUAGE sql stable SET search_path='' AS $$ SELECT true; $$;
REVOKE ALL ON FUNCTION public.agency_health() FROM public;
GRANT EXECUTE ON FUNCTION public.agency_health() TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.agency_audit_page(p_before bigint default null,p_limit integer default 50) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NOT exists(SELECT 1 FROM public.agency_members WHERE user_id=auth.uid() AND active AND role IN ('dono','gerente')) THEN RAISE EXCEPTION 'Auditoria exige gestão.' USING errcode='42501'; END IF;
  RETURN (SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY a.seq desc),'[]'::jsonb) FROM
    (SELECT seq,actor,kind,record_id,action,happened_at FROM public.agency_audit WHERE p_before IS NULL OR seq<p_before ORDER BY seq desc LIMIT greatest(1,least(p_limit,100))) a);
END $$;

REVOKE ALL ON FUNCTION public.agency_audit_page(bigint,integer) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.agency_audit_page(bigint,integer) TO authenticated;

-- Bucket privado para fotos de ponto
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
  VALUES('ponto-evidencias','ponto-evidencias',false,1048576,array['image/jpeg','image/png','image/webp']) ON CONFLICT(id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.agency_evidence_access(owner_folder text) RETURNS boolean
LANGUAGE sql stable SECURITY DEFINER SET search_path='' AS $$
  SELECT exists(SELECT 1 FROM public.agency_members WHERE user_id=auth.uid() AND active AND (user_id::text=owner_folder OR role IN ('dono','gerente')));
$$;

DO $$ BEGIN
  CREATE POLICY "agency_evidence_insert" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK(bucket_id='ponto-evidencias' AND (storage.foldername(name))[1]=auth.uid()::text AND public.agency_evidence_access((storage.foldername(name))[1]));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "agency_evidence_read" ON storage.objects FOR SELECT TO authenticated
    USING(bucket_id='ponto-evidencias' AND public.agency_evidence_access((storage.foldername(name))[1]));
EXCEPTION WHEN duplicate_object THEN null; END $$;

REVOKE ALL ON FUNCTION public.agency_evidence_access(text) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.agency_evidence_access(text) TO authenticated;

-- ==============================================================================
-- PARTE 5: CADASTRO DOS 20 MEMBROS OFICIAIS (005)
-- ==============================================================================

INSERT INTO public.agency_members(employee_id,role,employee) VALUES
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
('usr-guilherme','interno','{"id": "usr-guilherme", "nome": "Guilherme", "username": "guilherme", "funcao": "interno", "regime": "interno", "cargo_detalhado": "Estrategista & Operações Internas", "cor": 195, "ativo": true}'::jsonb),
('usr-carol','interno','{"id": "usr-carol", "nome": "Carol", "username": "carol", "funcao": "interno", "regime": "interno", "cargo_detalhado": "Editora de Vídeo & Pós-Produção", "cor": 310, "ativo": true}'::jsonb),
('usr-bruna','interno','{"id": "usr-bruna", "nome": "Bruna", "username": "bruna", "funcao": "interno", "regime": "interno", "cargo_detalhado": "Social Media & Copywriter", "cor": 25, "ativo": true}'::jsonb),
('usr-lucas','interno','{"id": "usr-lucas", "nome": "Lucas Verraz", "username": "lucas", "funcao": "interno", "regime": "interno", "cargo_detalhado": "Editor de Vídeo & Colorista", "cor": 180, "ativo": true}'::jsonb),
('usr-evelin','interno','{"id": "usr-evelin", "nome": "Evelin", "username": "evelin", "funcao": "interno", "regime": "interno", "cargo_detalhado": "Designer Gráfica & Criativos", "cor": 290, "ativo": true}'::jsonb),
('usr-juliaint','interno','{"id": "usr-juliaint", "nome": "Julia Int", "username": "juliaint", "funcao": "interno", "regime": "interno", "cargo_detalhado": "Gestora de Tráfego & Performance", "cor": 45, "ativo": true}'::jsonb),
('usr-augusto','interno','{"id": "usr-augusto", "nome": "Augusto", "username": "augusto", "funcao": "interno", "regime": "interno", "cargo_detalhado": "Atendimento & Suporte ao Cliente", "cor": 165, "ativo": true}'::jsonb)
ON CONFLICT(employee_id) DO NOTHING;
