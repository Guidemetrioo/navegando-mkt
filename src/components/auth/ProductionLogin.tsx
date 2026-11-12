'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HAS_CLOUD_CONFIG } from '@/lib/app-mode';
import { USERS_DATABASE } from '@/lib/auth-users';
import { NavegandoLogo } from '@/components/brand/NavegandoLogo';
import { DesignSelector } from '@/components/design/DesignSelector';

export function ProductionLogin({
  loading = false,
  feedback = '',
}: {
  loading?: boolean;
  feedback?: string;
}) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [showTeamList, setShowTeamList] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const rawLogin = login.trim();
    if (!rawLogin || !password) return;

    setBusy(true);
    setNotice('');
    try {
      // 1. Se digitou um e-mail com @, tenta primeiro autenticar no Supabase Auth
      if (rawLogin.includes('@')) {
        const { error } = await createClient().auth.signInWithPassword({
          email: rawLogin,
          password,
        });
        if (!error) {
          await fetch('/api/auth/team-session', { method: 'DELETE' }).catch(() => {});
          window.location.assign('/');
          return;
        }
      }

      // 2. Autenticação direta da Equipe Navegando MKT (aceita usuário, nome ou e-mail para todos os 19 membros)
      const teamRes = await fetch('/api/auth/team-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: rawLogin, password }),
      });
      const teamData = (await teamRes.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (teamRes.ok && teamData.ok) {
        await createClient()
          .auth.signOut()
          .catch(() => {});
        window.location.assign('/');
        return;
      }

      setNotice(
        teamData.error || 'Não foi possível entrar. Confira seu usuário/e-mail e a senha.'
      );
    } catch {
      setNotice('Não foi possível conectar. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  const recover = async () => {
    const rawLogin = login.trim();
    if (!rawLogin.includes('@')) {
      setNotice(
        'Para login por usuário da equipe, a senha padrão é o seu usuário seguido de 123 (ex: alexandre123, victor123, isa123).'
      );
      return;
    }
    setBusy(true);
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(rawLogin, {
        redirectTo: `${window.location.origin}/auth/callback?next=/account/password`,
      });
      setNotice(
        error
          ? 'Não foi possível solicitar a recuperação agora.'
          : 'Se o e-mail estiver cadastrado, você receberá as instruções de acesso.'
      );
    } catch {
      setNotice('Falha de conexão. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-shell p-5 sm:p-8 flex flex-col gap-8">
      <header className="login-header max-w-5xl w-full mx-auto flex items-center justify-between gap-4">
        <NavegandoLogo variant="horizontal" size="md" />
        <DesignSelector />
      </header>

      <main className="w-full max-w-md mx-auto my-auto glass-card rounded-2xl p-6 sm:p-8">
        <p className="text-xs text-[var(--ui-accent)] font-semibold mb-3">
          NAVEGANDO · ACESSO DA EQUIPE
        </p>
        <h1 className="text-2xl font-semibold mb-2">
          {HAS_CLOUD_CONFIG
            ? 'Entre no seu espaço de trabalho.'
            : 'Espaço da Equipe Navegando'}
        </h1>
        <p className="text-xs text-zinc-400">
          Digite seu <strong>e-mail</strong> ou seu <strong>usuário da equipe</strong> (ex:{' '}
          <code>felipe</code>, <code>gabriela</code>, <code>matheus</code>,{' '}
          <code>alexandre</code>, <code>vitinho</code>, <code>larissa</code>,{' '}
          <code>victor</code>, <code>isa</code>...).
        </p>

        {!HAS_CLOUD_CONFIG ? (
          <div className="flex flex-col gap-4 mt-4">
            <p className="text-sm text-zinc-400 leading-relaxed">
              A base central precisa ser configurada. Defina a URL e a chave pública do Supabase e
              execute as migrações.
            </p>
          </div>
        ) : loading ? (
          <p role="status" className="text-sm text-zinc-400 mt-6">
            Verificando sua sessão e consultando a base central…
          </p>
        ) : (
          <form onSubmit={submit} className="grid gap-4 mt-5">
            <label className="grid gap-1.5 text-sm">
              <span>E-mail ou Usuário da equipe</span>
              <input
                type="text"
                autoComplete="username"
                required
                placeholder="Ex: seu@email.com ou usuario (ex: victor, isa, carol)"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-raised)] p-3 text-sm"
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span>Senha</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                placeholder="Sua senha (ou usuario123)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-raised)] p-3 text-sm"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="gradient-cta rounded-lg px-4 py-3 font-bold cursor-pointer disabled:opacity-50"
            >
              {busy ? 'Entrando…' : 'Entrar'}
            </button>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowTeamList((v) => !v)}
                className="underline underline-offset-4 hover:text-foreground cursor-pointer"
              >
                {showTeamList ? 'Ocultar lista de acessos' : 'Ver usuários da equipe (19)'}
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={recover}
                className="underline underline-offset-4 hover:text-foreground cursor-pointer"
              >
                Esqueci minha senha
              </button>
            </div>

            {showTeamList && (
              <div className="mt-1 p-3 rounded-xl bg-[var(--ui-page)] border border-[var(--ui-border)] max-h-52 overflow-y-auto space-y-1.5 text-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-accent)] mb-2">
                  Clique em um membro para preencher o usuário:
                </div>
                {USERS_DATABASE.map((u) => (
                  <button
                    key={u.employeeId}
                    type="button"
                    onClick={() => {
                      setLogin(u.username);
                      setPassword(`${u.username}123`);
                      setShowTeamList(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[var(--ui-raised)] text-left transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-foreground">{u.nome}</span>
                    <span className="text-[11px] text-zinc-400">
                      usuário: <code className="text-[var(--ui-accent)]">{u.username}</code> • senha:{' '}
                      <code>{u.username}123</code>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </form>
        )}

        {notice && (
          <p role="status" className="text-sm mt-4 text-[var(--ui-accent)]">
            {notice}
          </p>
        )}
        {!notice && feedback && (
          <p role="status" className="text-sm mt-4 text-[var(--ui-accent)]">
            {feedback}
          </p>
        )}
      </main>

      <footer className="text-center text-xs text-zinc-500">
        Acesso individual para todos os 19 membros da equipe Navegando MKT.
      </footer>
    </div>
  );
}
