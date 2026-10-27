'use client';

import React, { useState, useMemo } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import {
  MessageSquare,
  Smartphone,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Clock,
  Settings,
  ListFilter,
  Check,
  X,
  ShieldCheck,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import { EventItem } from '@/types/database';

export function WhatsAppAutomationView() {
  const {
    whatsappConfig,
    whatsappLogs,
    updateWhatsAppConfig,
    connectWhatsApp,
    disconnectWhatsApp,
    checkAndSendD1Reminders,
    processClientWhatsAppReply,
    sendManualWhatsAppConfirmation,
    events,
    clients,
    employees,
    canManage,
  } = useAgenda();

  const [simSelectedEventId, setSimSelectedEventId] = useState<string>('');
  const [simCustomReply, setSimCustomReply] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'status' | 'mensagens' | 'configuracoes'>('status');
  const [searchLog, setSearchLog] = useState('');
  const [logFilter, setLogFilter] = useState<'todos' | 'enviada' | 'respondida'>('todos');
  const [isConnecting, setIsConnecting] = useState(false);

  // Eventos agendados elegíveis para teste ou confirmação
  const eligibleEvents = useMemo(() => {
    return events.filter((e) => e.status !== 'cancelado');
  }, [events]);

  const selectedEvent = events.find((e) => e.id === (simSelectedEventId || eligibleEvents[0]?.id));

  const handleConnect = async () => {
    setIsConnecting(true);
    await connectWhatsApp();
    setIsConnecting(false);
  };

  const handleSimulateReply = (replyText: string) => {
    const targetId = simSelectedEventId || eligibleEvents[0]?.id;
    if (!targetId) {
      alert('Selecione uma gravação para simular a resposta do cliente.');
      return;
    }
    processClientWhatsAppReply(targetId, replyText);
    setSimCustomReply('');
  };

  const filteredLogs = useMemo(() => {
    return whatsappLogs.filter((log) => {
      const matchSearch =
        log.cliente_nome.toLowerCase().includes(searchLog.toLowerCase()) ||
        log.mensagem.toLowerCase().includes(searchLog.toLowerCase()) ||
        log.numero_destino.includes(searchLog);
      const matchStatus =
        logFilter === 'todos' ||
        (logFilter === 'enviada' && log.tipo === 'envio_confirmacao') ||
        (logFilter === 'respondida' && log.status === 'respondida');
      return matchSearch && matchStatus;
    });
  }, [whatsappLogs, searchLog, logFilter]);

  // Contagens para os cards
  const totalConfirmados = events.filter((e) => e.status === 'confirmado').length;
  const totalAguardando = events.filter((e) => e.status === 'agendado').length;
  const totalLogs = whatsappLogs.length;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-150">
      {/* Top Banner / Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground font-heading">
                WhatsApp & Automação de Agenda
              </h1>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                whatsappConfig.conectado
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
              }`}>
                {whatsappConfig.conectado ? 'Bot Conectado' : 'Desconectado'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              Disparo automático de mensagens na véspera (D-1) para clientes confirmarem a gravação. Respostas dos clientes atualizam o status da agenda automaticamente.
            </p>
          </div>
        </div>

        {/* Botão de Disparo Geral Imediato */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={() => checkAndSendD1Reminders()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl brand-solid bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-foreground font-bold text-xs shadow-md shadow-[var(--ui-accent)]/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
            title="Verificar todas as gravações agendadas para amanhã e disparar mensagens aos clientes"
          >
            <Send className="w-4 h-4" />
            <span>Disparar Verificação D-1 Agora</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas e KPIs de Comunicação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status de Conexão */}
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Instância WhatsApp</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${whatsappConfig.conectado ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-sm font-bold text-foreground">
                {whatsappConfig.conectado ? 'Online & Pareado' : 'Offline'}
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">
              {whatsappConfig.numero_conectado || '+55 11 93450-8800'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        {/* Gravações Confirmadas via Bot */}
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Gravações Confirmadas</span>
            <div className="text-2xl font-extrabold text-emerald-400 font-heading mt-1">
              {totalConfirmados}
            </div>
            <span className="text-[11px] text-zinc-500">Status confirmado no CRM</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Gravações Pendentes */}
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Aguardando Confirmação</span>
            <div className="text-2xl font-extrabold text-amber-400 font-heading mt-1">
              {totalAguardando}
            </div>
            <span className="text-[11px] text-zinc-500">Disparo D-1 programado</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Total de Mensagens */}
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Histórico de Mensagens</span>
            <div className="text-2xl font-extrabold text-sky-400 font-heading mt-1">
              {totalLogs}
            </div>
            <span className="text-[11px] text-zinc-500">Logs de envios e respostas</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navegação entre Abas */}
      <div className="flex items-center gap-1.5 p-1 bg-[var(--ui-surface)] rounded-2xl border border-[var(--ui-border)] max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('status')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
            activeTab === 'status'
              ? 'brand-solid bg-[var(--ui-accent)] text-foreground shadow-sm'
              : 'text-zinc-400 hover:text-foreground'
          }`}
        >
          Conexão & Teste ao Vivo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('mensagens')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
            activeTab === 'mensagens'
              ? 'brand-solid bg-[var(--ui-accent)] text-foreground shadow-sm'
              : 'text-zinc-400 hover:text-foreground'
          }`}
        >
          Logs & Histórico ({whatsappLogs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('configuracoes')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
            activeTab === 'configuracoes'
              ? 'brand-solid bg-[var(--ui-accent)] text-foreground shadow-sm'
              : 'text-zinc-400 hover:text-foreground'
          }`}
        >
          Regras & Template D-1
        </button>
      </div>

      {/* ABA 1: CONEXÃO & TESTE AO VIVO */}
      {activeTab === 'status' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Pareamento & Conexão da Instância */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--ui-border)]">
              <div>
                <h3 className="text-base font-bold text-foreground">Conectar WhatsApp do CRM</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Conexão segura multi-aparelho via whatsapp-web.js
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                whatsappConfig.conectado
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}>
                {whatsappConfig.conectado ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Conectado
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Desconectado
                  </>
                )}
              </span>
            </div>

            {/* Visualizador QR Code / Pairing Code */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)]">
              <div className="relative w-40 h-40 rounded-2xl bg-white p-2.5 shadow-inner flex items-center justify-center shrink-0">
                {whatsappConfig.conectado ? (
                  <div className="flex flex-col items-center justify-center text-center gap-2">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    <span className="text-[11px] font-bold text-zinc-800">Sessão Ativa</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center gap-1.5">
                    <QrCode className="w-24 h-24 text-zinc-800" />
                    <span className="text-[10px] text-zinc-600 font-mono">Escaneie no WhatsApp</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2.5 flex-1 min-w-0 text-left">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Instância Oficial</span>
                  <div className="text-xs font-bold text-foreground">
                    {whatsappConfig.instancia_nome}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Código de Pareamento</span>
                  <div className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 w-fit">
                    {whatsappConfig.pairing_code || 'NW89-4KT2'}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {whatsappConfig.conectado ? (
                    <button
                      type="button"
                      onClick={disconnectWhatsApp}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                    >
                      Desconectar Sessão
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="px-4 py-2 rounded-xl brand-solid bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-foreground text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                      <span>{isConnecting ? 'Conectando...' : 'Conectar Instância'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Informações da Integração com o Robô Local */}
            <div className="p-3.5 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Terminal className="w-4 h-4 text-[#38bdf8]" />
                <span>Integração Direta com os Robôs Disponíveis</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Se você iniciar o bot do repositório local (<code className="text-foreground">..\whatsapp\whatsapp a2</code> na porta 3001), o CRM se conecta de forma direta. Sem o servidor rodando, o CRM utiliza a engine integrada de automação com persistência local.
              </p>
            </div>
          </div>

          {/* Card 2: SIMULADOR AO VIVO DE CONFIRMAÇÃO DO CLIENTE */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-4">
            <div className="pb-3 border-b border-[var(--ui-border)]">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Simulador Interativo
              </span>
              <h3 className="text-base font-bold text-foreground">
                Simulação de Resposta do Cliente
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Teste em tempo real como o envio da mensagem e a resposta do cliente alteram o status da agenda automaticamente.
              </p>
            </div>

            {/* Seletor do Evento a Testar */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Selecione a Gravação para Testar
              </label>
              <select
                value={simSelectedEventId || eligibleEvents[0]?.id || ''}
                onChange={(e) => setSimSelectedEventId(e.target.value)}
                className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
              >
                {eligibleEvents.map((ev) => {
                  const client = clients.find((c) => c.id === ev.client_id);
                  return (
                    <option key={ev.id} value={ev.id}>
                      {client?.nome || 'Restaurante'} • {ev.data.split('-').reverse().slice(0, 2).join('/')} ({ev.hora_inicio.slice(0, 5)}) — Status: {ev.status.toUpperCase()}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Preview do Evento Selecionado */}
            {selectedEvent && (
              <div className="p-3.5 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">
                    {clients.find((c) => c.id === selectedEvent.client_id)?.nome}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      selectedEvent.status === 'confirmado'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : selectedEvent.status === 'cancelado'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    Status Atual: {selectedEvent.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  Data: {selectedEvent.data} • Horário: {selectedEvent.hora_inicio} às {selectedEvent.hora_fim} • WhatsApp: {clients.find((c) => c.id === selectedEvent.client_id)?.telefone || '(11) 98765-4321'}
                </div>

                {/* Botão de Enviar Mensagem para este Evento */}
                <button
                  type="button"
                  onClick={() => sendManualWhatsAppConfirmation(selectedEvent.id)}
                  className="mt-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>1. Enviar Mensagem de Confirmação (D-1)</span>
                </button>
              </div>
            )}

            {/* Botões de Ação para Simular Resposta */}
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-xs font-bold text-zinc-300">
                2. Simular Resposta que o Cliente Enviou no WhatsApp:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateReply('1 - Confirmadíssimo, estaremos esperando a equipe!')}
                  className="p-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all cursor-pointer text-left flex items-center gap-2"
                >
                  <Check className="w-4 h-4 shrink-0 stroke-[3]" />
                  <div>
                    <span className="block font-bold">Cliente Confirmou (&quot;Sim / 1&quot;)</span>
                    <span className="text-[10px] text-emerald-500 font-normal">Muda evento para &quot;Confirmado&quot;</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateReply('2 - Não vamos conseguir amanhã, precisamos remarcar a data.')}
                  className="p-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-bold transition-all cursor-pointer text-left flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="block font-bold">Cliente Remarcou (&quot;Não / 2&quot;)</span>
                    <span className="text-[10px] text-rose-500 font-normal">Alerta reagendamento na agenda</span>
                  </div>
                </button>
              </div>

              {/* Resposta personalizada */}
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  placeholder="Ou digite o que o cliente respondeu..."
                  value={simCustomReply}
                  onChange={(e) => setSimCustomReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && simCustomReply.trim()) {
                      handleSimulateReply(simCustomReply.trim());
                    }
                  }}
                  className="flex-1 bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (simCustomReply.trim()) {
                      handleSimulateReply(simCustomReply.trim());
                    }
                  }}
                  disabled={!simCustomReply.trim()}
                  className="px-3.5 py-2 rounded-xl brand-solid bg-[var(--ui-accent)] disabled:opacity-50 text-foreground font-bold text-xs cursor-pointer"
                >
                  Simular
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: LOGS & HISTÓRICO DE MENSAGENS */}
      {activeTab === 'mensagens' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--ui-border)]">
            <div>
              <h3 className="text-base font-bold text-foreground">Log de Mensagens & Respostas</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Histórico detalhado das confirmações disparadas e respostas captadas
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Buscar cliente ou mensagem..."
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                className="bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)] w-48"
              />

              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value as any)}
                className="bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
              >
                <option value="todos">Todos os Logs</option>
                <option value="enviada">Apenas Envios D-1</option>
                <option value="respondida">Apenas Respostas</option>
              </select>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-400 bg-[var(--ui-raised)] rounded-2xl border border-[var(--ui-border)]">
              Nenhuma mensagem registrada nos logs ainda.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredLogs.map((log) => {
                const isSent = log.tipo === 'envio_confirmacao';
                const isConfirmed = log.resposta_detectada === 'confirmado';
                const isRemarcar = log.resposta_detectada === 'remarcar';

                return (
                  <div
                    key={log.id}
                    className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      isSent
                        ? 'bg-[var(--ui-raised)] border-[var(--ui-border)]'
                        : isConfirmed
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : isRemarcar
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : 'bg-sky-500/10 border-sky-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSent
                          ? 'bg-sky-500/20 text-sky-400'
                          : isConfirmed
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {isSent ? <Send className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      </div>

                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground truncate">{log.cliente_nome}</span>
                          <span className="text-[11px] text-zinc-400 font-mono">{log.numero_destino}</span>
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                            isSent
                              ? 'bg-sky-500/20 text-sky-400'
                              : isConfirmed
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {isSent ? 'Disparo D-1' : isConfirmed ? 'Confirmado pelo Cliente' : 'Remarcação Solicitada'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
                          {log.mensagem}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 self-end sm:self-auto font-mono text-[10px] text-zinc-500">
                      {new Date(log.data_hora).toLocaleDateString('pt-BR')} às {new Date(log.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA 3: CONFIGURAÇÕES & TEMPLATE */}
      {activeTab === 'configuracoes' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-5 max-w-3xl">
          <div className="pb-3 border-b border-[var(--ui-border)]">
            <h3 className="text-base font-bold text-foreground">Regras de Confirmação & Template</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Personalize o texto enviado automaticamente aos restaurantes na véspera da gravação
            </p>
          </div>

          {/* Toggle de Confirmação D-1 */}
          <div className="p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-foreground block">
                Disparo Automático D-1 na Véspera
              </span>
              <span className="text-[11px] text-zinc-400 block mt-0.5">
                Verifica automaticamente todos os dias às {whatsappConfig.horario_envio_padrao} as gravações agendadas para o dia seguinte.
              </span>
            </div>
            <button
              type="button"
              onClick={() => updateWhatsAppConfig({ auto_confirmacao_d1: !whatsappConfig.auto_confirmacao_d1 })}
              className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                whatsappConfig.auto_confirmacao_d1 ? 'bg-emerald-500 justify-end' : 'bg-zinc-700 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          {/* Horário Padrão */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Horário do Disparo na Véspera
            </label>
            <input
              type="time"
              value={whatsappConfig.horario_envio_padrao}
              onChange={(e) => updateWhatsAppConfig({ horario_envio_padrao: e.target.value })}
              className="bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)] w-36 font-mono"
            />
          </div>

          {/* Editor do Template de Mensagem */}
          <div className="flex flex-col gap-2">
            <label className="block text-xs font-semibold text-zinc-300">
              Template da Mensagem de Confirmação
            </label>
            <div className="flex flex-wrap gap-1.5 text-[10px] text-zinc-400 pb-1">
              <span className="font-semibold text-zinc-300">Tags disponíveis:</span>
              <code className="bg-[var(--ui-raised)] px-1.5 py-0.5 rounded text-amber-400">{'{{responsavel}}'}</code>
              <code className="bg-[var(--ui-raised)] px-1.5 py-0.5 rounded text-amber-400">{'{{data}}'}</code>
              <code className="bg-[var(--ui-raised)] px-1.5 py-0.5 rounded text-amber-400">{'{{hora_inicio}}'}</code>
              <code className="bg-[var(--ui-raised)] px-1.5 py-0.5 rounded text-amber-400">{'{{hora_fim}}'}</code>
              <code className="bg-[var(--ui-raised)] px-1.5 py-0.5 rounded text-amber-400">{'{{restaurante}}'}</code>
              <code className="bg-[var(--ui-raised)] px-1.5 py-0.5 rounded text-amber-400">{'{{equipe}}'}</code>
            </div>
            <textarea
              rows={8}
              value={whatsappConfig.template_mensagem}
              onChange={(e) => updateWhatsAppConfig({ template_mensagem: e.target.value })}
              className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-2xl p-4 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)] font-mono leading-relaxed"
            />
          </div>
        </div>
      )}
    </div>
  );
}
