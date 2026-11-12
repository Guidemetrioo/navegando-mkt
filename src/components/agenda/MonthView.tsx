'use client';

import { MobileMonthCalendar } from './MobileMonthCalendar';
import React, { useState } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import {
  getMonthMatrix,
  WEEKDAYS_SHORT,
  MONTH_NAMES,
  formatTimeClean,
  todayInSaoPaulo,
} from '@/lib/date-utils';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '@/types/database';
import { EmployeeBadge } from './EmployeeBadge';
import { Plus, Clock, MapPin, Calendar, Maximize2, CheckCircle2 } from 'lucide-react';

export function MonthView() {
  const {
    currentDate,
    filteredEvents,
    openDayDetailModal,
    openEditEventModal,
    openNewEventModal,
    userRole,
  } = useAgenda();

  const [hoveredIso, setHoveredIso] = useState<string | null>(null);

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
            {week.map((cell, colIdx) => {
              const dayEvents = filteredEvents
                .filter((ev) => ev.data === cell.iso && ev.status !== 'cancelado')
                .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
              const isToday = cell.iso === todayIso;
              const hasEvents = dayEvents.length > 0;
              const isHovered = hoveredIso === cell.iso;

              // Posicionamento responsivo do card maximizado para nunca cortar nas bordas da tela
              const horizontalAlignClass =
                colIdx <= 1
                  ? 'left-0 origin-top-left'
                  : colIdx >= 5
                  ? 'right-0 origin-top-right'
                  : 'left-1/2 -translate-x-1/2 origin-top';

              const verticalAlignClass =
                weekIdx >= matrix.length - 2 ? 'bottom-0 origin-bottom' : 'top-0';

              const weekdayLabel = WEEKDAYS_SHORT[colIdx];
              const monthName = MONTH_NAMES[cell.date.getMonth()];

              return (
                <div
                  key={cell.iso}
                  onMouseEnter={() => setHoveredIso(cell.iso)}
                  onMouseLeave={() => setHoveredIso((prev) => (prev === cell.iso ? null : prev))}
                  onClick={() => openDayDetailModal(cell.iso)}
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
                        <Maximize2 className="w-2.5 h-2.5" />
                        +{dayEvents.length - 3} mais (passe o mouse)
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

                  {/* ==========================================================
                      CARD DO DIA MAXIMIZADO AO PASSAR O MOUSE (HOVER EXPANDIDO)
                      ========================================================== */}
                  {isHovered && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={`hidden sm:flex flex-col absolute z-40 ${horizontalAlignClass} ${verticalAlignClass} w-[310px] md:w-[350px] lg:w-[380px] rounded-2xl bg-[var(--ui-surface)] dark:bg-[#12131a] bg-white border-2 border-[var(--ui-accent)]/60 shadow-[0_20px_50px_rgba(0,0,0,0.65)] p-3.5 gap-3 animate-in fade-in zoom-in-95 duration-150 cursor-default`}
                    >
                      {/* Cabeçalho do Dia Maximizado */}
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--ui-border)]">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--ui-accent)]">
                              {weekdayLabel}
                            </span>
                            {isToday && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold brand-solid bg-[var(--ui-accent)] text-foreground">
                                HOJE
                              </span>
                            )}
                            <span className="text-[10px] text-zinc-400">
                              • {dayEvents.length}{' '}
                              {dayEvents.length === 1 ? 'compromisso' : 'compromissos'}
                            </span>
                          </div>
                          <h4 className="text-sm font-extrabold text-foreground font-heading mt-0.5">
                            {cell.date.getDate()} de {monthName}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {userRole === 'admin' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setHoveredIso(null);
                                openNewEventModal(cell.iso);
                              }}
                              className="px-2.5 py-1.5 rounded-xl brand-solid bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-foreground text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Novo</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Lista Detalhada de Todos os Compromissos do Dia */}
                      {dayEvents.length === 0 ? (
                        <div className="py-5 text-center flex flex-col items-center gap-2">
                          <Calendar className="w-6 h-6 text-zinc-500" />
                          <p className="text-xs text-zinc-400">
                            Nenhum compromisso agendado neste dia.
                          </p>
                          {userRole === 'admin' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setHoveredIso(null);
                                openNewEventModal(cell.iso);
                              }}
                              className="mt-1 px-3 py-1.5 rounded-xl bg-[var(--ui-raised)] hover:bg-[var(--ui-border)] border border-[var(--ui-accent)]/40 text-[var(--ui-accent)] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Agendar compromisso</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
                          {dayEvents.map((ev) => {
                            const colorInfo =
                              EVENT_TYPE_COLORS[ev.tipo] || EVENT_TYPE_COLORS.gravacao;
                            const typeLabel =
                              ev.tipo === 'foto'
                                ? 'Gravação'
                                : EVENT_TYPE_LABELS[ev.tipo] || 'Gravação';
                            const locationText = ev.local || ev.client?.endereco;

                            return (
                              <div
                                key={ev.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHoveredIso(null);
                                  openEditEventModal(ev);
                                }}
                                className="p-2.5 rounded-xl bg-[var(--ui-raised)] hover:bg-[var(--ui-border)]/70 border border-[var(--ui-border)] hover:border-[var(--ui-accent)]/50 transition-all cursor-pointer flex flex-col gap-1.5 shadow-sm"
                              >
                                {/* Linha 1: Horário + Tipo + Status */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                    <Clock className="w-3.5 h-3.5 text-[var(--ui-accent)] shrink-0" />
                                    <span>
                                      {formatTimeClean(ev.hora_inicio)} –{' '}
                                      {formatTimeClean(ev.hora_fim)}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${colorInfo.bg} ${colorInfo.text}`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${colorInfo.dot}`}
                                      />
                                      {typeLabel}
                                    </span>

                                    {ev.status === 'confirmado' && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        Confirmado
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Linha 2: Nome do Cliente / Compromisso */}
                                <div className="text-xs font-extrabold text-foreground leading-snug">
                                  {ev.client?.nome || 'Compromisso'}
                                </div>

                                {/* Linha 3: Endereço / Local */}
                                {locationText && (
                                  <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                                    <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                                    <span className="truncate">{locationText}</span>
                                  </div>
                                )}

                                {/* Linha 4: Observações se houver */}
                                {ev.observacoes && (
                                  <p className="text-[10px] text-zinc-400 line-clamp-2 bg-[var(--ui-surface)]/60 px-2 py-1 rounded-lg border border-[var(--ui-border)]">
                                    {ev.observacoes}
                                  </p>
                                )}

                                {/* Linha 5: Equipe escalada completa com nomes */}
                                {(ev.employees || []).length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-1 border-t border-[var(--ui-border)]/70">
                                    {(ev.employees || []).map((emp) => (
                                      <EmployeeBadge
                                        key={emp.id}
                                        employee={emp}
                                        size="sm"
                                        className="text-[10px]"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Rodapé do Card Maximizado */}
                      <div className="pt-2 border-t border-[var(--ui-border)] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHoveredIso(null);
                            openDayDetailModal(cell.iso);
                          }}
                          className="text-[11px] font-semibold text-zinc-300 hover:text-[var(--ui-accent)] transition-colors cursor-pointer"
                        >
                          Ver equipe disponível no dia →
                        </button>

                        {userRole === 'admin' && dayEvents.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHoveredIso(null);
                              openNewEventModal(cell.iso);
                            }}
                            className="text-[11px] font-bold text-[var(--ui-accent)] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Adicionar outro</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
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
