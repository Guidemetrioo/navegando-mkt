'use client';

import React from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { formatTimeClean, WEEKDAYS_SHORT, MONTH_NAMES_SHORT, parseDateIso } from '@/lib/date-utils';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '@/types/database';
import { EmployeeBadge } from './EmployeeBadge';
import { MapPin, Phone, Calendar, Clock, Navigation, CheckCircle2, Camera } from 'lucide-react';

export function MyAgendaView() {
  const { events, loggedEmployeeId, employees, openEditEventModal, openPontoModal, userRole } = useAgenda();

  const currentEmployee = employees.find((e) => e.id === loggedEmployeeId);

  // Filtrar apenas eventos em que o funcionário está escalado
  const myEvents = events
    .filter((ev) => (ev.assigned_employee_ids || []).includes(loggedEmployeeId))
    .sort((a, b) => {
      if (a.data !== b.data) return a.data.localeCompare(b.data);
      return a.hora_inicio.localeCompare(b.hora_inicio);
    });

  // Agrupar por data
  const eventsByDay: Record<string, typeof myEvents> = {};
  for (const ev of myEvents) {
    if (!eventsByDay[ev.data]) {
      eventsByDay[ev.data] = [];
    }
    eventsByDay[ev.data].push(ev);
  }

  const sortedDates = Object.keys(eventsByDay).sort();

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
      {/* Header do Perfil do Funcionário */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200">
        <div className="flex items-center gap-3">
          {currentEmployee && <EmployeeBadge employee={currentEmployee} size="lg" showRole />}
          <div>
            <div className="text-xs text-zinc-400 dark:text-zinc-400 text-zinc-500 font-medium">
              {currentEmployee?.funcao === 'filmmaker' ? 'Filmmaker (Câmera & Vídeo)' : 'Apresentadora / Modelo'}
            </div>
            <div className="text-sm font-bold text-foreground dark:text-foreground text-zinc-900">
              {myEvents.length} {myEvents.length === 1 ? 'gravação agendada' : 'gravações agendadas'}
            </div>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Ativo
        </span>
      </div>

      {/* Banner de Ação Rápida: Bater Ponto no Restaurante */}
      <div className="p-4 rounded-2xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white border border-emerald-500/30 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground dark:text-foreground text-zinc-900">
              Chegou no restaurante da gravação?
            </div>
            <div className="text-[11px] text-zinc-400">
              Bata o ponto digital com selfie e geolocalização GPS
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openPontoModal()}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-foreground font-bold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Bater Ponto</span>
        </button>
      </div>

      {sortedDates.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200">
          <Calendar className="w-10 h-10 mx-auto text-zinc-500 mb-2" />
          <h3 className="text-base font-semibold text-zinc-200 dark:text-zinc-200 text-zinc-800">
            Nenhuma gravação escalada
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-400 text-zinc-500 mt-1">
            Você está livre no momento. O admin atribuirá novos trabalhos aqui.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {sortedDates.map((dateStr) => {
            const dateObj = parseDateIso(dateStr);
            const dayName = WEEKDAYS_SHORT[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1];
            const dayNum = dateObj.getDate();
            const monthStr = MONTH_NAMES_SHORT[dateObj.getMonth()];
            const dayEvents = eventsByDay[dateStr];

            return (
              <div key={dateStr} className="flex flex-col gap-2.5">
                {/* Divisor do Dia */}
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs font-bold text-[var(--ui-accent)] uppercase tracking-wider">
                    {dayName}, {dayNum} de {monthStr}
                  </span>
                  <div className="h-px bg-[var(--ui-border)] dark:bg-[var(--ui-border)] bg-slate-200 flex-1" />
                </div>

                {/* Cartões do Dia */}
                <div className="flex flex-col gap-3">
                  {dayEvents.map((ev) => {
                    const colorInfo = EVENT_TYPE_COLORS[ev.tipo] || EVENT_TYPE_COLORS.gravacao;
                    const typeLabel = EVENT_TYPE_LABELS[ev.tipo] || 'Gravação';

                    return (
                      <div
                        key={ev.id}
                        onClick={() => {
                          if (userRole === 'admin') openEditEventModal(ev);
                        }}
                        className={`p-4 rounded-2xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 flex flex-col gap-3 shadow-sm ${
                          userRole === 'admin' ? 'cursor-pointer hover:border-[var(--ui-accent)]/40' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colorInfo.bg} ${colorInfo.text}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${colorInfo.dot}`} />
                            {typeLabel}
                          </span>

                          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 dark:text-zinc-300 text-zinc-800">
                            <Clock className="w-3.5 h-3.5 text-[var(--ui-accent)]" />
                            <span>
                              {formatTimeClean(ev.hora_inicio)} às {formatTimeClean(ev.hora_fim)}
                            </span>
                          </div>
                        </div>

                        {/* Nome do Restaurante / Cliente */}
                        <div>
                          <h4 className="text-base font-bold text-foreground dark:text-foreground text-zinc-900 font-heading">
                            {ev.client?.nome || 'Cliente'}
                          </h4>
                          {ev.local && (
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-400 text-zinc-600 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span>{ev.local}</span>
                            </div>
                          )}
                        </div>

                        {/* Observações da Produção */}
                        {ev.observacoes && (
                          <div className="p-2.5 rounded-xl bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-50 text-xs text-zinc-300 dark:text-zinc-300 text-zinc-700 border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200">
                            <span className="font-semibold text-[var(--ui-accent)]">Obs: </span>
                            {ev.observacoes}
                          </div>
                        )}

                        {/* Equipe escalada neste job */}
                        <div className="flex items-center justify-between pt-2 border-t border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-100">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-zinc-400 mr-0.5">Dupla no restaurante:</span>
                            {(ev.employees || []).map((emp) => (
                              <EmployeeBadge key={emp.id} employee={emp} size="sm" showRole />
                            ))}
                          </div>

                          {/* Ações: Como chegar & Bater Ponto */}
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPontoModal(ev.client_id, ev.id, 'entrada');
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                              title="Bater ponto de entrada nesta gravação"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>Check-in Aqui</span>
                            </button>

                            {ev.client?.endereco && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  ev.client.endereco
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ui-accent)] hover:underline"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                                <span>Como chegar</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
