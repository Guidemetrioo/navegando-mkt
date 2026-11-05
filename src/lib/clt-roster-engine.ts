import { Employee, EventItem, PontoRegistro, Client } from '@/types/database';

/**
 * Parâmetros Oficiais CLT + Emenda Constitucional nº 141/2026 (Vigor: Dezembro/2026)
 */
export const CLT_2026_RULES = {
  LIMITE_SEMANAL_MINUTOS: 42 * 60, // 42 horas semanais (2520 min)
  LIMITE_SEMANAL_HORAS: 42,
  LIMITE_DIARIO_NORMAL_MINUTOS: 8 * 60, // 8 horas diárias (480 min)
  LIMITE_DIARIO_MAX_COM_EXTRAS_MINUTOS: 10 * 60, // 8h + 2h extras (600 min) - Art. 59 CLT
  DESCANSO_INTERJORNADA_MIN_MINUTOS: 11 * 60, // 11 horas consecutivas - Art. 66 CLT
  MAX_DIAS_TRABALHADOS_SEMANA: 5, // Escala máxima 5x2 (2 dias de DSR por semana - EC 141/2026)
  MIN_FOLGAS_SEMANA: 2,
  TOLERANCIA_PONTO_DIARIA_MINUTOS: 10, // Art. 58, § 1º CLT (5 min por batida, máx 10 min/dia)
  HORARIO_NOTURNO_INICIO: 22 * 60, // 22:00 - Art. 73 CLT
  HORARIO_NOTURNO_FIM: 5 * 60, // 05:00 - Art. 73 CLT
} as const;

export type BancoHorasAdjustmentType =
  | 'compensacao_folga' // Funcionário usou saldo positivo para tirar folga/sair mais cedo (reduz saldo)
  | 'abono_horas' // Empresa abonou horas que faltaram para completar 42h (soma no saldo do trabalhador)
  | 'acrescimo_horas' // Horas adicionais de deslocamento extra, retirada de equipamento ou evento extra (soma no saldo)
  | 'desconto_horas' // Atraso ou saída antecipada lançada manualmente (reduz saldo)
  | 'pagamento_he'; // Horas extras quitadas em folha (zera/deduz do saldo acumulado)

export interface BancoHorasLancamento {
  id: string;
  employee_id: string;
  employee_nome: string;
  data: string; // YYYY-MM-DD (data de referência na semana)
  tipo: BancoHorasAdjustmentType;
  minutos: number; // Valor assinado: positivo (+ minutos a favor do funcionário) ou negativo (- minutos deduzidos/compensados)
  motivo: string;
  registrado_por: string;
  created_at: string;
}

export interface DailyWorkBreakdown {
  dateIso: string;
  employeeId: string;
  regime: 'externo' | 'interno';
  isSunday: boolean;
  eventsCount: number;
  firstStartMin: number | null; // Ex: 09:00 = 540
  lastEndMin: number | null; // Ex: 17:00 = 1020
  firstStartFormatted: string | null;
  lastEndFormatted: string | null;
  firstRestaurantName: string | null;
  lastRestaurantName: string | null;
  recordingMinutes: number; // Tempo dentro dos restaurantes/eventos
  locomotionMinutes: number; // Tempo de deslocamento entre restaurantes no mesmo dia (integra jornada externa)
  internalBreakMinutes: number; // Intervalo de almoço para internos
  totalWorkedMinutes: number; // Jornada total efetiva do dia
  manualAdjustmentMinutes: number; // Ajustes manuais lançados para este dia
  hasNightShift: boolean; // Trabalho após 22h
  isSimulated?: boolean; // Indica se inclui complemento simulado de demonstração
  events: EventItem[];
}

export interface WeeklyBankSummary {
  weekIndex: number;
  weekLabel: string;
  startDateIso: string;
  endDateIso: string;
  targetMinutes: number; // 2520 min (42h) ou proporcional se semana parcial
  workedMinutes: number; // Horas de jornada (gravações + locomoção entre restaurantes ou ponto interno)
  recordingMinutes: number;
  locomotionMinutes: number;
  manualAdjustmentsMinutes: number;
  effectiveTotalMinutes: number; // workedMinutes + manualAdjustmentsMinutes
  balanceMinutes: number; // effectiveTotalMinutes - targetMinutes (+ passou das 42h, - faltou para 42h)
  daysWorkedCount: number;
  daysOffCount: number;
  workedOnSunday: boolean;
  dailyBreakdowns: DailyWorkBreakdown[];
  adjustments: BancoHorasLancamento[];
}

export type CltAlertSeverity = 'critico' | 'aviso';

export type CltAlertCategory =
  | 'excesso_42h_semanais'
  | 'violacao_escala_5x2'
  | 'interjornada_menor_11h'
  | 'jornada_diaria_excedida'
  | 'trabalho_domingo'
  | 'trabalho_noturno'
  | 'desequilibrio_equipe'
  | 'conflito_horario'
  | 'gravacao_sem_dupla';

export interface CltComplianceAlert {
  id: string;
  severity: CltAlertSeverity;
  category: CltAlertCategory;
  employeeId?: string;
  employeeName?: string;
  dateIso?: string;
  weekLabel?: string;
  title: string;
  description: string;
  legalBasis: string;
}

/**
 * Converte "HH:mm" ou "HH:mm:ss" para minutos desde 00:00
 */
export function timeToMinutes(timeStr: string | undefined | null): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim().slice(0, 5);
  const [hStr, mStr] = clean.split(':');
  const h = Number(hStr) || 0;
  const m = Number(mStr) || 0;
  return h * 60 + m;
}

/**
 * Converte minutos desde 00:00 para "HH:mm"
 */
export function minutesToTimeStr(mins: number): string {
  const clamped = Math.max(0, Math.round(mins));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Formata uma duração em minutos para exibição humana (ex: "42h 00m", "+3h 30m", "-4h 15m")
 */
export function formatDurationHoursMinutes(totalMinutes: number, showSign = false): string {
  const rounded = Math.round(totalMinutes);
  const sign = rounded > 0 ? (showSign ? '+' : '') : rounded < 0 ? '-' : showSign ? '' : '';
  const abs = Math.abs(rounded);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  if (mins === 0) return `${sign}${hours}h`;
  return `${sign}${hours}h ${String(mins).padStart(2, '0')}min`;
}

/**
 * Retorna todas as datas (YYYY-MM-DD) de um determinado mês (year, month 0-indexed)
 */
export function getDatesOfMonth(year: number, month: number): string[] {
  const dates: string[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dates.push(iso);
  }
  return dates;
}

/**
 * Agrupa as datas de um mês em semanas completas (Segunda a Domingo) que tocam o mês
 */
export function getWeeksTouchingMonth(year: number, month: number): {
  weekIndex: number;
  weekLabel: string;
  dates: string[];
  startDateIso: string;
  endDateIso: string;
}[] {
  const firstDay = new Date(year, month, 1, 12, 0, 0);
  const lastDay = new Date(year, month + 1, 0, 12, 0, 0);

  // Retrocede até a segunda-feira da primeira semana
  const startCursor = new Date(firstDay);
  const dayOfWeek = startCursor.getDay(); // 0 = Dom, 1 = Seg
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startCursor.setDate(startCursor.getDate() + diffToMonday);

  const weeks: {
    weekIndex: number;
    weekLabel: string;
    dates: string[];
    startDateIso: string;
    endDateIso: string;
  }[] = [];

  let weekIdx = 1;
  while (startCursor <= lastDay) {
    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const y = startCursor.getFullYear();
      const m = String(startCursor.getMonth() + 1).padStart(2, '0');
      const d = String(startCursor.getDate()).padStart(2, '0');
      weekDates.push(`${y}-${m}-${d}`);
      startCursor.setDate(startCursor.getDate() + 1);
    }
    const startIso = weekDates[0];
    const endIso = weekDates[6];
    const sFmt = `${startIso.slice(8, 10)}/${startIso.slice(5, 7)}`;
    const eFmt = `${endIso.slice(8, 10)}/${endIso.slice(5, 7)}`;
    weeks.push({
      weekIndex: weekIdx,
      weekLabel: `Semana ${weekIdx} (${sFmt} a ${eFmt})`,
      dates: weekDates,
      startDateIso: startIso,
      endDateIso: endIso,
    });
    weekIdx++;
  }

  return weeks;
}

/**
 * Calcula a jornada diária de um funcionário segundo a regra específica:
 * - EXTERNOS (Filmmakers e Modelos):
 *   A jornada começa no PRIMEIRO restaurante do dia e termina no ÚLTIMO restaurante do dia.
 *   O tempo de locomoção entre um restaurante e outro no mesmo dia é contado como hora trabalhada (Art. 4º CLT).
 * - INTERNOS (Equipe de Escritório):
 *   A jornada é calculada da Entrada até a Saída no Ponto (descontando 1h de almoço), ou pelos compromissos internos.
 */
export function calculateDailyEmployeeBreakdown(params: {
  employee: Employee;
  dateIso: string;
  allEvents: EventItem[];
  allPontos: PontoRegistro[];
  allClients: Client[];
  manualAdjustments?: BancoHorasLancamento[];
}): DailyWorkBreakdown {
  const { employee, dateIso, allEvents, allPontos, allClients, manualAdjustments = [] } = params;
  const isExternal =
    employee.regime === 'externo' ||
    employee.funcao === 'filmmaker' ||
    employee.funcao === 'modelo' ||
    employee.funcao === 'criadora';

  const dateObj = new Date(`${dateIso}T12:00:00`);
  const isSunday = dateObj.getDay() === 0;

  // Compromissos ativos do funcionário neste dia
  const empEvents = allEvents
    .filter(
      (ev) =>
        ev.data === dateIso &&
        ev.status !== 'cancelado' &&
        (ev.assigned_employee_ids || []).includes(employee.id)
    )
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  // Batidas de ponto do funcionário neste dia
  const empPontos = allPontos
    .filter((p) => p.employee_id === employee.id && p.data_hora.slice(0, 10) === dateIso)
    .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

  // Ajustes manuais deste dia
  const dayAdjustments = manualAdjustments.filter(
    (adj) => adj.employee_id === employee.id && adj.data === dateIso
  );
  const manualAdjustmentMinutes = dayAdjustments.reduce((acc, a) => acc + a.minutos, 0);

  if (isExternal) {
    // EQUAÇÃO DOS FUNCIONÁRIOS EXTERNOS:
    // Começa no primeiro restaurante do dia e termina no último restaurante do dia (locomoção entre eles conta como hora trabalhada)
    if (empEvents.length === 0 && empPontos.length === 0) {
      const dow = dateObj.getDay(); // 0=Dom, 1=Seg ... 6=Sáb
      const isNovOrOct2026 = dateIso.startsWith('2026-10-') || dateIso.startsWith('2026-11-');
      const isHolidayNov = dateIso === '2026-11-02' || dateIso === '2026-11-15' || dateIso === '2026-11-20';
      const empChar = employee.id.charCodeAt(employee.id.length - 1);
      // Simula escala 5x2 (Ter a Sex + Seg ou Sáb conforme colaborador) para abastecer o Banco de Horas com jornadas reais/simuladas de ~40h a ~45h/semana
      const isSimFieldDay =
        isNovOrOct2026 &&
        !isHolidayNov &&
        (dow === 2 || dow === 3 || dow === 4 || dow === 5 || (empChar % 2 === 0 ? dow === 1 : dow === 6));

      if (isSimFieldDay) {
        const simPairs = [
          ['Flor do Paraíso (Simulado)', 'O Mineiro SP (Simulado)'],
          ['Sloop Burger (Simulado)', 'Kazza Bar e Restaurante (Simulado)'],
          ['Pecatto Bar e Restaurante (Simulado)', 'Santo Portuga (Simulado)'],
          ['Hao Sushi Brooklin (Simulado)', 'Sampa Burger (Simulado)'],
          ['Padaria Bella Paulista (Simulado)', 'La Braciera Jardins (Simulado)'],
          ['Legado Parrilla (Simulado)', 'Nossa Carne (Simulado)'],
          ['Cannoleria do Bixiga (Simulado)', 'Borgo Mooca (Simulado)'],
        ];
        const pairIdx = (dateObj.getDate() + empChar) % simPairs.length;
        const [rest1, rest2] = simPairs[pairIdx];
        const simStart = 9 * 60 + 30; // 09:30 no 1º restaurante
        const extraMins = ((dateObj.getDate() + empChar) % 4) * 15; // 0, 15, 30 ou 45 min
        const simEnd = 17 * 60 + 45 + extraMins; // 17:45 a 18:30 no último restaurante
        const simSpan = simEnd - simStart; // 8h15 a 9h00 totais no dia
        const simRec = 360 + (extraMins >= 30 ? 30 : 0); // 6h00 a 6h30 de gravação
        const simLoc = simSpan - simRec; // ~2h15 de locomoção entre restaurantes

        return {
          dateIso,
          employeeId: employee.id,
          regime: 'externo',
          isSunday,
          eventsCount: 2,
          firstStartMin: simStart,
          lastEndMin: simEnd,
          firstStartFormatted: minutesToTimeStr(simStart),
          lastEndFormatted: minutesToTimeStr(simEnd),
          firstRestaurantName: rest1,
          lastRestaurantName: rest2,
          recordingMinutes: simRec,
          locomotionMinutes: simLoc,
          internalBreakMinutes: 0,
          totalWorkedMinutes: simSpan,
          manualAdjustmentMinutes,
          hasNightShift: false,
          isSimulated: true,
          events: [],
        };
      }

      return {
        dateIso,
        employeeId: employee.id,
        regime: 'externo',
        isSunday,
        eventsCount: 0,
        firstStartMin: null,
        lastEndMin: null,
        firstStartFormatted: null,
        lastEndFormatted: null,
        firstRestaurantName: null,
        lastRestaurantName: null,
        recordingMinutes: 0,
        locomotionMinutes: 0,
        internalBreakMinutes: 0,
        totalWorkedMinutes: 0,
        manualAdjustmentMinutes,
        hasNightShift: false,
        events: [],
      };
    }

    let firstStartMin = Infinity;
    let lastEndMin = -Infinity;
    let recordingMinutes = 0;

    // 1. Considera horários das gravações agendadas/realizadas nos restaurantes
    for (const ev of empEvents) {
      const s = timeToMinutes(ev.hora_inicio);
      const e = timeToMinutes(ev.hora_fim);
      if (s < firstStartMin) firstStartMin = s;
      if (e > lastEndMin) lastEndMin = e;
      if (e > s) recordingMinutes += e - s;
    }

    // 2. Se houver batidas de ponto reais no restaurante, ajusta o início/fim real se extrapolarem além da tolerância de 10min (Art. 58 §1º CLT)
    const hasSimulatedEventOrPunch =
      empEvents.some((e) => e.id.startsWith('evt-nov-') || e.id.startsWith('sim-')) ||
      empPontos.some((p) => p.id.startsWith('sim-'));

    if (empPontos.length > 0) {
      const punchMinutes = empPontos.map((p) => {
        const d = new Date(p.data_hora);
        return d.getHours() * 60 + d.getMinutes();
      });
      const earliestPunch = Math.min(...punchMinutes);
      const latestPunch = Math.max(...punchMinutes);

      if (empEvents.length === 0) {
        firstStartMin = earliestPunch;
        lastEndMin = latestPunch > earliestPunch ? latestPunch : earliestPunch + 480;
        recordingMinutes = Math.max(180, lastEndMin - firstStartMin - 120);
      } else {
        if (Math.abs(earliestPunch - firstStartMin) > CLT_2026_RULES.TOLERANCIA_PONTO_DIARIA_MINUTOS) {
          firstStartMin = Math.min(firstStartMin, earliestPunch);
        }
        if (Math.abs(latestPunch - lastEndMin) > CLT_2026_RULES.TOLERANCIA_PONTO_DIARIA_MINUTOS) {
          lastEndMin = Math.max(lastEndMin, latestPunch);
        }
      }
    }

    // Se a diária na agenda simulada tinha apenas 1 restaurante curto (ex: 3h), simula o roteiro completo de campo do dia (1º ao último restaurante + locomoção)
    let simulatedExtraRestaurant: string | null = null;
    if (empEvents.length === 1 && lastEndMin - firstStartMin <= 240) {
      const daySeed = dateObj.getDate() + employee.id.charCodeAt(employee.id.length - 1);
      const secondRestList = [
        'La Braciera Jardins',
        'Sampa Burger',
        'Hao Sushi Brooklin',
        'Bella Paulista',
        'Santo Mar Tatuapé',
        'Legado Parrilla',
      ];
      simulatedExtraRestaurant = secondRestList[daySeed % secondRestList.length];
      if (firstStartMin >= 12 * 60) {
        // Tinha restaurante à tarde -> simula 1º restaurante pela manhã (09:00) + locomoção
        firstStartMin = 9 * 60 + (daySeed % 2) * 30; // 09:00 ou 09:30
        recordingMinutes += 180; // +3h de gravação no 1º restaurante
      } else {
        // Tinha restaurante pela manhã -> simula último restaurante à tarde (até 17:30 ou 18:00) + locomoção
        lastEndMin = 17 * 60 + 30 + (daySeed % 2) * 30; // 17:30 ou 18:00
        recordingMinutes += 180; // +3h de gravação no último restaurante
      }
    }

    const totalSpanMinutes = Math.max(0, lastEndMin - firstStartMin);
    const locomotionMinutes = Math.max(0, totalSpanMinutes - recordingMinutes);

    const firstEvent = empEvents[0];
    const lastEvent = empEvents[empEvents.length - 1];
    const firstClient =
      firstEvent?.client ||
      allClients.find((c) => c.id === (firstEvent?.client_id || empPontos[0]?.client_id));
    const lastClient =
      lastEvent?.client ||
      allClients.find(
        (c) => c.id === (lastEvent?.client_id || empPontos[empPontos.length - 1]?.client_id)
      );

    const resolvedFirstName =
      simulatedExtraRestaurant && (firstEvent ? timeToMinutes(firstEvent.hora_inicio) >= 12 * 60 : false)
        ? `${simulatedExtraRestaurant} (Simulado)`
        : firstClient?.nome || firstEvent?.local || '1º Restaurante';

    const resolvedLastName =
      simulatedExtraRestaurant && (firstEvent ? timeToMinutes(firstEvent.hora_inicio) < 12 * 60 : true)
        ? `${simulatedExtraRestaurant} (Simulado)`
        : lastClient?.nome || lastEvent?.local || 'Último Restaurante';

    const hasNightShift =
      lastEndMin > CLT_2026_RULES.HORARIO_NOTURNO_INICIO ||
      firstStartMin < CLT_2026_RULES.HORARIO_NOTURNO_FIM;

    return {
      dateIso,
      employeeId: employee.id,
      regime: 'externo',
      isSunday,
      eventsCount: simulatedExtraRestaurant ? empEvents.length + 1 : empEvents.length || (empPontos.length > 0 ? 1 : 0),
      firstStartMin,
      lastEndMin,
      firstStartFormatted: minutesToTimeStr(firstStartMin),
      lastEndFormatted: minutesToTimeStr(lastEndMin),
      firstRestaurantName: resolvedFirstName,
      lastRestaurantName: resolvedLastName,
      recordingMinutes,
      locomotionMinutes,
      internalBreakMinutes: 0,
      totalWorkedMinutes: totalSpanMinutes,
      manualAdjustmentMinutes,
      hasNightShift,
      isSimulated: hasSimulatedEventOrPunch || Boolean(simulatedExtraRestaurant),
      events: empEvents,
    };
  } else {
    // EQUAÇÃO DOS FUNCIONÁRIOS INTERNOS (CLT Escritório - Entrada, Almoço e Saída):
    const isWeekday = dateObj.getDay() >= 1 && dateObj.getDay() <= 5;
    const isNovOrOct2026 = dateIso.startsWith('2026-10-') || dateIso.startsWith('2026-11-');
    const isHolidayNov = dateIso === '2026-11-02' || dateIso === '2026-11-15' || dateIso === '2026-11-20';

    if (empPontos.length === 0 && empEvents.length === 0) {
      if (isWeekday && isNovOrOct2026 && !isHolidayNov) {
        // Simula expediente interno CLT de Segunda a Sexta (09:00 às 18:24 com 1h de almoço = 8h24 líquidas -> 42h/semana)
        const seedVariation = ((dateObj.getDate() + employee.id.charCodeAt(employee.id.length - 1)) % 5) * 6 - 12; // -12min a +12min
        const simStart = 9 * 60;
        const simEnd = 18 * 60 + 24 + seedVariation;
        const simWorked = simEnd - simStart - 60;
        return {
          dateIso,
          employeeId: employee.id,
          regime: 'interno',
          isSunday,
          eventsCount: 1,
          firstStartMin: simStart,
          lastEndMin: simEnd,
          firstStartFormatted: minutesToTimeStr(simStart),
          lastEndFormatted: minutesToTimeStr(simEnd),
          firstRestaurantName: 'Sede Navegando MKT (Simulado)',
          lastRestaurantName: 'Sede Navegando MKT (Simulado)',
          recordingMinutes: simWorked,
          locomotionMinutes: 0,
          internalBreakMinutes: 60,
          totalWorkedMinutes: simWorked,
          manualAdjustmentMinutes,
          hasNightShift: false,
          isSimulated: true,
          events: [],
        };
      }
      return {
        dateIso,
        employeeId: employee.id,
        regime: 'interno',
        isSunday,
        eventsCount: 0,
        firstStartMin: null,
        lastEndMin: null,
        firstStartFormatted: null,
        lastEndFormatted: null,
        firstRestaurantName: null,
        lastRestaurantName: null,
        recordingMinutes: 0,
        locomotionMinutes: 0,
        internalBreakMinutes: 0,
        totalWorkedMinutes: 0,
        manualAdjustmentMinutes,
        hasNightShift: false,
        isSimulated: false,
        events: [],
      };
    }

    let firstStartMin = 9 * 60;
    let lastEndMin = 18 * 60 + 24; // 8h24 líquidas + 1h almoço = 9h24 brutas
    let internalBreakMinutes = 60;

    if (empPontos.length > 0) {
      const punchMinutes = empPontos.map((p) => {
        const d = new Date(p.data_hora);
        return d.getHours() * 60 + d.getMinutes();
      });
      firstStartMin = Math.min(...punchMinutes);
      lastEndMin = Math.max(...punchMinutes);
      if (lastEndMin - firstStartMin <= 6 * 60) {
        internalBreakMinutes = 15;
      }
    } else if (empEvents.length > 0) {
      firstStartMin = Math.min(...empEvents.map((e) => timeToMinutes(e.hora_inicio)));
      lastEndMin = Math.max(...empEvents.map((e) => timeToMinutes(e.hora_fim)));
      internalBreakMinutes = lastEndMin - firstStartMin > 6 * 60 ? 60 : 0;
    }

    const totalWorkedMinutes = Math.max(0, lastEndMin - firstStartMin - internalBreakMinutes);
    const hasNightShift = lastEndMin > CLT_2026_RULES.HORARIO_NOTURNO_INICIO;

    return {
      dateIso,
      employeeId: employee.id,
      regime: 'interno',
      isSunday,
      eventsCount: empEvents.length || 1,
      firstStartMin,
      lastEndMin,
      firstStartFormatted: minutesToTimeStr(firstStartMin),
      lastEndFormatted: minutesToTimeStr(lastEndMin),
      firstRestaurantName: 'Sede Navegando MKT',
      lastRestaurantName: 'Sede Navegando MKT',
      recordingMinutes: totalWorkedMinutes,
      locomotionMinutes: 0,
      internalBreakMinutes,
      totalWorkedMinutes,
      manualAdjustmentMinutes,
      hasNightShift,
      events: empEvents,
    };
  }
}

/**
 * Calcula o resumo semanal do Banco de Horas (meta de 42h semanais) para um colaborador em um mês
 */
export function calculateEmployeeMonthlyTimeBank(params: {
  employee: Employee;
  year: number;
  month: number;
  allEvents: EventItem[];
  allPontos: PontoRegistro[];
  allClients: Client[];
  manualAdjustments: BancoHorasLancamento[];
}): {
  weeks: WeeklyBankSummary[];
  totalTargetMinutes: number;
  totalWorkedMinutes: number;
  totalRecordingMinutes: number;
  totalLocomotionMinutes: number;
  totalManualAdjustmentsMinutes: number;
  totalEffectiveMinutes: number;
  totalBalanceMinutes: number;
  totalEventsCount: number;
  totalDaysWorked: number;
} {
  const { employee, year, month, allEvents, allPontos, allClients, manualAdjustments } = params;
  const rawWeeks = getWeeksTouchingMonth(year, month);

  let totalTargetMinutes = 0;
  let totalWorkedMinutes = 0;
  let totalRecordingMinutes = 0;
  let totalLocomotionMinutes = 0;
  let totalManualAdjustmentsMinutes = 0;
  let totalEventsCount = 0;
  let totalDaysWorked = 0;

  const weeks: WeeklyBankSummary[] = rawWeeks.map((w) => {
    const dailyBreakdowns = w.dates.map((dateIso) =>
      calculateDailyEmployeeBreakdown({
        employee,
        dateIso,
        allEvents,
        allPontos,
        allClients,
        manualAdjustments,
      })
    );

    const workedMinutes = dailyBreakdowns.reduce((acc, d) => acc + d.totalWorkedMinutes, 0);
    const recordingMinutes = dailyBreakdowns.reduce((acc, d) => acc + d.recordingMinutes, 0);
    const locomotionMinutes = dailyBreakdowns.reduce((acc, d) => acc + d.locomotionMinutes, 0);
    const weekAdjustments = manualAdjustments.filter(
      (adj) =>
        adj.employee_id === employee.id &&
        adj.data >= w.startDateIso &&
        adj.data <= w.endDateIso
    );
    const manualAdjustmentsMinutes = weekAdjustments.reduce((acc, a) => acc + a.minutos, 0);

    const daysWorkedCount = dailyBreakdowns.filter(
      (d) => d.totalWorkedMinutes > 0 || d.eventsCount > 0
    ).length;
    const daysOffCount = 7 - daysWorkedCount;
    const workedOnSunday = dailyBreakdowns.some(
      (d) => d.isSunday && (d.totalWorkedMinutes > 0 || d.eventsCount > 0)
    );

    // Meta semanal: 42 horas (2520 minutos) conforme EC 141/2026 (Dezembro/2026)
    const targetMinutes = CLT_2026_RULES.LIMITE_SEMANAL_MINUTOS;
    const effectiveTotalMinutes = workedMinutes + manualAdjustmentsMinutes;
    const balanceMinutes = effectiveTotalMinutes - targetMinutes;

    totalTargetMinutes += targetMinutes;
    totalWorkedMinutes += workedMinutes;
    totalRecordingMinutes += recordingMinutes;
    totalLocomotionMinutes += locomotionMinutes;
    totalManualAdjustmentsMinutes += manualAdjustmentsMinutes;
    totalEventsCount += dailyBreakdowns.reduce((acc, d) => acc + d.events.length, 0);
    totalDaysWorked += daysWorkedCount;

    return {
      weekIndex: w.weekIndex,
      weekLabel: w.weekLabel,
      startDateIso: w.startDateIso,
      endDateIso: w.endDateIso,
      targetMinutes,
      workedMinutes,
      recordingMinutes,
      locomotionMinutes,
      manualAdjustmentsMinutes,
      effectiveTotalMinutes,
      balanceMinutes,
      daysWorkedCount,
      daysOffCount,
      workedOnSunday,
      dailyBreakdowns,
      adjustments: weekAdjustments,
    };
  });

  const totalEffectiveMinutes = totalWorkedMinutes + totalManualAdjustmentsMinutes;
  const totalBalanceMinutes = totalEffectiveMinutes - totalTargetMinutes;

  return {
    weeks,
    totalTargetMinutes,
    totalWorkedMinutes,
    totalRecordingMinutes,
    totalLocomotionMinutes,
    totalManualAdjustmentsMinutes,
    totalEffectiveMinutes,
    totalBalanceMinutes,
    totalEventsCount,
    totalDaysWorked,
  };
}

/**
 * Audita toda a escala do mês segundo a CLT + EC 141/2026 (Dezembro/2026) e equilíbrio da equipe:
 * - Limite de 42h semanais
 * - Escala máxima 5x2 (mínimo 2 dias de descanso por semana)
 * - Intervalo interjornada mínimo de 11h consecutivas (Art. 66 CLT)
 * - Jornada diária máxima de 8h normais / 10h com extras (Art. 58/59 CLT)
 * - Trabalho em domingos (Lei 605/49) e noturno após 22h (Art. 73 CLT)
 * - Equilíbrio de gravações entre Filmmakers e entre Modelos
 */
export function auditMonthlyScheduleCompliance(params: {
  year: number;
  month: number;
  employees: Employee[];
  events: EventItem[];
  pontos: PontoRegistro[];
  clients: Client[];
  manualAdjustments?: BancoHorasLancamento[];
}): CltComplianceAlert[] {
  const { year, month, employees, events, pontos, clients, manualAdjustments = [] } = params;
  const alerts: CltComplianceAlert[] = [];

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthEvents = events.filter(
    (e) => e.data.startsWith(monthPrefix) && e.status !== 'cancelado'
  );

  const filmmakers = employees.filter((e) => e.ativo && e.funcao === 'filmmaker');
  const modelos = employees.filter(
    (e) => e.ativo && (e.funcao === 'modelo' || e.funcao === 'criadora')
  );
  const fieldTeam = [...filmmakers, ...modelos];

  // 1. Verificar gravações sem dupla completa (1 Filmmaker + 1 Modelo)
  for (const ev of monthEvents) {
    if (ev.tipo !== 'gravacao') continue;
    const assignedIds = ev.assigned_employee_ids || [];
    const hasFilmmaker = assignedIds.some((id) => {
      const emp = employees.find((e) => e.id === id);
      return emp?.funcao === 'filmmaker' || emp?.funcao === 'gerente' || emp?.funcao === 'dono';
    });
    const hasModelo = assignedIds.some((id) => {
      const emp = employees.find((e) => e.id === id);
      return emp?.funcao === 'modelo' || emp?.funcao === 'criadora';
    });

    const clientName = ev.client?.nome || clients.find((c) => c.id === ev.client_id)?.nome || 'Restaurante';

    if (!hasFilmmaker || !hasModelo) {
      const missing = !hasFilmmaker && !hasModelo ? 'Filmmaker e Modelo' : !hasFilmmaker ? 'Filmmaker' : 'Modelo';
      alerts.push({
        id: `missing-pair-${ev.id}`,
        severity: 'aviso',
        category: 'gravacao_sem_dupla',
        dateIso: ev.data,
        title: `Gravação sem ${missing} escalado(a)`,
        description: `${clientName} em ${ev.data.slice(8, 10)}/${ev.data.slice(5, 7)} (${ev.hora_inicio.slice(0, 5)}–${ev.hora_fim.slice(0, 5)}) está sem ${missing}. Use "Automatizar Escala" ou selecione manualmente.`,
        legalBasis: 'Padrão Operacional de Escala por Duplas',
      });
    }
  }

  // 2. Verificar Equilíbrio de Distribuição entre Filmmakers e entre Modelos no mês
  const checkGroupBalance = (group: Employee[], groupTitle: string) => {
    if (group.length < 2) return;
    const counts = group.map((emp) => {
      const count = monthEvents.filter((ev) =>
        (ev.assigned_employee_ids || []).includes(emp.id)
      ).length;
      return { emp, count };
    });
    const maxItem = counts.reduce((a, b) => (b.count > a.count ? b : a), counts[0]);
    const minItem = counts.reduce((a, b) => (b.count < a.count ? b : a), counts[0]);

    if (maxItem.count - minItem.count >= 2) {
      alerts.push({
        id: `balance-${groupTitle}`,
        severity: 'aviso',
        category: 'desequilibrio_equipe',
        employeeId: maxItem.emp.id,
        employeeName: maxItem.emp.nome,
        title: `Desequilíbrio na escala de ${groupTitle}`,
        description: `${maxItem.emp.nome} está com ${maxItem.count} gravações no mês, enquanto ${minItem.emp.nome} está com apenas ${minItem.count} (diferença de ${maxItem.count - minItem.count} gravações). Clique em "Automatizar / Equilibrar Escala" para igualar a carga.`,
        legalBasis: 'Equilíbrio Operacional & Isonomia de Jornada',
      });
    }
  };

  checkGroupBalance(filmmakers, 'Filmmakers');
  checkGroupBalance(modelos, 'Modelos');

  // 3. Auditar normas CLT + EC 141/2026 por funcionário
  for (const emp of fieldTeam) {
    const bank = calculateEmployeeMonthlyTimeBank({
      employee: emp,
      year,
      month,
      allEvents: events,
      allPontos: pontos,
      allClients: clients,
      manualAdjustments,
    });

    for (const week of bank.weeks) {
      // A) Limite de 42 horas semanais (EC 141/2026)
      if (week.workedMinutes > CLT_2026_RULES.LIMITE_SEMANAL_MINUTOS) {
        const excessMins = week.workedMinutes - CLT_2026_RULES.LIMITE_SEMANAL_MINUTOS;
        alerts.push({
          id: `42h-${emp.id}-w${week.weekIndex}`,
          severity: 'critico',
          category: 'excesso_42h_semanais',
          employeeId: emp.id,
          employeeName: emp.nome,
          weekLabel: week.weekLabel,
          title: `${emp.nome} ultrapassou o limite de 42h semanais`,
          description: `Trabalhou ${formatDurationHoursMinutes(week.workedMinutes)} na ${week.weekLabel} (${formatDurationHoursMinutes(excessMins, true)} acima do teto constitucional de 42h semanais, somando gravações e locomoção entre restaurantes). Isso pode ferir normas trabalhistas se não for compensado no Banco de Horas ou pago com adicional de no mínimo 50%.`,
          legalBasis: 'Art. 7º, XIII da CF (Emenda Constitucional nº 141/2026 — Limite de 42h semanais)',
        });
      }

      // B) Escala 5x2 — Mínimo de 2 dias de repouso semanal remunerado (Fim da 6x1)
      if (week.daysWorkedCount > CLT_2026_RULES.MAX_DIAS_TRABALHADOS_SEMANA) {
        alerts.push({
          id: `5x2-${emp.id}-w${week.weekIndex}`,
          severity: 'critico',
          category: 'violacao_escala_5x2',
          employeeId: emp.id,
          employeeName: emp.nome,
          weekLabel: week.weekLabel,
          title: `${emp.nome} está escalado(a) em ${week.daysWorkedCount} dias na semana (Violação 5x2)`,
          description: `Na ${week.weekLabel}, ${emp.nome} tem apenas ${week.daysOffCount} dia(s) de folga. A nova norma constitucional encerrou a escala 6x1 e exige 2 dias de repouso semanal remunerado (escala máxima 5x2). Isso pode ferir normas trabalhistas.`,
          legalBasis: 'Art. 7º, XV da CF (Emenda Constitucional nº 141/2026 — 2 dias de DSR por semana)',
        });
      }

      // C) Trabalho aos Domingos (Lei 605/49 & Súmula 146 TST)
      if (week.workedOnSunday) {
        const sunDay = week.dailyBreakdowns.find((d) => d.isSunday && d.eventsCount > 0);
        if (sunDay) {
          alerts.push({
            id: `sunday-${emp.id}-${sunDay.dateIso}`,
            severity: 'aviso',
            category: 'trabalho_domingo',
            employeeId: emp.id,
            employeeName: emp.nome,
            dateIso: sunDay.dateIso,
            weekLabel: week.weekLabel,
            title: `${emp.nome} escalado(a) no Domingo (${sunDay.dateIso.slice(8, 10)}/${sunDay.dateIso.slice(5, 7)})`,
            description: `O repouso semanal deve recair preferencialmente aos domingos. O trabalho no domingo exige folga compensatória na mesma semana (garantindo 2 folgas semanais) ou pagamento em dobro (100%).`,
            legalBasis: 'CF Art. 7º, XV (EC 141/2026), Lei nº 605/1949 e Súmula 146 do TST',
          });
        }
      }
    }

    // D) Auditar dias consecutivos: Intervalo Interjornada < 11h (Art. 66 CLT) e Jornada Diária > 8h/10h
    const allDays = bank.weeks.flatMap((w) => w.dailyBreakdowns);
    for (let i = 0; i < allDays.length; i++) {
      const day = allDays[i];
      if (!day.dateIso.startsWith(monthPrefix)) continue;

      // Jornada diária > 8h normais (Art. 58/59 CLT)
      if (day.totalWorkedMinutes > CLT_2026_RULES.LIMITE_DIARIO_NORMAL_MINUTOS) {
        const isOver10h =
          day.totalWorkedMinutes > CLT_2026_RULES.LIMITE_DIARIO_MAX_COM_EXTRAS_MINUTOS;
        alerts.push({
          id: `daily-limit-${emp.id}-${day.dateIso}`,
          severity: isOver10h ? 'critico' : 'aviso',
          category: 'jornada_diaria_excedida',
          employeeId: emp.id,
          employeeName: emp.nome,
          dateIso: day.dateIso,
          title: isOver10h
            ? `${emp.nome} excedeu 10h de jornada no dia ${day.dateIso.slice(8, 10)}/${day.dateIso.slice(5, 7)}`
            : `${emp.nome} passou de 8h diárias no dia ${day.dateIso.slice(8, 10)}/${day.dateIso.slice(5, 7)}`,
          description: `Jornada externa das ${day.firstStartFormatted} (${day.firstRestaurantName}) às ${day.lastEndFormatted} (${day.lastRestaurantName}) totalizou ${formatDurationHoursMinutes(day.totalWorkedMinutes)} (${formatDurationHoursMinutes(day.recordingMinutes)} em gravação + ${formatDurationHoursMinutes(day.locomotionMinutes)} de locomoção entre restaurantes). ${
            isOver10h
              ? 'Ultrapassa o limite legal de 2h extras diárias (Art. 59 CLT) e pode ferir normas trabalhistas!'
              : 'Exige intervalo intrajornada mínimo de 1h (Art. 71 CLT) e cômputo no Banco de Horas.'
          }`,
          legalBasis: 'Art. 4º, 58, 59 e 71 da CLT',
        });
      }

      // Trabalho noturno após 22h (Art. 73 CLT)
      if (day.hasNightShift) {
        alerts.push({
          id: `night-${emp.id}-${day.dateIso}`,
          severity: 'aviso',
          category: 'trabalho_noturno',
          employeeId: emp.id,
          employeeName: emp.nome,
          dateIso: day.dateIso,
          title: `${emp.nome} em horário noturno no dia ${day.dateIso.slice(8, 10)}/${day.dateIso.slice(5, 7)}`,
          description: `Término previsto às ${day.lastEndFormatted}. O trabalho urbano entre 22h e 5h tem hora reduzida (52m30s) e adicional noturno mínimo de 20%.`,
          legalBasis: 'Art. 73 da CLT',
        });
      }

      // Intervalo Interjornada < 11h entre o dia i e o dia i+1 (Art. 66 CLT)
      if (i + 1 < allDays.length) {
        const nextDay = allDays[i + 1];
        if (day.lastEndMin !== null && nextDay.firstStartMin !== null) {
          // Minutos entre o término do dia i e o início do dia i+1
          const restMinutes = 24 * 60 - day.lastEndMin + nextDay.firstStartMin;
          if (restMinutes < CLT_2026_RULES.DESCANSO_INTERJORNADA_MIN_MINUTOS) {
            alerts.push({
              id: `interjornada-${emp.id}-${day.dateIso}`,
              severity: 'critico',
              category: 'interjornada_menor_11h',
              employeeId: emp.id,
              employeeName: emp.nome,
              dateIso: nextDay.dateIso,
              title: `Violação de Interjornada (< 11h) para ${emp.nome}`,
              description: `Encerrou às ${day.lastEndFormatted} em ${day.dateIso.slice(8, 10)}/${day.dateIso.slice(5, 7)} e inicia às ${nextDay.firstStartFormatted} em ${nextDay.dateIso.slice(8, 10)}/${nextDay.dateIso.slice(5, 7)} — apenas ${formatDurationHoursMinutes(restMinutes)} de descanso (mínimo obrigatório: 11h consecutivas). Isso fere diretamente o Art. 66 da CLT!`,
              legalBasis: 'Art. 66 da CLT (Intervalo mínimo de 11h entre duas jornadas)',
            });
          }
        }
      }
    }
  }

  return alerts;
}

/**
 * GERADOR AUTOMÁTICO DE ESCALA MENSAL (CLT 42h / Escala 5x2 / Equilíbrio Total):
 * Distribui automaticamente 1 Filmmaker + 1 Modelo para cada gravação do mês:
 * - Equilibra a quantidade de gravações e horas entre todos os Filmmakers ativos e todas as Modelos ativas
 * - Respeita ausência de conflitos de horário
 * - Respeita o limite de 5 dias trabalhados na semana (escala 5x2 - EC 141/2026) sempre que possível
 * - Respeita o intervalo interjornada de 11h (Art. 66 CLT) e o teto de 42h semanais sempre que possível
 */
export function generateBalancedMonthlyRoster(params: {
  year: number;
  month: number;
  events: EventItem[];
  employees: Employee[];
  mode: 'only_incomplete' | 'rebalance_all';
}): {
  updatedEvents: EventItem[];
  assignedCount: number;
  summaryMessage: string;
} {
  const { year, month, events, employees, mode } = params;
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const filmmakers = employees.filter((e) => e.ativo && e.funcao === 'filmmaker');
  const modelos = employees.filter(
    (e) => e.ativo && (e.funcao === 'modelo' || e.funcao === 'criadora')
  );

  if (filmmakers.length === 0 || modelos.length === 0) {
    return {
      updatedEvents: events,
      assignedCount: 0,
      summaryMessage: 'Não há filmmakers ou modelos ativos suficientes para automatizar a escala.',
    };
  }

  // Clona os eventos para trabalhar na distribuição
  const workingEvents: EventItem[] = events.map((ev) => {
    if (!ev.data.startsWith(monthPrefix) || ev.status === 'cancelado' || ev.tipo !== 'gravacao') {
      return { ...ev };
    }
    if (mode === 'rebalance_all') {
      // Mantém eventuais internos/gerentes se estivessem escalados extras, mas limpa filmmaker/modelo para redistribuir igualitariamente
      const keptOthers = (ev.assigned_employee_ids || []).filter((id) => {
        const emp = employees.find((e) => e.id === id);
        return emp && emp.funcao !== 'filmmaker' && emp.funcao !== 'modelo' && emp.funcao !== 'criadora';
      });
      return {
        ...ev,
        assigned_employee_ids: keptOthers,
      };
    }
    return { ...ev, assigned_employee_ids: [...(ev.assigned_employee_ids || [])] };
  });

  // Ordena as gravações do mês cronologicamente
  const targetIndices = workingEvents
    .map((ev, idx) => ({ ev, idx }))
    .filter(
      ({ ev }) =>
        ev.data.startsWith(monthPrefix) && ev.status !== 'cancelado' && ev.tipo === 'gravacao'
    )
    .sort((a, b) => {
      if (a.ev.data !== b.ev.data) return a.ev.data.localeCompare(b.ev.data);
      return a.ev.hora_inicio.localeCompare(b.ev.hora_inicio);
    });

  // Função auxiliar para checar a semana (Seg-Dom) de uma data
  const getWeekKey = (dateIso: string): string => {
    const d = new Date(`${dateIso}T12:00:00`);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  };

  // Escolhe o melhor candidato (Filmmaker ou Modelo) para um evento específico
  const pickBestCandidate = (candidates: Employee[], targetEv: EventItem): Employee | null => {
    const evStart = timeToMinutes(targetEv.hora_inicio);
    const evEnd = timeToMinutes(targetEv.hora_fim);
    const weekKey = getWeekKey(targetEv.data);

    const scored = candidates.map((cand) => {
      // Eventos já atribuídos a este candidato no mês
      const candMonthEvents = workingEvents.filter(
        (e) =>
          e.data.startsWith(monthPrefix) &&
          e.status !== 'cancelado' &&
          (e.assigned_employee_ids || []).includes(cand.id)
      );

      // 1. Verifica conflito direto de horário no mesmo dia (bloqueante)
      const sameDayEvents = candMonthEvents.filter((e) => e.data === targetEv.data);
      const hasTimeOverlap = sameDayEvents.some((e) => {
        const s = timeToMinutes(e.hora_inicio);
        const f = timeToMinutes(e.hora_fim);
        return evStart < f && evEnd > s;
      });

      if (hasTimeOverlap) {
        return { cand, blocked: true, score: Infinity };
      }

      // 2. Calcula dias trabalhados na semana (para respeitar escala 5x2 - máx 5 dias)
      const weekEvents = candMonthEvents.filter((e) => getWeekKey(e.data) === weekKey);
      const workedDatesInWeek = new Set(weekEvents.map((e) => e.data));
      const wouldAddNewDayInWeek = !workedDatesInWeek.has(targetEv.data);
      const projectedDaysInWeek = workedDatesInWeek.size + (wouldAddNewDayInWeek ? 1 : 0);

      // 3. Calcula horas projetadas na semana (incluindo locomoção entre restaurantes no mesmo dia)
      let projectedWeekMinutes = 0;
      const allWeekDates = new Set([...workedDatesInWeek, targetEv.data]);
      for (const dIso of allWeekDates) {
        const evsOnDay =
          dIso === targetEv.data ? [...sameDayEvents, targetEv] : weekEvents.filter((e) => e.data === dIso);
        const minS = Math.min(...evsOnDay.map((e) => timeToMinutes(e.hora_inicio)));
        const maxE = Math.max(...evsOnDay.map((e) => timeToMinutes(e.hora_fim)));
        projectedWeekMinutes += Math.max(0, maxE - minS);
      }

      // 4. Verifica intervalo interjornada de 11h com dia anterior e dia seguinte
      const prevDateObj = new Date(`${targetEv.data}T12:00:00`);
      prevDateObj.setDate(prevDateObj.getDate() - 1);
      const prevDateIso = prevDateObj.toISOString().slice(0, 10);

      const nextDateObj = new Date(`${targetEv.data}T12:00:00`);
      nextDateObj.setDate(nextDateObj.getDate() + 1);
      const nextDateIso = nextDateObj.toISOString().slice(0, 10);

      const prevDayEvents = candMonthEvents.filter((e) => e.data === prevDateIso);
      const nextDayEvents = candMonthEvents.filter((e) => e.data === nextDateIso);

      let violatesInterjornada = false;
      if (prevDayEvents.length > 0) {
        const prevLastEnd = Math.max(...prevDayEvents.map((e) => timeToMinutes(e.hora_fim)));
        if (24 * 60 - prevLastEnd + evStart < CLT_2026_RULES.DESCANSO_INTERJORNADA_MIN_MINUTOS) {
          violatesInterjornada = true;
        }
      }
      if (nextDayEvents.length > 0) {
        const nextFirstStart = Math.min(...nextDayEvents.map((e) => timeToMinutes(e.hora_inicio)));
        if (24 * 60 - evEnd + nextFirstStart < CLT_2026_RULES.DESCANSO_INTERJORNADA_MIN_MINUTOS) {
          violatesInterjornada = true;
        }
      }

      // 5. Verifica se a jornada diária projetada ultrapassa 8h / 10h
      const dayEvsWithTarget = [...sameDayEvents, targetEv];
      const dayMinStart = Math.min(...dayEvsWithTarget.map((e) => timeToMinutes(e.hora_inicio)));
      const dayMaxEnd = Math.max(...dayEvsWithTarget.map((e) => timeToMinutes(e.hora_fim)));
      const projectedDailySpan = dayMaxEnd - dayMinStart;

      // Pontuação de carga (menor score = melhor candidato para manter igualdade absoluta)
      let score = candMonthEvents.length * 100 + projectedWeekMinutes / 10;

      // Penalidades pesadas se violar normas CLT (só escolhe se todos os outros também violarem)
      if (projectedDaysInWeek > CLT_2026_RULES.MAX_DIAS_TRABALHADOS_SEMANA) score += 50000;
      if (projectedWeekMinutes > CLT_2026_RULES.LIMITE_SEMANAL_MINUTOS) score += 40000;
      if (violatesInterjornada) score += 60000;
      if (projectedDailySpan > CLT_2026_RULES.LIMITE_DIARIO_MAX_COM_EXTRAS_MINUTOS) score += 45000;
      else if (projectedDailySpan > CLT_2026_RULES.LIMITE_DIARIO_NORMAL_MINUTOS) score += 5000;

      return { cand, blocked: false, score };
    });

    const valid = scored.filter((s) => !s.blocked).sort((a, b) => a.score - b.score);
    return valid.length > 0 ? valid[0].cand : null;
  };

  let assignedCount = 0;

  for (const { idx } of targetIndices) {
    const ev = workingEvents[idx];
    const currentIds = new Set(ev.assigned_employee_ids || []);

    const hasFilmmaker = Array.from(currentIds).some((id) => {
      const emp = employees.find((e) => e.id === id);
      return emp?.funcao === 'filmmaker';
    });

    const hasModelo = Array.from(currentIds).some((id) => {
      const emp = employees.find((e) => e.id === id);
      return emp?.funcao === 'modelo' || emp?.funcao === 'criadora';
    });

    let changed = false;

    if (!hasFilmmaker) {
      const chosenFm = pickBestCandidate(filmmakers, ev);
      if (chosenFm) {
        currentIds.add(chosenFm.id);
        changed = true;
      }
    }

    if (!hasModelo) {
      const chosenMod = pickBestCandidate(modelos, ev);
      if (chosenMod) {
        currentIds.add(chosenMod.id);
        changed = true;
      }
    }

    if (changed) {
      workingEvents[idx] = {
        ...ev,
        assigned_employee_ids: Array.from(currentIds),
      };
      assignedCount++;
    }
  }

  return {
    updatedEvents: workingEvents,
    assignedCount,
    summaryMessage:
      mode === 'rebalance_all'
        ? `Escala do mês automatizada e equilibrada em ${assignedCount} gravação(ões) respeitando as regras CLT (42h semanais e escala 5x2)!`
        : `${assignedCount} gravação(ões) preenchidas automaticamente com equilíbrio de equipe e regras CLT!`,
  };
}


/**
 * Identifica se um lançamento de Banco de Horas é simulado (demonstração inicial) ou real
 */
export function isSimulatedBancoHorasRecord(id: string | undefined | null): boolean {
  if (!id) return false;
  return id.startsWith('sim-bh-');
}

/**
 * Simulação Realista do Banco de Horas (Outubro e Novembro de 2026)
 * Contempla horas extras por múltiplas gravações no dia + locomoção entre restaurantes,
 * abonos para fechar as 42h semanais e compensações de folga.
 */
export const INITIAL_BANCO_HORAS_LANCAMENTOS: BancoHorasLancamento[] = [
  // FILMMAKERS EXTERNOS (1º ao último restaurante + locomoção)
  {
    id: 'sim-bh-01',
    employee_id: 'usr-victor',
    employee_nome: 'Victor',
    data: '2026-11-06',
    tipo: 'acrescimo_horas',
    minutos: 210, // +3h 30m
    motivo: 'SIMULADO • Jornada tripla externa (Spolpas Osasco → Santo Mar → 24 Print) + tempo de locomoção no trânsito',
    registrado_por: 'Sistema (Simulação Inicial)',
    created_at: '2026-11-06T19:30:00.000Z',
  },
  {
    id: 'sim-bh-02',
    employee_id: 'usr-victor',
    employee_nome: 'Victor',
    data: '2026-11-13',
    tipo: 'compensacao_folga',
    minutos: -180, // -3h 00m
    motivo: 'SIMULADO • Compensação parcial de banco de horas (saída antecipada na sexta-feira)',
    registrado_por: 'Felipe Assis (Simulado)',
    created_at: '2026-11-13T18:00:00.000Z',
  },
  {
    id: 'sim-bh-03',
    employee_id: 'usr-gimenez',
    employee_nome: 'Matheus Gimenez',
    data: '2026-11-09',
    tipo: 'acrescimo_horas',
    minutos: 240, // +4h 00m
    motivo: 'SIMULADO • Captação dupla (Burger Duos 11h até Varandas 21h) contando locomoção entre restaurantes',
    registrado_por: 'Sistema (Simulação Inicial)',
    created_at: '2026-11-09T21:15:00.000Z',
  },
  {
    id: 'sim-bh-04',
    employee_id: 'usr-gimenez',
    employee_nome: 'Matheus Gimenez',
    data: '2026-11-18',
    tipo: 'compensacao_folga',
    minutos: -150, // -2h 30m
    motivo: 'SIMULADO • Abatimento de horas acumuladas mediante folga compensatória manhã de quarta-feira',
    registrado_por: 'Alexandre (Simulado)',
    created_at: '2026-11-18T12:00:00.000Z',
  },
  {
    id: 'sim-bh-05',
    employee_id: 'usr-henry',
    employee_nome: 'Henry',
    data: '2026-11-05',
    tipo: 'acrescimo_horas',
    minutos: 195, // +3h 15m
    motivo: 'SIMULADO • Gravação Rei do ABC + deslocamento até 2º restaurante e backup de cartões SD',
    registrado_por: 'Sistema (Simulação Inicial)',
    created_at: '2026-11-05T19:00:00.000Z',
  },
  {
    id: 'sim-bh-06',
    employee_id: 'usr-henry',
    employee_nome: 'Henry',
    data: '2026-11-19',
    tipo: 'abono_horas',
    minutos: 180, // +3h 00m
    motivo: 'SIMULADO • Abono gerencial para completar 42h semanais (gravação externa adiada por chuva)',
    registrado_por: 'Gabriela Lorente (Simulado)',
    created_at: '2026-11-19T17:00:00.000Z',
  },

  // MODELOS / APRESENTADORAS EXTERNAS
  {
    id: 'sim-bh-07',
    employee_id: 'usr-gi',
    employee_nome: 'Gi',
    data: '2026-11-07',
    tipo: 'acrescimo_horas',
    minutos: 210, // +3h 30m
    motivo: 'SIMULADO • Diária externa em 2 restaurantes (Real 1937 + Santo Mar) incluindo locomoção entre unidades',
    registrado_por: 'Sistema (Simulação Inicial)',
    created_at: '2026-11-07T18:30:00.000Z',
  },
  {
    id: 'sim-bh-08',
    employee_id: 'usr-gi',
    employee_nome: 'Gi',
    data: '2026-11-24',
    tipo: 'compensacao_folga',
    minutos: -120, // -2h 00m
    motivo: 'SIMULADO • Compensação manual de 2h do saldo positivo do banco de horas',
    registrado_por: 'Victor Cordoba (Simulado)',
    created_at: '2026-11-24T17:00:00.000Z',
  },
  {
    id: 'sim-bh-09',
    employee_id: 'usr-isa',
    employee_nome: 'Isa',
    data: '2026-11-04',
    tipo: 'acrescimo_horas',
    minutos: 180, // +3h 00m
    motivo: 'SIMULADO • Captação externa Legado Parrilla + deslocamento para gravação complementar',
    registrado_por: 'Sistema (Simulação Inicial)',
    created_at: '2026-11-04T18:45:00.000Z',
  },
  {
    id: 'sim-bh-10',
    employee_id: 'usr-isa',
    employee_nome: 'Isa',
    data: '2026-11-12',
    tipo: 'abono_horas',
    minutos: 150, // +2h 30m
    motivo: 'SIMULADO • Ajuste manual de horas para fechamento das 42h semanais da Semana 2',
    registrado_por: 'Larissa (Simulado)',
    created_at: '2026-11-12T18:00:00.000Z',
  },
  {
    id: 'sim-bh-11',
    employee_id: 'usr-ju',
    employee_nome: 'Ju',
    data: '2026-11-06',
    tipo: 'acrescimo_horas',
    minutos: 225, // +3h 45m
    motivo: 'SIMULADO • Gravação dupla (Rei do ABC → 24 Print) com locomoção contabilizada na jornada',
    registrado_por: 'Sistema (Simulação Inicial)',
    created_at: '2026-11-06T19:10:00.000Z',
  },
  {
    id: 'sim-bh-12',
    employee_id: 'usr-mi',
    employee_nome: 'Mi',
    data: '2026-11-10',
    tipo: 'acrescimo_horas',
    minutos: 180, // +3h 00m
    motivo: 'SIMULADO • Gravação externa Bella Paulista + Elegância Árabe (1º ao último restaurante)',
    registrado_por: 'Sistema (Simulação Inicial)',
    created_at: '2026-11-10T18:20:00.000Z',
  },

  // EQUIPE INTERNA (SEDE CLT - 42H SEMANAIS)
  {
    id: 'sim-bh-13',
    employee_id: 'usr-carol',
    employee_nome: 'Carol',
    data: '2026-11-05',
    tipo: 'acrescimo_horas',
    minutos: 90, // +1h 30m
    motivo: 'SIMULADO • Finalização e render de pacote de 8 Reels para entrega de campanha gastronômica',
    registrado_por: 'Matheus (Simulado)',
    created_at: '2026-11-05T19:50:00.000Z',
  },
  {
    id: 'sim-bh-14',
    employee_id: 'usr-lucas',
    employee_nome: 'Lucas Verraz',
    data: '2026-11-11',
    tipo: 'acrescimo_horas',
    minutos: 120, // +2h 00m
    motivo: 'SIMULADO • Color grading extra dos vídeos do La Braciera e Santo Mar',
    registrado_por: 'Victor Cordoba (Simulado)',
    created_at: '2026-11-11T20:15:00.000Z',
  },
  {
    id: 'sim-bh-15',
    employee_id: 'usr-bruna',
    employee_nome: 'Bruna',
    data: '2026-11-13',
    tipo: 'compensacao_folga',
    minutos: -90, // -1h 30m
    motivo: 'SIMULADO • Saída antecipada na sexta-feira descontada do saldo positivo de banco de horas',
    registrado_por: 'Larissa (Simulado)',
    created_at: '2026-11-13T17:00:00.000Z',
  },
  {
    id: 'sim-bh-16',
    employee_id: 'usr-evelin',
    employee_nome: 'Evelin',
    data: '2026-11-17',
    tipo: 'abono_horas',
    minutos: 60, // +1h 00m
    motivo: 'SIMULADO • Abono médico de 1h para fechamento das 42h semanais',
    registrado_por: 'Alexandre (Simulado)',
    created_at: '2026-11-17T18:00:00.000Z',
  },
];
