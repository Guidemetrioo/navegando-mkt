'use client';

import React from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { getWeekDates, WEEKDAYS_SHORT, MONTH_NAMES_SHORT, formatDateIso, formatTimeClean } from '@/lib/date-utils';
import { EmployeeBadge } from './EmployeeBadge';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '@/types/database';

export function RosterView() {
  const {
    currentDate,
    employees,
    filteredEvents,
    openEditEventModal,
    isEmployeeSelected,
  } = useAgenda();

  const weekDays = getWeekDates(currentDate);
  const todayIso = '2026-10-14';

  // Separar visíveis por função
  const visibleFilmmakers = employees
    .filter((emp) => emp.funcao === 'filmmaker')
    .filter((emp) => isEmployeeSelected(emp.id));

  const visibleCriadoras = employees
    .filter((emp) => emp.funcao === 'criadora')
    .filter((emp) => isEmployeeSelected(emp.id));

  const visibleOutros = employees
    .filter((emp) => !emp.funcao)
    .filter((emp) => isEmployeeSelected(emp.id));

  const renderEmployeeRow = (emp: typeof employees[0]) => {
    let weekTotal = 0;

    return (
      <tr key={emp.id} className="hover:bg-[#1a1b20]/50 dark:hover:bg-[#1a1b20]/50 hover:bg-slate-50/50 transition-colors">
        {/* Coluna Fixa: Membro */}
        <td className="sticky left-0 z-10 bg-[#16171b] dark:bg-[#16171b] bg-white py-3 px-4 border-r border-[#26282f] dark:border-[#26282f] border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">
          <EmployeeBadge employee={emp} size="md" showRole />
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
              className={`p-2 border-r border-[#26282f] dark:border-[#26282f] border-slate-200 align-top ${
                isToday ? 'bg-[#FF5A3C]/5' : ''
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
                        className={`relative p-2 rounded-xl border bg-[#1c1d22] dark:bg-[#1c1d22] bg-slate-50 border-[#2b2d35] dark:border-[#2b2d35] border-slate-200 hover:border-[#FF5A3C]/60 transition-all cursor-pointer shadow-sm hover:scale-[1.02]`}
                      >
                        {/* Linha vertical à esquerda com cor do tipo */}
                        <div
                          className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full ${
                            ev.tipo === 'gravacao'
                              ? 'bg-[#FF5A3C]'
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
                        <div className="text-xs font-bold text-white dark:text-white text-zinc-900 pl-1.5 truncate mt-0.5">
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
                ? 'bg-[#FF5A3C]/15 text-[#FF5A3C] border border-[#FF5A3C]/30'
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
    <div className="w-full bg-[#16171b] dark:bg-[#16171b] bg-white rounded-2xl border border-[#26282f] dark:border-[#26282f] border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs min-w-[900px]">
          {/* Cabeçalho */}
          <thead>
            <tr className="border-b border-[#26282f] dark:border-[#26282f] border-slate-200 bg-[#121316] dark:bg-[#121316] bg-slate-50">
              {/* Coluna 1 Fixa */}
              <th className="sticky left-0 z-20 bg-[#121316] dark:bg-[#121316] bg-slate-50 py-3.5 px-4 font-bold text-zinc-300 dark:text-zinc-300 text-zinc-700 min-w-[190px] border-r border-[#26282f] dark:border-[#26282f] border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">
                Equipe (Filmmakers & Meninas)
              </th>

              {/* 7 Dias da Semana */}
              {weekDays.map((day, idx) => {
                const iso = formatDateIso(day);
                const isToday = iso === todayIso;

                return (
                  <th
                    key={iso}
                    className={`py-3.5 px-3 font-semibold text-center min-w-[130px] border-r border-[#26282f] dark:border-[#26282f] border-slate-200 ${
                      isToday
                        ? 'bg-[#FF5A3C]/10 text-[#FF5A3C] font-bold'
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

          {/* Linhas Agrupadas */}
          <tbody className="divide-y divide-[#26282f] dark:divide-[#26282f] divide-slate-200">
            {/* Seção 1: FILMMAKERS */}
            {visibleFilmmakers.length > 0 && (
              <>
                <tr className="bg-[#121316]/90 dark:bg-[#121316]/90 bg-slate-100">
                  <td
                    colSpan={9}
                    className="py-2 px-4 text-[11px] font-bold text-[#38bdf8] uppercase tracking-wider sticky left-0 z-10"
                  >
                    🎥 Filmmakers ({visibleFilmmakers.length}) — Operação de Câmera & Equipamento
                  </td>
                </tr>
                {visibleFilmmakers.map(renderEmployeeRow)}
              </>
            )}

            {/* Seção 2: MENINAS DOS VÍDEOS (CRIADORAS) */}
            {visibleCriadoras.length > 0 && (
              <>
                <tr className="bg-[#121316]/90 dark:bg-[#121316]/90 bg-slate-100">
                  <td
                    colSpan={9}
                    className="py-2 px-4 text-[11px] font-bold text-[#f472b6] uppercase tracking-wider sticky left-0 z-10"
                  >
                    ✨ Meninas dos Vídeos ({visibleCriadoras.length}) — Apresentação & Gravação de Reels
                  </td>
                </tr>
                {visibleCriadoras.map(renderEmployeeRow)}
              </>
            )}

            {/* Outros se houver */}
            {visibleOutros.length > 0 && visibleOutros.map(renderEmployeeRow)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
