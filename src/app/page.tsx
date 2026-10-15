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
} from 'lucide-react';

function AgendaMainContent() {
  const { currentView, setCurrentView, isAuthenticated } = useAgenda();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

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
    <div className="min-h-screen flex w-full bg-[#0d0e11] text-zinc-100">
      {/* 1. Pro Sidebar Fixa / Navegação Principal */}
      <AppSidebar
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* 2. Área de Trabalho Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Barra Superior de Status & Breadcrumb */}
        <header className="h-14 border-b border-[#26282f] bg-[#111215]/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1f2026] transition-colors cursor-pointer shrink-0"
              title="Abrir menu lateral"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-zinc-400 hidden sm:inline">NAVEGANDO MKT</span>
            <span className="text-zinc-600 hidden sm:inline">/</span>
            <span className="font-bold text-white capitalize truncate">
              {currentView === 'home' && 'Início (Boas-Vindas & Painel de Prioridades)'}
              {currentView === 'dashboard' && 'Visão Geral (Dashboard Executivo)'}
              {currentView === 'mes' && 'Agenda Mensal'}
              {currentView === 'semana' && 'Agenda Semanal'}
              {currentView === 'escala' && 'Escala da Equipe por Duplas'}
              {currentView === 'minha-agenda' && 'Minha Agenda'}
              {currentView === 'ponto' && 'Ponto Eletrônico & GPS'}
              {currentView === 'arquivos' && 'Central de Arquivos (DAM)'}
              {currentView === 'clientes' && 'Restaurantes Parceiros'}
              {currentView === 'metricas-reels' && 'Métricas de Reels'}
              {currentView === 'mural-ugc' && 'Mural UGC & Menções'}
              {currentView === 'backups' && 'Segurança & Backup de Dados'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Indicador de Persistência Segura */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Base 100% Salva</span>
            </div>

            <span className="text-[11px] text-zinc-500 hidden md:inline font-mono">
              Outubro / 2026
            </span>
          </div>
        </header>

        {/* Conteúdo Central */}
        <main className="p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto flex flex-col gap-5 flex-1">
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
