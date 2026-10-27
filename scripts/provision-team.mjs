import {readFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
const roster=JSON.parse(await readFile(new URL('../config/team-roster.json',import.meta.url),'utf8'));
const index=process.argv.indexOf('--file');
if(index<0 || !process.argv[index+1]) throw new Error('Use --file config/team-emails.csv. Execute sem --apply para validar primeiro.');
function csvLine(line){const values=[];let current='',quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){current+='"';i++;}else quoted=!quoted;}else if(ch===','&&!quoted){values.push(current);current='';}else current+=ch;}if(quoted)throw new Error('CSV inválido.');values.push(current);return values;}
const lines=(await readFile(process.argv[index+1],'utf8')).replace(/^\uFEFF/,'').trim().split(/\r?\n/);
const header=csvLine(lines.shift());const idColumn=header.indexOf('employee_id'),emailColumn=header.indexOf('email');
if(idColumn<0||emailColumn<0)throw new Error('O CSV precisa das colunas employee_id e email.');
const emails=new Set(),ids=new Set();
const rows=lines.filter(Boolean).map(line=>{const fields=csvLine(line),id=fields[idColumn],email=fields[emailColumn]?.trim().toLowerCase();if(!roster.some(u=>u.employeeId===id)||!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||ids.has(id)||emails.has(email))throw new Error(`Cadastro incompleto ou duplicado: ${id}.`);ids.add(id);emails.add(email);return{id,email};});
console.log(`${rows.length} cadastros válidos. Nenhuma senha padrão será criada.`);
if(!process.argv.includes('--apply')){console.log('Validação concluída. Para enviar os convites e vincular as contas, repita com --apply.');process.exit(0);}
const url=process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,site=process.env.SITE_URL;
if(!url?.startsWith('https://')||!key||!site?.startsWith('https://'))throw new Error('Configure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e SITE_URL HTTPS no ambiente local protegido.');
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
for(const row of rows){
  const {data:member,error:lookup}=await client.from('agency_members').select('employee_id,user_id').eq('employee_id',row.id).single();
  if(lookup||!member)throw new Error(`Aplique as migrações antes de convidar ${row.id}.`);
  if(member.user_id){const existing=await client.auth.admin.getUserById(member.user_id);if(existing.error||existing.data.user.email?.toLowerCase()!==row.email)throw new Error(`O membro ${row.id} já está vinculado a outro e-mail. Nenhum acesso foi trocado.`);console.log(`${row.id}: já vinculado.`);continue;}
  const invitation=await client.auth.admin.inviteUserByEmail(row.email,{redirectTo:`${site.replace(/\/$/,'')}/auth/callback?next=/account/password`});
  if(invitation.error||!invitation.data.user)throw new Error(`Convite de ${row.id} não concluído. Confira o painel Auth antes de repetir.`);
  const linked=await client.from('agency_members').update({user_id:invitation.data.user.id}).eq('employee_id',row.id).is('user_id',null).select('employee_id');
  if(linked.error||linked.data?.length!==1)throw new Error(`Conta criada, mas vínculo de ${row.id} pendente. Vincule o UUID em agency_members pelo painel administrativo antes de reenviar.`);
  console.log(`${row.id}: convite enviado e conta vinculada.`);
}
