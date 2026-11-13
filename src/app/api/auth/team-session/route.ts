import { cookies } from 'next/headers';
import { TEAM_SESSION_COOKIE } from '@/lib/server/team-session';
import { apiFailure, checkOrigin, privateHeaders } from '@/lib/server/workspace-api';

export async function POST() {
  return Response.json({ error: 'O acesso por senha padrão foi desativado. Use seu e-mail e senha cadastrados no Supabase.' }, { status: 410, headers: privateHeaders });
}

export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    (await cookies()).delete(TEAM_SESSION_COOKIE);
    return Response.json({ ok: true }, { headers: privateHeaders });
  } catch (error) { return apiFailure(error); }
}
