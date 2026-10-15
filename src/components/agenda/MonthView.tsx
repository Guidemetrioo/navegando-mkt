'use client';

import React from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { getMonthMatrix, WEEKDAYS_SHORT, formatDateIso, formatTimeClean } from '@/lib/date-utils';
import { EVENT_TYPE_COLORS } from '@/types/database';
import { EmployeeBadge } from './EmployeeBadge';

export function MonthView() {
  const {
    currentDate,
    filteredEvents,
    openDayDetailModal,
    openEditEventModal,
  } = useAgenda();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const matrix = getMonthMatrix(year, month);

  // Hoje no protótipo é 14 de Outubro de 2026 (ou hoje real)
  const todayIso = '2026-10-14';

  return (
    <div className="w-full bg-[#16171b] dark:bg-[#16171b] bg-white rounded-2xl border border-[#26282f] dark:border-[#26282f] border-slate-200 overflow-hidden shadow-sm">
      {/* Cabeçalho dos dias da semana (Seg..Dom) */}
      <div className="grid grid-cols-7 border-b border-[#26282f] dark:border-[#26282f] border-slate-200 bg-[#121316] dark:bg-[#121316] bg-slate-50 text-xs font-semibold text-zinc-400 dark:text-zinc-400 text-zinc-600 text-center py-2.5">
        {WEEKDAYS_SHORT.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="divide-y divide-[#26282f] dark:divide-[#26282f] divide-slate-200">
        {matrix.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 divide-x divide-[#26282f] dark:divide-[#26282f] divide-slate-200">
            {week.map((cell) => {
              const dayEvents = filteredEvents.filter((ev) => ev.data === cell.iso);
              const isToday = cell.iso === todayIso;
              const hasEvents = dayEvents.length > 0;

              return (
                <div
                  key={cell.iso}
                  onClick={() => openDayDetailModal(cell.iso)}
                  className={`min-h-[75px] sm:min-h-[110px] p-1.5 sm:p-2 transition-colors cursor-pointer group flex flex-col justify-between ${
                    !cell.isCurrentMonth
                      ? 'bg-[#121316]/60 dark:bg-[#121316]/60 bg-slate-100/40 text-zinc-600 dark:text-zinc-600'
                      : 'hover:bg-[#1c1e24] dark:hover:bg-[#1c1e24] hover:bg-slate-50 text-zinc-200 dark:text-zinc-200 text-zinc-900'
                  }`}
                >
                  {/* Número do dia */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center justify-center text-xs font-semibold rounded-full w-6 h-6 transition-transform group-hover:scale-105 ${
                        isToday
                          ? 'bg-[#FF5A3C] text-white font-bold shadow-md shadow-[#FF5A3C]/30'
                          : !cell.isCurrentMonth
                          ? 'text-zinc-600 dark:text-zinc-600 text-zinc-400'
                          : 'text-zinc-300 dark:text-zinc-300 text-zinc-700'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>

                    {/* Badge contador discreto no desktop se houver eventos */}
                    {hasEvents && (
                      <span className="hidden md:inline-block text-[10px] text-zinc-500 font-medium">
                        {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
                      </span>
                    )}
                  </div>

                  {/* VISÃO DESKTOP: Exibe até 3 eventos detalhados com cliente, horário e funcionários */}
                  <div className="hidden sm:flex flex-col gap-1 mt-1.5 flex-1">
                    {dayEvents.slice(0, 3).map((ev) => {
                      const colorInfo = EVENT_TYPE_COLORS[ev.tipo] || EVENT_TYPE_COLORS.gravacao;
                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditEventModal(ev);
                          }}
                          className={`text-[11px] p-1 rounded-md border flex items-center justify-between gap-1 transition-all hover:brightness-110 truncate ${colorInfo.bg} ${colorInfo.border} border-opacity-40`}
                          title={`${formatTimeClean(ev.hora_inicio)} - ${ev.client?.nome || 'Cliente'}`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colorInfo.dot}`} />
                            <span className="font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-800 text-[10px]">
                              {formatTimeClean(ev.hora_inicio)}
                            </span>
                            <span className="truncate font-medium text-zinc-200 dark:text-zinc-200 text-zinc-900">
                              {ev.client?.nome || 'Cliente'}
                            </span>
                          </div>

                          {/* Bolinhas dos funcionários atribuídos */}
                          <div className="flex items-center -space-x-1 shrink-0 ml-1">
                            {(ev.employees || []).slice(0, 3).map((emp) => (
                              <EmployeeBadge
                                key={emp.id}
                                employee={emp}
                                size="sm"
                                showName={false}
                                className="ring-1 ring-[#16171b] w-4 h-4 text-[9px]"
                              />
                            ))}
                            {(ev.employees || []).length > 3 && (
                              <span className="w-4 h-4 rounded-full bg-zinc-700 text-[8px] flex items-center justify-center text-white ring-1 ring-[#16171b]">
                                +{(ev.employees || []).length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-zinc-400 font-medium pl-1">
                        +{dayEvents.length - 3} mais
                      </span>
                    )}
                  </div>

                  {/* VISÃO MOBILE: Pontos coloridos por tipo (exatamente como no protótipo de referência) */}
                  <div className="sm:hidden flex flex-wrap gap-1 mt-auto pt-1 justify-center sm:justify-start">
                    {dayEvents.map((ev) => {
                      const colorInfo = EVENT_TYPE_COLORS[ev.tipo] || EVENT_TYPE_COLORS.gravacao;
                      return (
                        <span
                          key={ev.id}
                          className={`w-2 h-2 rounded-full shrink-0 ${colorInfo.dot}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
