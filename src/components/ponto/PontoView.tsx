'use client';

import React, { useEffect, useRef, useState } from 'react';
import { todayInSaoPaulo } from '@/lib/date-utils';
import { useAgenda } from '@/context/AgendaContext';
import { filterPontoHistory } from '@/lib/ponto-history';
import { EmployeeBadge } from '../agenda/EmployeeBadge';
import { formatDistance, MAX_GEOFENCE_RADIUS_METERS } from '@/lib/geo-utils';
import { LiveLocationRadar } from './LiveLocationRadar';
import { PontoStreet } from './PontoStreet';
import { TeamPontoOverview } from './TeamPontoOverview';
import {
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Calendar,
  ExternalLink,
  ShieldCheck,
  LayoutGrid,
  List,
  X,
  Scale,
} from 'lucide-react';

export function PontoView() {
  const {
    pontos,
    employees,
    clients,
    openPontoModal,
    loggedEmployeeId,
  } = useAgenda();

  const currentMember = employees.find((e) => e.id === loggedEmployeeId);
  const isManagerOrOwner = currentMember?.funcao === 'dono' || currentMember?.funcao === 'gerente';

  const [selectedFilterEmpId, setSelectedFilterEmpId] = useState<string>('all');
  const [selectedFilterClientId, setSelectedFilterClientId] = useState<string>('all');
  const [selectedFilterTipo, setSelectedFilterTipo] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'cards' | 'tabela'>(isManagerOrOwner ? 'tabela' : 'cards');
  const [zoomPhoto, setZoomPhoto] = useState<{ url: string; nome: string; dataHora: string } | null>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  useEffect(() => {
    queueMicrotask(() => {
      const today = todayInSaoPaulo();
      setStartDate(today); setEndDate(today);
    });
  }, []);
  const closePhotoRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!zoomPhoto) return;
    const previous = document.activeElement as HTMLElement | null;
    closePhotoRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoomPhoto(null);
      if (event.key === 'Tab') {
        const buttons = closePhotoRef.current?.closest('[role="dialog"]')?.querySelectorAll<HTMLButtonElement>('button');
        const first = buttons?.[0];
        const last = buttons?.[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [zoomPhoto]);

  const basePontos = !isManagerOrOwner
    ? pontos.filter(p => p.employee_id === loggedEmployeeId)
    : pontos;
  const invalidPeriod = Boolean(startDate && endDate && startDate > endDate);
  const filteredPontos = filterPontoHistory(pontos, currentMember?.funcao, loggedEmployeeId, {
    employeeId: isManagerOrOwner ? selectedFilterEmpId : 'all',
    clientId: selectedFilterClientId, tipo: selectedFilterTipo, startDate, endDate,
  });
  const clearFilters = () => {
    setSelectedFilterEmpId('all'); setSelectedFilterClientId('all');
    setSelectedFilterTipo('all'); setStartDate(''); setEndDate('');
  };

  // KPIs
  const totalPontos = basePontos.length;
  const entradasNoLocal = basePontos.filter(
    (p) => p.tipo === 'entrada' && p.status_localizacao === 'no_local'
  ).length;
  const pontosHoje = basePontos.filter((p) => todayInSaoPaulo(new Date(p.data_hora))===todayInSaoPaulo()).length;
  const foraDoRaio = basePontos.filter((p) => p.status_localizacao === 'fora_do_raio').length;

  return (
    <div className="w-full flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">{isManagerOrOwner ? 'Pontos da equipe' : 'Meus pontos'}</h2>
        <p className="mt-1 text-sm text-zinc-400">Consulte as batidas, a foto e a localização registradas em cada ponto.</p>
      </div>
      {/* 0. Radar de Localização Real com Permissão do Dispositivo & Mapa */}
      {!isManagerOrOwner && <LiveLocationRadar />}

      {/* 0.1 Banner de Normas configurada pela agência & Cargas Horárias */}
      <div className="p-5 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                Norma configurada pela agência
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                Regime Interno vs Externo
              </span>
            </div>
            <h3 className="text-base font-bold text-foreground">
              Carga Horária & Normas de Ponto da Agência Navegando MKT
            </h3>
            <p className="text-xs text-zinc-300 max-w-3xl leading-relaxed">
              <strong>Equipe Interna (Segunda a Sexta):</strong> Carga horária máxima CLT de <strong>8h48min/dia (44h semanais)</strong> com registro de apenas <strong>3 batidas</strong> (Entrada, Almoço de 1h a 2h, Saída).<br />
              <strong>Equipe Externa (Filmmakers & Modelos):</strong> Sem jornada fixa diária. Bate ponto no restaurante na Entrada e Saída com foto e GPS, contabilizando horas totais na semana.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openPontoModal()}
          className="gradient-cta flex items-center gap-2 px-4 py-2.5 rounded-xl text-foreground font-bold text-xs shadow-lg transition-all shrink-0 cursor-pointer self-start md:self-auto"
        >
          <Camera className="w-4 h-4" />
          <span>Bater Ponto Agora</span>
        </button>
      </div>

      {/* 1. Header com KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* KPI 1 */}
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
            <span>Pontos Registrados</span>
            <Clock className="w-4 h-4 text-[var(--ui-accent)]" />
          </div>
          <div className="text-2xl font-bold text-foreground dark:text-foreground text-zinc-900 font-heading mt-1">
            {totalPontos}
          </div>
          <span className="text-[11px] text-zinc-500">{isManagerOrOwner ? 'Histórico de toda a equipe' : 'Seu histórico de pontos'}</span>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
            <span>Validados no Local</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-foreground dark:text-foreground text-zinc-900 font-heading mt-1">
            {entradasNoLocal}
          </div>
          <span className="text-[11px] text-zinc-500">&lt; {MAX_GEOFENCE_RADIUS_METERS}m do restaurante</span>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#38bdf8]">
            <span>Registros Hoje</span>
            <Calendar className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div className="text-2xl font-bold text-foreground dark:text-foreground text-zinc-900 font-heading mt-1">
            {pontosHoje}
          </div>
          <span className="text-[11px] text-zinc-500">Equipe interna e externa</span>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
            <span>Fora do Raio</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-foreground dark:text-foreground text-zinc-900 font-heading mt-1">
            {foraDoRaio}
          </div>
          <span className="text-[11px] text-zinc-500">Alertas de auditoria</span>
        </div>
      </div>

      {/* 2. Barra de Controle: Filtros e Botão de Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white rounded-2xl border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          {isManagerOrOwner && (
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Funcionário
              <select aria-label="Funcionário" value={selectedFilterEmpId} onChange={e => setSelectedFilterEmpId(e.target.value)}
                className="max-w-full text-xs bg-[var(--ui-raised)] text-foreground border border-[var(--ui-border)] rounded-xl px-3 py-2">
                <option value="all">Toda a equipe ({employees.length})</option>
                {[...employees].sort((a,b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </select>
            </label>
          )}
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Data inicial
            <input type="date" aria-label="Data inicial" value={startDate} max={endDate || undefined}
              onChange={e => setStartDate(e.target.value)}
              className="min-w-0 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-raised)] px-3 py-2 text-foreground" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Data final
            <input type="date" aria-label="Data final" value={endDate} min={startDate || undefined}
              onChange={e => setEndDate(e.target.value)}
              className="min-w-0 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-raised)] px-3 py-2 text-foreground" />
          </label>
          <button type="button" onClick={() => {const today = todayInSaoPaulo(); setStartDate(today); setEndDate(today);}}
            className="text-xs text-[var(--ui-accent)] px-2 py-2">Hoje</button>
          <button type="button" onClick={clearFilters} className="text-xs text-zinc-400 px-2 py-2 underline">Limpar filtros</button>

          {/* Filtro por Restaurante */}
          <select
            aria-label="Local"
            value={selectedFilterClientId}
            onChange={(e) => setSelectedFilterClientId(e.target.value)}
            className="text-xs bg-[var(--ui-raised)] text-zinc-200 border border-[var(--ui-border)] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
          >
            <option value="all">Todos os locais</option>
            <option value="internal">Sede / ponto interno</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>

          {/* Filtro por Tipo */}
          <select
            aria-label="Tipo de batida"
            value={selectedFilterTipo}
            onChange={(e) => setSelectedFilterTipo(e.target.value)}
            className="text-xs bg-[var(--ui-raised)] text-zinc-200 border border-[var(--ui-border)] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
          >
            <option value="all">Todas as batidas</option>
            <option value="entrada">Apenas Entradas</option>
            <option value="almoco">Apenas Almoço</option>
            <option value="saida">Apenas Saídas</option>
          </select>
        </div>

        {/* Lado Direito: Alternador de Visualização & Botão Bater Ponto */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Seletor Cards / Tabela */}
          <div className="flex items-center p-1 bg-[var(--ui-raised)] rounded-xl border border-[var(--ui-border)] text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('cards')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'cards' ? 'brand-solid bg-[var(--ui-accent)] text-foreground shadow-sm' : 'text-zinc-400 hover:text-foreground'
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tabela')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'tabela' ? 'brand-solid bg-[var(--ui-accent)] text-foreground shadow-sm' : 'text-zinc-400 hover:text-foreground'
              }`}
              title="Tabela de Auditoria"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botão de Bater Ponto */}
          <button
            type="button"
            onClick={() => openPontoModal()}
            className="gradient-cta flex items-center gap-1.5 text-foreground font-bold text-xs px-3.5 py-2 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Bater Ponto Agora</span>
          </button>
        </div>
      </div>

      <div className="text-xs text-zinc-400" role="status" aria-live="polite">
        {invalidPeriod ? 'A data final deve ser igual ou posterior à data inicial.' : `${filteredPontos.length} registro(s) encontrado(s)`}
        <span className="block mt-1">{isManagerOrOwner ? 'Pontos de toda a equipe' : 'Seus pontos'} · Mais recentes primeiro · Horário de Brasília (São Paulo)</span>
      </div>

      {isManagerOrOwner && <TeamPontoOverview employees={employees} pontos={filteredPontos} employeeId={selectedFilterEmpId} onPhoto={setZoomPhoto} />}

      <h3 className="text-base font-semibold text-foreground">Histórico de batidas</h3>
      {/* 3. CONTEÚDO PRINCIPAL (Cards ou Tabela) */}
      {filteredPontos.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] p-8 flex flex-col items-center gap-3">
          <Camera className="w-10 h-10 text-zinc-500 animate-pulse" />
          <h4 className="text-base font-bold text-zinc-200">Nenhum registro de ponto encontrado</h4>
          <p className="text-xs text-zinc-500 max-w-sm">
            Nenhum ponto registrado para os filtros selecionados. Ajuste o funcionário ou o período para consultar o histórico.
          </p>
          <button
            type="button"
            onClick={() => openPontoModal()}
            className="mt-2 text-xs font-bold text-[var(--ui-accent)] hover:underline"
          >
            Registrar ponto agora
          </button>
        </div>
      ) : activeTab === 'cards' ? (
        /* VISUALIZAÇÃO EM CARDS / COMPROVANTES SIMÉTRICOS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {filteredPontos.map((p) => {
            const isInside = p.status_localizacao === 'no_local';
            const dateObj = new Date(p.data_hora);
            const dateFormatted = dateObj.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              timeZone: 'America/Sao_Paulo',
            });
            const timeFormatted = dateObj.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              timeZone: 'America/Sao_Paulo',
            });

            return (
              <div
                key={p.id}
                className="bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white rounded-2xl border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 overflow-hidden shadow-sm hover:border-[var(--ui-accent)]/40 hover:shadow-md transition-all flex flex-col justify-between h-full min-h-[290px]"
              >
                {/* Header do Cartão */}
                <div className="p-4 pb-3 flex items-start justify-between border-b border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-100 min-h-[56px]">
                  <div className="flex items-center gap-2.5">
                    {p.employee ? <EmployeeBadge employee={p.employee} size="md" showRole /> : <span>{p.employee_id}</span>}
                  </div>

                  {p.tipo === 'entrada' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Entrada
                    </span>
                  )}
                  {p.tipo === 'almoco' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Almoço
                    </span>
                  )}
                  {p.tipo === 'saida' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      Saída
                    </span>
                  )}
                </div>

                {/* Corpo: Foto e Detalhes */}
                <div className="p-4 flex gap-3.5 items-start">
                  {/* Foto / Selfie clicável OU Espaço para foto da pessoa */}
                  {p.foto_url ? (
                    <button
                      type="button"
                      aria-label={`Ampliar foto de ${p.employee?.nome || p.employee_id}`}
                      className="relative w-24 h-28 rounded-xl overflow-hidden shrink-0 cursor-pointer border border-[var(--ui-border)] group shadow-sm"
                      onClick={() =>
                        setZoomPhoto({
                          url: p.foto_url,
                          nome: p.employee?.nome || 'Membro da Equipe',
                          dataHora: `${dateFormatted} às ${timeFormatted}`,
                        })
                      }
                      title="Clique para ampliar a foto"
                    >
                      <img
                        src={p.foto_url}
                        alt="Foto do colaborador"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-foreground text-[10px] font-bold">
                        Ampliar Foto
                      </div>
                    </button>
                  ) : (
                    <div
                      className="relative w-24 h-28 rounded-xl border-2 border-dashed border-[var(--ui-border)] bg-[var(--ui-raised)]/60 flex flex-col items-center justify-center text-center p-2 shrink-0 group hover:border-[var(--ui-accent)]/50 transition-colors"
                      title="Foto não disponível"
                    >
                      <div className="w-8 h-8 rounded-full bg-[var(--ui-surface)] border border-[var(--ui-border)] flex items-center justify-center text-zinc-400 group-hover:text-[var(--ui-accent)] transition-colors mb-1 shadow-sm">
                        <Camera className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-medium text-zinc-400 leading-tight">
                        Foto não disponível
                      </span>
                    </div>
                  )}

                  {/* Detalhes do Restaurante e Horário */}
                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium font-mono">
                        <Clock className="w-3.5 h-3.5 text-[var(--ui-accent)] shrink-0" />
                        <span>
                          {dateFormatted} às <strong className="text-foreground">{timeFormatted}</strong>
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-foreground dark:text-foreground text-zinc-900 truncate mt-1.5" title={p.client?.nome || 'Sede Agência'}>
                        {p.client?.nome || 'Local do ponto'}
                      </h4>

                      <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 shrink-0" /><PontoStreet ponto={p} />
                      </div>
                    </div>

                    {/* Badge de Validação de Geolocalização */}
                    <div className="mt-2.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border ${
                          isInside
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {isInside ? (
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                        )}
                        <span>
                          {isInside
                            ? `No local (${formatDistance(p.distancia_metros)})`
                            : p.status_localizacao === 'manual' ? 'Sem validação de raio' : `Fora do raio (${formatDistance(p.distancia_metros)})`}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Observação (se houver) ou Espaço Simétrico */}
                <div className="px-4 pb-3 flex-1 flex flex-col justify-end">
                  {p.observacao ? (
                    <p className="text-[11px] text-zinc-300 dark:text-zinc-300 text-zinc-600 bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-50 p-2.5 rounded-xl border border-[var(--ui-border)] italic leading-relaxed line-clamp-2">
                      &quot;{p.observacao}&quot;
                    </p>
                  ) : (
                    <div className="text-[11px] text-zinc-500 bg-[var(--ui-raised)]/40 p-2.5 rounded-xl border border-dashed border-[var(--ui-border)]/50 italic text-center">
                      Sem observações adicionais
                    </div>
                  )}
                </div>

                {/* Rodapé: Link Mapa e Hash de Segurança */}
                <div className="px-4 py-2.5 bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-slate-50 border-t border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-100 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span className="truncate"><PontoStreet ponto={p} /></span>
                  <a
                    href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#38bdf8] hover:underline flex items-center gap-1 font-sans font-semibold"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISUALIZAÇÃO EM TABELA DE AUDITORIA */
        <div className="w-full bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white rounded-2xl border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs min-w-[800px]">
              <thead>
                <tr className="border-b border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-slate-50 text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Foto</th>
                  <th className="py-3 px-4">Colaborador</th>
                  <th className="py-3 px-4">Batida</th>
                  <th className="py-3 px-4">Horário Exato</th>
                  <th className="py-3 px-4">Restaurante / Local</th>
                  <th className="py-3 px-4">Geolocalização (GPS)</th>
                  <th className="py-3 px-4">Mapa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ui-border)] dark:divide-[var(--ui-border)] divide-slate-100">
                {filteredPontos.map((p) => {
                  const isInside = p.status_localizacao === 'no_local';
                  const dateObj = new Date(p.data_hora);
                  const dateStr = dateObj.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                  const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/Sao_Paulo' });

                  return (
                    <tr key={p.id} className="hover:bg-[var(--ui-raised)] transition-colors">
                      <td className="py-2.5 px-4">
                        {p.foto_url ? (
                          <button type="button" aria-label={`Ampliar foto de ${p.employee?.nome || p.employee_id}`}
                            onClick={() =>
                              setZoomPhoto({
                                url: p.foto_url,
                                nome: p.employee?.nome || 'Membro',
                                dataHora: `${dateStr} às ${timeStr}`,
                              })
                            }
                            className="rounded-xl cursor-pointer">
                            <img src={p.foto_url} alt={`Foto do ponto de ${p.employee?.nome || p.employee_id}`}
                              className="w-14 h-14 rounded-xl object-cover border border-[var(--ui-border)]" />
                          </button>
                        ) : (
                          <div
                            className="w-10 h-10 rounded-xl border border-dashed border-[var(--ui-border)] bg-[var(--ui-raised)] flex items-center justify-center text-zinc-400"
                            title="Foto não disponível"
                          >
                            <Camera className="w-4 h-4 text-zinc-400" />
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-foreground">
                        {p.employee ? <EmployeeBadge employee={p.employee} size="sm" showRole /> : <span>{p.employee_id}</span>}
                      </td>
                      <td className="py-2.5 px-4">
                        {p.tipo === 'entrada' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Entrada
                          </span>
                        )}
                        {p.tipo === 'almoco' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Almoço
                          </span>
                        )}
                        {p.tipo === 'saida' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Saída
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-300">
                        <div className="font-medium text-foreground">{dateStr}</div>
                        <div className="text-[11px] text-emerald-400 font-mono font-bold">{timeStr}</div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-foreground truncate max-w-[180px]">
                          {p.client?.nome || 'Local do ponto'}
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate max-w-[180px]">
                          <PontoStreet ponto={p} />
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${
                            isInside
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {isInside ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                          )}
                          <span>
                            {isInside
                              ? `No local (${formatDistance(p.distancia_metros)})`
                              : p.status_localizacao === 'manual' ? 'Sem validação de raio' : `Fora do raio (${formatDistance(p.distancia_metros)})`}
                          </span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <a
                          href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#38bdf8] hover:underline"
                        >
                          <PontoStreet ponto={p} />
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MODAL DE ZOOM DE FOTO */}
      {zoomPhoto && (
        <div
          role="dialog" aria-modal="true" aria-labelledby="ponto-photo-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setZoomPhoto(null)}
        >
          <div
            className="relative max-w-md w-full bg-[var(--ui-surface)] rounded-3xl border border-[var(--ui-border)] p-5 flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 id="ponto-photo-title" className="text-base font-bold text-foreground font-heading">{zoomPhoto.nome}</h4>
                <p className="text-xs text-zinc-400">{zoomPhoto.dataHora}</p>
              </div>
              <button
                type="button"
                ref={closePhotoRef}
                aria-label="Fechar foto"
                onClick={() => setZoomPhoto(null)}
                className="p-1 rounded-xl text-zinc-400 hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-[var(--ui-border)] shadow-inner bg-black">
              <img
                src={zoomPhoto.url}
                alt="Zoom Selfie"
                className="w-full h-auto max-h-[70vh] object-contain mx-auto"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                Foto registrada no ponto
              </span>
              <button
                type="button"
                onClick={() => setZoomPhoto(null)}
                className="text-xs font-semibold text-zinc-400 hover:text-foreground"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
