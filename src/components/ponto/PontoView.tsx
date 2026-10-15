'use client';

import React, { useState } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { PontoRegistro } from '@/types/database';
import { EmployeeBadge } from '../agenda/EmployeeBadge';
import { formatDistance, MAX_GEOFENCE_RADIUS_METERS } from '@/lib/geo-utils';
import { LiveLocationRadar } from './LiveLocationRadar';
import {
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Building,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Search,
  LayoutGrid,
  List,
  X,
  UserCheck,
} from 'lucide-react';

export function PontoView() {
  const {
    pontos,
    employees,
    clients,
    openPontoModal,
    loggedEmployeeId,
    userRole,
  } = useAgenda();

  const [selectedFilterEmpId, setSelectedFilterEmpId] = useState<string>('all');
  const [selectedFilterClientId, setSelectedFilterClientId] = useState<string>('all');
  const [selectedFilterTipo, setSelectedFilterTipo] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'cards' | 'tabela'>('cards');
  const [zoomPhoto, setZoomPhoto] = useState<{ url: string; nome: string; dataHora: string } | null>(null);

  // Filtragem dos pontos
  const filteredPontos = pontos.filter((p) => {
    if (selectedFilterEmpId !== 'all' && p.employee_id !== selectedFilterEmpId) return false;
    if (selectedFilterClientId !== 'all' && p.client_id !== selectedFilterClientId) return false;
    if (selectedFilterTipo !== 'all' && p.tipo !== selectedFilterTipo) return false;
    return true;
  });

  // KPIs
  const totalPontos = pontos.length;
  const entradasNoLocal = pontos.filter(
    (p) => p.tipo === 'entrada' && p.status_localizacao === 'no_local'
  ).length;
  const pontosHoje = pontos.filter((p) => p.data_hora.startsWith('2026-10-14')).length;
  const foraDoRaio = pontos.filter((p) => p.status_localizacao === 'fora_do_raio').length;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 0. Radar de Localização Real com Permissão do Dispositivo & Mapa */}
      <LiveLocationRadar />

      {/* 1. Header com KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* KPI 1 */}
        <div className="p-4 rounded-2xl bg-[#16171b] dark:bg-[#16171b] bg-white border border-[#26282f] dark:border-[#26282f] border-slate-200 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
            <span>Pontos Registrados</span>
            <Clock className="w-4 h-4 text-[#FF5A3C]" />
          </div>
          <div className="text-2xl font-bold text-white dark:text-white text-zinc-900 font-heading mt-1">
            {totalPontos}
          </div>
          <span className="text-[11px] text-zinc-500">Histórico da equipe na rua</span>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-2xl bg-[#16171b] dark:bg-[#16171b] bg-white border border-[#26282f] dark:border-[#26282f] border-slate-200 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
            <span>Validados no Local</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white dark:text-white text-zinc-900 font-heading mt-1">
            {entradasNoLocal}
          </div>
          <span className="text-[11px] text-zinc-500">&lt; {MAX_GEOFENCE_RADIUS_METERS}m do restaurante</span>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-2xl bg-[#16171b] dark:bg-[#16171b] bg-white border border-[#26282f] dark:border-[#26282f] border-slate-200 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#38bdf8]">
            <span>Registros Hoje</span>
            <Calendar className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div className="text-2xl font-bold text-white dark:text-white text-zinc-900 font-heading mt-1">
            {pontosHoje}
          </div>
          <span className="text-[11px] text-zinc-500">Filmmakers & Criadoras</span>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-2xl bg-[#16171b] dark:bg-[#16171b] bg-white border border-[#26282f] dark:border-[#26282f] border-slate-200 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
            <span>Fora do Raio</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white dark:text-white text-zinc-900 font-heading mt-1">
            {foraDoRaio}
          </div>
          <span className="text-[11px] text-zinc-500">Alertas de auditoria</span>
        </div>
      </div>

      {/* 2. Barra de Controle: Filtros e Botão de Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#16171b] dark:bg-[#16171b] bg-white rounded-2xl border border-[#26282f] dark:border-[#26282f] border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro por Membro */}
          <select
            value={selectedFilterEmpId}
            onChange={(e) => setSelectedFilterEmpId(e.target.value)}
            className="text-xs bg-[#1f2026] text-zinc-200 border border-[#2b2d35] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#FF5A3C]"
          >
            <option value="all">Toda a equipe ({employees.length})</option>
            <optgroup label="🎥 Filmmakers">
              {employees
                .filter((e) => e.funcao === 'filmmaker')
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome} (Filmmaker)
                  </option>
                ))}
            </optgroup>
            <optgroup label="✨ Meninas dos Vídeos">
              {employees
                .filter((e) => e.funcao === 'criadora')
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome} (Criadora)
                  </option>
                ))}
            </optgroup>
          </select>

          {/* Filtro por Restaurante */}
          <select
            value={selectedFilterClientId}
            onChange={(e) => setSelectedFilterClientId(e.target.value)}
            className="text-xs bg-[#1f2026] text-zinc-200 border border-[#2b2d35] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#FF5A3C]"
          >
            <option value="all">Todos os Restaurantes ({clients.length})</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>

          {/* Filtro por Tipo */}
          <select
            value={selectedFilterTipo}
            onChange={(e) => setSelectedFilterTipo(e.target.value)}
            className="text-xs bg-[#1f2026] text-zinc-200 border border-[#2b2d35] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#FF5A3C]"
          >
            <option value="all">Entradas & Saídas</option>
            <option value="entrada">🟢 Apenas Entradas</option>
            <option value="saida">🔴 Apenas Saídas</option>
          </select>
        </div>

        {/* Lado Direito: Alternador de Visualização & Botão Bater Ponto */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Seletor Cards / Tabela */}
          <div className="flex items-center p-1 bg-[#1f2026] rounded-xl border border-[#2b2d35] text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('cards')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'cards' ? 'bg-[#FF5A3C] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tabela')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'tabela' ? 'bg-[#FF5A3C] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
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
            className="flex items-center gap-1.5 bg-[#FF5A3C] hover:bg-[#e04a2f] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-[#FF5A3C]/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Bater Ponto Agora</span>
          </button>
        </div>
      </div>

      {/* 3. CONTEÚDO PRINCIPAL (Cards ou Tabela) */}
      {filteredPontos.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#16171b] border border-[#26282f] p-8 flex flex-col items-center gap-3">
          <Camera className="w-10 h-10 text-zinc-500 animate-pulse" />
          <h4 className="text-base font-bold text-zinc-200">Nenhum registro de ponto encontrado</h4>
          <p className="text-xs text-zinc-500 max-w-sm">
            Nenhum ponto registrado para os filtros selecionados. Clique em &quot;Bater Ponto Agora&quot; para registrar uma nova entrada com foto e GPS.
          </p>
          <button
            type="button"
            onClick={() => openPontoModal()}
            className="mt-2 text-xs font-bold text-[#FF5A3C] hover:underline"
          >
            Registrar ponto agora
          </button>
        </div>
      ) : activeTab === 'cards' ? (
        /* VISUALIZAÇÃO EM CARDS / COMPROVANTES */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPontos.map((p) => {
            const isEntry = p.tipo === 'entrada';
            const isInside = p.status_localizacao === 'no_local';
            const dateObj = new Date(p.data_hora);
            const dateFormatted = dateObj.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
            });
            const timeFormatted = dateObj.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={p.id}
                className="bg-[#16171b] dark:bg-[#16171b] bg-white rounded-2xl border border-[#26282f] dark:border-[#26282f] border-slate-200 overflow-hidden shadow-sm hover:border-[#FF5A3C]/40 transition-all flex flex-col justify-between"
              >
                {/* Header do Cartão */}
                <div className="p-4 pb-3 flex items-start justify-between border-b border-[#26282f] dark:border-[#26282f] border-slate-100">
                  <div className="flex items-center gap-2.5">
                    {p.employee && <EmployeeBadge employee={p.employee} size="md" showRole />}
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isEntry
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-[#FF5A3C]/15 text-[#FF5A3C] border border-[#FF5A3C]/30'
                    }`}
                  >
                    {isEntry ? '🟢 Entrada' : '🔴 Saída'}
                  </span>
                </div>

                {/* Corpo: Foto e Detalhes */}
                <div className="p-4 flex gap-3.5">
                  {/* Foto / Selfie clicável */}
                  <div
                    className="relative w-24 h-28 rounded-xl overflow-hidden shrink-0 cursor-pointer border border-[#2b2d35] group"
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
                      alt="Selfie"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                      Ampliar 🔍
                    </div>
                  </div>

                  {/* Detalhes do Restaurante e Horário */}
                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
                        <Clock className="w-3 h-3 text-[#FF5A3C]" />
                        <span>
                          {dateFormatted} às <strong>{timeFormatted}</strong>
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white dark:text-white text-zinc-900 truncate mt-1">
                        {p.client?.nome || 'Restaurante'}
                      </h4>

                      {p.endereco ? (
                        <div className="text-[11px] text-zinc-300 truncate flex items-center gap-1 mt-0.5" title={p.endereco}>
                          <MapPin className="w-3 h-3 text-[#FF5A3C] shrink-0" />
                          <span className="truncate">{p.endereco}</span>
                        </div>
                      ) : p.client?.endereco ? (
                        <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span>{p.client.endereco}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Badge de Validação de Geolocalização */}
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${
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
                            : `Fora do raio (${formatDistance(p.distancia_metros)})`}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Observação (se houver) */}
                {p.observacao && (
                  <div className="px-4 pb-3">
                    <p className="text-[11px] text-zinc-400 bg-[#1f2026] dark:bg-[#1f2026] bg-slate-50 p-2 rounded-xl border border-[#2b2d35] italic">
                      &quot;{p.observacao}&quot;
                    </p>
                  </div>
                )}

                {/* Rodapé: Link Mapa e Hash de Segurança */}
                <div className="px-4 py-2.5 bg-[#121316] dark:bg-[#121316] bg-slate-50 border-t border-[#26282f] dark:border-[#26282f] border-slate-100 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span className="truncate">GPS: {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}</span>
                  <a
                    href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#38bdf8] hover:underline flex items-center gap-0.5"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISUALIZAÇÃO EM TABELA DE AUDITORIA */
        <div className="w-full bg-[#16171b] dark:bg-[#16171b] bg-white rounded-2xl border border-[#26282f] dark:border-[#26282f] border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs min-w-[800px]">
              <thead>
                <tr className="border-b border-[#26282f] dark:border-[#26282f] border-slate-200 bg-[#121316] dark:bg-[#121316] bg-slate-50 text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Foto</th>
                  <th className="py-3 px-4">Membro</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Data / Horário</th>
                  <th className="py-3 px-4">Restaurante</th>
                  <th className="py-3 px-4">Geolocalização (GPS)</th>
                  <th className="py-3 px-4">Mapa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26282f] dark:divide-[#26282f] divide-slate-100">
                {filteredPontos.map((p) => {
                  const isEntry = p.tipo === 'entrada';
                  const isInside = p.status_localizacao === 'no_local';
                  const dateObj = new Date(p.data_hora);
                  const dateStr = dateObj.toLocaleDateString('pt-BR');
                  const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr key={p.id} className="hover:bg-[#1a1b20] transition-colors">
                      <td className="py-2.5 px-4">
                        <img
                          src={p.foto_url}
                          alt="Foto"
                          onClick={() =>
                            setZoomPhoto({
                              url: p.foto_url,
                              nome: p.employee?.nome || 'Membro',
                              dataHora: `${dateStr} às ${timeStr}`,
                            })
                          }
                          className="w-10 h-10 rounded-xl object-cover border border-[#2b2d35] cursor-pointer hover:scale-110 transition-transform shadow"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-white">
                        {p.employee && <EmployeeBadge employee={p.employee} size="sm" showRole />}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isEntry
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-[#FF5A3C]/15 text-[#FF5A3C] border border-[#FF5A3C]/30'
                          }`}
                        >
                          {isEntry ? '🟢 Entrada' : '🔴 Saída'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-zinc-300">
                        <div>{dateStr}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{timeStr}</div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-white truncate max-w-[180px]">
                          {p.client?.nome || 'Restaurante'}
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate max-w-[180px]">
                          {p.client?.endereco || ''}
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
                              : `Fora do raio (${formatDistance(p.distancia_metros)})`}
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
                          <span>Ver</span>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setZoomPhoto(null)}
        >
          <div
            className="relative max-w-md w-full bg-[#16171b] rounded-3xl border border-[#2b2d35] p-5 flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-white font-heading">{zoomPhoto.nome}</h4>
                <p className="text-xs text-zinc-400">{zoomPhoto.dataHora}</p>
              </div>
              <button
                type="button"
                onClick={() => setZoomPhoto(null)}
                className="p-1 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-[#2b2d35] shadow-inner bg-black">
              <img
                src={zoomPhoto.url}
                alt="Zoom Selfie"
                className="w-full h-auto max-h-[70vh] object-contain mx-auto"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                Comprovação facial original
              </span>
              <button
                type="button"
                onClick={() => setZoomPhoto(null)}
                className="text-xs font-semibold text-zinc-400 hover:text-white"
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
