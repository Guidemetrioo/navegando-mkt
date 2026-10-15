'use client';

import React from 'react';
import { useAgenda, AgendaView } from '@/context/AgendaContext';
import {
  Sparkles,
  Calendar,
  MapPin,
  FolderOpen,
  Building,
  Menu,
  Clock,
  Plus,
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps) {
  const {
    currentView,
    setCurrentView,
    events,
    deliverables,
    lastLoginPonto,
    openPontoModal,
  } = useAgenda();

  const todayIso = '2026-10-14';
  const todayEventsCount = events.filter((e) => e.data === todayIso).length;
  const pendingApprovalsCount = deliverables.filter(
    (d) => d.status === 'aguardando_aprovacao' || d.status === 'ajustes_solicitados'
  ).length;

  const isCalendarActive =
    currentView === 'mes' ||
    currentView === 'semana' ||
    currentView === 'escala' ||
    currentView === 'minha-agenda';

  return (
    <nav
      aria-label="Navegação Mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111215]/95 backdrop-blur-xl border-t border-[#26282f] pb-safe px-2 pt-2 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] transition-all"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Início (Meu Painel) */}
        <button
          type="button"
          onClick={() => setCurrentView('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
            currentView === 'home'
              ? 'text-[#FF5A3C]'
              : 'text-zinc-400 hover:text-zinc-200 active:scale-95'
          }`}
        >
          <div className="relative">
            <Sparkles className="w-5 h-5" />
            {currentView === 'home' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FF5A3C]" />
            )}
          </div>
          <span className="text-[10px] font-semibold mt-1 tracking-tight">Início</span>
        </button>

        {/* 2. Agenda */}
        <button
          type="button"
          onClick={() => setCurrentView('mes')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
            isCalendarActive
              ? 'text-[#FF5A3C]'
              : 'text-zinc-400 hover:text-zinc-200 active:scale-95'
          }`}
        >
          <div className="relative">
            <Calendar className="w-5 h-5" />
            {todayEventsCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#FF5A3C] text-[9px] font-black text-white flex items-center justify-center border border-[#111215]">
                {todayEventsCount}
              </span>
            )}
            {isCalendarActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FF5A3C]" />
            )}
          </div>
          <span className="text-[10px] font-semibold mt-1 tracking-tight">Agenda</span>
        </button>

        {/* 3. Botão Central em Destaque: Ponto / Check-in */}
        <button
          type="button"
          onClick={() => setCurrentView('ponto')}
          className="flex flex-col items-center justify-center flex-1 -mt-4 relative group cursor-pointer"
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-active:scale-90 ${
              currentView === 'ponto'
                ? 'bg-gradient-to-tr from-[#FF5A3C] to-[#e04a2f] text-white shadow-[#FF5A3C]/40'
                : 'bg-[#1e2027] border border-[#2f323c] text-white hover:border-[#FF5A3C]/50'
            }`}
          >
            <MapPin className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <span
            className={`text-[10px] font-bold mt-1 tracking-tight flex items-center gap-1 ${
              currentView === 'ponto' ? 'text-[#FF5A3C]' : 'text-zinc-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            Ponto
          </span>
        </button>

        {/* 4. DAM Arquivos */}
        <button
          type="button"
          onClick={() => setCurrentView('arquivos')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
            currentView === 'arquivos'
              ? 'text-[#FF5A3C]'
              : 'text-zinc-400 hover:text-zinc-200 active:scale-95'
          }`}
        >
          <div className="relative">
            <FolderOpen className="w-5 h-5" />
            {pendingApprovalsCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-[9px] font-black text-black flex items-center justify-center border border-[#111215]">
                {pendingApprovalsCount}
              </span>
            )}
            {currentView === 'arquivos' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FF5A3C]" />
            )}
          </div>
          <span className="text-[10px] font-semibold mt-1 tracking-tight">Arquivos</span>
        </button>

        {/* 5. Menu / Mais */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1 tracking-tight">Mais</span>
        </button>
      </div>
    </nav>
  );
}
