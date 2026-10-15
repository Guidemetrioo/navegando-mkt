'use client';

import React from 'react';

export function TypeLegend() {
  const types = [
    { label: 'Gravação', dotColor: 'bg-[#FF5A3C]' },
    { label: 'Fotografia', dotColor: 'bg-[#0ea5e9]' },
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
    </div>
  );
}
