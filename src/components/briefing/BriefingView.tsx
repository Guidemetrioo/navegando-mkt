'use client';

import React, { useState, useMemo } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { Client } from '@/types/database';
import {
  ClipboardList,
  Sparkles,
  Building,
  Search,
  Save,
  Plus,
  CheckCircle2,
  Users,
  Mic,
  Utensils,
  Camera,
  AlertTriangle,
  Film,
  Calendar,
  ExternalLink,
  Edit3,
} from 'lucide-react';

export function BriefingView() {
  const {
    clients,
    events,
    updateClient,
    openClientModal,
    openEditEventModal,
    openNewEventModal,
    canManage,
  } = useAgenda();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  // Campos de edição do Briefing do Restaurante
  const [briefingGeral, setBriefingGeral] = useState('');
  const [publicoAlvo, setPublicoAlvo] = useState('');
  const [tomVoz, setTomVoz] = useState('');
  const [pratosFoco, setPratosFoco] = useState('');
  const [iluminacaoEstetica, setIluminacaoEstetica] = useState('');
  const [restricoes, setRestricoes] = useState('');
  const [roteirosModelos, setRoteirosModelos] = useState('');
  const [cardapioLink, setCardapioLink] = useState('');

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.nome.toLowerCase().includes(q) ||
        (c.instagram_handle || '').toLowerCase().includes(q) ||
        (c.briefing || '').toLowerCase().includes(q) ||
        (c.briefing_pratos_foco || '').toLowerCase().includes(q)
      );
    });
  }, [clients, searchQuery]);

  const activeClient: Client | undefined = useMemo(() => {
    if (selectedClientId) {
      return clients.find((c) => c.id === selectedClientId) || filteredClients[0];
    }
    return filteredClients[0];
  }, [clients, filteredClients, selectedClientId]);

  const clientEvents = useMemo(() => {
    if (!activeClient) return [];
    return events
      .filter((e) => e.client_id === activeClient.id)
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [events, activeClient]);

  const startEditingBriefing = (client: Client) => {
    setEditingClientId(client.id);
    setBriefingGeral(client.briefing || '');
    setPublicoAlvo(client.briefing_publico_alvo || '');
    setTomVoz(client.briefing_tom_voz || '');
    setPratosFoco(client.briefing_pratos_foco || '');
    setIluminacaoEstetica(client.briefing_iluminacao_estetica || '');
    setRestricoes(client.briefing_restricoes || '');
    setRoteirosModelos(client.briefing_roteiros_modelos || '');
    setCardapioLink(client.cardapio_link || '');
  };

  const handleSaveBriefing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient) return;

    updateClient(activeClient.id, {
      briefing: briefingGeral.trim() || undefined,
      briefing_publico_alvo: publicoAlvo.trim() || undefined,
      briefing_tom_voz: tomVoz.trim() || undefined,
      briefing_pratos_foco: pratosFoco.trim() || undefined,
      briefing_iluminacao_estetica: iluminacaoEstetica.trim() || undefined,
      briefing_restricoes: restricoes.trim() || undefined,
      briefing_roteiros_modelos: roteirosModelos.trim() || undefined,
      cardapio_link: cardapioLink.trim() || undefined,
    });

    setEditingClientId(null);
  };

  const briefingsPreenchidosCount = useMemo(() => {
    return clients.filter(
      (c) =>
        Boolean(c.briefing?.trim()) ||
        Boolean(c.briefing_pratos_foco?.trim()) ||
        Boolean(c.briefing_roteiros_modelos?.trim())
    ).length;
  }, [clients]);

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. CABEÇALHO EXECUTIVO DA CENTRAL DE BRIEFINGS */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--ui-accent)]/15 text-[var(--ui-accent)] border border-[var(--ui-accent)]/30 flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-foreground font-heading">
                Central de Briefings & Roteiros Criativos
              </h2>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--ui-accent)]/15 text-[var(--ui-accent)] border border-[var(--ui-accent)]/30">
                Diretrizes de Captação & Edição
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Organize o posicionamento gastronômico, pratos carros-chefe, estética de iluminação, restrições e roteiros de cada restaurante para alinhar Filmmakers, Modelos e Editores.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canManage && (
            <button
              type="button"
              onClick={() => openClientModal()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[var(--ui-raised)] hover:bg-[var(--ui-hover)] border border-[var(--ui-border)] text-zinc-200 font-bold text-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[var(--ui-accent)]" />
              <span>Novo Restaurante</span>
            </button>
          )}
          {activeClient && editingClientId !== activeClient.id && (
            <button
              type="button"
              onClick={() => startEditingBriefing(activeClient)}
              className="gradient-cta flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-foreground font-bold text-xs shadow-md transition-all hover:scale-105 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Editar Briefing de {activeClient.nome}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. INDICADORES RÁPIDOS DE BRIEFING */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 uppercase font-bold block">
              Restaurantes na Carteira
            </span>
            <span className="text-2xl font-black text-foreground mt-1 block">
              {clients.length}
            </span>
          </div>
          <Building className="w-8 h-8 text-[var(--ui-accent)]/50" />
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 uppercase font-bold block">
              Briefings Estruturados
            </span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">
              {briefingsPreenchidosCount} / {clients.length}
            </span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400/50" />
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 uppercase font-bold block">
              Gravações com Roteiro / Pauta
            </span>
            <span className="text-2xl font-black text-[#38bdf8] mt-1 block">
              {events.filter((e) => Boolean(e.briefing_gravacao?.trim() || e.observacoes?.trim())).length}
            </span>
          </div>
          <Film className="w-8 h-8 text-[#38bdf8]/50" />
        </div>
      </div>

      {/* 3. ESTADO VAZIO SE NÃO HOUVER RESTAURANTES */}
      {clients.length === 0 ? (
        <div className="p-10 rounded-3xl bg-[var(--ui-surface)] border border-dashed border-[var(--ui-border)] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--ui-accent)]/15 text-[var(--ui-accent)] flex items-center justify-center mx-auto">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-foreground">
              Nenhum restaurante cadastrado para criar o Briefing
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Cadastre primeiro o restaurante parceiro para preencher as categorias de Briefing (público-alvo, pratos foco, tom de voz, iluminação e roteiros de Reels).
            </p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => openClientModal()}
              className="gradient-cta inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-foreground font-bold text-xs shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Cadastrar Primeiro Restaurante</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUNA ESQUERDA: SELETOR DE RESTAURANTES */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="p-4 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar restaurante ou prato..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] text-xs text-foreground focus:outline-none focus:border-[var(--ui-accent)]"
                />
              </div>

              <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
                {filteredClients.map((client) => {
                  const isSelected = activeClient?.id === client.id;
                  const hasBriefing =
                    Boolean(client.briefing?.trim()) ||
                    Boolean(client.briefing_pratos_foco?.trim()) ||
                    Boolean(client.briefing_roteiros_modelos?.trim());

                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setEditingClientId(null);
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-[var(--ui-accent)]/15 border-[var(--ui-accent)]/40 shadow-sm'
                          : 'bg-[var(--ui-raised)]/60 hover:bg-[var(--ui-raised)] border-[var(--ui-border)]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">
                          {client.nome}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          {client.instagram_handle || 'Sem @instagram'} • Meta: {client.meta_reels_mensal || 8} Reels/mês
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          hasBriefing
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {hasBriefing ? 'Preenchido' : 'Pendente'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: DOSSIÊ DE BRIEFING POR CATEGORIAS + ROTEIROS DE GRAVAÇÃO */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {activeClient && (
              <>
                {/* MODO EDIÇÃO COMPLETA DAS CATEGORIAS DO BRIEFING */}
                {editingClientId === activeClient.id ? (
                  <form
                    onSubmit={handleSaveBriefing}
                    className="p-5 sm:p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-accent)]/40 shadow-xl space-y-4 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--ui-border)] pb-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--ui-accent)]">
                          Editando Categorias de Briefing
                        </span>
                        <h3 className="text-lg font-black text-foreground">
                          {activeClient.nome}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingClientId(null)}
                        className="px-3 py-1.5 rounded-xl bg-[var(--ui-raised)] text-zinc-300 text-xs font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-foreground mb-1">
                          1. Conceito Geral & Posicionamento da Casa
                        </label>
                        <textarea
                          rows={3}
                          value={briefingGeral}
                          onChange={(e) => setBriefingGeral(e.target.value)}
                          placeholder="Ex: Cantina italiana tradicional familiar com massas artesanais feitas ao vivo no salão e foco em experiência gastronômica acolhedora."
                          className="w-full rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] p-3 text-xs text-foreground focus:outline-none focus:border-[var(--ui-accent)]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1">
                          2. Público-Alvo & Persona
                        </label>
                        <textarea
                          rows={3}
                          value={publicoAlvo}
                          onChange={(e) => setPublicoAlvo(e.target.value)}
                          placeholder="Ex: Casais 25-45 anos, famílias no almoço de domingo e executivos da região de Pinheiros/Itaim."
                          className="w-full rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] p-3 text-xs text-foreground focus:outline-none focus:border-[var(--ui-accent)]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1">
                          3. Tom de Voz, Locução & Música
                        </label>
                        <textarea
                          rows={3}
                          value={tomVoz}
                          onChange={(e) => setTomVoz(e.target.value)}
                          placeholder="Ex: Locução entusiasmada e elegante da modelo, cortes dinâmicos no beat, ASMR do queijo derretendo e trilha italiana moderna."
                          className="w-full rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] p-3 text-xs text-foreground focus:outline-none focus:border-[var(--ui-accent)]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1">
                          4. Pratos Carros-Chefe & Bebidas Foco
                        </label>
                        <textarea
                          rows={3}
                          value={pratosFoco}
                          onChange={(e) => setPratosFoco(e.target.value)}
                          placeholder="Ex: Fettuccine na roda de Grana Padano, Burrata ao pesto, Polpetone recheado, Tiramisù clássico e Negroni defumado."
                          className="w-full rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] p-3 text-xs text-foreground focus:outline-none focus:border-[var(--ui-accent)]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1">
                          5. Estética Visual, Iluminação & Ângulos
                        </label>
                        <textarea
                          rows={3}
                          value={iluminacaoEstetica}
                          onChange={(e) => setIluminacaoEstetica(e.target.value)}
                          placeholder="Ex: Luz quente 3200K, closes macro em 60fps mostrando vapor e calda escorrendo, planos da reação da modelo provando."
                          className="w-full rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] p-3 text-xs text-foreground focus:outline-none focus:border-[var(--ui-accent)]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-rose-400 mb-1">
                          6. Restrições & O que NÃO Fazer
                        </label>
                        <textarea
                          rows={3}
                          value={restricoes}
                          onChange={(e) => setRestricoes(e.target.value)}
                          placeholder="Ex: Não filmar a área de lavagem da cozinha; não usar músicas com palavrão; chef prefere não gravar locução falada."
                          className="w-full rounded-xl bg-[var(--ui-raised)] border border-rose-500/30 p-3 text-xs text-foreground focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1">
                          Link do Cardápio Digital (HTTPS)
                        </label>
                        <input
                          type="url"
                          value={cardapioLink}
                          onChange={(e) => setCardapioLink(e.target.value)}
                          placeholder="https://cardapio.restaurante.com.br"
                          className="w-full rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] p-3 text-xs text-foreground focus:outline-none focus:border-[var(--ui-accent)]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-foreground mb-1">
                          7. Banco de Ganchos (Hooks) & Roteiros Aprovados
                        </label>
                        <textarea
                          rows={4}
                          value={roteirosModelos}
                          onChange={(e) => setRoteirosModelos(e.target.value)}
                          placeholder="Ex:&#10;• Hook 1: 'Achamos a massa dentro do queijo mais cremosa de São Paulo...'&#10;• Hook 2: 'Almoço executivo completo com entrada, prato principal e sobremesa por...'&#10;• Hook 3: '3 motivos para comemorar seu aniversário no...'"
                          className="w-full rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] p-3 text-xs text-foreground focus:outline-none focus:border-[var(--ui-accent)]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="submit"
                        className="gradient-cta flex items-center gap-2 px-5 py-2.5 rounded-xl text-foreground font-bold text-xs shadow-lg cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Salvar Briefing Completo</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* VISUALIZAÇÃO ESTRUTURADA DAS CATEGORIAS DO BRIEFING */
                  <div className="p-5 sm:p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--ui-border)] pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg sm:text-xl font-black text-foreground">
                            {activeClient.nome}
                          </h3>
                          {activeClient.instagram_handle && (
                            <span className="text-xs font-bold text-[var(--ui-accent)]">
                              {activeClient.instagram_handle}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Plano: {activeClient.plano || 'Padrão'} • Meta: {activeClient.meta_reels_mensal || 8} Reels/mês
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {activeClient.cardapio_link && (
                          <a
                            href={activeClient.cardapio_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--ui-raised)] hover:bg-[var(--ui-hover)] border border-[var(--ui-border)] text-xs font-semibold text-[#38bdf8]"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Ver Cardápio</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => startEditingBriefing(activeClient)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--ui-accent)]/15 hover:bg-[var(--ui-accent)]/25 border border-[var(--ui-accent)]/35 text-[var(--ui-accent)] text-xs font-bold cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Preencher / Editar Categorias</span>
                        </button>
                      </div>
                    </div>

                    {/* GRADE DAS 6 CATEGORIAS DE BRIEFING DO CLIENTE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="md:col-span-2 p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--ui-accent)] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          1. Conceito Geral & Posicionamento
                        </span>
                        <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line">
                          {activeClient.briefing || 'Não preenchido. Clique em "Preencher / Editar Categorias" para definir o conceito criativo do restaurante.'}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          2. Público-Alvo & Persona
                        </span>
                        <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line">
                          {activeClient.briefing_publico_alvo || 'Defina quem é o cliente ideal que os vídeos devem atrair.'}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5" />
                          3. Tom de Voz, Locução & Música
                        </span>
                        <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line">
                          {activeClient.briefing_tom_voz || 'Defina se os vídeos têm locução da modelo, ASMR, humor ou trilha elegante.'}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Utensils className="w-3.5 h-3.5" />
                          4. Pratos Carros-Chefe & Bebidas Foco
                        </span>
                        <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line">
                          {activeClient.briefing_pratos_foco || 'Liste os pratos mais vendidos, sobremesas e drinks que precisam de destaque.'}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5" />
                          5. Estética Visual, Iluminação & Ângulos
                        </span>
                        <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line">
                          {activeClient.briefing_iluminacao_estetica || 'Defina a temperatura de luz, lentes macro, close-ups e estilo de color grading.'}
                        </p>
                      </div>

                      <div className="md:col-span-2 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          6. Restrições & O que Evitar na Gravação / Edição
                        </span>
                        <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line">
                          {activeClient.briefing_restricoes || 'Nenhuma restrição registrada até o momento.'}
                        </p>
                      </div>

                      <div className="md:col-span-2 p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--ui-accent)] flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5" />
                          7. Banco de Ganchos (Hooks) & Roteiros Aprovados
                        </span>
                        <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line">
                          {activeClient.briefing_roteiros_modelos || 'Adicione frases de gancho (3 primeiros segundos) e estruturas de roteiro para a dupla de gravação.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ROTEIROS ESPECÍFICOS DAS GRAVAÇÕES AGENDADAS DESTE CLIENTE */}
                <div className="p-5 sm:p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[var(--ui-accent)]" />
                        <span>Roteiros & Pautas por Diária de Gravação ({clientEvents.length})</span>
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Clique em qualquer gravação para abrir a aba &ldquo;Briefing&rdquo; e detalhar o roteiro do dia.
                      </p>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => openNewEventModal()}
                        className="px-3 py-1.5 rounded-xl bg-[var(--ui-raised)] hover:bg-[var(--ui-hover)] border border-[var(--ui-border)] text-xs font-bold text-zinc-200 cursor-pointer"
                      >
                        + Nova Gravação
                      </button>
                    )}
                  </div>

                  {clientEvents.length === 0 ? (
                    <div className="p-5 rounded-2xl bg-[var(--ui-raised)]/60 border border-[var(--ui-border)] text-center text-xs text-zinc-400">
                      Nenhuma gravação agendada para {activeClient.nome} ainda.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {clientEvents.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => openEditEventModal(ev)}
                          className="p-4 rounded-2xl bg-[var(--ui-raised)] hover:bg-[var(--ui-hover)] border border-[var(--ui-border)] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground">
                                {ev.data.split('-').reverse().join('/')} • {ev.hora_inicio.slice(0, 5)} às {ev.hora_fim.slice(0, 5)}
                              </span>
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[var(--ui-accent)]/15 text-[var(--ui-accent)]">
                                {ev.tipo}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-300 line-clamp-2">
                              {ev.briefing_gravacao || ev.observacoes || 'Sem roteiro específico cadastrado — clique para adicionar o briefing desta diária.'}
                            </p>
                          </div>

                          <span className="text-[11px] font-bold text-[var(--ui-accent)] shrink-0">
                            Abrir Roteiro →
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

