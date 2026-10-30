import { reverseStreet } from '@/lib/server/geocoding';
import { createHash } from 'node:crypto';
import { ApiError, apiFailure, checkOrigin, privateHeaders, readJson, requireMember, signEvidence } from '@/lib/server/workspace-api';
import { validateChanges } from '@/lib/workspace';
import type { CloudSnapshot } from '@/lib/workspace';

export async function GET() {
  try {
    const {supabase, snapshot} = await requireMember();
    return Response.json(await signEvidence(snapshot,supabase),{headers:privateHeaders});
  } catch (error) { return apiFailure(error); }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const {supabase,user} = await requireMember();
    const body = await readJson(request) as {changes?:unknown; requestId?:unknown};
    if (typeof body?.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.requestId)) throw new ApiError(400,'Identificador da operação inválido.');
    try { validateChanges(body.changes); } catch (error) { throw new ApiError(400,error instanceof Error ? error.message : 'Dados inválidos.'); }
    for (const row of body.changes) {
      if (row.kind !== 'pontos' || !row.data) continue;
      const photo = String(row.data.foto_url || '');
      const match = /^data:image\/(jpeg|png|webp);base64,([a-zA-Z0-9+/=]+)$/.exec(photo);
      if (!match || row.data.employee_id === undefined) throw new ApiError(400,'Foto real obrigatória.');
      const bytes = Buffer.from(match[2],'base64');
      if (bytes.length < 100 || bytes.length > 1_048_576) throw new ApiError(400,'A foto deve ter até 1 MB.');
      const isImage = match[1]==='jpeg' ? bytes[0]===255 && bytes[1]===216 && bytes[2]===255 : match[1]==='png' ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WEBP';
      if (!isImage) throw new ApiError(400,'Formato da foto inválido.');
      const path = `${user.id}/${body.requestId}/${row.id}.${match[1]}`;
      const upload = await supabase.storage.from('ponto-evidencias').upload(path,bytes,{contentType:`image/${match[1]}`,upsert:false});
      if (upload.error && !/already exists|duplicate/i.test(upload.error.message)) throw new ApiError(503,'A foto não foi armazenada. O ponto ainda não foi confirmado.');
      row.data.foto_url = `private:ponto-evidencias/${path}`;
      row.data.photo_storage_path = path;
      const address = await reverseStreet(Number(row.data.latitude),Number(row.data.longitude));
      delete row.data.rua; delete row.data.endereco; delete row.data.endereco_fonte;
      if(address) {row.data.rua=address.street;row.data.endereco=address.address;row.data.endereco_fonte=address.provider;}
      row.data.evidence_sha256 = createHash('sha256').update(bytes).digest('hex');
    }
    const result = await supabase.rpc('agency_commit',{p_changes:body.changes,p_request:body.requestId});
    if (result.error) {
      const conflict = ['40001','23505','23514'].includes(result.error.code);
      if (result.error.code==='42501') throw new ApiError(403,'Você não tem permissão para esta alteração.');
      if (conflict) throw new ApiError(409,result.error.message);
      // Business validation messages are authored in the RPC, never return raw SQL internals.
      if (result.error.code==='P0001') throw new ApiError(422,result.error.message);
      throw new ApiError(503,'Falha na base central. A operação não foi confirmada.');
    }
    return Response.json(await signEvidence(result.data as CloudSnapshot,supabase),{headers:privateHeaders});
  } catch (error) { return apiFailure(error); }
}
