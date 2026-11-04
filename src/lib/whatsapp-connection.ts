import type { WhatsAppConfig } from '../types/database';

export function validWhatsAppQr(value: unknown): value is string {
  return typeof value === 'string' && value.length > 80 && value.length < 4096
    && value.split(',').length >= 4 && !/NavegandoMKT|\s/.test(value);
}
export function validPairingCode(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Z0-9]{8}$/i.test(value.replace(/-/g, ''))
    && !['NV84-29KT','NV8429KT'].includes(value.toUpperCase());
}
export function whatsappConnection(data: Record<string, unknown>): Pick<WhatsAppConfig, 'conectado' | 'status' | 'qr_code' | 'pairing_code' | 'numero_conectado'> {
  const connected = data.online === true && (data.status === 'ready' || data.status === 'connected');
  return {
    conectado: connected,
    status: connected ? 'conectado' : data.online === true ? 'gerando_qrcode' : 'desconectado',
    qr_code: !connected && validWhatsAppQr(data.qrCode) ? data.qrCode : undefined,
    pairing_code: !connected && validPairingCode(data.pairingCode) ? data.pairingCode : undefined,
    numero_conectado: connected && typeof data.phoneNumber === 'string' ? data.phoneNumber : '',
  };
}
export function normalizeWhatsAppPhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  const phone = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  return /^[1-9]\d{10,14}$/.test(phone) ? phone : null;
}
