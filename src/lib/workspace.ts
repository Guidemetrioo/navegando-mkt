import type { Employee, Client, EventItem, PontoRegistro, MediaDeliverable, ReelMetric, ClientMention, TeamRole } from '../types/database';

export interface Workspace {
  employees: Employee[];
  clients: Client[];
  events: EventItem[];
  pontos: PontoRegistro[];
  deliverables: MediaDeliverable[];
  reels: ReelMetric[];
  mentions: ClientMention[];
}
export const ENTITY_KEYS = ['employees', 'clients', 'events', 'pontos', 'deliverables', 'reels', 'mentions'] as const;
export type Entity = typeof ENTITY_KEYS[number];
export interface Member { employee_id: string; role: TeamRole; user_id: string; }
export interface CloudRecord { kind: Entity; id: string; data: Record<string, unknown>; revision: number; }
export interface CloudSnapshot { member: Member; records: CloudRecord[]; }
export interface Change { kind: Entity; id: string; expected: number; data: Record<string, unknown> | null; }
export const emptyWorkspace = (): Workspace => ({ employees: [], clients: [], events: [], pontos: [], deliverables: [], reels: [], mentions: [] });
export const isManager = (role: TeamRole | undefined) => role === 'dono' || role === 'gerente';
const modules: Record<TeamRole, readonly string[]> = {
  dono: ['home','dashboard','mes','semana','escala','minha-agenda','ponto','relatorios','briefing','reembolsos','arquivos','clientes','metricas-reels','mural-ugc','backups','financeiro','whatsapp'],
  gerente: ['home','dashboard','mes','semana','escala','minha-agenda','ponto','relatorios','briefing','reembolsos','arquivos','clientes','metricas-reels','mural-ugc','backups','financeiro','whatsapp'],
  filmmaker: ['home','mes','semana','escala','minha-agenda','ponto','relatorios','briefing','reembolsos','arquivos','metricas-reels'],
  modelo: ['home','mes','semana','minha-agenda','ponto','briefing','reembolsos'],
  criadora: ['home','mes','semana','minha-agenda','ponto','briefing','reembolsos'],
  interno: ['home','mes','semana','minha-agenda','ponto','briefing','reembolsos','arquivos'],
};
export function mayAccess(role: TeamRole | undefined, view: string): boolean {
  return role !== undefined && (modules[role]?.includes(view) ?? false);
}

/** Relationship objects are reconstructed for display and never stored recursively. */
export function canonical(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Registro inválido.');
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    if (['client','employee','employees','event','filmmaker','criadora'].includes(key)) continue;
    const entry = (value as Record<string, unknown>)[key];
    if (entry !== undefined) result[key] = stable(entry);
  }
  if (typeof result.photo_storage_path === 'string') result.foto_url = `private:ponto-evidencias/${result.photo_storage_path}`;
  return result;
}
function stable(value:unknown):unknown {
  if(Array.isArray(value)) return value.map(stable);
  if(value && typeof value==='object') return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)]));
  return value;
}
export const same = (a: unknown, b: unknown) => JSON.stringify(a && typeof a === 'object' ? canonical(a) : a) === JSON.stringify(b && typeof b === 'object' ? canonical(b) : b);
export function workspaceFrom(snapshot: CloudSnapshot): Workspace {
  const data = emptyWorkspace();
  for (const record of snapshot.records) {
    if (ENTITY_KEYS.includes(record.kind)) (data[record.kind] as unknown[]).push(structuredClone(record.data));
  }
  return data;
}
export function diffWorkspace(base: CloudSnapshot, local: Workspace): Change[] {
  const changes: Change[] = [];
  for (const kind of ENTITY_KEYS) {
    if (kind === 'employees') continue; // Membership is provisioned by an administrator outside the browser.
    const before = new Map(base.records.filter(r => r.kind === kind).map(r => [r.id, r]));
    for (const row of local[kind]) {
      const old = before.get(row.id);
      const data = canonical(row);
      if (!old || !same(old.data, data)) changes.push({kind, id: row.id, expected: old?.revision ?? 0, data});
      before.delete(row.id);
    }
    for (const old of before.values()) changes.push({kind, id: old.id, expected: old.revision, data: null});
  }
  return changes;
}
/** A response cannot overwrite edits made while that request was in flight. */
export function mergeWorkspace(sent: Workspace, latest: Workspace, remote: Workspace): Workspace {
  const merged = emptyWorkspace();
  for (const kind of ENTITY_KEYS) {
    const before = new Map(sent[kind].map(row => [row.id, row]));
    const now = new Map(latest[kind].map(row => [row.id, row]));
    const cloud = new Map(remote[kind].map(row => [row.id, row]));
    for (const id of new Set([...before.keys(), ...now.keys(), ...cloud.keys()])) {
      const local = now.get(id);
      const picked = same(before.get(id), local) ? cloud.get(id) : local;
      if (picked) (merged[kind] as unknown[]).push(picked);
    }
  }
  return merged;
}

export function validateChanges(value: unknown): asserts value is Change[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 100) throw new Error('Envie de 1 a 100 alterações por operação.');
  const ids = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== 'object') throw new Error('Alteração inválida.');
    const row = item as Change;
    if (!ENTITY_KEYS.includes(row.kind) || row.kind === 'employees' || typeof row.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(row.id)) throw new Error('Identificador inválido.');
    if (!Number.isSafeInteger(row.expected) || row.expected < 0) throw new Error('Versão inválida.');
    const key = `${row.kind}/${row.id}`;
    if (ids.has(key)) throw new Error('Registro repetido na mesma operação.');
    ids.add(key);
    if (row.data === null) continue;
    if (!row.data || typeof row.data !== 'object' || Array.isArray(row.data) || row.data.id !== row.id) throw new Error('Dados do registro inválidos.');
    if (JSON.stringify(row.data).length > 1_500_000) throw new Error('Registro excede o tamanho permitido.');
    for (const [field, entry] of Object.entries(row.data)) {
      if (typeof entry === 'string' && (field.endsWith('_url') || field.endsWith('_link') || field === 'link_postado') && entry && !(field === 'foto_url' && /^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(entry))) {
        try { if (new URL(entry).protocol !== 'https:') throw new Error(); } catch { throw new Error(`Use um endereço HTTPS válido em ${field}.`); }
      }
    }
    if (row.kind === 'clients' && (typeof row.data.nome !== 'string' || !row.data.nome.trim())) throw new Error('Informe o nome do restaurante.');
    if (row.kind === 'events') {
      const d = row.data;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d.data)) || !/^\d{2}:\d{2}(:\d{2})?$/.test(String(d.hora_inicio)) || !/^\d{2}:\d{2}(:\d{2})?$/.test(String(d.hora_fim)) || String(d.hora_fim) <= String(d.hora_inicio)) throw new Error('Data ou intervalo da gravação inválido.');
      if (!['gravacao','foto','edicao','reuniao'].includes(String(d.tipo)) || !['agendado','realizado','cancelado'].includes(String(d.status)) || !Array.isArray(d.assigned_employee_ids)) throw new Error('Dados da gravação inválidos.');
    }
    if (row.kind === 'pontos') {
      const d = row.data;
      if (!['entrada','almoco','saida'].includes(String(d.tipo)) || typeof d.latitude !== 'number' || !Number.isFinite(d.latitude) || Math.abs(d.latitude) > 90 || typeof d.longitude !== 'number' || !Number.isFinite(d.longitude) || Math.abs(d.longitude) > 180 || typeof d.precisao_metros !== 'number' || d.precisao_metros <= 0 || typeof d.foto_url !== 'string' || !d.foto_url.startsWith('data:image/')) throw new Error('Ponto exige foto e coordenadas reais com precisão válida.');
    }
    if (row.kind === 'deliverables' && (!['captado_raw','em_edicao','aguardando_aprovacao','ajustes_solicitados','aprovado','publicado'].includes(String(row.data.status)) || !String(row.data.titulo || '').trim())) throw new Error('Entregável inválido.');
  }
}
