'use client';

import React, { useState } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { Client } from '@/types/database';
import {
  Building,
  Plus,
  Search,
  ExternalLink,
  MapPin,
  Phone,
  User,
  FolderOpen,
  Camera,
  Calendar,
  Edit,
  Trash2,
  Video,
  Copy,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

import { ClientDossierModal } from '../modals/ClientDossierModal';

export function ClientsView() {
  const {
    clients,
    events,
    deliverables,
    openClientModal,
    deleteClient,
    openDeliverableModal,
    openPontoModal,
    openNewEventModal,
    toast,
  } = useAgenda();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'ativo' | 'onboarding' | 'pausado'>('all');
  const [onlyMissingFolder, setOnlyMissingFolder] = useState(false);
  const [dossierClient, setDossierClient] = useState<Client | null>(null);

  const filteredClients = clients.filter((c) => {
    if (onlyMissingFolder && c.drive_folder_url) return false;
    if (selectedStatusFilter !== 'all' && (c.status || 'ativo') !== selectedStatusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = c.nome.toLowerCase().includes(q);
      const matchInsta = c.instagram_handle?.toLowerCase().includes(q);
      const matchEnd = c.endereco?.toLowerCase().includes(q);
      const matchResp = c.responsavel?.toLowerCase().includes(q);
      const matchPlano = c.plano?.toLowerCase().includes(q);
      if (!matchName && !matchInsta && !matchEnd && !matchResp && !matchPlano) return false;
    }
    return true;
  });

  const handleCopyFolder = (url?: string) => {
    if (!url) {
      toast('Este restaurante ainda não possui pasta no Drive.', 'warning');
      return;
    }
    navigator.clipboard.writeText(url);
    toast('Link da pasta do Google Drive copiado!', 'success');
  };

  const getWhatsAppLink = (phone?: string) => {
    if (!phone) return null;
    const clean = phone.replace(/\D/g, '');
    if (!clean) return null;
    const number = clean.startsWith('55') ? clean : `55${clean}`;
    return `https://wa.me/${number}`;
  };

  const missingFolderCount = clients.filter((c) => !c.drive_folder_url).length;
  const activeCount = clients.filter((c) => !c.status || c.status === 'ativo').length;
  const onboardingCount = clients.filter((c) => c.status === 'onboarding').length;

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[#16171b] border border-[#26282f] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5A3C]/10 text-[#FF5A3C] border border-[#FF5A3C]/20 flex items-center justify-center shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">
                CRM de Restaurantes ({clients.length})
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {activeCount} Ativos
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Gestão de clientes gastronômicos, contratos, metas de Reels, pastas do Drive e contatos dos gerentes.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openClientModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF5A3C] hover:bg-[#e04a2f] text-white font-bold text-xs shadow-lg shadow-[#FF5A3C]/20 transition-all hover:scale-105 cursor-pointer self-start sm:self-auto whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo Restaurante</span>
        </button>
      </div>

      {/* 2. CAMPO DE BUSCA & FILTROS */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por restaurante, bairro, @ do Instagram, gerente ou plano..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#16171b] border border-[#26282f] rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#FF5A3C]"
            />
          </div>

          {missingFolderCount > 0 && (
            <button
              type="button"
              onClick={() => setOnlyMissingFolder(!onlyMissingFolder)}
              className={`px-3.5 py-3 rounded-2xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                onlyMissingFolder
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-[#16171b] text-zinc-400 border-[#26282f] hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Sem Pasta no Drive ({missingFolderCount})</span>
            </button>
          )}
        </div>

        {/* Abas Rápidas de Status */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedStatusFilter === 'all'
                ? 'bg-[#26282f] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white bg-[#16171b] border border-[#26282f]'
            }`}
          >
            Todos ({clients.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('ativo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedStatusFilter === 'ativo'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-white bg-[#16171b] border border-[#26282f]'
            }`}
          >
            Ativos ({activeCount})
          </button>
          {onboardingCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('onboarding')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedStatusFilter === 'onboarding'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-white bg-[#16171b] border border-[#26282f]'
              }`}
            >
              Em Onboarding ({onboardingCount})
            </button>
          )}
        </div>
      </div>

      {/* 3. GRID DE RESTAURANTES */}
      {filteredClients.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-[#16171b] border border-[#26282f] p-8 flex flex-col items-center gap-3">
          <Building className="w-12 h-12 text-zinc-500 animate-pulse" />
          <h4 className="text-base font-bold text-zinc-200">Nenhum restaurante encontrado</h4>
          <p className="text-xs text-zinc-400 max-w-md">
            Nenhum cliente corresponde ao termo pesquisado. Clique no botão abaixo para adicionar um novo cliente parceiro.
          </p>
          <button
            type="button"
            onClick={() => openClientModal()}
            className="mt-2 px-4 py-2 rounded-xl bg-[#FF5A3C] text-white text-xs font-bold cursor-pointer"
          >
            Cadastrar Restaurante
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const clientEvents = events.filter((e) => e.client_id === client.id);
            const clientDeliverables = deliverables.filter((d) => d.client_id === client.id);
            const waLink = getWhatsAppLink(client.telefone || client.contato || undefined);

            const targetReels = client.meta_reels_mensal || 8;
            const producedReels = clientDeliverables.filter(
              (d) => d.formato === 'reels_9_16' && (d.status === 'aprovado' || d.status === 'publicado' || d.status === 'aguardando_aprovacao')
            ).length;
            const progressPercent = Math.min(100, Math.round((producedReels / targetReels) * 100));

            return (
              <div
                key={client.id}
                className="bg-[#16171b] rounded-3xl border border-[#26282f] p-5 shadow-sm hover:border-[#FF5A3C]/40 transition-all flex flex-col justify-between gap-4 group"
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        onClick={() => setDossierClient(client)}
                        className="font-bold text-base text-white truncate font-heading hover:text-[#FF5A3C] transition-colors cursor-pointer"
                        title="Ver Dossiê 360º"
                      >
                        {client.nome}
                      </h3>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                          client.status === 'onboarding'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : client.status === 'pausado'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {client.status || 'ativo'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs mt-0.5">
                      {client.instagram_handle && (
                        <a
                          href={`https://instagram.com/${client.instagram_handle.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-[#FF5A3C] hover:underline flex items-center gap-1"
                        >
                          <span>{client.instagram_handle}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <span className="text-zinc-500">•</span>
                      <span className="text-zinc-400 text-[11px] truncate">
                        {client.plano?.split('(')[0] || 'Gastro Pro'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openClientModal(client)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1f2026] transition-colors cursor-pointer"
                      title="Editar restaurante"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Deseja remover "${client.nome}" dos restaurantes parceiros?`)) {
                          deleteClient(client.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Excluir restaurante"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Barra de Progresso de Reels do Mês */}
                <div className="p-3 rounded-2xl bg-[#1c1d22] border border-[#26282f] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-[#FF5A3C]" />
                      Meta de Reels Mensal
                    </span>
                    <span className="font-extrabold text-white">
                      {producedReels}/{targetReels} entregues
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-[#121316] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF5A3C] to-[#e04a2f] rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Dados de Contato e Endereço */}
                <div className="flex flex-col gap-2 text-xs text-zinc-300 bg-[#1c1d22] p-3 rounded-2xl border border-[#26282f]">
                  {client.endereco && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#38bdf8] shrink-0 mt-0.5" />
                      <span className="truncate">{client.endereco}</span>
                    </div>
                  )}

                  {client.responsavel && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">Gerente: <strong>{client.responsavel}</strong></span>
                    </div>
                  )}

                  {(client.telefone || client.contato) && (
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#26282f]/60">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{client.telefone || client.contato}</span>
                      </div>
                      {waLink && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-white font-semibold text-[11px] transition-colors"
                          title="Abrir conversa no WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Botão de Dossiê 360º & Ações Rápidas */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDossierClient(client)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#21232b] hover:bg-[#2b2d37] text-white font-bold text-xs border border-[#2b2d35] transition-all hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Ver Dossiê 360º</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openDeliverableModal(client.id)}
                    className="py-2 px-3 rounded-xl bg-[#1f2026] hover:bg-[#282a32] text-zinc-300 hover:text-white font-medium text-xs border border-[#2b2d35] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    title="Adicionar novo vídeo para este cliente"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#FF5A3C]" />
                    <span>+ Reel</span>
                  </button>
                </div>

                {/* Pasta do Google Drive (Anti-Perda de Arquivos) */}
                <div className="pt-2 border-t border-[#26282f] flex items-center justify-between gap-2">
                  {client.drive_folder_url ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <a
                        href={client.drive_folder_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#1f2026] hover:bg-[#282a32] text-[#38bdf8] text-xs font-semibold border border-[#2b2d35] transition-all"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-[#38bdf8]" />
                        <span>Pasta Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyFolder(client.drive_folder_url)}
                        className="p-1.5 rounded-xl bg-[#1f2026] hover:bg-[#282a32] text-zinc-400 hover:text-white border border-[#2b2d35] transition-colors cursor-pointer"
                        title="Copiar link da pasta"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between py-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                      <span>Sem pasta configurada</span>
                      <button
                        type="button"
                        onClick={() => openClientModal(client)}
                        className="font-bold underline cursor-pointer"
                      >
                        Adicionar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dossiê 360º Modal */}
      <ClientDossierModal
        client={dossierClient}
        isOpen={Boolean(dossierClient)}
        onClose={() => setDossierClient(null)}
        onEdit={(c) => {
          setDossierClient(null);
          openClientModal(c);
        }}
      />
    </div>
  );
}
