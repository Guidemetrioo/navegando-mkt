'use client';

import React, { useState } from 'react';
import { AgendaProvider, useAgenda } from '@/context/AgendaContext';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ExecutiveDashboardView } from '@/components/dashboard/ExecutiveDashboardView';
import { EmployeeWelcomeDashboard } from '@/components/dashboard/EmployeeWelcomeDashboard';
import { LoginCheckInView } from '@/components/auth/LoginCheckInView';
import { FilesDeliverablesView } from '@/components/files/FilesDeliverablesView';
import { ClientsView } from '@/components/clients/ClientsView';
import { BackupSafetyView } from '@/components/backup/BackupSafetyView';
import { MonthView } from '@/components/agenda/MonthView';
import { WeekView } from '@/components/agenda/WeekView';
import { RosterView } from '@/components/agenda/RosterView';
import { MyAgendaView } from '@/components/agenda/MyAgendaView';
import { InstagramMetricsView } from '@/components/social/InstagramMetricsView';
import { MentionsUgcView } from '@/components/social/MentionsUgcView';
import { PontoView } from '@/components/ponto/PontoView';
import { DateNavigator } from '@/components/agenda/DateNavigator';
import { EmployeeFilter } from '@/components/agenda/EmployeeFilter';
import { TypeLegend } from '@/components/agenda/TypeLegend';
import { DayDetailModal } from '@/components/modals/DayDetailModal';
import { EventModal } from '@/components/modals/EventModal';
import { PontoModal } from '@/components/modals/PontoModal';
import { DeliverableModal } from '@/components/modals/DeliverableModal';
import { ClientModal } from '@/components/modals/ClientModal';
import { CommandPaletteModal } from '@/components/modals/CommandPaletteModal';
import {
  CheckCircle2,
  Calendar,
  Columns,
  Table2,
  UserCheck,
  Menu,
  Camera,
  Plus,
  Search,
  Building,
  FolderOpen,
  ChevronDown,
} from 'lucide-react';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { EmployeeBadge } from '@/components/agenda/EmployeeBadge';

function AgendaMainContent() {
  const {
    currentView,
    setCurrentView,
    isAuthenticated,
    employees,
    loggedEmployeeId,
    openPontoModal,
    openNewEventModal,
    openDeliverableModal,
    openClientModal,
  } = useAgenda();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  // Atalho global Ctrl+K / Cmd+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentMember = employees.find((e) => e.id === loggedEmployeeId) || employees[0];

  // Se não estiver autenticado, exige o Ponto Eletrônico de Entrada com Foto e GPS
  if (!isAuthenticated) {
    return <LoginCheckInView />;
  }

  const isCalendarView =
    currentView === 'mes' ||
    currentView === 'semana' ||
    currentView === 'escala' ||
    currentView === 'minha-agenda';

  return (
    <div className="min-h-screen flex w-full bg-[#0d0e11] text-zinc-100 selection:bg-[#FF5A3C]/30">
      {/* 1. Pro Sidebar Fixa / Navegação Principal */}
      <AppSidebar
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* 2. Área de Trabalho Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Barra Superior de Status & Breadcrumb */}
        <header className="h-14 border-b border-[#26282f] bg-[#111215]/85 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1f2026] active:bg-[#282a32] transition-colors cursor-pointer shrink-0"
              title="Abrir menu lateral"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-zinc-400 hidden sm:inline">NAVEGANDO MKT</span>
            <span className="text-zinc-600 hidden sm:inline">/</span>
            <span className="font-bold text-white capitalize truncate text-xs sm:text-sm">
              {currentView === 'home' && 'Início (Meu Painel)'}
              {currentView === 'dashboard' && 'Dashboard Executivo'}
              {currentView === 'mes' && 'Agenda Mensal'}
              {currentView === 'semana' && 'Agenda Semanal'}
              {currentView === 'escala' && 'Escala da Equipe'}
              {currentView === 'minha-agenda' && 'Minha Agenda'}
              {currentView === 'ponto' && 'Ponto & GPS'}
              {currentView === 'arquivos' && 'Central DAM'}
              {currentView === 'clientes' && 'Restaurantes'}
              {currentView === 'metricas-reels' && 'Métricas Instagram'}
              {currentView === 'mural-ugc' && 'Mural UGC'}
              {currentView === 'backups' && 'Segurança & Backup'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botão de Busca Global (Ctrl+K) */}
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#17181d] hover:bg-[#1f2026] border border-[#2b2d35] text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
              title="Buscar clientes, vídeos, equipe (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-[#FF5A3C]" />
              <span className="hidden lg:inline text-zinc-400">Buscar no CRM...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-mono bg-[#111215] text-zinc-400 rounded border border-[#26282f]">
                Ctrl K
              </kbd>
            </button>

            {/* Menu de Ação Rápida: + Criar */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF5A3C] hover:bg-[#e04a2f] text-white font-bold text-xs shadow-md shadow-[#FF5A3C]/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Criar</span>
                <ChevronDown className="w-3 h-3 text-white/80" />
              </button>

              {isQuickActionOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsQuickActionOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#16171b] border border-[#2b2d35] p-1.5 shadow-2xl z-40 flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsQuickActionOpen(false);
                        openNewEventModal();
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-[#21232b] transition-colors cursor-pointer text-left"
                    >
                      <Calendar className="w-4 h-4 text-[#FF5A3C]" />
                      <div>
                        <span className="font-bold block">Nova Gravação</span>
                        <span className="text-[10px] text-zinc-400">Escalar dupla e horário</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsQuickActionOpen(false);
                        openDeliverableModal();
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-[#21232b] transition-colors cursor-pointer text-left"
                    >
                      <FolderOpen className="w-4 h-4 text-[#38bdf8]" />
                      <div>
                        <span className="font-bold block">Novo Entregável / Reel</span>
                        <span className="text-[10px] text-zinc-400">Link do Drive ou vídeo</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsQuickActionOpen(false);
                        openClientModal();
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-[#21232b] transition-colors cursor-pointer text-left"
                    >
                      <Building className="w-4 h-4 text-amber-400" />
                      <div>
                        <span className="font-bold block">Novo Restaurante</span>
                        <span className="text-[10px] text-zinc-400">Cadastrar no CRM</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsQuickActionOpen(false);
                        openPontoModal();
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-[#21232b] transition-colors cursor-pointer text-left border-t border-[#26282f] pt-1.5"
                    >
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-bold block">Bater Ponto & GPS</span>
                        <span className="text-[10px] text-zinc-400">Registro presencial</span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Avatar do Usuário */}
            {currentMember && (
              <div className="flex items-center gap-1.5">
                <EmployeeBadge employee={currentMember} size="sm" showName={false} />
              </div>
            )}

            {/* Indicador de Persistência Segura */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Base Salva</span>
            </div>
          </div>
        </header>

        {/* Conteúdo Central */}
        <main className="p-3 sm:p-6 md:p-8 pb-28 md:pb-8 max-w-7xl w-full mx-auto flex flex-col gap-4 sm:gap-5 flex-1">
          {/* Sub-header de Navegação de Datas se estiver nas abas de agenda */}
          {isCalendarView && (
            <div className="flex flex-col gap-3">
              {/* Seletor de Visão de Agenda */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="inline-flex p-1 bg-[#16171b] rounded-xl border border-[#26282f] gap-1 overflow-x-auto max-w-full">
                  <button
                    type="button"
                    onClick={() => setCurrentView('mes')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      currentView === 'mes'
                        ? 'bg-[#26282f] text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Mês</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentView('semana')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      currentView === 'semana'
                        ? 'bg-[#26282f] text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Semana</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentView('escala')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      currentView === 'escala'
                        ? 'bg-[#26282f] text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Table2 className="w-3.5 h-3.5" />
                    <span>Escala da Equipe</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentView('minha-agenda')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      currentView === 'minha-agenda'
                        ? 'bg-[#26282f] text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Minha Agenda</span>
                  </button>
                </div>

                <DateNavigator />
              </div>

              {/* Filtro por Funcionário e Legenda */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#26282f]/60">
                <EmployeeFilter />
                <TypeLegend />
              </div>
            </div>
          )}

          {/* Renderização da Visão Ativa */}
          <div className="flex-1">
            {currentView === 'home' && <EmployeeWelcomeDashboard />}
            {currentView === 'dashboard' && <ExecutiveDashboardView />}
            {currentView === 'mes' && <MonthView />}
            {currentView === 'semana' && <WeekView />}
            {currentView === 'escala' && <RosterView />}
            {currentView === 'minha-agenda' && <MyAgendaView />}
            {currentView === 'ponto' && <PontoView />}
            {currentView === 'arquivos' && <FilesDeliverablesView />}
            {currentView === 'clientes' && <ClientsView />}
            {currentView === 'metricas-reels' && <InstagramMetricsView />}
            {currentView === 'mural-ugc' && <MentionsUgcView />}
            {currentView === 'backups' && <BackupSafetyView />}
          </div>
        </main>
      </div>

      {/* 3. Barra de Navegação Inferior Fixa para Mobile (polegar fácil) */}
      <MobileBottomNav onOpenMenu={() => setIsMobileNavOpen(true)} />

      {/* Modais Globais do Sistema */}
      <DayDetailModal />
      <EventModal />
      <PontoModal />
      <DeliverableModal />
      <ClientModal />
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}

export default function Page() {
  return (
    <AgendaProvider>
      <AgendaMainContent />
    </AgendaProvider>
  );
}
