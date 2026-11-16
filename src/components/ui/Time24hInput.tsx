'use client';

import React, { useMemo } from 'react';

interface Time24hInputProps {
  value: string;
  onChange: (nextValue: string) => void;
  ariaLabel?: string;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const BASE_MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

/** Brazilian 24-hour time selector (00h–23h) immune to 12h AM/PM browser locales. */
export function Time24hInput({ value, onChange, ariaLabel = 'Horário', className = '' }: Time24hInputProps) {
  const [rawH = '09', rawM = '00'] = (value || '09:00').slice(0, 5).split(':');
  const hour = HOURS.includes(rawH) ? rawH : '09';
  const minute = /^\d{2}$/.test(rawM) && Number(rawM) >= 0 && Number(rawM) <= 59 ? rawM : '00';

  const minuteOptions = useMemo(() => {
    if (BASE_MINUTES.includes(minute)) return BASE_MINUTES;
    return [...BASE_MINUTES, minute].sort((a, b) => Number(a) - Number(b));
  }, [minute]);

  return (
    <div
      className={`flex items-center gap-1 bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-2.5 py-1.5 text-xs text-foreground focus-within:ring-1 focus-within:ring-[var(--ui-accent)] ${className}`}
    >
      <select
        aria-label={`${ariaLabel} (horas)`}
        value={hour}
        onChange={(e) => onChange(`${e.target.value}:${minute}`)}
        className="flex-1 min-w-0 !bg-transparent !border-0 py-0 font-mono font-semibold text-foreground focus:outline-none cursor-pointer"
      >
        {HOURS.map((h) => (
          <option key={h} value={h} className="bg-[var(--ui-surface)] text-foreground">
            {h}h
          </option>
        ))}
      </select>
      <span className="text-zinc-400 font-bold select-none">:</span>
      <select
        aria-label={`${ariaLabel} (minutos)`}
        value={minute}
        onChange={(e) => onChange(`${hour}:${e.target.value}`)}
        className="w-11 !bg-transparent !border-0 py-0 font-mono font-semibold text-center text-foreground focus:outline-none cursor-pointer"
      >
        {minuteOptions.map((m) => (
          <option key={m} value={m} className="bg-[var(--ui-surface)] text-foreground">
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}
