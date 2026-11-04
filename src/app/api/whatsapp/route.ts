import { ApiError, apiFailure, checkOrigin, privateHeaders, readJson, requireMember } from '@/lib/server/workspace-api';
import { fetchWhatsAppBot, publicWhatsAppStatus } from '@/lib/server/whatsapp-gateway';
import { normalizeWhatsAppPhone, validPairingCode } from '@/lib/whatsapp-connection';

async function requireManager() {
  const { snapshot } = await requireMember();
  if (!['dono', 'gerente'].includes(snapshot.member.role)) throw new ApiError(403, 'Somente gestão administra o WhatsApp.');
}
export async function GET() {
  try {
    await requireManager();
    return Response.json(publicWhatsAppStatus(await fetchWhatsAppBot('/api/status')), { headers: privateHeaders });
  } catch (error) { return apiFailure(error); }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request); await requireManager();
    const body = await readJson(request) as Record<string, unknown>;
    if (body.action === 'connect') {
      return Response.json(publicWhatsAppStatus(await fetchWhatsAppBot('/api/status')), { headers: privateHeaders });
    }
    if (body.action === 'request-code') {
      const phone = normalizeWhatsAppPhone(String(body.phoneNumber || ''));
      if (!phone) throw new ApiError(400, 'Informe o número completo, com país e DDD.');
      const result = await fetchWhatsAppBot('/api/request-code', { phoneNumber: phone });
      if (!validPairingCode(result.pairingCode)) throw new ApiError(502, 'O serviço não retornou um código de pareamento válido.');
      return Response.json({ success: true, pairingCode: result.pairingCode }, { headers: privateHeaders });
    }
    if (body.action === 'logout') {
      const result = await fetchWhatsAppBot('/api/logout', {});
      if (result.success !== true) throw new ApiError(502, 'O serviço não confirmou a desconexão.');
      return Response.json({ success: true }, { headers: privateHeaders });
    }
    if (body.action === 'send') {
      const phone = normalizeWhatsAppPhone(String(body.phone || ''));
      if (!phone || typeof body.message !== 'string' || !body.message.trim() || body.message.length > 4096) throw new ApiError(400, 'Destinatário ou mensagem inválidos.');
      const result = await fetchWhatsAppBot('/api/send', { phone, message: body.message });
      if (result.success !== true) throw new ApiError(502, 'O serviço não confirmou o envio.');
      return Response.json({ success: true }, { headers: privateHeaders });
    }
    throw new ApiError(400, 'Ação inválida.');
  } catch (error) { return apiFailure(error); }
}
