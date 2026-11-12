'use client';
import { useState } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { MONTH_NAMES, formatTimeClean, todayInSaoPaulo } from '@/lib/date-utils';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '@/types/database';
import { EmployeeBadge } from './EmployeeBadge';
import { Clock, MapPin, FileText, UserCheck, ShieldCheck, Sparkles } from 'lucide-react';

export function MobileMonthCalendar() {
  const {
    currentDate,
    filteredEvents,
    employees,
    navigate,
    openDayDetailModal,
    openEditEventModal,
    openNewEventModal,
    canManage,
  } = useAgenda();
  const [selected, setSelected] = useState('');
  const year = currentDate.getFullYear(),
    month = currentDate.getMonth();
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const today = todayInSaoPaulo();
  const chosen = selected.startsWith(prefix) ? selected : today.startsWith(prefix) ? today : `${prefix}-01`;
  const days = new Date(year, month + 1, 0).getDate(),
    offset = new Date(year, month, 1).getDay();
  const cells = Array.from({ length: Math.ceil((days + offset) / 7) * 7 }, (_, index) => {
    const day = index - offset + 1;
    return day > 0 && day <= days ? day : null;
  });
  const events = filteredEvents
    .filter((event) => event.status !== 'cancelado')
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  const agenda = events.filter((event) => event.data === chosen);

  const busyIds = new Set<string>();
  agenda.forEach((ev) => (ev.assigned_employee_ids || []).forEach((id) => busyIds.add(id)));
  const freeEmployees = employees.filter((emp) => emp.ativo && !busyIds.has(emp.id));

  return (
    <section className="mobile-month sm:hidden" aria-label="Calendário mensal no celular">
      <div className="mobile-calendar-tools">
        <span>{year}</span>
        <div>
          <button onClick={() => navigate('prev')} aria-label="Mês anterior">
            Anterior
          </button>
          <button
            onClick={() => {
              setSelected(today);
              navigate('today');
            }}
          >
            Hoje
          </button>
          <button onClick={() => navigate('next')} aria-label="Próximo mês">
            Próximo
          </button>
        </div>
      </div>
      <h1>{MONTH_NAMES[month]}</h1>
      <div className="mobile-calendar-weekdays" aria-hidden="true">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
          <span key={index}>{day}</span>
        ))}
      </div>
      <div className="mobile-calendar-grid">
        {cells.map((day, index) => {
          if (!day) return <div className="mobile-calendar-blank" key={`blank-${index}`} aria-hidden="true" />;
          const iso = `${prefix}-${String(day).padStart(2, '0')}`,
            list = events.filter((event) => event.data === iso);
          return (
            <button
              key={iso}
              className="mobile-calendar-day"
              data-today={iso === today}
              data-selected={iso === chosen}
              data-weekend={index % 7 === 0 || index % 7 === 6}
              aria-label={`${day} de ${MONTH_NAMES[month]}, ${list.length} compromissos`}
              aria-pressed={iso === chosen}
              onClick={() => {
                setSelected(iso);
                openDayDetailModal(iso);
              }}
            >
              <span className="calendar-day-number">{day}</span>
              <span className="calendar-day-events">
                {list.slice(0, 2).map((event) => (
                  <span key={event.id} className="calendar-event-pill" data-type={event.tipo}>
                    {event.client?.nome || event.local || 'Compromisso'}
                  </span>
                ))}
                {list.length > 2 && <span className="calendar-more">+{list.length - 2}</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mobile-day-agenda space-y-3">
        <div className="mobile-day-heading">
          <div>
            <h2>
              {Number(chosen.slice(-2))} de {MONTH_NAMES[month].toLowerCase()}
            </h2>
            <span className="text-[11px] text-zinc-400">
              {agenda.length} {agenda.length === 1 ? 'compromisso' : 'compromissos'} · {freeEmployees.length}{' '}
              disponíveis
            </span>
          </div>
          <button
            type="button"
            onClick={() => openDayDetailModal(chosen)}
            className="px-3 py-1.5 rounded-xl bg-[var(--ui-accent)]/15 border border-[var(--ui-accent)]/35 font-bold"
          >
            Ver dia completo
          </button>
        </div>

        {/* Disponíveis neste dia (mesma informação do desktop) */}
        <div className="p-3 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-300">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Disponíveis neste dia ({freeEmployees.length})</span>
          </div>
          {freeEmployees.length === 0 ? (
            <p className="text-[11px] text-zinc-500 italic">Toda a equipe está escalada neste dia.</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {freeEmployees
                .filter((e) => e.funcao === 'filmmaker' || e.funcao === 'modelo' || e.funcao === 'criadora')
                .map((emp) => (
                  <EmployeeBadge key={emp.id} employee={emp} size="sm" />
                ))}
            </div>
          )}
        </div>

        {!agenda.length && <p className="text-xs text-zinc-400 py-2">Sem compromissos neste dia.</p>}

        <div className="space-y-2.5">
          {agenda.map((event) => {
            const colorInfo = EVENT_TYPE_COLORS[event.tipo] || EVENT_TYPE_COLORS.gravacao;
            const typeLabel = EVENT_TYPE_LABELS[event.tipo] || 'Gravação';
            const assignedList =
              event.employees ||
              (event.assigned_employee_ids || [])
                .map((id) => employees.find((e) => e.id === id))
                .filter((e): e is NonNullable<typeof e> => Boolean(e));
            const hasBriefing = Boolean(event.briefing_gravacao?.trim() || event.briefing_videos?.length);
            const isBriefingApproved = Boolean(event.briefing_aprovado);

            return (
              <div
                key={event.id}
                onClick={() => openEditEventModal(event)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openEditEventModal(event);
                  }
                }}
                className={`p-3.5 rounded-2xl bg-[var(--ui-surface)] border flex flex-col gap-2 cursor-pointer transition-all ${
                  isBriefingApproved
                    ? 'border-2 border-[#38bdf8] ring-1 ring-[#38bdf8]/30'
                    : 'border-[var(--ui-border)] hover:border-[var(--ui-accent)]/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${colorInfo.bg} ${colorInfo.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${colorInfo.dot}`} />
                    {typeLabel}
                  </span>

                  <div className="flex items-center gap-1 text-xs font-semibold text-zinc-300">
                    <Clock className="w-3.5 h-3.5 text-[var(--ui-accent)]" />
                    <span>
                      {formatTimeClean(event.hora_inicio)} - {formatTimeClean(event.hora_fim)}
                    </span>
                  </div>
                </div>

                <div>
                  <strong className="text-sm font-bold text-foreground block">
                    {event.client?.nome || 'Compromisso'}
                  </strong>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0 text-zinc-500" />
                    <span>{event.local || event.client?.endereco || 'Local não informado'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {isBriefingApproved ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/40 text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      Briefing Validado
                    </span>
                  ) : hasBriefing ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-semibold">
                      <Sparkles className="w-3 h-3" />
                      Briefing OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                      <Sparkles className="w-3 h-3" />
                      Briefing Pendente
                    </span>
                  )}

                  {event.relatorio_filmmaker?.preenchido ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                      <FileText className="w-3 h-3" />
                      Relatório OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--ui-accent)]/10 text-[var(--ui-accent)] border border-[var(--ui-accent)]/25 text-[10px] font-semibold">
                      <FileText className="w-3 h-3" />
                      Relatório Pendente
                    </span>
                  )}
                </div>

                {assignedList.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1.5 border-t border-[var(--ui-border)]">
                    {assignedList.map((emp) => (
                      <EmployeeBadge key={emp.id} employee={emp} size="sm" />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {canManage && (
          <button className="mobile-calendar-add" onClick={() => openNewEventModal(chosen)}>
            Novo agendamento
          </button>
        )}
      </div>
    </section>
  );
}
