import type { Employee, PontoRegistro, TeamRole } from '../types/database';
import { todayInSaoPaulo } from './date-utils';

export interface PontoHistoryFilters {
  employeeId: string;
  clientId: string;
  tipo: string;
  startDate: string;
  endDate: string;
}

/** Start from the roster so employees without attendance are never omitted. */
export function teamPontoHistory(employees: Employee[], filteredPontos: PontoRegistro[], employeeId = 'all') {
  return employees.filter(e => employeeId === 'all' || e.id === employeeId)
    .map(employee => ({ employee, registros: filteredPontos.filter(p => p.employee_id === employee.id)
      .sort((a,b) => Date.parse(a.data_hora) - Date.parse(b.data_hora) || a.id.localeCompare(b.id)) }))
    .sort((a,b) => {
      if (!a.registros.length || !b.registros.length) {
        if (a.registros.length) return -1;
        if (b.registros.length) return 1;
        return a.employee.nome.localeCompare(b.employee.nome, 'pt-BR');
      }
      return Date.parse(a.registros[0].data_hora) - Date.parse(b.registros[0].data_hora)
        || a.employee.nome.localeCompare(b.employee.nome, 'pt-BR');
    });
}

/** Apply visibility before filters; date bounds include the whole agency business day. */
export function filterPontoHistory(
  pontos: PontoRegistro[], role: TeamRole | undefined, viewerId: string | null,
  filters: PontoHistoryFilters,
): PontoRegistro[] {
  const manager = role === 'dono' || role === 'gerente';
  return pontos.filter(p => {
    if (!manager && (!viewerId || p.employee_id !== viewerId)) return false;
    if (filters.employeeId !== 'all' && p.employee_id !== filters.employeeId) return false;
    if (filters.clientId === 'internal' ? Boolean(p.client_id) : filters.clientId !== 'all' && p.client_id !== filters.clientId) return false;
    if (filters.tipo !== 'all' && p.tipo !== filters.tipo) return false;
    const date = new Date(p.data_hora);
    if (!Number.isFinite(date.getTime())) return false;
    const day = todayInSaoPaulo(date);
    return (!filters.startDate || day >= filters.startDate) && (!filters.endDate || day <= filters.endDate);
  }).sort((a, b) => Date.parse(b.data_hora) - Date.parse(a.data_hora) || a.id.localeCompare(b.id));
}
