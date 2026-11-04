import { ApiError } from './workspace-api';
import { validWhatsAppQr, validPairingCode } from '../whatsapp-connection';

export function whatsappGatewayConfig() {
  const raw = process.env.WHATSAPP_BOT_URL;
  if (!raw) throw new ApiError(503, 'Configure o serviço WhatsApp no servidor. Nenhum QR Code de demonstração será gerado.');
  let url: URL;
  try { url = new URL(raw); } catch { throw new ApiError(503, 'Endereço do serviço WhatsApp inválido.'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || (url.protocol !== 'https:' && !(local && url.protocol === 'http:' && !process.env.VERCEL))) {
    throw new ApiError(503, 'O serviço WhatsApp precisa de HTTPS; localhost funciona somente no computador do servidor.');
  }
  if (process.env.VERCEL && local) throw new ApiError(503, 'Na Vercel, configure o endereço HTTPS de um serviço WhatsApp permanente.');
  if (!local && !process.env.WHATSAPP_BOT_TOKEN) throw new ApiError(503, 'Configure a autenticação do serviço WhatsApp no servidor.');
  return { base: url.href.replace(/\/$/, ''), token: process.env.WHATSAPP_BOT_TOKEN };
}
export async function fetchWhatsAppBot(endpoint: string, body?: Record<string, unknown>) {
  const { base, token } = whatsappGatewayConfig();
  let response: Response;
  try {
    response = await fetch(`${base}${endpoint}`, {
      method: body ? 'POST' : 'GET',
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(12000), cache: 'no-store', redirect: 'error',
    });
  } catch { throw new ApiError(503, 'Serviço WhatsApp indisponível. Confira se o processo está ativo e acessível pelo servidor do CRM.'); }
  if (!response.ok) throw new ApiError(response.status === 429 ? 429 : 502, response.status === 429 ? 'Muitas tentativas. Aguarde antes de solicitar outro código.' : 'O serviço WhatsApp recusou a operação. Confira os logs do serviço.');
  try { return await response.json() as Record<string, unknown>; }
  catch { throw new ApiError(502, 'Resposta inválida do serviço WhatsApp.'); }
}

let lastQr = ''; let firstSeen = 0;
export function publicWhatsAppStatus(data: Record<string, unknown>, now = Date.now()) {
  const connected = data.status === 'ready' || data.status === 'connected';
  const qr = !connected && validWhatsAppQr(data.qrCode) ? data.qrCode : '';
  if (qr !== lastQr) { lastQr = qr; firstSeen = now; }
  const notExpired = typeof data.qrExpiresAt === 'number' ? now < data.qrExpiresAt : now - firstSeen < 60000;
  return {
    online: true, status: connected ? String(data.status) : String(data.status || 'disconnected'), conectado: connected,
    qrCode: qr && notExpired ? qr : null,
    pairingCode: !connected && validPairingCode(data.pairingCode) ? data.pairingCode : null,
    phoneNumber: connected && typeof data.phoneNumber === 'string' ? data.phoneNumber : null,
  };
}
