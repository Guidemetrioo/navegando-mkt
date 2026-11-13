'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HAS_CLOUD_CONFIG } from '@/lib/app-mode';
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

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const rawLogin = login.trim();
    if (!rawLogin || !password) return;

    setBusy(true);
    setNotice('');
    try {
      const { error } = await createClient().auth.signInWithPassword({ email: rawLogin, password });
      if (error) {
        setNotice('Não foi possível entrar. Confira seu e-mail e sua senha cadastrados.');
        return;
      }
      await fetch('/api/auth/team-session', { method: 'DELETE' }).catch(() => {});
      window.location.reload();
    } catch {
      setNotice('Não foi possível conectar. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  const recover = async () => {
    const rawLogin = login.trim();
    if (!rawLogin.includes('@')) {
      setNotice('Informe seu e-mail cadastrado para recuperar a senha.');
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
          Use seu e-mail e senha individuais. O administrador precisa vincular sua conta ao cadastro da equipe.
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
              <span>E-mail da equipe</span>
              <input
                type="email"
                autoComplete="username"
                required
                placeholder="seu@email.com"
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
                placeholder="Sua senha cadastrada"
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
                onClick={recover}
                className="underline underline-offset-4 hover:text-foreground cursor-pointer"
              >
                Esqueci minha senha
              </button>
            </div>

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
        Acesso individual e informações compartilhadas pela base central.
      </footer>
    </div>
  );
}
