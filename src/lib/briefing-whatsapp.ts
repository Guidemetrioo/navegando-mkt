import type { EventItem } from '@/types/database';

export interface WhatsAppBriefingItem {
  titulo?: string | null;
  roteiro?: string | null;
  refUrl?: string | null;
  refsExtras?: { rotulo?: string; url?: string }[];
}

export function formatBriefingDateBr(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

export function normalizeBriefingUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/**
 * Monta o documento formatado do Briefing de Gravação exatamente como é enviado no WhatsApp.
 */
export function formatWhatsAppBriefingDocument(
  ev: Pick<EventItem, 'data' | 'hora_inicio' | 'hora_fim' | 'client'>,
  items: WhatsAppBriefingItem[],
  clientName?: string | null
): string {
  const nomeCliente = clientName || ev.client?.nome || 'Restaurante Parceiro';
  const dataFmt = formatBriefingDateBr(ev.data);
  const horario = `${(ev.hora_inicio || '').slice(0, 5)} às ${(ev.hora_fim || '').slice(0, 5)}`;

  const filled = items.filter(
    (d) =>
      Boolean((d.roteiro || '').trim()) ||
      Boolean((d.titulo || '').trim()) ||
      Boolean((d.refUrl || '').trim()) ||
      Boolean(d.refsExtras?.some((ref) => Boolean((ref.url || '').trim())))
  );

  const header = [
    `📋 *DOCUMENTO DE BRIEFING DE GRAVAÇÃO — NAVEGANDO MKT*`,
    `🍽️ *Cliente:* ${nomeCliente}`,
    `📅 *Data da Gravação:* ${dataFmt} (${horario})`,
    `🎬 *Total de Vídeos Planejados:* ${filled.length}`,
    `----------------------------------------`,
  ].join('\n');

  const body =
    filled.length > 0
      ? filled
          .map((v, idx) => {
            const num = String(idx + 1).padStart(2, '0');
            const title = (v.titulo || '').trim();
            const titlePart = title ? ` — *${title}*` : '';
            const refLines: string[] = [];
            if ((v.refUrl || '').trim()) {
              refLines.push(`🔗 Referência: ${normalizeBriefingUrl((v.refUrl || '').trim())}`);
            }
            for (const extra of v.refsExtras || []) {
              if ((extra.url || '').trim()) {
                refLines.push(
                  `🔗 ${extra.rotulo || 'Referência'}: ${normalizeBriefingUrl((extra.url || '').trim())}`
                );
              }
            }
            const refPart = refLines.length > 0 ? `\n${refLines.join('\n')}` : '';
            return `🎥 *VÍDEO ${num}*${titlePart}\n${(v.roteiro || '').trim() || 'Roteiro em definição.'}${refPart}`;
          })
          .join('\n\n')
      : 'Roteiros em preparação pela equipe Navegando MKT.';

  const footer = [
    `----------------------------------------`,
    `✅ *Documento gerado pela Central Criativa Navegando MKT para visualização e alinhamento com o cliente.*`,
  ].join('\n');

  return `${header}\n\n${body}\n\n${footer}`;
}

export function buildWhatsAppBriefingShareUrl(docText: string, rawContact?: string | null): string {
  const rawDigits = (rawContact || '').replace(/\D/g, '');
  const phone =
    rawDigits.length >= 10
      ? rawDigits.startsWith('55')
        ? rawDigits
        : `55${rawDigits}`
      : '';
  const encoded = encodeURIComponent(docText);
  return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}
