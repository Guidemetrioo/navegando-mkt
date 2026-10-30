'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { IS_DEMO, HAS_CLOUD_CONFIG } from '@/lib/app-mode';
import { createClient } from '@/lib/supabase/client';
import { canonical, diffWorkspace, emptyWorkspace, mergeWorkspace, workspaceFrom } from '@/lib/workspace';
import type { Change, CloudSnapshot, Member, Workspace } from '@/lib/workspace';

export type SyncStatus = 'loading' | 'saved' | 'pending' | 'error' | 'conflict' | 'recovery' | 'signed-out' | 'setup';
type RequestBatch = { requestId: string; changes: Change[]; sent: Workspace };
function download(value: unknown, name: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
  const link = document.createElement('a'); link.href=url; link.download=name; link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function useCentralWorkspace(data: Workspace, apply: (data: Workspace, member: Member | null) => void) {
  const [status,setStatus] = useState<SyncStatus>(IS_DEMO ? 'saved' : HAS_CLOUD_CONFIG ? 'loading' : 'setup');
  const [message,setMessage] = useState('');
  const [tick,setTick] = useState(0);
  const base = useRef<CloudSnapshot|null>(null);
  const latest = useRef(data);
  const pending = useRef<RequestBatch|null>(null);
  const busy = useRef(false);
  const paused = useRef(false);
  const recovery = useRef<string|null>(null);
  const epoch = useRef(0);
  const loading = useRef(false);
  const refreshRequested = useRef(false);
  useEffect(()=>{latest.current=data;},[data]);
  const draftKey = () => base.current ? `navegando-pending:${base.current.member.user_id}` : null;
  const saveDraft = useCallback(()=>{
    const key=draftKey(); if (!key) return;
    try { localStorage.setItem(key,JSON.stringify({data:latest.current,request:pending.current,exportedAt:new Date().toISOString()})); }
    catch { setMessage('O navegador não conseguiu preservar o rascunho. Baixe uma cópia antes de fechar esta página.'); }
  },[]);
  const load = useCallback(async():Promise<void>=>{
    if (IS_DEMO || !HAS_CLOUD_CONFIG || paused.current) return;
    if (loading.current || busy.current) {refreshRequested.current=true;return;}
    // A session refresh must not replace a draft waiting for the debounce timer.
    if(base.current && (pending.current || diffWorkspace(base.current,latest.current).length)) {refreshRequested.current=true;return;}
    loading.current=true;
    const version=epoch.current;
    const observed=latest.current;
    const previous=base.current;
    try {
      const response=await fetch('/api/workspace',{cache:'no-store'});
      const result=await response.json();
      if (version!==epoch.current) return;
      if (response.status===401 || response.status===403) {
        if (previous && diffWorkspace(previous,latest.current).length) saveDraft();
        base.current=null; pending.current=null; latest.current=emptyWorkspace(); apply(latest.current,null);
        setStatus('signed-out'); setMessage(result.error || 'Entre para continuar.'); return;
      }
      if (!response.ok) throw new Error(result.error || 'Base central indisponível.');
      const snapshot=result as CloudSnapshot;
      const remote=workspaceFrom(snapshot);
      const sameUser=previous?.member.user_id===snapshot.member.user_id;
      if(previous && !sameUser) {saveDraft();pending.current=null;recovery.current=null;}
      base.current=snapshot;
      const next=sameUser ? mergeWorkspace(observed,latest.current,remote) : remote;
      latest.current=next; apply(next,snapshot.member);
      if (!sameUser) {
        try { recovery.current=localStorage.getItem(`navegando-pending:${snapshot.member.user_id}`); } catch { /* No browser cache available. */ }
        if (recovery.current) { paused.current=true; setStatus('recovery'); setMessage('Há um rascunho de uma sessão anterior. Baixe-o antes de recarregar a base.'); return; }
      }
      setStatus(diffWorkspace(snapshot,next).length ? 'pending' : 'saved'); setMessage(''); setTick(t=>t+1);
    } catch (error) {
      setStatus('error'); setMessage(error instanceof Error ? error.message : 'Falha de conexão.');
    } finally { loading.current=false; if(refreshRequested.current){refreshRequested.current=false;queueMicrotask(()=>{void load();});} }
  },[apply,saveDraft]);
  const flush = useCallback(async()=>{
    if (!base.current || busy.current || paused.current || loading.current) return;
    const session=base.current.member;
    if (!pending.current) {
      const changes=diffWorkspace(base.current,latest.current).slice(0,100);
      if (!changes.length) { setStatus('saved'); return; }
      const sent=workspaceFrom(base.current);
      for (const c of changes) {
        const rows=(sent[c.kind] as {id:string}[]).filter(row=>row.id!==c.id);
        if (c.data) rows.push(c.data as {id:string});
        (sent[c.kind] as unknown[])=rows;
      }
      pending.current={requestId:crypto.randomUUID(),changes,sent};
    }
    const batch=pending.current;
    busy.current=true; setStatus('pending'); saveDraft();
    const version=epoch.current;
    try {
      const response=await fetch('/api/workspace',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:batch.requestId,changes:batch.changes})});
      const result=await response.json();
      if (version!==epoch.current) return;
      if (!response.ok) {
        if(response.status===401) {
          saveDraft();epoch.current++;base.current=null;pending.current=null;paused.current=false;
          latest.current=emptyWorkspace();apply(latest.current,null);setStatus('signed-out');setMessage('Sua sessão expirou. Entre novamente; o rascunho foi preservado.');return;
        }
        paused.current=true;
        setStatus([400,403,409,413,422].includes(response.status) ? 'conflict' : 'error');
        setMessage(result.error || 'A alteração não foi confirmada.'); saveDraft(); return;
      }
      const snapshot=result as CloudSnapshot;
      if (snapshot.member.user_id!==session.user_id) throw new Error('A sessão mudou. Recarregue a base.');
      const next=mergeWorkspace(batch.sent,latest.current,workspaceFrom(snapshot));
      base.current=snapshot; pending.current=null; latest.current=next; apply(next,snapshot.member);
      const remaining=diffWorkspace(snapshot,next).length;
      setStatus(remaining ? 'pending' : 'saved'); setMessage('');
      if (!remaining) { const key=draftKey(); if (key) try {localStorage.removeItem(key);} catch { /* The server has confirmed the commit. */ } }
      else saveDraft();
      setTick(t=>t+1);
    } catch {
      if (version===epoch.current) { paused.current=true; setStatus('error'); setMessage('Sem confirmação do servidor. O rascunho foi preservado; tente novamente sem duplicar a operação.'); saveDraft(); }
    } finally { busy.current=false; if(refreshRequested.current){refreshRequested.current=false;queueMicrotask(()=>{void load();});} }
  },[apply,saveDraft,load]);
  useEffect(()=>{
    if (IS_DEMO || !HAS_CLOUD_CONFIG) return;
    void load();
    const client=createClient();
    const {data:{subscription}}=client.auth.onAuthStateChange((event,session)=>{
      if(event==='SIGNED_IN' && base.current && base.current.member.user_id!==session?.user.id) {
        saveDraft();epoch.current++;base.current=null;pending.current=null;paused.current=false;recovery.current=null;latest.current=emptyWorkspace();apply(latest.current,null);
      }
      if (event==='SIGNED_IN' || event==='TOKEN_REFRESHED') queueMicrotask(()=>{void load();});
      if (event==='SIGNED_OUT') { epoch.current++; base.current=null; pending.current=null; paused.current=false; recovery.current=null; latest.current=emptyWorkspace(); apply(latest.current,null); setStatus('signed-out'); }
    });
    const online=()=>{ if (!paused.current) void load(); };
    window.addEventListener('online',online);
    window.addEventListener('focus',online);
    const poll=setInterval(()=>{if (base.current && !diffWorkspace(base.current,latest.current).length && !pending.current) void load();},3000);
    const beforeUnload=(event:BeforeUnloadEvent)=>{
      if (pending.current || recovery.current || base.current && diffWorkspace(base.current,latest.current).length) {event.preventDefault();saveDraft();}
    };
    window.addEventListener('beforeunload',beforeUnload);
    return ()=>{subscription.unsubscribe();clearInterval(poll);window.removeEventListener('online',online);window.removeEventListener('focus',online);window.removeEventListener('beforeunload',beforeUnload);};
  },[apply,load,saveDraft]);
  useEffect(()=>{
    if (IS_DEMO || !base.current || paused.current) return;
    const changes=diffWorkspace(base.current,data);
    if (!changes.length) return;
    setStatus('pending'); saveDraft();
    const timer=setTimeout(()=>{void flush();},350);
    return ()=>clearTimeout(timer);
  },[data,tick,flush,saveDraft]);
  const retry=()=>{paused.current=false; if (base.current) void flush(); else void load();};
  const exportDraft=()=>{
    let value:unknown={data:latest.current,request:pending.current};
    if (recovery.current) try {value=JSON.parse(recovery.current);} catch {value={raw:recovery.current};}
    download(value,`navegando-rascunho-${Date.now()}.json`);
  };
  const reload=()=>{
    if (!window.confirm('Baixe o rascunho antes de continuar. Recarregar descarta as alterações locais que ainda não foram confirmadas. Continuar?')) return;
    const key=draftKey(); if (key) try {localStorage.removeItem(key);} catch { /* Keep any preserved copy. */ }
    epoch.current++; paused.current=false; recovery.current=null; pending.current=null;
    if (base.current) {latest.current=workspaceFrom(base.current); apply(latest.current,base.current.member);}
    void load();
  };
  return {status,message,refresh:load,retry,exportDraft,reload};
}
