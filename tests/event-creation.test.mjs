import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

const require = createRequire(import.meta.url);
require('./load-ts.cjs');

const { normalizeScheduleTimes, buildNormalizedEventPayload } = require('../src/lib/event-normalization.ts');
const { enumerateIsoDates } = require('../src/lib/date-utils.ts');
const { validateChanges, diffWorkspace, emptyWorkspace } = require('../src/lib/workspace.ts');

test('normalizes incomplete times so hora_fim is always strictly after hora_inicio', () => {
  assert.deepEqual(normalizeScheduleTimes('', ''), { hora_inicio: '09:00', hora_fim: '10:00' });
  assert.deepEqual(normalizeScheduleTimes('14:00', '14:00'), { hora_inicio: '14:00', hora_fim: '15:00' });
  assert.deepEqual(normalizeScheduleTimes('18:00', '15:00'), { hora_inicio: '18:00', hora_fim: '19:00' });
  assert.deepEqual(normalizeScheduleTimes('23:30', '01:00'), { hora_inicio: '23:30', hora_fim: '23:59' });
});

test('allows incomplete appointment on day 17 without team, times, or confirmado status rejection', () => {
  const payload = buildNormalizedEventPayload({
    clientId: 'cli-padaria',
    date: '2026-11-17',
    startTime: '14:00',
    endTime: '12:00',
    status: 'confirmado',
    selectedEmployeeIds: ['usr-henry', 'usr-victor'],
    employees: [
      { id: 'usr-henry', nome: 'Henry', cor: 1, ativo: false },
      { id: 'usr-victor', nome: 'Victor', cor: 2, ativo: true },
    ],
  });

  assert.equal(payload.data, '2026-11-17');
  assert.equal(payload.hora_inicio, '14:00');
  assert.equal(payload.hora_fim, '15:00');
  assert.equal(payload.status, 'agendado');
  assert.equal(payload.confirmacao_whatsapp?.status_resposta, 'confirmado');
  assert.deepEqual(payload.assigned_employee_ids, ['usr-victor']);

  const noTeamPayload = buildNormalizedEventPayload({
    clientId: 'cli-padaria',
    date: '2026-11-17',
    selectedEmployeeIds: [],
  });
  assert.deepEqual(noTeamPayload.assigned_employee_ids, []);

  assert.doesNotThrow(() =>
    validateChanges([
      { kind: 'events', id: 'evt-day-17', expected: 0, data: { ...noTeamPayload, id: 'evt-day-17' } },
    ])
  );
});

test('persists complete, incomplete, unstaffed, and multi-day day-17 appointments consistently in PostgreSQL', async () => {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth,public to authenticated,anon;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid() primary key,bucket_id text,name text unique);
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as $$select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;
    grant usage on schema storage to authenticated; grant select,insert on storage.objects to authenticated;`);

  const dir = new URL('../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(file, dir), 'utf8'));
  }

  const managerUid = '00000000-0000-4000-8000-000000000010';
  await db.query('insert into auth.users(id) values($1)', [managerUid]);
  await db.query('update public.agency_members set user_id=$1 where employee_id=$2', [managerUid, 'usr-alexandre']);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [managerUid]);
  await db.exec('set role authenticated');

  const baseSnapshot = (await db.query('select public.agency_snapshot() as result')).rows[0].result;
  const workspace = emptyWorkspace();
  workspace.clients.push({ id: 'cli-auto-17', nome: 'A definir', status: 'ativo' });

  // 1) Agendamento incompleto no dia 17 (sem equipe, status confirmado normalizado, horario ajustado)
  const incomplete17 = buildNormalizedEventPayload({
    clientId: 'cli-auto-17',
    date: '2026-11-17',
    startTime: '',
    endTime: '',
    status: 'confirmado',
    selectedEmployeeIds: [],
  });
  workspace.events.push({ ...incomplete17, id: 'evt-incompleto-17' });

  // 2) Viagem multi-dia (17 a 19/11) com equipe definida
  const multiDay = buildNormalizedEventPayload({
    clientId: 'cli-auto-17',
    date: '2026-11-17',
    isMultiDay: true,
    endDate: '2026-11-19',
    startTime: '10:00',
    endTime: '14:00',
    selectedEmployeeIds: ['usr-victor', 'usr-isa'],
  });
  const { endDate, ...baseMulti } = multiDay;
  const dates = enumerateIsoDates(baseMulti.data, endDate);
  assert.deepEqual(dates, ['2026-11-17', '2026-11-18', '2026-11-19']);
  for (const dayIso of dates) {
    workspace.events.push({ ...baseMulti, id: `evt-trip-${dayIso}`, data: dayIso });
  }

  const changes = diffWorkspace(baseSnapshot, workspace);
  assert.doesNotThrow(() => validateChanges(changes));

  const committed = (
    await db.query('select public.agency_commit($1::jsonb,$2::uuid) as result', [
      JSON.stringify(changes),
      randomUUID(),
    ])
  ).rows[0].result;

  const savedEvents = committed.records.filter((r) => r.kind === 'events');
  assert.equal(savedEvents.length, 4);
  assert(savedEvents.some((r) => r.id === 'evt-incompleto-17' && r.data.data === '2026-11-17'));
  assert(savedEvents.some((r) => r.id === 'evt-trip-2026-11-17' && r.data.data === '2026-11-17'));
  assert(savedEvents.some((r) => r.id === 'evt-trip-2026-11-18' && r.data.data === '2026-11-18'));
  assert(savedEvents.some((r) => r.id === 'evt-trip-2026-11-19' && r.data.data === '2026-11-19'));
});
