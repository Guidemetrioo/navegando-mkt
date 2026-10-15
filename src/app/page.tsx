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
import {
  CheckCircle2,
  Calendar,
  Columns,
  Table2,
  UserCheck,
  Menu,
  Camera,
  Plus,
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
  } = useAgenda();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

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
            {/* Botão de Bater Ponto Rápido no Mobile */}
            <button
              type="button"
              onClick={() => openPontoModal(undefined, undefined, 'entrada')}
              className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#FF5A3C]/15 border border-[#FF5A3C]/30 text-[#FF5A3C] text-[11px] font-bold active:scale-95 transition-all cursor-pointer"
              title="Bater Ponto Agora"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Ponto</span>
            </button>

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
