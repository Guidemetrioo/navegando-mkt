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
          const isPast = iso < todayIso;

          const dayEvents = filteredEvents.filter((ev) => ev.data === iso);

          return (
            <div
              key={iso}
              className={`flex flex-col rounded-2xl border transition-all p-3 min-h-[220px] ${
                isToday
                  ? 'border-2 border-[var(--ui-accent)] bg-[var(--ui-accent)]/[0.06] ring-1 ring-[var(--ui-accent)]/30 shadow-lg shadow-[var(--ui-accent)]/15'
                  : isPast
                  ? 'bg-[var(--ui-surface)]/55 border-[var(--ui-border)]/60 opacity-85'
                  : 'bg-[var(--ui-surface)] border-[var(--ui-border)]'
              }`}
            >
              {/* Cabeçalho do Dia */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--ui-border)]/80">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-sm font-bold font-heading ${
                      isToday
                        ? 'text-[var(--ui-accent)]'
                        : isPast
                        ? 'text-zinc-500'
                        : 'text-zinc-100'
                    }`}
                  >
                    {dayName}
                  </span>
                  {isToday && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-[var(--ui-accent)] text-white shadow-sm">
                      Hoje
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium ${isToday ? 'text-[var(--ui-accent)] font-semibold' : isPast ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {dayNumber} {monthShort}
                </span>
              </div>

              {/* Lista de Cartões de Eventos */}
              <div className="flex flex-col gap-2.5 flex-1">
                {dayEvents.length === 0 ? (
                  <div className="flex items-center justify-center flex-1 py-6 text-xs text-zinc-500 italic">
                    Nenhuma gravação
                  </div>
                ) : (
                  dayEvents.map((ev) => {
                    const colorInfo = EVENT_TYPE_COLORS[ev.tipo] || EVENT_TYPE_COLORS.gravacao;
                    const typeLabel = EVENT_TYPE_LABELS[ev.tipo] || 'Gravação';
                    const isPastEvent = ev.data < todayIso;
                    const isTodayEvent = ev.data === todayIso;

                    return (
                      <div
                        key={ev.id}
                        onClick={() => openEditEventModal(ev)}
                        className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                          isPastEvent
                            ? 'bg-zinc-900/50 border-zinc-700/45 opacity-75 hover:opacity-100 hover:border-zinc-500/60'
                            : isTodayEvent
                            ? 'bg-[var(--ui-raised)] border-[var(--ui-accent)]/45 hover:border-[var(--ui-accent)] shadow-md shadow-[var(--ui-accent)]/10'
                            : 'bg-[var(--ui-raised)] border-[var(--ui-border)] hover:border-[var(--ui-accent)]/50 shadow-sm hover:shadow-md'
                        }`}
                      >
                        {/* Linha vertical de destaque à esquerda */}
                        <div
                          className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${
                            isPastEvent
                              ? 'bg-zinc-600'
                              : ev.tipo === 'gravacao'
                              ? 'bg-[var(--ui-accent)]'
                              : ev.tipo === 'foto'
                              ? 'bg-[#0ea5e9]'
                              : ev.tipo === 'edicao'
                              ? 'bg-[#a855f7]'
                              : 'bg-zinc-500'
                          }`}
                        />

                        {/* Topo do cartão: Horário e Tipo */}
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 pl-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPastEvent ? 'bg-zinc-500' : colorInfo.dot}`} />
                          <span className={`font-semibold ${isPastEvent ? 'text-zinc-400' : 'text-zinc-200'}`}>
                            {formatTimeClean(ev.hora_inicio)}–{formatTimeClean(ev.hora_fim)}
                          </span>
                          <span>•</span>
                          <span className="truncate">{typeLabel}</span>
                          {isPastEvent && (
                            <span className="ml-auto text-[9px] font-semibold uppercase tracking-wide text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded shrink-0">
                              Passou
                            </span>
                          )}
                        </div>

                        {/* Nome do Cliente */}
                        <div className={`text-sm font-bold pl-1.5 leading-snug truncate ${isPastEvent ? 'text-zinc-400' : 'text-foreground'}`}>
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
