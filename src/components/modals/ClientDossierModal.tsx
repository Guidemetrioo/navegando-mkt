'use client';

import React from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { Client } from '@/types/database';
import { EmployeeBadge } from '../agenda/EmployeeBadge';
import {
  Building,
  X,
  MapPin,
  Phone,
  FolderOpen,
  Calendar,
  ExternalLink,
  MessageCircle,
  Copy,
  Plus,
  Edit,
  Clock,
  Sparkles,
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertCircle,
  Video,
} from 'lucide-react';

interface ClientDossierModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
}

export function ClientDossierModal({ client, isOpen, onClose, onEdit }: ClientDossierModalProps) {
  const {
    events,
    deliverables,
    openNewEventModal,
    openDeliverableModal,
    openEditDeliverableModal,
    toast,
  } = useAgenda();

  if (!isOpen || !client) return null;

  // Gravações deste cliente
  const clientEvents = events.filter((e) => e.client_id === client.id);
  // Entregáveis deste cliente
  const clientDeliverables = deliverables.filter((d) => d.client_id === client.id);

  // Progresso de Reels
  const targetReels = client.meta_reels_mensal || 8;
  const producedReels = clientDeliverables.filter(
    (d) => d.formato === 'reels_9_16' && (d.status === 'aprovado' || d.status === 'publicado' || d.status === 'aguardando_aprovacao')
  ).length;
  const progressPercent = Math.min(100, Math.round((producedReels / targetReels) * 100));

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast(`${label} copiado!`, 'success');
  };

  const getWhatsAppLink = (phone?: string | null) => {
    if (!phone) return null;
    const clean = phone.replace(/\D/g, '');
    if (!clean) return null;
    const number = clean.startsWith('55') ? clean : `55${clean}`;
    return `https://wa.me/${number}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[var(--ui-surface)] border-t sm:border border-[var(--ui-border)] rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-6 max-h-[92vh] overflow-y-auto pb-safe sm:pb-7 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab bar mobile */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700 mx-auto -mt-1 sm:hidden shrink-0" />

        {/* 1. TOPO: Identidade do Restaurante & Ações */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--ui-border)] pb-5">
          <div className="flex items-start gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-[var(--ui-accent)]/10 text-[var(--ui-accent)] border border-[var(--ui-accent)]/20 flex items-center justify-center shrink-0">
              <Building className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-extrabold text-foreground font-heading">
                  {client.nome}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    client.status === 'ativo'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : client.status === 'onboarding'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {client.status || 'ativo'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                {client.instagram_handle && (
                  <a
                    href={`https://instagram.com/${client.instagram_handle.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--ui-accent)] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>{client.instagram_handle}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {client.responsavel && <span>• Contato: {client.responsavel}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(client);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--ui-hover)] hover:bg-[var(--ui-border)] text-zinc-200 text-xs font-semibold border border-[var(--ui-border)] transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-foreground hover:bg-[var(--ui-border)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. CARDS DE DESTAQUE: METAS DE CONTRATO & CONTATOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: Meta de Reels Mensais */}
          <div className="p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-[var(--ui-accent)]" />
                Meta de Conteúdo
              </span>
              <span className="text-xs font-extrabold text-foreground">
                {producedReels} / {targetReels} Reels
              </span>
            </div>

            <div>
              <div className="w-full h-2 rounded-full bg-[var(--ui-surface)] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--ui-accent)] to-[var(--ui-accent-hover)] transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1.5">
                <span>{progressPercent}% do plano entregue</span>
                <span>{client.plano || 'Gastro Pro'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Valor Contratado & Mensalidade */}
          <div className="p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex flex-col justify-between gap-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Contrato Mensal
            </span>
            <div>
              <div className="text-xl font-black text-foreground font-mono">
                {client.valor_mensalidade ? `R$ ${client.valor_mensalidade.toLocaleString('pt-BR')}` : 'Sob Consulta'}
              </div>
              <span className="text-[10px] text-zinc-400">Renovação recorrente mensal</span>
            </div>
          </div>

          {/* Card 3: Google Drive & Cardápio */}
          <div className="p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex flex-col justify-between gap-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-[#38bdf8]" />
              Links do Cliente
            </span>
            <div className="flex flex-col gap-1.5">
              {client.drive_folder_url ? (
                <a
                  href={client.drive_folder_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between text-xs text-[#38bdf8] hover:underline font-semibold"
                >
                  <span className="truncate">Abrir Pasta Drive</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ) : (
                <span className="text-[11px] text-zinc-400">Sem pasta Drive configurada</span>
              )}

              {client.cardapio_link ? (
                <a
                  href={client.cardapio_link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between text-xs text-amber-400 hover:underline font-semibold"
                >
                  <span className="truncate">Cardápio Digital</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {/* 3. BRIEFING & IDENTIDADE DA MARCA */}
        <div className="p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex flex-col gap-2">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--ui-accent)]" />
            Briefing & Diretrizes Visuais da Marca
          </span>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {client.briefing || client.observacoes || 'Nenhuma diretriz de gravação informada ainda.'}
          </p>

          {client.endereco && (
            <div className="pt-2 border-t border-[var(--ui-border)] flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                <span>{client.endereco}</span>
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.endereco)}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-zinc-400 hover:text-foreground underline shrink-0"
              >
                Ver no Maps
              </a>
            </div>
          )}
        </div>

        {/* 4. ABAS DE HISTÓRICO: GRAVAÇÕES & ENTREGÁVEIS */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-[var(--ui-accent)]" />
              Conteúdos & Gravações do Cliente ({clientDeliverables.length})
            </h4>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openNewEventModal();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--ui-accent)]/15 text-[var(--ui-accent)] text-[11px] font-bold hover:bg-[var(--ui-accent)]/25 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Nova Gravação</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openDeliverableModal(client.id);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#38bdf8]/15 text-[#38bdf8] text-[11px] font-bold hover:bg-[#38bdf8]/25 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Novo Reel</span>
              </button>
            </div>
          </div>

          {clientDeliverables.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-zinc-400 text-xs">
              Nenhum entregável cadastrado ainda para este restaurante.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {clientDeliverables.map((deliv) => (
                <div
                  key={deliv.id}
                  onClick={() => {
                    onClose();
                    openEditDeliverableModal(deliv);
                  }}
                  className="p-3 rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] hover:border-[var(--ui-accent)]/40 transition-all cursor-pointer flex flex-col justify-between gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-foreground line-clamp-1">
                      {deliv.titulo}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase shrink-0 ${
                        deliv.status === 'aprovado'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : deliv.status === 'publicado'
                          ? 'bg-sky-500/15 text-sky-400'
                          : deliv.status === 'ajustes_solicitados'
                          ? 'bg-rose-500/15 text-rose-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {deliv.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>{deliv.formato} • v{deliv.versao}</span>
                    <span>{deliv.data_gravacao}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. AÇÕES RÁPIDAS DE CONTATO */}
        <div className="pt-3 border-t border-[var(--ui-border)] flex flex-wrap items-center justify-between gap-3">
          {client.telefone ? (
            <a
              href={getWhatsAppLink(client.telefone) || '#'}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chamar no WhatsApp ({client.telefone})</span>
            </a>
          ) : (
            <span className="text-xs text-zinc-400">Sem telefone cadastrado</span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--ui-hover)] hover:bg-[var(--ui-border)] text-zinc-300 text-xs font-semibold cursor-pointer"
          >
            Fechar Dossiê
          </button>
        </div>
      </div>
    </div>
  );
}
