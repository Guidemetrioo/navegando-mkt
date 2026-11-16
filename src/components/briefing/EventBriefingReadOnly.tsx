'use client';

import { useRef, useState } from 'react';
import type { EventItem } from '@/types/database';
import { useAgenda } from '@/context/AgendaContext';
import {
  buildBriefingDocumentData,
  loadEventBriefingDrafts,
} from '@/lib/briefing-document';
import {
  BriefingDocumentPages,
  BriefingPdfFileCard,
  BriefingPdfViewerModal,
  downloadBriefingBlob,
  generateBriefingPdfBlob,
} from './BriefingStandardDocument';

/** Agenda shows the standard briefing file attachment (read-only); editing belongs to the Briefing tab. */
export function EventBriefingReadOnly({ event }: { event: EventItem }) {
  const { clients, toast } = useAgenda();
  const clientObj = event.client || clients.find((c) => c.id === event.client_id);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [renderExportDom, setRenderExportDom] = useState(false);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  const videoDoc = buildBriefingDocumentData(event, {
    clientName: clientObj?.nome,
    mode: 'video',
  });
  const videoWritten = videoDoc.items.length > 0;

  const edicaoDrafts = loadEventBriefingDrafts(event, 'edicao').filter(
    (video) =>
      video.titulo.trim() ||
      video.roteiro.trim() ||
      video.refUrl.trim() ||
      video.refsExtras?.some((ref) => ref.url.trim())
  );
  const edicaoWritten = edicaoDrafts.length > 0;

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

  return (
    <section aria-label="Consulta do briefing" className="flex flex-col gap-5 py-2">
      <p className="text-xs text-[var(--ui-muted)]">
        Consulta do briefing salvo. Para escrever ou alterar, use Briefing no menu.
      </p>

      {/* Briefing de Gravação exibido como o arquivo padrão PDF que abre no formato Navegando MKT */}
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

      {/* Briefing de Edição mantido inalterado */}
      <div className="rounded-xl border border-[var(--ui-border)] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-bold text-sm">Briefing de edição</h4>
          <span className={edicaoWritten ? 'text-xs text-emerald-400' : 'text-xs text-amber-300'}>
            {edicaoWritten ? 'Escrito' : 'Não escrito'}
          </span>
        </div>
        {edicaoDrafts.map((video, index) => (
          <article key={video.id} className="rounded-lg bg-[var(--ui-raised)] p-3 space-y-2 break-words">
            <h5 className="font-semibold text-sm">
              Vídeo {index + 1}
              {video.titulo.trim() ? ` — ${video.titulo}` : ''}
            </h5>
            {video.roteiro.trim() && <p className="text-sm whitespace-pre-wrap">{video.roteiro}</p>}
            {video.refUrl.trim() && (
              <p className="text-xs text-[var(--ui-muted)] break-all">
                {video.refRotulo}: {video.refUrl}
              </p>
            )}
            {video.refsExtras
              ?.filter((ref) => ref.url.trim())
              .map((ref, i) => (
                <p key={i} className="text-xs text-[var(--ui-muted)] break-all">
                  {ref.rotulo}: {ref.url}
                </p>
              ))}
          </article>
        ))}
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
