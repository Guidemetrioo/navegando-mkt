'use client';

import React from 'react';
import { useAgenda, AgendaView } from '@/context/AgendaContext';
import {
  Calendar as CalendarIcon,
  Columns,
  Table2,
  UserCheck,
  Film,
  MessageSquareHeart,
  Camera,
} from 'lucide-react';

export function ViewSwitcher() {
  const { currentView, setCurrentView } = useAgenda();

  const views: { id: AgendaView; label: string; icon: React.ReactNode; isSocial?: boolean }[] = [
    { id: 'mes', label: 'Mês', icon: <CalendarIcon className="w-3.5 h-3.5" /> },
    { id: 'semana', label: 'Semana', icon: <Columns className="w-3.5 h-3.5" /> },
    { id: 'escala', label: 'Escala da equipe', icon: <Table2 className="w-3.5 h-3.5" /> },
    { id: 'minha-agenda', label: 'Minha agenda', icon: <UserCheck className="w-3.5 h-3.5" /> },
    { id: 'ponto', label: 'Ponto & GPS', icon: <Camera className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'metricas-reels', label: 'Métricas Reels', icon: <Film className="w-3.5 h-3.5 text-[var(--ui-accent)]" />, isSocial: true },
    { id: 'mural-ugc', label: 'Mural UGC / Menções', icon: <MessageSquareHeart className="w-3.5 h-3.5 text-rose-400" />, isSocial: true },
  ];

  return (
    <div className="inline-flex p-1 bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-slate-200/70 rounded-xl border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-300 gap-1 overflow-x-auto max-w-full">
      {views.map((v) => {
        const isActive = currentView === v.id;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => setCurrentView(v.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              isActive
                ? 'bg-[var(--ui-border)] dark:bg-[var(--ui-border)] bg-white text-foreground dark:text-foreground text-zinc-900 shadow-sm border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200'
                : 'text-zinc-400 dark:text-zinc-400 text-zinc-600 hover:text-foreground dark:hover:text-foreground hover:text-zinc-900'
            }`}
          >
            {v.icon}
            <span>{v.label}</span>
          </button>
        );
      })}
    </div>
  );
}
