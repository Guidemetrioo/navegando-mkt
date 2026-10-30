'use client';
import { useAgenda } from '@/context/AgendaContext';
import { IS_DEMO } from '@/lib/app-mode';

export function WorkspaceStatus() {
  const { syncStatus, syncMessage, retrySync, exportPendingDraft, reloadWorkspace, isDataSaved } = useAgenda();
  
  if (IS_DEMO) {
    if (!isDataSaved) {
      return (
        <div role="status" className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-400">
          Aviso de salvamento: exporte uma cópia de segurança antes de fechar o navegador.
        </div>
      );
    }
    return <div role="status" className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-400">Modo local: dados somente neste navegador. Não sincroniza com celular ou outros computadores. Exporte uma cópia antes de ativar a base central.</div>;
  }
  
  if (syncStatus === 'saved') return null;
  const blocked = ['error', 'conflict', 'recovery'].includes(syncStatus);
  return (
    <div role={blocked ? 'alert' : 'status'} className="flex flex-wrap items-center gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-400">
      <p className="flex-1 min-w-0">{syncMessage || (syncStatus === 'pending' ? 'Alterações em processamento.' : 'Sincronizando...')}</p>
      {syncStatus === 'error' && <button type="button" className="underline py-2" onClick={retrySync}>Tentar novamente</button>}
      {blocked && <><button type="button" className="underline py-2" onClick={exportPendingDraft}>Baixar dados</button><button type="button" className="underline py-2" onClick={reloadWorkspace}>Recarregar</button></>}
    </div>
  );
}
