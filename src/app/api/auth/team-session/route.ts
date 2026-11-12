import { cookies } from 'next/headers';
import { authenticateTeamMember, encodeTeamSession, TEAM_SESSION_COOKIE } from '@/lib/server/team-session';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { login?: string; password?: string };
    const result = authenticateTeamMember(body?.login || '', body?.password || '');

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 401 });
    }

    const token = encodeTeamSession(result.session);
    const store = await cookies();
    store.set(TEAM_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 dias
    });

    return Response.json({
      ok: true,
      member: {
        employee_id: result.session.employeeId,
        role: result.session.role,
        nome: result.session.nome,
      },
    });
  } catch {
    return Response.json({ error: 'Falha ao processar o login da equipe.' }, { status: 400 });
  }
}

export async function DELETE() {
  try {
    const store = await cookies();
    store.delete(TEAM_SESSION_COOKIE);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: true });
  }
}
