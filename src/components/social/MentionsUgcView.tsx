'use client';

import React, { useState } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { MentionSentiment, MentionType } from '@/types/database';
import {
  MessageSquareHeart,
  Star,
  CheckCheck,
  RefreshCw,
  ExternalLink,
  Clock,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

export function MentionsUgcView() {
  const {
    mentions,
    clients,
    toggleMentionReposted,
    addMention,
    deleteMention,
    canManage,
    openClientModal,
  } = useAgenda();
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'stories' | 'influencers'>('all');
  const [selectedClient, setSelectedClient] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientId, setClientId] = useState('');
  const [authorUsername, setAuthorUsername] = useState('');
  const [authorFollowers, setAuthorFollowers] = useState('');
  const [mentionType, setMentionType] = useState<MentionType>('STORY_MENTION');
  const [sentiment, setSentiment] = useState<MentionSentiment>('positivo');
  const [caption, setCaption] = useState('');
  const [permalink, setPermalink] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');

  const filteredMentions = mentions.filter((m) => {
    if (selectedClient && m.client_id !== selectedClient) return false;
    if (filterType === 'pending') return !m.reposted;
    if (filterType === 'stories') return m.mention_type === 'STORY_MENTION';
    if (filterType === 'influencers') return m.is_influencer;
    return true;
  });

  const totalMentions = mentions.length;
  const pendingReposts = mentions.filter((m) => !m.reposted).length;
  const influencerCount = mentions.filter((m) => m.is_influencer).length;
  const storiesCount = mentions.filter((m) => m.mention_type === 'STORY_MENTION').length;

  const handleOpenModal = () => {
    setClientId(selectedClient || clients[0]?.id || '');
    setAuthorUsername('');
    setAuthorFollowers('');
    setMentionType('STORY_MENTION');
    setSentiment('positivo');
    setCaption('');
    setPermalink('');
    setMediaUrl('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !authorUsername.trim()) return;
    const cleanUser = authorUsername.trim().replace(/^@/, '');
    const followers = Math.max(0, Number(authorFollowers) || 0);

    addMention({
      client_id: clientId,
      author_username: cleanUser,
      author_name: cleanUser,
      author_followers: followers,
      is_influencer: followers >= 10000,
      mention_type: mentionType,
      sentiment,
      caption: caption.trim() || undefined,
      permalink: permalink.trim() || undefined,
      media_url: mediaUrl.trim() || undefined,
      reposted: false,
      posted_at: new Date().toISOString(),
    });
    setIsModalOpen(false);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Banner & Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
            <MessageSquareHeart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground font-heading">
              Mural de UGC & Marcações dos Clientes
            </h2>
            <p className="text-xs text-zinc-400">
              Registre e controle os Stories, Reels e Posts em que clientes e influenciadores marcaram os restaurantes
            </p>
          </div>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={handleOpenModal}
            className="gradient-cta flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-foreground text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Marcação / UGC</span>
          </button>
        )}
      </div>

      {/* Cartões de Indicadores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-1 shadow-sm">
          <span className="text-xs text-zinc-400">Total de Marcações</span>
          <div className="text-2xl font-bold font-heading text-foreground mt-1">
            {totalMentions}
          </div>
          <span className="text-[11px] text-zinc-400">Conteúdos de clientes registrados</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-1 shadow-sm">
          <span className="text-xs text-zinc-400">Pendentes de Repost</span>
          <div className="text-2xl font-bold font-heading text-amber-400 mt-1">
            {pendingReposts}
          </div>
          <span className="text-[11px] text-amber-400/80 font-medium">Aguardando social media</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-1 shadow-sm">
          <span className="text-xs text-zinc-400">Radar de Influenciadores</span>
          <div className="text-2xl font-bold font-heading text-purple-400 mt-1">
            {influencerCount}
          </div>
          <span className="text-[11px] text-purple-400/80 font-semibold">Perfis com +10k seguidores</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-1 shadow-sm">
          <span className="text-xs text-zinc-400">Menções em Stories</span>
          <div className="text-2xl font-bold font-heading text-rose-400 mt-1">
            {storiesCount}
          </div>
          <span className="text-[11px] text-zinc-400">Expiram em 24h</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[var(--ui-surface)] rounded-xl border border-[var(--ui-border)] text-xs">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-[var(--ui-border)] text-foreground shadow-sm'
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
                ? 'bg-[var(--ui-border)] text-foreground shadow-sm'
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
                ? 'bg-[var(--ui-border)] text-foreground shadow-sm'
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
                ? 'bg-[var(--ui-border)] text-foreground shadow-sm'
                : 'text-zinc-400 hover:text-foreground'
            }`}
          >
            Stories ({storiesCount})
          </button>
        </div>

        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="text-xs bg-[var(--ui-surface)] text-foreground border border-[var(--ui-border)] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
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
      {filteredMentions.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-center flex flex-col items-center gap-3">
          <MessageSquareHeart className="w-8 h-8 text-zinc-500" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">
              Nenhuma marcação de cliente registrada ainda
            </p>
            <p className="text-xs text-zinc-400 max-w-md">
              {clients.length === 0
                ? 'Cadastre primeiro os restaurantes na aba Clientes para organizar as marcações e reposts de UGC.'
                : 'Registre aqui os Stories e publicações espontâneas dos clientes para a equipe de Social Media repostar.'}
            </p>
          </div>
          {canManage && (
            clients.length === 0 ? (
              <button
                type="button"
                onClick={() => openClientModal()}
                className="gradient-cta px-4 py-2 rounded-xl text-xs font-bold text-foreground cursor-pointer"
              >
                Cadastrar Primeiro Restaurante
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenModal}
                className="gradient-cta px-4 py-2 rounded-xl text-xs font-bold text-foreground cursor-pointer"
              >
                + Registrar Primeira Marcação
              </button>
            )
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMentions.map((men) => (
            <div
              key={men.id}
              className={`p-4 rounded-2xl bg-[var(--ui-surface)] border transition-all flex flex-col justify-between gap-3 shadow-sm ${
                men.reposted
                  ? 'border-[var(--ui-border)] opacity-80'
                  : 'border-[var(--ui-accent)]/40 shadow-md shadow-[var(--ui-accent)]/5'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 shrink-0">
                    <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-foreground text-xs font-bold">
                      {men.author_username.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">
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
                      <strong className="text-zinc-300">
                        {men.client?.nome || 'o restaurante'}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      men.mention_type === 'STORY_MENTION'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                    }`}
                  >
                    {men.mention_type === 'STORY_MENTION' ? 'Story' : 'Post / Reels'}
                  </span>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => deleteMention(men.id)}
                      className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                      title="Remover marcação"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {men.media_url && (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-900">
                  <img
                    src={men.media_url}
                    alt={men.caption || 'Foto do prato'}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {men.caption && (
                <p className="text-xs text-zinc-300 italic bg-[var(--ui-raised)] p-2.5 rounded-xl border border-[var(--ui-border)]">
                  &ldquo;{men.caption}&rdquo;
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[var(--ui-border)]">
                <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(men.posted_at).toLocaleDateString('pt-BR')}
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
                        : 'brand-solid bg-[var(--ui-accent)] text-foreground shadow-sm'
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
                        <span>Marcar Repostado</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Registro de Marcação / UGC */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--ui-border)] pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Registrar Marcação / UGC
                </h3>
                <p className="text-xs text-zinc-400">
                  Cadastre um Story ou Post em que um cliente marcou o restaurante
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Restaurante Marcado *
                </label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground"
                >
                  <option value="">Selecione...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    @Usuário do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="@usuario_cliente"
                    value={authorUsername}
                    onChange={(e) => setAuthorUsername(e.target.value)}
                    className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Nº de Seguidores
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={authorFollowers}
                    onChange={(e) => setAuthorFollowers(e.target.value)}
                    className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Formato da Marcação
                  </label>
                  <select
                    value={mentionType}
                    onChange={(e) => setMentionType(e.target.value as MentionType)}
                    className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground"
                  >
                    <option value="STORY_MENTION">Story (24h)</option>
                    <option value="POST_TAG">Post / Reels no Feed</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Classificação
                  </label>
                  <select
                    value={sentiment}
                    onChange={(e) => setSentiment(e.target.value as MentionSentiment)}
                    className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground"
                  >
                    <option value="positivo">Elogio / Positivo</option>
                    <option value="destaque_gourmet">Destaque Gastronômico</option>
                    <option value="neutro">Neutro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Texto / Legenda da Marcação
                </label>
                <input
                  type="text"
                  placeholder="O que o cliente escreveu no Story/Post..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Link do Story/Post no Instagram (Opcional, HTTPS)
                </label>
                <input
                  type="url"
                  placeholder="https://www.instagram.com/..."
                  value={permalink}
                  onChange={(e) => setPermalink(e.target.value)}
                  className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  URL da Foto/Print (Opcional, HTTPS)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--ui-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--ui-raised)] text-zinc-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="gradient-cta px-4 py-2 rounded-xl text-foreground font-bold cursor-pointer"
                >
                  Salvar Marcação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
