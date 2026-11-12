import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir,mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join,dirname,resolve,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {decryptBackup,verifyBundle,sha256} from './backup-codec.mjs';

// No URLs or credentials are accepted here: this restores only into isolated embedded PostgreSQL.
export async function drillBackup(bundle){
 verifyBundle(bundle);
 const db=new PGlite();
 const tempRoot=resolve(tmpdir());
 const temp=await mkdtemp(join(tempRoot,'navegando-recovery-'));
 if(dirname(resolve(temp))!==tempRoot || !basename(temp).startsWith('navegando-recovery-'))throw new Error('Destino temporário fora da área de recuperação.');
 try {
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

  await db.exec('truncate public.agency_members, public.agency_records, public.agency_audit, public.agency_requests');
  const userIds=new Set([...bundle.tables.agency_members.map(row=>row.user_id),...bundle.tables.agency_audit.map(row=>row.actor),...bundle.tables.agency_requests.map(row=>row.actor)].filter(Boolean));
  for(const id of userIds)await db.query('insert into auth.users(id) values($1) on conflict do nothing',[id]);
  for(const name of ['agency_members','agency_records','agency_audit','agency_requests']){
    for(const row of bundle.tables[name]) await db.query(`insert into public.${name} overriding system value select * from jsonb_populate_record(null::public.${name},$1::jsonb)`,[JSON.stringify(row)]);
    const recovered=(await db.query(`select to_jsonb(t) as row from public.${name} t`)).rows.map(result=>result.row);
    const normalize=value=>JSON.stringify(Object.fromEntries(Object.entries(value).map(([key,v])=>[key,['created_at','updated_at','deleted_at','happened_at'].includes(key) && typeof v==='string' ? new Date(v).toISOString() : v])),(_key,v)=>v && typeof v==='object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))) : v);
    assert.deepEqual(recovered.map(normalize).sort(),bundle.tables[name].map(normalize).sort(),`Dados divergentes na restauração de ${name}`);
  }
  for(const file of bundle.files){
    const target=join(temp,...file.path.split('/'));
    await mkdir(dirname(target),{recursive:true});
    await writeFile(target,Buffer.from(file.base64,'base64'),{flag:'wx'});
    assert.equal(sha256(await readFile(target)),file.sha256,'Evidência restaurada divergente');
  }
  await db.exec('set role authenticated');
  await assert.rejects(db.query('select * from public.agency_records'),/permission denied/);
  return {...verifyBundle(bundle),restored:true,scope:'operational-tables-and-evidence; excludes real Auth accounts, passwords and provider settings'};
 } finally {await db.close(); await rm(temp,{recursive:true,force:true});}
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 if(!process.argv[2])throw new Error('Informe um arquivo .backup para o ensaio isolado.');
 console.log(JSON.stringify(await drillBackup(decryptBackup(await readFile(process.argv[2]),process.env.BACKUP_ENCRYPTION_KEY)),null,2));
}
