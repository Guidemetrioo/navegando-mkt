import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint de sincronização manual ou agendada (Cron) via Instagram Graph API
 * Endpoint da Meta: https://graph.facebook.com/v21.0/{ig-user-id}/media
 */

export async function POST(req: NextRequest) {
  try {
    const { clientId, instagramBusinessId, accessToken } = await req.json();

    if (!instagramBusinessId || !accessToken) {
      return NextResponse.json(
        { error: 'Parâmetros instagramBusinessId e accessToken são obrigatórios.' },
        { status: 400 }
      );
    }

    // Chamada à API da Meta para buscar os vídeos e Reels do perfil
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${instagramBusinessId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count&access_token=${accessToken}`
    );

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      syncedMediaCount: data.data?.length || 0,
      media: data.data || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
