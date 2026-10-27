'use client';

import React from 'react';
import { useAgenda } from '@/context/AgendaContext';
import {
  TrendingUp,
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
} from 'lucide-react';

export function InstagramMetricsView() {
  const { reels, clients, selectedRestaurantId, setSelectedRestaurantId } = useAgenda();

  // Filtrar reels pelo restaurante selecionado
  const displayedReels = selectedRestaurantId
    ? reels.filter((r) => r.client_id === selectedRestaurantId)
    : reels;

  // Cálculos de Totais
  const totalPlays = displayedReels.reduce((acc, r) => acc + r.plays, 0);
  const totalReach = displayedReels.reduce((acc, r) => acc + r.reach, 0);
  const totalSaves = displayedReels.reduce((acc, r) => acc + r.saved, 0);
  const totalShares = displayedReels.reduce((acc, r) => acc + r.shares, 0);
  const avgEngagement = displayedReels.length > 0
    ? (displayedReels.reduce((acc, r) => acc + r.engagement_rate, 0) / displayedReels.length).toFixed(1)
    : '0.0';

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Barra de Filtro de Restaurante */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--ui-accent)]/10 border border-[var(--ui-accent)]/20 flex items-center justify-center text-[var(--ui-accent)]">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground dark:text-foreground text-zinc-900 font-heading">
              Métricas & Performance dos Reels
            </h2>
            <p className="text-xs text-zinc-400">
              Dados sincronizados via Instagram Graph API da Meta
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-zinc-400" />
          <select
            value={selectedRestaurantId || ''}
            onChange={(e) => setSelectedRestaurantId(e.target.value || null)}
            className="text-xs bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-100 text-zinc-200 dark:text-zinc-200 text-zinc-800 border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
          >
            <option value="">Todos os Restaurantes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cartões de Métricas Principais (KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Visualizações Totais</span>
            <Play className="w-4 h-4 text-[var(--ui-accent)]" />
          </div>
          <div className="text-2xl font-bold font-heading text-foreground dark:text-foreground text-zinc-900 mt-1">
            {formatNumber(totalPlays)}
          </div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3 h-3" /> +28% este mês
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Contas Alcançadas</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-heading text-foreground dark:text-foreground text-zinc-900 mt-1">
            {formatNumber(totalReach)}
          </div>
          <span className="text-[11px] text-zinc-400">Usuários únicos</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Salvamentos (Desejo)</span>
            <Bookmark className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-heading text-foreground dark:text-foreground text-zinc-900 mt-1">
            {formatNumber(totalSaves)}
          </div>
          <span className="text-[11px] text-zinc-400">Pessoas querendo ir</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Engajamento Médio</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-heading text-foreground dark:text-foreground text-zinc-900 mt-1">
            {avgEngagement}%
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold">Acima da média (4.2%)</span>
        </div>
      </div>

      {/* Destaque: Vínculo Operacional (Gravação -> Resultado) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[var(--ui-raised)] to-[var(--ui-surface)] border border-[var(--ui-accent)]/30 shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--ui-accent)] uppercase tracking-wider mb-1">
          <CalendarCheck className="w-4 h-4" />
          <span>Inteligência Operacional • Vínculo com a Agenda</span>
        </div>
        <h3 className="text-base font-bold text-foreground dark:text-foreground text-zinc-900 font-heading">
          Gravações da Equipe vs. Resultado em Visualizações
        </h3>
        <p className="text-xs text-zinc-300 dark:text-zinc-300 text-zinc-600 mt-1 max-w-3xl leading-relaxed">
          O CRM conecta automaticamente os Reels postados à data e equipe escalada na agenda,
          permitindo calcular o retorno exato de cada diária de produção para o restaurante.
        </p>
      </div>

      {/* Grade de Reels Publicados */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-zinc-200 dark:text-zinc-200 text-zinc-800 font-heading">
          Reels Gastronômicos Publicados ({displayedReels.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayedReels.map((reel) => (
            <div
              key={reel.id}
              className="bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white rounded-2xl border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 overflow-hidden flex flex-col shadow-sm hover:border-[var(--ui-accent)]/50 transition-all group"
            >
              {/* Thumbnail do Vídeo com Badge de Views */}
              <div className="relative aspect-[9/12] w-full bg-zinc-900 overflow-hidden">
                {reel.thumbnail_url && (
                  <img
                    src={reel.thumbnail_url}
                    alt={reel.caption}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}

                {/* Gradiente escuro para legibilidade */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

                {/* Badge de Restaurante no topo */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-black/60 backdrop-blur-md text-foreground border border-[var(--ui-border)]">
                    {reel.client?.nome || 'Restaurante'}
                  </span>
                </div>

                {/* Botão de abrir no Instagram */}
                <a
                  href={reel.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-foreground hover:text-[var(--ui-accent)] transition-colors"
                  title="Abrir no Instagram"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {/* Views e Alcance na base da imagem */}
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

              {/* Informações e Métricas */}
              <div className="p-3.5 flex flex-col gap-2.5 flex-1 justify-between">
                <p className="text-xs text-zinc-300 dark:text-zinc-300 text-zinc-700 line-clamp-2 leading-relaxed">
                  {reel.caption}
                </p>

                {/* Métricas secundárias (Curtidas, Salvamentos, Compartilhamentos) */}
                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-100 text-center text-[11px] text-zinc-400">
                  <div className="flex flex-col items-center">
                    <Heart className="w-3.5 h-3.5 text-rose-500 mb-0.5" />
                    <span className="font-semibold text-zinc-200 dark:text-zinc-200 text-zinc-800">
                      {formatNumber(reel.likes)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Bookmark className="w-3.5 h-3.5 text-amber-500 mb-0.5" />
                    <span className="font-semibold text-zinc-200 dark:text-zinc-200 text-zinc-800">
                      {formatNumber(reel.saved)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Share2 className="w-3.5 h-3.5 text-sky-500 mb-0.5" />
                    <span className="font-semibold text-zinc-200 dark:text-zinc-200 text-zinc-800">
                      {formatNumber(reel.shares)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
