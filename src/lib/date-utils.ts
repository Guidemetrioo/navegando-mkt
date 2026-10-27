/**
 * Utilitários de data e hora para Navegando MKT
 * Regras:
 * - Idioma pt-BR
 * - Fuso America/Sao_Paulo
 * - Semana começando na segunda-feira
 * - Manipulação de 'date' (YYYY-MM-DD) e 'time' (HH:mm) puros para evitar deslocamento de fuso
 */

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MONTH_NAMES_SHORT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez'
];

export const WEEKDAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/**
 * Formata um objeto Date para YYYY-MM-DD puro em fuso local
 */
export function formatDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Converte string YYYY-MM-DD para objeto Date seguro ao meio-dia
 * para evitar qualquer virada de data por fuso
 */
export function parseDateIso(isoStr: string): Date {
  const [year, month, day] = isoStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Retorna a segunda-feira da semana de uma data
 */
export function getMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  const day = d.getDay(); // 0 é domingo, 1 é segunda
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Retorna os 7 dias da semana (Segunda a Domingo)
 */
export function getWeekDates(date: Date): Date[] {
  const monday = getMonday(date);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i, 12, 0, 0);
    days.push(next);
  }
  return days;
}

/**
 * Retorna o título da semana: "12 out – 18 out 2026"
 */
export function formatWeekRange(date: Date): string {
  const week = getWeekDates(date);
  const start = week[0];
  const end = week[6];

  const startDay = start.getDate();
  const startMonth = MONTH_NAMES_SHORT[start.getMonth()];
  const endDay = end.getDate();
  const endMonth = MONTH_NAMES_SHORT[end.getMonth()];
  const endYear = end.getFullYear();

  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${endYear}`;
}

/**
 * Retorna título do mês: "Outubro 2026"
 */
export function formatMonthYear(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Matriz de dias para a visualização Mês (grade 7 colunas)
 */
export function getMonthMatrix(year: number, monthIndex: number): { date: Date; isCurrentMonth: boolean; iso: string }[][] {
  const firstOfMonth = new Date(year, monthIndex, 1, 12, 0, 0);
  const startMonday = getMonday(firstOfMonth);

  const matrix: { date: Date; isCurrentMonth: boolean; iso: string }[][] = [];
  const currentDay = new Date(startMonday);

  // Criar 5 ou 6 semanas até cobrir o mês
  for (let week = 0; week < 6; week++) {
    const row: { date: Date; isCurrentMonth: boolean; iso: string }[] = [];
    for (let col = 0; col < 7; col++) {
      row.push({
        date: new Date(currentDay),
        isCurrentMonth: currentDay.getMonth() === monthIndex,
        iso: formatDateIso(currentDay),
      });
      currentDay.setDate(currentDay.getDate() + 1);
    }
    matrix.push(row);
    // Se a semana já passou totalmente do mês atual e cobriu pelo menos 4 ou 5 semanas
    if (week >= 4 && row[0].date.getMonth() !== monthIndex && row[6].date.getMonth() !== monthIndex) {
      break;
    }
  }

  return matrix;
}

/**
 * Compara dois horários no formato HH:mm ou HH:mm:ss
 */
export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * Checa sobreposição de horários
 */
export function hasTimeOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const a1 = parseTimeToMinutes(startA);
  const a2 = parseTimeToMinutes(endA);
  const b1 = parseTimeToMinutes(startB);
  const b2 = parseTimeToMinutes(endB);
  return a1 < b2 && a2 > b1;
}

/**
 * Formata time para HH:mm limpo
 */
export function formatTimeClean(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
}

/** Agency reporting day, independent of the device timezone. */
export function todayInSaoPaulo(now=new Date()): string {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const part=(type:string)=>parts.find(p=>p.type===type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
