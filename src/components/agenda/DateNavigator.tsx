'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { ChevronLeft, ChevronRight, Calendar, Check, Clock } from 'lucide-react';
import {
  formatMonthYear,
  formatWeekRange,
  formatDateIso,
  parseDateIso,
  getWeekDates,
  getMonthMatrix,
  MONTH_NAMES,
  MONTH_NAMES_SHORT,
  WEEKDAYS_SHORT,
  todayInSaoPaulo,
} from '@/lib/date-utils';

export function DateNavigator() {
  const { currentDate, currentView, navigate, setDate } = useAgenda();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fechar popover ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const title =
    currentView === 'semana' || currentView === 'escala'
      ? formatWeekRange(currentDate)
      : formatMonthYear(currentDate);

  // Calcular os 2 meses para visualização no seletor completo (mês base + mês seguinte)
  const baseYear = currentDate.getFullYear();
  const baseMonth = currentDate.getMonth();

  const month1Year = baseYear;
  const month1Index = baseMonth;

  const month2Year = baseMonth === 11 ? baseYear + 1 : baseYear;
  const month2Index = baseMonth === 11 ? 0 : baseMonth + 1;

  const matrix1 = getMonthMatrix(month1Year, month1Index);
  const matrix2 = getMonthMatrix(month2Year, month2Index);

  const currentMondayIso = formatDateIso(getWeekDates(currentDate)[0]);
  const todayIso = todayInSaoPaulo();

  // Gerar semanas dos 2 meses para seleção rápida
  const weeksList: { label: string; startIso: string; endIso: string; startDate: Date; isSelected: boolean }[] = [];
  const startDay = new Date(month1Year, month1Index, 1, 12, 0, 0);
  const endDay = new Date(month2Year, month2Index + 1, 0, 12, 0, 0);

  // Iterar semanas
  const cursor = new Date(startDay);
  cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7)); // Garantir segunda-feira

  while (cursor <= endDay || weeksList.length < 9) {
    const week = getWeekDates(cursor);
    const startIso = formatDateIso(week[0]);
    const endIso = formatDateIso(week[6]);
    const label = `${week[0].getDate()} ${MONTH_NAMES_SHORT[week[0].getMonth()]} – ${week[6].getDate()} ${MONTH_NAMES_SHORT[week[6].getMonth()]}`;
    const isSelected = startIso === currentMondayIso;

    weeksList.push({
      label,
      startIso,
      endIso,
      startDate: new Date(week[0]),
      isSelected,
    });

    cursor.setDate(cursor.getDate() + 7);
    if (weeksList.length >= 10) break;
  }

  const handleSelectDate = (date: Date) => {
    setDate(date);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-flex items-center gap-2" ref={popoverRef}>
      {/* Controles Principais */}
      <div className="flex items-center gap-1.5 bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-slate-100 p-1 rounded-2xl border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-300 shadow-sm">
        <button
          type="button"
          onClick={() => navigate('prev')}
          aria-label="Período anterior"
          className="p-1.5 rounded-xl hover:bg-[var(--ui-hover)] dark:hover:bg-[var(--ui-hover)] hover:bg-slate-200 text-zinc-300 dark:text-zinc-300 text-zinc-700 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Botão Central que abre o Seletor de Período Completo */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1 rounded-xl hover:bg-[var(--ui-hover)] dark:hover:bg-[var(--ui-hover)] hover:bg-slate-200 transition-all cursor-pointer group"
          title="Clique para abrir o seletor completo de 2 meses"
        >
          <Calendar className="w-4 h-4 text-[var(--ui-accent)] group-hover:scale-110 transition-transform" />
          <span className="text-xs sm:text-sm font-bold text-foreground dark:text-foreground text-zinc-900 font-heading tracking-wide select-none">
            {title}
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('next')}
          aria-label="Próximo período"
          className="p-1.5 rounded-xl hover:bg-[var(--ui-hover)] dark:hover:bg-[var(--ui-hover)] hover:bg-slate-200 text-zinc-300 dark:text-zinc-300 text-zinc-700 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Botão Hoje */}
      <button
        type="button"
        onClick={() => navigate('today')}
        className="px-3 py-2 rounded-2xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-slate-100 hover:bg-[var(--ui-hover)] dark:hover:bg-[var(--ui-hover)] hover:bg-slate-200 border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-300 text-xs font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700 transition-colors cursor-pointer shadow-sm"
      >
        Hoje
      </button>

      {/* POPOVER SELETOR COMPLETO DE 2 MESES */}
      {isOpen && (
        <div className="absolute top-full right-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 z-50 w-[94vw] max-w-[680px] bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-300 rounded-3xl shadow-2xl p-4 sm:p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Cabeçalho do Seletor */}
          <div className="flex items-center justify-between border-b border-[var(--ui-border)] pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--ui-accent)]" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-foreground dark:text-foreground text-zinc-900 font-heading">
                  Seletor de Escala & Período (2 Meses)
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Navegue e selecione qualquer data ou semana desejada.
                </p>
              </div>
            </div>

            {/* Input Direto de Data */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">Data exata:</span>
              <input
                type="date"
                value={formatDateIso(currentDate)}
                onChange={(e) => {
                  if (e.target.value) {
                    handleSelectDate(parseDateIso(e.target.value));
                  }
                }}
                className="bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-100 border border-[var(--ui-border)] rounded-xl px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)] cursor-pointer"
              />
            </div>
          </div>

          {/* Atalhos Rápidos de Semanas do Período */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-2">
              Semanas da Escala ({MONTH_NAMES[month1Index]} & {MONTH_NAMES[month2Index]}):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
              {weeksList.slice(0, 8).map((w, idx) => (
                <button
                  key={w.startIso}
                  type="button"
                  onClick={() => handleSelectDate(w.startDate)}
                  className={`px-2.5 py-2 rounded-xl text-left border text-xs transition-all cursor-pointer flex flex-col gap-0.5 ${
                    w.isSelected
                      ? 'bg-[var(--ui-accent)]/15 border-[var(--ui-accent)] text-[var(--ui-accent)] font-bold shadow-sm'
                      : 'bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-50 border-[var(--ui-border)] text-zinc-300 dark:text-zinc-300 text-zinc-700 hover:border-[var(--ui-accent)]/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-75">
                    <span>Semana {idx + 1}</span>
                    {w.isSelected && <Check className="w-3 h-3 text-[var(--ui-accent)]" />}
                  </div>
                  <span className="font-semibold truncate">{w.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Grade Calendário dos 2 Meses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[var(--ui-border)]">
            {/* Mês 1 */}
            <div className="bg-[var(--ui-raised)]/50 dark:bg-[var(--ui-raised)]/50 bg-slate-50 p-3 rounded-2xl border border-[var(--ui-border)]">
              <div className="text-center font-bold text-xs text-foreground pb-2 mb-2 border-b border-[var(--ui-border)]">
                {MONTH_NAMES[month1Index]} {month1Year}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-zinc-400 mb-1">
                {WEEKDAYS_SHORT.map((d) => (
                  <span key={d} className="font-semibold">{d[0]}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {matrix1.flat().map((cell, idx) => {
                  const isCurrent = cell.iso === formatDateIso(currentDate);
                  const isToday = cell.iso === todayIso;
                  const isWeekActive = formatDateIso(getWeekDates(cell.date)[0]) === currentMondayIso;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDate(cell.date)}
                      className={`h-7 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center ${
                        isCurrent
                          ? 'bg-[var(--ui-accent)] text-foreground font-bold shadow-sm'
                          : isWeekActive && cell.isCurrentMonth
                          ? 'bg-[var(--ui-accent)]/20 text-[var(--ui-accent)] font-semibold'
                          : isToday
                          ? 'border border-[var(--ui-accent)] text-[var(--ui-accent)]'
                          : cell.isCurrentMonth
                          ? 'text-foreground hover:bg-[var(--ui-border)]'
                          : 'text-zinc-600 hover:bg-[var(--ui-border)]/50'
                      }`}
                    >
                      {cell.date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mês 2 */}
            <div className="bg-[var(--ui-raised)]/50 dark:bg-[var(--ui-raised)]/50 bg-slate-50 p-3 rounded-2xl border border-[var(--ui-border)]">
              <div className="text-center font-bold text-xs text-foreground pb-2 mb-2 border-b border-[var(--ui-border)]">
                {MONTH_NAMES[month2Index]} {month2Year}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-zinc-400 mb-1">
                {WEEKDAYS_SHORT.map((d) => (
                  <span key={d} className="font-semibold">{d[0]}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {matrix2.flat().map((cell, idx) => {
                  const isCurrent = cell.iso === formatDateIso(currentDate);
                  const isToday = cell.iso === todayIso;
                  const isWeekActive = formatDateIso(getWeekDates(cell.date)[0]) === currentMondayIso;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDate(cell.date)}
                      className={`h-7 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center ${
                        isCurrent
                          ? 'bg-[var(--ui-accent)] text-foreground font-bold shadow-sm'
                          : isWeekActive && cell.isCurrentMonth
                          ? 'bg-[var(--ui-accent)]/20 text-[var(--ui-accent)] font-semibold'
                          : isToday
                          ? 'border border-[var(--ui-accent)] text-[var(--ui-accent)]'
                          : cell.isCurrentMonth
                          ? 'text-foreground hover:bg-[var(--ui-border)]'
                          : 'text-zinc-600 hover:bg-[var(--ui-border)]/50'
                      }`}
                    >
                      {cell.date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Rodapé com Atalhos Rápidos */}
          <div className="flex items-center justify-between pt-1 border-t border-[var(--ui-border)] text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Semana selecionada: <strong>{formatWeekRange(currentDate)}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--ui-border)] hover:bg-[var(--ui-hover)] text-foreground font-semibold text-xs transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
