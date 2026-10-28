'use client';
import { todayInSaoPaulo } from '@/lib/date-utils';

import React, { useState, useEffect } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { DeliverableFormat, DeliverableStatus } from '@/types/database';
import {
  X,
  FolderOpen,
  Video,
  Link,
  Building,
  CheckCircle2,
  Sparkles,
  Layers,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export function DeliverableModal() {
  const {
    isDeliverableModalOpen,
    deliverableModalClientId,
    editingDeliverable,
    closeDeliverableModal,
    addDeliverable,
    updateDeliverable,
    clients,
    employees,
  } = useAgenda();

  const [clientId, setClientId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [formato, setFormato] = useState<DeliverableFormat>('reels_9_16');
  const [status, setStatus] = useState<DeliverableStatus>('em_edicao');
  const [versao, setVersao] = useState<number>(1);
  const [driveUrl, setDriveUrl] = useState('');
  const [pastaDriveUrl, setPastaDriveUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [filmmakerId, setFilmmakerId] = useState('usr-victor');
  const [criadoraId, setCriadoraId] = useState('usr-isa');
  const [dataGravacao, setDataGravacao] = useState(todayInSaoPaulo());
  const [dataPublicacao, setDataPublicacao] = useState(todayInSaoPaulo());
  const [observacoesAjuste, setObservacoesAjuste] = useState('');

  useEffect(() => {
    if (isDeliverableModalOpen) {
      if (editingDeliverable) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset a draft when the externally controlled deliverable changes.
        setClientId(editingDeliverable.client_id);
        setTitulo(editingDeliverable.titulo);
        setDescricao(editingDeliverable.descricao || '');
        setFormato(editingDeliverable.formato);
        setStatus(editingDeliverable.status);
        setVersao(editingDeliverable.versao || 1);
        setDriveUrl(editingDeliverable.drive_url || '');
        setPastaDriveUrl(editingDeliverable.pasta_drive_url || '');
        setThumbnailUrl(editingDeliverable.thumbnail_url || '');
        setFilmmakerId(editingDeliverable.filmmaker_id || employees.find((e) => e.funcao === 'filmmaker')?.id || 'usr-victor');
        setCriadoraId(editingDeliverable.criadora_id || employees.find((e) => e.funcao === 'modelo' || e.funcao === 'criadora')?.id || 'usr-isa');
        setDataGravacao(editingDeliverable.data_gravacao || todayInSaoPaulo());
        setDataPublicacao(editingDeliverable.data_publicacao_prevista || todayInSaoPaulo());
        setObservacoesAjuste(editingDeliverable.observacoes_ajuste || '');
      } else {
        const defaultClient = deliverableModalClientId || clients[0]?.id || '';
        setClientId(defaultClient);
        setTitulo('');
        setDescricao('');
        setFormato('reels_9_16');
        setStatus('em_edicao');
        setVersao(1);
        setDriveUrl('');
        setPastaDriveUrl('');
        setThumbnailUrl('');
        setFilmmakerId(employees.find((e) => e.funcao === 'filmmaker')?.id || 'usr-victor');
        setCriadoraId(employees.find((e) => e.funcao === 'modelo' || e.funcao === 'criadora')?.id || 'usr-isa');
        setDataGravacao(todayInSaoPaulo());
        setDataPublicacao(todayInSaoPaulo());
        setObservacoesAjuste('');
      }
    }
  }, [isDeliverableModalOpen, editingDeliverable, deliverableModalClientId, clients, employees]);

  if (!isDeliverableModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      alert('Por favor, informe o título do vídeo ou arquivo.');
      return;
    }
    if (!clientId) {
      alert('Por favor, selecione o restaurante cliente.');
      return;
    }

    if (editingDeliverable) {
      updateDeliverable(editingDeliverable.id, {
        client_id: clientId,
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        formato,
        status,
        versao: Number(versao) || 1,
        drive_url: driveUrl.trim() || undefined,
        pasta_drive_url: pastaDriveUrl.trim() || undefined,
        thumbnail_url: thumbnailUrl.trim() || undefined,
        filmmaker_id: filmmakerId,
        criadora_id: criadoraId,
        data_gravacao: dataGravacao,
        data_publicacao_prevista: dataPublicacao || undefined,
        observacoes_ajuste: observacoesAjuste.trim() || undefined,
      });
    } else {
      addDeliverable({
        client_id: clientId,
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        formato,
        status,
        versao: Number(versao) || 1,
        drive_url: driveUrl.trim() || undefined,
        pasta_drive_url: pastaDriveUrl.trim() || undefined,
        thumbnail_url: thumbnailUrl.trim() || undefined,
        filmmaker_id: filmmakerId,
        criadora_id: criadoraId,
        data_gravacao: dataGravacao,
        data_publicacao_prevista: dataPublicacao || undefined,
        observacoes_ajuste: observacoesAjuste.trim() || undefined,
      });
      closeDeliverableModal();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
      onClick={closeDeliverableModal}
    >
      <div
        className="relative w-full max-w-xl bg-[var(--ui-surface)] border-t sm:border border-[var(--ui-border)] rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab bar para mobile */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700 mx-auto -mt-1 sm:hidden shrink-0" />

        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-[var(--ui-border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground font-heading">
                  {editingDeliverable ? 'Editar Arquivo / Entregável' : 'Novo Arquivo / Vídeo da Agência'}
                </h3>
                {editingDeliverable && (
                  <span className="text-[10px] font-mono font-bold bg-[var(--ui-accent)]/20 text-[var(--ui-accent)] px-2 py-0.5 rounded-full border border-[var(--ui-accent)]/30">
                    v{editingDeliverable.versao}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Central de Ativos Digitais: links do Google Drive, brutos RAW e aprovações de clientes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeDeliverableModal}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-foreground hover:bg-[var(--ui-border)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {/* Título do Conteúdo */}
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              Título do Vídeo / Peça *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Reels: Preparo do Risoto de Camarão na Chapa"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
            />
          </div>

          {/* Restaurante & Formato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Restaurante Parceiro *
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground focus:outline-none cursor-pointer"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Formato do Arquivo
              </label>
              <select
                value={formato}
                onChange={(e) => setFormato(e.target.value as DeliverableFormat)}
                className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground focus:outline-none cursor-pointer"
              >
                <option value="reels_9_16">Reels Dinâmico (9:16)</option>
                <option value="feed_post">Feed Post (4:5 / 1:1)</option>
                <option value="carrossel">Carrossel Educativo</option>
                <option value="stories">Sequência de Stories</option>
                <option value="fotos_menu">Pacote Fotos de Cardápio</option>
                <option value="bruto_raw">Brutos RAW da Câmera</option>
              </select>
            </div>
          </div>

          {/* Links do Google Drive (Anti-Perda e Anti-Extravio) */}
          <div className="p-3.5 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                <Link className="w-3.5 h-3.5 text-[#38bdf8]" />
                Armazenamento em Nuvem (Google Drive / Dropbox)
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Anti-Perda de Arquivos
              </span>
            </div>

            {/* Link do Vídeo Final */}
            <div>
              <label className="block text-[11px] text-zinc-300 mb-1 font-medium">
                Link do Vídeo Final / Corte Editado (Google Drive / Frame.io)
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/file/d/.../view"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                className="w-full bg-[var(--ui-border)] border border-[var(--ui-border)] rounded-xl px-3 py-1.5 text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
              />
            </div>

            {/* Pasta de Brutos RAW */}
            <div>
              <label className="block text-[11px] text-zinc-300 mb-1 font-medium">
                Pasta de Gravação com Arquivos Brutos (RAW Footage Folder)
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={pastaDriveUrl}
                onChange={(e) => setPastaDriveUrl(e.target.value)}
                className="w-full bg-[var(--ui-border)] border border-[var(--ui-border)] rounded-xl px-3 py-1.5 text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Garante que os arquivos brutos das câmeras fiquem catalogados antes da formatação dos cartões de memória.
              </p>
            </div>
          </div>

          {/* Dupla Responsável */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Filmmaker / Câmera
              </label>
              <select
                value={filmmakerId}
                onChange={(e) => setFilmmakerId(e.target.value)}
                className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground focus:outline-none cursor-pointer"
              >
                {employees
                  .filter((e) => e.funcao === 'filmmaker')
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nome} (Filmmaker)
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Criadora / Apresentadora
              </label>
              <select
                value={criadoraId}
                onChange={(e) => setCriadoraId(e.target.value)}
                className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground focus:outline-none cursor-pointer"
              >
                {employees
                  .filter((e) => e.funcao === 'criadora' || e.funcao === 'modelo')
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nome} (Criadora)
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Status Inicial, Versão e Prazos */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-zinc-300 mb-1">
                Status Atual do Entregável
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DeliverableStatus)}
                className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground focus:outline-none cursor-pointer"
              >
                <option value="captado_raw">Bruto RAW</option>
                <option value="em_edicao">Em Edição</option>
                <option value="aguardando_aprovacao">Aguardando Aprovação</option>
                <option value="ajustes_solicitados">Ajustes Solicitados</option>
                <option value="aprovado">Aprovado</option>
                <option value="publicado">Publicado</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Versão (vX)
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={versao}
                onChange={(e) => setVersao(parseInt(e.target.value) || 1)}
                className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground focus:outline-none cursor-pointer text-center font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Previsão Postagem
              </label>
              <input
                type="date"
                value={dataPublicacao}
                onChange={(e) => setDataPublicacao(e.target.value)}
                className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Notas de Ajuste do Cliente */}
          {(status === 'ajustes_solicitados' || editingDeliverable?.observacoes_ajuste) && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-1.5">
              <label className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Notas de Revisão / Ajustes Solicitados pelo Cliente
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Trocar a música de fundo aos 0:12, dar mais destaque ao prato novo..."
                value={observacoesAjuste}
                onChange={(e) => setObservacoesAjuste(e.target.value)}
                className="w-full bg-[var(--ui-surface)] border border-amber-500/30 rounded-xl px-3 py-2 text-amber-200 placeholder:text-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none text-xs"
              />
            </div>
          )}

          {/* Miniatura / Capa */}
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              URL da Miniatura / Capa do Vídeo (Opcional, HTTPS)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-1.5 text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
            />
          </div>

          {/* Descrição / Roteiro */}
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              Briefing / Observações do Conteúdo (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Destacar iluminação na mesa de entrada, foco no queijo derretendo, CTA para direct..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)] resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex items-center gap-3 pt-3 border-t border-[var(--ui-border)]">
            <button
              type="button"
              onClick={closeDeliverableModal}
              className="flex-1 py-2.5 rounded-xl border border-[var(--ui-border)] text-zinc-400 hover:text-foreground transition-colors cursor-pointer font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[2] py-2.5 rounded-xl brand-solid bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-foreground font-bold transition-all shadow-lg shadow-[var(--ui-accent)]/25 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingDeliverable ? 'Salvar Alterações do Arquivo' : 'Salvar Arquivo no Sistema'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
