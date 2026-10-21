'use client';

import React from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { parseDateIso, formatTimeClean, WEEKDAYS_SHORT, MONTH_NAMES } from '@/lib/date-utils';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '@/types/database';
import { EmployeeBadge } from '../agenda/EmployeeBadge';
import { X, Plus, Calendar, Clock, MapPin, UserCheck, FileText } from 'lucide-react';

export function DayDetailModal() {
  const {
    dayDetailDate,
    closeDayDetailModal,
    events,
    employees,
    openEditEventModal,
    openNewEventModal,
    userRole,
  } = useAgenda();

  if (!dayDetailDate) return null;

  const dateObj = parseDateIso(dayDetailDate);
  const dayName = WEEKDAYS_SHORT[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1];
  const dayNum = dateObj.getDate();
  const monthName = MONTH_NAMES[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  // Eventos do dia
  const dayEvents = events
    .filter((e) => e.data === dayDetailDate && e.status !== 'cancelado')
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  // Funcionários ocupados no dia
  const busyEmployeeIds = new Set<string>();
  dayEvents.forEach((ev) => {
    (ev.assigned_employee_ids || []).forEach((id) => busyEmployeeIds.add(id));
  });

  // Funcionários LIVRES no dia
  const freeEmployees = employees.filter((emp) => emp.ativo && !busyEmployeeIds.has(emp.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={closeDayDetailModal}
    >
      <div
        className="relative w-full max-w-lg bg-[#0e0f15]/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 shadow-2xl p-5 sm:p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto pb-safe sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab bar para mobile */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700 mx-auto -mt-1 sm:hidden shrink-0" />

        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#FF6600] uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              <span>{dayName}</span>
            </div>
            <h3 className="text-xl font-bold text-white font-heading mt-0.5">
              {dayNum} de {monthName} de {year}
            </h3>
          </div>

          <button
            type="button"
            onClick={closeDayDetailModal}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seção: Equipe Livre Neste Dia */}
        <div className="p-3.5 rounded-2xl bg-[#14151c] border border-white/5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Disponíveis neste dia ({freeEmployees.length}):</span>
          </div>
          {freeEmployees.length === 0 ? (
            <p className="text-xs text-zinc-500 italic">Toda a equipe está escalada neste dia.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {freeEmployees.some((e) => e.funcao === 'filmmaker') && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-[#38bdf8] uppercase">Filmmakers:</span>
                  {freeEmployees
                    .filter((e) => e.funcao === 'filmmaker')
                    .map((emp) => (
                      <EmployeeBadge key={emp.id} employee={emp} size="sm" />
                    ))}
                </div>
              )}
              {freeEmployees.some((e) => e.funcao === 'criadora') && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-[#f472b6] uppercase">Modelos:</span>
                  {freeEmployees
                    .filter((e) => e.funcao === 'criadora')
                    .map((emp) => (
                      <EmployeeBadge key={emp.id} employee={emp} size="sm" />
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lista de Eventos do Dia */}
        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Gravações agendadas ({dayEvents.length})
          </div>

          {dayEvents.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 italic">
              Nenhuma gravação agendada para esta data.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {dayEvents.map((ev) => {
                const colorInfo = EVENT_TYPE_COLORS[ev.tipo] || EVENT_TYPE_COLORS.gravacao;
                const typeLabel = EVENT_TYPE_LABELS[ev.tipo] || 'Gravação';

                return (
                  <div
                    key={ev.id}
                    onClick={() => {
                      closeDayDetailModal();
                      openEditEventModal(ev);
                    }}
                    className={`relative p-3.5 rounded-2xl border bg-[#14151c] border-white/5 hover:border-[#FF6600]/50 transition-all cursor-pointer shadow-sm flex flex-col gap-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${colorInfo.bg} ${colorInfo.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${colorInfo.dot}`} />
                        {typeLabel}
                      </span>

                      <div className="flex items-center gap-1 text-xs font-semibold text-zinc-300">
                        <Clock className="w-3.5 h-3.5 text-[#FF6600]" />
                        <span>
                          {formatTimeClean(ev.hora_inicio)} - {formatTimeClean(ev.hora_fim)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {ev.client?.nome || 'Cliente'}
                      </h4>
                      {ev.local && (
                        <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-zinc-500" />
                          <span>{ev.local}</span>
                        </div>
                      )}
                    </div>

                    {/* Badge do Relatório do Filmmaker */}
                    <div className="pt-0.5">
                      {ev.relatorio_filmmaker?.preenchido ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                          <FileText className="w-3 h-3" />
                          Relatório OK: {ev.relatorio_filmmaker.takes_gravados_qtd || 0} takes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FF6600]/10 text-[#FF6600] border border-[#FF6600]/25 text-[10px] font-semibold">
                          <FileText className="w-3 h-3" />
                          Relatório Pendente (Clique p/ abrir)
                        </span>
                      )}
                    </div>

                    {/* Chips dos funcionários atribuídos */}
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-white/5">
                      {(ev.employees || []).map((emp) => (
                        <EmployeeBadge key={emp.id} employee={emp} size="sm" />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Botão de Nova Gravação Neste Dia (Admin) */}
        {userRole === 'admin' && (
          <button
            type="button"
            onClick={() => {
              closeDayDetailModal();
              openNewEventModal(dayDetailDate);
            }}
            className="gradient-cta flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all cursor-pointer mt-1"
          >
            <Plus className="w-4 h-4" />
            <span>Nova gravação neste dia</span>
          </button>
        )}
      </div>
    </div>
  );
}
