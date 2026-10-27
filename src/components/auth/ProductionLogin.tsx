'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HAS_CLOUD_CONFIG } from '@/lib/app-mode';
import { NavegandoLogo } from '@/components/brand/NavegandoLogo';
import { DesignSelector } from '@/components/design/DesignSelector';

export function ProductionLogin({loading=false,feedback=''}:{loading?:boolean;feedback?:string}) {
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  const submit=async(event:React.FormEvent)=>{
    event.preventDefault(); setBusy(true);setNotice('');
    try {
      const {error}=await createClient().auth.signInWithPassword({email:email.trim(),password});
      if(error) {setNotice('Não foi possível entrar. Confira o e-mail e a senha.');return;}
      window.location.reload();
    } catch {setNotice('Não foi possível conectar. Tente novamente.');}
    finally {setBusy(false);}
  };
  const recover=async()=>{
    if(!email.trim()) {setNotice('Preencha seu e-mail para recuperar o acesso.');return;}
    setBusy(true);
    try {
      const {error}=await createClient().auth.resetPasswordForEmail(email.trim(),{redirectTo:`${window.location.origin}/auth/callback?next=/account/password`});
      setNotice(error ? 'Não foi possível solicitar a recuperação agora.' : 'Se o e-mail estiver cadastrado, você receberá as instruções de acesso.');
    } catch {setNotice('Falha de conexão. Tente novamente.');}
    finally {setBusy(false);}
  };
  return <div className="login-shell p-5 sm:p-8 flex flex-col gap-8">
    <header className="login-header max-w-5xl w-full mx-auto flex items-center justify-between gap-4"><NavegandoLogo variant="horizontal" size="md" /><DesignSelector /></header>
    <main className="w-full max-w-md mx-auto my-auto glass-card rounded-2xl p-6 sm:p-8">
      <p className="text-xs text-[var(--ui-accent)] font-semibold mb-3">NAVEGANDO · ACESSO DA EQUIPE</p>
      <h1 className="text-2xl font-semibold mb-3">{HAS_CLOUD_CONFIG ? 'Entre no seu espaço de trabalho.' : 'A base central aguarda configuração.'}</h1>
      {!HAS_CLOUD_CONFIG ? <p className="text-sm text-zinc-400 leading-relaxed">O modo de produção está protegido. Configure o projeto Supabase, aplique as migrações e vincule as contas da equipe seguindo o guia de implantação. Nenhum cliente de demonstração será utilizado na base real.</p> : loading ? <p role="status" className="text-sm text-zinc-400">Verificando sua sessão e consultando a base central…</p> : <form onSubmit={submit} className="grid gap-4 mt-6">
        <label className="grid gap-2 text-sm">E-mail da equipe<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-raised)] p-3" /></label>
        <label className="grid gap-2 text-sm">Senha<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-raised)] p-3" /></label>
        <button type="submit" disabled={busy} className="gradient-cta rounded-lg px-4 py-3 disabled:opacity-50">{busy ? 'Aguarde…' : 'Entrar'}</button>
        <button type="button" disabled={busy} onClick={recover} className="text-sm text-zinc-400 underline underline-offset-4 py-2">Esqueci minha senha</button>
      </form>}
      {notice && <p role="status" className="text-sm mt-4 text-[var(--ui-accent)]">{notice}</p>}
      {!notice && feedback && <p role="status" className="text-sm mt-4 text-[var(--ui-accent)]">{feedback}</p>}
    </main>
    <footer className="text-center text-xs text-zinc-500">Acesso individual. As permissões são verificadas pela base central.</footer>
  </div>;
}
