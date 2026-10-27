'use client';
import { todayInSaoPaulo, getWeekDates, parseDateIso, formatDateIso } from '@/lib/date-utils';

import React from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { EmployeeBadge } from '../agenda/EmployeeBadge';
import { formatDistance } from '@/lib/geo-utils';
import {
  Calendar,
  Clock,
  Video,
  FolderOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Camera,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Download,
  Building,
  Sparkles,
} from 'lucide-react';

export function ExecutiveDashboardView() {
  const {
    events,
    clients,
    employees,
    pontos,
    deliverables,
    setCurrentView,
    openNewEventModal,
    openPontoModal,
    openDeliverableModal,
    exportSystemBackup,
    updateDeliverableStatus,
  } = useAgenda();

  const todayIso = todayInSaoPaulo();
  const todayEvents = events.filter((e) => e.data === todayIso);
  const pendingDeliverables = deliverables.filter(
    (d) => d.status === 'aguardando_aprovacao' || d.status === 'em_edicao'
  );
  const todayPontos = pontos.filter((p) => todayInSaoPaulo(new Date(p.data_hora))===todayIso);

  // KPIs
  const weekDates=new Set(getWeekDates(parseDateIso(todayIso)).map(formatDateIso));
  const totalEventsThisWeek = events.filter(e=>weekDates.has(e.data) && e.status!=='cancelado').length;
  const totalDeliverablesCount = deliverables.length;
  const approvedCount = deliverables.filter((d) => d.status === 'aprovado' || d.status === 'publicado').length;

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. BANNER PRINCIPAL COM BOAS-VINDAS E STATUS DA AGÊNCIA */}
      <div className="workspace-intro relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[var(--ui-surface)] via-[var(--ui-surface)] to-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--ui-accent)]/15 text-[var(--ui-accent)] border border-[var(--ui-accent)]/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Navegando · Gestão de produção
              </span>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Gestão da agência
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading tracking-tight">
              Visão da operação
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Controle em tempo real de escalas, gravações em campo com duplas (Filmmakers & Criadoras), arquivos brutos e aprovações de clientes.
            </p>
          </div>

          {/* Botões de Ação Rápida Executiva */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => openNewEventModal()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl brand-solid bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-foreground font-bold text-xs shadow-lg shadow-[var(--ui-accent)]/25 transition-all hover:scale-105 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nova Gravação</span>
            </button>

            <button
              type="button"
              onClick={() => openDeliverableModal()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[var(--ui-raised)] hover:bg-[var(--ui-hover)] text-zinc-200 border border-[var(--ui-border)] font-bold text-xs transition-colors cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Novo Arquivo/Drive</span>
            </button>

            <button
              type="button"
              onClick={() => openPontoModal()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[var(--ui-raised)] hover:bg-[var(--ui-hover)] text-zinc-200 border border-[var(--ui-border)] font-bold text-xs transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bater Ponto</span>
            </button>

            <button
              type="button"
              onClick={exportSystemBackup}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[var(--ui-raised)] hover:bg-[var(--ui-hover)] text-zinc-300 border border-[var(--ui-border)] text-xs font-semibold transition-colors cursor-pointer"
              title="Baixa cópia de segurança completa do banco em JSON"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Backup</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPIS PRINCIPAIS DA OPERAÇÃO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Gravações */}
        <div
          onClick={() => setCurrentView('mes')}
          className="p-4 sm:p-5 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] hover:border-[var(--ui-accent)]/40 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Gravações da Semana</span>
            <div className="w-8 h-8 rounded-xl bg-[var(--ui-accent)]/10 text-[var(--ui-accent)] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">
              {totalEventsThisWeek}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
              <span className="text-emerald-400 font-bold">{todayEvents.length} agendadas hoje</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Entregáveis / Arquivos */}
        <div
          onClick={() => setCurrentView('arquivos')}
          className="p-4 sm:p-5 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] hover:border-amber-500/40 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Entregas em Produção</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <FolderOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">
              {pendingDeliverables.length}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              <span>{approvedCount} de {totalDeliverablesCount} vídeos aprovados</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Pontos & Presença */}
        <div
          onClick={() => setCurrentView('ponto')}
          className="p-4 sm:p-5 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] hover:border-emerald-500/40 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Presença no Local (GPS)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">
              {todayPontos.length}
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
              100% validados dentro do raio
            </div>
          </div>
        </div>

        {/* KPI 4: Redes & Clientes */}
        <div
          onClick={() => setCurrentView('clientes')}
          className="p-4 sm:p-5 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] hover:border-sky-500/40 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Restaurantes Ativos</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-[#38bdf8] flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">
              {clients.length}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              <span>Pastas do Drive integradas</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FLUXO OPERACIONAL DIVIDIDO: GRAVAÇÕES DE HOJE & FILA DE APROVAÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda (7 cols): Gravações de Hoje (Escala de Campo) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground font-heading flex items-center gap-2">
              <Video className="w-4 h-4 text-[var(--ui-accent)]" />
              <span>Gravações de Hoje na Rua ({todayEvents.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => setCurrentView('escala')}
              className="text-xs font-semibold text-[var(--ui-accent)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver escala completa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {todayEvents.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-center text-xs text-zinc-400">
                Nenhuma gravação agendada para hoje.
              </div>
            ) : (
              todayEvents.map((ev) => {
                const client = clients.find((c) => c.id === ev.client_id);
                const assignedEmps = employees.filter((emp) =>
                  (ev.assigned_employee_ids || []).includes(emp.id)
                );

                return (
                  <div
                    key={ev.id}
                    className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] hover:border-[var(--ui-accent)]/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex flex-col items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-[var(--ui-accent)]" />
                        <span className="text-[10px] font-bold text-foreground font-mono mt-0.5">
                          {ev.hora_inicio}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-sm text-foreground truncate">
                          {client?.nome || 'Restaurante'}
                        </div>
                        <div className="text-xs text-zinc-400 truncate mt-0.5">
                          {client?.endereco || 'São Paulo - SP'}
                        </div>

                        {/* Dupla escalada */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {assignedEmps.map((emp) => (
                            <EmployeeBadge key={emp.id} employee={emp} size="sm" showRole />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {client?.drive_folder_url && (
                        <a
                          href={client.drive_folder_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-[var(--ui-raised)] hover:bg-[var(--ui-hover)] text-zinc-400 hover:text-foreground transition-colors cursor-pointer"
                          title="Abrir pasta do Google Drive"
                        >
                          <FolderOpen className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => openPontoModal(client?.id, ev.id, 'entrada')}
                        className="px-3 py-1.5 rounded-xl brand-solid bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-foreground text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Bater Ponto</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna Direita (5 cols): Fila de Aprovação de Arquivos & Vídeos */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground font-heading flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>Aprovações Pendentes ({pendingDeliverables.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => setCurrentView('arquivos')}
              className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {pendingDeliverables.slice(0, 4).map((deliv) => {
              const client = clients.find((c) => c.id === deliv.client_id);
              return (
                <div
                  key={deliv.id}
                  className="p-3.5 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-[var(--ui-accent)] uppercase tracking-wider block">
                        {client?.nome}
                      </span>
                      <h4 className="text-xs font-bold text-foreground truncate mt-0.5">
                        {deliv.titulo}
                      </h4>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                      Aguardando Aprovação
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[var(--ui-border)] text-xs">
                    <span className="text-[11px] text-zinc-400">
                      Versão: <strong className="text-foreground">v{deliv.versao}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      {deliv.drive_url && (
                        <a
                          href={deliv.drive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#38bdf8] hover:underline flex items-center gap-1"
                        >
                          <span>Ver no Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => updateDeliverableStatus(deliv.id, 'aprovado')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-foreground text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Aprovar ✓
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
