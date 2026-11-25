'use client';

import React from 'react';

export function TypeLegend() {
  const types = [
    { label: 'Gravação', dotColor: 'bg-[var(--ui-accent)]' },
    { label: 'Edição', dotColor: 'bg-[#a855f7]' },
    { label: 'Reunião', dotColor: 'bg-[#a1a1aa]' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 dark:text-zinc-400 text-zinc-600 py-1">
      {types.map((t) => (
        <div key={t.label} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full shrink-0 ${t.dotColor}`} />
          <span>{t.label}</span>
        </div>
      ))}
      <span className="hidden sm:inline text-zinc-600">•</span>
      <div className="flex items-center gap-1.5">
        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--ui-accent)]/20 text-[var(--ui-accent)] border border-[var(--ui-accent)]/40">
          Hoje
        </span>
        <span>Dia atual em destaque</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full shrink-0 bg-zinc-500" />
        <span className="text-zinc-500">Já passou</span>
      </div>
    </div>
  );
}
