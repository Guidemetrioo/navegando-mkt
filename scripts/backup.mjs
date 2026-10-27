import {createClient} from '@supabase/supabase-js';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {encryptBackup,decryptBackup,verifyBundle,sha256} from './backup-codec.mjs';
const arg=process.argv.indexOf('--out');if(arg<0)throw new Error('Informe --out com uma pasta segura para salvar o backup criptografado.');
const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url?.startsWith('https://')||!key||!process.env.BACKUP_ENCRYPTION_KEY)throw new Error('Configure as variáveis de backup no ambiente protegido.');
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const tables={};
for(const table of ['agency_members','agency_records','agency_audit','agency_requests']){
 const data=[];for(let from=0;;from+=500){let query=client.from(table).select('*');if(table==='agency_records')query=query.order('kind').order('id');else query=query.order(table==='agency_audit'?'seq':table==='agency_members'?'employee_id':'actor');if(table==='agency_requests')query=query.order('request_id');const page=await query.range(from,from+499);if(page.error)throw new Error(`Falha no backup de ${table}.`);data.push(...page.data);if(page.data.length<500)break;}tables[table]=data;
}
const files=[];
async function collect(prefix=''){
 for(let offset=0;;offset+=100){const result=await client.storage.from('ponto-evidencias').list(prefix,{limit:100,offset,sortBy:{column:'name',order:'asc'}});if(result.error)throw new Error('Falha ao listar os arquivos privados.');for(const entry of result.data){const path=prefix?`${prefix}/${entry.name}`:entry.name;if(!entry.id){await collect(path);continue;}const result=await client.storage.from('ponto-evidencias').download(path);if(result.error)throw new Error('Falha ao copiar evidência.');const bytes=Buffer.from(await result.data.arrayBuffer());files.push({path,base64:bytes.toString('base64'),sha256:sha256(bytes),contentType:result.data.type});}if(result.data.length<100)break;}
}
await collect();
const bundle={version:1,createdAt:new Date().toISOString(),source:url,tables,files,scope:'operational-data-and-evidence; excludes auth passwords and provider configuration'};
// A sequence of API reads is not an atomic database snapshot. Keep provider PITR enabled.
const encrypted=encryptBackup(bundle,process.env.BACKUP_ENCRYPTION_KEY);
const report=verifyBundle(decryptBackup(encrypted,process.env.BACKUP_ENCRYPTION_KEY));
const dir=resolve(process.argv[arg+1]);await mkdir(dir,{recursive:true});const file=join(dir,`navegando-${Date.now()}.backup`);await writeFile(file,encrypted,{flag:'wx',mode:0o600});
console.log(JSON.stringify({file,...report,note:'Cópia complementar. Mantenha o backup transacional do provedor e teste a restauração em homologação.'}));
