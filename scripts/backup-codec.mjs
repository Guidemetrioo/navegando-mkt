import {createCipheriv,createDecipheriv,randomBytes,createHash} from 'node:crypto';
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
function keyBytes(encoded){const key=Buffer.from(encoded||'','base64');if(key.length!==32)throw new Error('BACKUP_ENCRYPTION_KEY deve ser uma chave aleatória de 32 bytes em Base64.');return key;}
export function encryptBackup(data,key){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',keyBytes(key),iv);const body=Buffer.concat([cipher.update(JSON.stringify(data),'utf8'),cipher.final()]);return Buffer.concat([Buffer.from('NAVEGANDO1'),iv,cipher.getAuthTag(),body]);}
export function decryptBackup(bytes,key){if(bytes.subarray(0,10).toString()!=='NAVEGANDO1')throw new Error('Formato de backup inválido.');const cipher=createDecipheriv('aes-256-gcm',keyBytes(key),bytes.subarray(10,22));cipher.setAuthTag(bytes.subarray(22,38));return JSON.parse(Buffer.concat([cipher.update(bytes.subarray(38)),cipher.final()]).toString('utf8'));}
export function verifyBundle(bundle){
 if(bundle?.version!==1||!bundle.tables||!Array.isArray(bundle.files))throw new Error('Pacote incompleto.');
 const files=new Map();
 for(const file of bundle.files){
   if(typeof file.path!=='string'||!file.path||file.path.includes('\\')||file.path.split('/').some(part=>!part||part==='.'||part==='..')||file.path.startsWith('/')||file.path.includes(':')||files.has(file.path)) throw new Error('Caminho de evidência inválido ou repetido.');
   if(typeof file.base64!=='string'||sha256(Buffer.from(file.base64,'base64'))!==file.sha256)throw new Error('Integridade de arquivo inválida.');
   files.set(file.path,file);
 }
 for(const name of ['agency_members','agency_records','agency_audit','agency_requests']){
   if(!Array.isArray(bundle.tables[name]))throw new Error(`Tabela ${name} ausente.`);
   if(bundle.manifest?.[name] && (bundle.manifest[name].count!==bundle.tables[name].length || bundle.manifest[name].sha256!==sha256(Buffer.from(JSON.stringify(bundle.tables[name]))))) throw new Error(`Manifesto divergente: ${name}.`);
 }
 for(const row of bundle.tables.agency_records){
   if(row.kind!=='pontos')continue;
   const path=row.data?.photo_storage_path || (row.data?.foto_url?.startsWith('private:ponto-evidencias/') ? row.data.foto_url.slice('private:ponto-evidencias/'.length) : null);
   if(!path)continue;
   const evidence=files.get(path);
   if(!evidence)throw new Error('Backup incompleto: foto referenciada não foi copiada.');
   if(row.data.evidence_sha256 && row.data.evidence_sha256!==evidence.sha256)throw new Error('Foto diverge da evidência registrada no ponto.');
 }
 return {files:bundle.files.length,records:bundle.tables.agency_records.length,createdAt:bundle.createdAt,schemaVersion:bundle.schemaVersion};
}
