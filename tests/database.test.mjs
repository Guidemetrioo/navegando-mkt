import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';

test('database migrations, authorization and atomic commits',async(t)=>{
  const db=new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth,public to authenticated,anon;
    create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid() primary key,bucket_id text,name text unique);
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as $$select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;
    grant usage on schema storage to authenticated;grant select,insert on storage.objects to authenticated;`);
  const dir=new URL('../supabase/migrations/',import.meta.url);
  for(const file of (await readdir(dir)).filter(f=>f.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(file,dir),'utf8'));
  const actors={owner:'00000000-0000-4000-8000-000000000001',manager:'00000000-0000-4000-8000-000000000002',film:'00000000-0000-4000-8000-000000000003',model:'00000000-0000-4000-8000-000000000004',internal:'00000000-0000-4000-8000-000000000005'};
  const people={owner:'usr-felipe',manager:'usr-alexandre',film:'usr-victor',model:'usr-isa',internal:'usr-carol'};
  for(const [key,id] of Object.entries(actors)) {
    await db.query('insert into auth.users(id) values($1)',[id]);
    await db.query('update public.agency_members set user_id=$1 where employee_id=$2',[id,people[key]]);
  }
  async function as(role){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[actors[role] || '']);await db.exec(`set role ${role==='anon'?'anon':'authenticated'}`);}
  async function snapshot(){return (await db.query('select public.agency_snapshot() as result')).rows[0].result;}
  async function commit(changes,id=randomUUID()){return (await db.query('select public.agency_commit($1::jsonb,$2::uuid) as result',[JSON.stringify(changes),id])).rows[0].result;}
  const change=(kind,id,data,expected=0)=>({kind,id,data:data ? {...data,id}:null,expected});
  const client=change('clients','c-real',{nome:'Restaurante de teste',latitude:-23.55,longitude:-46.63,valor_mensalidade:4500,contato:'Restrito'});
  const event=change('events','e-real',{client_id:'c-real',tipo:'gravacao',status:'agendado',data:'2026-11-05',hora_inicio:'09:00',hora_fim:'12:00',assigned_employee_ids:['usr-victor','usr-isa']});
  await t.test('roster has 19 people and the production workspace has no fake clients',async()=>{await as('owner');const s=await snapshot();assert.equal(s.records.filter(r=>r.kind==='employees').length,19);assert.equal(s.records.filter(r=>r.kind==='clients').length,0);});
  await t.test('anonymous cannot query the RPC',async()=>{await as('anon');await assert.rejects(snapshot,/permission denied/);});
  await t.test('authenticated cannot read raw tables',async()=>{await as('owner');await assert.rejects(db.query('select * from public.agency_records'),/permission denied/);});
  await t.test('manager can create customer and schedule in a transaction',async()=>{await as('manager');const s=await commit([client,event]);assert(s.records.some(r=>r.id==='e-real'));});
  await t.test('model does not receive contracts or customer contact data',async()=>{await as('model');const c=(await snapshot()).records.find(r=>r.id==='c-real');assert.equal(c.data.valor_mensalidade,undefined);assert.equal(c.data.contato,undefined);assert.equal(c.data.nome,'Restaurante de teste');});
  await t.test('staff cannot create customers',async()=>{await as('film');await assert.rejects(commit([change('clients','forbidden',{nome:'Não permitido'})]),/gestão/);});
  await t.test('staff cannot promote itself through the RPC',async()=>{await as('model');await assert.rejects(commit([change('employees','usr-isa',{funcao:'dono'})]),/inválido/);});
  await t.test('assigned filmmaker may submit only the recording report',async()=>{await as('film');const e=(await snapshot()).records.find(r=>r.id==='e-real');const s=await commit([change('events',e.id,{...e.data,relatorio_filmmaker:{preenchido:true,preenchido_por_id:'usr-felipe',takes_gravados_qtd:5}},e.revision)]);const r=s.records.find(r=>r.id===e.id);assert.equal(r.data.relatorio_filmmaker.preenchido_por_id,'usr-victor');});
  await t.test('filmmaker cannot change event schedule through a report',async()=>{await as('film');const e=(await snapshot()).records.find(r=>r.id==='e-real');await assert.rejects(commit([change('events',e.id,{...e.data,hora_inicio:'10:00'},e.revision)]),/permissão/);});
  await t.test('model cannot read technical recording reports',async()=>{await as('model');assert.equal((await snapshot()).records.find(r=>r.id==='e-real').data.relatorio_filmmaker,undefined);});
  await t.test('database rejects overlapping employee assignments',async()=>{await as('owner');await assert.rejects(commit([change('events','overlap',{...event.data,hora_inicio:'11:00',hora_fim:'13:00'})]),/Conflito/);});
  await t.test('stale version cannot overwrite another person',async()=>{await as('owner');await assert.rejects(commit([change('clients','c-real',{...client.data,nome:'Sobrescrito'},0)]),/outra pessoa/);});
  await t.test('whole batch rolls back if a later mutation fails',async()=>{await as('owner');await assert.rejects(commit([change('clients','rollback',{nome:'Temporário'}),change('events','invalid',{...event.data,client_id:'missing',assigned_employee_ids:[]})]));assert(!(await snapshot()).records.some(r=>r.id==='rollback'));});
  await t.test('retry after a lost response does not duplicate a commit',async()=>{await as('owner');const id=randomUUID();const payload=[change('clients','deduplicated',{nome:'Uma vez'})];await commit(payload,id);const s=await commit(payload,id);assert.equal(s.records.find(r=>r.id==='deduplicated').revision,1);await assert.rejects(commit([change('clients','other',{nome:'Outro'})],id),/reutilizado/);});
  await t.test('deletion preserves a tombstone and cannot reuse an ID',async()=>{await as('owner');await commit([change('clients','deduplicated',null,1)]);await assert.rejects(commit([change('clients','deduplicated',{nome:'Recriado'})]),/outra pessoa/);});
  await t.test('customer with history cannot be deleted',async()=>{await as('owner');await assert.rejects(commit([change('clients','c-real',null,1)]),/histórico/);});
  await t.test('staff cannot approve deliverables',async()=>{await as('internal');await assert.rejects(commit([change('deliverables','d-no',{titulo:'Reel',client_id:'c-real',status:'aprovado'})]),/Aprovação/);});
  await t.test('filmmaker cannot register someone else attendance',async()=>{await as('film');await assert.rejects(commit([change('pontos','p-no',{employee_id:'usr-isa'})]),/pessoal/);});
  await t.test('attendance timestamp and radius are established by the database',async()=>{
    await db.exec('reset role');await db.query('insert into storage.objects(bucket_id,name) values($1,$2)',['ponto-evidencias',`${actors.film}/proof.jpg`]);await as('film');
    const s=await commit([change('pontos','p-real',{employee_id:'usr-victor',client_id:'c-real',tipo:'entrada',foto_url:`private:ponto-evidencias/${actors.film}/proof.jpg`,latitude:-23.55,longitude:-46.63,precisao_metros:8,data_hora:'1999-01-01T00:00:00Z',status_localizacao:'fora_do_raio'})]);
    const p=s.records.find(r=>r.id==='p-real');assert(!p.data.data_hora.startsWith('1999'));assert.equal(p.data.status_localizacao,'no_local');
  });
  await t.test('attendance evidence cannot be edited or deleted',async()=>{await as('owner');await assert.rejects(commit([change('pontos','p-real',null,1)]),/pessoal/);});
  await t.test('other employees cannot read a coworker attendance',async()=>{await as('model');assert(!(await snapshot()).records.some(r=>r.id==='p-real'));});
  await t.test('managers can audit the team attendance',async()=>{await as('manager');assert((await snapshot()).records.some(r=>r.id==='p-real'));});
  await t.test('internal routine requires entry, interval and exit in order without duplicate punches',async()=>{
    await db.exec('reset role');await db.query('insert into storage.objects(bucket_id,name) values($1,$2)',['ponto-evidencias',`${actors.internal}/proof.jpg`]);await as('internal');
    const evidence={employee_id:'usr-carol',tipo:'saida',foto_url:`private:ponto-evidencias/${actors.internal}/proof.jpg`,latitude:-23.55,longitude:-46.63,precisao_metros:8};
    await assert.rejects(commit([change('pontos','out-before-entry',evidence)]),/entrada/);
    await commit([change('pontos','internal-entry',{...evidence,tipo:'entrada'})]);
    await assert.rejects(commit([change('pontos','out-before-lunch',evidence)]),/intervalo/);
    await commit([change('pontos','internal-lunch',{...evidence,tipo:'almoco'})]);
    await commit([change('pontos','internal-out',evidence)]);
    await assert.rejects(commit([change('pontos','duplicate-out',evidence)]),/registrado hoje/);
  });
  await t.test('reimbursement and its finance entry are centrally visible with staff isolation',async()=>{
    await as('model');
    const receipt={employee_id:'usr-isa',employee_nome:'Forged',event_id:'reembolso-direto',tipo:'outros',categoria:'outros',descricao:'Transporte de teste',valor:49.9,data:'2026-10-29',comprovante_arquivo:'data:image/png;base64,aGVsbG8=',status:'pendente'};
    await commit([change('despesas','expense-own',receipt),change('transacoes','transaction-own',{employee_id:'usr-isa',tipo:'despesa',categoria:'custo_gravacao',descricao:'Reembolso de teste',valor:49.9,status:'pendente',despesa_gravacao_id:'expense-own'})]);
    const own=(await snapshot()).records.find(r=>r.id==='expense-own');assert.equal(own.data.employee_nome,'Isa');
    await assert.rejects(commit([change('despesas','forged-owner',{...receipt,employee_id:'usr-carol'})]),/pessoal/);
    await assert.rejects(commit([change('despesas',own.id,{...own.data,status:'reembolsado'},own.revision)]),/gestão/);
    await as('film');assert(!(await snapshot()).records.some(r=>r.id==='expense-own'||r.id==='transaction-own'));
    await as('manager');const e=(await snapshot()).records.find(r=>r.id==='expense-own');assert(e.data.comprovante_arquivo);
    await commit([change('despesas',e.id,{...e.data,status:'aprovado'},e.revision)]);
    await assert.rejects(commit([change('despesas',e.id,{...e.data,status:'recusado'},e.revision)]),/alterado/);
    await as('model');assert.equal((await snapshot()).records.find(r=>r.id==='expense-own').data.status,'aprovado');
  });
  await t.test('payroll is visible only to management',async()=>{
    await as('owner');await commit([change('salarios','usr-carol',{employee_id:'usr-carol',valor_base:1000})]);
    await as('internal');assert(!(await snapshot()).records.some(r=>r.kind==='salarios'));
    await assert.rejects(commit([change('salarios','usr-victor',{employee_id:'usr-victor',valor_base:999})]),/gestão/);
  });
  await t.test('direct RPC cannot omit mandatory event fields',async()=>{await as('owner');await assert.rejects(commit([change('events','missing',{client_id:'c-real',hora_inicio:'09:00',hora_fim:'12:00',assigned_employee_ids:[]})]),/obrigatórios/);});
  await t.test('deactivating an account revokes access even with an existing session',async()=>{await db.exec('reset role');await db.query('update public.agency_members set active=false where employee_id=$1',['usr-isa']);await as('model');await assert.rejects(snapshot,/vinculada/);});
  await t.test('every successful business mutation has a protected audit record',async()=>{await db.exec('reset role');const {rows}=await db.query('select count(*)::integer as count from public.agency_audit');assert(rows[0].count>=6);await as('film');await assert.rejects(db.query('select * from public.agency_audit'),/permission denied/);});
  await t.test('audit RPC denies staff and returns only metadata to management',async()=>{await as('film');await assert.rejects(db.query('select public.agency_audit_page()'),/gestão/);await as('manager');const {rows}=await db.query('select public.agency_audit_page() as result');assert(rows[0].result.length>0);assert.equal(rows[0].result[0].before_data,undefined);});
  await t.test('public health check reveals availability, not business data',async()=>{await as('anon');const {rows}=await db.query('select public.agency_health() as ok');assert.equal(rows[0].ok,true);});
  await t.test('restoring a database snapshot recovers records and access rules',async()=>{
    await db.exec('reset role');
    const image=await db.dumpDataDir();
    const recovered=new PGlite({loadDataDir:image});
    const original=(await db.query('select kind,id,data,revision,deleted_at from public.agency_records order by kind,id')).rows;
    const restored=(await recovered.query('select kind,id,data,revision,deleted_at from public.agency_records order by kind,id')).rows;
    assert.deepEqual(restored,original);
    await recovered.query("select set_config('request.jwt.claim.sub',$1,false)",[actors.model]);await recovered.exec('set role authenticated');
    await assert.rejects(recovered.query('select public.agency_snapshot()'),/vinculada/);
    await recovered.close();
  });
  await db.close();
});
