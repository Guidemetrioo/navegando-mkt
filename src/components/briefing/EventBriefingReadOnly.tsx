'use client';

import type { EventItem } from '@/types/database';
import { useAgenda } from '@/context/AgendaContext';
import { Copy, Send } from 'lucide-react';
import { loadEventBriefingDrafts } from './BriefingView';
import {
  formatWhatsAppBriefingDocument,
  buildWhatsAppBriefingShareUrl,
} from '@/lib/briefing-whatsapp';

/** Agenda only reads the saved briefing; editing belongs to the dedicated categories. */
export function EventBriefingReadOnly({ event }: { event: EventItem }) {
  const { clients, toast } = useAgenda();
  const clientObj = event.client || clients.find((c) => c.id === event.client_id);

  const videoDrafts = loadEventBriefingDrafts(event, 'video').filter(
    (video) =>
      video.titulo.trim() ||
      video.roteiro.trim() ||
      video.refUrl.trim() ||
      video.refsExtras?.some((ref) => ref.url.trim())
  );
  const videoWritten = videoDrafts.length > 0;
  const whatsAppDocument = formatWhatsAppBriefingDocument(event, videoDrafts, clientObj?.nome);

  const edicaoDrafts = loadEventBriefingDrafts(event, 'edicao').filter(
    (video) =>
      video.titulo.trim() ||
      video.roteiro.trim() ||
      video.refUrl.trim() ||
      video.refsExtras?.some((ref) => ref.url.trim())
  );
  const edicaoWritten = edicaoDrafts.length > 0;

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(whatsAppDocument);
      toast('Documento de briefing copiado!', 'success');
    } catch {
      toast('Não foi possível copiar automaticamente. Use a opção de WhatsApp.', 'error');
    }
  };

  const handleOpenWhatsApp = () => {
    const url = buildWhatsAppBriefingShareUrl(whatsAppDocument, clientObj?.contato);
    window.open(url, '_blank', 'noopener,noreferrer');
    toast('Abrindo WhatsApp com o documento de briefing!', 'info');
  };

  return (
    <section aria-label="Consulta do briefing" className="flex flex-col gap-5 py-2">
      <p className="text-xs text-[var(--ui-muted)]">
        Consulta do briefing salvo. Para escrever ou alterar, use Briefing no menu.
      </p>

      {/* Briefing de Gravação exibido como o documento oficial enviado no WhatsApp */}
      <div className="rounded-xl border border-[var(--ui-border)] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm">Briefing de gravação (Documento WhatsApp)</h4>
            <span className={videoWritten ? 'text-xs text-emerald-400' : 'text-xs text-amber-300'}>
              {videoWritten ? 'Escrito' : 'Não escrito'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--ui-raised)] hover:bg-[var(--ui-border)] border border-[var(--ui-border)] text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[var(--ui-accent)]" />
              <span>Copiar</span>
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        <pre className="rounded-xl bg-[var(--ui-raised)] border border-emerald-500/25 p-3.5 text-xs sm:text-[13px] text-foreground whitespace-pre-wrap break-words font-sans leading-relaxed select-text">
          {whatsAppDocument}
        </pre>
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
    </section>
  );
}
