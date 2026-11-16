import type { Employee, EventStatus, EventTipo, WhatsAppConfirmacaoInfo } from '@/types/database';
import { enumerateIsoDates, todayInSaoPaulo } from './date-utils';

/** Guarantees valid HH:mm interval with hora_fim strictly after hora_inicio. */
export function normalizeScheduleTimes(
  startInput?: string | null,
  endInput?: string | null
): { hora_inicio: string; hora_fim: string } {
  const validTime = (val?: string | null) =>
    typeof val === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(val.trim())
      ? val.trim().slice(0, 5)
      : '';

  let start = validTime(startInput) || '09:00';
  let end = validTime(endInput);

  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  let startMin = toMinutes(start);
  if (startMin >= 23 * 60 + 59) {
    start = '23:00';
    startMin = 23 * 60;
  }

  if (!end || toMinutes(end) <= startMin) {
    const bumped = Math.min(23 * 60 + 59, startMin + 60);
    const bh = String(Math.floor(bumped / 60)).padStart(2, '0');
    const bm = String(bumped % 60).padStart(2, '0');
    end = `${bh}:${bm}`;
  }

  return { hora_inicio: start, hora_fim: end };
}

export interface NormalizeEventParams {
  id?: string;
  clientId: string;
  date?: string;
  fallbackDate?: string;
  isMultiDay?: boolean;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  tipo?: EventTipo;
  local?: string;
  observacoes?: string;
  tempoAntecedenciaMinutos?: number;
  status?: EventStatus;
  selectedEmployeeIds?: string[];
  employees?: Employee[];
  existingWhatsappConfirmacao?: WhatsAppConfirmacaoInfo;
}

/** Normalizes any appointment input—even incomplete—into a schema-safe payload. */
export function buildNormalizedEventPayload(params: NormalizeEventParams) {
  const validIso = (d?: string | null) =>
    typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.trim()) ? d.trim() : '';

  const data = validIso(params.date) || validIso(params.fallbackDate) || todayInSaoPaulo();
  const { hora_inicio, hora_fim } = normalizeScheduleTimes(params.startTime, params.endTime);

  const safeTipo: EventTipo = ['gravacao', 'foto', 'edicao', 'reuniao'].includes(String(params.tipo))
    ? (params.tipo as EventTipo)
    : 'gravacao';

  // Production DB check allows ('agendado', 'realizado', 'cancelado'); keep 'confirmado' inside confirmacao_whatsapp.
  const isConfirmed = params.status === 'confirmado';
  const safeStatus: 'agendado' | 'realizado' | 'cancelado' =
    params.status === 'realizado' || params.status === 'cancelado' ? params.status : 'agendado';

  const confirmacao_whatsapp: WhatsAppConfirmacaoInfo | undefined = isConfirmed
    ? {
        ...(params.existingWhatsappConfirmacao || { enviado: true }),
        enviado: params.existingWhatsappConfirmacao?.enviado ?? true,
        status_resposta: 'confirmado',
      }
    : params.existingWhatsappConfirmacao;

  const activeEmployeeIds = new Set(
    (params.employees || []).filter((e) => e.ativo !== false).map((e) => e.id)
  );
  const assigned_employee_ids = Array.from(
    new Set(
      (params.selectedEmployeeIds || []).filter((id) =>
        params.employees && params.employees.length > 0 ? activeEmployeeIds.has(id) : Boolean(id)
      )
    )
  );

  let resolvedEndDate: string | undefined;
  if (params.isMultiDay && validIso(params.endDate) && validIso(params.endDate) > data) {
    const span = enumerateIsoDates(data, validIso(params.endDate), 31);
    if (span.length > 1) {
      resolvedEndDate = span[span.length - 1];
    }
  }

  return {
    id: params.id || undefined,
    client_id: params.clientId,
    tipo: safeTipo,
    data,
    ...(resolvedEndDate ? { endDate: resolvedEndDate } : {}),
    hora_inicio,
    hora_fim,
    local: params.local || undefined,
    observacoes: params.observacoes || undefined,
    tempo_antecedencia_minutos:
      typeof params.tempoAntecedenciaMinutos === 'number' ? params.tempoAntecedenciaMinutos : -1,
    status: safeStatus,
    ...(confirmacao_whatsapp ? { confirmacao_whatsapp } : {}),
    assigned_employee_ids,
  };
}
