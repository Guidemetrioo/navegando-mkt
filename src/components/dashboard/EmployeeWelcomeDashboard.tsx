'use client';

import React, { useState, useEffect } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { EmployeeBadge } from '../agenda/EmployeeBadge';
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
  MapPin,
  Sparkles,
  Navigation,
  ListTodo,
  TrendingUp,
  FileText,
  ShieldCheck,
  CheckSquare,
  Square,
  Building,
  UserCheck,
} from 'lucide-react';

export function EmployeeWelcomeDashboard() {
  const {
    employees,
    clients,
    events,
    deliverables,
    pontos,
    loggedEmployeeId,
    setCurrentView,
    openPontoModal,
    openDeliverableModal,
    openEditDeliverableModal,
    lastLoginPonto,
    toast,
  } = useAgenda();

  const currentMember = employees.find((e) => e.id === loggedEmployeeId) || employees[0];

  // Data de referência da demonstração/hoje
  const todayIso = '2026-10-14';

  // 1. Gravações do funcionário logado para hoje
  const myTodayEvents = events.filter((ev) => {
    const isToday = ev.data === todayIso;
    const isAssigned = (ev.assigned_employee_ids || []).includes(currentMember.id);
    return isToday && isAssigned;
  });

  // 2. Entregáveis sob responsabilidade deste funcionário
  const myDeliverables = deliverables.filter((d) => {
    return d.filmmaker_id === currentMember.id || d.criadora_id === currentMember.id;
  });

  const myPendingAdjustments = myDeliverables.filter((d) => d.status === 'ajustes_solicitados');
  const myInEditing = myDeliverables.filter((d) => d.status === 'em_edicao');
  const myAwaitingApproval = myDeliverables.filter((d) => d.status === 'aguardando_aprovacao');
  const myApproved = myDeliverables.filter((d) => d.status === 'aprovado' || d.status === 'publicado');

  // 3. Ponto de hoje registrado
  const myTodayPonto =
    lastLoginPonto ||
    pontos.find(
      (p) => p.employee_id === currentMember.id && p.data_hora.startsWith(todayIso)
    );

  // 4. Checklist operacional diário
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    baterias: true,
    sd_cards: true,
    roteiro: false,
    backup_raw: false,
    stories: false,
  });

  const toggleChecklistItem = (key: string) => {
    setChecklist((prev) => {
      const next = !prev[key];
      toast(next ? 'Item marcado como concluído!' : 'Item desmarcado.', 'info');
      return { ...prev, [key]: next };
    });
  };

  // Saudação de acordo com a hora
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. HERO DE BOAS-VINDAS PERSONALIZADO */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#1b1d24] via-[#16171b] to-[#221614] border border-[#2b2d35] shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FF5A3C]/15 text-[#FF5A3C] border border-[#FF5A3C]/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Painel Pessoal de Prioridades
              </span>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Ponto de Entrada Confirmado
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-heading tracking-tight">
              {getGreeting()}, {currentMember.nome}!
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Aqui está o seu roteiro de gravações, tarefas de campo e arquivos sob sua responsabilidade para o dia de hoje.
            </p>
          </div>

          {/* Card do Ponto Registrado no Login */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#141519]/90 border border-[#2b2d35] backdrop-blur-md w-full sm:w-auto">
            {myTodayPonto?.foto_url ? (
              <img
                src={myTodayPonto.foto_url}
                alt="Foto do ponto"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/40 shrink-0 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Camera className="w-6 h-6" />
              </div>
            )}

            <div className="min-w-0 flex-1 flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                Ponto de Entrada Ativo
              </span>
              <span className="text-xs font-bold text-white">
                {myTodayPonto
                  ? new Date(myTodayPonto.data_hora).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '08:30'} • GPS Validado
              </span>
              <span className="text-[10px] text-zinc-400 truncate max-w-[200px]">
                {myTodayPonto?.endereco || 'São Paulo - SP'}
              </span>

              <div className="mt-1 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openPontoModal(undefined, undefined, 'saida')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#FF5A3C]/15 hover:bg-[#FF5A3C] active:scale-95 text-[#FF5A3C] hover:text-white font-bold text-[10px] transition-colors cursor-pointer"
                >
                  Registrar Saída / Ponto
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ALERTA DE AJUSTES SOLICITADOS (Se houver vídeos que o cliente pediu alteração) */}
      {myPendingAdjustments.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-200 font-heading">
                Você tem {myPendingAdjustments.length} vídeo(s) com ajustes solicitados pelo cliente!
              </h3>
              <p className="text-xs text-rose-300/80 mt-0.5">
                Revise as notas de alteração e suba a nova versão (v{myPendingAdjustments[0].versao + 1}) para aprovação.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openEditDeliverableModal(myPendingAdjustments[0])}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto text-center"
          >
            Ver Notas de Ajuste →
          </button>
        </div>
      )}

      {/* 3. GRID PRINCIPAL DE PRIORIDADES: GRAVAÇÕES DE HOJE & ENTREGÁVEIS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda (7 cols): Minhas Gravações & Escala de Hoje */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white font-heading flex items-center gap-2">
              <Video className="w-4 h-4 text-[#FF5A3C]" />
              <span>Minhas Gravações de Hoje ({myTodayEvents.length})</span>
            </h2>
            <button
              type="button"
              onClick={() => setCurrentView('minha-agenda')}
              className="text-xs font-semibold text-[#FF5A3C] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Escala</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {myTodayEvents.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#16171b] border border-[#26282f] text-center flex flex-col items-center gap-2">
                <UserCheck className="w-10 h-10 text-emerald-400" />
                <h4 className="text-sm font-bold text-zinc-200">
                  Sem gravações de campo escaladas para você hoje!
                </h4>
                <p className="text-xs text-zinc-400 max-w-sm">
                  Aproveite o dia para finalizar edições pendentes, organizar pastas de brutos RAW ou alinhar briefings da semana.
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentView('escala')}
                  className="mt-2 text-xs font-semibold text-[#FF5A3C] hover:underline cursor-pointer"
                >
                  Consultar escala geral da agência →
                </button>
              </div>
            ) : (
              myTodayEvents.map((ev) => {
                const client = clients.find((c) => c.id === ev.client_id);
                const assignedEmps = employees.filter((emp) =>
                  (ev.assigned_employee_ids || []).includes(emp.id)
                );
                const partner = assignedEmps.find((e) => e.id !== currentMember.id);
                const googleMapsUrl = client?.endereco
                  ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(client.endereco)}`
                  : null;

                return (
                  <div
                    key={ev.id}
                    className="p-4 sm:p-5 rounded-3xl bg-[#16171b] border border-[#26282f] hover:border-[#FF5A3C]/40 transition-all flex flex-col justify-between gap-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-[#FF5A3C]/10 text-[#FF5A3C] border border-[#FF5A3C]/20 flex flex-col items-center justify-center shrink-0">
                          <Clock className="w-5 h-5" />
                          <span className="text-[10px] font-mono font-bold mt-0.5">
                            {ev.hora_inicio}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5A3C] block truncate">
                            Gravação Gastronômica
                          </span>
                          <h3 className="text-sm sm:text-base font-bold text-white truncate font-heading">
                            {client?.nome}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                            <span className="truncate">{client?.endereco || 'São Paulo - SP'}</span>
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono font-bold bg-[#1f2026] text-zinc-300 px-2 py-1 rounded-xl border border-[#2b2d35] whitespace-nowrap shrink-0">
                        {ev.hora_inicio} - {ev.hora_fim}
                      </span>
                    </div>

                    {/* Sua Dupla */}
                    <div className="p-3 rounded-2xl bg-[#1c1d22] border border-[#26282f] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 font-medium">Sua Dupla:</span>
                        {partner ? (
                          <div className="flex items-center gap-1.5">
                            <EmployeeBadge employee={partner} size="sm" showRole />
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-500 italic">Gravação Solo</span>
                        )}
                      </div>

                      {client?.drive_folder_url && (
                        <a
                          href={client.drive_folder_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-[#38bdf8] hover:underline flex items-center gap-1"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>Pasta no Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Ações Rápidas de Campo (Thumb-friendly no mobile) */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-[#26282f]/60">
                      {googleMapsUrl && (
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2.5 px-3 rounded-xl bg-[#1f2026] hover:bg-[#282a32] active:scale-98 text-[#38bdf8] text-xs font-semibold border border-[#2b2d35] transition-all flex items-center justify-center gap-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Como Chegar (Maps / Waze)</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => openPontoModal(client?.id, ev.id, 'entrada')}
                        className="py-2.5 px-4 rounded-xl bg-[#FF5A3C] hover:bg-[#e04a2f] active:scale-98 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Bater Ponto no Restaurante</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna Direita (5 cols): Meus Arquivos & Entregáveis Pendentes */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white font-heading flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>Meus Vídeos em Produção ({myDeliverables.length})</span>
            </h2>
            <button
              type="button"
              onClick={() => setCurrentView('arquivos')}
              className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Central DAM</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {myDeliverables.length === 0 ? (
              <div className="p-6 rounded-3xl bg-[#16171b] border border-[#26282f] text-center text-xs text-zinc-400">
                Você não possui vídeos atribuídos no momento.
              </div>
            ) : (
              myDeliverables.slice(0, 4).map((deliv) => {
                const client = clients.find((c) => c.id === deliv.client_id);
                const isUrgent = deliv.status === 'ajustes_solicitados';

                return (
                  <div
                    key={deliv.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 ${
                      isUrgent
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : 'bg-[#16171b] border-[#26282f]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-[#FF5A3C] uppercase truncate block">
                          {client?.nome}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate mt-0.5">
                          {deliv.titulo}
                        </h4>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                          isUrgent
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {deliv.status.replace('_', ' ').toUpperCase()} • v{deliv.versao}
                      </span>
                    </div>

                    {deliv.observacoes_ajuste && (
                      <div className="p-2 rounded-xl bg-black/40 text-[10px] text-rose-300 border border-rose-500/20">
                        <strong>Nota do Cliente:</strong> {deliv.observacoes_ajuste}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-[#26282f]/60 text-xs">
                      {deliv.drive_url ? (
                        <a
                          href={deliv.drive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#38bdf8] hover:underline flex items-center gap-1"
                        >
                          <span>Abrir no Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-zinc-500 italic">Sem link do vídeo</span>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditDeliverableModal(deliv)}
                        className="px-2.5 py-1 rounded-lg bg-[#1f2026] hover:bg-[#282a32] text-zinc-300 hover:text-white font-bold text-[10px] border border-[#2b2d35] cursor-pointer"
                      >
                        Atualizar Versão
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            <button
              type="button"
              onClick={() => openDeliverableModal()}
              className="py-2.5 px-4 rounded-2xl bg-[#1c1d22] hover:bg-[#26282f] text-zinc-300 hover:text-white text-xs font-bold border border-[#2b2d35] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#FF5A3C]" />
              <span>Cadastrar Novo Arquivo de Vídeo</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. CHECKLIST DIÁRIO DE CAMPO & ATALHOS RÁPIDOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Checklist Diário */}
        <div className="p-6 rounded-3xl bg-[#16171b] border border-[#26282f] flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ListTodo className="w-4 h-4 text-[#FF5A3C]" />
              <h3 className="text-base font-bold text-white font-heading">
                Checklist Operacional de Campo
              </h3>
            </div>
            <p className="text-xs text-zinc-400">
              Procedimentos essenciais para garantir que nenhuma produção sofra imprevistos.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {[
              { id: 'baterias', text: 'Baterias das câmeras e microfones 100% carregadas' },
              { id: 'sd_cards', text: 'Cartões SD limpos, testados e com espaço de sobra' },
              { id: 'roteiro', text: 'Alinhar pratos e roteiro do Reels com o gerente/chef' },
              { id: 'backup_raw', text: 'Subir os vídeos brutos RAW na pasta do Drive do cliente' },
              { id: 'stories', text: 'Gravar Stories de bastidores espontâneos da visita' },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => toggleChecklistItem(item.id)}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                  checklist[item.id]
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-[#1c1d22] border-[#2b2d35] text-zinc-300 hover:text-white'
                }`}
              >
                {checklist[item.id] ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-zinc-500 shrink-0" />
                )}
                <span className={`text-xs ${checklist[item.id] ? 'line-through opacity-80' : ''}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Atalhos Rápidos para Outras Páginas da Agência */}
        <div className="p-6 rounded-3xl bg-[#16171b] border border-[#26282f] flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white font-heading mb-1">
              Outras Páginas & Módulos da Agência
            </h3>
            <p className="text-xs text-zinc-400">
              Acesse as ferramentas operacionais completas do sistema:
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setCurrentView('mes')}
              className="p-3 rounded-2xl bg-[#1c1d22] hover:bg-[#26282f] border border-[#2b2d35] text-left transition-all cursor-pointer group"
            >
              <Calendar className="w-4 h-4 text-[#FF5A3C] mb-1.5" />
              <div className="font-bold text-xs text-white group-hover:text-[#FF5A3C] transition-colors">
                Agenda Geral
              </div>
              <div className="text-[10px] text-zinc-400">Mês & Semana</div>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('arquivos')}
              className="p-3 rounded-2xl bg-[#1c1d22] hover:bg-[#26282f] border border-[#2b2d35] text-left transition-all cursor-pointer group"
            >
              <FolderOpen className="w-4 h-4 text-amber-400 mb-1.5" />
              <div className="font-bold text-xs text-white group-hover:text-amber-400 transition-colors">
                Central DAM
              </div>
              <div className="text-[10px] text-zinc-400">Funil Kanban de Vídeos</div>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('clientes')}
              className="p-3 rounded-2xl bg-[#1c1d22] hover:bg-[#26282f] border border-[#2b2d35] text-left transition-all cursor-pointer group"
            >
              <Building className="w-4 h-4 text-[#38bdf8] mb-1.5" />
              <div className="font-bold text-xs text-white group-hover:text-[#38bdf8] transition-colors">
                Restaurantes
              </div>
              <div className="text-[10px] text-zinc-400">Pastas Drive & WhatsApp</div>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('ponto')}
              className="p-3 rounded-2xl bg-[#1c1d22] hover:bg-[#26282f] border border-[#2b2d35] text-left transition-all cursor-pointer group"
            >
              <Camera className="w-4 h-4 text-emerald-400 mb-1.5" />
              <div className="font-bold text-xs text-white group-hover:text-emerald-400 transition-colors">
                Ponto & GPS
              </div>
              <div className="text-[10px] text-zinc-400">Radar & Histórico</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
