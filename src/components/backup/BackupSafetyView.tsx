'use client';

import { AuditLog } from './AuditLog';
import { IS_DEMO } from '@/lib/app-mode';
import React, { useRef, useState } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import {
  ShieldCheck,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  HardDrive,
  FileJson,
  Lock,
  Sparkles,
} from 'lucide-react';

export function BackupSafetyView() {
  const {
    employees,
    clients,
    events,
    pontos,
    deliverables,
    reels,
    mentions,
    exportSystemBackup,
    restoreSystemBackup,
    resetToInitialData,
    isDataSaved,
  } = useAgenda();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setRestoreMessage(null);
    try {
      const ok = await restoreSystemBackup(file);
      if (ok) {
        setRestoreMessage({
          type: 'success',
          text: 'Backup restaurado com sucesso! Todos os dados e arquivos foram recarregados.',
        });
      } else {
        setRestoreMessage({
          type: 'error',
          text: 'Arquivo de backup inválido ou incompatível.',
        });
      }
    } catch (err) {
      setRestoreMessage({
        type: 'error',
        text: 'Erro ao processar arquivo de backup.',
      });
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if(!IS_DEMO) return <section className="glass-card rounded-2xl p-6 grid gap-5">
    <h1 className="text-2xl font-semibold">Dados e recuperação</h1>
    <p className="text-sm text-zinc-400">A exportação abaixo contém os dados operacionais disponíveis para a gestão. Ela não inclui os arquivos privados nem substitui o backup transacional do banco.</p>
    <button type="button" onClick={exportSystemBackup} disabled={!isDataSaved} className="gradient-cta rounded-lg p-3 self-start disabled:opacity-50">Exportar dados confirmados (.json)</button>
    <div className="border border-[var(--ui-border)] rounded-lg p-4 text-sm text-zinc-400 leading-relaxed">O backup do provedor, a cópia criptografada independente e o monitoramento precisam ser ativados na implantação. A restauração deve ser ensaiada em um ambiente separado, com validação dos dados e dos arquivos, antes da liberação para uso real.</div>
    <p className="text-xs text-zinc-500">Restauração em massa e reinicialização de dados estão indisponíveis nesta interface de produção.</p>
    <AuditLog />
  </section>;
  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground font-heading">
                Segurança dos Dados & Backup
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Cópia local
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Garantia de que nenhum arquivo, gravação ou ponto eletrônico seja perdido no dia a dia da agência.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={exportSystemBackup}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-foreground font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 cursor-pointer self-start sm:self-auto whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>Baixar Backup Completo (.json)</span>
        </button>
      </div>

      {/* 2. STATUS DA BASE DE DADOS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-center">
          <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Gravações Salvas</span>
          <span className="text-xl font-bold text-foreground mt-1 block">{events.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-center">
          <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Restaurantes</span>
          <span className="text-xl font-bold text-foreground mt-1 block">{clients.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-center">
          <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Pontos com GPS</span>
          <span className="text-xl font-bold text-foreground mt-1 block">{pontos.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-center">
          <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Vídeos/Arquivos</span>
          <span className="text-xl font-bold text-[var(--ui-accent)] mt-1 block">{deliverables.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-center">
          <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Membros da Equipe</span>
          <span className="text-xl font-bold text-foreground mt-1 block">{employees.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-center">
          <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Métricas Reels</span>
          <span className="text-xl font-bold text-foreground mt-1 block">{reels.length}</span>
        </div>
      </div>

      {/* 3. CARTÕES DE OPERAÇÃO: EXPORTAR E RESTAURAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Exportação */}
        <div className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[var(--ui-accent)]/10 text-[var(--ui-accent)] flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-foreground font-heading mt-1">
              Exportar Cópia de Segurança
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Crie um arquivo JSON contendo todos os clientes, gravações agendadas, pontos batidos, fotos e links do Google Drive. Salve este arquivo em uma pasta segura ou envie para outro membro da equipe.
            </p>
          </div>

          <button
            type="button"
            onClick={exportSystemBackup}
            className="w-full py-3 px-4 rounded-xl bg-[var(--ui-raised)] hover:bg-[var(--ui-hover)] text-zinc-200 border border-[var(--ui-border)] hover:text-foreground font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <FileJson className="w-4 h-4 text-[var(--ui-accent)]" />
            <span>Gerar e Baixar Arquivo .JSON</span>
          </button>
        </div>

        {/* Card Restauração */}
        <div className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-[#38bdf8] flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-foreground font-heading mt-1">
              Restaurar Dados de Backup
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Selecione um arquivo de backup previamente exportado para restaurar o banco de dados da agência integralmente. A importação substitui a cópia local; exporte a versão atual antes de continuar.
            </p>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoring}
              className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-foreground font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-sky-500/20"
            >
              <Upload className="w-4 h-4" />
              <span>{isRestoring ? 'Restaurando...' : 'Carregar Arquivo de Backup (.json)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de Mensagem de Restauração */}
      {restoreMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold ${
            restoreMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          {restoreMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{restoreMessage.text}</span>
        </div>
      )}

      {/* 4. ZONA DE PERIGO / RESTAURAR PADRÕES */}
      <div className="p-5 rounded-3xl bg-zinc-900/40 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Restaurar Configuração Inicial de Fábrica
          </h4>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Limpa o armazenamento local do navegador e recarrega os 6 restaurantes parceiros e escalas padrão da Navegando MKT.
          </p>
        </div>

        <button
          type="button"
          onClick={resetToInitialData}
          className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 border border-zinc-700 hover:border-rose-800 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          Restaurar Dados Iniciais
        </button>
      </div>
    </div>
  );
}
