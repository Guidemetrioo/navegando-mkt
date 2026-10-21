'use client';

import React, { useState } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { EmployeeBadge } from '../agenda/EmployeeBadge';
import { USERS_DATABASE, CLT_NORMS_2026, canUserAccessView } from '@/lib/auth-users';
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
  Users,
  Award,
  BarChart3,
  Flame,
  ChefHat,
  Coffee,
  Check,
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
    openEditEventModal,
    lastLoginPonto,
    toast,
  } = useAgenda();

  const currentMember = employees.find((e) => e.id === loggedEmployeeId) || employees[0];
  const userAcc = USERS_DATABASE.find((u) => u.employeeId === currentMember.id);

  // Perfil e Hierarquia
  const role = userAcc?.funcao || currentMember.funcao || 'interno';
  const regime = userAcc?.regime || currentMember.regime || 'interno';
  const isDono = role === 'dono';
  const isGerente = role === 'gerente';
  const isFilmmaker = role === 'filmmaker';
  const isModelo = role === 'modelo' || userAcc?.cargo === 'Modelo Gastronômica';
  const isInterno = regime === 'interno' && !isDono && !isGerente;

  // Data de referência de hoje
  const todayIso = '2026-10-14';

  // 1. Gravações do funcionário logado para hoje
  const myTodayEvents = events.filter((ev) => {
    const isToday = ev.data === todayIso;
    const isAssigned = (ev.assigned_employee_ids || []).includes(currentMember.id);
    return isToday && isAssigned;
  });

  // 2. Todos os eventos de hoje (para gerência e donos)
  const allTodayEvents = events.filter((ev) => ev.data === todayIso);

  // 3. Entregáveis sob responsabilidade deste funcionário
  const myDeliverables = deliverables.filter((d) => {
    return d.filmmaker_id === currentMember.id || d.criadora_id === currentMember.id;
  });

  const myPendingAdjustments = myDeliverables.filter((d) => d.status === 'ajustes_solicitados');

  // 4. Pontos de hoje registrados pelo funcionário
  const myTodayPontos = pontos.filter(
    (p) => p.employee_id === currentMember.id && p.data_hora.startsWith(todayIso)
  );

  const pontoEntrada = myTodayPontos.find((p) => p.tipo === 'entrada') || lastLoginPonto;
  const pontoAlmoco = myTodayPontos.find((p) => p.tipo === 'almoco');
  const pontoSaida = myTodayPontos.find((p) => p.tipo === 'saida');

  // 5. Checklist Dinâmico por Papel
  const initialChecklist: Record<string, boolean> = isModelo
    ? {
        look_alinhado: true,
        chegada_antecipada: true,
        provar_pratos: false,
        stories_bastidores: false,
        ponto_saida: false,
      }
    : isFilmmaker
    ? {
        baterias_100: true,
        sd_cards: true,
        relatorio_pratos: false,
        upload_raw: false,
        ponto_saida: false,
      }
    : {
        revisao_demandas: true,
        execucao_prioridades: false,
        registro_almoco: Boolean(pontoAlmoco),
        alinhamento_time: false,
        registro_saida: Boolean(pontoSaida),
      };

  const [checklist, setChecklist] = useState<Record<string, boolean>>(initialChecklist);

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

  // Tarefas prioritárias específicas por colaborador interno
  const getInternalTasks = (empId: string) => {
    switch (empId) {
      case 'usr-carol':
        return [
          { title: 'Edição de 4 Reels de Destaque', desc: 'Cantina Bella Massa e Sushi Hoshi (cortes rápidos, sound design e ritmo)', priority: 'Alta' },
          { title: 'Sincronização de Áudio & ASMR', desc: 'Equalizar som da brasa e maçarico nos vídeos de gastronomia', priority: 'Média' },
          { title: 'Subir v1 no Funil DAM', desc: 'Encaminhar entregáveis para aprovação do atendimento e clientes', priority: 'Alta' },
        ];
      case 'usr-lucas':
        return [
          { title: 'Color Grading & Pós-Produção', desc: 'Colorimetria quente para Churrascaria Fogo Nobre e Paris 6', priority: 'Alta' },
          { title: 'Montagem de Cortes em 9:16', desc: 'Enquadramentos verticais dinâmicos para reels gastronômicos', priority: 'Alta' },
          { title: 'Exportação em 4K no Drive', desc: 'Garantir versões finais com bitrate otimizado para o Instagram', priority: 'Média' },
        ];
      case 'usr-bruna':
        return [
          { title: 'Roteiros & Ganchos (Hooks)', desc: 'Criar 6 ganchos de alta retenção para os 3 primeiros segundos dos Reels', priority: 'Alta' },
          { title: 'Redação de Copys & Legendas', desc: 'Escrever legendas com CTAs de chamada para reserva e WhatsApp', priority: 'Alta' },
          { title: 'Planejamento Editorial', desc: 'Distribuir publicações da semana no calendário de cada cliente', priority: 'Média' },
        ];
      case 'usr-evelin':
        return [
          { title: 'Design de 4 Capas de Reels', desc: 'Capas minimalistas elegantes para Bistrô Paris 6 e Café Grão Real', priority: 'Alta' },
          { title: 'Carrossel Gastronômico', desc: 'Diagramação de carrossel de sobremesas grand gateau', priority: 'Média' },
          { title: 'Atualização do Manual de Marca', desc: 'Ajustar padrões tipográficos e guias visuais dos novos clientes', priority: 'Baixa' },
        ];
      case 'usr-juliaint':
        return [
          { title: 'Otimização de Campanhas Meta Ads', desc: 'Revisar campanhas de tráfego local no raio de 5km dos restaurantes', priority: 'Alta' },
          { title: 'Impulsionamento de Reels Vencedores', desc: 'Alocar verba nos 3 reels com maior taxa de retenção orgânica', priority: 'Alta' },
          { title: 'Relatório Semanal de Conversão', desc: 'Calcular custo por mensagem no direct e cliques no cardápio digital', priority: 'Média' },
        ];
      case 'usr-augusto':
        return [
          { title: 'Follow-up com Clientes Parceiros', desc: 'Coletar aprovação com Gianluca (Bella Massa) e Kenji (Sushi Hoshi)', priority: 'Alta' },
          { title: 'Agendamento das Gravações', desc: 'Confirmar escala de videomakers e cardápios para a próxima semana', priority: 'Alta' },
          { title: 'Suporte no WhatsApp VIP', desc: 'Responder dúvidas e solicitações de alterações dos donos de restaurantes', priority: 'Média' },
        ];
      case 'usr-guilherme':
        return [
          { title: 'Supervisão Geral de Marketing', desc: 'Monitorar entregas do time interno e alinhamento com a estratégia', priority: 'Alta' },
          { title: 'Análise de Performance de Retenção', desc: 'Garantir que a meta de 150k de alcance por cliente seja atingida', priority: 'Média' },
          { title: 'Alinhamento com Diretoria', desc: 'Reunião de alinhamento com Felipe Assis e Gabriela Lorente', priority: 'Alta' },
        ];
      default:
        return [
          { title: 'Supervisão de Prazos e Entregas', desc: 'Acompanhar o fluxo de trabalho do estúdio e pós-produção', priority: 'Alta' },
          { title: 'Conferência de Ponto CLT da Equipe', desc: 'Validar as 3 batidas diárias dos colaboradores internos', priority: 'Alta' },
          { title: 'Suporte Operacional', desc: 'Garantir recursos e equipamentos para todas as gravações', priority: 'Média' },
        ];
    }
  };

  const internalTasks = getInternalTasks(currentMember.id);

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. HERO DE BOAS-VINDAS PERSONALIZADO */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#1b1d24] via-[#16171b] to-[#221614] border border-[#2b2d35] shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FF5A3C]/15 text-[#FF5A3C] border border-[#FF5A3C]/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Painel Pessoal de Prioridades
              </span>

              {isInterno ? (
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Regime Interno CLT (Seg a Sex • 44h)
                </span>
              ) : isModelo ? (
                <span className="text-[11px] font-semibold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20 flex items-center gap-1">
                  <ChefHat className="w-3 h-3" />
                  Modelo Gastronômica (Externo • Campo)
                </span>
              ) : isFilmmaker ? (
                <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20 flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  Filmmaker de Campo (Externo)
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Gestão & Diretoria (Acesso Total)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-heading tracking-tight">
              {getGreeting()}, {currentMember.nome}!
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {isModelo
                ? 'Aqui está a sua agenda de gravações nos restaurantes hoje, orientações de cardápio e ponto de presença.'
                : isFilmmaker
                ? 'Confira seus restaurantes escalados, produza seus takes, registre o ponto com GPS e preencha os relatórios das gravações.'
                : isInterno
                ? 'Seu expediente de hoje com tarefas prioritárias e controle de jornada em 3 batidas conforme a CLT 2026/2027.'
                : 'Painel executivo com visão geral da agência: ponto da equipe, entregáveis, gravações e métricas.'}
            </p>
          </div>

          {/* Card do Ponto Registrado no Login */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#141519]/90 border border-[#2b2d35] backdrop-blur-md w-full sm:w-auto">
            {pontoEntrada?.foto_url ? (
              <img
                src={pontoEntrada.foto_url}
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
                {pontoEntrada ? 'Ponto de Entrada Confirmado' : 'Aguardando Entrada'}
              </span>
              <span className="text-xs font-bold text-white">
                {pontoEntrada
                  ? new Date(pontoEntrada.data_hora).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '08:30'} • {isInterno ? 'Sede Agência' : 'GPS Validado'}
              </span>
              <span className="text-[10px] text-zinc-400 truncate max-w-[200px]">
                {pontoEntrada?.endereco || (isInterno ? 'Av. Paulista, 1842 - São Paulo' : 'No Restaurante')}
              </span>

              {/* Botões rápidos de próximo ponto */}
              <div className="mt-1 flex items-center gap-1.5">
                {isInterno ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openPontoModal(undefined, undefined, 'almoco')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        pontoAlmoco
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-white'
                      }`}
                    >
                      {pontoAlmoco ? 'Almoço ✅' : '🟡 Bater Almoço'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openPontoModal(undefined, undefined, 'saida')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        pontoSaida
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-[#FF5A3C]/15 hover:bg-[#FF5A3C] text-[#FF5A3C] hover:text-white'
                      }`}
                    >
                      {pontoSaida ? 'Saída ✅' : '🔴 Bater Saída'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => openPontoModal(undefined, undefined, 'saida')}
                    className="px-2.5 py-1.5 rounded-lg bg-[#FF5A3C]/15 hover:bg-[#FF5A3C] active:scale-95 text-[#FF5A3C] hover:text-white font-bold text-[10px] transition-colors cursor-pointer"
                  >
                    Registrar Saída de Campo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CARD EXCLUSIVO DE CONFORMIDADE CLT 2026/2027 (Para equipe interna) */}
      {isInterno && (
        <div className="p-5 rounded-3xl bg-[#16171b] border border-emerald-500/25 shadow-lg flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#26282f] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-heading">
                  Controle de Ponto CLT 2026/2027 — Equipe Interna
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Segunda a Sexta • 8h48/dia (44h semanais sem expediente aos sábados) • 3 batidas diárias obrigatórias
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                Jornada Prevista: 08:30 às 18:18
              </span>
            </div>
          </div>

          {/* As 3 Batidas Obrigatórias */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1ª Batida: Entrada */}
            <div className="p-3 rounded-2xl bg-[#1c1d22] border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  1ª
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Entrada da Manhã</span>
                  <span className="text-xs font-bold text-white">
                    {pontoEntrada
                      ? new Date(pontoEntrada.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                      : '08:30'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Registrado ✅
              </span>
            </div>

            {/* 2ª Batida: Almoço */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between ${
              pontoAlmoco ? 'bg-[#1c1d22] border-amber-500/30' : 'bg-[#1a1b20] border-[#2b2d35]'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  2ª
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Intervalo de Almoço</span>
                  <span className="text-xs font-bold text-white">
                    {pontoAlmoco
                      ? new Date(pontoAlmoco.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                      : '12:30 (Mín 1h)'}
                  </span>
                </div>
              </div>
              {pontoAlmoco ? (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Registrado ✅
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => openPontoModal(undefined, undefined, 'almoco')}
                  className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white font-bold text-[10px] transition-colors cursor-pointer"
                >
                  Bater Almoço
                </button>
              )}
            </div>

            {/* 3ª Batida: Saída */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between ${
              pontoSaida ? 'bg-[#1c1d22] border-rose-500/30' : 'bg-[#1a1b20] border-[#2b2d35]'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                  3ª
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Saída do Expediente</span>
                  <span className="text-xs font-bold text-white">
                    {pontoSaida
                      ? new Date(pontoSaida.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                      : '18:18 (Previsto)'}
                  </span>
                </div>
              </div>
              {pontoSaida ? (
                <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                  Registrado ✅
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => openPontoModal(undefined, undefined, 'saida')}
                  className="px-2.5 py-1 rounded-xl bg-[#FF5A3C]/20 hover:bg-[#FF5A3C] text-[#FF5A3C] hover:text-white font-bold text-[10px] transition-colors cursor-pointer"
                >
                  Bater Saída
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. ALERTA DE AJUSTES SOLICITADOS (Se houver vídeos que o cliente pediu alteração e usuário tem acesso) */}
      {!isModelo && myPendingAdjustments.length > 0 && (
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

      {/* 4. VISÃO EXECUTIVA DE GESTÃO (Apenas Donos e Gerentes) */}
      {(isDono || isGerente) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-3xl bg-[#16171b] border border-[#26282f] flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#38bdf8]" />
              Equipe no Ponto Hoje
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white font-heading">
                {pontos.filter((p) => p.data_hora.startsWith(todayIso)).length}
              </span>
              <span className="text-xs text-emerald-400 font-semibold">100% no horário</span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-1">CLT Interno + Externo Campo</span>
          </div>

          <div className="p-4 rounded-3xl bg-[#16171b] border border-[#26282f] flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-[#FF5A3C]" />
              Gravações do Dia
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white font-heading">
                {allTodayEvents.length}
              </span>
              <span className="text-xs text-zinc-400">Restaurantes agendados</span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-1">Filmmakers e Modelos em campo</span>
          </div>

          <div className="p-4 rounded-3xl bg-[#16171b] border border-[#26282f] flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              Aprovações no DAM
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white font-heading">
                {deliverables.filter((d) => d.status === 'aguardando_aprovacao').length}
              </span>
              <span className="text-xs text-amber-400 font-semibold">Reels prontos</span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-1">Aguardando validação</span>
          </div>

          <div className="p-4 rounded-3xl bg-[#16171b] border border-[#26282f] flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Alcance dos Clientes
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white font-heading">245k</span>
              <span className="text-xs text-emerald-400 font-semibold">+18.4%</span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-1">Visualizações no Instagram</span>
          </div>
        </div>
      )}

      {/* 5. GRID PRINCIPAL DE PRIORIDADES: GRAVAÇÕES / OBRIGAÇÕES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda (7 cols): Gravações de Hoje ou Obrigações Internas */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {isInterno ? (
            /* SE FOR EQUIPE INTERNA: QUADRO DE PRIORIDADES OPERACIONAIS */
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white font-heading flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-[#FF5A3C]" />
                  <span>Suas Obrigações & Entregas de Hoje ({internalTasks.length})</span>
                </h2>
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {userAcc?.cargo || 'Operação Interna'}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {internalTasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#16171b] border border-[#26282f] hover:border-[#FF5A3C]/30 transition-all flex items-start justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#1f2026] text-white flex items-center justify-center font-bold text-xs shrink-0 border border-[#2b2d35]">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-white">{task.title}</h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            task.priority === 'Alta'
                              ? 'bg-rose-500/20 text-rose-300'
                              : task.priority === 'Média'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{task.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* SE FOR EXTERNO (MODELO OU FILMMAKER OU GESTÃO): GRAVAÇÕES DE HOJE */
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white font-heading flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#FF5A3C]" />
                  <span>
                    {isDono || isGerente
                      ? `Gravações de Hoje na Agência (${allTodayEvents.length})`
                      : `Minhas Gravações de Hoje (${myTodayEvents.length})`}
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => setCurrentView(isModelo ? 'minha-agenda' : 'mes')}
                  className="text-xs font-semibold text-[#FF5A3C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver Agenda Completa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {(isDono || isGerente ? allTodayEvents : myTodayEvents).length === 0 ? (
                  <div className="p-8 rounded-3xl bg-[#16171b] border border-[#26282f] text-center flex flex-col items-center gap-2">
                    <UserCheck className="w-10 h-10 text-emerald-400" />
                    <h4 className="text-sm font-bold text-zinc-200">
                      Sem gravações de campo escaladas para hoje!
                    </h4>
                    <p className="text-xs text-zinc-400 max-w-sm">
                      {isModelo
                        ? 'Você não possui produções gastronômicas agendadas para hoje. Consulte sua agenda dos próximos dias.'
                        : 'Aproveite para organizar equipamentos, revisar os roteiros da semana ou subir brutos pendentes.'}
                    </p>
                  </div>
                ) : (
                  (isDono || isGerente ? allTodayEvents : myTodayEvents).map((ev) => {
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

                        {/* Dupla / Membros escalados */}
                        <div className="p-3 rounded-2xl bg-[#1c1d22] border border-[#26282f] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400 font-medium">Equipe no Local:</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {assignedEmps.map((emp) => (
                                <EmployeeBadge key={emp.id} employee={emp} size="sm" showRole />
                              ))}
                            </div>
                          </div>

                          {client?.drive_folder_url && !isModelo && (
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

                        {/* Status do Relatório do Filmmaker (se preenchido) */}
                        {ev.relatorio_filmmaker && (
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                            <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Relatório OK ({ev.relatorio_filmmaker.takes_gravados_qtd || 0} takes • {ev.relatorio_filmmaker.pratos_gravados?.length || 0} pratos)
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              Nota da sessão: ⭐ {ev.relatorio_filmmaker.avaliacao_sessao || 5}/5
                            </span>
                          </div>
                        )}

                        {/* Ações Rápidas de Campo */}
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

                          {/* Se for filmmaker ou gestor: botão direto para o relatório */}
                          {(isFilmmaker || isDono || isGerente) && (
                            <button
                              type="button"
                              onClick={() => openEditEventModal(ev)}
                              className="py-2.5 px-3 rounded-xl bg-[#1f2026] hover:bg-[#282a32] text-amber-300 hover:text-amber-200 text-xs font-bold border border-[#2b2d35] transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Relatório 🎥</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Coluna Direita (5 cols): Entregáveis DAM (para quem tem acesso) ou Checklist */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {!isModelo ? (
            /* CENTRAL DE VÍDEOS EM PRODUÇÃO (Filmmakers, Internos e Gestão) */
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white font-heading flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  <span>Vídeos em Produção ({myDeliverables.length})</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setCurrentView('arquivos')}
                  className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Central DAM</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {myDeliverables.length === 0 ? (
                  <div className="p-6 rounded-3xl bg-[#16171b] border border-[#26282f] text-center text-xs text-zinc-400">
                    Você não possui vídeos atribuídos no momento.
                  </div>
                ) : (
                  myDeliverables.slice(0, 3).map((deliv) => {
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
                              <span>Drive</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-zinc-500 italic">Sem link</span>
                          )}

                          <button
                            type="button"
                            onClick={() => openEditDeliverableModal(deliv)}
                            className="px-2.5 py-1 rounded-lg bg-[#1f2026] hover:bg-[#282a32] text-zinc-300 hover:text-white font-bold text-[10px] border border-[#2b2d35] cursor-pointer"
                          >
                            Atualizar
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
          ) : (
            /* CHECKLIST EXCLUSIVO DA MODELO */
            <div className="p-6 rounded-3xl bg-[#16171b] border border-[#26282f] flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ChefHat className="w-4 h-4 text-pink-400" />
                  <h3 className="text-base font-bold text-white font-heading">
                    Checklist da Modelo Gastronômica
                  </h3>
                </div>
                <p className="text-xs text-zinc-400">
                  Itens essenciais para uma apresentação impecável na gravação.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {[
                  { id: 'look_alinhado', text: 'Look e maquiagem alinhados ao briefing visual da marca' },
                  { id: 'chegada_antecipada', text: 'Chegada 15 minutos antes do início para alinhamento com chef' },
                  { id: 'provar_pratos', text: 'Provar pratos principais com reações dinâmicas na câmera' },
                  { id: 'stories_bastidores', text: 'Gravar Stories de bastidores marcando restaurante e @navegando.mkt' },
                  { id: 'ponto_saida', text: 'Registrar ponto de saída no restaurante com selfie' },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklistItem(item.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      checklist[item.id]
                        ? 'bg-pink-500/10 border-pink-500/30 text-pink-300'
                        : 'bg-[#1c1d22] border-[#2b2d35] text-zinc-300 hover:text-white'
                    }`}
                  >
                    {checklist[item.id] ? (
                      <CheckSquare className="w-4 h-4 text-pink-400 shrink-0" />
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
          )}

          {/* CHECKLIST GERAL OPERACIONAL (Quando não for modelo) */}
          {!isModelo && (
            <div className="p-6 rounded-3xl bg-[#16171b] border border-[#26282f] flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ListTodo className="w-4 h-4 text-[#FF5A3C]" />
                  <h3 className="text-base font-bold text-white font-heading">
                    Checklist Diário {isInterno ? 'CLT & Operação' : 'de Campo'}
                  </h3>
                </div>
                <p className="text-xs text-zinc-400">
                  {isInterno
                    ? 'Acompanhamento da jornada de trabalho e entregas internas.'
                    : 'Procedimentos técnicos para que nenhuma gravação tenha falhas.'}
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {(isFilmmaker
                  ? [
                      { id: 'baterias_100', text: 'Baterias das câmeras e microfones 100% carregadas' },
                      { id: 'sd_cards', text: 'Cartões SD limpos, testados e com espaço livre' },
                      { id: 'relatorio_pratos', text: 'Preencher relatório de gravação com pratos e takes captados' },
                      { id: 'upload_raw', text: 'Subir os vídeos brutos RAW na pasta do Drive do cliente' },
                      { id: 'ponto_saida', text: 'Registrar ponto de saída no restaurante com selfie' },
                    ]
                  : [
                      { id: 'revisao_demandas', text: 'Revisar fila de prioridades do dia no CRM' },
                      { id: 'registro_almoco', text: 'Registrar a 2ª batida de ponto (Intervalo de Almoço CLT)' },
                      { id: 'execucao_prioridades', text: 'Finalizar e enviar entregas do cronograma semanal' },
                      { id: 'alinhamento_time', text: 'Alinhar dúvidas com a gerência pelo canal interno' },
                      { id: 'registro_saida', text: 'Registrar a 3ª batida de ponto (Saída do Expediente CLT)' },
                    ]
                ).map((item) => (
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
          )}
        </div>
      </div>

      {/* 6. ATALHOS RÁPIDOS ADAPTADOS À HIERARQUIA */}
      <div className="p-6 rounded-3xl bg-[#16171b] border border-[#26282f] flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-white font-heading mb-1">
            Módulos Disponíveis para {currentMember.nome}
          </h3>
          <p className="text-xs text-zinc-400">
            {isModelo
              ? 'Conforme a política de acesso da agência, você possui acesso exclusivo à Agenda de Gravações e ao Ponto de Campo.'
              : 'Acesse rapidamente as ferramentas do seu fluxo de trabalho:'}
          </p>
        </div>

        <div className={`grid gap-2.5 ${isModelo ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {/* Agenda Geral / Minha Agenda */}
          <button
            type="button"
            onClick={() => setCurrentView(isModelo ? 'minha-agenda' : 'mes')}
            className="p-3.5 rounded-2xl bg-[#1c1d22] hover:bg-[#26282f] border border-[#2b2d35] text-left transition-all cursor-pointer group"
          >
            <Calendar className="w-5 h-5 text-[#FF5A3C] mb-2" />
            <div className="font-bold text-xs text-white group-hover:text-[#FF5A3C] transition-colors">
              {isModelo ? 'Minha Agenda' : 'Agenda de Gravações'}
            </div>
            <div className="text-[10px] text-zinc-400">
              {isModelo ? 'Seus dias e horários' : 'Escala Mês & Semana'}
            </div>
          </button>

          {/* Ponto & GPS */}
          <button
            type="button"
            onClick={() => setCurrentView('ponto')}
            className="p-3.5 rounded-2xl bg-[#1c1d22] hover:bg-[#26282f] border border-[#2b2d35] text-left transition-all cursor-pointer group"
          >
            <Camera className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="font-bold text-xs text-white group-hover:text-emerald-400 transition-colors">
              {isInterno ? 'Ponto CLT 2026' : 'Ponto & GPS'}
            </div>
            <div className="text-[10px] text-zinc-400">
              {isInterno ? '3 batidas diárias' : 'Comprovantes no local'}
            </div>
          </button>

          {/* Módulos visíveis apenas para quem tem permissão */}
          {canUserAccessView(role, 'relatorios') && (
            <button
              type="button"
              onClick={() => setCurrentView('relatorios')}
              className="p-3.5 rounded-2xl bg-[#1c1d22] hover:bg-[#26282f] border border-[#2b2d35] text-left transition-all cursor-pointer group"
            >
              <FileText className="w-5 h-5 text-amber-400 mb-2" />
              <div className="font-bold text-xs text-white group-hover:text-amber-400 transition-colors">
                Relatórios de Vídeos
              </div>
              <div className="text-[10px] text-zinc-400">Takes, pratos e Drive</div>
            </button>
          )}

          {canUserAccessView(role, 'arquivos') && (
            <button
              type="button"
              onClick={() => setCurrentView('arquivos')}
              className="p-3.5 rounded-2xl bg-[#1c1d22] hover:bg-[#26282f] border border-[#2b2d35] text-left transition-all cursor-pointer group"
            >
              <FolderOpen className="w-5 h-5 text-[#38bdf8] mb-2" />
              <div className="font-bold text-xs text-white group-hover:text-[#38bdf8] transition-colors">
                Central DAM
              </div>
              <div className="text-[10px] text-zinc-400">Funil Kanban de Vídeos</div>
            </button>
          )}

          {canUserAccessView(role, 'metricas-reels') && (
            <button
              type="button"
              onClick={() => setCurrentView('metricas-reels')}
              className="p-3.5 rounded-2xl bg-[#1c1d22] hover:bg-[#26282f] border border-[#2b2d35] text-left transition-all cursor-pointer group"
            >
              <BarChart3 className="w-5 h-5 text-purple-400 mb-2" />
              <div className="font-bold text-xs text-white group-hover:text-purple-400 transition-colors">
                Métricas do Instagram
              </div>
              <div className="text-[10px] text-zinc-400">Performance dos Reels</div>
            </button>
          )}

          {canUserAccessView(role, 'clientes') && (
            <button
              type="button"
              onClick={() => setCurrentView('clientes')}
              className="p-3.5 rounded-2xl bg-[#1c1d22] hover:bg-[#26282f] border border-[#2b2d35] text-left transition-all cursor-pointer group"
            >
              <Building className="w-5 h-5 text-indigo-400 mb-2" />
              <div className="font-bold text-xs text-white group-hover:text-indigo-400 transition-colors">
                Restaurantes Parceiros
              </div>
              <div className="text-[10px] text-zinc-400">Contratos & Cardápios</div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
