'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { EventTipo, EventStatus, ConflictRecord, Client, DespesaGravacao, CategoriaDespesa } from '@/types/database';
import { EmployeeBadge } from '../agenda/EmployeeBadge';
import {
  X,
  AlertTriangle,
  Trash2,
  Clock,
  MapPin,
  FileText,
  UserCheck,
  Search,
  PlusCircle,
  Video,
  Sparkles,
  ExternalLink,
  FolderOpen,
  CheckCircle2,
  Building,
  Receipt,
  DollarSign,
  MessageCircle,
  Send,
  Check,
  Plus,
} from 'lucide-react';

export function EventModal() {
  const {
    isEventModalOpen,
    editingEvent,
    closeEventModal,
    saveEvent,
    deleteEvent,
    saveEventReport,
    loggedEmployeeId,
    clients,
    employees,
    addClient,
    userRole,
    addDespesaGravacao,
    sendManualWhatsAppConfirmation,
  } = useAgenda();

  // Aba ativa: 'agenda', 'relatorio' ou 'despesas'
  const [activeTab, setActiveTab] = useState<'agenda' | 'relatorio' | 'despesas'>('agenda');

  // Estados do formulário de Despesas
  const [despCategoria, setDespCategoria] = useState<CategoriaDespesa>('transporte');
  const [despDescricao, setDespDescricao] = useState('');
  const [despValor, setDespValor] = useState('');
  const [despEmployeeId, setDespEmployeeId] = useState(loggedEmployeeId);
  const [despComprovanteUrl, setDespComprovanteUrl] = useState('');

  // Estados do formulário de Agenda
  const [clientId, setClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientContact, setNewClientContact] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [tipo, setTipo] = useState<EventTipo>('gravacao');
  const [local, setLocal] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [status, setStatus] = useState<EventStatus>('agendado');

  // Estados do Relatório do Filmmaker (campo único livre)
  const [relatorioTexto, setRelatorioTexto] = useState('');
  const [driveFolderLink, setDriveFolderLink] = useState('');

  // Conflitos detectados
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Sincronizar ao abrir/mudar editingEvent
  useEffect(() => {
    if (editingEvent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the form from the selected event when the modal opens.
      setClientId(editingEvent.client_id || '');
      const existingClient = clients.find((c) => c.id === editingEvent.client_id);
      setClientSearch(existingClient ? existingClient.nome : '');
      setDate(editingEvent.data || '');
      setStartTime(editingEvent.hora_inicio ? editingEvent.hora_inicio.slice(0, 5) : '09:00');
      setEndTime(editingEvent.hora_fim ? editingEvent.hora_fim.slice(0, 5) : '12:00');
      setTipo(editingEvent.tipo || 'gravacao');
      setLocal(editingEvent.local || '');
      setObservacoes(editingEvent.observacoes || '');
      setSelectedEmpIds(editingEvent.assigned_employee_ids || []);
      setStatus(editingEvent.status || 'agendado');
      setConflicts([]);
      setErrorMessage('');
      setShowNewClientForm(false);

      // Carregar dados existentes do Relatório do Filmmaker
      const rep = editingEvent.relatorio_filmmaker;
      if (rep) {
        setRelatorioTexto(rep.relatorio_texto || rep.observacoes || rep.pratos_gravados || '');
        setDriveFolderLink(rep.pasta_brutos_link || existingClient?.drive_folder_url || '');
      } else {
        setRelatorioTexto('');
        setDriveFolderLink(existingClient?.drive_folder_url || '');
      }

      // Se já foi realizado ou se o usuário logado é filmmaker, default pode ser 'agenda'
      setActiveTab('agenda');
    }
  }, [editingEvent, clients]);

  if (!isEventModalOpen || !editingEvent) return null;

  const isEditing = Boolean(editingEvent.id);

  // Filtragem de clientes para autocomplete
  const filteredClients = clients.filter((c) =>
    c.nome.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const toggleEmployee = (empId: string) => {
    setSelectedEmpIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSelectClient = (c: Client) => {
    setClientId(c.id);
    setClientSearch(c.nome);
    if (!local && c.endereco) {
      setLocal(c.endereco);
    }
    setIsClientDropdownOpen(false);
  };

  const handleCreateNewClient = () => {
    if (!newClientName.trim()) return;
    const created = addClient({
      nome: newClientName.trim(),
      contato: newClientContact.trim() || undefined,
      endereco: newClientAddress.trim() || undefined,
    });
    setClientId(created.id);
    setClientSearch(created.nome);
    if (created.endereco) {
      setLocal(created.endereco);
    }
    setShowNewClientForm(false);
    setIsClientDropdownOpen(false);
  };

  const handleSubmit = (allowOverride = false) => {
    setErrorMessage('');

    // Validações obrigatórias conforme especificação:
    // 1. Cliente obrigatório
    if (!clientId) {
      setErrorMessage('Por favor, selecione um cliente.');
      return;
    }
    // 2. Data obrigatória
    if (!date) {
      setErrorMessage('Por favor, selecione a data da gravação.');
      return;
    }
    // 3. Fim depois do início
    if (endTime <= startTime) {
      setErrorMessage('O horário de término deve ser posterior ao horário de início.');
      return;
    }
    // 4. Pelo menos 1 funcionário escalado
    if (selectedEmpIds.length === 0) {
      setErrorMessage('Selecione pelo menos 1 funcionário para esta gravação.');
      return;
    }

    const payload = {
      id: editingEvent.id || undefined,
      client_id: clientId,
      tipo,
      data: date,
      hora_inicio: startTime,
      hora_fim: endTime,
      local: local || undefined,
      observacoes: observacoes || undefined,
      status,
      assigned_employee_ids: selectedEmpIds,
    };

    const res = saveEvent(payload, allowOverride);

    if (!res.success && res.conflicts && res.conflicts.length > 0) {
      setConflicts(res.conflicts);
    }
  };

  const handleSaveFilmmakerReport = () => {
    if (!editingEvent.id) {
      handleSubmit(false);
      return;
    }
    const loggedMember = employees.find((e) => e.id === loggedEmployeeId);
    saveEventReport(editingEvent.id, {
      preenchido: true,
      preenchido_por_id: loggedEmployeeId,
      preenchido_por_nome: loggedMember ? loggedMember.nome : 'Filmmaker',
      preenchido_em: new Date().toISOString(),
      relatorio_texto: relatorioTexto.trim(),
      observacoes: relatorioTexto.trim(),
      pasta_brutos_link: driveFolderLink,
    });
    closeEventModal();
  };

  const currentEventExpenses = useMemo(() => {
    return editingEvent?.despesas || [];
  }, [editingEvent?.despesas]);

  const totalEventExpenses = useMemo(() => {
    return currentEventExpenses.reduce((sum, d) => sum + d.valor, 0);
  }, [currentEventExpenses]);

  const handleCreateDespesa = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(despValor.replace(',', '.'));
    if (!val || val <= 0) {
      alert('Informe um valor numérico válido para a despesa.');
      return;
    }
    if (!despDescricao.trim()) {
      alert('Descreva a despesa (ex: Uber ida e volta, Almoço da equipe, etc).');
      return;
    }
    const emp = employees.find((e) => e.id === despEmployeeId) || employees[0];

    addDespesaGravacao({
      event_id: editingEvent.id,
      employee_id: emp.id,
      employee_nome: emp.nome,
      categoria: despCategoria,
      descricao: despDescricao.trim(),
      valor: val,
      data: date || new Date().toISOString().slice(0, 10),
      comprovante_url: despComprovanteUrl.trim() || undefined,
      status: 'pendente',
    });

    setDespDescricao('');
    setDespValor('');
    setDespComprovanteUrl('');
  };

  const currentClient = clients.find((c) => c.id === clientId) || editingEvent.client;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
      onClick={closeEventModal}
    >
      <div
        className="relative w-full max-w-xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white rounded-t-3xl sm:rounded-2xl border-t sm:border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 shadow-2xl p-5 sm:p-6 flex flex-col gap-4 max-h-[92vh] overflow-y-auto pb-safe sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab bar para mobile */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700 mx-auto -mt-1 sm:hidden shrink-0" />

        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-foreground dark:text-foreground text-zinc-900 font-heading">
              {isEditing ? (currentClient?.nome || 'Detalhes da Gravação') : 'Nova Gravação'}
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-400 text-zinc-600 mt-0.5">
              {isEditing ? 'Alterne entre escala, relatório do filmmaker e despesas operacionais.' : 'Escalone a equipe e defina horário e local.'}
            </p>
          </div>

          <button
            type="button"
            onClick={closeEventModal}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-foreground hover:bg-[var(--ui-border)] dark:hover:bg-[var(--ui-border)] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas Superiores: Agenda vs Relatório vs Custos */}
        {isEditing && (
          <div className="flex items-center gap-1.5 p-1 bg-[var(--ui-surface)] rounded-xl border border-[var(--ui-border)]">
            <button
              type="button"
              onClick={() => setActiveTab('agenda')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'agenda'
                  ? 'brand-solid bg-[var(--ui-accent)] text-foreground shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[var(--ui-raised)]'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('relatorio')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'relatorio'
                  ? 'bg-[#38bdf8] text-black shadow-sm font-black'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[var(--ui-raised)]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Relatório</span>
              {editingEvent?.relatorio_filmmaker?.preenchido ? (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  OK
                </span>
              ) : (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Pendente
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('despesas')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'despesas'
                  ? 'bg-amber-500 text-black shadow-sm font-black'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[var(--ui-raised)]'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Despesas</span>
              {currentEventExpenses.length > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-black/20 text-black">
                  {currentEventExpenses.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* ALERTA DE CONFLITO DE HORÁRIO */}
        {conflicts.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Aviso de Conflito de Horário!</span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              O seguinte membro da equipe já está escalado em outro trabalho neste mesmo dia e horário:
            </p>
            <ul className="text-xs text-amber-100/80 space-y-1 pl-4 list-disc">
              {conflicts.map((c, i) => (
                <li key={i}>
                  <strong>{c.employee_name}</strong> já está em <em>{c.client_name}</em> das{' '}
                  {c.hora_inicio.slice(0, 5)} às {c.hora_fim.slice(0, 5)}
                  {c.local ? ` (${c.local})` : ''}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs transition-colors cursor-pointer"
              >
                Salvar mesmo assim
              </button>
              <button
                type="button"
                onClick={() => setConflicts([])}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors cursor-pointer"
              >
                Ajustar horários
              </button>
            </div>
          </div>
        )}

        {/* Mensagem de Erro de Validação */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-medium">
            {errorMessage}
          </div>
        )}

        {/* ==========================================
            ABA 1: AGENDA & ESCALA DA GRAVAÇÃO
            ========================================== */}
        {activeTab === 'agenda' && (
          <div className="flex flex-col gap-3.5">
          {/* Cliente com Autocomplete */}
          <div className="relative">
            <label className="block text-xs font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">
              Cliente (Restaurante) *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar cliente ou digitar novo..."
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setIsClientDropdownOpen(true);
                  if (!e.target.value) setClientId('');
                }}
                onFocus={() => setIsClientDropdownOpen(true)}
                className="w-full bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-50 border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-300 rounded-xl px-3 py-2 text-sm text-foreground dark:text-foreground text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {/* Dropdown de Autocomplete */}
            {isClientDropdownOpen && (
              <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-white border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-300 rounded-xl shadow-xl divide-y divide-[var(--ui-border)] dark:divide-[var(--ui-border)] divide-slate-100">
                {filteredClients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectClient(c)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--ui-border)] dark:hover:bg-[var(--ui-border)] hover:bg-slate-100 flex flex-col cursor-pointer"
                  >
                    <span className="font-bold text-foreground dark:text-foreground text-zinc-900">
                      {c.nome}
                    </span>
                    {c.endereco && (
                      <span className="text-[11px] text-zinc-400 truncate">{c.endereco}</span>
                    )}
                  </button>
                ))}

                {/* Opção de Cadastrar Novo Cliente */}
                <button
                  type="button"
                  onClick={() => {
                    setNewClientName(clientSearch);
                    setShowNewClientForm(true);
                    setIsClientDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--ui-accent)] hover:bg-[var(--ui-accent)]/10 flex items-center gap-1.5 font-semibold cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Cadastrar novo restaurante &quot;{clientSearch}&quot;</span>
                </button>
              </div>
            )}
          </div>

          {/* Form Embutido de Novo Cliente */}
          {showNewClientForm && (
            <div className="p-3 rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-accent)]/30 flex flex-col gap-2 animate-in fade-in">
              <span className="text-xs font-bold text-[var(--ui-accent)] flex items-center gap-1">
                <Building className="w-3.5 h-3.5" />
                Novo Restaurante / Cliente
              </span>
              <input
                type="text"
                placeholder="Nome do Restaurante *"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full bg-[var(--ui-surface)] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-foreground"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Contato / WhatsApp"
                  value={newClientContact}
                  onChange={(e) => setNewClientContact(e.target.value)}
                  className="w-full bg-[var(--ui-surface)] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                />
                <input
                  type="text"
                  placeholder="Bairro / Endereço"
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  className="w-full bg-[var(--ui-surface)] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                />
              </div>
              <div className="flex justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(false)}
                  className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewClient}
                  className="px-3 py-1 brand-solid bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-foreground font-semibold text-xs rounded-lg"
                >
                  Salvar Cliente
                </button>
              </div>
            </div>
          )}

          {/* Data e Horários */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">
                Data *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-50 border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-foreground dark:text-foreground text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">
                Início *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-50 border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-foreground dark:text-foreground text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">
                Fim *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-50 border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-foreground dark:text-foreground text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
              />
            </div>
          </div>

          {/* Tipo de Trabalho */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">
              Tipo de Trabalho
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['gravacao', 'foto', 'edicao', 'reuniao'] as EventTipo[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-xl border text-center capitalize transition-all cursor-pointer ${
                    tipo === t
                      ? 'brand-solid bg-[var(--ui-accent)] text-foreground border-[var(--ui-accent)] font-bold shadow-sm'
                      : 'bg-[var(--ui-raised)] text-zinc-400 border-[var(--ui-border)] hover:text-foreground'
                  }`}
                >
                  {t === 'gravacao' ? 'Gravação' : t === 'foto' ? 'Fotografia' : t === 'edicao' ? 'Edição' : 'Reunião'}
                </button>
              ))}
            </div>
          </div>

          {/* Local / Bairro */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">
              Local / Bairro
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: Mooca, Jardins, etc."
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                className="w-full bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-50 border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-300 rounded-xl px-3 py-1.5 text-xs text-foreground dark:text-foreground text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
              />
              <MapPin className="w-4 h-4 text-zinc-400 absolute right-3 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Seleção de Equipe (Filmmakers & Meninas dos Vídeos) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700">
                Escala da Equipe * (Filmmaker + Criadora)
              </label>
              <span className="text-[11px] text-zinc-400">
                {selectedEmpIds.length} selecionado{selectedEmpIds.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-50 border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-300 flex flex-col gap-3">
              {/* Grupo Filmmakers */}
              <div>
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#38bdf8] uppercase tracking-wider mb-1.5">
                  <Video className="w-3.5 h-3.5" />
                  Filmmaker (Câmera & Vídeo)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {employees
                    .filter((emp) => emp.funcao === 'filmmaker')
                    .map((emp) => {
                      const isSelected = selectedEmpIds.includes(emp.id);
                      return (
                        <EmployeeBadge
                          key={emp.id}
                          employee={emp}
                          size="sm"
                          isSelected={isSelected}
                          onClick={() => toggleEmployee(emp.id)}
                        />
                      );
                    })}
                </div>
              </div>

              {/* Divisor */}
              <div className="border-t border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200" />

              {/* Grupo Meninas dos Vídeos (Criadoras) */}
              <div>
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#f472b6] uppercase tracking-wider mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Meninas dos Vídeos (Apresentação & Reels)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {employees
                    .filter((emp) => emp.funcao === 'criadora')
                    .map((emp) => {
                      const isSelected = selectedEmpIds.includes(emp.id);
                      return (
                        <EmployeeBadge
                          key={emp.id}
                          employee={emp}
                          size="sm"
                          isSelected={isSelected}
                          onClick={() => toggleEmployee(emp.id)}
                        />
                      );
                    })}
                </div>
              </div>

              {/* Outros se houver */}
              {employees.some((emp) => !emp.funcao) && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--ui-border)]">
                  {employees
                    .filter((emp) => !emp.funcao)
                    .map((emp) => {
                      const isSelected = selectedEmpIds.includes(emp.id);
                      return (
                        <EmployeeBadge
                          key={emp.id}
                          employee={emp}
                          size="sm"
                          isSelected={isSelected}
                          onClick={() => toggleEmployee(emp.id)}
                        />
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Status do Evento & Confirmação WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)]">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">
                Status da Gravação
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="w-full bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)] font-medium"
              >
                <option value="agendado">Agendado (Aguardando)</option>
                <option value="confirmado">Confirmado (Cliente / WhatsApp)</option>
                <option value="realizado">Realizado (Finalizado)</option>
                <option value="cancelado">Cancelado / Remarcar</option>
              </select>
            </div>

            {/* Status WhatsApp */}
            <div className="flex flex-col justify-between">
              <span className="block text-xs font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">
                Confirmação via WhatsApp
              </span>
              <div className="flex items-center gap-2">
                {status === 'confirmado' ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold w-full justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmado pelo Cliente
                  </span>
                ) : editingEvent?.confirmacao_whatsapp?.enviado ? (
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium truncate">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      Aguardando Resposta
                    </span>
                    <button
                      type="button"
                      onClick={() => sendManualWhatsAppConfirmation(editingEvent.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      title="Reenviar mensagem de confirmação"
                    >
                      <Send className="w-3 h-3" />
                      Reenviar
                    </button>
                  </div>
                ) : editingEvent ? (
                  <button
                    type="button"
                    onClick={() => sendManualWhatsAppConfirmation(editingEvent.id)}
                    className="w-full py-1.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Enviar Confirmação WhatsApp
                  </button>
                ) : (
                  <span className="text-[11px] text-zinc-500 italic py-1 text-center w-full block">
                    Disponível após criar a gravação
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">
              Observações da Produção
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Levar gimbal, lentes macro, chegar 15 min antes..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-50 border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-300 rounded-xl px-3 py-2 text-xs text-foreground dark:text-foreground text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
            />
          </div>
        </div>
        )}

        {/* ==========================================
            ABA 2: RELATÓRIO DO FILMMAKER (PRODUÇÃO DE VÍDEO)
            ========================================== */}
        {activeTab === 'relatorio' && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            {/* Card com resumo da sessão */}
            <div className="p-3.5 rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-[#38bdf8] uppercase tracking-wider">
                  Produção no Cliente
                </span>
                <h4 className="text-sm font-bold text-foreground">
                  {currentClient?.nome || 'Restaurante Parceiro'}
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Data: {date || 'Data da gravação'} • {startTime} às {endTime}
                </p>
              </div>
              {driveFolderLink && (
                <a
                  href={driveFolderLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 text-xs font-bold border border-indigo-500/30 transition-colors w-fit"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Abrir Pasta de Brutos</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Campo ÚNICO para o relato livre do filmmaker */}
            <div className="flex flex-col gap-2">
              <label className="block text-xs font-semibold text-zinc-300">
                Relatório da Gravação
              </label>
              <textarea
                rows={11}
                placeholder="Escreva livremente aqui o relato da gravação: pratos preparados, bastidores, ocorrências no restaurante, orientações para a equipe de edição, ou qualquer detalhe da sessão..."
                value={relatorioTexto}
                onChange={(e) => setRelatorioTexto(e.target.value)}
                className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-2xl p-4 text-xs text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#38bdf8] resize-y min-h-[240px] leading-relaxed font-sans"
              />
            </div>

            {/* Informações de preenchimento se houver */}
            {editingEvent?.relatorio_filmmaker?.preenchido && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 flex items-center justify-between">
                <span>Relatório preenchido por: <strong>{editingEvent.relatorio_filmmaker.preenchido_por_nome || 'Filmmaker'}</strong></span>
                <span>{editingEvent.relatorio_filmmaker.preenchido_em ? new Date(editingEvent.relatorio_filmmaker.preenchido_em).toLocaleDateString('pt-BR') : 'Hoje'}</span>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            ABA 3: CUSTOS & DESPESAS DA GRAVAÇÃO
            ========================================== */}
        {activeTab === 'despesas' && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            {/* Header com resumo */}
            <div className="p-3.5 rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Reembolsos & Custos Operacionais
                </span>
                <h4 className="text-sm font-bold text-foreground">
                  Despesas em {currentClient?.nome || 'Restaurante'}
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Transporte, alimentação e insumos lançados pela equipe.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Total da Sessão</span>
                <span className="text-base font-extrabold text-foreground font-mono">
                  R$ {totalEventExpenses.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Formulário para adicionar nova despesa */}
            <form onSubmit={handleCreateDespesa} className="p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex flex-col gap-3">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[var(--ui-accent)]" />
                Lançar Despesa da Sessão
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Categoria */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={despCategoria}
                    onChange={(e) => setDespCategoria(e.target.value as CategoriaDespesa)}
                    className="w-full bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                  >
                    <option value="transporte">Transporte (Uber / Combustível)</option>
                    <option value="alimentacao">Alimentação / Refeição</option>
                    <option value="estacionamento">Estacionamento</option>
                    <option value="insumos">Insumos / Pilhas / Produção</option>
                    <option value="outros">Outros Gastos</option>
                  </select>
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 48,50"
                    value={despValor}
                    onChange={(e) => setDespValor(e.target.value)}
                    className="w-full bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)] font-mono"
                    required
                  />
                </div>

                {/* Colaborador solicitante */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Colaborador *
                  </label>
                  <select
                    value={despEmployeeId}
                    onChange={(e) => setDespEmployeeId(e.target.value)}
                    className="w-full bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Descrição do Gasto *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Uber ida e volta da agência até o restaurante com iluminação"
                  value={despDescricao}
                  onChange={(e) => setDespDescricao(e.target.value)}
                  className="w-full bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                  required
                />
              </div>

              {/* Link / URL Comprovante */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Link do Comprovante / Cupom Fiscal (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... ou link do comprovante"
                  value={despComprovanteUrl}
                  onChange={(e) => setDespComprovanteUrl(e.target.value)}
                  className="w-full bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)] font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl brand-solid bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-foreground font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Despesa da Gravação
              </button>
            </form>

            {/* Lista de Despesas Lançadas */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-zinc-300">
                Despesas Registradas ({currentEventExpenses.length})
              </span>

              {currentEventExpenses.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] text-center text-xs text-zinc-400">
                  Nenhuma despesa lançada para esta gravação ainda.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {currentEventExpenses.map((d) => (
                    <div
                      key={d.id}
                      className="p-3 rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{d.descricao}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              d.status === 'reembolsado'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : d.status === 'aprovado'
                                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {d.status === 'reembolsado' ? 'Reembolsado' : d.status === 'aprovado' ? 'Aprovado' : 'Pendente'}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400">
                          {d.employee_nome} • {d.categoria.toUpperCase()} • {new Date(d.data).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-foreground text-sm block">
                          R$ {d.valor.toFixed(2)}
                        </span>
                        {d.comprovante_url && (
                          <a
                            href={d.comprovante_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#38bdf8] hover:underline"
                          >
                            Ver Comprovante
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 mt-2">
          {isEditing && userRole === 'admin' ? (
            <button
              type="button"
              onClick={() => {
                if (confirm('Deseja realmente excluir esta gravação?')) {
                  deleteEvent(editingEvent.id);
                }
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors p-2 rounded-xl hover:bg-red-500/10 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeEventModal}
              className="px-3.5 py-2 rounded-xl bg-[var(--ui-hover)] dark:bg-[var(--ui-hover)] bg-slate-100 hover:bg-[var(--ui-border)] text-xs font-medium text-zinc-300 dark:text-zinc-300 text-zinc-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            {activeTab === 'relatorio' ? (
              <button
                type="button"
                onClick={handleSaveFilmmakerReport}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#38bdf8] hover:bg-[#0284c7] text-black font-bold text-xs shadow-md shadow-[#38bdf8]/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Relatório</span>
              </button>
            ) : activeTab === 'despesas' ? (
              <button
                type="button"
                onClick={closeEventModal}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Concluir Despesas</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                className="px-4 py-2 rounded-xl brand-solid bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-foreground font-semibold text-xs shadow-md shadow-[var(--ui-accent)]/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                {isEditing ? 'Salvar alterações' : 'Criar gravação'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
