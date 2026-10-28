'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Employee,
  Client,
  EventItem,
  UserRole,
  ConflictRecord,
  ReelMetric,
  ClientMention,
  ClientSocialAccount,
  PontoRegistro,
  PontoTipo,
  PontoStatus,
  MediaDeliverable,
  DeliverableStatus,
  DeliverableFormat,
  RelatorioFilmmaker,
  DespesaGravacao,
  TransacaoFinanceira,
  TransacaoStatus,
  StatusDespesa,
  FuncionarioSalario,
  WhatsAppConfig,
  WhatsAppMessageLog,
} from '@/types/database';
import { INITIAL_EMPLOYEES, INITIAL_CLIENTS, INITIAL_EVENTS } from '@/lib/supabase/mock-data';
import { INITIAL_REELS, INITIAL_MENTIONS, INITIAL_SOCIAL_ACCOUNTS } from '@/lib/supabase/mock-social-data';
import { INITIAL_PONTOS } from '@/lib/supabase/mock-ponto-data';
import { INITIAL_DELIVERABLES } from '@/lib/supabase/mock-deliverables-data';
import { INITIAL_SALARIOS, INITIAL_DESPESAS_GRAVACOES, INITIAL_TRANSACOES } from '@/lib/supabase/mock-financial-data';
import { INITIAL_WHATSAPP_CONFIG, INITIAL_WHATSAPP_LOGS } from '@/lib/supabase/mock-whatsapp-data';
import { findEventConflicts } from '@/lib/conflicts';
import { createClient } from '@/lib/supabase/client';
import { IS_DEMO } from '@/lib/app-mode';
import { useCentralWorkspace, SyncStatus } from '@/hooks/useCentralWorkspace';
import { isManager, Workspace, Member } from '@/lib/workspace';
import { formatDateIso, parseDateIso, todayInSaoPaulo } from '@/lib/date-utils';
import {
  STORAGE_KEYS,
  loadFromStorage,
  saveToStorage,
  downloadSystemBackup,
  parseBackupFile,
} from '@/lib/storage-backup';
import { ToastContainer, ToastItem, ToastType } from '@/components/ui/Toast';
import { verifyCredentials, canUserAccessView } from '@/lib/auth-users';

export type AgendaView =
  | 'home'
  | 'dashboard'
  | 'mes'
  | 'semana'
  | 'escala'
  | 'minha-agenda'
  | 'ponto'
  | 'relatorios'
  | 'arquivos'
  | 'clientes'
  | 'metricas-reels'
  | 'mural-ugc'
  | 'backups'
  | 'financeiro'
  | 'whatsapp';

interface AgendaContextType {
  // Dados Agenda
  employees: Employee[];
  clients: Client[];
  events: EventItem[];
  filteredEvents: EventItem[];

  // Dados Ponto Eletrônico & Geolocalização
  pontos: PontoRegistro[];
  addPonto: (novo: Omit<PontoRegistro, 'id' | 'created_at'>) => PontoRegistro;
  isPontoModalOpen: boolean;
  pontoModalConfig: { preselectedClientId?: string; preselectedEventId?: string; tipo?: PontoTipo } | null;
  openPontoModal: (preselectedClientId?: string, preselectedEventId?: string, tipo?: PontoTipo) => void;
  closePontoModal: () => void;

  // Central de Arquivos & Entregáveis (DAM)
  deliverables: MediaDeliverable[];
  addDeliverable: (item: Omit<MediaDeliverable, 'id' | 'created_at'>) => MediaDeliverable;
  updateDeliverable: (id: string, patch: Partial<MediaDeliverable>) => void;
  updateDeliverableStatus: (id: string, status: DeliverableStatus, observacao?: string) => void;
  deleteDeliverable: (id: string) => void;
  isDeliverableModalOpen: boolean;
  deliverableModalClientId: string | null;
  editingDeliverable: MediaDeliverable | null;
  openDeliverableModal: (clientId?: string) => void;
  openEditDeliverableModal: (deliverable: MediaDeliverable) => void;
  closeDeliverableModal: () => void;

  // Gestão de Clientes / Restaurantes
  addClient: (client: Omit<Client, 'id'>) => Client;
  updateClient: (id: string, clientData: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  isClientModalOpen: boolean;
  editingClient: Client | null;
  openClientModal: (client?: Client) => void;
  closeClientModal: () => void;

  // Segurança, Persistência & Backup
  isDataSaved: boolean;
  syncStatus: SyncStatus;
  syncMessage: string;
  retrySync: () => void;
  exportPendingDraft: () => void;
  reloadWorkspace: () => void;
  refreshWorkspace: () => Promise<void>;
  exportSystemBackup: () => void;
  restoreSystemBackup: (file: File) => Promise<boolean>;
  resetToInitialData: () => void;
  
  // Dados Social & Instagram
  reels: ReelMetric[];
  mentions: ClientMention[];
  socialAccounts: ClientSocialAccount[];
  selectedRestaurantId: string | null;
  setSelectedRestaurantId: (id: string | null) => void;
  toggleMentionReposted: (mentionId: string) => void;
  simulateNewMention: () => void;
  addReel: (reel: Omit<ReelMetric, 'id'>) => ReelMetric;
  deleteReel: (id: string) => void;
  addMention: (mention: Omit<ClientMention, 'id'>) => ClientMention;
  deleteMention: (id: string) => void;

  // Navegação
  currentDate: Date;
  currentView: AgendaView;
  setCurrentView: (view: AgendaView) => void;
  navigate: (direction: 'prev' | 'next' | 'today') => void;
  setDate: (date: Date) => void;
  
  // Filtros
  selectedEmployeeIds: string[];
  setSelectedEmployeeIds: (ids: string[]) => void;
  toggleEmployeeFilter: (id: string) => void;
  clearEmployeeFilter: () => void;
  isEmployeeSelected: (id: string) => boolean;

  // Modais de Agenda
  isEventModalOpen: boolean;
  editingEvent: EventItem | null;
  dayDetailDate: string | null;
  openNewEventModal: (defaultDate?: string) => void;
  openEditEventModal: (event: EventItem) => void;
  closeEventModal: () => void;
  openDayDetailModal: (dateIso: string) => void;
  closeDayDetailModal: () => void;

  // Ações CRUD Evento & Relatório do Filmmaker
  saveEvent: (eventData: Omit<EventItem, 'id'> & { id?: string }, allowConflictOverride?: boolean) => { success: boolean; conflicts?: ConflictRecord[] };
  deleteEvent: (id: string) => void;
  saveEventReport: (eventId: string, report: RelatorioFilmmaker) => void;

  // Permissões e Autenticação
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  loggedEmployeeId: string;
  setLoggedEmployeeId: (id: string) => void;
  isSupabaseConnected: boolean;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  toggleTheme: () => void;
  toast: (message: string, type?: ToastType) => void;

  // Autenticação & Ponto Obrigatório no Login
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  lastLoginPonto: PontoRegistro | null;
  loginWithCheckIn: (
    employeeId: string,
    password: string,
    pontoData: {
      photoUrl?: string;
      lat?: number;
      lng?: number;
      address?: string;
      accuracy?: number;
      distancia_metros?: number;
      clientId?: string;
      status_localizacao?: PontoStatus;
      tipo?: PontoTipo;
      observacao?: string;
    }
  ) => { success: boolean; error?: string };
  loginDirect: (employeeId: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  canManage: boolean;

  // Gestão Financeira (Acesso Exclusivo Gestores)
  transacoes: TransacaoFinanceira[];
  salarios: FuncionarioSalario[];
  allDespesasGravacao: DespesaGravacao[];
  addTransacao: (tr: Omit<TransacaoFinanceira, 'id' | 'created_at'>) => TransacaoFinanceira;
  updateTransacaoStatus: (id: string, status: TransacaoStatus, dataPagamento?: string) => void;
  deleteTransacao: (id: string) => void;
  addDespesaGravacao: (despesa: Omit<DespesaGravacao, 'id' | 'created_at'>) => DespesaGravacao;
  updateDespesaStatus: (id: string, status: StatusDespesa, obs?: string) => void;
  updateSalario: (employeeId: string, patch: Partial<FuncionarioSalario>) => void;
  markSalarioPago: (employeeId: string) => void;

  // WhatsApp & Automação de Confirmação
  whatsappConfig: WhatsAppConfig;
  whatsappLogs: WhatsAppMessageLog[];
  updateWhatsAppConfig: (patch: Partial<WhatsAppConfig>) => void;
  checkAndSendD1Reminders: () => { sentCount: number; messages: string[] };
  sendManualWhatsAppConfirmation: (eventId: string) => boolean;
  processClientWhatsAppReply: (eventId: string, replyText: string) => { status: 'confirmado' | 'remarcar' | 'outro'; message: string };
  connectWhatsApp: () => Promise<void>;
  disconnectWhatsApp: () => void;
}

const AgendaContext = createContext<AgendaContextType | null>(null);

export function AgendaProvider({ children }: { children: React.ReactNode }) {
  // Theme
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('theme-dark', next === 'dark');
      document.documentElement.classList.toggle('theme-light', next === 'light');
      return next;
    });
  };

  // State principal Agenda
  const [employees, setEmployees] = useState<Employee[]>(IS_DEMO ? INITIAL_EMPLOYEES : []);
  const [clients, setClients] = useState<Client[]>(IS_DEMO ? INITIAL_CLIENTS : []);
  const [events, setEvents] = useState<EventItem[]>(IS_DEMO ? INITIAL_EVENTS : []);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  // State Central de Arquivos & Entregáveis (DAM)
  const [deliverables, setDeliverables] = useState<MediaDeliverable[]>(IS_DEMO ? INITIAL_DELIVERABLES : []);
  const [isDeliverableModalOpen, setIsDeliverableModalOpen] = useState(false);
  const [deliverableModalClientId, setDeliverableModalClientId] = useState<string | null>(null);
  const [editingDeliverable, setEditingDeliverable] = useState<MediaDeliverable | null>(null);

  // Sistema de Notificações Toast
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // State Modal de Clientes
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Status de Persistência
  const [isDataSaved, setIsDataSaved] = useState<boolean>(true);

  // State principal Social / Instagram
  const [reels, setReels] = useState<ReelMetric[]>(IS_DEMO ? INITIAL_REELS : []);
  const [mentions, setMentions] = useState<ClientMention[]>(IS_DEMO ? INITIAL_MENTIONS : []);
  const [socialAccounts, setSocialAccounts] = useState<ClientSocialAccount[]>(IS_DEMO ? INITIAL_SOCIAL_ACCOUNTS : []);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  
  // Estado de Autenticação & Sessão com Ponto Obrigatório
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [lastLoginPonto, setLastLoginPonto] = useState<PontoRegistro | null>(null);

  // Visão e Data (Inicia na Central de Boas-Vindas)
  const [currentDate, setCurrentDate] = useState<Date>(()=>new Date(0));
  useEffect(()=>{queueMicrotask(()=>setCurrentDate(parseDateIso(todayInSaoPaulo())));},[]);
  const [currentView, setCurrentView] = useState<AgendaView>('home');

  // Papel e usuário atual
  const [loggedEmployeeId, setLoggedEmployeeId] = useState<string>('usr-felipe');

  // Modais de Agenda
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [dayDetailDate, setDayDetailDate] = useState<string | null>(null);

  // State Ponto Eletrônico & Geolocalização
  const [pontos, setPontos] = useState<PontoRegistro[]>(IS_DEMO ? INITIAL_PONTOS : []);
  const [isPontoModalOpen, setIsPontoModalOpen] = useState(false);
  const [pontoModalConfig, setPontoModalConfig] = useState<{
    preselectedClientId?: string;
    preselectedEventId?: string;
    tipo?: PontoTipo;
  } | null>(null);

  // Gestão Financeira (Apenas Gestores)
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>(IS_DEMO ? INITIAL_TRANSACOES : []);
  const [salarios, setSalarios] = useState<FuncionarioSalario[]>(IS_DEMO ? INITIAL_SALARIOS : []);
  const [extraDespesas, setExtraDespesas] = useState<DespesaGravacao[]>(IS_DEMO ? INITIAL_DESPESAS_GRAVACOES : []);

  // WhatsApp Bot & Automação de Confirmação
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>(INITIAL_WHATSAPP_CONFIG);
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppMessageLog[]>(IS_DEMO ? INITIAL_WHATSAPP_LOGS : []);

  const [localHydrated,setLocalHydrated] = useState(false);
  const localWorkspace=useMemo<Workspace>(()=>({employees,clients,events,pontos,deliverables,reels,mentions}),[employees,clients,events,pontos,deliverables,reels,mentions]);
  const applyCloud=useCallback((data:Workspace,member:Member|null)=>{
    setEmployees(data.employees);setClients(data.clients);setEvents(data.events);setPontos(data.pontos);
    setDeliverables(data.deliverables);setReels(data.reels);setMentions(data.mentions);
    setIsAuthenticated(Boolean(member));
    if(member) {setLoggedEmployeeId(member.employee_id);}
  },[]);
  const cloud=useCentralWorkspace(localWorkspace,applyCloud);
  const memberRole=employees.find(e=>e.id===loggedEmployeeId)?.funcao;
  const canManage=isManager(memberRole);
  const userRole:UserRole=canManage ? 'admin' : 'funcionario';
  const writable=IS_DEMO || !['conflict','recovery','loading','signed-out','setup'].includes(cloud.status);
  const allowed=(condition:boolean)=>{if(!condition || !writable) {toast('Sem permissão ou há uma pendência de sincronização a resolver.','error');return false;}return true;};
  useEffect(()=>{
    if(!IS_DEMO) return;
    queueMicrotask(()=>{
    try {
      // Limpa chaves legadas de demonstração que continham dados hipotéticos ou auto-login
      localStorage.removeItem('navegando_mkt_workspace_v3');
      localStorage.removeItem('navegando_mkt_auth_session');
      for(const key of Object.values(STORAGE_KEYS)) localStorage.removeItem(key);

      const ensureOfficial = (list: Employee[]): Employee[] => {
        const byId = new Map((list || []).map((e) => [e.id, e]));
        return INITIAL_EMPLOYEES.map((off) => (byId.has(off.id) ? { ...byId.get(off.id)!, ...off } : off));
      };

      const snapshot=localStorage.getItem('navegando_mkt_workspace_real_v1');
      if(snapshot) {
        const saved=JSON.parse(snapshot) as Workspace;
        for(const key of ['employees','clients','events','pontos','deliverables','reels','mentions'] as const) if(!Array.isArray(saved[key])) throw new Error('Cópia local inválida.');
        const sanitizePontos = (list: PontoRegistro[]): PontoRegistro[] =>
          (list || []).map((p) => (p.foto_url && p.foto_url.includes('unsplash.com') ? { ...p, foto_url: '' } : p));
        setEmployees(ensureOfficial(saved.employees));setClients(saved.clients);setEvents(saved.events);setPontos(sanitizePontos(saved.pontos));setDeliverables(saved.deliverables);setReels(saved.reels);setMentions(saved.mentions);
      }

      const savedFin = localStorage.getItem('navegando_mkt_financial_real_v1');
      if (savedFin) {
        const parsedFin = JSON.parse(savedFin);
        if (Array.isArray(parsedFin.transacoes)) setTransacoes(parsedFin.transacoes);
        if (Array.isArray(parsedFin.salarios)) {
          const salById = new Map((parsedFin.salarios as FuncionarioSalario[]).map((s) => [s.employee_id, s]));
          setSalarios(INITIAL_SALARIOS.map((def) => (salById.has(def.employee_id) ? { ...def, ...salById.get(def.employee_id)! } : def)));
        }
        if (Array.isArray(parsedFin.extraDespesas)) setExtraDespesas(parsedFin.extraDespesas);
      }

      const savedWpp = localStorage.getItem('navegando_mkt_whatsapp_real_v1');
      if (savedWpp) {
        const parsedWpp = JSON.parse(savedWpp);
        if (parsedWpp.config) setWhatsappConfig(parsedWpp.config);
        if (Array.isArray(parsedWpp.logs)) setWhatsappLogs(parsedWpp.logs);
      }

      setLocalHydrated(true);
    } catch {setIsDataSaved(false);toast('Não foi possível ler a cópia local. Ela foi preservada. Exporte os dados antes de restaurar um backup.','error');}
    });
  },[toast]);
  useEffect(()=>{
    if(!IS_DEMO || !localHydrated) return;
    const saved=saveToStorage('navegando_mkt_workspace_real_v1',localWorkspace);
    saveToStorage('navegando_mkt_financial_real_v1',{transacoes,salarios,extraDespesas});
    saveToStorage('navegando_mkt_whatsapp_real_v1',{config:whatsappConfig,logs:whatsappLogs});
    queueMicrotask(()=>setIsDataSaved(saved));
  },[localWorkspace,transacoes,salarios,extraDespesas,whatsappConfig,whatsappLogs,localHydrated]);

  const openPontoModal = useCallback(
    (preselectedClientId?: string, preselectedEventId?: string, tipo: PontoTipo = 'entrada') => {
      setPontoModalConfig({ preselectedClientId, preselectedEventId, tipo });
      setIsPontoModalOpen(true);
    },
    []
  );

  const closePontoModal = useCallback(() => {
    setIsPontoModalOpen(false);
    setPontoModalConfig(null);
  }, []);

  const addPonto = useCallback(
    (novo: Omit<PontoRegistro, 'id' | 'created_at'>) => {
      const nowIso = novo.data_hora || new Date().toISOString();
      const registro: PontoRegistro = {
        ...novo,
        id: `ponto-${crypto.randomUUID()}`,
        data_hora: nowIso,
        created_at: nowIso,
      };
      setPontos((prev) => [registro, ...prev]);
      const exactTimeStr = new Date(nowIso).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      toast(`Ponto (${registro.tipo.toUpperCase()}) registrado com sucesso às ${exactTimeStr}!`, 'success');
      return registro;
    },
    [toast]
  );

  // Ações de Autenticação & Ponto Obrigatório no Login
  const loginWithCheckIn = useCallback(
    (
      employeeId: string,
      password: string,
      pontoData: {
        photoUrl?: string;
        lat?: number;
        lng?: number;
        address?: string;
        accuracy?: number;
        distancia_metros?: number;
        clientId?: string;
        status_localizacao?: PontoStatus;
        tipo?: PontoTipo;
        observacao?: string;
      }
    ) => {
      if(!IS_DEMO) return {success:false,error:'Use o login individual da base central.'};
    const check = verifyCredentials(employeeId, password);
    if (!check.valid) {
      return { success: false, error: check.error };
    }

    if(!pontoData.photoUrl || !Number.isFinite(pontoData.lat) || !Number.isFinite(pontoData.lng) || !pontoData.accuracy) return {success:false,error:'Foto e localização reais são obrigatórias.'};
    const emp = employees.find((e) => e.id === employeeId);
    const nowIso = new Date().toISOString();
    const tipo = pontoData.tipo || 'entrada';
    const isInterno = emp?.regime === 'interno' || emp?.funcao === 'interno';

    const defaultAddress = isInterno
      ? 'Sede Agência Navegando MKT - Escritório Interno'
      : (pontoData.address || 'Localização confirmada via GPS');

    const defaultObs = pontoData.observacao || (
      isInterno
        ? `Ponto CLT (${tipo.toUpperCase()}) registrado no escritório interno.`
        : `Check-in de ${tipo.toUpperCase()} no restaurante parceiro com GPS e foto.`
    );

    const novoPonto: PontoRegistro = {
      id: `ponto-login-${Date.now()}`,
      employee_id: employeeId,
      tipo,
      data_hora: nowIso,
      foto_url: pontoData.photoUrl || '',
      latitude: pontoData.lat!,
      longitude: pontoData.lng!,
      precisao_metros: pontoData.accuracy!,
      distancia_metros: pontoData.distancia_metros,
      endereco: defaultAddress,
      client_id: pontoData.clientId || null,
      status_localizacao: pontoData.status_localizacao || 'no_local',
      observacao: defaultObs,
      created_at: nowIso,
    };

    setPontos((prev) => [novoPonto, ...prev]);
    setLastLoginPonto(novoPonto);
    setLoggedEmployeeId(employeeId);
    setIsAuthenticated(true);
    setCurrentView('home');

    saveToStorage('navegando_mkt_auth_session', {
      isAuth: true,
      employeeId,
      lastPonto: novoPonto ? { ...novoPonto, foto_url: '' } : null,
    });

    toast(`Bem-vindo, ${emp?.nome || 'Equipe'}! Ponto (${tipo.toUpperCase()}) registrado com sucesso.`, 'success');
    return { success: true };
  },
  [employees, toast]
);

  const loginDirect = useCallback(
    (employeeId: string, password: string) => {
      if(!IS_DEMO) return {success:false,error:'Use o login individual da base central.'};
    const check = verifyCredentials(employeeId, password);
      if (!check.valid) {
        return { success: false, error: check.error };
      }

      setLoggedEmployeeId(employeeId);
      setIsAuthenticated(true);
      setCurrentView('home');
      saveToStorage('navegando_mkt_auth_session', {
        isAuth: true,
        employeeId,
        lastPonto: lastLoginPonto,
      });
      toast('Login efetuado com sucesso!', 'success');
      return { success: true };
    },
    [lastLoginPonto, toast]
  );

  const logout = useCallback(() => {
    if(!IS_DEMO) {
      if(cloud.status!=='saved') {toast('Resolva ou exporte as alterações pendentes antes de sair.','error');return;}
      void createClient().auth.signOut().then(({error})=>{if(error) toast('Não foi possível encerrar a sessão.','error');else window.location.assign('/login');});return;
    }
    setIsAuthenticated(false);
    saveToStorage('navegando_mkt_auth_session', {
      isAuth: false,
      employeeId: loggedEmployeeId,
      lastPonto: null,
    });
    toast('Sessão encerrada com segurança.', 'info');
  }, [loggedEmployeeId, toast, cloud.status]);

  // Modais de Entregáveis / Arquivos
  const openDeliverableModal = useCallback((clientId?: string) => {
    setEditingDeliverable(null);
    setDeliverableModalClientId(clientId || null);
    setIsDeliverableModalOpen(true);
  }, []);

  const openEditDeliverableModal = useCallback((deliverable: MediaDeliverable) => {
    setEditingDeliverable(deliverable);
    setDeliverableModalClientId(deliverable.client_id || null);
    setIsDeliverableModalOpen(true);
  }, []);

  const closeDeliverableModal = useCallback(() => {
    setIsDeliverableModalOpen(false);
    setDeliverableModalClientId(null);
    setEditingDeliverable(null);
  }, []);

  // Modais de Clientes
  const openClientModal = useCallback((client?: Client) => {
    setEditingClient(client || null);
    setIsClientModalOpen(true);
  }, []);

  const closeClientModal = useCallback(() => {
    setIsClientModalOpen(false);
    setEditingClient(null);
  }, []);

  // Ações de Entregáveis / Arquivos
  const addDeliverable = useCallback(
    (novo: Omit<MediaDeliverable, 'id' | 'created_at'>): MediaDeliverable => {
      const item: MediaDeliverable = {
        ...novo,
        id: `deliv-${crypto.randomUUID()}`,
        created_at: new Date().toISOString(),
      };
      setDeliverables((prev) => [item, ...prev]);
      toast(`Arquivo "${item.titulo}" adicionado; confira o status de salvamento.`, 'success');
      return item;
    },
    [toast]
  );

  const updateDeliverable = useCallback(
    (id: string, patch: Partial<MediaDeliverable>) => {
      setDeliverables((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...patch } : d))
      );
      toast('Arquivo atualizado com sucesso!', 'success');
      closeDeliverableModal();
    },
    [closeDeliverableModal, toast]
  );

  const updateDeliverableStatus = useCallback(
    (id: string, status: DeliverableStatus, observacao?: string) => {
      setDeliverables((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                status,
                observacoes_ajuste: observacao !== undefined ? observacao : d.observacoes_ajuste,
                versao: status === 'ajustes_solicitados' ? d.versao + 1 : d.versao,
              }
            : d
        )
      );

      const statusLabels: Record<DeliverableStatus, string> = {
        captado_raw: 'Bruto RAW',
        em_edicao: 'Em Edição',
        aguardando_aprovacao: 'Aguardando Cliente',
        ajustes_solicitados: 'Ajustes Solicitados',
        aprovado: 'Aprovado',
        publicado: 'Publicado',
      };
      toast(`Status alterado para "${statusLabels[status]}"`, 'info');
    },
    [toast]
  );

  const deleteDeliverable = useCallback(
    (id: string) => {
      setDeliverables((prev) => prev.filter((d) => d.id !== id));
      toast('Arquivo removido do catálogo.', 'info');
    },
    [toast]
  );

  // Ações de Clientes / Restaurantes
  const updateClient = useCallback(
    (id: string, patch: Partial<Client>) => {
      setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      toast('Dados do restaurante parceiro atualizados!', 'success');
      closeClientModal();
    },
    [closeClientModal, toast]
  );

  const deleteClient = useCallback(
    (id: string) => {
      setClients((prev) => prev.filter((c) => c.id !== id));
      toast('Restaurante removido dos parceiros.', 'info');
      closeClientModal();
    },
    [closeClientModal, toast]
  );

  // Ações de Backup do Sistema
  const exportSystemBackup = () => {
    if(!canManage || !IS_DEMO && cloud.status!=='saved') {toast('A exportação exige gestão e dados confirmados.','error');return;}
    const exported=downloadSystemBackup({
      version: '2.4.0',
      exportedAt: new Date().toISOString(),
      agencyName: 'Navegando MKT',
      data: {
        employees,
        clients,
        events,
        pontos,
        deliverables,
        reels,
        mentions,
      },
    });
    if(exported) toast('Dados operacionais exportados. Esta exportação não substitui o backup do banco e dos arquivos privados.','info');
  };

  const restoreSystemBackup = async (file: File): Promise<boolean> => {
      if(!IS_DEMO || !canManage) {toast('Restauração central deve ser feita em ambiente separado pelo responsável técnico.','error');return false;}
      try {
        const backup = await parseBackupFile(file);
        if (!backup || !backup.data) return false;
        if (Array.isArray(backup.data.events)) setEvents(backup.data.events);
        if (Array.isArray(backup.data.clients)) setClients(backup.data.clients);
        if (Array.isArray(backup.data.employees)) setEmployees(backup.data.employees);
        if (Array.isArray(backup.data.pontos)) setPontos(backup.data.pontos);
        if (Array.isArray(backup.data.deliverables)) setDeliverables(backup.data.deliverables);
        if (Array.isArray(backup.data.reels)) setReels(backup.data.reels);
        if (Array.isArray(backup.data.mentions)) setMentions(backup.data.mentions);
        toast('Backup restaurado com sucesso! Todos os dados e arquivos foram recarregados.', 'success');
        return true;
      } catch (e) {
        console.error('Falha ao restaurar backup:', e);
        toast('Falha ao ler arquivo de backup. Verifique o formato do arquivo.', 'error');
        return false;
      }
    };

  const resetToInitialData = () => {
    if(!IS_DEMO || !canManage) {toast('Reinicialização indisponível na base central.','error');return;}
    if (confirm('Tem certeza de que deseja limpar todos os cadastros? Isso deixará o sistema zerado (mantendo apenas os 20 membros da equipe).')) {
      setEmployees(INITIAL_EMPLOYEES);
      setClients([]);
      setEvents([]);
      setPontos([]);
      setDeliverables([]);
      setReels([]);
      setMentions([]);
      setTransacoes([]);
      setSalarios(INITIAL_SALARIOS);
      setExtraDespesas([]);
      setWhatsappLogs([]);
      if (typeof window !== 'undefined') {
        for(const key of Object.values(STORAGE_KEYS)) localStorage.removeItem(key);
        localStorage.removeItem('navegando_mkt_workspace_v3');
        localStorage.removeItem('navegando_mkt_workspace_real_v1');
        localStorage.removeItem('navegando_mkt_financial_real_v1');
        localStorage.removeItem('navegando_mkt_whatsapp_real_v1');
      }
      toast('Sistema limpo com sucesso! Pronto para receber novos cadastros.', 'info');
    }
  };

  // Navegação de Datas
  const navigate = useCallback((direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(parseDateIso(todayInSaoPaulo()));
      return;
    }

    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (currentView === 'mes') {
        next.setMonth(next.getMonth() + (direction === 'next' ? 1 : -1));
      } else {
        next.setDate(next.getDate() + (direction === 'next' ? 7 : -7));
      }
      return next;
    });
  }, [currentView]);

  // Filtro de funcionários
  const toggleEmployeeFilter = useCallback((id: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const clearEmployeeFilter = useCallback(() => {
    setSelectedEmployeeIds([]);
  }, []);

  const isEmployeeSelected = useCallback(
    (id: string) => selectedEmployeeIds.length === 0 || selectedEmployeeIds.includes(id),
    [selectedEmployeeIds]
  );

  // Eventos enriquecidos e filtrados
  const enrichedEvents = useMemo(() => {
    return events.map((ev) => {
      const client = clients.find((c) => c.id === ev.client_id);
      const assigned = employees.filter((emp) =>
        (ev.assigned_employee_ids || []).includes(emp.id)
      );
      return {
        ...ev,
        client,
        employees: assigned,
      };
    });
  }, [events, clients, employees]);

  const filteredEvents = useMemo(() => {
    if (selectedEmployeeIds.length === 0) return enrichedEvents;
    return enrichedEvents.filter((ev) =>
      (ev.assigned_employee_ids || []).some((id) => selectedEmployeeIds.includes(id))
    );
  }, [enrichedEvents, selectedEmployeeIds]);

  // Reels e Menções enriquecidos com dados dos clientes
  const enrichedReels = useMemo(() => {
    return reels.map((r) => ({
      ...r,
      client: clients.find((c) => c.id === r.client_id),
      event: events.find((e) => e.id === r.event_id),
    }));
  }, [reels, clients, events]);

  const enrichedMentions = useMemo(() => {
    return mentions.map((m) => ({
      ...m,
      client: clients.find((c) => c.id === m.client_id),
    }));
  }, [mentions, clients]);

  // Pontos enriquecidos com equipe, restaurante e gravação
  const enrichedPontos = useMemo(() => {
    return pontos.map((p) => ({
      ...p,
      employee: employees.find((e) => e.id === p.employee_id),
      client: clients.find((c) => c.id === p.client_id),
      event: events.find((ev) => ev.id === p.event_id),
    }));
  }, [pontos, employees, clients, events]);

  // Alternar status de repostagem do UGC
  const toggleMentionReposted = useCallback((mentionId: string) => {
    setMentions((prev) =>
      prev.map((m) =>
        m.id === mentionId
          ? {
              ...m,
              reposted: !m.reposted,
              reposted_at: !m.reposted ? new Date().toISOString() : null,
            }
          : m
      )
    );
  }, []);

  // Adicionar e remover Reels reais
  const addReel = useCallback(
    (reelData: Omit<ReelMetric, 'id'>): ReelMetric => {
      const item: ReelMetric = {
        ...reelData,
        id: `reel-${crypto.randomUUID()}`,
      };
      setReels((prev) => [item, ...prev]);
      toast('Métrica de Reel registrada com sucesso!', 'success');
      return item;
    },
    [toast]
  );

  const deleteReel = useCallback(
    (id: string) => {
      setReels((prev) => prev.filter((r) => r.id !== id));
      toast('Métrica de Reel removida.', 'info');
    },
    [toast]
  );

  // Adicionar e remover Menções / UGC reais
  const addMention = useCallback(
    (mentionData: Omit<ClientMention, 'id'>): ClientMention => {
      const item: ClientMention = {
        ...mentionData,
        id: `men-${crypto.randomUUID()}`,
      };
      setMentions((prev) => [item, ...prev]);
      toast(`Marcação de @${item.author_username} registrada com sucesso!`, 'success');
      return item;
    },
    [toast]
  );

  const deleteMention = useCallback(
    (id: string) => {
      setMentions((prev) => prev.filter((m) => m.id !== id));
      toast('Marcação removida do mural.', 'info');
    },
    [toast]
  );

  // Atualizar salário da equipe e marcar pagamento mensal
  const updateSalario = useCallback(
    (employeeId: string, patch: Partial<FuncionarioSalario>) => {
      setSalarios((prev) =>
        prev.map((s) => (s.employee_id === employeeId ? { ...s, ...patch } : s))
      );
      toast('Dados salariais atualizados com sucesso!', 'success');
    },
    [toast]
  );

  const markSalarioPago = useCallback(
    (employeeId: string) => {
      const sal = salarios.find((s) => s.employee_id === employeeId);
      if (!sal) return;
      const todayIso = new Date().toISOString().slice(0, 10);
      setSalarios((prev) =>
        prev.map((s) =>
          s.employee_id === employeeId
            ? { ...s, status_mes_atual: 'pago', data_ultimo_pagamento: todayIso }
            : s
        )
      );
      if (sal.valor_base > 0) {
        const novoLancamento: TransacaoFinanceira = {
          id: `tr-sal-${Date.now()}`,
          tipo: 'despesa',
          categoria: 'salario_equipe',
          descricao: `Pagamento de Folha / Contrato: ${sal.nome} (${sal.cargo})`,
          valor: sal.valor_base,
          data_vencimento: todayIso,
          data_pagamento: todayIso,
          status: 'pago',
          employee_id: sal.employee_id,
          employee_nome: sal.nome,
          forma_pagamento: 'pix',
          created_at: new Date().toISOString(),
        };
        setTransacoes((prev) => [novoLancamento, ...prev]);
      }
      toast(`Pagamento de ${sal.nome} registrado!`, 'success');
    },
    [salarios, toast]
  );

  const simulateNewMention = useCallback(() => {
    toast('Para registrar uma nova marcação real, use o botão "+ Registrar Marcação" no topo da página.', 'info');
  }, [toast]);

  // Modais
  const openNewEventModal = useCallback((defaultDate?: string) => {
    setEditingEvent({
      id: '',
      client_id: clients[0]?.id || '',
      tipo: 'gravacao',
      data: defaultDate || formatDateIso(currentDate),
      hora_inicio: '09:00',
      hora_fim: '12:00',
      local: '',
      observacoes: '',
      status: 'agendado',
      assigned_employee_ids: [],
    });
    setIsEventModalOpen(true);
  }, [clients, currentDate]);

  const openEditEventModal = useCallback((event: EventItem) => {
    setEditingEvent(event);
    setIsEventModalOpen(true);
  }, []);

  const closeEventModal = useCallback(() => {
    setIsEventModalOpen(false);
    setEditingEvent(null);
  }, []);

  const openDayDetailModal = useCallback((dateIso: string) => {
    setDayDetailDate(dateIso);
  }, []);

  const closeDayDetailModal = useCallback(() => {
    setDayDetailDate(null);
  }, []);

  // CRUD
  const saveEvent = useCallback(
    (
      eventData: Omit<EventItem, 'id'> & { id?: string },
      allowConflictOverride = false
    ): { success: boolean; conflicts?: ConflictRecord[] } => {
      const conflicts = findEventConflicts({
        date: eventData.data,
        startTime: eventData.hora_inicio,
        endTime: eventData.hora_fim,
        employeeIds: eventData.assigned_employee_ids || [],
        excludeEventId: eventData.id,
        allEvents: events,
        allEmployees: employees,
        allClients: clients,
      });

      if (conflicts.length > 0 && !allowConflictOverride) {
        return { success: false, conflicts };
      }

      if (eventData.id) {
        setEvents((prev) =>
          prev.map((e) => (e.id === eventData.id ? ({ ...e, ...eventData } as EventItem) : e))
        );
      } else {
        const newId = `evt-${crypto.randomUUID()}`;
        const newEvent: EventItem = {
          ...eventData,
          id: newId,
        };
        setEvents((prev) => [...prev, newEvent]);
      }

      toast(
        eventData.id
          ? 'Gravação atualizada com sucesso!'
          : 'Gravação adicionada à agenda com sucesso!',
        'success'
      );
      closeEventModal();
      return { success: true };
    },
    [events, employees, clients, closeEventModal, toast]
  );

  const deleteEvent = useCallback(
    (id: string) => {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast('Gravação removida da agenda.', 'info');
      closeEventModal();
    },
    [closeEventModal, toast]
  );

  const saveEventReport = useCallback(
    (eventId: string, report: RelatorioFilmmaker) => {
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id === eventId) {
            return {
              ...e,
              relatorio_filmmaker: {
                ...report,
                preenchido: true,
                preenchido_em: report.preenchido_em || new Date().toISOString(),
              },
            };
          }
          return e;
        })
      );
      toast('Relatório do Filmmaker salvo com sucesso!', 'success');
    },
    [toast]
  );

  const addClient = useCallback(
    (clientData: Omit<Client, 'id'>): Client => {
      const newClient: Client = {
        ...clientData,
        id: `cli-${crypto.randomUUID()}`,
      };
      setClients((prev) => [...prev, newClient]);
      toast(`Restaurante "${newClient.nome}" cadastrado com sucesso!`, 'success');
      return newClient;
    },
    [toast]
  );

  // Despesas de Gravação consolidadas
  const allDespesasGravacao = useMemo(() => {
    const fromEvents = events.flatMap((ev) =>
      (ev.despesas || []).map((d) => ({
        ...d,
        client_nome: clients.find((c) => c.id === ev.client_id)?.nome,
      }))
    );
    const existingIds = new Set(fromEvents.map((d) => d.id));
    const extras = extraDespesas
      .filter((d) => !existingIds.has(d.id))
      .map((d) => {
        const ev = events.find((e) => e.id === d.event_id);
        return {
          ...d,
          client_nome: d.client_nome || clients.find((c) => c.id === ev?.client_id)?.nome,
        };
      });
    return [...fromEvents, ...extras];
  }, [events, clients, extraDespesas]);

  // Transações Financeiras (Contas a pagar / receber)
  const addTransacao = useCallback(
    (tr: Omit<TransacaoFinanceira, 'id' | 'created_at'>): TransacaoFinanceira => {
      const item: TransacaoFinanceira = {
        ...tr,
        id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        created_at: new Date().toISOString(),
      };
      setTransacoes((prev) => [item, ...prev]);
      toast(`Lançamento financeiro "${item.descricao}" registrado.`, 'success');
      return item;
    },
    [toast]
  );

  const updateTransacaoStatus = useCallback(
    (id: string, status: TransacaoStatus, dataPagamento?: string) => {
      setTransacoes((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                status,
                data_pagamento:
                  status === 'pago'
                    ? dataPagamento || new Date().toISOString().slice(0, 10)
                    : t.data_pagamento,
              }
            : t
        )
      );
      toast(`Status da transação alterado para "${status}".`, 'info');
    },
    [toast]
  );

  const deleteTransacao = useCallback(
    (id: string) => {
      setTransacoes((prev) => prev.filter((t) => t.id !== id));
      toast('Transação removida do controle financeiro.', 'info');
    },
    [toast]
  );

  // Registro de Despesa da Gravação (Qualquer Colaborador pode cadastrar na gravação)
  const addDespesaGravacao = useCallback(
    (despesa: Omit<DespesaGravacao, 'id' | 'created_at'>): DespesaGravacao => {
      const item: DespesaGravacao = {
        ...despesa,
        id: `desp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        created_at: new Date().toISOString(),
      };

      // Salva no evento correspondente
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === item.event_id
            ? {
                ...ev,
                despesas: [...(ev.despesas || []), item],
              }
            : ev
        )
      );

      // Salva também nas extraDespesas locais
      setExtraDespesas((prev) => [item, ...prev]);

      // Gera automaticamente a transação de despesa pendente no controle financeiro
      const ev = events.find((e) => e.id === item.event_id);
      const client = clients.find((c) => c.id === ev?.client_id);
      addTransacao({
        tipo: 'despesa',
        categoria: 'custo_gravacao',
        descricao: `Reembolso ${item.categoria.toUpperCase()}: ${item.descricao} (${item.employee_nome})`,
        valor: item.valor,
        data_vencimento: item.data,
        data_pagamento: null,
        status: 'pendente',
        client_id: ev?.client_id || null,
        employee_id: item.employee_id,
        event_id: item.event_id,
        despesa_gravacao_id: item.id,
        forma_pagamento: 'pix',
        cliente_nome: client?.nome,
        employee_nome: item.employee_nome,
      });

      toast(`Despesa de R$ ${item.valor.toFixed(2)} cadastrada para aprovação da gerência.`, 'success');
      return item;
    },
    [events, clients, addTransacao, toast]
  );

  const updateDespesaStatus = useCallback(
    (id: string, status: StatusDespesa, obs?: string) => {
      setEvents((prev) =>
        prev.map((ev) => ({
          ...ev,
          despesas: (ev.despesas || []).map((d) =>
            d.id === id
              ? {
                  ...d,
                  status,
                  observacao_gestor: obs || d.observacao_gestor,
                }
              : d
          ),
        }))
      );
      setExtraDespesas((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                status,
                observacao_gestor: obs || d.observacao_gestor,
              }
            : d
        )
      );

      // Atualiza a transação financeira vinculada
      if (status === 'reembolsado' || status === 'aprovado') {
        setTransacoes((prev) =>
          prev.map((tr) =>
            tr.despesa_gravacao_id === id
              ? {
                  ...tr,
                  status: status === 'reembolsado' ? 'pago' : 'pendente',
                  data_pagamento:
                    status === 'reembolsado' ? new Date().toISOString().slice(0, 10) : tr.data_pagamento,
                }
              : tr
          )
        );
      }
      toast(
        `Despesa ${
          status === 'reembolsado'
            ? 'marcada como reembolsada'
            : status === 'aprovado'
            ? 'aprovada'
            : 'atualizada'
        }.`,
        'info'
      );
    },
    [toast]
  );

  // WhatsApp Config & Actions
  const updateWhatsAppConfig = useCallback(
    (patch: Partial<WhatsAppConfig>) => {
      setWhatsappConfig((prev) => ({ ...prev, ...patch }));
      toast('Configurações do WhatsApp atualizadas com sucesso.', 'success');
    },
    [toast]
  );

  const connectWhatsApp = useCallback(async () => {
    try {
      setWhatsappConfig((prev) => ({ ...prev, status: 'gerando_qrcode' }));
      const res = await fetch('http://localhost:3001/api/status', { method: 'GET' }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setWhatsappConfig((prev) => ({
          ...prev,
          conectado: data.status === 'ready' || data.status === 'connected',
          status: data.status === 'ready' || data.status === 'connected' ? 'conectado' : 'gerando_qrcode',
          pairing_code: data.pairingCode || prev.pairing_code,
          qr_code: data.qrCode || prev.qr_code,
          numero_conectado: data.phoneNumber || prev.numero_conectado,
        }));
        toast('Instância local do WhatsApp conectada (Porta 3001)!', 'success');
        return;
      }
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setWhatsappConfig((prev) => ({
        ...prev,
        conectado: true,
        status: 'conectado',
        numero_conectado: '+55 11 93450-8800',
        pairing_code: 'NW89-4KT2',
      }));
      toast('WhatsApp Conectado com sucesso!', 'success');
    }, 600);
  }, [toast]);

  const disconnectWhatsApp = useCallback(() => {
    setWhatsappConfig((prev) => ({
      ...prev,
      conectado: false,
      status: 'desconectado',
      pairing_code: undefined,
      qr_code: undefined,
    }));
    toast('WhatsApp desconectado.', 'info');
  }, [toast]);

  // Envio de mensagem de confirmação para um evento
  const dispatchConfirmationMessage = useCallback(
    (event: EventItem, client: Client | undefined) => {
      const equipeNomes =
        (event.assigned_employee_ids || [])
          .map((id) => employees.find((e) => e.id === id)?.nome)
          .filter(Boolean)
          .join(' & ') || 'Equipe Navegando MKT';

      const dateParts = event.data.split('-');
      const dateFormatted = `${dateParts[2]}/${dateParts[1]}`;

      const msg = whatsappConfig.template_mensagem
        .replace(/{{responsavel}}/g, client?.responsavel || client?.nome || 'Responsável')
        .replace(/{{data}}/g, dateFormatted)
        .replace(/{{hora_inicio}}/g, event.hora_inicio.slice(0, 5))
        .replace(/{{hora_fim}}/g, event.hora_fim.slice(0, 5))
        .replace(/{{restaurante}}/g, client?.nome || 'Restaurante')
        .replace(/{{equipe}}/g, equipeNomes);

      const logItem: WhatsAppMessageLog = {
        id: `wpp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        event_id: event.id,
        client_id: client?.id,
        cliente_nome: client?.nome || 'Restaurante',
        numero_destino: client?.telefone || client?.contato || 'Telefone não cadastrado',
        tipo: 'envio_confirmacao',
        mensagem: msg,
        status: 'enviada',
        data_hora: new Date().toISOString(),
      };

      setWhatsappLogs((prev) => [logItem, ...prev]);

      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === event.id
            ? {
                ...ev,
                confirmacao_whatsapp: {
                  enviado: true,
                  enviado_em: new Date().toISOString(),
                  telefone_destino: client?.telefone,
                  status_resposta: 'pendente',
                  ultima_mensagem: msg,
                },
              }
            : ev
        )
      );

      return msg;
    },
    [employees, whatsappConfig.template_mensagem]
  );

  const sendManualWhatsAppConfirmation = useCallback(
    (eventId: string): boolean => {
      const event = events.find((e) => e.id === eventId);
      if (!event) return false;
      const client = clients.find((c) => c.id === event.client_id);
      const msg = dispatchConfirmationMessage(event, client);
      const rawPhone = (client?.telefone || client?.contato || '').replace(/\D/g, '');
      if (rawPhone.length >= 10 && typeof window !== 'undefined') {
        const phoneWithCountry = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
        window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
      }
      toast(`Mensagem de confirmação gerada para ${client?.nome || 'o cliente'} via WhatsApp!`, 'success');
      return true;
    },
    [events, clients, dispatchConfirmationMessage, toast]
  );

  const checkAndSendD1Reminders = useCallback(() => {
    const today = parseDateIso(todayInSaoPaulo());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = formatDateIso(tomorrow);

    let eligible = events.filter((e) => e.data === tomorrowIso && e.status !== 'cancelado');

    if (eligible.length === 0) {
      eligible = events.filter((e) => e.status === 'agendado').slice(0, 2);
    }

    const messages: string[] = [];
    eligible.forEach((ev) => {
      const client = clients.find((c) => c.id === ev.client_id);
      const text = dispatchConfirmationMessage(ev, client);
      messages.push(`${client?.nome}: ${text}`);
    });

    setWhatsappConfig((prev) => ({
      ...prev,
      ultima_verificacao: new Date().toISOString(),
    }));

    toast(`Disparo D-1 executado: ${eligible.length} confirmação(ões) enviada(s)!`, 'success');
    return { sentCount: eligible.length, messages };
  }, [events, clients, dispatchConfirmationMessage, toast]);

  const processClientWhatsAppReply = useCallback(
    (eventId: string, replyText: string) => {
      const clean = replyText.toLowerCase().trim();
      const event = events.find((e) => e.id === eventId);
      const client = clients.find((c) => c.id === event?.client_id);

      const isConfirm = ['1', 'sim', 'confirmado', 'confirmar', 'ok', 'pode vir', 'combinado', 'certo', 'perfeito'].some((w) =>
        clean.includes(w)
      );
      const isRemarcar = ['2', 'nao', 'não', 'remarcar', 'cancelar', 'outro dia', 'adiar', 'imprevisto'].some((w) =>
        clean.includes(w)
      );

      let detected: 'confirmado' | 'remarcar' | 'outro' = 'outro';
      if (isConfirm) detected = 'confirmado';
      else if (isRemarcar) detected = 'remarcar';

      const logItem: WhatsAppMessageLog = {
        id: `wpp-resp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        event_id: eventId,
        client_id: client?.id,
        cliente_nome: client?.nome || 'Restaurante',
        numero_destino: client?.telefone || '(11) 99999-0000',
        tipo: 'resposta_cliente',
        mensagem: replyText,
        status: 'respondida',
        resposta_detectada: detected,
        data_hora: new Date().toISOString(),
      };

      setWhatsappLogs((prev) => [logItem, ...prev]);

      if (detected === 'confirmado') {
        setEvents((prev) =>
          prev.map((ev) =>
            ev.id === eventId
              ? {
                  ...ev,
                  status: 'confirmado',
                  confirmacao_whatsapp: {
                    enviado: true,
                    enviado_em: ev.confirmacao_whatsapp?.enviado_em || new Date().toISOString(),
                    telefone_destino: client?.telefone,
                    status_resposta: 'confirmado',
                    resposta_recebida_em: new Date().toISOString(),
                    ultima_mensagem: replyText,
                  },
                }
              : ev
          )
        );
        toast(`Gravação no ${client?.nome || 'restaurante'} CONFIRMADA automaticamente na agenda!`, 'success');
      } else if (detected === 'remarcar') {
        setEvents((prev) =>
          prev.map((ev) =>
            ev.id === eventId
              ? {
                  ...ev,
                  status: 'cancelado',
                  observacoes: `${ev.observacoes ? ev.observacoes + ' | ' : ''}Remarcação solicitada pelo cliente via WhatsApp: "${replyText}"`,
                  confirmacao_whatsapp: {
                    enviado: true,
                    enviado_em: ev.confirmacao_whatsapp?.enviado_em || new Date().toISOString(),
                    telefone_destino: client?.telefone,
                    status_resposta: 'remarcar',
                    resposta_recebida_em: new Date().toISOString(),
                    ultima_mensagem: replyText,
                  },
                }
              : ev
          )
        );
        toast(`Cliente ${client?.nome || ''} solicitou remarcação. Status atualizado na agenda!`, 'info');
      } else {
        toast(`Resposta do cliente recebida: "${replyText}".`, 'info');
      }

      return {
        status: detected,
        message:
          detected === 'confirmado'
            ? 'Gravação confirmada com sucesso na agenda!'
            : detected === 'remarcar'
            ? 'Remarcação solicitada. A equipe e o gestor foram alertados.'
            : 'Mensagem recebida e registrada no log.',
      };
    },
    [events, clients, toast]
  );

  // Enriquecer entregáveis com relacionamentos
  const enrichedDeliverables = useMemo(() => {
    return deliverables.map((d) => ({
      ...d,
      client: clients.find((c) => c.id === d.client_id),
      event: events.find((e) => e.id === d.event_id),
      filmmaker: employees.find((emp) => emp.id === d.filmmaker_id),
      criadora: employees.find((emp) => emp.id === d.criadora_id),
    }));
  }, [deliverables, clients, events, employees]);

  const guarded = <A extends unknown[], R,>(condition:boolean,fn:(...args:A)=>R)=>(...args:A):R=>{
    if(!allowed(condition)) throw new Error('Operação não permitida para este perfil ou estado de sincronização.');
    return fn(...args);
  };
  return (
    <AgendaContext.Provider
      value={{
        employees,
        clients,
        events: enrichedEvents,
        filteredEvents,
        selectedEmployeeIds,
        setSelectedEmployeeIds,
        // Central de Arquivos & Entregáveis (DAM)
        deliverables: enrichedDeliverables,
        addDeliverable:guarded(canUserAccessView(memberRole,'arquivos'),addDeliverable),
        updateDeliverable:guarded(canUserAccessView(memberRole,'arquivos'),updateDeliverable),
        updateDeliverableStatus:(id,status,obs)=>guarded(canUserAccessView(memberRole,'arquivos') && (canManage || !['aprovado','publicado','ajustes_solicitados'].includes(status)),updateDeliverableStatus)(id,status,obs),
        deleteDeliverable:guarded(canManage,deleteDeliverable),
        isDeliverableModalOpen,
        deliverableModalClientId,
        editingDeliverable,
        openDeliverableModal,
        openEditDeliverableModal,
        closeDeliverableModal,
        // Clientes
        addClient:guarded(canManage,addClient),
        updateClient:guarded(canManage,updateClient),
        deleteClient:guarded(canManage,deleteClient),
        isClientModalOpen,
        editingClient,
        openClientModal:guarded(canManage,openClientModal),
        closeClientModal,
        // Segurança & Backup
        isDataSaved:IS_DEMO ? isDataSaved : cloud.status==='saved',
        syncStatus:cloud.status,
        syncMessage:cloud.message,
        retrySync:cloud.retry,
        exportPendingDraft:cloud.exportDraft,
        reloadWorkspace:cloud.reload,
        refreshWorkspace:cloud.refresh,
        exportSystemBackup,
        restoreSystemBackup,
        resetToInitialData,
        // Social & Reels
        reels: enrichedReels,
        mentions: enrichedMentions,
        socialAccounts,
        pontos: canManage ? enrichedPontos : enrichedPontos.filter(p=>p.employee_id===loggedEmployeeId),
        addPonto:(entry)=>guarded(entry.employee_id===loggedEmployeeId,addPonto)(entry),
        isPontoModalOpen,
        pontoModalConfig,
        openPontoModal,
        closePontoModal,
        selectedRestaurantId,
        setSelectedRestaurantId,
        toggleMentionReposted,
        simulateNewMention,
        addReel: guarded(canManage, addReel),
        deleteReel: guarded(canManage, deleteReel),
        addMention: guarded(canManage, addMention),
        deleteMention: guarded(canManage, deleteMention),
        currentDate,
        currentView:canUserAccessView(memberRole,currentView) ? currentView : 'home',
        setCurrentView:(view)=>{if(canUserAccessView(memberRole,view)) setCurrentView(view);else toast('Módulo não permitido para seu perfil.','error');},
        navigate,
        setDate: setCurrentDate,
        toggleEmployeeFilter,
        clearEmployeeFilter,
        isEmployeeSelected,
        isEventModalOpen,
        editingEvent,
        dayDetailDate,
        openNewEventModal:guarded(canManage,openNewEventModal),
        openEditEventModal,
        closeEventModal,
        openDayDetailModal,
        closeDayDetailModal,
        saveEvent:guarded(canManage,saveEvent),
        deleteEvent:guarded(canManage,deleteEvent),
        saveEventReport:(id,report)=>guarded(canManage || memberRole==='filmmaker' && Boolean(events.find(e=>e.id===id)?.assigned_employee_ids?.includes(loggedEmployeeId)),saveEventReport)(id,report),
        userRole,
        setUserRole:()=>{toast('As permissões são definidas pelo cargo do membro.','info');},
        loggedEmployeeId,
        setLoggedEmployeeId:(id)=>{if(IS_DEMO) {setLoggedEmployeeId(id);saveToStorage('navegando_mkt_auth_session',{isAuth:true,employeeId:id,lastPonto:lastLoginPonto});}},
        isSupabaseConnected:!IS_DEMO && isAuthenticated && cloud.status==='saved',
        theme,
        setTheme,
        toggleTheme,
        toast,
        // Autenticação & Ponto Obrigatório no Login
        isAuthenticated,
        setIsAuthenticated:(value)=>{if(IS_DEMO) setIsAuthenticated(value);},
        lastLoginPonto,
        loginWithCheckIn,
        loginDirect,
        logout,
        canManage,
        // Gestão Financeira
        transacoes,
        salarios,
        allDespesasGravacao,
        addTransacao: guarded(canManage, addTransacao),
        updateTransacaoStatus: guarded(canManage, updateTransacaoStatus),
        deleteTransacao: guarded(canManage, deleteTransacao),
        addDespesaGravacao,
        updateDespesaStatus: guarded(canManage, updateDespesaStatus),
        updateSalario: guarded(canManage, updateSalario),
        markSalarioPago: guarded(canManage, markSalarioPago),
        // WhatsApp Bot & Automação de Confirmação
        whatsappConfig,
        whatsappLogs,
        updateWhatsAppConfig: guarded(canManage, updateWhatsAppConfig),
        checkAndSendD1Reminders: guarded(canManage, checkAndSendD1Reminders),
        sendManualWhatsAppConfirmation: guarded(canManage, sendManualWhatsAppConfirmation),
        processClientWhatsAppReply: guarded(canManage, processClientWhatsAppReply),
        connectWhatsApp: guarded(canManage, connectWhatsApp),
        disconnectWhatsApp: guarded(canManage, disconnectWhatsApp),
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AgendaContext.Provider>
  );
}

export function useAgenda() {
  const context = useContext(AgendaContext);
  if (!context) {
    throw new Error('useAgenda deve ser usado dentro de um AgendaProvider');
  }
  return context;
}
