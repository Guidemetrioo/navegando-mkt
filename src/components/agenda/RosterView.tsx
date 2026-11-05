'use client';

import React, { useState, useMemo } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import {
  MONTH_NAMES,
  WEEKDAYS_SHORT,
  formatTimeClean,
  getMonthMatrix,
  parseDateIso,
  todayInSaoPaulo,
} from '@/lib/date-utils';
import { EmployeeBadge } from './EmployeeBadge';
import {
  CLT_2026_RULES,
  auditMonthlyScheduleCompliance,
  calculateEmployeeMonthlyTimeBank,
  formatDurationHoursMinutes,
  getWeeksTouchingMonth,
} from '@/lib/clt-roster-engine';
import {
  Sparkles,
  AlertTriangle,
  Video,
  Calendar,
  Clock,
  Scale,
  Wand2,
  Plus,
  Edit3,
  ArrowRight,
  Users,
} from 'lucide-react';

export function RosterView() {
  const {
    currentDate,
    setDate,
    employees,
    events,
    pontos,
    clients,
    bancoHorasLancamentos,
    canManage,
    autoGenerateMonthlyRoster,
    updateEventTeamAssignment,
    openEditEventModal,
    openNewEventModal,
    setCurrentView,
  } = useAgenda();

  const [viewMode, setViewMode] = useState<'agenda_e_lista' | 'lista_mes' | 'grade_semanal'>('agenda_e_lista');
  const [filterWeekIdx, setFilterWeekIdx] = useState<number | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'filmmaker' | 'modelo'>('all');
  const [calendarEmpFilter, setCalendarEmpFilter] = useState<string>('all');
  const [hoveredDayIso, setHoveredDayIso] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = MONTH_NAMES[month];
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const todayIso = todayInSaoPaulo();

  // Matriz de calendário mensal (7 colunas Seg-Dom) para a Agenda da Escala Automática
  const monthMatrix = useMemo(() => getMonthMatrix(year, month), [year, month]);

  // Equipe de campo (Filmmakers e Modelos) que entra na distribuição igualitária da escala
  const filmmakers = useMemo(
    () => employees.filter((e) => e.ativo && e.funcao === 'filmmaker'),
    [employees]
  );
  const modelos = useMemo(
    () => employees.filter((e) => e.ativo && (e.funcao === 'modelo' || e.funcao === 'criadora')),
    [employees]
  );

  // Gravações do mês selecionado
  const monthEvents = useMemo(
    () =>
      events
        .filter((e) => e.data.startsWith(monthPrefix) && e.status !== 'cancelado')
        .sort((a, b) => {
          if (a.data !== b.data) return a.data.localeCompare(b.data);
          return a.hora_inicio.localeCompare(b.hora_inicio);
        }),
    [events, monthPrefix]
  );

  // Mapa de eventos por dia ISO para renderização rápida na Agenda da Escala
  const eventsByDayMap = useMemo(() => {
    const map = new Map<string, typeof monthEvents>();
    for (const ev of events) {
      if (ev.status === 'cancelado') continue;
      if (
        calendarEmpFilter !== 'all' &&
        !(ev.assigned_employee_ids || []).includes(calendarEmpFilter)
      ) {
        continue;
      }
      const list = map.get(ev.data) || [];
      list.push(ev);
      map.set(ev.data, list);
    }
    for (const [k, list] of map.entries()) {
      list.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
      map.set(k, list);
    }
    return map;
  }, [events, calendarEmpFilter]);

  // Semanas que compõem o mês
  const monthWeeks = useMemo(() => getWeeksTouchingMonth(year, month), [year, month]);

  // Resumo mensal de carga por funcionário (gravações no mês + horas semanais)
  const teamLoadStats = useMemo(() => {
    const allTargets = [...filmmakers, ...modelos];
    return allTargets.map((emp) => {
      const empMonthEvents = monthEvents.filter((ev) =>
        (ev.assigned_employee_ids || []).includes(emp.id)
      );
      const bank = calculateEmployeeMonthlyTimeBank({
        employee: emp,
        year,
        month,
        allEvents: events,
        allPontos: pontos,
        allClients: clients,
        manualAdjustments: bancoHorasLancamentos,
      });

      const maxWeekMinutes = bank.weeks.reduce(
        (max, w) => (w.workedMinutes > max ? w.workedMinutes : max),
        0
      );
      const maxDaysInWeek = bank.weeks.reduce(
        (max, w) => (w.daysWorkedCount > max ? w.daysWorkedCount : max),
        0
      );
      const hasOver42h = maxWeekMinutes > CLT_2026_RULES.LIMITE_SEMANAL_MINUTOS;
      const hasOver5x2 = maxDaysInWeek > CLT_2026_RULES.MAX_DIAS_TRABALHADOS_SEMANA;

      return {
        employee: emp,
        recordingsCount: empMonthEvents.length,
        totalMonthWorkedMinutes: bank.totalWorkedMinutes,
        maxWeekMinutes,
        maxDaysInWeek,
        hasOver42h,
        hasOver5x2,
        weeks: bank.weeks,
      };
    });
  }, [filmmakers, modelos, monthEvents, year, month, events, pontos, clients, bancoHorasLancamentos]);

  // Médias de gravações para detectar quem está com mais ou menos
  const avgFilmmakerCount = useMemo(() => {
    const fmStats = teamLoadStats.filter((s) => s.employee.funcao === 'filmmaker');
    if (fmStats.length === 0) return 0;
    return fmStats.reduce((acc, s) => acc + s.recordingsCount, 0) / fmStats.length;
  }, [teamLoadStats]);

  const avgModeloCount = useMemo(() => {
    const modStats = teamLoadStats.filter(
      (s) => s.employee.funcao === 'modelo' || s.employee.funcao === 'criadora'
    );
    if (modStats.length === 0) return 0;
    return modStats.reduce((acc, s) => acc + s.recordingsCount, 0) / modStats.length;
  }, [teamLoadStats]);

  // Auditoria Trabalhista CLT + EC 141/2026 (Dezembro 2026)
  const complianceAlerts = useMemo(
    () =>
      auditMonthlyScheduleCompliance({
        year,
        month,
        employees,
        events,
        pontos,
        clients,
        manualAdjustments: bancoHorasLancamentos,
      }),
    [year, month, employees, events, pontos, clients, bancoHorasLancamentos]
  );

  // Alterar manualmente o Filmmaker ou a Modelo de uma gravação direto na linha ou na Agenda
  const handleManualRoleChange = (
    eventId: string,
    roleType: 'filmmaker' | 'modelo',
    newEmployeeId: string
  ) => {
    const targetEv = events.find((e) => e.id === eventId);
    if (!targetEv) return;

    const currentIds = targetEv.assigned_employee_ids || [];
    const remainingIds = currentIds.filter((id) => {
      const emp = employees.find((e) => e.id === id);
      if (!emp) return false;
      if (roleType === 'filmmaker') {
        return emp.funcao !== 'filmmaker';
      } else {
        return emp.funcao !== 'modelo' && emp.funcao !== 'criadora';
      }
    });

    const updatedIds = newEmployeeId ? [...remainingIds, newEmployeeId] : remainingIds;
    updateEventTeamAssignment(eventId, updatedIds);
  };

  const changeMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1, 12, 0, 0);
    setDate(next);
  };

  const scrollToAlerts = () => {
    const el = document.getElementById('alertas-clt-rodape');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* =================================================================
          1. BARRA DE COMANDO: ESCALA AUTOMÁTICA + CONTROLE MENSAL CLT 2026
          ================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[var(--ui-accent)]/15 text-[var(--ui-accent)] border border-[var(--ui-accent)]/30">
              Normas CLT + EC 141/2026 (Dez/2026)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Limite 42h Semanais • Escala 5x2 (2 Folgas/Semana)
            </span>
            {complianceAlerts.length > 0 && (
              <button
                type="button"
                onClick={scrollToAlerts}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 transition-colors cursor-pointer"
              >
                Ver {complianceAlerts.length} Alerta(s) Trabalhistas no Rodapé ↓
              </button>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-foreground font-heading mt-1">
            Escala Automática & Agenda da Equipe — {monthName} de {year}
          </h2>
          <p className="text-xs text-zinc-400">
            Visualize a agenda completa da escala abaixo, distribua as duplas automaticamente de forma igualitária ou altere manualmente. Os alertas trabalhistas ficam no final da página.
          </p>
        </div>

        {/* Seletor de Mês + Botões de Automação */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Navegador de Mês */}
          <div className="flex items-center bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl p-1">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-foreground hover:bg-[var(--ui-surface)] transition-colors cursor-pointer"
              title="Mês anterior"
              data-text-action="true"
            >
              <span className="text-action-label">Anterior</span>
            </button>
            <span className="px-3 text-xs font-extrabold text-foreground capitalize min-w-[130px] text-center">
              {monthName} {year}
            </span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-foreground hover:bg-[var(--ui-surface)] transition-colors cursor-pointer"
              title="Próximo mês"
              data-text-action="true"
            >
              <span className="text-action-label">Próximo</span>
            </button>
          </div>

          {canManage && (
            <>
              <button
                type="button"
                onClick={() => autoGenerateMonthlyRoster(year, month, 'only_incomplete')}
                className="px-3.5 py-2 rounded-xl bg-[var(--ui-raised)] hover:bg-[var(--ui-border)] border border-[var(--ui-border)] text-xs font-bold text-zinc-200 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Preenche automaticamente apenas as gravações que ainda estão sem Filmmaker ou sem Modelo"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--ui-accent)]" />
                <span>Completar Vagas Abertas</span>
              </button>

              <button
                type="button"
                onClick={() => autoGenerateMonthlyRoster(year, month, 'rebalance_all')}
                className="gradient-cta px-4 py-2 rounded-xl text-foreground font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                title="Distribui e equilibra todas as gravações do mês automaticamente para que todos trabalhem igual dentro dos limites CLT"
              >
                <Wand2 className="w-4 h-4" />
                <span>Automatizar Escala do Mês</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* =================================================================
          2. SELETOR DE VISUALIZAÇÃO DA ESCALA
          ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--ui-surface)] p-3 rounded-2xl border border-[var(--ui-border)]">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode('agenda_e_lista')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'agenda_e_lista'
                ? 'brand-solid bg-[var(--ui-accent)] text-foreground shadow-sm'
                : 'text-zinc-400 hover:text-foreground hover:bg-[var(--ui-raised)]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Agenda da Escala + Lista Manual</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('lista_mes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'lista_mes'
                ? 'brand-solid bg-[var(--ui-accent)] text-foreground shadow-sm'
                : 'text-zinc-400 hover:text-foreground hover:bg-[var(--ui-raised)]'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Apenas Lista Manual ({monthEvents.length} gravações)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('grade_semanal')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'grade_semanal'
                ? 'brand-solid bg-[var(--ui-accent)] text-foreground shadow-sm'
                : 'text-zinc-400 hover:text-foreground hover:bg-[var(--ui-raised)]'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Espelho de Folgas 5x2 & Horas Semanais</span>
          </button>
        </div>

        {/* Filtro rápido por Semana do Mês */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterWeekIdx('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer ${
              filterWeekIdx === 'all'
                ? 'bg-[var(--ui-raised)] text-[var(--ui-accent)] border border-[var(--ui-accent)]/40'
                : 'text-zinc-400 hover:text-foreground'
            }`}
          >
            Mês Inteiro
          </button>
          {monthWeeks.map((w) => (
            <button
              key={w.weekIndex}
              type="button"
              onClick={() => setFilterWeekIdx(w.weekIndex)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                filterWeekIdx === w.weekIndex
                  ? 'bg-[var(--ui-raised)] text-[var(--ui-accent)] border border-[var(--ui-accent)]/40'
                  : 'text-zinc-400 hover:text-foreground'
              }`}
            >
              Sem {w.weekIndex} ({w.startDateIso.slice(8, 10)}/{w.startDateIso.slice(5, 7)})
            </button>
          ))}
        </div>
      </div>

      {/* =================================================================
          3. AGENDA VISUAL DA ESCALA AUTOMÁTICA (CALENDÁRIO MENSAL INTERATIVO)
          ================================================================= */}
      {viewMode === 'agenda_e_lista' && (
        <div className="rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] overflow-visible shadow-sm flex flex-col">
          {/* Topo da Agenda da Escala + Filtro por Funcionário */}
          <div className="p-4 border-b border-[var(--ui-border)] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[var(--ui-accent)]/15 text-[var(--ui-accent)] border border-[var(--ui-accent)]/30">
                  Agenda da Escala
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-foreground">
                  Calendário Mensal de Duplas Escaladas — {monthName} {year}
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Passe o mouse sobre qualquer dia para expandir as gravações e trocar o <strong>Filmmaker</strong> ou a <strong>Modelo</strong> diretamente no calendário.
              </p>
            </div>

            {/* Filtro rápido por membro da equipe para destacar na agenda */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCalendarEmpFilter('all')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                  calendarEmpFilter === 'all'
                    ? 'brand-solid bg-[var(--ui-accent)] text-foreground'
                    : 'bg-[var(--ui-raised)] text-zinc-400 hover:text-foreground border border-[var(--ui-border)]'
                }`}
              >
                Toda a Equipe ({monthEvents.length})
              </button>
              {[...filmmakers, ...modelos].map((emp) => {
                const st = teamLoadStats.find((s) => s.employee.id === emp.id);
                const isSelected = calendarEmpFilter === emp.id;
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => setCalendarEmpFilter(isSelected ? 'all' : emp.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-[var(--ui-accent)]/20 text-[var(--ui-accent)] border-[var(--ui-accent)]'
                        : 'bg-[var(--ui-raised)] text-zinc-300 hover:text-foreground border-[var(--ui-border)]'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: `hsl(${emp.cor}, 78%, 56%)` }}
                    />
                    <span>{emp.nome}</span>
                    <span className="text-[10px] opacity-75 font-mono">({st?.recordingsCount || 0})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cabeçalho dos Dias da Semana (Seg a Dom) */}
          <div className="grid grid-cols-7 border-b border-[var(--ui-border)] bg-[var(--ui-raised)]">
            {WEEKDAYS_SHORT.map((wd, idx) => (
              <div
                key={wd}
                className={`py-2.5 px-2 text-center text-[11px] font-extrabold uppercase tracking-wider ${
                  idx === 6 ? 'text-red-400' : 'text-zinc-400'
                }`}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Grade de Dias da Agenda da Escala */}
          <div className="flex flex-col divide-y divide-[var(--ui-border)]">
            {monthMatrix.map((weekRow, wIdx) => (
              <div key={wIdx} className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-[var(--ui-border)]">
                {weekRow.map((cell, colIdx) => {
                  const dayEvents = eventsByDayMap.get(cell.iso) || [];
                  const isToday = cell.iso === todayIso;
                  const isSunday = colIdx === 6;
                  const isHovered = hoveredDayIso === cell.iso && dayEvents.length > 0;

                  const incompleteCount = dayEvents.filter((ev) => {
                    const ids = ev.assigned_employee_ids || [];
                    const hasFm = ids.some((id) => employees.find((e) => e.id === id)?.funcao === 'filmmaker');
                    const hasMod = ids.some((id) => {
                      const f = employees.find((e) => e.id === id)?.funcao;
                      return f === 'modelo' || f === 'criadora';
                    });
                    return !hasFm || !hasMod;
                  }).length;

                  return (
                    <div
                      key={cell.iso}
                      onMouseEnter={() => setHoveredDayIso(cell.iso)}
                      onMouseLeave={() => setHoveredDayIso((prev) => (prev === cell.iso ? null : prev))}
                      className={`relative min-h-[128px] p-2 flex flex-col gap-1.5 transition-colors ${
                        !cell.isCurrentMonth
                          ? 'bg-[var(--ui-page)]/45 opacity-55'
                          : isToday
                          ? 'bg-[var(--ui-accent)]/[0.07]'
                          : 'bg-[var(--ui-surface)] hover:bg-[var(--ui-raised)]/40'
                      }`}
                    >
                      {/* Topo da Célula do Dia */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center font-mono ${
                              isToday
                                ? 'brand-solid bg-[var(--ui-accent)] text-foreground shadow-sm'
                                : isSunday
                                ? 'text-red-400 bg-red-500/10'
                                : 'text-foreground'
                            }`}
                          >
                            {cell.date.getDate()}
                          </span>
                          {dayEvents.length > 0 && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold font-mono ${
                                incompleteCount > 0
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {dayEvents.length} grav.
                            </span>
                          )}
                        </div>

                        {canManage && cell.isCurrentMonth && (
                          <button
                            type="button"
                            onClick={() => openNewEventModal(cell.iso)}
                            className="px-1.5 py-0.5 rounded-md text-[10px] font-bold text-zinc-400 hover:text-foreground hover:bg-[var(--ui-raised)] transition-colors cursor-pointer"
                            title="Agendar gravação neste dia"
                          >
                            +
                          </button>
                        )}
                      </div>

                      {/* Lista Compacta das Gravações e Duplas Escaladas no Dia */}
                      <div className="flex flex-col gap-1.5 flex-1">
                        {dayEvents.slice(0, 3).map((ev) => {
                          const assignedIds = ev.assigned_employee_ids || [];
                          const fm = employees.find(
                            (e) => assignedIds.includes(e.id) && e.funcao === 'filmmaker'
                          );
                          const mod = employees.find(
                            (e) =>
                              assignedIds.includes(e.id) &&
                              (e.funcao === 'modelo' || e.funcao === 'criadora')
                          );
                          const clientName =
                            ev.client?.nome ||
                            clients.find((c) => c.id === ev.client_id)?.nome ||
                            'Restaurante';

                          return (
                            <div
                              key={ev.id}
                              onClick={() => openEditEventModal(ev)}
                              className="p-1.5 rounded-lg bg-[var(--ui-raised)] hover:bg-[var(--ui-border)]/70 border border-[var(--ui-border)] flex flex-col gap-1 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center justify-between gap-1 text-[10px]">
                                <span className="font-mono font-bold text-[var(--ui-accent)]">
                                  {formatTimeClean(ev.hora_inicio)}
                                </span>
                                <span className="font-extrabold text-foreground truncate flex-1 text-right">
                                  {clientName}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1">
                                {fm ? (
                                  <span
                                    className="px-1.5 py-0.2 rounded text-[9px] font-bold truncate max-w-[48%]"
                                    style={{
                                      backgroundColor: `hsla(${fm.cor}, 75%, 45%, 0.22)`,
                                      color: `hsl(${fm.cor}, 85%, 78%)`,
                                      border: `1px solid hsla(${fm.cor}, 75%, 50%, 0.35)`,
                                    }}
                                  >
                                    🎥 {fm.nome}
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    Sem Filmmaker
                                  </span>
                                )}
                                {mod ? (
                                  <span
                                    className="px-1.5 py-0.2 rounded text-[9px] font-bold truncate max-w-[48%]"
                                    style={{
                                      backgroundColor: `hsla(${mod.cor}, 75%, 45%, 0.22)`,
                                      color: `hsl(${mod.cor}, 85%, 78%)`,
                                      border: `1px solid hsla(${mod.cor}, 75%, 50%, 0.35)`,
                                    }}
                                  >
                                    ✨ {mod.nome}
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    Sem Modelo
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {dayEvents.length > 3 && (
                          <span className="text-[10px] font-bold text-[var(--ui-accent)] text-center py-0.5">
                            +{dayEvents.length - 3} gravação(ões) no dia
                          </span>
                        )}
                      </div>

                      {/* Card Maximizado Responsivo ao Passar o Mouse no Dia (Permite Trocar Escala Manualmente na Agenda!) */}
                      {isHovered && (
                        <div
                          className={`hidden md:flex flex-col gap-2.5 absolute z-40 top-0 ${
                            colIdx >= 5 ? 'right-0' : colIdx <= 1 ? 'left-0' : 'left-1/2 -translate-x-1/2'
                          } w-[330px] p-3.5 rounded-2xl bg-[var(--ui-surface)] border-2 border-[var(--ui-accent)] shadow-2xl animate-in fade-in zoom-in-95 duration-150`}
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-[var(--ui-border)]">
                            <div>
                              <span className="text-xs font-extrabold text-foreground block">
                                Escala do Dia {cell.iso.slice(8, 10)}/{cell.iso.slice(5, 7)} ({WEEKDAYS_SHORT[colIdx]})
                              </span>
                              <span className="text-[10px] text-zinc-400">
                                {dayEvents.length} {dayEvents.length === 1 ? 'gravação agendada' : 'gravações agendadas'}
                              </span>
                            </div>
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => openNewEventModal(cell.iso)}
                                className="px-2 py-1 rounded-lg bg-[var(--ui-accent)]/20 text-[var(--ui-accent)] hover:bg-[var(--ui-accent)] hover:text-foreground text-[10px] font-extrabold transition-colors cursor-pointer"
                              >
                                + Gravação
                              </button>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-0.5">
                            {dayEvents.map((ev) => {
                              const assignedIds = ev.assigned_employee_ids || [];
                              const selectedFilmmakerId =
                                assignedIds.find(
                                  (id) => employees.find((e) => e.id === id)?.funcao === 'filmmaker'
                                ) || '';
                              const selectedModeloId =
                                assignedIds.find((id) => {
                                  const f = employees.find((e) => e.id === id)?.funcao;
                                  return f === 'modelo' || f === 'criadora';
                                }) || '';
                              const clientName =
                                ev.client?.nome ||
                                clients.find((c) => c.id === ev.client_id)?.nome ||
                                'Restaurante';

                              return (
                                <div
                                  key={ev.id}
                                  className="p-2.5 rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex flex-col gap-2"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-mono font-bold text-[var(--ui-accent)]">
                                      {formatTimeClean(ev.hora_inicio)} – {formatTimeClean(ev.hora_fim)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => openEditEventModal(ev)}
                                      className="text-xs font-extrabold text-foreground hover:text-[var(--ui-accent)] truncate cursor-pointer"
                                    >
                                      {clientName}
                                    </button>
                                  </div>

                                  {/* Troca rápida de Filmmaker e Modelo direto na Agenda */}
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <select
                                      disabled={!canManage}
                                      value={selectedFilmmakerId}
                                      onChange={(e) =>
                                        handleManualRoleChange(ev.id, 'filmmaker', e.target.value)
                                      }
                                      className="w-full rounded-lg px-2 py-1 text-[10px] font-bold bg-[var(--ui-surface)] border border-[var(--ui-border)] text-foreground cursor-pointer"
                                    >
                                      <option value="">— Filmmaker —</option>
                                      {filmmakers.map((fm) => (
                                        <option key={fm.id} value={fm.id}>
                                          🎥 {fm.nome}
                                        </option>
                                      ))}
                                    </select>

                                    <select
                                      disabled={!canManage}
                                      value={selectedModeloId}
                                      onChange={(e) =>
                                        handleManualRoleChange(ev.id, 'modelo', e.target.value)
                                      }
                                      className="w-full rounded-lg px-2 py-1 text-[10px] font-bold bg-[var(--ui-surface)] border border-[var(--ui-border)] text-foreground cursor-pointer"
                                    >
                                      <option value="">— Modelo —</option>
                                      {modelos.map((mod) => (
                                        <option key={mod.id} value={mod.id}>
                                          ✨ {mod.nome}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              );
                            })}
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
      )}

      {/* =================================================================
          4. MEDIDOR DE IGUALDADE DE DISTRIBUIÇÃO (FILMMAKER & MODELOS)
          ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card Equilíbrio Filmmakers */}
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-[#38bdf8]" />
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider">
                Distribuição de Filmmakers no Mês
              </h3>
            </div>
            <span className="text-[11px] text-zinc-400">
              Média ideal: <strong className="text-foreground">{avgFilmmakerCount.toFixed(1)}</strong> gravações/mês
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {teamLoadStats
              .filter((s) => s.employee.funcao === 'filmmaker')
              .map((stat) => {
                const diff = stat.recordingsCount - avgFilmmakerCount;
                const isUnbalanced = Math.abs(diff) >= 1.5;
                return (
                  <div
                    key={stat.employee.id}
                    className={`p-3 rounded-xl border flex flex-col gap-2 ${
                      stat.hasOver42h || stat.hasOver5x2
                        ? 'bg-red-500/10 border-red-500/40'
                        : isUnbalanced
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-[var(--ui-raised)] border-[var(--ui-border)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <EmployeeBadge employee={stat.employee} size="sm" />
                      <span className="text-sm font-extrabold font-mono text-foreground">
                        {stat.recordingsCount} <small className="text-[10px] font-normal text-zinc-400">grav.</small>
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-400 flex flex-col gap-0.5">
                      <div className="flex justify-between">
                        <span>Pico Semanal:</span>
                        <strong
                          className={
                            stat.hasOver42h ? 'text-red-400 font-bold' : 'text-emerald-400'
                          }
                        >
                          {formatDurationHoursMinutes(stat.maxWeekMinutes)} / 42h
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Dias/Semana Máx:</span>
                        <strong
                          className={
                            stat.hasOver5x2 ? 'text-red-400 font-bold' : 'text-zinc-200'
                          }
                        >
                          {stat.maxDaysInWeek}d / 5d (5x2)
                        </strong>
                      </div>
                    </div>

                    {isUnbalanced && (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                        {diff > 0
                          ? ` Está com +${Math.round(diff)} acima da média`
                          : ` Está com ${Math.round(diff)} abaixo da média`}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Card Equilíbrio Modelos */}
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#f472b6]" />
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider">
                Distribuição de Modelos no Mês
              </h3>
            </div>
            <span className="text-[11px] text-zinc-400">
              Média ideal: <strong className="text-foreground">{avgModeloCount.toFixed(1)}</strong> gravações/mês
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {teamLoadStats
              .filter(
                (s) => s.employee.funcao === 'modelo' || s.employee.funcao === 'criadora'
              )
              .map((stat) => {
                const diff = stat.recordingsCount - avgModeloCount;
                const isUnbalanced = Math.abs(diff) >= 1.5;
                return (
                  <div
                    key={stat.employee.id}
                    className={`p-3 rounded-xl border flex flex-col gap-2 ${
                      stat.hasOver42h || stat.hasOver5x2
                        ? 'bg-red-500/10 border-red-500/40'
                        : isUnbalanced
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-[var(--ui-raised)] border-[var(--ui-border)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <EmployeeBadge employee={stat.employee} size="sm" />
                      <span className="text-sm font-extrabold font-mono text-foreground">
                        {stat.recordingsCount} <small className="text-[10px] font-normal text-zinc-400">grav.</small>
                      </span>
                    </div>

                    <div className="text-[10px] text-zinc-400 flex flex-col gap-0.5">
                      <div className="flex justify-between">
                        <span>Pico Sem.:</span>
                        <strong
                          className={
                            stat.hasOver42h ? 'text-red-400 font-bold' : 'text-emerald-400'
                          }
                        >
                          {formatDurationHoursMinutes(stat.maxWeekMinutes)}/42h
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Escala:</span>
                        <strong
                          className={
                            stat.hasOver5x2 ? 'text-red-400 font-bold' : 'text-zinc-200'
                          }
                        >
                          {stat.maxDaysInWeek}d/sem
                        </strong>
                      </div>
                    </div>

                    {isUnbalanced && (
                      <span className="text-[9px] font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded-md border border-amber-500/30 truncate">
                        {diff > 0
                          ? ` +${Math.round(diff)} acima da média`
                          : ` ${Math.round(diff)} abaixo da média`}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* =================================================================
          5. LISTA DE ESCALA MANUAL E AUTOMÁTICA POR SEMANA DO MÊS
          ================================================================= */}
      {(viewMode === 'agenda_e_lista' || viewMode === 'lista_mes') && (
        <div className="flex flex-col gap-4">
          {monthWeeks
            .filter((w) => filterWeekIdx === 'all' || w.weekIndex === filterWeekIdx)
            .map((week) => {
              const weekEvs = monthEvents.filter(
                (ev) => ev.data >= week.startDateIso && ev.data <= week.endDateIso
              );

              return (
                <div
                  key={week.weekIndex}
                  className="rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] overflow-hidden shadow-sm"
                >
                  {/* Cabeçalho da Semana */}
                  <div className="px-4 py-3 bg-[var(--ui-raised)] border-b border-[var(--ui-border)] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[var(--ui-accent)]" />
                      <span className="text-xs sm:text-sm font-extrabold text-foreground">
                        {week.weekLabel}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--ui-surface)] border border-[var(--ui-border)] text-zinc-300">
                        {weekEvs.length} {weekEvs.length === 1 ? 'compromisso' : 'compromissos'}
                      </span>
                    </div>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => openNewEventModal(week.startDateIso)}
                        className="text-xs font-bold text-[var(--ui-accent)] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar gravação na semana</span>
                      </button>
                    )}
                  </div>

                  {weekEvs.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-500 italic">
                      Nenhuma gravação agendada nesta semana.
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--ui-border)]">
                      {weekEvs.map((ev) => {
                        const dObj = parseDateIso(ev.data);
                        const dayOfWeekIdx = dObj.getDay() === 0 ? 6 : dObj.getDay() - 1;
                        const weekdayShort = WEEKDAYS_SHORT[dayOfWeekIdx];
                        const isSunday = dObj.getDay() === 0;

                        const assignedIds = ev.assigned_employee_ids || [];
                        const selectedFilmmakerId =
                          assignedIds.find((id) => {
                            const emp = employees.find((e) => e.id === id);
                            return emp?.funcao === 'filmmaker';
                          }) || '';
                        const selectedModeloId =
                          assignedIds.find((id) => {
                            const emp = employees.find((e) => e.id === id);
                            return emp?.funcao === 'modelo' || emp?.funcao === 'criadora';
                          }) || '';

                        const clientName =
                          ev.client?.nome ||
                          clients.find((c) => c.id === ev.client_id)?.nome ||
                          'Restaurante';

                        return (
                          <div
                            key={ev.id}
                            className="p-3.5 sm:px-5 hover:bg-[var(--ui-raised)]/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                          >
                            {/* Coluna Esquerda: Data, Horário e Restaurante */}
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                              <div
                                className={`w-14 py-1.5 rounded-xl border text-center shrink-0 ${
                                  isSunday
                                    ? 'bg-red-500/15 border-red-500/40 text-red-300'
                                    : 'bg-[var(--ui-raised)] border-[var(--ui-border)] text-foreground'
                                }`}
                              >
                                <span className="block text-[9px] font-extrabold uppercase tracking-wider opacity-75">
                                  {weekdayShort}
                                </span>
                                <span className="text-sm font-extrabold font-mono">
                                  {ev.data.slice(8, 10)}/{ev.data.slice(5, 7)}
                                </span>
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-mono font-bold text-[var(--ui-accent)] flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTimeClean(ev.hora_inicio)} – {formatTimeClean(ev.hora_fim)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => openEditEventModal(ev)}
                                    className="text-sm font-extrabold text-foreground hover:text-[var(--ui-accent)] transition-colors truncate cursor-pointer text-left"
                                  >
                                    {clientName}
                                  </button>
                                  {isSunday && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                                      Domingo (Exige Folga Compensatória)
                                    </span>
                                  )}
                                </div>
                                {ev.local && (
                                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                                    {ev.local}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Coluna Direita: Seleção Manual de Filmmaker + Modelo */}
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 lg:shrink-0">
                              {/* Seletor Manual de Filmmaker */}
                              <div className="flex flex-col gap-1 w-full sm:w-52">
                                <label className="text-[10px] font-bold text-[#38bdf8] uppercase tracking-wider flex items-center justify-between">
                                  <span>Filmmaker</span>
                                  {!selectedFilmmakerId && (
                                    <span className="text-amber-400">Pendente</span>
                                  )}
                                </label>
                                <select
                                  disabled={!canManage}
                                  value={selectedFilmmakerId}
                                  onChange={(e) =>
                                    handleManualRoleChange(ev.id, 'filmmaker', e.target.value)
                                  }
                                  className={`w-full rounded-xl px-2.5 py-1.5 text-xs font-bold border focus:outline-none focus:ring-1 focus:ring-[#38bdf8] cursor-pointer ${
                                    selectedFilmmakerId
                                      ? 'bg-[var(--ui-raised)] border-[var(--ui-border)] text-foreground'
                                      : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                                  }`}
                                >
                                  <option value="">— Escalar Filmmaker —</option>
                                  {filmmakers.map((fm) => {
                                    const st = teamLoadStats.find((s) => s.employee.id === fm.id);
                                    return (
                                      <option key={fm.id} value={fm.id}>
                                        {fm.nome} ({st?.recordingsCount || 0} grav. no mês)
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>

                              {/* Seletor Manual de Modelo */}
                              <div className="flex flex-col gap-1 w-full sm:w-52">
                                <label className="text-[10px] font-bold text-[#f472b6] uppercase tracking-wider flex items-center justify-between">
                                  <span>Modelo / Apresentadora</span>
                                  {!selectedModeloId && (
                                    <span className="text-amber-400">Pendente</span>
                                  )}
                                </label>
                                <select
                                  disabled={!canManage}
                                  value={selectedModeloId}
                                  onChange={(e) =>
                                    handleManualRoleChange(ev.id, 'modelo', e.target.value)
                                  }
                                  className={`w-full rounded-xl px-2.5 py-1.5 text-xs font-bold border focus:outline-none focus:ring-1 focus:ring-[#f472b6] cursor-pointer ${
                                    selectedModeloId
                                      ? 'bg-[var(--ui-raised)] border-[var(--ui-border)] text-foreground'
                                      : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                                  }`}
                                >
                                  <option value="">— Escalar Modelo —</option>
                                  {modelos.map((mod) => {
                                    const st = teamLoadStats.find((s) => s.employee.id === mod.id);
                                    return (
                                      <option key={mod.id} value={mod.id}>
                                        {mod.nome} ({st?.recordingsCount || 0} grav. no mês)
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>

                              <button
                                type="button"
                                onClick={() => openEditEventModal(ev)}
                                className="px-3 py-2 rounded-xl bg-[var(--ui-raised)] hover:bg-[var(--ui-border)] border border-[var(--ui-border)] text-xs font-semibold text-zinc-300 transition-colors cursor-pointer sm:mt-4"
                              >
                                Detalhes
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* =================================================================
          6. ESPELHO MENSAL 5x2 (DIAS TRABALHADOS, FOLGAS E HORAS SEMANAIS)
          ================================================================= */}
      {viewMode === 'grade_semanal' && (
        <div className="rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--ui-border)] flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-foreground">
                Controle de Escala 5x2 e Teto de 42 Horas Semanais por Funcionário
              </h3>
              <p className="text-xs text-zinc-400">
                Verifica semana a semana se cada membro tem pelo menos 2 folgas na semana (EC 141/2026) e se está dentro das 42h semanais (incluindo locomoção entre restaurantes).
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {(['all', 'filmmaker', 'modelo'] as const).map((rf) => (
                <button
                  key={rf}
                  type="button"
                  onClick={() => setRoleFilter(rf)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    roleFilter === rf
                      ? 'bg-[var(--ui-accent)] text-foreground'
                      : 'bg-[var(--ui-raised)] text-zinc-400 hover:text-foreground'
                  }`}
                >
                  {rf === 'all' ? 'Todos' : rf === 'filmmaker' ? 'Filmmakers' : 'Modelos'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead>
                <tr className="border-b border-[var(--ui-border)] bg-[var(--ui-raised)] text-[11px] font-bold text-zinc-400 uppercase">
                  <th className="py-3 px-4">Funcionário</th>
                  <th className="py-3 px-3 text-center">Total Mês</th>
                  {monthWeeks.map((w) => (
                    <th key={w.weekIndex} className="py-3 px-3 text-center">
                      <div>Semana {w.weekIndex}</div>
                      <div className="text-[10px] font-normal text-zinc-500">
                        {w.startDateIso.slice(8, 10)}/{w.startDateIso.slice(5, 7)} a{' '}
                        {w.endDateIso.slice(8, 10)}/{w.endDateIso.slice(5, 7)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ui-border)] text-xs">
                {teamLoadStats
                  .filter((st) => {
                    if (roleFilter === 'filmmaker') return st.employee.funcao === 'filmmaker';
                    if (roleFilter === 'modelo')
                      return st.employee.funcao === 'modelo' || st.employee.funcao === 'criadora';
                    return true;
                  })
                  .map((st) => (
                    <tr key={st.employee.id} className="hover:bg-[var(--ui-raised)]/40">
                      <td className="py-3 px-4">
                        <EmployeeBadge employee={st.employee} size="sm" showRole />
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-foreground">
                        <div>{st.recordingsCount} grav.</div>
                        <div className="text-[10px] text-zinc-400">
                          {formatDurationHoursMinutes(st.totalMonthWorkedMinutes)}
                        </div>
                      </td>
                      {st.weeks.map((w) => {
                        const over42h = w.workedMinutes > CLT_2026_RULES.LIMITE_SEMANAL_MINUTOS;
                        const over5x2 = w.daysWorkedCount > CLT_2026_RULES.MAX_DIAS_TRABALHADOS_SEMANA;
                        return (
                          <td key={w.weekIndex} className="py-3 px-3 text-center">
                            <div
                              className={`p-2 rounded-xl border inline-flex flex-col items-center gap-0.5 min-w-[125px] ${
                                over42h || over5x2
                                  ? 'bg-red-500/15 border-red-500/40 text-red-200'
                                  : w.workedMinutes > 0
                                  ? 'bg-[var(--ui-raised)] border-[var(--ui-border)] text-zinc-200'
                                  : 'bg-[var(--ui-surface)] border-[var(--ui-border)]/50 text-zinc-500'
                              }`}
                            >
                              <span className="font-mono font-extrabold text-xs">
                                {formatDurationHoursMinutes(w.workedMinutes)} / 42h
                              </span>
                              <span className="text-[10px]">
                                {w.daysWorkedCount}d trab. •{' '}
                                <strong className={over5x2 ? 'text-red-400' : 'text-emerald-400'}>
                                  {w.daysOffCount} folgas
                                </strong>
                              </span>
                              {(over42h || over5x2) && (
                                <span className="text-[9px] font-extrabold text-red-300 uppercase mt-0.5">
                                  Alerta CLT
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================
          7. PAINEL DE ALERTAS TRABALHISTAS (CLT / EC 141/2026) NO RODAPÉ
          ================================================================= */}
      <div id="alertas-clt-rodape">
        {complianceAlerts.length === 0 ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-emerald-400">
                  Escala 100% em Conformidade Trabalhista (CLT & EC 141/2026) e Equilibrada!
                </h3>
                <p className="text-[11px] text-zinc-300">
                  Nenhum funcionário ultrapassou 42h semanais, todos respeitam a escala 5x2 (2 folgas/semana), o intervalo de 11h entre jornadas e o equilíbrio de gravações.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCurrentView('banco-horas')}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Ver Banco de Horas (42h)</span>
            </button>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-500/20">
              <div className="flex items-center gap-2.5">
                <div>
                  <h3 className="text-sm font-extrabold text-amber-300 flex items-center gap-2">
                    <span>Aviso de Conformidade Trabalhista & Equilíbrio da Escala ({complianceAlerts.length})</span>
                  </h3>
                  <p className="text-[11px] text-amber-200/80">
                    Atenção: As ocorrências abaixo fogem do equilíbrio da equipe ou dos limites da CLT / EC 141/2026 (42h semanais, escala 5x2 e 11h de descanso) e <strong>podem ferir normas trabalhistas</strong>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentView('banco-horas')}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer hover:bg-amber-400 transition-colors w-fit"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Abrir Banco de Horas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {complianceAlerts.map((alert) => {
                const isCritical = alert.severity === 'critico';
                return (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-xl border flex flex-col gap-1 ${
                      isCritical
                        ? 'bg-red-500/15 border-red-500/40 text-red-200'
                        : 'bg-[var(--ui-surface)]/90 border-amber-500/30 text-amber-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold flex items-center gap-1.5">
                        <AlertTriangle
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isCritical ? 'text-red-400' : 'text-amber-400'
                          }`}
                        />
                        {alert.title}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                          isCritical
                            ? 'bg-red-500/30 text-red-200 border border-red-400/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                        }`}
                      >
                        {isCritical ? 'Risco Trabalhista CLT' : 'Alerta de Escala'}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">{alert.description}</p>
                    <span className="text-[10px] font-mono opacity-75 pt-0.5">
                      Base Legal: {alert.legalBasis}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
