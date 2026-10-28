'use client';

import React, { useState } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import {
  Play,
  Users,
  Heart,
  Bookmark,
  Share2,
  ExternalLink,
  Film,
  CalendarCheck,
  Building2,
  Sparkles,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

export function InstagramMetricsView() {
  const {
    reels,
    clients,
    events,
    selectedRestaurantId,
    setSelectedRestaurantId,
    addReel,
    deleteReel,
    canManage,
    openClientModal,
  } = useAgenda();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientId, setClientId] = useState('');
  const [eventId, setEventId] = useState('');
  const [permalink, setPermalink] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [plays, setPlays] = useState('');
  const [reach, setReach] = useState('');
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');
  const [shares, setShares] = useState('');
  const [saved, setSaved] = useState('');
  const [publishedAt, setPublishedAt] = useState(() => new Date().toISOString().slice(0, 10));

  const displayedReels = selectedRestaurantId
    ? reels.filter((r) => r.client_id === selectedRestaurantId)
    : reels;

  const totalPlays = displayedReels.reduce((acc, r) => acc + r.plays, 0);
  const totalReach = displayedReels.reduce((acc, r) => acc + r.reach, 0);
  const totalSaves = displayedReels.reduce((acc, r) => acc + r.saved, 0);
  const avgEngagement =
    displayedReels.length > 0
      ? (
          displayedReels.reduce((acc, r) => acc + r.engagement_rate, 0) /
          displayedReels.length
        ).toFixed(1)
      : '0.0';

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const handleOpenAdd = () => {
    setClientId(selectedRestaurantId || clients[0]?.id || '');
    setEventId('');
    setPermalink('');
    setThumbnailUrl('');
    setCaption('');
    setPlays('');
    setReach('');
    setLikes('');
    setComments('');
    setShares('');
    setSaved('');
    setPublishedAt(new Date().toISOString().slice(0, 10));
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !caption.trim()) return;

    const nPlays = Math.max(0, Number(plays) || 0);
    const nReach = Math.max(0, Number(reach) || nPlays);
    const nLikes = Math.max(0, Number(likes) || 0);
    const nComments = Math.max(0, Number(comments) || 0);
    const nShares = Math.max(0, Number(shares) || 0);
    const nSaved = Math.max(0, Number(saved) || 0);
    const interactions = nLikes + nComments + nShares + nSaved;
    const engagementRate =
      nReach > 0 ? Number(((interactions / nReach) * 100).toFixed(2)) : 0;

    addReel({
      client_id: clientId,
      event_id: eventId || null,
      instagram_media_id: `ig-${Date.now()}`,
      permalink: permalink.trim() || 'https://instagram.com',
      thumbnail_url: thumbnailUrl.trim() || undefined,
      caption: caption.trim(),
      published_at: new Date(`${publishedAt}T12:00:00Z`).toISOString(),
      plays: nPlays,
      reach: nReach,
      likes: nLikes,
      comments: nComments,
      shares: nShares,
      saved: nSaved,
      engagement_rate: engagementRate,
    });

    setIsModalOpen(false);
  };

  const clientEvents = events.filter((ev) => ev.client_id === clientId);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Barra de Filtro e Cadastro de Métrica */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--ui-accent)]/10 border border-[var(--ui-accent)]/20 flex items-center justify-center text-[var(--ui-accent)]">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground font-heading">
              Métricas & Performance dos Reels
            </h2>
            <p className="text-xs text-zinc-400">
              Registre e acompanhe os resultados dos Reels publicados no Instagram dos restaurantes
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-zinc-400" />
            <select
              value={selectedRestaurantId || ''}
              onChange={(e) => setSelectedRestaurantId(e.target.value || null)}
              className="text-xs bg-[var(--ui-raised)] text-foreground border border-[var(--ui-border)] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
            >
              <option value="">Todos os Restaurantes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="gradient-cta flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-foreground font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Reel & Métricas</span>
            </button>
          )}
        </div>
      </div>

      {/* Cartões de Métricas Principais (KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Visualizações Totais</span>
            <Play className="w-4 h-4 text-[var(--ui-accent)]" />
          </div>
          <div className="text-2xl font-bold font-heading text-foreground mt-1">
            {formatNumber(totalPlays)}
          </div>
          <span className="text-[11px] text-zinc-400">
            Soma de plays dos Reels cadastrados
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Contas Alcançadas</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-heading text-foreground mt-1">
            {formatNumber(totalReach)}
          </div>
          <span className="text-[11px] text-zinc-400">Usuários únicos impactados</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Salvamentos (Desejo)</span>
            <Bookmark className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-heading text-foreground mt-1">
            {formatNumber(totalSaves)}
          </div>
          <span className="text-[11px] text-zinc-400">Pessoas salvando para visitar</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Engajamento Médio</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-heading text-foreground mt-1">
            {avgEngagement}%
          </div>
          <span className="text-[11px] text-zinc-400">Interações / Alcance</span>
        </div>
      </div>

      {/* Destaque: Vínculo Operacional */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[var(--ui-raised)] to-[var(--ui-surface)] border border-[var(--ui-accent)]/30 shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--ui-accent)] uppercase tracking-wider mb-1">
          <CalendarCheck className="w-4 h-4" />
          <span>Inteligência Operacional • Vínculo com a Agenda</span>
        </div>
        <h3 className="text-base font-bold text-foreground font-heading">
          Gravações da Equipe vs. Resultado em Visualizações
        </h3>
        <p className="text-xs text-zinc-300 mt-1 max-w-3xl leading-relaxed">
          Vincule cada Reel publicado à gravação da agenda para medir o retorno real de cada diária de produção para o restaurante.
        </p>
      </div>

      {/* Grade de Reels Publicados */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-foreground font-heading">
          Reels Gastronômicos Cadastrados ({displayedReels.length})
        </h3>

        {displayedReels.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-center flex flex-col items-center gap-3">
            <Film className="w-8 h-8 text-zinc-500" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">
                Nenhum Reel cadastrado ainda
              </p>
              <p className="text-xs text-zinc-400 max-w-md">
                {clients.length === 0
                  ? 'Cadastre primeiro um restaurante parceiro na aba Clientes e depois registre as métricas dos Reels publicados.'
                  : 'Clique em "Cadastrar Reel & Métricas" para registrar as visualizações, alcance e salvamentos dos vídeos publicados.'}
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
                  onClick={handleOpenAdd}
                  className="gradient-cta px-4 py-2 rounded-xl text-xs font-bold text-foreground cursor-pointer"
                >
                  + Cadastrar Primeiro Reel
                </button>
              )
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayedReels.map((reel) => (
              <div
                key={reel.id}
                className="bg-[var(--ui-surface)] rounded-2xl border border-[var(--ui-border)] overflow-hidden flex flex-col shadow-sm hover:border-[var(--ui-accent)]/50 transition-all group"
              >
                <div className="relative aspect-[9/12] w-full bg-zinc-900 overflow-hidden flex items-center justify-center">
                  {reel.thumbnail_url ? (
                    <img
                      src={reel.thumbnail_url}
                      alt={reel.caption}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <Film className="w-10 h-10 text-zinc-700" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-black/60 backdrop-blur-md text-foreground border border-[var(--ui-border)]">
                      {reel.client?.nome || 'Restaurante'}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                    {reel.permalink && (
                      <a
                        href={reel.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-foreground hover:text-[var(--ui-accent)] transition-colors"
                        title="Abrir no Instagram"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => deleteReel(reel.id)}
                        className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remover métrica"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-foreground text-xs">
                    <span className="flex items-center gap-1 font-bold brand-solid bg-[var(--ui-accent)] px-2 py-0.5 rounded-md text-[11px] shadow-sm">
                      <Play className="w-3 h-3 fill-white" />
                      {formatNumber(reel.plays)}
                    </span>
                    <span className="text-[10px] bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-sm">
                      {formatNumber(reel.reach)} alcance
                    </span>
                  </div>
                </div>

                <div className="p-3.5 flex flex-col gap-2.5 flex-1 justify-between">
                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                    {reel.caption}
                  </p>

                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[var(--ui-border)] text-center text-[11px] text-zinc-400">
                    <div className="flex flex-col items-center">
                      <Heart className="w-3.5 h-3.5 text-rose-500 mb-0.5" />
                      <span className="font-semibold text-foreground">
                        {formatNumber(reel.likes)}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Bookmark className="w-3.5 h-3.5 text-amber-500 mb-0.5" />
                      <span className="font-semibold text-foreground">
                        {formatNumber(reel.saved)}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Share2 className="w-3.5 h-3.5 text-sky-500 mb-0.5" />
                      <span className="font-semibold text-foreground">
                        {formatNumber(reel.shares)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Cadastro de Métricas do Reel */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--ui-border)] pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Cadastrar Métricas de Reel Publicado
                </h3>
                <p className="text-xs text-zinc-400">
                  Insira os números do Instagram Insights do restaurante
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Restaurante Parceiro *
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

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Gravação Vinculada (Opcional)
                  </label>
                  <select
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground"
                  >
                    <option value="">Sem vínculo direto</option>
                    {clientEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.data} ({ev.hora_inicio.slice(0, 5)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Título / Legenda do Reel *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Descreva o tema ou legenda do vídeo publicado..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Visualizações (Plays) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    value={plays}
                    onChange={(e) => setPlays(e.target.value)}
                    className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Contas Alcançadas *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    value={reach}
                    onChange={(e) => setReach(e.target.value)}
                    className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Curtidas
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={likes}
                    onChange={(e) => setLikes(e.target.value)}
                    className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Comentários
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Compartilhamentos
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Salvamentos
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={saved}
                    onChange={(e) => setSaved(e.target.value)}
                    className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Link do Post no Instagram (HTTPS)
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.instagram.com/reel/..."
                    value={permalink}
                    onChange={(e) => setPermalink(e.target.value)}
                    className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Data da Publicação
                  </label>
                  <input
                    type="date"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  URL da Imagem de Capa (Opcional, HTTPS)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
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
                  Salvar Métricas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
