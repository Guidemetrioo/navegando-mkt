import { EventItem, Employee, Client, ConflictRecord } from '@/types/database';
import { hasTimeOverlap } from './date-utils';

export interface CheckConflictParams {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  employeeIds: string[];
  excludeEventId?: string;
  allEvents: EventItem[];
  allEmployees: Employee[];
  allClients: Client[];
}

/**
 * Motor de detecção de conflitos de horário
 * Retorna lista de conflitos detalhados para aviso no formulário
 */
export function findEventConflicts({
  date,
  startTime,
  endTime,
  employeeIds,
  excludeEventId,
  allEvents,
  allEmployees,
  allClients,
}: CheckConflictParams): ConflictRecord[] {
  const conflicts: ConflictRecord[] = [];

  if (!date || !startTime || !endTime || employeeIds.length === 0) {
    return conflicts;
  }

  // Filtrar eventos do mesmo dia, ativos (não cancelados), ignorando o próprio evento se for edição
  const sameDayEvents = allEvents.filter(
    (ev) =>
      ev.data === date &&
      ev.status !== 'cancelado' &&
      (!excludeEventId || ev.id !== excludeEventId)
  );

  for (const ev of sameDayEvents) {
    if (hasTimeOverlap(startTime, endTime, ev.hora_inicio, ev.hora_fim)) {
      const assigned = ev.assigned_employee_ids || [];
      const intersectingEmployeeIds = employeeIds.filter((empId) => assigned.includes(empId));

      for (const empId of intersectingEmployeeIds) {
        const emp = allEmployees.find((e) => e.id === empId);
        const cli = allClients.find((c) => c.id === ev.client_id);

        conflicts.push({
          employee_id: empId,
          employee_name: emp ? emp.nome : 'Funcionário',
          event_id: ev.id,
          client_name: cli ? cli.nome : 'Cliente',
          hora_inicio: ev.hora_inicio,
          hora_fim: ev.hora_fim,
          local: ev.local,
        });
      }
    }
  }

  return conflicts;
}
