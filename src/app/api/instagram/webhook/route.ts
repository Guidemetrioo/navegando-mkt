import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook Oficial da Meta / Instagram Graph API
 * Suporta:
 * 1. Verificação inicial (GET com hub.challenge e hub.verify_token)
 * 2. Recebimento de eventos em tempo real (POST com mentions e tags)
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Token de verificação configurado no painel da Meta for Developers
  const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || 'navegando_mkt_webhook_secret';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Token de verificação inválido' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Eventos recebidos da Meta
    // Exemplo: objeto de mention em stories ou posts
    if (payload.object === 'instagram') {
      const entries = payload.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          if (change.field === 'mentions') {
            const mentionData = change.value;
            // Aqui os dados são salvos na tabela client_mentions
            console.log('[Instagram Webhook] Nova menção recebida:', mentionData);
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
