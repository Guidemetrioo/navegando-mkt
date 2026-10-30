'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { StatusDespesa, DespesaGravacao } from '@/types/database';
import { todayInSaoPaulo } from '@/lib/date-utils';
import {
  Receipt,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  DollarSign,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  User,
  Check,
  X,
  Trash2,
  Sparkles,
} from 'lucide-react';

export function ReembolsosView() {
  const {
    allDespesasGravacao,
    addDespesaGravacao,
    updateDespesaStatus,
    employees,
    loggedEmployeeId,
    canManage,
  } = useAgenda();

  const currentMember = useMemo(
    () => employees.find((e) => e.id === loggedEmployeeId) || employees[0],
    [employees, loggedEmployeeId]
  );

  // ==========================================
  // OS 3 CAMPOS EXCLUSIVOS DO FORMULÁRIO DE REEMBOLSO
  // 1. Valor do Reembolso
  // 2. Razão
  // 3. Espaço de Upload para Comprovantes
  // ==========================================
  const [valorInput, setValorInput] = useState('');
  const [razaoInput, setRazaoInput] = useState('');
  const [comprovanteDataUrl, setComprovanteDataUrl] = useState<string>('');
  const [comprovanteNome, setComprovanteNome] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filtros exclusivos para Gestores
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  // Modal de visualização de comprovante
  const [previewReceipt, setPreviewReceipt] = useState<DespesaGravacao | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type)) {setFormError('Use JPG, PNG, WebP ou PDF.');return;}
    if (file.size > 1024 * 1024) {
      setFormError('O arquivo do comprovante deve ter no máximo 1MB.');
      return;
    }
    setFormError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setComprovanteDataUrl(reader.result);
        setComprovanteNome(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numericVal = parseFloat(valorInput.replace(/\./g, '').replace(',', '.'));
    if (!numericVal || numericVal <= 0) {
      setFormError('Informe um valor válido para o reembolso (ex: 45,90).');
      return;
    }

    if (!razaoInput.trim()) {
      setFormError('Informe a razão da despesa do dia de gravação (ex: Uber ida e volta).');
      return;
    }

    if (!comprovanteDataUrl) {
      setFormError('Anexe a foto ou arquivo do comprovante para solicitar o reembolso.');
      return;
    }

    const submitted=addDespesaGravacao({
      event_id: 'reembolso-direto',
      employee_id: currentMember?.id || loggedEmployeeId,
      employee_nome: currentMember?.nome || 'Colaborador',
      categoria: 'outros',
      descricao: razaoInput.trim(),
      valor: numericVal,
      data: todayInSaoPaulo(),
      comprovante_arquivo: comprovanteDataUrl,
      comprovante_nome: comprovanteNome || 'comprovante.jpg',
      status: 'pendente',
    });

    if(!submitted) return;

    // Limpa os 3 campos após enviar
    setValorInput('');
    setRazaoInput('');
    setComprovanteDataUrl('');
    setComprovanteNome('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ==========================================
  // REGRA DE VISIBILIDADE:
  // - Gestores (Donos e Gerentes): veem TODOS os reembolsos de TODOS os funcionários
  // - Funcionários: veem APENAS os seus próprios reembolsos
  // ==========================================
  const visibleReembolsos = useMemo(() => {
    const baseList = canManage
      ? allDespesasGravacao
      : allDespesasGravacao.filter((d) => d.employee_id === loggedEmployeeId);

    return baseList
      .filter((d) => {
        if (canManage && filterEmployeeId !== 'todos' && d.employee_id !== filterEmployeeId) {
          return false;
        }
        if (filterStatus !== 'todos' && d.status !== filterStatus) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [allDespesasGravacao, canManage, loggedEmployeeId, filterEmployeeId, filterStatus]);

  // Totais calculados sobre a visão permitida ao usuário
  const stats = useMemo(() => {
    const scopeList = canManage
      ? allDespesasGravacao
      : allDespesasGravacao.filter((d) => d.employee_id === loggedEmployeeId);

    const totalSolicitado = scopeList.reduce((acc, d) => acc + d.valor, 0);
    const totalPendente = scopeList
      .filter((d) => d.status === 'pendente' || d.status === 'aprovado')
      .reduce((acc, d) => acc + d.valor, 0);
    const totalReembolsado = scopeList
      .filter((d) => d.status === 'reembolsado')
      .reduce((acc, d) => acc + d.valor, 0);

    return {
      count: scopeList.length,
      totalSolicitado,
      totalPendente,
      totalReembolsado,
    };
  }, [allDespesasGravacao, canManage, loggedEmployeeId]);

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. CABEÇALHO COM IDENTIFICAÇÃO DE PERMISSÃO */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--ui-accent)]/15 text-[var(--ui-accent)] border border-[var(--ui-accent)]/30 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-foreground font-heading">
                Reembolsos de Despesas de Gravação
              </h2>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                  canManage
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {canManage ? (
                  <>
                    <ShieldCheck className="w-3 h-3" />
                    Visão Gestor: Todos os Funcionários
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3" />
                    Visão Individual: Apenas Meus Reembolsos
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {canManage
                ? 'Envie despesas ou audite todos os pedidos de reembolso e comprovantes enviados pela equipe.'
                : 'Envie suas despesas do dia de gravação em 3 passos simples e acompanhe o status do seu pagamento.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. RESUMO RÁPIDO (TOTAIS DO GESTOR OU TOTAIS INDIVIDUAIS DO FUNCIONÁRIO) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 uppercase font-bold block">
              {canManage ? 'Total Solicitado (Equipe)' : 'Total Solicitado por Você'}
            </span>
            <span className="text-2xl font-black text-foreground font-mono mt-1 block">
              R$ {stats.totalSolicitado.toFixed(2)}
            </span>
            <span className="text-[10px] text-zinc-500">{stats.count} solicitações registradas</span>
          </div>
          <Receipt className="w-8 h-8 text-[var(--ui-accent)]/50" />
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-amber-500/25 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-amber-300 uppercase font-bold block">
              Aguardando Pagamento / Análise
            </span>
            <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
              R$ {stats.totalPendente.toFixed(2)}
            </span>
            <span className="text-[10px] text-zinc-500">Pendentes ou aprovados para PIX</span>
          </div>
          <Clock className="w-8 h-8 text-amber-400/50" />
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-emerald-500/25 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-300 uppercase font-bold block">
              Total Já Reembolsado (Pago)
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
              R$ {stats.totalReembolsado.toFixed(2)}
            </span>
            <span className="text-[10px] text-zinc-500">Reembolsos concluídos</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400/50" />
        </div>
      </div>

      {/* 3. ÁREA PRINCIPAL: FORMULÁRIO DE 3 CAMPOS + LISTA DE REEMBOLSOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUNA ESQUERDA (5 cols): FORMULÁRIO DIRETO DE 3 CAMPOS */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-lg space-y-5"
        >
          <div className="border-b border-[var(--ui-border)] pb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--ui-accent)] flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Lançamento Rápido em 3 Passos
            </span>
            <h3 className="text-base sm:text-lg font-black text-foreground mt-0.5">
              Solicitar Novo Reembolso
            </h3>
            <p className="text-xs text-zinc-400">
              Solicitante: <strong className="text-foreground">{currentMember?.nome}</strong>
            </p>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs font-semibold text-rose-300">
              {formError}
            </div>
          )}

          {/* CAMPO 1: VALOR DO REEMBOLSO */}
          <div className="space-y-1.5">
            <label
              htmlFor="reembolso-valor"
              className="block text-xs font-extrabold text-foreground"
            >
              1. Valor do Reembolso (R$) *
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-[var(--ui-accent)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="reembolso-valor"
                type="text"
                inputMode="decimal"
                placeholder="Ex: 48,90"
                value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] text-sm font-black font-mono text-foreground focus:outline-none focus:border-[var(--ui-accent)]"
                required
              />
            </div>
          </div>

          {/* CAMPO 2: RAZÃO DO REEMBOLSO */}
          <div className="space-y-1.5">
            <label
              htmlFor="reembolso-razao"
              className="block text-xs font-extrabold text-foreground"
            >
              2. Razão da Despesa *
            </label>
            <input
              id="reembolso-razao"
              type="text"
              placeholder="Ex: Uber ida e volta gravação, Estacionamento, Alimentação..."
              value={razaoInput}
              onChange={(e) => setRazaoInput(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] text-xs sm:text-sm text-foreground focus:outline-none focus:border-[var(--ui-accent)]"
              required
            />
          </div>

          {/* CAMPO 3: ESPAÇO DE UPLOAD PARA COMPROVANTES */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-foreground">
              3. Upload do Comprovante (Foto ou PDF) *
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              className="hidden"
            />

            {!comprovanteDataUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 ${
                  isDragging
                    ? 'border-[var(--ui-accent)] bg-[var(--ui-accent)]/10'
                    : 'border-[var(--ui-border)] bg-[var(--ui-raised)]/60 hover:bg-[var(--ui-raised)] hover:border-[var(--ui-accent)]/50'
                }`}
              >
                <div className="w-11 h-11 rounded-2xl bg-[var(--ui-accent)]/15 text-[var(--ui-accent)] flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Clique para enviar ou arraste o comprovante aqui
                  </span>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    Aceita foto do recibo, print do Uber/PIX ou nota fiscal (PNG, JPG ou PDF)
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-emerald-300 truncate">
                      {comprovanteNome || 'Comprovante anexado'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setComprovanteDataUrl('');
                      setComprovanteNome('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs cursor-pointer"
                    title="Remover comprovante"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {comprovanteDataUrl.startsWith('data:image/') && (
                  <img
                    src={comprovanteDataUrl}
                    alt="Pré-visualização do comprovante"
                    className="w-full h-40 object-cover rounded-xl border border-[var(--ui-border)]"
                  />
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="gradient-cta w-full py-3.5 px-5 rounded-2xl text-foreground font-black text-xs sm:text-sm shadow-lg transition-all hover:scale-[1.01] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            <span>Enviar Pedido de Reembolso</span>
          </button>
        </form>

        {/* COLUNA DIREITA (7 cols): HISTÓRICO DE REEMBOLSOS */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--ui-border)] pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-foreground">
                {canManage
                  ? `Todos os Reembolsos da Equipe (${visibleReembolsos.length})`
                  : `Meus Reembolsos Solicitados (${visibleReembolsos.length})`}
              </h3>
              <p className="text-xs text-zinc-400">
                {canManage
                  ? 'Confira os comprovantes enviados e aprove ou marque como reembolsado.'
                  : 'Você visualiza exclusivamente as despesas enviadas pelo seu usuário.'}
              </p>
            </div>

            {/* Filtros de Gestor */}
            {canManage && (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterEmployeeId}
                  onChange={(e) => setFilterEmployeeId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] text-xs text-foreground"
                >
                  <option value="todos">Todos os Funcionários</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nome}
                    </option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] text-xs text-foreground"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="pendente">Pendentes</option>
                  <option value="aprovado">Aprovados</option>
                  <option value="reembolsado">Reembolsados</option>
                  <option value="recusado">Recusados</option>
                </select>
              </div>
            )}
          </div>

          {visibleReembolsos.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[var(--ui-raised)]/50 border border-dashed border-[var(--ui-border)] text-center space-y-2">
              <Receipt className="w-8 h-8 text-zinc-500 mx-auto" />
              <div className="text-sm font-bold text-foreground">
                Nenhum reembolso registrado até o momento
              </div>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Utilize o formulário ao lado com os 3 campos (Valor, Razão e Upload do Comprovante) para registrar uma despesa de gravação.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleReembolsos.map((item) => {
                const receiptSource = item.comprovante_arquivo || item.comprovante_url;
                const isImageReceipt = receiptSource?.startsWith('data:image/');

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Miniatura do Comprovante */}
                      {receiptSource ? (
                        <button
                          type="button"
                          onClick={() => setPreviewReceipt(item)}
                          className="w-14 h-14 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] overflow-hidden shrink-0 flex items-center justify-center hover:border-[var(--ui-accent)] transition-all cursor-pointer group relative"
                          title="Clique para abrir o comprovante"
                        >
                          {isImageReceipt ? (
                            <img
                              src={receiptSource}
                              alt="Comprovante"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText className="w-6 h-6 text-[var(--ui-accent)]" />
                          )}
                          <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-4 h-4 text-white" />
                          </span>
                        </button>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shrink-0 flex items-center justify-center text-zinc-500">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-foreground">
                            {item.descricao}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              item.status === 'reembolsado'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : item.status === 'aprovado'
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                                : item.status === 'recusado'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {item.status === 'reembolsado'
                              ? '✓ Reembolsado'
                              : item.status === 'aprovado'
                              ? 'Aprovado'
                              : item.status === 'recusado'
                              ? 'Recusado'
                              : 'Pendente'}
                          </span>
                        </div>

                        <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-zinc-200">
                            Colaborador: {item.employee_nome}
                          </span>
                          <span>•</span>
                          <span>Data: {item.data.split('-').reverse().join('/')}</span>
                          {item.client_nome && (
                            <>
                              <span>•</span>
                              <span className="text-[var(--ui-accent)]">{item.client_nome}</span>
                            </>
                          )}
                        </div>

                        {receiptSource && (
                          <button
                            type="button"
                            onClick={() => setPreviewReceipt(item)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#38bdf8] hover:underline cursor-pointer pt-0.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Comprovante Anexado ({item.comprovante_nome || 'Arquivo'})</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Valor + Botões de Aprovação (Exclusivos para Gestores) */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-[var(--ui-border)]">
                      <span className="text-base sm:text-lg font-black font-mono text-foreground">
                        R$ {item.valor.toFixed(2)}
                      </span>

                      {canManage && (
                        <div className="flex items-center gap-1.5">
                          {item.status === 'pendente' && (
                            <button
                              type="button"
                              onClick={() => updateDespesaStatus(item.id, 'aprovado')}
                              className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-[10px] font-bold cursor-pointer flex items-center gap-1"
                              title="Aprovar reembolso"
                            >
                              <Check className="w-3 h-3" />
                              <span>Aprovar</span>
                            </button>
                          )}

                          {item.status !== 'reembolsado' && (
                            <button
                              type="button"
                              onClick={() => updateDespesaStatus(item.id, 'reembolsado')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold cursor-pointer flex items-center gap-1"
                              title="Confirmar pagamento do reembolso"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Pagar / Reembolsar</span>
                            </button>
                          )}

                          {item.status !== 'recusado' && item.status !== 'reembolsado' && (
                            <button
                              type="button"
                              onClick={() => updateDespesaStatus(item.id, 'recusado')}
                              className="p-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] cursor-pointer"
                              title="Recusar reembolso"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE VISUALIZAÇÃO DO COMPROVANTE */}
      {previewReceipt && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewReceipt(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--ui-border)] pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--ui-accent)]">
                  Comprovante de Reembolso • {previewReceipt.employee_nome}
                </span>
                <h4 className="text-base font-black text-foreground">
                  {previewReceipt.descricao} — R$ {previewReceipt.valor.toFixed(2)}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewReceipt(null)}
                className="p-1.5 rounded-xl bg-[var(--ui-raised)] text-zinc-400 hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-[var(--ui-page)] border border-[var(--ui-border)] p-3 flex items-center justify-center max-h-[65vh] overflow-auto">
              {(previewReceipt.comprovante_arquivo || previewReceipt.comprovante_url)?.startsWith(
                'data:image/'
              ) ? (
                <img
                  src={previewReceipt.comprovante_arquivo || previewReceipt.comprovante_url}
                  alt="Comprovante enviado"
                  className="max-h-[58vh] w-auto rounded-xl object-contain"
                />
              ) : (
                <div className="p-8 text-center space-y-3">
                  <FileText className="w-10 h-10 text-[var(--ui-accent)] mx-auto" />
                  <p className="text-xs text-zinc-300">
                    Arquivo anexado: <strong>{previewReceipt.comprovante_nome || 'Comprovante'}</strong>
                  </p>
                  {(previewReceipt.comprovante_arquivo || previewReceipt.comprovante_url) && (
                    <a
                      href={previewReceipt.comprovante_arquivo || previewReceipt.comprovante_url}
                      download={previewReceipt.comprovante_nome || 'comprovante'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gradient-cta inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-foreground"
                    >
                      Baixar / Abrir Comprovante
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

