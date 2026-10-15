'use client';

import React from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthYear, formatWeekRange } from '@/lib/date-utils';

export function DateNavigator() {
  const { currentDate, currentView, navigate } = useAgenda();

  const title =
    currentView === 'semana' || currentView === 'escala'
      ? formatWeekRange(currentDate)
      : formatMonthYear(currentDate);

  return (
    <div className="flex items-center justify-between sm:justify-center relative w-full sm:w-auto my-2 gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('prev')}
          aria-label="Período anterior"
          className="p-1.5 rounded-xl bg-[#16171b] dark:bg-[#16171b] bg-slate-100 hover:bg-[#22242b] dark:hover:bg-[#22242b] hover:bg-slate-200 border border-[#26282f] dark:border-[#26282f] border-slate-300 text-zinc-300 dark:text-zinc-300 text-zinc-700 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <h2 className="text-base sm:text-lg font-bold text-white dark:text-white text-zinc-900 font-heading tracking-wide px-2 min-w-[170px] text-center select-none">
          {title}
        </h2>

        <button
          type="button"
          onClick={() => navigate('next')}
          aria-label="Próximo período"
          className="p-1.5 rounded-xl bg-[#16171b] dark:bg-[#16171b] bg-slate-100 hover:bg-[#22242b] dark:hover:bg-[#22242b] hover:bg-slate-200 border border-[#26282f] dark:border-[#26282f] border-slate-300 text-zinc-300 dark:text-zinc-300 text-zinc-700 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => navigate('today')}
        className="sm:absolute sm:right-0 px-3 py-1.5 rounded-xl bg-[#16171b] dark:bg-[#16171b] bg-slate-100 hover:bg-[#22242b] dark:hover:bg-[#22242b] hover:bg-slate-200 border border-[#26282f] dark:border-[#26282f] border-slate-300 text-xs font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700 transition-colors cursor-pointer"
      >
        Hoje
      </button>
    </div>
  );
}
