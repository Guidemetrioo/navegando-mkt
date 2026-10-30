'use client';
import type { Workspace } from './workspace';
export interface SystemBackupPayload { version:string; exportedAt:string; agencyName:string; data:Workspace; }
export const STORAGE_KEYS={EMPLOYEES:'navegando_mkt_employees_v2',CLIENTS:'navegando_mkt_clients_v2',EVENTS:'navegando_mkt_events_v2',PONTOS:'navegando_mkt_pontos_v2',DELIVERABLES:'navegando_mkt_deliverables_v2',REELS:'navegando_mkt_reels_v2',MENTIONS:'navegando_mkt_mentions_v2',LAST_BACKUP:'navegando_mkt_last_backup_time'} as const;
export function loadFromStorage<T>(key:string,fallback:T):T {
  if(typeof window==='undefined') return fallback;
  try {const raw=localStorage.getItem(key);return raw===null ? fallback : JSON.parse(raw) as T;}
  catch {return fallback;}
}
/** Never truncate records or photographs to make a write fit. A failed write stays failed. */
export function saveToStorage<T>(key:string,value:T):boolean {
  if(typeof window==='undefined') return false;
  try {localStorage.setItem(key,JSON.stringify(value));return true;}
  catch {return false;}
}
export function validateBackup(value:unknown):SystemBackupPayload {
  if(!value || typeof value!=='object') throw new Error('Backup inválido.');
  const backup=value as SystemBackupPayload;
  if(typeof backup.version!=='string' || backup.agencyName!=='Navegando MKT' || !backup.data || !Number.isFinite(Date.parse(backup.exportedAt))) throw new Error('Identificação do backup inválida.');
  for(const kind of ['employees','clients','events','pontos','deliverables','reels','mentions'] as const) {
    const rows=backup.data[kind];
    if(!Array.isArray(rows)) throw new Error(`Lista ${kind} ausente.`);
    const ids=new Set<string>();
    for(const row of rows) {
      if(!row || typeof row!=='object' || typeof row.id!=='string' || !row.id || ids.has(row.id)) throw new Error(`Registro inválido ou repetido em ${kind}.`);
      ids.add(row.id);
    }
  }
  for(const kind of ['despesas','transacoes','salarios'] as const) {
    if(backup.data[kind]===undefined) (backup.data[kind] as unknown[])=[];
    if(!Array.isArray(backup.data[kind])) throw new Error(`Lista ${kind} inválida.`);
  }
  const clients=new Set(backup.data.clients.map(c=>c.id));
  const employees=new Set(backup.data.employees.map(e=>e.id));
  for(const event of backup.data.events) if(!clients.has(event.client_id) || !Array.isArray(event.assigned_employee_ids) || event.assigned_employee_ids.some(id=>!employees.has(id))) throw new Error('A agenda referencia registros inexistentes.');
  for(const row of backup.data.pontos) if(!employees.has(row.employee_id)) throw new Error('Ponto sem colaborador correspondente.');
  return backup;
}
export function downloadSystemBackup(payload:SystemBackupPayload):boolean {
  try {
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=`navegando-exportacao-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    saveToStorage(STORAGE_KEYS.LAST_BACKUP,new Date().toISOString());
    return true;
  } catch {return false;}
}
export async function parseBackupFile(file:File):Promise<SystemBackupPayload> {
  if(file.size>30_000_000) throw new Error('Arquivo muito grande para uma restauração local.');
  return validateBackup(JSON.parse(await file.text()));
}
