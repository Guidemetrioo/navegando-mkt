'use client';
import {useState} from 'react';
interface Entry {seq:number;actor:string;kind:string;record_id:string;action:string;happened_at:string;}
export function AuditLog() {
  const [entries,setEntries]=useState<Entry[]>([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false);
  const load=async()=>{
    setBusy(true);setMessage('');
    try {const response=await fetch('/api/audit',{cache:'no-store'});const result=await response.json();if(!response.ok)throw new Error(result.error);setEntries(result.entries);setLoaded(true);}
    catch(error){setMessage(error instanceof Error ? error.message : 'Falha ao consultar a auditoria.');}
    finally{setBusy(false);}
  };
  return <div className="grid gap-3 border-t border-[var(--ui-border)] pt-5"><h2 className="text-lg font-semibold">Histórico de alterações</h2><button type="button" onClick={load} disabled={busy} className="border border-[var(--ui-border)] rounded-lg p-3 text-sm self-start">{busy?'Consultando…':'Consultar últimas 50 alterações'}</button>{message && <p role="alert" className="text-sm text-amber-400">{message}</p>}{loaded && !entries.length && <p className="text-sm text-zinc-400">Nenhuma alteração registrada.</p>}<div className="overflow-x-auto">{entries.length>0 && <table className="w-full text-xs text-left"><thead><tr><th className="p-2">Quando</th><th className="p-2">Ação</th><th className="p-2">Registro</th><th className="p-2">Usuário</th></tr></thead><tbody>{entries.map(e=><tr key={e.seq} className="border-t border-[var(--ui-border)]"><td className="p-2 whitespace-nowrap">{new Date(e.happened_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}</td><td className="p-2">{e.action}</td><td className="p-2">{e.kind}/{e.record_id}</td><td className="p-2 font-mono">{e.actor}</td></tr>)}</tbody></table>}</div></div>;
}
