'use client';

import type { EventItem } from '@/types/database';
import { loadEventBriefingDrafts } from './BriefingView';

/** Agenda only reads the saved briefing; editing belongs to the dedicated categories. */
export function EventBriefingReadOnly({ event }: { event: EventItem }) {
  return (
    <section aria-label="Consulta do briefing" className="flex flex-col gap-5 py-2">
      <p className="text-xs text-[var(--ui-muted)]">
        Consulta do briefing salvo. Para escrever ou alterar, use Briefing no menu.
      </p>
      {(['video', 'edicao'] as const).map(mode => {
        const drafts = loadEventBriefingDrafts(event, mode).filter(video => video.titulo.trim() || video.roteiro.trim() || video.refUrl.trim() || video.refsExtras?.some(ref => ref.url.trim()));
        const written = drafts.length > 0;
        return (
          <div key={mode} className="rounded-xl border border-[var(--ui-border)] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-bold text-sm">{mode === 'video' ? 'Briefing de gravação' : 'Briefing de edição'}</h4>
              <span className={written ? 'text-xs text-emerald-400' : 'text-xs text-amber-300'}>{written ? 'Escrito' : 'Não escrito'}</span>
            </div>
            {drafts.map((video, index) => (
              <article key={video.id} className="rounded-lg bg-[var(--ui-raised)] p-3 space-y-2 break-words">
                <h5 className="font-semibold text-sm">Vídeo {index + 1}{video.titulo.trim() ? ` — ${video.titulo}` : ''}</h5>
                {video.roteiro.trim() && <p className="text-sm whitespace-pre-wrap">{video.roteiro}</p>}
                {video.refUrl.trim() && <p className="text-xs text-[var(--ui-muted)] break-all">{video.refRotulo}: {video.refUrl}</p>}
                {video.refsExtras?.filter(ref => ref.url.trim()).map((ref, i) => <p key={i} className="text-xs text-[var(--ui-muted)] break-all">{ref.rotulo}: {ref.url}</p>)}
              </article>
            ))}
          </div>
        );
      })}
    </section>
  );
}
