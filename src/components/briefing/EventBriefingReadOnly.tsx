'use client';

import { useRef, useState } from 'react';
import type { EventItem } from '@/types/database';
import { useAgenda } from '@/context/AgendaContext';
import { isEventAssignedToMember } from '@/lib/workspace';
import {
  buildBriefingDocumentData,
  loadEventBriefingDrafts,
  serializeDraftsToRaw,
  type EditableVideoDraft,
} from '@/lib/briefing-document';
import {
  BriefingDocumentPages,
  BriefingPdfFileCard,
  BriefingPdfViewerModal,
  downloadBriefingBlob,
  generateBriefingPdfBlob,
} from './BriefingStandardDocument';
import { Plus, Save, Trash2 } from 'lucide-react';

/**
 * Na Agenda (ao clicar no compromisso):
 * - Briefing de Gravação: apenas visualização do arquivo PDF padrão (somente leitura);
 * - Briefing de Edição: único briefing editável diretamente na Agenda.
 */
export function EventBriefingReadOnly({ event }: { event: EventItem }) {
  const { clients, employees, loggedEmployeeId, canManage, saveEvent, toast } = useAgenda();
  const clientObj = event.client || clients.find((c) => c.id === event.client_id);
  const loggedMember = employees.find((e) => e.id === loggedEmployeeId);
  const isModelRole = loggedMember?.funcao === 'modelo' || loggedMember?.funcao === 'criadora';
  const isAssignedToEvent = isEventAssignedToMember(
    event as unknown as Record<string, unknown>,
    loggedEmployeeId
  );
  const canEditEdicao = canManage || !isModelRole || isAssignedToEvent;

  const [viewerOpen, setViewerOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [renderExportDom, setRenderExportDom] = useState(false);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  const [edicaoDrafts, setEdicaoDrafts] = useState<EditableVideoDraft[]>(() =>
    loadEventBriefingDrafts(event, 'edicao')
  );
  const [trackedEventKey, setTrackedEventKey] = useState(
    `${event.id}:${event.briefing_edicao || ''}:${(event.briefing_edicao_videos || []).length}`
  );
  const currentEventKey = `${event.id}:${event.briefing_edicao || ''}:${(event.briefing_edicao_videos || []).length}`;
  if (trackedEventKey !== currentEventKey) {
    setTrackedEventKey(currentEventKey);
    setEdicaoDrafts(loadEventBriefingDrafts(event, 'edicao'));
  }

  const videoDoc = buildBriefingDocumentData(event, {
    clientName: clientObj?.nome,
    mode: 'video',
  });
  const videoWritten = videoDoc.items.length > 0;

  const edicaoWritten = edicaoDrafts.some(
    (video) =>
      video.titulo.trim() ||
      video.roteiro.trim() ||
      video.refUrl.trim() ||
      video.refsExtras?.some((ref) => ref.url.trim())
  );

  const handleDownloadPdf = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setRenderExportDom(true);
    try {
      await new Promise((r) => setTimeout(r, 180));
      const container = exportContainerRef.current;
      if (!container) throw new Error('Container do documento indisponível.');
      const blob = await generateBriefingPdfBlob(container);
      downloadBriefingBlob(blob, videoDoc.fileName);
      toast(`Documento "${videoDoc.fileName}" baixado no padrão Navegando MKT!`, 'success');
    } catch (e) {
      toast(
        'Não foi possível gerar o PDF: ' + (e instanceof Error ? e.message : String(e)),
        'error'
      );
    } finally {
      setIsDownloading(false);
      setRenderExportDom(false);
    }
  };

  const handleUpdateEdicaoCard = (id: string, patch: Partial<EditableVideoDraft>) => {
    setEdicaoDrafts((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  const handleAddEdicaoCard = () => {
    setEdicaoDrafts((prev) => [
      ...prev,
      {
        id: `edicao-${prev.length + 1}-${Date.now()}`,
        titulo: '',
        formato: 'Automático',
        roteiro: '',
        refRotulo: 'Referência',
        refUrl: '',
      },
    ]);
  };

  const handleRemoveEdicaoCard = (id: string) => {
    setEdicaoDrafts((prev) => (prev.length > 1 ? prev.filter((v) => v.id !== id) : prev));
  };

  const handleSaveEdicao = () => {
    if (!event.id || !canEditEdicao) return;
    const raw = serializeDraftsToRaw(edicaoDrafts);
    const cleanedVideos = edicaoDrafts
      .filter(
        (v) =>
          v.titulo.trim() ||
          v.roteiro.trim() ||
          v.refUrl.trim() ||
          Boolean(v.refsExtras?.some((r) => r.url.trim()))
      )
      .map((v) => ({
        titulo: v.titulo,
        formato: v.formato || 'Automático',
        roteiro: v.roteiro,
        refRotulo: v.refRotulo,
        refUrl: v.refUrl,
        ...(v.modeloEditoraId ? { modeloEditoraId: v.modeloEditoraId } : {}),
        ...(v.aprovado !== undefined ? { aprovado: v.aprovado } : {}),
        ...(v.aprovadoPor ? { aprovadoPor: v.aprovadoPor } : {}),
        ...(v.aprovadoEm ? { aprovadoEm: v.aprovadoEm } : {}),
        ...(v.refsExtras?.length ? { refsExtras: v.refsExtras } : {}),
      }));

    try {
      const res = saveEvent(
        {
          ...event,
          briefing_edicao: raw || null,
          briefing_edicao_videos: cleanedVideos,
        },
        true
      );
      if (res.success) {
        toast('Briefing de edição salvo!', 'success');
      }
    } catch {
      // Erro já exibido pelo AgendaContext
    }
  };

  return (
    <section aria-label="Consulta e edição de briefing na agenda" className="flex flex-col gap-5 py-2">
      <p className="text-xs text-[var(--ui-muted)]">
        Na agenda, o <strong>Briefing de gravação</strong> é exibido apenas como arquivo PDF para consulta; apenas o{' '}
        <strong>Briefing de edição</strong> pode ser editado diretamente aqui.
      </p>

      {/* Briefing de Gravação (somente leitura: arquivo PDF padrão) */}
      <div className="rounded-xl border border-[var(--ui-border)] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-bold text-sm">Briefing de gravação</h4>
          <span className={videoWritten ? 'text-xs text-emerald-400' : 'text-xs text-amber-300'}>
            {videoWritten ? 'Escrito' : 'Não escrito'}
          </span>
        </div>

        <BriefingPdfFileCard
          doc={videoDoc}
          onOpen={() => setViewerOpen(true)}
          onDownloadPdf={handleDownloadPdf}
          isDownloading={isDownloading}
        />
      </div>

      {/* Briefing de Edição (editável na Agenda) */}
      <div className="rounded-xl border border-purple-500/30 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-bold text-sm text-purple-300">Briefing de edição</h4>
          <span className={edicaoWritten ? 'text-xs text-emerald-400' : 'text-xs text-amber-300'}>
            {edicaoWritten ? 'Escrito' : 'Não escrito'}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {edicaoDrafts.map((video, index) => (
            <article key={video.id} className="rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-purple-300">
                  Edição do Vídeo {String(index + 1).padStart(2, '0')}
                </span>
                {canEditEdicao && edicaoDrafts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEdicaoCard(video.id)}
                    className="text-xs text-zinc-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover</span>
                  </button>
                )}
              </div>

              <input
                type="text"
                readOnly={!canEditEdicao}
                disabled={!canEditEdicao}
                value={video.titulo}
                onChange={(e) => handleUpdateEdicaoCard(video.id, { titulo: e.target.value })}
                placeholder={`Título do Vídeo ${index + 1} (opcional)`}
                className="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-1.5 text-xs sm:text-sm text-foreground read-only:opacity-80"
              />

              <textarea
                rows={4}
                readOnly={!canEditEdicao}
                disabled={!canEditEdicao}
                value={video.roteiro}
                onChange={(e) => handleUpdateEdicaoCard(video.id, { roteiro: e.target.value })}
                placeholder="Descreva cortes, gancho, trilha, legenda e orientações de edição..."
                className="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-xs sm:text-sm text-foreground leading-relaxed resize-y read-only:opacity-80"
              />

              <input
                type="url"
                readOnly={!canEditEdicao}
                disabled={!canEditEdicao}
                value={video.refUrl}
                onChange={(e) => handleUpdateEdicaoCard(video.id, { refUrl: e.target.value })}
                placeholder="Link de referência ou pasta de brutos (https://...)"
                className="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-1.5 text-xs text-foreground read-only:opacity-80"
              />
            </article>
          ))}
        </div>

        {canEditEdicao && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleAddEdicaoCard}
              className="px-3 py-2 rounded-xl border border-dashed border-purple-400/60 text-purple-300 hover:bg-purple-500/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar card</span>
            </button>

            <button
              type="button"
              onClick={handleSaveEdicao}
              className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Briefing de Edição</span>
            </button>
          </div>
        )}
      </div>

      <BriefingPdfViewerModal
        open={viewerOpen}
        doc={videoDoc}
        onClose={() => setViewerOpen(false)}
        onDownloadPdf={handleDownloadPdf}
        isDownloading={isDownloading}
      />

      {renderExportDom && (
        <div
          ref={exportContainerRef}
          aria-hidden="true"
          style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none', opacity: 1 }}
        >
          <BriefingDocumentPages doc={videoDoc} />
        </div>
      )}
    </section>
  );
}
