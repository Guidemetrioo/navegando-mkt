'use client';

import { MobileMonthCalendar } from './MobileMonthCalendar';
import React from 'react';
import { useAgenda } from '@/context/AgendaContext';
import {
  getMonthMatrix,
  WEEKDAYS_SHORT,
  formatTimeClean,
  todayInSaoPaulo,
} from '@/lib/date-utils';
import { EVENT_TYPE_COLORS } from '@/types/database';
import { EmployeeBadge } from './EmployeeBadge';

export function MonthView() {
  const {
    currentDate,
    filteredEvents,
    openDayDetailModal,
    openEditEventModal,
    openNewEventModal,
    userRole,
  } = useAgenda();


  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const matrix = getMonthMatrix(year, month);
  const todayIso = todayInSaoPaulo();

  return (
    <>
    <MobileMonthCalendar />
    <div className="hidden sm:block w-full bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white rounded-2xl border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 shadow-sm relative">
      {/* Cabeçalho dos dias da semana (Seg..Dom) */}
      <div className="grid grid-cols-7 border-b border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-slate-50 text-xs font-semibold text-zinc-400 dark:text-zinc-400 text-zinc-600 text-center py-2.5 rounded-t-2xl">
        {WEEKDAYS_SHORT.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="divide-y divide-[var(--ui-border)] dark:divide-[var(--ui-border)] divide-slate-200">
        {matrix.map((week, weekIdx) => (
          <div
            key={weekIdx}
            className="grid grid-cols-7 divide-x divide-[var(--ui-border)] dark:divide-[var(--ui-border)] divide-slate-200"
          >
            {week.map((cell) => {
              const dayEvents = filteredEvents
                .filter((ev) => ev.data === cell.iso && ev.status !== 'cancelado')
                .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
              const isToday = cell.iso === todayIso;
              const hasEvents = dayEvents.length > 0;
              return (
                <div
                  key={cell.iso}
                  onClick={() => openDayDetailModal(cell.iso)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver compromissos de ${cell.iso}`}
                  onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openDayDetailModal(cell.iso); } }}
                  className={`relative min-h-[82px] sm:min-h-[120px] p-1.5 sm:p-2 transition-colors cursor-pointer group flex flex-col justify-between ${
                    !cell.isCurrentMonth
                      ? 'bg-[var(--ui-surface)]/60 dark:bg-[var(--ui-surface)]/60 bg-slate-100/40 text-zinc-600 dark:text-zinc-600'
                      : 'hover:bg-[var(--ui-raised)] dark:hover:bg-[var(--ui-raised)] hover:bg-slate-50 text-zinc-200 dark:text-zinc-200 text-zinc-900'
                  }`}
                >
                  {/* Topo da célula: Número do dia + contador + botão rápido de adicionar */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center justify-center text-xs font-semibold rounded-full w-6 h-6 transition-transform group-hover:scale-105 ${
                          isToday
                            ? 'brand-solid bg-[var(--ui-accent)] text-foreground font-bold shadow-md shadow-[var(--ui-accent)]/30'
                            : !cell.isCurrentMonth
                            ? 'text-zinc-600 dark:text-zinc-600 text-zinc-400'
                            : 'text-zinc-300 dark:text-zinc-300 text-zinc-700'
                        }`}
                      >
                        {cell.date.getDate()}
                      </span>

                      {hasEvents && (
                        <span className="hidden md:inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--ui-accent)]/15 text-[var(--ui-accent)] border border-[var(--ui-accent)]/25">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {userRole === 'admin' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openNewEventModal(cell.iso);
                        }}
                        title="Agendar novo compromisso neste dia"
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md bg-[var(--ui-accent)]/15 hover:bg-[var(--ui-accent)] text-[var(--ui-accent)] hover:text-foreground flex items-center justify-center transition-all cursor-pointer"
                       data-text-action="true"><span className="text-action-label">{"Novo"}</span></button>
                    )}
                  </div>

                  {/* VISÃO DESKTOP COMPACTA (Célula padrão) */}
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
                          title={`${formatTimeClean(ev.hora_inicio)} - ${ev.client?.nome || 'Compromisso'}`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colorInfo.dot}`} />
                            <span className="font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-800 text-[10px]">
                              {formatTimeClean(ev.hora_inicio)}
                            </span>
                            <span className="truncate font-medium text-zinc-200 dark:text-zinc-200 text-zinc-900">
                              {ev.client?.nome || 'Compromisso'}
                            </span>
                          </div>

                          <div className="flex items-center -space-x-1 shrink-0 ml-1">
                            {(ev.employees || []).slice(0, 3).map((emp) => (
                              <EmployeeBadge
                                key={emp.id}
                                employee={emp}
                                size="sm"
                                showName={false}
                                className="ring-1 ring-[var(--ui-surface)] w-4 h-4 text-[9px]"
                              />
                            ))}
                            {(ev.employees || []).length > 3 && (
                              <span className="w-4 h-4 rounded-full bg-zinc-700 text-[8px] flex items-center justify-center text-foreground ring-1 ring-[var(--ui-surface)]">
                                +{(ev.employees || []).length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-[var(--ui-accent)] font-bold pl-1 flex items-center gap-1">
                        +{dayEvents.length - 3} mais (clique no dia)
                      </span>
                    )}
                  </div>

                  {/* VISÃO MOBILE: Pontos coloridos por tipo */}
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
    </>

  );
}
