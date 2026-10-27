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
