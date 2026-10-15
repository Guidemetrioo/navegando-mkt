'use client';

import React, { useState } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { MediaDeliverable, DeliverableStatus, DeliverableFormat } from '@/types/database';
import { EmployeeBadge } from '../agenda/EmployeeBadge';
import {
  FolderOpen,
  Plus,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Video,
  FileText,
  Upload,
  Play,
  Trash2,
  Eye,
  Check,
  Building,
  Copy,
  Edit,
  Kanban,
  LayoutGrid,
  ShieldAlert,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';

const KANBAN_COLUMNS: { id: DeliverableStatus; title: string; color: string; border: string; bg: string }[] = [
  { id: 'captado_raw', title: 'Bruto RAW', color: 'text-zinc-300', border: 'border-zinc-700', bg: 'bg-zinc-800/40' },
  { id: 'em_edicao', title: 'Em Edição', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
  { id: 'aguardando_aprovacao', title: 'Aguardando Cliente', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
  { id: 'ajustes_solicitados', title: 'Ajustes Pedidos', color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10' },
  { id: 'aprovado', title: 'Aprovado ✓', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  { id: 'publicado', title: 'Publicado 🚀', color: 'text-sky-400', border: 'border-sky-500/30', bg: 'bg-sky-500/10' },
];

export function FilesDeliverablesView() {
  const {
    deliverables,
    clients,
    employees,
    openDeliverableModal,
    openEditDeliverableModal,
    updateDeliverableStatus,
    deleteDeliverable,
    toast,
  } = useAgenda();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  const [onlyMissingDrive, setOnlyMissingDrive] = useState(false);

  const filteredDeliverables = deliverables.filter((d) => {
    if (onlyMissingDrive && d.drive_url && d.pasta_drive_url) return false;
    if (selectedStatus !== 'all' && d.status !== selectedStatus) return false;
    if (selectedClientId !== 'all' && d.client_id !== selectedClientId) return false;
    if (selectedFormat !== 'all' && d.formato !== selectedFormat) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = d.titulo.toLowerCase().includes(q);
      const matchClient = d.client?.nome.toLowerCase().includes(q);
      const matchDesc = d.descricao?.toLowerCase().includes(q);
      if (!matchTitle && !matchClient && !matchDesc) return false;
    }
    return true;
  });

  const getStatusBadge = (status: DeliverableStatus) => {
    switch (status) {
      case 'captado_raw':
        return { label: 'Bruto RAW', color: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
      case 'em_edicao':
        return { label: 'Em Edição', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
      case 'aguardando_aprovacao':
        return { label: 'Aguardando Cliente', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
      case 'ajustes_solicitados':
        return { label: 'Ajustes Pedidos', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
      case 'aprovado':
        return { label: 'Aprovado ✓', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
      case 'publicado':
        return { label: 'Publicado 🚀', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30' };
    }
  };

  const getFormatLabel = (formato: DeliverableFormat) => {
    switch (formato) {
      case 'reels_9_16':
        return 'Reels (9:16)';
      case 'feed_post':
        return 'Feed Post';
      case 'carrossel':
        return 'Carrossel';
      case 'stories':
        return 'Stories';
      case 'fotos_menu':
        return 'Fotos Menu';
      case 'bruto_raw':
        return 'Brutos RAW';
    }
  };

  const handleCopyLink = (url?: string) => {
    if (!url) {
      toast('Nenhum link cadastrado para este arquivo.', 'warning');
      return;
    }
    navigator.clipboard.writeText(url);
    toast('Link copiado para a área de transferência!', 'success');
  };

  // Quick stats
  const countRaw = deliverables.filter((d) => d.status === 'captado_raw').length;
  const countEditing = deliverables.filter((d) => d.status === 'em_edicao').length;
  const countPendingClient = deliverables.filter((d) => d.status === 'aguardando_aprovacao').length;
  const countApproved = deliverables.filter((d) => d.status === 'aprovado' || d.status === 'publicado').length;
  const countMissingDrive = deliverables.filter((d) => !d.drive_url && !d.pasta_drive_url).length;

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. HEADER DA CENTRAL DE ARQUIVOS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[#16171b] border border-[#26282f] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">
                Central de Arquivos & Entregáveis (DAM)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Anti-Perda de Arquivos
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Catálogo de vídeos brutos, pastas do Google Drive, histórico de versões e aprovações de clientes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Alternador de Visualização (Grade vs Kanban) */}
          <div className="inline-flex p-1 bg-[#1a1b20] rounded-xl border border-[#26282f] gap-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#FF5A3C] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Visualização em Grade"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grade</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'kanban' ? 'bg-[#FF5A3C] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Pipeline / Funil de Produção"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pipeline</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => openDeliverableModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF5A3C] hover:bg-[#e04a2f] text-white font-bold text-xs shadow-lg shadow-[#FF5A3C]/20 transition-all hover:scale-105 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Arquivo / Vídeo</span>
          </button>
        </div>
      </div>

      {/* 2. STATS RÁPIDOS DA OPERAÇÃO DE VÍDEO */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#16171b] border border-[#26282f] flex flex-col justify-between">
          <span className="text-[10px] text-zinc-400 uppercase font-semibold">Total de Peças</span>
          <span className="text-xl font-bold text-white mt-1">{deliverables.length}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#16171b] border border-[#26282f] flex flex-col justify-between">
          <span className="text-[10px] text-zinc-400 uppercase font-semibold">Brutos Gravados</span>
          <span className="text-xl font-bold text-zinc-300 mt-1">{countRaw}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#16171b] border border-[#26282f] flex flex-col justify-between">
          <span className="text-[10px] text-purple-400 uppercase font-semibold">Em Edição</span>
          <span className="text-xl font-bold text-purple-400 mt-1">{countEditing}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#16171b] border border-[#26282f] flex flex-col justify-between">
          <span className="text-[10px] text-amber-400 uppercase font-semibold">Aguardando Cliente</span>
          <span className="text-xl font-bold text-amber-400 mt-1">{countPendingClient}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#16171b] border border-[#26282f] flex flex-col justify-between">
          <span className="text-[10px] text-emerald-400 uppercase font-semibold">Aprovados / Publicados</span>
          <span className="text-xl font-bold text-emerald-400 mt-1">{countApproved}</span>
        </div>
      </div>

      {/* 3. BARRA DE PESQUISA & FILTROS */}
      <div className="p-4 rounded-2xl bg-[#16171b] border border-[#26282f] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Campo de Busca */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título do vídeo, prato, restaurante ou briefing..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1c1d22] border border-[#2b2d35] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#FF5A3C]"
          />
        </div>

        {/* Dropdowns de Filtro */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-[#1f2026] text-zinc-200 border border-[#2b2d35] rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="captado_raw">📥 Bruto RAW</option>
            <option value="em_edicao">✂️ Em Edição</option>
            <option value="aguardando_aprovacao">⏳ Aguardando Aprovação</option>
            <option value="ajustes_solicitados">⚠️ Ajustes Solicitados</option>
            <option value="aprovado">✅ Aprovado</option>
            <option value="publicado">🚀 Publicado</option>
          </select>

          {/* Restaurante */}
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="text-xs bg-[#1f2026] text-zinc-200 border border-[#2b2d35] rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="all">Todos os Restaurantes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>

          {/* Formato */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="text-xs bg-[#1f2026] text-zinc-200 border border-[#2b2d35] rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="all">Todos os Formatos</option>
            <option value="reels_9_16">Reels (9:16)</option>
            <option value="feed_post">Feed Post</option>
            <option value="carrossel">Carrossel</option>
            <option value="stories">Stories</option>
            <option value="fotos_menu">Fotos Menu</option>
            <option value="bruto_raw">Brutos RAW</option>
          </select>

          {/* Toggle de Auditoria Anti-Perda */}
          <button
            type="button"
            onClick={() => setOnlyMissingDrive(!onlyMissingDrive)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              onlyMissingDrive
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                : 'bg-[#1f2026] text-zinc-400 border-[#2b2d35] hover:text-white'
            }`}
            title="Exibe arquivos sem link de Drive cadastrado"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Sem Drive ({countMissingDrive})</span>
          </button>
        </div>
      </div>

      {/* 4. VISUALIZAÇÃO KANBAN / PIPELINE DE PRODUÇÃO */}
      {viewMode === 'kanban' && (
        <div className="w-full overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1100px]">
            {KANBAN_COLUMNS.map((col) => {
              const colItems = filteredDeliverables.filter((d) => d.status === col.id);

              return (
                <div
                  key={col.id}
                  className="flex-1 flex flex-col gap-3 p-3.5 rounded-3xl bg-[#141519] border border-[#26282f] min-w-[220px]"
                >
                  {/* Cabeçalho da Coluna */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#26282f]">
                    <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                      {col.title}
                    </span>
                    <span className="text-[11px] font-mono font-bold bg-[#1e2026] text-zinc-300 px-2 py-0.5 rounded-full border border-[#2b2d35]">
                      {colItems.length}
                    </span>
                  </div>

                  {/* Lista de Cards da Coluna */}
                  <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[700px] custom-scrollbar">
                    {colItems.length === 0 ? (
                      <div className="py-8 text-center text-zinc-600 text-xs italic">
                        Nenhum item nesta etapa
                      </div>
                    ) : (
                      colItems.map((item) => {
                        const client = clients.find((c) => c.id === item.client_id);
                        return (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-2xl bg-[#1a1b20] border border-[#2b2d35] hover:border-[#FF5A3C]/40 transition-all flex flex-col gap-2.5 shadow-sm group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10px] font-bold text-[#FF5A3C] uppercase truncate flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                {client?.nome}
                              </span>
                              <span className="text-[9px] font-mono font-bold bg-white/10 px-1.5 py-0.2 rounded text-zinc-300">
                                v{item.versao}
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-white line-clamp-2">
                              {item.titulo}
                            </h4>

                            {item.observacoes_ajuste && (
                              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300 line-clamp-2">
                                <strong>Ajuste:</strong> {item.observacoes_ajuste}
                              </div>
                            )}

                            {/* Links e Ações Rápidas */}
                            <div className="pt-2 border-t border-[#26282f] flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1">
                                {item.drive_url && (
                                  <a
                                    href={item.drive_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded-lg bg-[#26282f] text-[#38bdf8] hover:bg-[#32353e] transition-colors"
                                    title="Abrir Vídeo no Drive"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                {item.pasta_drive_url && (
                                  <a
                                    href={item.pasta_drive_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded-lg bg-[#26282f] text-amber-400 hover:bg-[#32353e] transition-colors"
                                    title="Pasta de Brutos RAW"
                                  >
                                    <FolderOpen className="w-3 h-3" />
                                  </a>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditDeliverableModal(item)}
                                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#26282f] transition-colors cursor-pointer"
                                  title="Editar Arquivo / Versão"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                {col.id === 'aguardando_aprovacao' && (
                                  <button
                                    type="button"
                                    onClick={() => updateDeliverableStatus(item.id, 'aprovado')}
                                    className="px-2 py-0.5 rounded-lg bg-emerald-500 text-white font-bold text-[10px] cursor-pointer"
                                    title="Aprovar vídeo"
                                  >
                                    Aprovar ✓
                                  </button>
                                )}
                                {col.id === 'aprovado' && (
                                  <button
                                    type="button"
                                    onClick={() => updateDeliverableStatus(item.id, 'publicado')}
                                    className="px-2 py-0.5 rounded-lg bg-sky-500 text-white font-bold text-[10px] cursor-pointer"
                                    title="Marcar como publicado"
                                  >
                                    Postar 🚀
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. VISUALIZAÇÃO EM GRADE VISUAL DE CARDS */}
      {viewMode === 'grid' && (
        <>
          {filteredDeliverables.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-[#16171b] border border-[#26282f] p-8 flex flex-col items-center gap-3">
              <FolderOpen className="w-12 h-12 text-zinc-500 animate-pulse" />
              <h4 className="text-base font-bold text-zinc-200">Nenhum arquivo ou vídeo encontrado</h4>
              <p className="text-xs text-zinc-400 max-w-md">
                Nenhum entregável corresponde aos filtros selecionados. Clique em &quot;Novo Arquivo / Vídeo&quot; para registrar novos links do Drive.
              </p>
              <button
                type="button"
                onClick={() => openDeliverableModal()}
                className="mt-2 px-4 py-2 rounded-xl bg-[#FF5A3C] text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Cadastrar primeiro arquivo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDeliverables.map((deliv) => {
                const badge = getStatusBadge(deliv.status);
                const client = clients.find((c) => c.id === deliv.client_id);
                const filmmaker = employees.find((e) => e.id === deliv.filmmaker_id);
                const criadora = employees.find((e) => e.id === deliv.criadora_id);
                const hasDriveLink = Boolean(deliv.drive_url || deliv.pasta_drive_url);

                return (
                  <div
                    key={deliv.id}
                    className="bg-[#16171b] rounded-3xl border border-[#26282f] overflow-hidden shadow-sm hover:border-[#FF5A3C]/40 transition-all flex flex-col justify-between"
                  >
                    {/* Thumbnail / Header */}
                    <div className="relative h-44 bg-[#121316] overflow-hidden group">
                      {deliv.thumbnail_url ? (
                        <img
                          src={deliv.thumbnail_url}
                          alt={deliv.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                          <Video className="w-10 h-10" />
                          <span className="text-xs">Sem miniatura</span>
                        </div>
                      )}

                      {/* Overlay gradiente */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                      {/* Badges superiores */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-white border border-white/10 uppercase tracking-wider">
                          {getFormatLabel(deliv.formato)}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* Versão e Restaurante inferiores na imagem */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                        <span className="font-bold text-xs flex items-center gap-1.5 drop-shadow">
                          <Building className="w-3.5 h-3.5 text-[#FF5A3C]" />
                          <span>{client?.nome}</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                          v{deliv.versao}
                        </span>
                      </div>
                    </div>

                    {/* Conteúdo do Card */}
                    <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm text-white line-clamp-2">
                            {deliv.titulo}
                          </h3>
                          <button
                            type="button"
                            onClick={() => openEditDeliverableModal(deliv)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1f2026] transition-colors cursor-pointer shrink-0"
                            title="Editar Arquivo / Informações"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {deliv.descricao && (
                          <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                            {deliv.descricao}
                          </p>
                        )}
                      </div>

                      {/* Dupla que gravou */}
                      <div className="pt-2 border-t border-[#26282f] flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 font-semibold uppercase">
                          Equipe de Produção:
                        </span>
                        <div className="flex items-center gap-1.5">
                          {filmmaker && <EmployeeBadge employee={filmmaker} size="sm" />}
                          {criadora && <EmployeeBadge employee={criadora} size="sm" />}
                        </div>
                      </div>

                      {/* Observação de Ajuste (se houver) */}
                      {deliv.observacoes_ajuste && (
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
                          <strong>Ajuste Solicitado:</strong> {deliv.observacoes_ajuste}
                        </div>
                      )}

                      {/* Links do Google Drive (Anti-Perda) */}
                      <div className="pt-2 border-t border-[#26282f] flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          {deliv.drive_url ? (
                            <div className="flex items-center gap-1.5">
                              <a
                                href={deliv.drive_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#1f2026] hover:bg-[#282a32] text-[#38bdf8] text-xs font-semibold border border-[#2b2d35] transition-colors"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Vídeo Final</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopyLink(deliv.drive_url)}
                                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1f2026] transition-colors cursor-pointer"
                                title="Copiar link do vídeo"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Sem link do vídeo
                            </span>
                          )}

                          {deliv.pasta_drive_url ? (
                            <a
                              href={deliv.pasta_drive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#1f2026] hover:bg-[#282a32] text-amber-400 text-xs font-semibold border border-[#2b2d35] transition-colors"
                              title="Pasta com todos os brutos da câmera"
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                              <span>Brutos RAW</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-zinc-500 italic">
                              Sem pasta RAW
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ações de Status e Exclusão */}
                      <div className="pt-2 border-t border-[#26282f] flex items-center justify-between gap-2">
                        {/* Botão de Solicitar Ajuste rápido */}
                        {deliv.status === 'aguardando_aprovacao' && (
                          <button
                            type="button"
                            onClick={() => {
                              const note = prompt('Informe a nota de ajuste solicitada pelo cliente:');
                              if (note !== null) {
                                updateDeliverableStatus(deliv.id, 'ajustes_solicitados', note);
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold transition-all border border-rose-500/30 cursor-pointer"
                          >
                            Pedir Ajuste
                          </button>
                        )}

                        <div className="flex items-center gap-1.5 ml-auto">
                          {deliv.status === 'aguardando_aprovacao' && (
                            <button
                              type="button"
                              onClick={() => updateDeliverableStatus(deliv.id, 'aprovado')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                              title="Aprovar vídeo"
                            >
                              Aprovar ✓
                            </button>
                          )}
                          {deliv.status === 'aprovado' && (
                            <button
                              type="button"
                              onClick={() => updateDeliverableStatus(deliv.id, 'publicado')}
                              className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                              title="Marcar como publicado no Instagram"
                            >
                              Publicar 🚀
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Deseja remover o arquivo "${deliv.titulo}"?`)) {
                                deleteDeliverable(deliv.id);
                              }
                            }}
                            className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Excluir arquivo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
