'use client';

import React from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { EmployeeBadge } from './EmployeeBadge';
import { X, Video, Sparkles } from 'lucide-react';

export function EmployeeFilter() {
  const {
    employees,
    selectedEmployeeIds,
    setSelectedEmployeeIds,
    toggleEmployeeFilter,
    clearEmployeeFilter,
  } = useAgenda();

  const isAnyFiltered = selectedEmployeeIds.length > 0;

  const filmmakers = employees.filter((e) => e.funcao === 'filmmaker');
  const criadoras = employees.filter((e) => e.funcao === 'criadora');

  const filmmakerIds = filmmakers.map((e) => e.id);
  const criadoraIds = criadoras.map((e) => e.id);

  const isOnlyFilmmakers =
    selectedEmployeeIds.length === filmmakerIds.length &&
    filmmakerIds.every((id) => selectedEmployeeIds.includes(id));

  const isOnlyCriadoras =
    selectedEmployeeIds.length === criadoraIds.length &&
    criadoraIds.every((id) => selectedEmployeeIds.includes(id));

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1.5 px-3 bg-[#16171b]/60 dark:bg-[#16171b]/60 bg-slate-50/80 rounded-2xl border border-[#26282f]/80 dark:border-[#26282f]/80 border-slate-200">
      {/* Grupos de Funcionários / Equipe */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Grupo Filmmakers */}
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-400 text-zinc-500 uppercase tracking-wider">
            <Video className="w-3 h-3 text-[#38bdf8]" />
            Filmmakers:
          </span>
          <div className="flex items-center gap-1">
            {filmmakers.map((emp) => {
              const isSelected = selectedEmployeeIds.length === 0 || selectedEmployeeIds.includes(emp.id);
              return (
                <EmployeeBadge
                  key={emp.id}
                  employee={emp}
                  size="sm"
                  isSelected={isSelected}
                  onClick={() => toggleEmployeeFilter(emp.id)}
                />
              );
            })}
          </div>
        </div>

        {/* Divisor */}
        <div className="hidden sm:block w-px h-5 bg-[#26282f] dark:bg-[#26282f] bg-slate-300" />

        {/* Grupo Meninas dos Vídeos (Criadoras) */}
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-400 text-zinc-500 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-[#f472b6]" />
            Meninas dos Vídeos:
          </span>
          <div className="flex items-center gap-1">
            {criadoras.map((emp) => {
              const isSelected = selectedEmployeeIds.length === 0 || selectedEmployeeIds.includes(emp.id);
              return (
                <EmployeeBadge
                  key={emp.id}
                  employee={emp}
                  size="sm"
                  isSelected={isSelected}
                  onClick={() => toggleEmployeeFilter(emp.id)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Botões Rápidos de Filtragem */}
      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
        <button
          type="button"
          onClick={() => (isOnlyFilmmakers ? clearEmployeeFilter() : setSelectedEmployeeIds(filmmakerIds))}
          className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
            isOnlyFilmmakers
              ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40'
              : 'text-zinc-400 hover:text-white bg-[#1f2026] hover:bg-[#282a32] border border-[#2b2d35]'
          }`}
          title="Filtrar apenas os 4 Filmmakers"
        >
          <Video className="w-3 h-3" />
          <span>Filmmakers</span>
        </button>

        <button
          type="button"
          onClick={() => (isOnlyCriadoras ? clearEmployeeFilter() : setSelectedEmployeeIds(criadoraIds))}
          className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
            isOnlyCriadoras
              ? 'bg-[#f472b6]/20 text-[#f472b6] border border-[#f472b6]/40'
              : 'text-zinc-400 hover:text-white bg-[#1f2026] hover:bg-[#282a32] border border-[#2b2d35]'
          }`}
          title="Filtrar apenas as 4 Meninas dos Vídeos"
        >
          <Sparkles className="w-3 h-3" />
          <span>Meninas (Vídeo)</span>
        </button>

        {isAnyFiltered && (
          <button
            type="button"
            onClick={clearEmployeeFilter}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#FF5A3C] hover:text-[#ff7861] bg-[#FF5A3C]/10 hover:bg-[#FF5A3C]/20 px-2.5 py-1 rounded-xl transition-colors cursor-pointer border border-[#FF5A3C]/20"
            title="Limpar todos os filtros"
          >
            <X className="w-3 h-3" />
            <span>Todos</span>
          </button>
        )}
      </div>
    </div>
  );
}
