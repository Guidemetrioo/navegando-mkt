'use client';

import React from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { Plus, Sun, Moon, ShieldCheck, User, Camera } from 'lucide-react';

export function Header() {
  const {
    openNewEventModal,
    openPontoModal,
    theme,
    toggleTheme,
    userRole,
    setUserRole,
    employees,
    loggedEmployeeId,
    setLoggedEmployeeId,
  } = useAgenda();

  const currentLoggedEmployee = employees.find((e) => e.id === loggedEmployeeId);

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">
          Navegando MKT <span className="text-[#FF6600]">•</span> Agenda da equipe
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Quem grava, onde e para qual restaurante parceiro, em cada dia.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Simulador de Papel / Perfil */}
        <div className="flex items-center gap-2 bg-[#121318] p-1 rounded-xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setUserRole('admin')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
              userRole === 'admin'
                ? 'bg-[#FF6600] text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </button>
          <button
            type="button"
            onClick={() => setUserRole('funcionario')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
              userRole === 'funcionario'
                ? 'bg-[#FF6600] text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Equipe
          </button>
        </div>

        {/* Seletor de qual membro da equipe está simulado se for papel equipe */}
        {userRole === 'funcionario' && (
          <select
            value={loggedEmployeeId}
            onChange={(e) => setLoggedEmployeeId(e.target.value)}
            className="text-xs bg-[#121318] text-zinc-200 border border-white/10 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#FF6600]"
          >
            <optgroup label="🎥 Filmmakers" className="bg-[#121318] text-[#38bdf8] font-bold">
              {employees
                .filter((e) => e.funcao === 'filmmaker')
                .map((emp) => (
                  <option key={emp.id} value={emp.id} className="bg-[#121318] text-white font-normal">
                    {emp.nome} (Filmmaker)
                  </option>
                ))}
            </optgroup>
            <optgroup label="✨ Modelos #influencer" className="bg-[#121318] text-[#f472b6] font-bold">
              {employees
                .filter((e) => e.funcao === 'criadora')
                .map((emp) => (
                  <option key={emp.id} value={emp.id} className="bg-[#121318] text-white font-normal">
                    {emp.nome} (Modelo Gastronômica)
                  </option>
                ))}
            </optgroup>
          </select>
        )}

        {/* Botão de Tema */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          className="p-2 text-zinc-400 hover:text-white hover:bg-[#1b1d22] rounded-xl border border-white/10 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
        </button>

        {/* Botão Bater Ponto */}
        <button
          type="button"
          onClick={() => openPontoModal()}
          className="flex items-center gap-1.5 bg-[#14151b] hover:bg-[#1d1f27] text-emerald-400 border border-emerald-500/30 font-semibold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          title="Registrar ponto com foto e GPS"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Bater Ponto</span>
        </button>

        {/* Botão + Nova gravação (Apenas Admin pode criar conforme RLS) */}
        {userRole === 'admin' ? (
          <button
            type="button"
            onClick={() => openNewEventModal()}
            className="gradient-cta flex items-center gap-2 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nova gravação</span>
          </button>
        ) : (
          <div className="text-xs text-zinc-400 bg-zinc-800/40 px-3 py-2 rounded-xl border border-zinc-700/50">
            Modo Leitura ({currentLoggedEmployee?.nome})
          </div>
        )}
      </div>
    </header>
  );
}
