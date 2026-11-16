'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutGrid } from 'lucide-react';
import type { Client, EventItem } from '@/types/database';
import {
  formatTimeClean,
  getMonthMatrix,
  MONTH_NAMES,
  parseDateIso,
  todayInSaoPaulo,
  WEEKDAYS_SHORT,
} from '@/lib/date-utils';

export type CalendarStatusTone = 'red' | 'amber' | 'green';

export interface CalendarToneResult {
  tone: CalendarStatusTone;
  badgeText: string;
}

export interface CalendarLegendItem {
  tone: CalendarStatusTone;
  label: string;
}

interface ScheduleStatusCalendarProps {
  events: EventItem[];
  clients: Client[];
  currentMonth: Date;
  onChangeMonth: (nextMonth: Date) => void;
  legend: CalendarLegendItem[];
  getEventTone: (ev: EventItem) => CalendarToneResult;
  onSelectEvent: (ev: EventItem) => void;
  selectedDayIso?: string;
  onSelectDay?: (dayIso: string) => void;
}

const TONE_BOX_CLASSES: Record<CalendarStatusTone, string> = {
  red: 'border-2 border-rose-500 bg-rose-500/12 text-rose-100 hover:bg-rose-500/20',
  amber: 'border-2 border-amber-400 bg-amber-400/12 text-amber-100 hover:bg-amber-400/20',
  green: 'border-2 border-emerald-400 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25',
};

const TONE_DOT_CLASSES: Record<CalendarStatusTone, string> = {
  red: 'bg-rose-500 ring-2 ring-rose-500/35',
  amber: 'bg-amber-400 ring-2 ring-amber-400/35',
  green: 'bg-emerald-400 ring-2 ring-emerald-400/35',
};

/** Toggle between the existing card list and the monthly calendar agenda view. */
export function ViewStyleToggle({
  value,
  onChange,
}: {
  value: 'cards' | 'agenda';
  onChange: (next: 'cards' | 'agenda') => void;
}) {
  return (
    <div
      role="group"
      aria-label="Modo de visualização"
      className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shrink-0"
    >
      <button
        type="button"
        onClick={() => onChange('cards')}
        aria-pressed={value === 'cards'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          value === 'cards'
            ? 'bg-[var(--ui-accent)] text-black shadow'
            : 'text-zinc-400 hover:text-foreground'
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span>Cards</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('agenda')}
        aria-pressed={value === 'agenda'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          value === 'agenda'
            ? 'bg-[var(--ui-accent)] text-black shadow'
            : 'text-zinc-400 hover:text-foreground'
        }`}
      >
        <CalendarIcon className="w-3.5 h-3.5" />
        <span>Agenda</span>
      </button>
    </div>
  );
}

/** Shared status-coded monthly agenda calendar used in Briefings and Production Reports. */
export function ScheduleStatusCalendar({
  events,
  clients,
  currentMonth,
  onChangeMonth,
  legend,
  getEventTone,
  onSelectEvent,
  selectedDayIso,
  onSelectDay,
}: ScheduleStatusCalendarProps) {
  const todayIso = todayInSaoPaulo();
  const [mobilePickedDay, setMobilePickedDay] = useState<string>(todayIso);
  const activeMobileDay = selectedDayIso || mobilePickedDay;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const matrix = useMemo(() => getMonthMatrix(year, month), [year, month]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const ev of events) {
      const list = map.get(ev.data) || [];
      list.push(ev);
      map.set(ev.data, list);
    }
    for (const [k, list] of map.entries()) {
      map.set(
        k,
        [...list].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
      );
    }
    return map;
  }, [events]);

  const resolveClientName = (ev: EventItem) =>
    ev.client?.nome || clients.find((c) => c.id === ev.client_id)?.nome || 'Restaurante';

  const shiftMonth = (delta: number) => {
    onChangeMonth(new Date(year, month + delta, 1, 12, 0, 0));
  };

  const handleGoToday = () => {
    const todayDate = parseDateIso(todayIso);
    onChangeMonth(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1, 12, 0, 0));
    setMobilePickedDay(todayIso);
  };

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthEventsList = useMemo(
    () =>
      events
        .filter((ev) => ev.data.startsWith(monthPrefix))
        .sort((a, b) => a.data.localeCompare(b.data) || a.hora_inicio.localeCompare(b.hora_inicio)),
    [events, monthPrefix]
  );

  const selectedDayEvents = eventsByDay.get(activeMobileDay) || [];

  return (
    <div className="rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] overflow-hidden shadow-lg">
      {/* Cabeçalho do calendário: Navegação de mês + Legenda */}
      <div className="p-4 border-b border-[var(--ui-border)] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Mês anterior"
            className="p-2 rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] text-zinc-300 hover:text-foreground cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-sm sm:text-base font-extrabold text-foreground min-w-[165px] text-center">
            {MONTH_NAMES[month]} {year}
          </h3>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Próximo mês"
            className="p-2 rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] text-zinc-300 hover:text-foreground cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleGoToday}
            className="ml-1 px-3 py-1.5 rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] text-xs font-bold text-[var(--ui-accent)] hover:bg-[var(--ui-hover)] cursor-pointer"
          >
            Hoje
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          {legend.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1.5 text-zinc-300 font-semibold">
              <span className={`w-2.5 h-2.5 rounded-full ${TONE_DOT_CLASSES[item.tone]}`} />
              <span>{item.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Grade Mensal Desktop */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 border-b border-[var(--ui-border)] bg-[var(--ui-raised)]/50">
          {WEEKDAYS_SHORT.map((wd) => (
            <div
              key={wd}
              className="py-2 text-center text-[11px] font-bold uppercase tracking-wider text-zinc-400"
            >
              {wd}
            </div>
          ))}
        </div>

        <div className="divide-y divide-[var(--ui-border)]">
          {matrix.map((week, wIdx) => (
            <div key={wIdx} className="grid grid-cols-7 divide-x divide-[var(--ui-border)]">
              {week.map((cell) => {
                const dayEvents = eventsByDay.get(cell.iso) || [];
                const isToday = cell.iso === todayIso;
                const isSelected = selectedDayIso === cell.iso;

                return (
                  <div
                    key={cell.iso}
                    className={`min-h-[126px] p-1.5 flex flex-col gap-1.5 transition-colors ${
                      !cell.isCurrentMonth ? 'bg-[var(--ui-page)]/50 opacity-60' : ''
                    } ${isSelected ? 'ring-2 ring-inset ring-[var(--ui-accent)]/70 bg-[var(--ui-accent)]/5' : ''}`}
                  >
                    <div className="flex items-center justify-between px-1">
                      <button
                        type="button"
                        onClick={() => onSelectDay?.(cell.iso)}
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          isToday
                            ? 'bg-[var(--ui-accent)] text-black font-black'
                            : 'text-zinc-300 hover:bg-[var(--ui-raised)]'
                        } ${onSelectDay ? 'cursor-pointer' : 'cursor-default'}`}
                        title={onSelectDay ? `Filtrar dia ${cell.iso.split('-').reverse().join('/')}` : undefined}
                      >
                        {cell.date.getDate()}
                      </button>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-bold text-zinc-400">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {dayEvents.map((ev) => {
                        const status = getEventTone(ev);
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => onSelectEvent(ev)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] leading-tight transition-all cursor-pointer ${TONE_BOX_CLASSES[status.tone]}`}
                          >
                            <div className="font-mono font-bold text-[10px] opacity-90">
                              {formatTimeClean(ev.hora_inicio)} – {formatTimeClean(ev.hora_fim)}
                            </div>
                            <div className="font-bold truncate">{resolveClientName(ev)}</div>
                            <div className="text-[10px] opacity-85 truncate">{status.badgeText}</div>
                          </button>
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

      {/* Visão Mobile por Dia */}
      <div className="md:hidden p-3 space-y-3">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-400">
          {WEEKDAYS_SHORT.map((wd) => (
            <span key={wd}>{wd}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {matrix.flat().map((cell) => {
            const dayEvents = eventsByDay.get(cell.iso) || [];
            const hasEvents = dayEvents.length > 0;
            const isSelected = activeMobileDay === cell.iso;
            const worstTone: CalendarStatusTone | null = !hasEvents
              ? null
              : dayEvents.some((e) => getEventTone(e).tone === 'red')
                ? 'red'
                : dayEvents.some((e) => getEventTone(e).tone === 'amber')
                  ? 'amber'
                  : 'green';

            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => {
                  setMobilePickedDay(cell.iso);
                  onSelectDay?.(cell.iso);
                }}
                className={`relative h-10 rounded-lg text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                  !cell.isCurrentMonth ? 'opacity-40' : ''
                } ${
                  isSelected
                    ? 'bg-[var(--ui-accent)] text-black font-black'
                    : worstTone
                      ? TONE_BOX_CLASSES[worstTone]
                      : 'bg-[var(--ui-raised)] text-zinc-300 border border-[var(--ui-border)]'
                }`}
              >
                <span>{cell.date.getDate()}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2 pt-2 border-t border-[var(--ui-border)]">
          <div className="text-xs font-bold text-zinc-300">
            Compromissos de {activeMobileDay.split('-').reverse().join('/')} ({selectedDayEvents.length})
          </div>
          {selectedDayEvents.length === 0 ? (
            <p className="text-xs text-zinc-400 py-2">
              {monthEventsList.length > 0
                ? 'Nenhum compromisso neste dia. Toque nos dias destacados acima.'
                : 'Nenhum compromisso neste mês para os filtros selecionados.'}
            </p>
          ) : (
            selectedDayEvents.map((ev) => {
              const status = getEventTone(ev);
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onSelectEvent(ev)}
                  className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${TONE_BOX_CLASSES[status.tone]}`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold">{resolveClientName(ev)}</span>
                    <span className="font-mono text-[11px]">
                      {formatTimeClean(ev.hora_inicio)} – {formatTimeClean(ev.hora_fim)}
                    </span>
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5">{status.badgeText}</div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
