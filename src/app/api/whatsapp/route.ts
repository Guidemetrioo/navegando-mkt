import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';

const BOT_BASE_URL = process.env.WHATSAPP_BOT_URL || 'http://localhost:3001';

let lastSpawnAttempt = 0;

async function fetchBot(endpoint: string, init?: RequestInit, timeoutMs = 3500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BOT_BASE_URL}${endpoint}`, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
    });
    return res;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function ensureLocalBotStarted() {
  const now = Date.now();
  if (now - lastSpawnAttempt < 15000) return false;
  lastSpawnAttempt = now;

  try {
    const botDir = path.resolve(process.cwd(), '..', 'whatsapp', 'whatsapp a2');
    const entryFile = path.join(botDir, 'src', 'bot', 'bot.ts');
    if (!fs.existsSync(entryFile)) return false;

    const tsxBin = path.join(
      botDir,
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'tsx.cmd' : 'tsx'
    );

    if (fs.existsSync(tsxBin)) {
      const child = spawn(tsxBin, ['src/bot/bot.ts'], {
        cwd: botDir,
        detached: true,
        stdio: 'ignore',
        shell: process.platform === 'win32',
        windowsHide: true,
      });
      child.unref();
      return true;
    }
  } catch {
    // Ignora se estiver em ambiente cloud sem pasta local
  }
  return false;
}

export async function GET() {
  const res = await fetchBot('/api/status');
  if (res && res.ok) {
    const data = await res.json();
    return NextResponse.json({
      online: true,
      status: data.status || 'disconnected',
      conectado: data.status === 'ready' || data.status === 'connected',
      qrCode: data.qrCode || null,
      pairingCode: data.pairingCode || null,
      phoneNumber: data.phoneNumber || null,
    });
  }

  // Se o motor local ainda não estiver rodando, inicia automaticamente em segundo plano
  const started = ensureLocalBotStarted();
  return NextResponse.json({
    online: false,
    starting: started,
    status: 'starting',
    conectado: false,
    qrCode: null,
    pairingCode: null,
    phoneNumber: null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === 'connect') {
      const res = await fetchBot('/api/status');
      if (res && res.ok) {
        const data = await res.json();
        return NextResponse.json({
          online: true,
          status: data.status || 'disconnected',
          conectado: data.status === 'ready' || data.status === 'connected',
          qrCode: data.qrCode || null,
          pairingCode: data.pairingCode || null,
          phoneNumber: data.phoneNumber || null,
        });
      }

      ensureLocalBotStarted();
      // Aguarda brevemente o motor subir
      await new Promise((r) => setTimeout(r, 2500));
      const retry = await fetchBot('/api/status');
      if (retry && retry.ok) {
        const data = await retry.json();
        return NextResponse.json({
          online: true,
          status: data.status || 'connecting',
          conectado: data.status === 'ready' || data.status === 'connected',
          qrCode: data.qrCode || null,
          pairingCode: data.pairingCode || null,
          phoneNumber: data.phoneNumber || null,
        });
      }

      return NextResponse.json({
        online: false,
        starting: true,
        status: 'starting',
        conectado: false,
        message: 'Iniciando conexão com o WhatsApp Automaticamente... O QR Code aparecerá em alguns segundos.',
      });
    }

    if (action === 'request-code') {
      const phoneNumber = String(body.phoneNumber || '').replace(/\D/g, '');
      if (!phoneNumber) {
        return NextResponse.json({ success: false, error: 'Informe o número de WhatsApp com DDD.' }, { status: 400 });
      }

      let res = await fetchBot(
        '/api/request-code',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber }),
        },
        10000
      );

      if (!res) {
        ensureLocalBotStarted();
        await new Promise((r) => setTimeout(r, 3000));
        res = await fetchBot(
          '/api/request-code',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber }),
          },
          10000
        );
      }

      if (res && res.ok) {
        const data = await res.json();
        return NextResponse.json({
          success: true,
          pairingCode: data.pairingCode,
        });
      }

      if (res) {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json(
          { success: false, error: err.error || 'Aguarde o QR Code carregar na tela e tente novamente.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'O motor do WhatsApp está iniciando automaticamente. Aguarde 10 segundos e clique em Gerar Código novamente.',
        },
        { status: 503 }
      );
    }

    if (action === 'logout') {
      await fetchBot('/api/logout', { method: 'POST' });
      return NextResponse.json({ success: true });
    }

    if (action === 'send') {
      const { phone, jid, message } = body;
      const res = await fetchBot('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, jid, message }),
      });
      return NextResponse.json({ success: Boolean(res && res.ok) });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno na integração WhatsApp.' },
      { status: 500 }
    );
  }
}
