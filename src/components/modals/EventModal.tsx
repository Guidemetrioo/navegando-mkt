'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { EventTipo, EventStatus, ConflictRecord, Client } from '@/types/database';
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
  Building,
  Video,
  Sparkles,
} from 'lucide-react';

export function EventModal() {
  const {
    isEventModalOpen,
    editingEvent,
    closeEventModal,
    saveEvent,
    deleteEvent,
    clients,
    employees,
    addClient,
    userRole,
  } = useAgenda();

  // Estados do formulário
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

  // Conflitos detectados
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Sincronizar ao abrir/mudar editingEvent
  useEffect(() => {
    if (editingEvent) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
      onClick={closeEventModal}
    >
      <div
        className="relative w-full max-w-lg bg-[#16171b] dark:bg-[#16171b] bg-white rounded-2xl border border-[#2b2d35] dark:border-[#2b2d35] border-slate-200 shadow-2xl p-6 flex flex-col gap-4 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-[#26282f] dark:border-[#26282f] border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-white dark:text-white text-zinc-900 font-heading">
              {isEditing ? 'Editar gravação' : 'Nova gravação'}
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-400 text-zinc-600 mt-0.5">
              Escalone a equipe e defina horário e local.
            </p>
          </div>

          <button
            type="button"
            onClick={closeEventModal}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#26282f] dark:hover:bg-[#26282f] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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

        {/* FORMULÁRIO */}
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
                className="w-full bg-[#1c1d22] dark:bg-[#1c1d22] bg-slate-50 border border-[#2b2d35] dark:border-[#2b2d35] border-slate-300 rounded-xl px-3 py-2 text-sm text-white dark:text-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#FF5A3C]"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {/* Dropdown de Autocomplete */}
            {isClientDropdownOpen && (
              <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-[#1c1d22] dark:bg-[#1c1d22] bg-white border border-[#2b2d35] dark:border-[#2b2d35] border-slate-300 rounded-xl shadow-xl divide-y divide-[#2b2d35] dark:divide-[#2b2d35] divide-slate-100">
                {filteredClients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectClient(c)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#26282f] dark:hover:bg-[#26282f] hover:bg-slate-100 flex flex-col cursor-pointer"
                  >
                    <span className="font-bold text-white dark:text-white text-zinc-900">
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
                  className="w-full text-left px-3 py-2 text-xs text-[#FF5A3C] hover:bg-[#FF5A3C]/10 flex items-center gap-1.5 font-semibold cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Cadastrar novo restaurante &quot;{clientSearch}&quot;</span>
                </button>
              </div>
            )}
          </div>

          {/* Form Embutido de Novo Cliente */}
          {showNewClientForm && (
            <div className="p-3 rounded-xl bg-[#202127] border border-[#FF5A3C]/30 flex flex-col gap-2 animate-in fade-in">
              <span className="text-xs font-bold text-[#FF5A3C] flex items-center gap-1">
                <Building className="w-3.5 h-3.5" />
                Novo Restaurante / Cliente
              </span>
              <input
                type="text"
                placeholder="Nome do Restaurante *"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full bg-[#16171b] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Contato / WhatsApp"
                  value={newClientContact}
                  onChange={(e) => setNewClientContact(e.target.value)}
                  className="w-full bg-[#16171b] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Bairro / Endereço"
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  className="w-full bg-[#16171b] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
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
                  className="px-3 py-1 bg-[#FF5A3C] hover:bg-[#e04a2f] text-white font-semibold text-xs rounded-lg"
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
                className="w-full bg-[#1c1d22] dark:bg-[#1c1d22] bg-slate-50 border border-[#2b2d35] dark:border-[#2b2d35] border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-white dark:text-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#FF5A3C]"
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
                className="w-full bg-[#1c1d22] dark:bg-[#1c1d22] bg-slate-50 border border-[#2b2d35] dark:border-[#2b2d35] border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-white dark:text-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#FF5A3C]"
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
                className="w-full bg-[#1c1d22] dark:bg-[#1c1d22] bg-slate-50 border border-[#2b2d35] dark:border-[#2b2d35] border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-white dark:text-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#FF5A3C]"
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
                      ? 'bg-[#FF5A3C] text-white border-[#FF5A3C] font-bold shadow-sm'
                      : 'bg-[#1c1d22] text-zinc-400 border-[#2b2d35] hover:text-white'
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
                className="w-full bg-[#1c1d22] dark:bg-[#1c1d22] bg-slate-50 border border-[#2b2d35] dark:border-[#2b2d35] border-slate-300 rounded-xl px-3 py-1.5 text-xs text-white dark:text-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#FF5A3C]"
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

            <div className="p-3 rounded-xl bg-[#1c1d22] dark:bg-[#1c1d22] bg-slate-50 border border-[#2b2d35] dark:border-[#2b2d35] border-slate-300 flex flex-col gap-3">
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
              <div className="border-t border-[#2b2d35] dark:border-[#2b2d35] border-slate-200" />

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
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#2b2d35]">
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
              className="w-full bg-[#1c1d22] dark:bg-[#1c1d22] bg-slate-50 border border-[#2b2d35] dark:border-[#2b2d35] border-slate-300 rounded-xl px-3 py-2 text-xs text-white dark:text-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#FF5A3C]"
            />
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-between pt-3 border-t border-[#26282f] dark:border-[#26282f] border-slate-200 mt-2">
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
              className="px-3.5 py-2 rounded-xl bg-[#22242b] dark:bg-[#22242b] bg-slate-100 hover:bg-[#2b2e38] text-xs font-medium text-zinc-300 dark:text-zinc-300 text-zinc-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 rounded-xl bg-[#FF5A3C] hover:bg-[#e04a2f] text-white font-semibold text-xs shadow-md shadow-[#FF5A3C]/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              {isEditing ? 'Salvar alterações' : 'Criar gravação'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
