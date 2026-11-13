// Read-only preflight: never changes database, credentials, or provider settings.
const checks=[];
function record(name,ok,detail){checks.push({name,ok,detail});}
const configured=value=>Boolean(value&&!/SUA-|SEU-|placeholder/i.test(value));
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
record('Modo de produção',process.env.NEXT_PUBLIC_APP_MODE==='production','Demonstração não é base central.');
record('Conexão pública configurada',configured(url)&&configured(key),'A presença das variáveis não confirma autenticação de funcionários.');
if(configured(url)&&configured(key)) {
  try {
    const target=new URL(url);
    if(target.protocol!=='https:'||target.username||target.password) throw new Error('invalid endpoint');
    const response=await fetch(new URL('/rest/v1/rpc/agency_workspace_version',target),{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(10000)});
    const version=await response.json();
    record('Banco acessível',response.ok&&[2,3].includes(version),'Consulta pública somente da versão do esquema.');
    record('Migração de durabilidade',response.ok&&version===3,version===2?'Versão 2: aplicar supabase/migrations/007_durability.sql.':'Necessária versão 3.');
  } catch {record('Banco acessível',false,'Consulta não concluída; confira rede e configuração.');}
}
record('Credencial administrativa local',configured(process.env.SUPABASE_SERVICE_ROLE_KEY),'Verificação apenas de preenchimento; nunca envia nem exibe esta chave.');
const encryption=process.env.BACKUP_ENCRYPTION_KEY||'';
record('Chave de backup local',/^[A-Za-z0-9+/]+={0,2}$/.test(encryption)&&Buffer.from(encryption,'base64').length===32,'Guarde-a fora do repositório e dos arquivos de backup.');
record('URL do aplicativo administrativo',configured(process.env.SITE_URL),'Configuração local, sem validação do domínio publicado.');
for(const c of checks) console.log(`${c.ok?'OK':'PENDENTE'} | ${c.name} | ${c.detail}`);
console.log('Este diagnóstico não comprova backup automático, restauração, disponibilidade, políticas remotas ou sincronização entre dispositivos.');
process.exitCode=checks.some(c=>!c.ok)?1:0;
