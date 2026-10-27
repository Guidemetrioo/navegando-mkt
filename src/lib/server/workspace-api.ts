import { createClient } from '@/lib/supabase/server';
import { unstable_rethrow } from 'next/navigation';
import { HAS_CLOUD_CONFIG, IS_DEMO } from '@/lib/app-mode';
import type { CloudSnapshot } from '@/lib/workspace';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function requireMember() {
  if (IS_DEMO || !HAS_CLOUD_CONFIG) throw new ApiError(503, 'Base central ainda não configurada.');
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new ApiError(401, 'Entre novamente para continuar.');
  const result = await supabase.rpc('agency_snapshot');
  if (result.error) throw new ApiError(result.error.code === '42501' ? 403 : 503, result.error.code === '42501' ? 'Sua conta ainda não foi vinculada a um membro ativo da agência.' : 'Não foi possível consultar a base central.');
  return { supabase, user, snapshot: result.data as CloudSnapshot };
}
export function checkOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new ApiError(403, 'Origem da solicitação inválida.');
}
export async function readJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'Conteúdo obrigatório.');
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const {value, done} = await reader.read(); if (done) break;
    length += value.length;
    if (length > 3_000_000) { await reader.cancel(); throw new ApiError(413, 'Envie menos alterações ou uma foto menor.'); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ApiError(400, 'JSON inválido.'); }
}
export const privateHeaders = { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie' };
export function apiFailure(error: unknown) {
  unstable_rethrow(error);
  if (error instanceof ApiError) return Response.json({error:error.message}, {status:error.status,headers:privateHeaders});
  console.error(JSON.stringify({event:'workspace_request_failed',at:new Date().toISOString()}));
  return Response.json({error:'Não foi possível concluir a operação. Seu rascunho deve ser preservado.'}, {status:500,headers:privateHeaders});
}
export async function signEvidence(snapshot: CloudSnapshot, supabase: Awaited<ReturnType<typeof createClient>>) {
  const photos=snapshot.records.filter(row=>row.kind==='pontos' && typeof row.data.foto_url==='string' && row.data.foto_url.startsWith('private:ponto-evidencias/'));
  const paths=photos.map(row=>(row.data.foto_url as string).slice('private:ponto-evidencias/'.length));
  const signed=new Map<string,string>();
  for(let start=0;start<paths.length;start+=100) {
    const result=await supabase.storage.from('ponto-evidencias').createSignedUrls(paths.slice(start,start+100),3600);
    for(const item of result.data || []) if(item.path && item.signedUrl) signed.set(item.path,item.signedUrl);
  }
  for (const row of snapshot.records) {
    const photo = row.data.foto_url;
    if (row.kind !== 'pontos' || typeof photo !== 'string' || !photo.startsWith('private:ponto-evidencias/')) continue;
    const path = photo.slice('private:ponto-evidencias/'.length);
    row.data.photo_storage_path = path;
    row.data.foto_url = signed.get(path) || '';
  }
  return snapshot;
}
