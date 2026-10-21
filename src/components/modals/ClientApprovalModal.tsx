'use client';

import React, { useState } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { MediaDeliverable } from '@/types/database';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Play,
  Copy,
  ExternalLink,
  MessageCircle,
  Share2,
  Sparkles,
  Smartphone,
  Eye,
  Check,
} from 'lucide-react';

interface ClientApprovalModalProps {
  deliverable: MediaDeliverable | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientApprovalModal({ deliverable, isOpen, onClose }: ClientApprovalModalProps) {
  const { updateDeliverableStatus, toast } = useAgenda();
  const [showAdjustInput, setShowAdjustInput] = useState(false);
  const [adjustmentText, setAdjustmentText] = useState('');

  if (!isOpen || !deliverable) return null;

  const handleApprove = () => {
    updateDeliverableStatus(deliverable.id, 'aprovado');
    toast(`Entregável "${deliverable.titulo}" aprovado com sucesso! 🎉`, 'success');
    onClose();
  };

  const handleRequestAdjustment = () => {
    if (!adjustmentText.trim()) {
      toast('Por favor, descreva os ajustes necessários.', 'warning');
      return;
    }
    updateDeliverableStatus(deliverable.id, 'ajustes_solicitados', adjustmentText.trim());
    toast(`Ajuste registrado para a equipe de edição.`, 'info');
    setShowAdjustInput(false);
    setAdjustmentText('');
    onClose();
  };

  const handleCopyWhatsAppLink = () => {
    const text = `🍽️ *Navegando MKT • Prévia de Conteúdo*\n\nOlá, equipe do *${deliverable.client?.nome || 'Restaurante'}*!\nO vídeo *${deliverable.titulo}* (versão v${deliverable.versao}) está pronto para sua avaliação e aprovação.\n\n🔗 *Pasta / Arquivo:* ${deliverable.drive_url || deliverable.pasta_drive_url || 'https://drive.google.com'}\n\nPor favor, confirme se está aprovado para agendarmos a publicação! ✨`;
    navigator.clipboard.writeText(text);
    toast('Texto e link copiados! Pronto para colar no WhatsApp.', 'success');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#141519] border-t sm:border border-[#26282f] rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto pb-safe sm:pb-7 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab bar mobile */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700 mx-auto -mt-1 sm:hidden shrink-0" />

        {/* Topo */}
        <div className="flex items-center justify-between border-b border-[#26282f] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white font-heading">
                  Central de Aprovação do Cliente
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  v{deliverable.versao}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {deliverable.client?.nome} • {deliverable.formato.replace('_', ' ')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#26282f] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mockup Smartphone 9:16 + Detalhes do Conteúdo */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
          {/* Mockup Vertical (4 colunas) */}
          <div className="sm:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-[220px] aspect-[9/16] rounded-3xl bg-[#090a0c] border-2 border-[#2b2d35] p-2 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
              {/* Top bar do Mockup */}
              <div className="flex items-center justify-between text-[9px] text-zinc-400 px-1 pt-1 z-10">
                <span className="font-semibold text-white">9:41</span>
                <span className="text-[8px] bg-red-600/80 text-white px-1.5 py-0.2 rounded-full">REELS</span>
              </div>

              {/* Fundo / Thumbnail */}
              {deliverable.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={deliverable.thumbnail_url}
                  alt={deliverable.titulo}
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-[#1b1d24] via-[#121316] to-[#0c0d10] flex flex-col items-center justify-center p-3 text-center">
                  <Play className="w-10 h-10 text-[#FF5A3C] fill-[#FF5A3C]/20 mb-2" />
                  <span className="text-[11px] font-bold text-white line-clamp-2">
                    {deliverable.titulo}
                  </span>
                </div>
              )}

              {/* Overlay inferior com @ e Legenda */}
              <div className="relative z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 pt-6 rounded-b-2xl">
                <span className="text-[10px] font-bold text-white block">
                  {deliverable.client?.instagram_handle || '@restaurante'}
                </span>
                <p className="text-[9px] text-zinc-300 line-clamp-2 mt-0.5 leading-tight">
                  {deliverable.descricao || 'O melhor sabor da gastronomia esperando por você hoje! ✨'}
                </p>
              </div>
            </div>

            {deliverable.drive_url && (
              <a
                href={deliverable.drive_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2.5 text-xs text-[#38bdf8] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Assistir no Google Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Detalhes da Postagem & Copywriting (7 colunas) */}
          <div className="sm:col-span-7 flex flex-col gap-3.5 text-xs">
            {/* Título & Status Atual */}
            <div className="p-3.5 rounded-2xl bg-[#1a1b21] border border-[#26282f] flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Título do Conteúdo
              </span>
              <h4 className="text-sm font-bold text-white">{deliverable.titulo}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-zinc-400">Status atual:</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    deliverable.status === 'aprovado'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : deliverable.status === 'ajustes_solicitados'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {deliverable.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Legenda & Copy sugerida */}
            <div className="p-3.5 rounded-2xl bg-[#1a1b21] border border-[#26282f] flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Copywriting / Legenda do Post
              </span>
              <p className="text-zinc-300 leading-relaxed text-xs">
                {deliverable.descricao || 'Sem legenda cadastrada ainda.'}
              </p>
              <div className="text-[10px] text-zinc-400 mt-1 font-mono">
                #gastronomia #sp #restaurantes #instafood #{deliverable.client?.nome.toLowerCase().replace(/\s+/g, '')}
              </div>
            </div>

            {/* Áudio Sugerido */}
            <div className="p-3 rounded-xl bg-[#141519] border border-[#26282f] flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Trilha Recomendada:</span>
              </span>
              <span className="font-semibold text-white">Bossa Nova Jazz Lounge (Em Alta)</span>
            </div>

            {/* Caixa de Ajustes (Se clicou em pedir ajuste) */}
            {showAdjustInput && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col gap-2 animate-in fade-in">
                <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  O que precisa ser ajustado pela equipe?
                </span>
                <textarea
                  rows={2}
                  value={adjustmentText}
                  onChange={(e) => setAdjustmentText(e.target.value)}
                  placeholder="Ex: Corrigir o corte aos 0:12 e trocar a música de fundo por algo mais animado..."
                  className="w-full bg-[#141519] border border-rose-500/30 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none resize-none"
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAdjustInput(false)}
                    className="px-2.5 py-1 rounded-lg text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestAdjustment}
                    className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs cursor-pointer shadow-md"
                  >
                    Confirmar Solicitação de Ajuste
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. AÇÕES DE APROVAÇÃO 1-CLIQUE */}
        <div className="pt-3 border-t border-[#26282f] flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleCopyWhatsAppLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#21232b] hover:bg-[#2b2d37] text-zinc-200 text-xs font-semibold border border-[#2b2d35] transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Copiar para WhatsApp</span>
          </button>

          <div className="flex items-center gap-2">
            {!showAdjustInput && (
              <button
                type="button"
                onClick={() => setShowAdjustInput(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs border border-rose-500/30 transition-colors cursor-pointer"
              >
                Pedir Ajuste
              </button>
            )}

            <button
              type="button"
              onClick={handleApprove}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Aprovar Este Conteúdo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
