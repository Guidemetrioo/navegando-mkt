'use client';
import { todayInSaoPaulo } from '@/lib/date-utils';

import React from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { getWeekDates, WEEKDAYS_SHORT, MONTH_NAMES_SHORT, formatDateIso, formatTimeClean } from '@/lib/date-utils';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '@/types/database';
import { EmployeeBadge } from './EmployeeBadge';
import { Plus, MapPin } from 'lucide-react';

export function WeekView() {
  const {
    currentDate,
    filteredEvents,
    openEditEventModal,
    openNewEventModal,
    userRole,
  } = useAgenda();

  const weekDays = getWeekDates(currentDate);
  const todayIso = todayInSaoPaulo();

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Grade de 7 dias (empilhadas no mobile, grade responsiva no desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((day, idx) => {
          const iso = formatDateIso(day);
          const dayName = WEEKDAYS_SHORT[idx];
          const dayNumber = day.getDate();
          const monthShort = MONTH_NAMES_SHORT[day.getMonth()];
          const isToday = iso === todayIso;

          const dayEvents = filteredEvents.filter((ev) => ev.data === iso);

          return (
            <div
              key={iso}
              className={`flex flex-col bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white rounded-2xl border transition-all p-3 min-h-[220px] ${
                isToday
                  ? 'border-[var(--ui-accent)]/70 shadow-md shadow-[var(--ui-accent)]/10'
                  : 'border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200'
              }`}
            >
              {/* Cabeçalho do Dia */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-100">
                <span
                  className={`text-sm font-bold font-heading ${
                    isToday ? 'text-[var(--ui-accent)]' : 'text-zinc-100 dark:text-zinc-100 text-zinc-900'
                  }`}
                >
                  {dayName}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-400 text-zinc-500 font-medium">
                  {dayNumber} {monthShort}
                </span>
              </div>

              {/* Lista de Cartões de Eventos */}
              <div className="flex flex-col gap-2.5 flex-1">
                {dayEvents.length === 0 ? (
                  <div className="flex items-center justify-center flex-1 py-6 text-xs text-zinc-500 dark:text-zinc-500 text-zinc-400 italic">
                    Nenhuma gravação
                  </div>
                ) : (
                  dayEvents.map((ev) => {
                    const colorInfo = EVENT_TYPE_COLORS[ev.tipo] || EVENT_TYPE_COLORS.gravacao;
                    const typeLabel = EVENT_TYPE_LABELS[ev.tipo] || 'Gravação';

                    return (
                      <div
                        key={ev.id}
                        onClick={() => openEditEventModal(ev)}
                        className={`group relative p-2.5 rounded-xl border bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-50 border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 hover:border-[var(--ui-accent)]/50 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col gap-1.5`}
                      >
                        {/* Linha vertical de destaque à esquerda */}
                        <div
                          className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${
                            ev.tipo === 'gravacao'
                              ? 'bg-[var(--ui-accent)]'
                              : ev.tipo === 'foto'
                              ? 'bg-[#0ea5e9]'
                              : ev.tipo === 'edicao'
                              ? 'bg-[#a855f7]'
                              : 'bg-zinc-500'
                          }`}
                        />

                        {/* Topo do cartão: Horário e Tipo */}
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-400 text-zinc-600 pl-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${colorInfo.dot}`} />
                          <span className="font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-800">
                            {formatTimeClean(ev.hora_inicio)}–{formatTimeClean(ev.hora_fim)}
                          </span>
                          <span>•</span>
                          <span className="truncate">{typeLabel}</span>
                        </div>

                        {/* Nome do Cliente */}
                        <div className="text-sm font-bold text-foreground dark:text-foreground text-zinc-900 pl-1.5 leading-snug truncate">
                          {ev.client?.nome || 'Cliente não definido'}
                        </div>

                        {/* Local */}
                        {ev.local && (
                          <div className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-400 text-zinc-500 pl-1.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{ev.local}</span>
                          </div>
                        )}

                        {/* Chips dos funcionários atribuídos */}
                        <div className="flex flex-wrap gap-1 pt-1 pl-1.5">
                          {(ev.employees || []).map((emp) => (
                            <EmployeeBadge
                              key={emp.id}
                              employee={emp}
                              size="sm"
                              className="text-[10px]"
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Botão + Adicionar no rodapé do dia */}
              {userRole === 'admin' && (
                <button
                  type="button"
                  onClick={() => openNewEventModal(iso)}
                  className="mt-2.5 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl border border-dashed border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-300 hover:border-[var(--ui-accent)] hover:text-[var(--ui-accent)] text-xs font-medium text-zinc-400 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
