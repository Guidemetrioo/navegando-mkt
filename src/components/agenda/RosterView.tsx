'use client';

import React, { useState } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { getWeekDates, WEEKDAYS_SHORT, MONTH_NAMES_SHORT, formatDateIso, formatTimeClean, todayInSaoPaulo } from '@/lib/date-utils';
import { EmployeeBadge } from './EmployeeBadge';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, Employee } from '@/types/database';
import { Video, Sparkles, Layers, ShieldCheck, Users } from 'lucide-react';
import { USERS_DATABASE } from '@/lib/auth-users';

type DepartmentFilter = 'all' | 'filmmakers' | 'modelos' | 'interno' | 'gestao';

export function RosterView() {
  const {
    currentDate,
    employees,
    filteredEvents,
    openEditEventModal,
    isEmployeeSelected,
  } = useAgenda();

  const [activeDepartment, setActiveDepartment] = useState<DepartmentFilter>('all');

  const weekDays = getWeekDates(currentDate);
  const todayIso = todayInSaoPaulo();

  // Mapear cargos específicos a partir do banco de usuários
  const getEmployeeCargo = (empId: string): string => {
    const user = USERS_DATABASE.find((u) => u.employeeId === empId);
    return user?.cargo || 'Colaborador';
  };

  // Separação rigorosa e completa por departamentos/cargos
  const filmmakers = employees.filter((emp) => emp.funcao === 'filmmaker');
  const modelos = employees.filter((emp) => emp.funcao === 'modelo' || emp.funcao === 'criadora');
  const internos = employees.filter(
    (emp) => emp.funcao === 'interno' || (!['filmmaker', 'modelo', 'criadora', 'dono', 'gerente'].includes(emp.funcao || ''))
  );
  const gestao = employees.filter((emp) => emp.funcao === 'dono' || emp.funcao === 'gerente');

  // Aplicar filtro de funcionários selecionados da barra superior
  const visibleFilmmakers = filmmakers.filter((emp) => isEmployeeSelected(emp.id));
  const visibleModelos = modelos.filter((emp) => isEmployeeSelected(emp.id));
  const visibleInternos = internos.filter((emp) => isEmployeeSelected(emp.id));
  const visibleGestao = gestao.filter((emp) => isEmployeeSelected(emp.id));

  const totalVisible =
    visibleFilmmakers.length + visibleModelos.length + visibleInternos.length + visibleGestao.length;

  const renderEmployeeRow = (emp: Employee) => {
    let weekTotal = 0;
    const cargoTitle = getEmployeeCargo(emp.id);

    return (
      <tr key={emp.id} className="hover:bg-[var(--ui-raised)]/50 dark:hover:bg-[var(--ui-raised)]/50 hover:bg-slate-50/50 transition-colors">
        {/* Coluna Fixa: Membro */}
        <td className="sticky left-0 z-10 bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white py-3 px-4 border-r border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col gap-1">
            <EmployeeBadge employee={emp} size="md" showRole={false} />
            <span className="text-[10px] text-zinc-400 font-normal pl-0.5 truncate max-w-[170px]" title={cargoTitle}>
              {cargoTitle}
            </span>
          </div>
        </td>

        {/* 7 Dias */}
        {weekDays.map((day) => {
          const iso = formatDateIso(day);
          const isToday = iso === todayIso;

          // Eventos onde este membro específico está atribuído
          const empEvents = filteredEvents.filter(
            (ev) =>
              ev.data === iso &&
              (ev.assigned_employee_ids || []).includes(emp.id)
          );

          if (empEvents.length > 0) {
            weekTotal += empEvents.length;
          }

          return (
            <td
              key={iso}
              className={`p-2 border-r border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 align-top ${
                isToday ? 'bg-[var(--ui-accent)]/5' : ''
              }`}
            >
              {empEvents.length === 0 ? (
                <div className="h-full min-h-[64px] flex items-center justify-center rounded-xl bg-striped-pattern text-zinc-500 dark:text-zinc-500 text-zinc-400 text-xs italic select-none">
                  Livre
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {empEvents.map((ev) => {
                    const colorInfo = EVENT_TYPE_COLORS[ev.tipo] || EVENT_TYPE_COLORS.gravacao;
                    const typeLabel = EVENT_TYPE_LABELS[ev.tipo] || 'Gravação';

                    // Descobrir a parceira/parceiro da escala
                    const partner = (ev.employees || []).find((p) => p.id !== emp.id);

                    return (
                      <div
                        key={ev.id}
                        onClick={() => openEditEventModal(ev)}
                        className="relative p-2 rounded-xl border bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-50 border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 hover:border-[var(--ui-accent)]/60 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                      >
                        {/* Linha vertical à esquerda com cor do tipo */}
                        <div
                          className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full ${
                            ev.tipo === 'gravacao'
                              ? 'bg-[var(--ui-accent)]'
                              : ev.tipo === 'foto'
                              ? 'bg-[#0ea5e9]'
                              : ev.tipo === 'edicao'
                              ? 'bg-[#a855f7]'
                              : 'bg-zinc-500'
                          }`}
                        />

                        <div className="text-[10px] font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700 pl-1.5">
                          {formatTimeClean(ev.hora_inicio)}–{formatTimeClean(ev.hora_fim)}
                        </div>
                        <div className="text-xs font-bold text-foreground dark:text-foreground text-zinc-900 pl-1.5 truncate mt-0.5">
                          {ev.client?.nome || 'Restaurante'}
                        </div>
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-400 text-zinc-500 pl-1.5 mt-0.5 flex items-center justify-between gap-1">
                          <span>{typeLabel}</span>
                          {partner && (
                            <span className="font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700 truncate">
                              c/ {partner.nome}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </td>
          );
        })}

        {/* Coluna Total da Semana */}
        <td className="py-3 px-3 text-center align-middle font-bold text-sm text-zinc-200 dark:text-zinc-200 text-zinc-800">
          <span
            className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${
              weekTotal > 0
                ? 'bg-[var(--ui-accent)]/15 text-[var(--ui-accent)] border border-[var(--ui-accent)]/30'
                : 'text-zinc-500'
            }`}
          >
            {weekTotal}
          </span>
        </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Filtros de Departamentos / Cargos para organizar a visualização */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white p-3 rounded-2xl border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mr-1 hidden sm:inline">
            Separar por Cargo:
          </span>

          <button
            type="button"
            onClick={() => setActiveDepartment('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeDepartment === 'all'
                ? 'brand-solid bg-[var(--ui-accent)] text-foreground shadow-sm'
                : 'bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-100 text-zinc-400 hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Todos os Cargos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {totalVisible}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDepartment('filmmakers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeDepartment === 'filmmakers'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-100 text-zinc-400 hover:text-foreground'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Filmmakers</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {visibleFilmmakers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDepartment('modelos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeDepartment === 'modelos'
                ? 'bg-pink-500 text-white shadow-sm'
                : 'bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-100 text-zinc-400 hover:text-foreground'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modelos & Criadoras</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {visibleModelos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDepartment('interno')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeDepartment === 'interno'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-100 text-zinc-400 hover:text-foreground'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pós-Produção & Equipe Interna</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {visibleInternos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDepartment('gestao')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeDepartment === 'gestao'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-100 text-zinc-400 hover:text-foreground'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Gestão & Gerência</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {visibleGestao.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-zinc-400 font-medium">
          Total: <strong className="text-foreground">{totalVisible}</strong> colaboradores na escala
        </div>
      </div>

      {/* Tabela de Escala */}
      <div className="w-full bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white rounded-2xl border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs min-w-[980px]">
            {/* Cabeçalho */}
            <thead>
              <tr className="border-b border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-slate-50">
                {/* Coluna 1 Fixa */}
                <th className="sticky left-0 z-20 bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-slate-50 py-3.5 px-4 font-bold text-zinc-300 dark:text-zinc-300 text-zinc-700 min-w-[210px] border-r border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">
                  Equipe & Cargo
                </th>

                {/* 7 Dias da Semana */}
                {weekDays.map((day, idx) => {
                  const iso = formatDateIso(day);
                  const isToday = iso === todayIso;

                  return (
                    <th
                      key={iso}
                      className={`py-3.5 px-3 font-semibold text-center min-w-[130px] border-r border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 ${
                        isToday
                          ? 'bg-[var(--ui-accent)]/10 text-[var(--ui-accent)] font-bold'
                          : 'text-zinc-300 dark:text-zinc-300 text-zinc-700'
                      }`}
                    >
                      <div>{WEEKDAYS_SHORT[idx]}</div>
                      <div className="text-[11px] font-normal text-zinc-400 dark:text-zinc-400 text-zinc-500 mt-0.5">
                        {day.getDate()} {MONTH_NAMES_SHORT[day.getMonth()]}
                      </div>
                    </th>
                  );
                })}

                {/* Coluna Total */}
                <th className="py-3.5 px-3 text-center font-bold text-zinc-300 dark:text-zinc-300 text-zinc-700 min-w-[80px]">
                  Total
                </th>
              </tr>
            </thead>

            {/* Linhas Agrupadas por Cargo */}
            <tbody className="divide-y divide-[var(--ui-border)] dark:divide-[var(--ui-border)] divide-slate-200">
              {/* SEÇÃO 1: FILMMAKERS */}
              {(activeDepartment === 'all' || activeDepartment === 'filmmakers') && visibleFilmmakers.length > 0 && (
                <>
                  <tr className="bg-[var(--ui-surface)]/90 dark:bg-[var(--ui-surface)]/90 bg-slate-100">
                    <td
                      colSpan={9}
                      className="py-2 px-4 text-[11px] font-bold text-[#38bdf8] uppercase tracking-wider sticky left-0 z-10"
                    >
                      <div className="flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-[#38bdf8]" />
                        <span>Filmmakers ({visibleFilmmakers.length}) — Operação de Câmera & Equipamento</span>
                      </div>
                    </td>
                  </tr>
                  {visibleFilmmakers.map(renderEmployeeRow)}
                </>
              )}

              {/* SEÇÃO 2: MODELOS & CRIADORAS */}
              {(activeDepartment === 'all' || activeDepartment === 'modelos') && visibleModelos.length > 0 && (
                <>
                  <tr className="bg-[var(--ui-surface)]/90 dark:bg-[var(--ui-surface)]/90 bg-slate-100">
                    <td
                      colSpan={9}
                      className="py-2 px-4 text-[11px] font-bold text-[#f472b6] uppercase tracking-wider sticky left-0 z-10"
                    >
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#f472b6]" />
                        <span>Modelos & Criadoras ({visibleModelos.length}) — Apresentação & Criação de Reels</span>
                      </div>
                    </td>
                  </tr>
                  {visibleModelos.map(renderEmployeeRow)}
                </>
              )}

              {/* SEÇÃO 3: PÓS-PRODUÇÃO & EQUIPE INTERNA */}
              {(activeDepartment === 'all' || activeDepartment === 'interno') && visibleInternos.length > 0 && (
                <>
                  <tr className="bg-[var(--ui-surface)]/90 dark:bg-[var(--ui-surface)]/90 bg-slate-100">
                    <td
                      colSpan={9}
                      className="py-2 px-4 text-[11px] font-bold text-[#a855f7] uppercase tracking-wider sticky left-0 z-10"
                    >
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#a855f7]" />
                        <span>Pós-Produção & Equipe Interna ({visibleInternos.length}) — Edição, Design & Tráfego</span>
                      </div>
                    </td>
                  </tr>
                  {visibleInternos.map(renderEmployeeRow)}
                </>
              )}

              {/* SEÇÃO 4: GESTÃO & GERÊNCIA */}
              {(activeDepartment === 'all' || activeDepartment === 'gestao') && visibleGestao.length > 0 && (
                <>
                  <tr className="bg-[var(--ui-surface)]/90 dark:bg-[var(--ui-surface)]/90 bg-slate-100">
                    <td
                      colSpan={9}
                      className="py-2 px-4 text-[11px] font-bold text-[#fbbf24] uppercase tracking-wider sticky left-0 z-10"
                    >
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#fbbf24]" />
                        <span>Gestão & Gerência ({visibleGestao.length}) — Direção Executiva & Atendimento</span>
                      </div>
                    </td>
                  </tr>
                  {visibleGestao.map(renderEmployeeRow)}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
