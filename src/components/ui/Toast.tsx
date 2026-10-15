'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';
        const isError = toast.type === 'error';

        let icon = <Info className="w-4 h-4 text-sky-400 shrink-0" />;
        let borderColor = 'border-sky-500/30';
        let bgGlow = 'bg-[#181a20]/95 shadow-sky-500/10';

        if (isSuccess) {
          icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
          borderColor = 'border-emerald-500/40';
          bgGlow = 'bg-[#151c18]/95 shadow-emerald-500/10';
        } else if (isWarning) {
          icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
          borderColor = 'border-amber-500/40';
          bgGlow = 'bg-[#1c1a14]/95 shadow-amber-500/10';
        } else if (isError) {
          icon = <XCircle className="w-4 h-4 text-rose-400 shrink-0" />;
          borderColor = 'border-rose-500/40';
          bgGlow = 'bg-[#1c1517]/95 shadow-rose-500/10';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-3 ${borderColor} ${bgGlow}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {icon}
              <p className="text-xs font-medium text-zinc-100 leading-tight">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Fechar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
