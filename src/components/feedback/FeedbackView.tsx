'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import {
  Download,
  FileText,
  MessageSquarePlus,
  Send,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

interface FeedbackItem {
  id: string;
  employee_id: string;
  employee_name: string;
  texto: string;
  arquivo_nome?: string;
  arquivo_tipo?: string;
  arquivo_tamanho?: number;
  arquivo_data_url?: string;
  criado_em: string;
}

const STORAGE_KEY = 'navegando_mkt_feedbacks_v1';
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FeedbackView() {
  const { employees, loggedEmployeeId, canManage, toast } = useAgenda();
  const currentMember = employees.find((e) => e.id === loggedEmployeeId);

  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const [texto, setTexto] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileDataUrl, setFileDataUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setItems(parsed);
        }
      } catch {
        // Mantém lista vazia caso armazenamento local não esteja disponível
      } finally {
        setHydrated(true);
      }
    });
  }, []);

  const persistItems = (next: FeedbackItem[]): boolean => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return true;
    } catch {
      return false;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast('O arquivo deve ter no máximo 4 MB.', 'error');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setFileName(file.name);
      setFileType(file.type || 'application/octet-stream');
      setFileSize(file.size);
      setFileDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedFile = () => {
    setFileName('');
    setFileType('');
    setFileSize(0);
    setFileDataUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = texto.trim();
    if (!trimmed && !fileDataUrl) {
      toast('Envie um arquivo ou escreva seu feedback antes de salvar.', 'error');
      return;
    }

    const newItem: FeedbackItem = {
      id: `fb-${crypto.randomUUID()}`,
      employee_id: loggedEmployeeId || 'desconhecido',
      employee_name: currentMember?.nome || 'Membro da Equipe',
      texto: trimmed,
      ...(fileDataUrl
        ? {
            arquivo_nome: fileName,
            arquivo_tipo: fileType,
            arquivo_tamanho: fileSize,
            arquivo_data_url: fileDataUrl,
          }
        : {}),
      criado_em: new Date().toISOString(),
    };

    const next = [newItem, ...items];
    if (!persistItems(next)) {
      toast(
        'Não foi possível salvar no navegador (limite de espaço atingido). Tente um arquivo menor.',
        'error'
      );
      return;
    }

    setItems(next);
    setTexto('');
    clearSelectedFile();
    toast('Feedback enviado com sucesso!', 'success');
  };

  const handleDelete = (id: string) => {
    const next = items.filter((item) => item.id !== id);
    persistItems(next);
    setItems(next);
    toast('Feedback removido.', 'info');
  };

  const visibleItems = canManage
    ? items
    : items.filter((item) => item.employee_id === loggedEmployeeId);

  return (
    <div className="flex flex-col gap-6 pb-12 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--ui-accent)]">
          <MessageSquarePlus className="w-4 h-4" />
          <span>Feedback</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground font-heading">
          Enviar Feedback
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Anexe um arquivo (opcional) e escreva livremente o que quiser compartilhar.
        </p>
      </div>

      {/* Formulário com apenas Upload + Texto livre */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] p-4 sm:p-6 flex flex-col gap-5 shadow-sm"
      >
        {/* 1. Campo de Upload */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Upload de arquivo
          </label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id="feedback-file-upload"
          />

          {!fileDataUrl ? (
            <label
              htmlFor="feedback-file-upload"
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--ui-border)] hover:border-[var(--ui-accent)] bg-[var(--ui-raised)]/60 hover:bg-[var(--ui-raised)] py-7 px-4 text-center cursor-pointer transition-colors"
            >
              <Upload className="w-6 h-6 text-[var(--ui-accent)]" />
              <span className="text-xs sm:text-sm font-semibold text-foreground">
                Clique para selecionar um arquivo
              </span>
              <span className="text-[11px] text-zinc-400">
                Imagem, PDF, documento ou print (máx. 4 MB)
              </span>
            </label>
          ) : (
            <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-raised)] p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {fileType.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fileDataUrl}
                    alt={fileName}
                    className="w-12 h-12 rounded-lg object-cover border border-[var(--ui-border)] shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[var(--ui-accent)]/15 text-[var(--ui-accent)] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-foreground truncate">
                    {fileName}
                  </div>
                  <div className="text-[11px] text-zinc-400">{formatBytes(fileSize)}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={clearSelectedFile}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer shrink-0"
                title="Remover arquivo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 2. Campo para escrever o que quiser */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="feedback-free-text"
            className="text-xs font-bold uppercase tracking-wider text-zinc-300"
          >
            Escreva o que quiser
          </label>
          <textarea
            id="feedback-free-text"
            rows={6}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escreva aqui seu feedback, sugestão, melhoria ou observação livre..."
            className="w-full rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] p-3.5 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--ui-accent)] resize-y leading-relaxed"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!texto.trim() && !fileDataUrl}
            className="gradient-cta px-5 py-2.5 rounded-xl text-foreground font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Feedback</span>
          </button>
        </div>
      </form>

      {/* Lista de feedbacks registrados */}
      {hydrated && visibleItems.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 px-1">
            Feedbacks enviados ({visibleItems.length})
          </h3>

          <div className="flex flex-col gap-3">
            {visibleItems.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <strong className="text-foreground">{item.employee_name}</strong>
                    <span className="text-zinc-500">·</span>
                    <span className="text-zinc-400">
                      {new Date(item.criado_em).toLocaleString('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {(canManage || item.employee_id === loggedEmployeeId) && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                      title="Excluir feedback"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {item.texto && (
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed break-words">
                    {item.texto}
                  </p>
                )}

                {item.arquivo_data_url && (
                  <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-raised)] p-3 flex flex-col gap-2">
                    {item.arquivo_tipo?.startsWith('image/') && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.arquivo_data_url}
                        alt={item.arquivo_nome || 'Anexo'}
                        className="max-h-72 w-auto rounded-lg object-contain self-start border border-[var(--ui-border)]"
                      />
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-zinc-300 truncate">
                        {item.arquivo_nome || 'Arquivo anexado'}{' '}
                        {item.arquivo_tamanho ? `(${formatBytes(item.arquivo_tamanho)})` : ''}
                      </span>
                      <a
                        href={item.arquivo_data_url}
                        download={item.arquivo_nome || 'anexo-feedback'}
                        className="px-2.5 py-1 rounded-lg bg-[var(--ui-surface)] hover:bg-[var(--ui-hover)] border border-[var(--ui-border)] text-xs font-bold text-[var(--ui-accent)] flex items-center gap-1 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar</span>
                      </a>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
