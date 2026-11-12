import { createClient } from '@/lib/supabase/server';
import { unstable_rethrow } from 'next/navigation';
import { HAS_CLOUD_CONFIG, IS_DEMO } from '@/lib/app-mode';
import { identifyEmployeeFromLogin } from '@/lib/employee-login-matcher';
import { readTeamSessionCookie } from '@/lib/server/team-session';
import { INITIAL_CLIENTS, INITIAL_EMPLOYEES, INITIAL_EVENTS } from '@/lib/supabase/mock-data';
import type { Change, CloudRecord, CloudSnapshot } from '@/lib/workspace';
import type { TeamRole } from '@/types/database';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Estado compartilhado em memória para membros autenticados via sessão da equipe ou fallback 42501
const sharedFallbackRecords = new Map<string, CloudRecord>();
let fallbackSeeded = false;

function ensureFallbackSeeded() {
  if (fallbackSeeded) return;
  fallbackSeeded = true;
  for (const e of INITIAL_EMPLOYEES) {
    sharedFallbackRecords.set(`employees/${e.id}`, {
      kind: 'employees',
      id: e.id,
      revision: 1,
      data: structuredClone(e) as unknown as Record<string, unknown>,
    });
  }
  for (const c of INITIAL_CLIENTS) {
    sharedFallbackRecords.set(`clients/${c.id}`, {
      kind: 'clients',
      id: c.id,
      revision: 1,
      data: structuredClone(c) as unknown as Record<string, unknown>,
    });
  }
  for (const ev of INITIAL_EVENTS) {
    sharedFallbackRecords.set(`events/${ev.id}`, {
      kind: 'events',
      id: ev.id,
      revision: 1,
      data: structuredClone(ev) as unknown as Record<string, unknown>,
    });
  }
}

export function buildFallbackSnapshot(
  employeeId: string,
  role: TeamRole,
  userId: string
): CloudSnapshot {
  ensureFallbackSeeded();
  const isMgmt = role === 'dono' || role === 'gerente';
  const records: CloudRecord[] = [];

  for (const rec of sharedFallbackRecords.values()) {
    if (rec.kind === 'clients' && !isMgmt) {
      const c = rec.data;
      records.push({
        kind: 'clients',
        id: rec.id,
        revision: rec.revision,
        data: {
          id: rec.id,
          nome: c.nome,
          endereco: c.endereco,
          latitude: c.latitude,
          longitude: c.longitude,
          drive_folder_url: c.drive_folder_url,
          cardapio_link: c.cardapio_link,
        },
      });
    } else if (
      !isMgmt &&
      ['pontos', 'despesas', 'transacoes', 'banco_horas'].includes(rec.kind) &&
      rec.data.employee_id !== employeeId
    ) {
      continue;
    } else if (!isMgmt && rec.kind === 'salarios') {
      continue;
    } else {
      records.push(structuredClone(rec));
    }
  }

  return {
    member: {
      employee_id: employeeId,
      role,
      user_id: userId,
    },
    records,
  };
}

export function applyFallbackChanges(
  employeeId: string,
  role: TeamRole,
  userId: string,
  changes: Change[]
): CloudSnapshot {
  ensureFallbackSeeded();
  for (const change of changes) {
    const key = `${change.kind}/${change.id}`;
    const existing = sharedFallbackRecords.get(key);
    if (change.data === null) {
      sharedFallbackRecords.delete(key);
    } else {
      sharedFallbackRecords.set(key, {
        kind: change.kind,
        id: change.id,
        revision: (existing?.revision ?? 0) + 1,
        data: structuredClone(change.data),
      });
    }
  }
  return buildFallbackSnapshot(employeeId, role, userId);
}

export async function requireMember() {
  if (IS_DEMO || !HAS_CLOUD_CONFIG) throw new ApiError(503, 'Base central ainda não configurada.');
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // 1. Se não há sessão ativa no Supabase Auth, verifica o cookie de sessão da equipe Navegando MKT
  if (error || !user) {
    const teamSession = await readTeamSessionCookie();
    if (teamSession) {
      const snapshot = buildFallbackSnapshot(
        teamSession.employeeId,
        teamSession.role,
        teamSession.userId
      );
      return {
        supabase,
        user: { id: teamSession.userId, email: teamSession.email },
        snapshot,
        schemaVersion: 2,
        isFallbackMember: true,
      };
    }
    throw new ApiError(401, 'Entre novamente para continuar.');
  }

  const version = await supabase.rpc('agency_workspace_version');
  if (version.error || (version.data !== 2 && version.data !== 3)) {
    throw new ApiError(503, 'Execute as migrações da base central antes de usar o sistema.');
  }

  const result = await supabase.rpc('agency_snapshot');
  if (result.error) {
    if (result.error.code === '42501') {
      // Conta autenticada no Supabase Auth mas ainda sem user_id vinculado em agency_members
      const matched = identifyEmployeeFromLogin(
        user.email,
        user.user_metadata as Record<string, unknown> | undefined
      );
      if (matched) {
        const snapshot = buildFallbackSnapshot(matched.employee.id, matched.role, user.id);
        return {
          supabase,
          user,
          snapshot,
          schemaVersion: version.data as number,
          isFallbackMember: true,
        };
      }
      // Também verifica se há cookie de equipe ativo
      const teamSession = await readTeamSessionCookie();
      if (teamSession) {
        const snapshot = buildFallbackSnapshot(
          teamSession.employeeId,
          teamSession.role,
          user.id
        );
        return {
          supabase,
          user,
          snapshot,
          schemaVersion: version.data as number,
          isFallbackMember: true,
        };
      }
      throw new ApiError(403, 'Sua conta ainda não foi vinculada a um membro ativo da agência.');
    }
    throw new ApiError(503, 'Não foi possível consultar a base central.');
  }

  return {
    supabase,
    user,
    snapshot: result.data as CloudSnapshot,
    schemaVersion: version.data as number,
    isFallbackMember: false,
  };
}

export function checkOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    throw new ApiError(403, 'Origem da solicitação inválida.');
}

export async function readJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'Conteúdo obrigatório.');
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 3_000_000) {
      await reader.cancel();
      throw new ApiError(413, 'Envie menos alterações ou uma foto menor.');
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ApiError(400, 'JSON inválido.');
  }
}

export const privateHeaders = { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie' };

export function apiFailure(error: unknown) {
  unstable_rethrow(error);
  if (error instanceof ApiError)
    return Response.json({ error: error.message }, { status: error.status, headers: privateHeaders });
  console.error(JSON.stringify({ event: 'workspace_request_failed', at: new Date().toISOString() }));
  return Response.json(
    { error: 'Não foi possível concluir a operação. Seu rascunho deve ser preservado.' },
    { status: 500, headers: privateHeaders }
  );
}

export async function signEvidence(
  snapshot: CloudSnapshot,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const photos = snapshot.records.filter(
    (row) =>
      row.kind === 'pontos' &&
      typeof row.data.foto_url === 'string' &&
      row.data.foto_url.startsWith('private:ponto-evidencias/')
  );
  const paths = photos.map((row) =>
    (row.data.foto_url as string).slice('private:ponto-evidencias/'.length)
  );
  const signed = new Map<string, string>();
  for (let start = 0; start < paths.length; start += 100) {
    const result = await supabase.storage
      .from('ponto-evidencias')
      .createSignedUrls(paths.slice(start, start + 100), 3600);
    for (const item of result.data || [])
      if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
  }
  for (const row of snapshot.records) {
    const photo = row.data.foto_url;
    if (
      row.kind !== 'pontos' ||
      typeof photo !== 'string' ||
      !photo.startsWith('private:ponto-evidencias/')
    )
      continue;
    const path = photo.slice('private:ponto-evidencias/'.length);
    row.data.photo_storage_path = path;
    row.data.foto_url = signed.get(path) || '';
  }
  return snapshot;
}
