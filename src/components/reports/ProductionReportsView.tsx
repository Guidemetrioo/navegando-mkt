'use client';

import React, { useState, useMemo } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { EventItem } from '@/types/database';
import { EmployeeBadge } from '@/components/agenda/EmployeeBadge';
import { NavegandoLogo } from '@/components/brand/NavegandoLogo';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Building,
  Video,
  CheckCircle2,
  Clock,
  ExternalLink,
  FolderOpen,
  Sparkles,
  AlertTriangle,
  Camera,
  Star,
  Plus,
  RefreshCw,
  Download,
} from 'lucide-react';

export function ProductionReportsView() {
  const {
    events,
    clients,
    employees,
    openEditEventModal,
    openNewEventModal,
    toast,
  } = useAgenda();

  // Filtros
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedFilmmakerId, setSelectedFilmmakerId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'preenchido' | 'pendente'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filtrar apenas eventos relevantes para produção de vídeo (gravação / foto)
  const productionEvents = useMemo(() => {
    return events
      .filter((e) => e.status !== 'cancelado')
      .sort((a, b) => b.data.localeCompare(a.data) || b.hora_inicio.localeCompare(a.hora_inicio));
  }, [events]);

  const filteredEvents = useMemo(() => {
    return productionEvents.filter((ev) => {
      // Filtro por Cliente
      if (selectedClientId !== 'all' && ev.client_id !== selectedClientId) {
        return false;
      }
      // Filtro por Data / Dia
      if (selectedDate && ev.data !== selectedDate) {
        return false;
      }
      // Filtro por Filmmaker
      if (selectedFilmmakerId !== 'all') {
        const assigned = ev.assigned_employee_ids || [];
        if (!assigned.includes(selectedFilmmakerId)) {
          return false;
        }
      }
      // Filtro por status do relatório
      const isPreenchido = Boolean(ev.relatorio_filmmaker?.preenchido);
      if (statusFilter === 'preenchido' && !isPreenchido) return false;
      if (statusFilter === 'pendente' && isPreenchido) return false;

      // Busca por texto
      if (searchTerm.trim()) {
        const clean = searchTerm.toLowerCase();
        const clientName = ev.client?.nome?.toLowerCase() || '';
        const pratos = ev.relatorio_filmmaker?.pratos_gravados?.toLowerCase() || '';
        const equip = ev.relatorio_filmmaker?.equipamento_usado?.toLowerCase() || '';
        const obs = ev.relatorio_filmmaker?.observacoes?.toLowerCase() || '';
        const ocorrencias = ev.relatorio_filmmaker?.ocorrencias_cozinha?.toLowerCase() || '';

        const matches =
          clientName.includes(clean) ||
          pratos.includes(clean) ||
          equip.includes(clean) ||
          obs.includes(clean) ||
          ocorrencias.includes(clean);

        if (!matches) return false;
      }

      return true;
    });
  }, [productionEvents, selectedClientId, selectedDate, selectedFilmmakerId, statusFilter, searchTerm]);

  // Estatísticas
  const stats = useMemo(() => {
    const totalSessoes = productionEvents.length;
    const relatoriosPreenchidos = productionEvents.filter((e) => e.relatorio_filmmaker?.preenchido).length;
    const totalTakes = productionEvents.reduce(
      (acc, e) => acc + (e.relatorio_filmmaker?.takes_gravados_qtd || 0),
      0
    );
    const mediaTakes = relatoriosPreenchidos > 0 ? Math.round(totalTakes / relatoriosPreenchidos) : 0;
    const sessoesOtimas = productionEvents.filter(
      (e) => e.relatorio_filmmaker?.avaliacao_sessao === 'otima'
    ).length;

    return {
      totalSessoes,
      relatoriosPreenchidos,
      taxaPreenchimento: totalSessoes > 0 ? Math.round((relatoriosPreenchidos / totalSessoes) * 100) : 0,
      totalTakes,
      mediaTakes,
      sessoesOtimas,
    };
  }, [productionEvents]);

  const handleClearFilters = () => {
    setSelectedClientId('all');
    setSelectedDate('');
    setSelectedFilmmakerId('all');
    setStatusFilter('all');
    setSearchTerm('');
    toast('Filtros redefinidos.', 'info');
  };

  const handleExportSummary = () => {
    const lines = filteredEvents.map((ev) => {
      const rep = ev.relatorio_filmmaker;
      return `Restaurante: ${ev.client?.nome || 'Cliente'} | Data: ${ev.data} (${ev.hora_inicio} - ${ev.hora_fim}) | Pratos: ${rep?.pratos_gravados || 'Não informado'} | Takes: ${rep?.takes_gravados_qtd || 0} | Avaliação: ${rep?.avaliacao_sessao || 'N/A'}`;
    });

    const text = `RELATÓRIO GERAL DE VÍDEOS - AGÊNCIA NAVEGANDO MKT\nData de Extração: ${new Date().toLocaleDateString('pt-BR')}\nTotal de Gravações: ${filteredEvents.length}\n\n${lines.join('\n')}`;

    navigator.clipboard.writeText(text);
    toast('Relatório copiado para a área de transferência!', 'success');
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in pb-12">
      {/* 1. CABEÇALHO */}
      <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-[var(--ui-surface)] via-[var(--ui-page)] to-[var(--ui-surface)] border border-[var(--ui-border)] shadow-2xl">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-[var(--ui-accent)]/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute right-6 bottom-4 opacity-10 pointer-events-none hidden md:block">
          <NavegandoLogo size={120} variant="symbol" />
        </div>

        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[var(--ui-accent)]/15 text-[var(--ui-accent)] border border-[var(--ui-accent)]/30">
              <Video className="w-5 h-5 text-[var(--ui-accent)]" />
            </span>
            <span className="text-xs font-black text-[var(--ui-accent)] tracking-wider uppercase">
              Relatórios de Produção de Vídeo • Navegando MKT
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-foreground tracking-tight">
            Relatórios por Dia e Restaurante
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
            Acompanhe em tempo real os pratos filmados pelos filmmakers, contagem de takes, ocorrências de cozinha, links de brutos no Google Drive e avaliação das diárias.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap relative z-10">
          <button
            type="button"
            onClick={handleExportSummary}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[var(--ui-surface)] hover:bg-[var(--ui-raised)] text-zinc-300 hover:text-foreground border border-[var(--ui-border)] font-semibold text-xs transition-colors cursor-pointer"
            title="Copiar relatório formatado"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar Resumo</span>
          </button>
          <button
            type="button"
            onClick={() => openNewEventModal()}
            className="gradient-cta flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-foreground font-bold text-xs shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Gravação</span>
          </button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Gravações Relatadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-foreground font-heading">
              {stats.relatoriosPreenchidos}
            </span>
            <span className="text-xs text-zinc-500">/ {stats.totalSessoes} sessoes</span>
          </div>
          <div className="w-full bg-[var(--ui-raised)] rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${stats.taxaPreenchimento}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-400 mt-1">
            {stats.taxaPreenchimento}% de preenchimento
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Total de Takes Gravados</span>
            <Camera className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-[#38bdf8] font-heading">
              {stats.totalTakes}
            </span>
            <span className="text-xs text-zinc-400">takes</span>
          </div>
          <span className="text-[10px] text-zinc-400 mt-3">
            Média de {stats.mediaTakes} takes por visita ao restaurante
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Sessões Impecáveis</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-heading">
              {stats.sessoesOtimas}
            </span>
            <span className="text-xs text-zinc-500">avaliações ótimas</span>
          </div>
          <span className="text-[10px] text-zinc-400 mt-3">
            Gravações sem atrasos nem imprevistos
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Restaurantes Atendidos</span>
            <Building className="w-4 h-4 text-[var(--ui-accent)]" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-foreground font-heading">
              {clients.length}
            </span>
            <span className="text-xs text-zinc-500">parceiros ativos</span>
          </div>
          <span className="text-[10px] text-zinc-400 mt-3">
            Mooca, Tatuapé, Pinheiros e Vila Madalena
          </span>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS: DIA E CLIENTE */}
      <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-[var(--ui-accent)]" />
            <span>Filtrar Relatórios por Dia e Cliente</span>
          </span>

          {(selectedClientId !== 'all' || selectedDate || selectedFilmmakerId !== 'all' || statusFilter !== 'all' || searchTerm) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-foreground transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Busca por Texto */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar prato, equipamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl text-xs text-foreground placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
            />
          </div>

          {/* Filtro por Cliente / Restaurante */}
          <div>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)] cursor-pointer"
            >
              <option value="all">Todos os Restaurantes ({clients.length})</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Dia / Data */}
          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)] cursor-pointer"
              title="Filtrar por dia específico"
            />
          </div>

          {/* Filtro por Filmmaker */}
          <div>
            <select
              value={selectedFilmmakerId}
              onChange={(e) => setSelectedFilmmakerId(e.target.value)}
              className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)] cursor-pointer"
            >
              <option value="all">Todos os Filmmakers</option>
              {employees
                .filter((e) => e.funcao === 'filmmaker')
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome}
                  </option>
                ))}
            </select>
          </div>

          {/* Filtro por Status do Relatório */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)] cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="preenchido">Relatórios Preenchidos</option>
              <option value="pendente">Relatórios Pendentes</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. LISTA DE CARDS DE RELATÓRIO */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
          <span>
            Exibindo <strong>{filteredEvents.length}</strong> relatórios de gravação
          </span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col items-center gap-3">
            <FileText className="w-10 h-10 text-zinc-600" />
            <h3 className="text-base font-bold text-foreground">Nenhum relatório encontrado</h3>
            <p className="text-xs text-zinc-400 max-w-sm">
              Não há gravações que correspondam aos filtros selecionados de dia ou cliente.
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-2 px-4 py-2 rounded-xl bg-[var(--ui-hover)] text-zinc-200 text-xs font-semibold hover:bg-[var(--ui-border)] transition-colors cursor-pointer"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredEvents.map((ev) => {
              const rep = ev.relatorio_filmmaker;
              const isPreenchido = Boolean(rep?.preenchido);
              const client = ev.client;

              return (
                <div
                  key={ev.id}
                  className="p-5 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] hover:border-[#38bdf8]/50 transition-all shadow-md flex flex-col gap-4"
                >
                  {/* Topo do Card: Cliente, Data e Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[var(--ui-border)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--ui-accent)]/10 border border-[var(--ui-accent)]/20 flex items-center justify-center text-[var(--ui-accent)] font-black text-sm shrink-0">
                        {client?.nome ? client.nome.slice(0, 2).toUpperCase() : 'CL'}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                          <span>{client?.nome || 'Restaurante'}</span>
                          {client?.instagram_handle && (
                            <span className="text-[11px] font-normal text-zinc-400">
                              {client.instagram_handle}
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-zinc-400 flex items-center gap-2">
                          <span className="flex items-center gap-1 text-zinc-300">
                            <Calendar className="w-3 h-3 text-[var(--ui-accent)]" />
                            {ev.data}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            {ev.hora_inicio} às {ev.hora_fim}
                          </span>
                          {ev.local && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[200px]">{ev.local}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {isPreenchido ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Relatório Concluído</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Relatório Pendente</span>
                        </span>
                      )}

                      {rep?.avaliacao_sessao && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--ui-raised)] border border-[var(--ui-border)] text-zinc-300">
                          {rep.avaliacao_sessao === 'otima' && 'Sessão Ótima'}
                          {rep.avaliacao_sessao === 'boa' && 'Sessão Boa'}
                          {rep.avaliacao_sessao === 'regular' && 'Sessão Regular'}
                          {rep.avaliacao_sessao === 'com_imprevistos' && 'Com Imprevistos'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Corpo do Card: Pratos, Takes, Equipamento e Ocorrências */}
                  {isPreenchido ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Coluna 1: Pratos Gravados e Takes */}
                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)]">
                          <span className="text-[10px] font-bold text-[#38bdf8] uppercase tracking-wider block mb-1">
                            Relato do Filmmaker:
                          </span>
                          <p className="text-zinc-200 font-medium leading-relaxed whitespace-pre-line">
                            {rep?.relatorio_texto || rep?.observacoes || rep?.pratos_gravados || 'Nenhum detalhe especificado.'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1 p-2.5 rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)]">
                            <span className="text-[10px] text-zinc-400 block">Total de Takes</span>
                            <span className="text-base font-bold text-foreground">
                              {rep?.takes_gravados_qtd || 0} takes
                            </span>
                          </div>

                          <div className="flex-1 p-2.5 rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)]">
                            <span className="text-[10px] text-zinc-400 block">Preenchido Por</span>
                            <span className="text-xs font-bold text-zinc-200 truncate block">
                              {rep?.preenchido_por_nome || 'Filmmaker'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Coluna 2: Equipamento, Ocorrências e Link Drive */}
                      <div className="space-y-3">
                        {rep?.equipamento_usado && (
                          <div className="p-2.5 rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)]">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                              Equipamento Usado:
                            </span>
                            <p className="text-zinc-300">{rep.equipamento_usado}</p>
                          </div>
                        )}

                        {rep?.ocorrencias_cozinha && (
                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                            <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5 text-amber-400">
                              Ocorrências:
                            </span>
                            <p className="text-xs leading-relaxed">{rep.ocorrencias_cozinha}</p>
                          </div>
                        )}

                        {rep?.observacoes && (
                          <div className="p-2.5 rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)]">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                              Observações para Edição:
                            </span>
                            <p className="text-zinc-300 italic">{rep.observacoes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200/90">
                      <div>
                        <strong className="block text-amber-300 mb-0.5">
                          Relatório desta gravação ainda não foi preenchido pelo filmmaker.
                        </strong>
                        <p className="text-[11px] text-amber-200/70">
                          Clique no botão ao lado para preencher os pratos gravados, contagem de takes e enviar o link dos brutos.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => openEditEventModal(ev)}
                        className="px-3.5 py-2 rounded-xl bg-[#38bdf8] hover:bg-[#0284c7] text-black font-bold text-xs shrink-0 transition-all cursor-pointer"
                      >
                        Preencher Agora
                      </button>
                    </div>
                  )}

                  {/* Rodapé do Card: Equipe Escalada + Botões de Ação */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--ui-border)]">
                    {/* Chips dos funcionários */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Equipe:</span>
                      {(ev.employees || []).map((emp) => (
                        <EmployeeBadge key={emp.id} employee={emp} size="sm" />
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      {rep?.pasta_brutos_link && (
                        <a
                          href={rep.pasta_brutos_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 text-xs font-semibold border border-indigo-500/30 transition-colors"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>Pasta no Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditEventModal(ev)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--ui-hover)] hover:bg-[var(--ui-border)] text-zinc-200 hover:text-foreground text-xs font-semibold border border-[var(--ui-border)] transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#38bdf8]" />
                        <span>{isPreenchido ? 'Editar Relatório' : 'Abrir Relatório'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
