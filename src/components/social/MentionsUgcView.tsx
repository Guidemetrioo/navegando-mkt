'use client';

import React, { useState } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import {
  MessageSquareHeart,
  Camera,
  Star,
  CheckCheck,
  RefreshCw,
  ExternalLink,
  Flame,
  Clock,
  Sparkles,
} from 'lucide-react';

export function MentionsUgcView() {
  const { mentions, clients, toggleMentionReposted, simulateNewMention } = useAgenda();
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'stories' | 'influencers'>('all');
  const [selectedClient, setSelectedClient] = useState<string>('');

  // Filtragem
  const filteredMentions = mentions.filter((m) => {
    if (selectedClient && m.client_id !== selectedClient) return false;
    if (filterType === 'pending') return !m.reposted;
    if (filterType === 'stories') return m.mention_type === 'STORY_MENTION';
    if (filterType === 'influencers') return m.is_influencer;
    return true;
  });

  // Totais
  const totalMentions = mentions.length;
  const pendingReposts = mentions.filter((m) => !m.reposted).length;
  const influencerCount = mentions.filter((m) => m.is_influencer).length;
  const storiesCount = mentions.filter((m) => m.mention_type === 'STORY_MENTION').length;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Banner & Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
            <MessageSquareHeart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground dark:text-foreground text-zinc-900 font-heading">
              Mural de UGC & Marcações dos Clientes
            </h2>
            <p className="text-xs text-zinc-400">
              Fotos, Reels e Stories onde os clientes marcaram os restaurantes
            </p>
          </div>
        </div>

        {/* Botão de Simulação de Webhook da Meta */}
        <button
          type="button"
          onClick={simulateNewMention}
          className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--ui-accent)]/10 hover:bg-[var(--ui-accent)]/20 text-[var(--ui-accent)] border border-[var(--ui-accent)]/30 text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer"
          title="Simula a chegada de um Story ou Post em tempo real via Webhook da Meta"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simular nova marcação (Webhook)</span>
        </button>
      </div>

      {/* Cartões de Indicadores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 flex flex-col gap-1 shadow-sm">
          <span className="text-xs text-zinc-400">Total de Marcações</span>
          <div className="text-2xl font-bold font-heading text-foreground dark:text-foreground text-zinc-900 mt-1">
            {totalMentions}
          </div>
          <span className="text-[11px] text-zinc-400">Conteúdos de clientes</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 flex flex-col gap-1 shadow-sm">
          <span className="text-xs text-zinc-400">Pendentes de Repost</span>
          <div className="text-2xl font-bold font-heading text-amber-400 mt-1">
            {pendingReposts}
          </div>
          <span className="text-[11px] text-amber-400/80 font-medium">Aguardando social media</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 flex flex-col gap-1 shadow-sm">
          <span className="text-xs text-zinc-400">Radar de Influenciadores</span>
          <div className="text-2xl font-bold font-heading text-purple-400 mt-1">
            {influencerCount}
          </div>
          <span className="text-[11px] text-purple-400/80 font-semibold">Perfis com +10k seguidores</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 flex flex-col gap-1 shadow-sm">
          <span className="text-xs text-zinc-400">Menções em Stories</span>
          <div className="text-2xl font-bold font-heading text-rose-400 mt-1">
            {storiesCount}
          </div>
          <span className="text-[11px] text-zinc-400">Expiram em 24h</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-slate-100 rounded-xl border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-[var(--ui-border)] dark:bg-[var(--ui-border)] bg-white text-foreground dark:text-foreground text-zinc-900 shadow-sm'
                : 'text-zinc-400 hover:text-foreground'
            }`}
          >
            Todas ({totalMentions})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterType === 'pending'
                ? 'bg-[var(--ui-border)] dark:bg-[var(--ui-border)] bg-white text-foreground dark:text-foreground text-zinc-900 shadow-sm'
                : 'text-zinc-400 hover:text-foreground'
            }`}
          >
            Pendentes ({pendingReposts})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('influencers')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterType === 'influencers'
                ? 'bg-[var(--ui-border)] dark:bg-[var(--ui-border)] bg-white text-foreground dark:text-foreground text-zinc-900 shadow-sm'
                : 'text-zinc-400 hover:text-foreground'
            }`}
          >
            ⭐ Influenciadores ({influencerCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('stories')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterType === 'stories'
                ? 'bg-[var(--ui-border)] dark:bg-[var(--ui-border)] bg-white text-foreground dark:text-foreground text-zinc-900 shadow-sm'
                : 'text-zinc-400 hover:text-foreground'
            }`}
          >
            Stories ({storiesCount})
          </button>
        </div>

        {/* Filtro por restaurante */}
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="text-xs bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white text-zinc-200 dark:text-zinc-200 text-zinc-800 border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
        >
          <option value="">Todos os Restaurantes</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Feed do Mural de Marcações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMentions.map((men) => (
          <div
            key={men.id}
            className={`p-4 rounded-2xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white border transition-all flex flex-col justify-between gap-3 shadow-sm ${
              men.reposted
                ? 'border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 opacity-80'
                : 'border-[var(--ui-accent)]/40 shadow-md shadow-[var(--ui-accent)]/5'
            }`}
          >
            {/* Topo: Autor & Badges */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 shrink-0">
                  <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-foreground text-xs font-bold">
                    {men.author_username.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground dark:text-foreground text-zinc-900">
                      @{men.author_username}
                    </span>
                    {men.is_influencer && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <Star className="w-2.5 h-2.5 fill-purple-400" />
                        {(men.author_followers / 1000).toFixed(0)}k
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    marcou{' '}
                    <strong className="text-zinc-300 dark:text-zinc-300 text-zinc-700">
                      {men.client?.nome || 'o restaurante'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Tag de Tipo (Story ou Post) */}
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  men.mention_type === 'STORY_MENTION'
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                }`}
              >
                {men.mention_type === 'STORY_MENTION' ? 'Story' : 'Post / Reels'}
              </span>
            </div>

            {/* Imagem do prato / story */}
            {men.media_url && (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-900">
                <img
                  src={men.media_url}
                  alt={men.caption || 'Foto do prato'}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Legenda do Cliente */}
            {men.caption && (
              <p className="text-xs text-zinc-300 dark:text-zinc-300 text-zinc-700 italic bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-50 p-2.5 rounded-xl border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200">
                &ldquo;{men.caption}&rdquo;
              </p>
            )}

            {/* Rodapé: Ação de Repost e Link */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-100">
              <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Recente
              </span>

              <div className="flex items-center gap-2">
                {men.permalink && (
                  <a
                    href={men.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-foreground hover:bg-zinc-800 transition-colors"
                    title="Ver no Instagram"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => toggleMentionReposted(men.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    men.reposted
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'brand-solid bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-foreground shadow-sm'
                  }`}
                >
                  {men.reposted ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Repostado</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Repostar nos Stories</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
