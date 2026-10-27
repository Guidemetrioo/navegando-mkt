'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HAS_CLOUD_CONFIG, IS_DEMO } from '@/lib/app-mode';
export default function PasswordPage() {
  const [password,setPassword]=useState('');const [confirmation,setConfirmation]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();if(password.length<12 || password!==confirmation) {setMessage('Use ao menos 12 caracteres e repita a mesma senha.');return;}
    setBusy(true);
    try {
      const client=createClient();
      const {data:{user}}=await client.auth.getUser();
      if(!user) {setMessage('Link expirado. Solicite uma nova recuperação na tela de entrada.');return;}
      const {error}=await client.auth.updateUser({password});
      if(error) setMessage('Não foi possível atualizar a senha. Solicite um novo link ou tente uma senha diferente.');
      else window.location.assign('/');
    } catch {setMessage('Falha de conexão. Tente novamente.');}
    finally {setBusy(false);}
  };
  return <main className="min-h-svh flex items-center justify-center p-5"><form onSubmit={submit} className="glass-card rounded-2xl p-7 max-w-md w-full grid gap-5"><h1 className="text-xl font-semibold">Defina sua senha</h1>
    {HAS_CLOUD_CONFIG && !IS_DEMO ? <><label className="grid gap-2 text-sm">Nova senha<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e=>setPassword(e.target.value)} className="border border-[var(--ui-border)] p-3 rounded-lg" /></label><label className="grid gap-2 text-sm">Repita a senha<input type="password" autoComplete="new-password" required value={confirmation} onChange={e=>setConfirmation(e.target.value)} className="border border-[var(--ui-border)] p-3 rounded-lg" /></label><button disabled={busy} className="gradient-cta p-3 rounded-lg">{busy ? 'Aguarde…' : 'Salvar senha'}</button></> : <p>A infraestrutura ainda precisa ser configurada.</p>}
    {message && <p role="alert" className="text-sm text-[var(--ui-accent)]">{message}</p>}<a href="/login" className="text-sm underline">Voltar para a entrada</a></form></main>;
}
