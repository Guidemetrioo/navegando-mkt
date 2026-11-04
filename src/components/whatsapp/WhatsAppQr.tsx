'use client';
import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { validWhatsAppQr } from '@/lib/whatsapp-connection';

export function WhatsAppQr({ value }: { value?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const target = canvas.current;
    if (!target) return;
    const context = target.getContext('2d');
    context?.clearRect(0, 0, target.width, target.height);
    if (validWhatsAppQr(value)) void QRCode.toCanvas(target, value, { width: 280, margin: 4, errorCorrectionLevel: 'M' }).catch(() => {
      context?.clearRect(0, 0, target.width, target.height);
    });
  }, [value]);
  if (!validWhatsAppQr(value)) return <p className="text-xs text-center text-zinc-600 p-3">Aguardando um QR Code válido do serviço WhatsApp.</p>;
  return <canvas ref={canvas} role="img" aria-label="QR Code de conexão WhatsApp" className="w-full h-full object-contain" />;
}
