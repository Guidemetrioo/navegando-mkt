'use client';

import React from 'react';
import { AgendaView } from '@/context/AgendaContext';
import {
  Camera,
  MapPin,
  CheckCircle2,
  Calendar,
  Building,
  FolderOpen,
  TrendingUp,
  MessageSquare,
  DollarSign,
  Smartphone,
  ShieldCheck,
  Sparkles,
  FileText,
  ClipboardList,
  Play,
  Heart,
  Bookmark,
  Share2,
} from 'lucide-react';

interface VisualExamplePreviewProps {
  view: AgendaView;
}

/**
 * Gera uma imagem SVG ilustrada em alta definição (Data URL) representando visualmente
 * uma cena gastronômica / produção de vídeo / foto de ponto para os exemplos preenchidos.
 */
function makeIllustratedSvgDataUrl(title: string, subtitle: string, accentHex = '#FF6600', badge = '9:16 REEL'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#111318"/>
        <stop offset="55%" stop-color="#1b1f2a"/>
        <stop offset="100%" stop-color="${accentHex}33"/>
      </linearGradient>
      <linearGradient id="plate" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accentHex}"/>
        <stop offset="100%" stop-color="#f59e0b"/>
      </linearGradient>
    </defs>
    <rect width="600" height="320" rx="24" fill="url(#bg)"/>
    <circle cx="480" cy="150" r="95" fill="none" stroke="${accentHex}" stroke-opacity="0.25" stroke-width="2" stroke-dasharray="6 6"/>
    <circle cx="480" cy="150" r="68" fill="url(#plate)" fill-opacity="0.18" stroke="${accentHex}" stroke-width="2"/>
    <circle cx="480" cy="150" r="42" fill="${accentHex}" fill-opacity="0.35"/>
    <!-- Viewfinder corners -->
    <path d="M 30 50 L 30 30 L 50 30" fill="none" stroke="${accentHex}" stroke-width="3" stroke-linecap="round"/>
    <path d="M 550 30 L 570 30 L 570 50" fill="none" stroke="${accentHex}" stroke-width="3" stroke-linecap="round"/>
    <path d="M 30 270 L 30 290 L 50 290" fill="none" stroke="${accentHex}" stroke-width="3" stroke-linecap="round"/>
    <path d="M 550 290 L 570 290 L 570 270" fill="none" stroke="${accentHex}" stroke-width="3" stroke-linecap="round"/>
    <!-- REC indicator -->
    <rect x="48" y="44" width="76" height="26" rx="13" fill="#ef4444" fill-opacity="0.2" stroke="#ef4444" stroke-width="1.5"/>
    <circle cx="65" cy="57" r="5" fill="#ef4444"/>
    <text x="77" y="61" fill="#fca5a5" font-family="sans-serif" font-size="11" font-weight="bold">REC 4K</text>
    <!-- Badge -->
    <rect x="136" y="44" width="110" height="26" rx="13" fill="${accentHex}" fill-opacity="0.2" stroke="${accentHex}" stroke-width="1.5"/>
    <text x="191" y="61" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="bold">${badge}</text>
    <!-- Title & Subtitle -->
    <text x="48" y="155" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold">${title}</text>
    <text x="48" y="185" fill="#a1a1aa" font-family="sans-serif" font-size="14">${subtitle}</text>
    <!-- Bottom Audio Wave Simulation -->
    <g fill="${accentHex}" opacity="0.75">
      <rect x="48" y="230" width="6" height="22" rx="3"/>
      <rect x="60" y="218" width="6" height="34" rx="3"/>
      <rect x="72" y="225" width="6" height="27" rx="3"/>
      <rect x="84" y="210" width="6" height="42" rx="3"/>
      <rect x="96" y="222" width="6" height="30" rx="3"/>
      <rect x="108" y="214" width="6" height="38" rx="3"/>
      <rect x="120" y="228" width="6" height="24" rx="3"/>
      <rect x="132" y="220" width="6" height="32" rx="3"/>
      <rect x="144" y="232" width="6" height="20" rx="3"/>
    </g>
    <text x="165" y="245" fill="#e4e4e7" font-family="monospace" font-size="12">NAVEGANDO MKT • EXEMPLO VISUAL</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function VisualExamplePreview({ view }: VisualExamplePreviewProps) {
  // 1. CLIENTES / RESTAURANTES — Formulário visual com campos preenchidos
  if (view === 'clientes') {
    const imgUrl = makeIllustratedSvgDataUrl(
      'Trattoria Bella Napoli',
      '@bellanapoli.sp • Pinheiros, São Paulo',
      '#FF6600',
      'FICHA 360º'
    );
    return (
      <div className="rounded-2xl bg-[var(--ui-page)] border border-[var(--ui-border)] overflow-hidden shadow-lg">
        <div className="px-4 py-2.5 bg-[var(--ui-raised)] border-b border-[var(--ui-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[var(--ui-accent)]" />
            <span className="text-xs font-bold text-foreground">
              Imagem & Simulação do Formulário: &ldquo;Novo Restaurante Parceiro&rdquo;
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
            Campos Preenchidos
          </span>
        </div>

        <div className="p-4 space-y-4">
          <img
            src={imgUrl}
            alt="Exemplo visual do restaurante cadastrado"
            className="w-full h-36 object-cover rounded-xl border border-[var(--ui-border)]"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                Nome do Restaurante *
              </label>
              <input
                type="text"
                readOnly
                value="Trattoria Bella Napoli"
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-accent)]/50 text-xs font-bold text-foreground"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                Instagram (@handle)
              </label>
              <input
                type="text"
                readOnly
                value="@bellanapoli.sp"
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-xs text-[var(--ui-accent)] font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                Responsável no Local
              </label>
              <input
                type="text"
                readOnly
                value="Chef Marco Bellini (Sócio)"
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-xs text-foreground"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                WhatsApp (Confirmação D-1)
              </label>
              <input
                type="text"
                readOnly
                value="(11) 98877-6655"
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-emerald-500/40 text-xs text-emerald-300 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                Endereço Completo + Coordenadas GPS (Para Validação do Ponto)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  readOnly
                  value="Rua dos Pinheiros, 450 - Pinheiros, SP"
                  className="sm:col-span-1 px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-xs text-foreground"
                />
                <input
                  type="text"
                  readOnly
                  value="Lat: -23.5638"
                  className="px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-sky-500/40 text-xs text-sky-300 font-mono"
                />
                <input
                  type="text"
                  readOnly
                  value="Lng: -46.6854"
                  className="px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-sky-500/40 text-xs text-sky-300 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                Plano Contratado & Meta de Reels
              </label>
              <input
                type="text"
                readOnly
                value="Gastro Pro • 8 Reels / mês"
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-xs text-foreground"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                Valor da Mensalidade (R$)
              </label>
              <input
                type="text"
                readOnly
                value="R$ 4.200,00"
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-amber-500/40 text-xs font-bold text-amber-300 font-mono"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. BRIEFING & ROTEIROS — Simulação visual das 7 categorias preenchidas
  if (view === 'briefing') {
    const imgUrl = makeIllustratedSvgDataUrl(
      'Briefing Criativo & Roteiros',
      'Diretrizes de Iluminação, Pratos Foco, Tom de Voz e Hooks',
      '#a855f7',
      'BRIEFING 360º'
    );
    return (
      <div className="rounded-2xl bg-[var(--ui-page)] border border-[var(--ui-border)] overflow-hidden shadow-lg">
        <div className="px-4 py-2.5 bg-[var(--ui-raised)] border-b border-[var(--ui-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-foreground">
              Imagem & Campos Preenchidos: &ldquo;Categorias de Briefing do Restaurante&rdquo;
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
            7 Categorias
          </span>
        </div>

        <div className="p-4 space-y-3.5">
          <img
            src={imgUrl}
            alt="Exemplo visual de Briefing preenchido"
            className="w-full h-36 object-cover rounded-xl border border-[var(--ui-border)]"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-purple-300 mb-1">
                1. Conceito Geral & Posicionamento da Casa
              </label>
              <textarea
                readOnly
                rows={2}
                value="Cantina italiana artesanal em Pinheiros. Destaque para massas frescas finalizadas na mesa dentro da roda de queijo Grana Padano e ambiente acolhedor à luz de velas."
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-purple-500/40 text-xs text-foreground"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-sky-300 mb-1">
                2. Público-Alvo & Persona
              </label>
              <input
                type="text"
                readOnly
                value="Casais 25-45 anos, amantes de vinho e gastronomia italiana"
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-xs text-foreground"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-amber-300 mb-1">
                3. Tom de Voz, Locução & Trilha
              </label>
              <input
                type="text"
                readOnly
                value="Locução envolvente da modelo + ASMR do preparo na cozinha"
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-xs text-foreground"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-emerald-300 mb-1">
                4. Pratos Carros-Chefe Foco
              </label>
              <input
                type="text"
                readOnly
                value="Fettuccine no Grana Padano, Burrata ao Pesto e Tiramisù"
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-emerald-500/40 text-xs text-foreground"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-rose-300 mb-1">
                5. Restrições (O que NÃO fazer)
              </label>
              <input
                type="text"
                readOnly
                value="Não usar luz fria branca; não filmar a pia de lavagem"
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-rose-500/40 text-xs text-rose-200"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-[var(--ui-accent)] mb-1">
                6. Banco de Ganchos (Hooks) & Roteiro da Diária
              </label>
              <textarea
                readOnly
                rows={2}
                value="Reel 1 (Hook): 'Descobrimos a massa dentro do queijo mais cremosa de São Paulo...' | Reel 2: Close-up 60fps cortando a Burrata + taça de vinho sendo servida."
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-accent)]/40 text-xs text-foreground"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2.5 REEMBOLSOS DE GRAVAÇÃO — Simulação visual dos 3 campos preenchidos
  if (view === 'reembolsos') {
    const reimbSvg = makeIllustratedSvgDataUrl(
      'Comprovante de Despesa Anexado',
      'Recibo Uber / Estacionamento • Pronto para Reembolso PIX',
      '#10b981',
      '3 CAMPOS'
    );
    return (
      <div className="rounded-2xl bg-[var(--ui-page)] border border-[var(--ui-border)] overflow-hidden shadow-lg">
        <div className="px-4 py-2.5 bg-[var(--ui-raised)] border-b border-[var(--ui-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-foreground">
              Imagem & Simulação dos 3 Campos: &ldquo;Solicitar Novo Reembolso&rdquo;
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
            3 Passos Simples
          </span>
        </div>

        <div className="p-4 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-emerald-300 mb-1">
                1. Valor do Reembolso (R$) *
              </label>
              <input
                type="text"
                readOnly
                value="R$ 48,90"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--ui-surface)] border border-emerald-500/50 text-xs font-black font-mono text-emerald-300"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-[var(--ui-accent)] mb-1">
                2. Razão da Despesa *
              </label>
              <input
                type="text"
                readOnly
                value="Uber ida e volta gravação Trattoria Bella Napoli"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-accent)]/50 text-xs font-bold text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-sky-300 mb-1">
              3. Upload do Comprovante (Imagem / PDF Anexado) *
            </label>
            <img
              src={reimbSvg}
              alt="Exemplo visual do comprovante anexado no campo de upload"
              className="w-full h-36 object-cover rounded-xl border border-emerald-500/40"
            />
          </div>
        </div>
      </div>
    );
  }

  // 3. PONTO ELETRÔNICO & GPS — Simulação da câmera + foto + mapa GPS
  if (view === 'ponto') {
    const selfieSvg = makeIllustratedSvgDataUrl(
      'Foto Capturada na Câmera Ao Vivo',
      'Isa (Modelo) + Victor (Filmmaker) • Na Entrada do Restaurante',
      '#10b981',
      'GPS < 50m OK'
    );
    return (
      <div className="rounded-2xl bg-[var(--ui-page)] border border-[var(--ui-border)] overflow-hidden shadow-lg">
        <div className="px-4 py-2.5 bg-[var(--ui-raised)] border-b border-[var(--ui-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-foreground">
              Imagem & Campos Preenchidos: &ldquo;Registro de Ponto com Foto & GPS&rdquo;
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
            Validado no Local
          </span>
        </div>

        <div className="p-4 space-y-3.5">
          <img
            src={selfieSvg}
            alt="Simulação da foto capturada no ponto eletrônico"
            className="w-full h-40 object-cover rounded-xl border border-emerald-500/40"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                Tipo de Batida Selecionado
              </label>
              <input
                type="text"
                readOnly
                value="1ª Batida: Entrada"
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-emerald-500/40 text-xs font-bold text-emerald-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                Restaurante Vinculado
              </label>
              <input
                type="text"
                readOnly
                value="Trattoria Bella Napoli"
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                Distância Calculada via GPS
              </label>
              <input
                type="text"
                readOnly
                value="42 metros (NO LOCAL)"
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-emerald-500/40 text-xs font-mono text-emerald-300"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. AGENDAS (mes, semana, escala, minha-agenda)
  if (view === 'mes' || view === 'semana' || view === 'escala' || view === 'minha-agenda') {
    const agendaSvg = makeIllustratedSvgDataUrl(
      'Diária de Gravação Agendada',
      'Terça, 09:00 às 12:30 • Dupla Escalada: Victor + Isa',
      '#FF6600',
      'CONFIRMADO'
    );
    return (
      <div className="rounded-2xl bg-[var(--ui-page)] border border-[var(--ui-border)] overflow-hidden shadow-lg">
        <div className="px-4 py-2.5 bg-[var(--ui-raised)] border-b border-[var(--ui-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--ui-accent)]" />
            <span className="text-xs font-bold text-foreground">
              Imagem & Campos Preenchidos: &ldquo;Agendamento de Gravação & Escala&rdquo;
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--ui-accent)]/20 text-[var(--ui-accent)]">
            Sem Conflito de Horário
          </span>
        </div>

        <div className="p-4 space-y-3.5">
          <img
            src={agendaSvg}
            alt="Exemplo visual de gravação agendada"
            className="w-full h-36 object-cover rounded-xl border border-[var(--ui-border)]"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                Restaurante Selecionado *
              </label>
              <input
                type="text"
                readOnly
                value="Trattoria Bella Napoli"
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-accent)]/50 text-xs font-bold text-foreground"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                Data & Janela de Horário *
              </label>
              <input
                type="text"
                readOnly
                value="29/10/2026 • 09:00 às 12:30"
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-xs font-mono text-foreground"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                Categoria & Status *
              </label>
              <input
                type="text"
                readOnly
                value="Gravação • Confirmado"
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-emerald-500/40 text-xs font-bold text-emerald-400"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                Dupla / Equipe Escalada na Sessão *
              </label>
              <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)]">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  ✓ Victor (Filmmaker Gastronômico)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-bold">
                  ✓ Isa (Apresentadora & Modelo)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. RELATÓRIOS TÉCNICOS DOS VÍDEOS
  if (view === 'relatorios') {
    const repSvg = makeIllustratedSvgDataUrl(
      'Relatório Técnico Pós-Gravação',
      '48 Takes em 4K 60fps • Link da Pasta de Brutos Anexado',
      '#38bdf8',
      'RELATÓRIO OK'
    );
    return (
      <div className="rounded-2xl bg-[var(--ui-page)] border border-[var(--ui-border)] overflow-hidden shadow-lg">
        <div className="px-4 py-2.5 bg-[var(--ui-raised)] border-b border-[var(--ui-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#38bdf8]" />
            <span className="text-xs font-bold text-foreground">
              Imagem & Campos Preenchidos: &ldquo;Relatório do Filmmaker&rdquo;
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
            Pronto para Edição
          </span>
        </div>

        <div className="p-4 space-y-3.5">
          <img
            src={repSvg}
            alt="Exemplo visual de relatório técnico preenchido"
            className="w-full h-36 object-cover rounded-xl border border-[var(--ui-border)]"
          />

          <div className="space-y-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                Resumo dos Pratos Gravados, Takes & Ocorrências na Cozinha *
              </label>
              <textarea
                readOnly
                rows={3}
                value="Gravamos 4 Reels completos (48 takes em 4K 60fps com Sony FX3 + luz quente Amaran): 1) Fettuccine no queijo Grana Padano, 2) Bruschetta de Burrata, 3) Preparo do Negroni defumado, 4) Convite da Isa para o almoço executivo."
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-sky-500/40 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                Link da Pasta de Brutos no Google Drive (Para os Editores) *
              </label>
              <input
                type="text"
                readOnly
                value="https://drive.google.com/drive/folders/Brutos_28_10_BellaNapoli"
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-xs font-mono text-[#38bdf8]"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. CENTRAL DAM / ARQUIVOS
  if (view === 'arquivos') {
    const damSvg = makeIllustratedSvgDataUrl(
      'Reel #01 — Fettuccine no Queijo',
      'Formato Vertical 9:16 • Versão v2 • Status: Aprovado',
      '#FF6600',
      'APROVADO v2'
    );
    return (
      <div className="rounded-2xl bg-[var(--ui-page)] border border-[var(--ui-border)] overflow-hidden shadow-lg">
        <div className="px-4 py-2.5 bg-[var(--ui-raised)] border-b border-[var(--ui-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-[var(--ui-accent)]" />
            <span className="text-xs font-bold text-foreground">
              Imagem & Campos Preenchidos: &ldquo;Cadastro de Entregável na Central DAM&rdquo;
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
            Versão v2 Aprovada
          </span>
        </div>

        <div className="p-4 space-y-3.5">
          <img
            src={damSvg}
            alt="Exemplo visual de entregável na Central DAM"
            className="w-full h-36 object-cover rounded-xl border border-[var(--ui-border)]"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                Título da Peça / Vídeo *
              </label>
              <input
                type="text"
                readOnly
                value="Reel #01 — Fettuccine no Grana Padano (ASMR)"
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-accent)]/50 text-xs font-bold text-foreground"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                Formato & Etapa do Funil *
              </label>
              <input
                type="text"
                readOnly
                value="Reels 9:16 • Status: Aprovado"
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-emerald-500/40 text-xs font-bold text-emerald-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                Link Direto do Vídeo Editado no Google Drive *
              </label>
              <input
                type="text"
                readOnly
                value="https://drive.google.com/file/d/1BellaNapoli_Reel01_Final_v2/view"
                className="w-full px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-xs font-mono text-[#38bdf8]"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 7. MÉTRICAS DE REELS / INSTAGRAM
  if (view === 'metricas-reels') {
    const metricSvg = makeIllustratedSvgDataUrl(
      '48.500 Plays • 10,48% Engajamento',
      '890 Salvamentos • 620 Compartilhamentos no Direct',
      '#ec4899',
      'INSIGHTS REEL'
    );
    return (
      <div className="rounded-2xl bg-[var(--ui-page)] border border-[var(--ui-border)] overflow-hidden shadow-lg">
        <div className="px-4 py-2.5 bg-[var(--ui-raised)] border-b border-[var(--ui-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-pink-400" />
            <span className="text-xs font-bold text-foreground">
              Imagem & Campos Preenchidos: &ldquo;Métricas de Reel Publicado&rdquo;
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-500/20 text-pink-300">
            Alta Performance
          </span>
        </div>

        <div className="p-4 space-y-3.5">
          <img
            src={metricSvg}
            alt="Exemplo visual de métricas do Instagram"
            className="w-full h-36 object-cover rounded-xl border border-[var(--ui-border)]"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)]">
              <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                <Play className="w-3 h-3 text-[var(--ui-accent)]" /> Plays
              </span>
              <span className="text-sm font-black text-foreground block mt-0.5">48.500</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)]">
              <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-400" /> Curtidas
              </span>
              <span className="text-sm font-black text-foreground block mt-0.5">2.140</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--ui-surface)] border border-emerald-500/30">
              <span className="text-[10px] text-emerald-300 flex items-center gap-1">
                <Bookmark className="w-3 h-3 text-emerald-400" /> Salvos
              </span>
              <span className="text-sm font-black text-emerald-400 block mt-0.5">890</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--ui-surface)] border border-sky-500/30">
              <span className="text-[10px] text-sky-300 flex items-center gap-1">
                <Share2 className="w-3 h-3 text-sky-400" /> Shares
              </span>
              <span className="text-sm font-black text-sky-400 block mt-0.5">620</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 8. MURAL UGC / MENÇÕES
  if (view === 'mural-ugc') {
    const ugcSvg = makeIllustratedSvgDataUrl(
      '@roteirogastronomico.sp marcou a casa',
      '28.400 Seguidores • Selo Influenciador • Story 24h',
      '#f59e0b',
      'UGC & STORY'
    );
    return (
      <div className="rounded-2xl bg-[var(--ui-page)] border border-[var(--ui-border)] overflow-hidden shadow-lg p-4 space-y-3">
        <img
          src={ugcSvg}
          alt="Exemplo visual de marcação no Mural UGC"
          className="w-full h-36 object-cover rounded-xl border border-[var(--ui-border)]"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <input
            type="text"
            readOnly
            value="@roteirogastronomico.sp"
            className="px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-amber-500/40 text-xs font-bold text-amber-300"
          />
          <input
            type="text"
            readOnly
            value="28.400 seguidores (Influenciador)"
            className="px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-xs text-foreground"
          />
          <input
            type="text"
            readOnly
            value="Story 24h • Repostado nos Stories"
            className="px-3 py-2 rounded-xl bg-[var(--ui-surface)] border border-emerald-500/40 text-xs font-bold text-emerald-400"
          />
        </div>
      </div>
    );
  }

  // 9. FINANCEIRO EXECUTIVO
  if (view === 'financeiro') {
    const finSvg = makeIllustratedSvgDataUrl(
      'Fluxo de Caixa, Salários & Reembolsos',
      'Mensalidades Recebidas + Folha PIX + Custos de Gravação',
      '#10b981',
      'FINANCEIRO OK'
    );
    return (
      <div className="rounded-2xl bg-[var(--ui-page)] border border-[var(--ui-border)] overflow-hidden shadow-lg p-4 space-y-3">
        <img
          src={finSvg}
          alt="Exemplo visual do Controle Financeiro preenchido"
          className="w-full h-36 object-cover rounded-xl border border-[var(--ui-border)]"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-[var(--ui-surface)] border border-emerald-500/40">
            <span className="text-[10px] font-bold uppercase text-emerald-400 block">
              Mensalidade Recebida
            </span>
            <span className="text-xs font-bold text-foreground block mt-0.5">
              Trattoria Bella Napoli • R$ 4.200,00 (Pago via PIX)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--ui-surface)] border border-sky-500/40">
            <span className="text-[10px] font-bold uppercase text-sky-400 block">
              Salário Configurado
            </span>
            <span className="text-xs font-bold text-foreground block mt-0.5">
              Victor (Filmmaker) • R$ 4.500,00 • Dia 05 (Pago)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--ui-surface)] border border-amber-500/40">
            <span className="text-[10px] font-bold uppercase text-amber-400 block">
              Reembolso de Campo
            </span>
            <span className="text-xs font-bold text-foreground block mt-0.5">
              Uber Gravação (Isa) • R$ 46,80 (Reembolsado)
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 10. WHATSAPP D-1 & OUTRAS PÁGINAS (home, dashboard, whatsapp, backups)
  const genericSvg = makeIllustratedSvgDataUrl(
    view === 'whatsapp'
      ? 'Confirmação Automática WhatsApp D-1'
      : view === 'backups'
      ? 'Snapshot de Backup .JSON Verificado'
      : 'Painel Operacional Navegando MKT',
    view === 'whatsapp'
      ? 'Mensagem enviada 24h antes • Resposta "1 - Confirmado" sincronizada'
      : 'Todos os indicadores e alertas sincronizados em tempo real',
    '#FF6600',
    'SISTEMA ATIVO'
  );

  return (
    <div className="rounded-2xl bg-[var(--ui-page)] border border-[var(--ui-border)] overflow-hidden shadow-lg p-4 space-y-3">
      <img
        src={genericSvg}
        alt="Visualização ilustrada dos campos preenchidos"
        className="w-full h-36 object-cover rounded-xl border border-[var(--ui-border)]"
      />
    </div>
  );
}

