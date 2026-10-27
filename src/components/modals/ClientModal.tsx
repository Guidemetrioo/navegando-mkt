'use client';

import React, { useState, useEffect } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { Client } from '@/types/database';
import {
  X,
  Building,
  MapPin,
  Phone,
  User,
  Link,
  Save,
  FileText,
} from 'lucide-react';

export function ClientModal() {
  const {
    isClientModalOpen,
    editingClient,
    closeClientModal,
    addClient,
    updateClient,
  } = useAgenda();

  const [nome, setNome] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [endereco, setEndereco] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [telefone, setTelefone] = useState('');
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState<'ativo' | 'onboarding' | 'pausado'>('ativo');
  const [plano, setPlano] = useState('');
  const [metaReelsMensal, setMetaReelsMensal] = useState<number>(8);
  const [valorMensalidade, setValorMensalidade] = useState<number>(3800);
  const [cardapioLink, setCardapioLink] = useState('');
  const [briefing, setBriefing] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');

  useEffect(() => {
    if (isClientModalOpen) {
      if (editingClient) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset a draft when the externally controlled client modal opens.
        setNome(editingClient.nome);
        setInstagramHandle(editingClient.instagram_handle || '');
        setEndereco(editingClient.endereco || '');
        setResponsavel(editingClient.responsavel || '');
        setTelefone(editingClient.telefone || editingClient.contato || '');
        setDriveFolderUrl(editingClient.drive_folder_url || '');
        setObservacoes(editingClient.observacoes || '');
        setStatus(editingClient.status || 'ativo');
        setPlano(editingClient.plano || '');
        setMetaReelsMensal(editingClient.meta_reels_mensal ?? 8);
        setValorMensalidade(editingClient.valor_mensalidade ?? 0);
        setCardapioLink(editingClient.cardapio_link || '');
        setBriefing(editingClient.briefing || '');
        setLatitude(editingClient.latitude==null ? '' : String(editingClient.latitude));
        setLongitude(editingClient.longitude==null ? '' : String(editingClient.longitude));
      } else {
        setNome('');
        setInstagramHandle('');
        setEndereco('');
        setResponsavel('');
        setTelefone('');
        setDriveFolderUrl('');
        setObservacoes('');
        setStatus('ativo');
        setPlano('');
        setMetaReelsMensal(8);
        setValorMensalidade(0);
        setCardapioLink('');
        setBriefing('');
        setLatitude('');
        setLongitude('');
      }
    }
  }, [isClientModalOpen, editingClient]);

  if (!isClientModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      alert('Por favor, informe o nome do restaurante.');
      return;
    }

    const payload: Omit<Client, 'id'> = {
      nome: nome.trim(),
      instagram_handle: instagramHandle.trim() || undefined,
      endereco: endereco.trim() || undefined,
      responsavel: responsavel.trim() || undefined,
      telefone: telefone.trim() || undefined,
      contato: telefone.trim() || undefined,
      drive_folder_url: driveFolderUrl.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
      status,
      plano: plano.trim() || undefined,
      meta_reels_mensal: metaReelsMensal || 8,
      valor_mensalidade: valorMensalidade || 0,
      cardapio_link: cardapioLink.trim() || undefined,
      briefing: briefing.trim() || undefined,
      latitude:latitude.trim()==='' ? null : Number(latitude),
      longitude:longitude.trim()==='' ? null : Number(longitude),
    };

    if (editingClient) {
      updateClient(editingClient.id, payload);
    } else {
      addClient(payload);
    }

    closeClientModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
      onClick={closeClientModal}
    >
      <div
        className="relative w-full max-w-lg bg-[var(--ui-surface)] border-t sm:border border-[var(--ui-border)] rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto pb-safe sm:pb-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab bar para mobile */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700 mx-auto -mt-1 sm:hidden shrink-0" />

        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-[var(--ui-border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--ui-accent)]/10 text-[var(--ui-accent)] border border-[var(--ui-accent)]/30 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground font-heading">
                {editingClient ? 'Editar Restaurante' : 'Novo Restaurante Parceiro'}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Cadastre os dados de contato, endereço e pasta no Google Drive do cliente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeClientModal}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-foreground hover:bg-[var(--ui-border)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {/* Nome e @ Instagram */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Nome do Restaurante *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Le Bife Jardins"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                @ do Instagram
              </label>
              <input
                type="text"
                placeholder="@lebife.oficial"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
              />
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              Endereço Físico (para validação do GPS do ponto)
            </label>
            <input
              type="text"
              placeholder="Rua Oscar Freire, 1050 - Jardins, São Paulo - SP"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
            />
          </div>

          {/* Responsável e Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="grid gap-1 text-xs text-zinc-300">Latitude real (opcional)<input type="number" step="any" min={-90} max={90} value={latitude} onChange={e=>setLatitude(e.target.value)} placeholder="Ex.: -23.5505" className="w-full border border-[var(--ui-border)] bg-[var(--ui-raised)] p-2 rounded-lg" /></label>
              <label className="grid gap-1 text-xs text-zinc-300">Longitude real (opcional)<input type="number" step="any" min={-180} max={180} value={longitude} onChange={e=>setLongitude(e.target.value)} placeholder="Ex.: -46.6333" className="w-full border border-[var(--ui-border)] bg-[var(--ui-raised)] p-2 rounded-lg" /></label>
              <p className="text-xs text-zinc-500 sm:col-span-2">Confirme o ponto exato do restaurante no mapa. Sem essas coordenadas, o sistema não validará o raio do ponto externo.</p>
            </div>
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Nome do Gerente / Responsável
              </label>
              <input
                type="text"
                placeholder="Ex: Carlos Oliveira (Sócio)"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                placeholder="(11) 98765-4321"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
              />
            </div>
          </div>

          {/* Dados do Contrato & CRM de Marketing */}
          <div className="p-3.5 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                <FileText className="w-3.5 h-3.5 text-[var(--ui-accent)]" />
                <span>Contrato & Plano de Marketing</span>
              </span>
              <div className="flex items-center gap-1 bg-[var(--ui-surface)] p-0.5 rounded-lg border border-[var(--ui-border)]">
                {(['ativo', 'onboarding', 'pausado'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold capitalize transition-all cursor-pointer ${
                      status === st
                        ? st === 'ativo'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : st === 'onboarding'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'text-zinc-400 hover:text-foreground'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Nome do Pacote / Plano
                </label>
                <input
                  type="text"
                  placeholder="Ex: Gastro Pro (8 Reels + 4 Carrosséis)"
                  value={plano}
                  onChange={(e) => setPlano(e.target.value)}
                  className="w-full bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground text-xs placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Meta Reels/Mês
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={metaReelsMensal}
                  onChange={(e) => setMetaReelsMensal(Number(e.target.value))}
                  className="w-full bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground text-xs placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Mensalidade (R$)
                </label>
                <input
                  type="number"
                  placeholder="3800"
                  value={valorMensalidade}
                  onChange={(e) => setValorMensalidade(Number(e.target.value))}
                  className="w-full bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground text-xs placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Link do Cardápio Digital
                </label>
                <input
                  type="url"
                  placeholder="https://restaurante.cardapio.digital"
                  value={cardapioLink}
                  onChange={(e) => setCardapioLink(e.target.value)}
                  className="w-full bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground text-xs placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                Briefing & Identidade Gastronômica da Marca
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Tons quentes, corte em slow motion, ASMR de crocância. Não usar trilhas lentas."
                value={briefing}
                onChange={(e) => setBriefing(e.target.value)}
                className="w-full bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground text-xs placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)] resize-none"
              />
            </div>
          </div>

          {/* Pasta do Google Drive (Anti-Perda) */}
          <div className="p-3.5 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex flex-col gap-2">
            <span className="font-bold text-foreground flex items-center gap-1.5 text-xs">
              <Link className="w-3.5 h-3.5 text-[#38bdf8]" />
              Pasta de Arquivos no Google Drive
            </span>
            <input
              type="url"
              placeholder="https://drive.google.com/drive/folders/..."
              value={driveFolderUrl}
              onChange={(e) => setDriveFolderUrl(e.target.value)}
              className="w-full bg-[var(--ui-border)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
            />
            <span className="text-[10px] text-zinc-400">
              Esta pasta conterá todos os brutos de câmeras e vídeos finais gravados pela equipe para este restaurante.
            </span>
          </div>

          {/* Observações / Preferências Gastronômicas */}
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              Observações Gerais e Preferências
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Não gravar nas segundas; foco em vinhos finos e sobremesas da estação..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)] resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex items-center gap-3 pt-3 border-t border-[var(--ui-border)]">
            <button
              type="button"
              onClick={closeClientModal}
              className="flex-1 py-2.5 rounded-xl border border-[var(--ui-border)] text-zinc-400 hover:text-foreground transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[2] py-2.5 rounded-xl brand-solid bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-foreground font-bold transition-all shadow-lg shadow-[var(--ui-accent)]/25 cursor-pointer"
            >
              {editingClient ? 'Atualizar Restaurante' : 'Cadastrar Restaurante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
