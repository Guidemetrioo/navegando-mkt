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
} from '@/types/database';
import { INITIAL_EMPLOYEES, INITIAL_CLIENTS, INITIAL_EVENTS } from '@/lib/supabase/mock-data';
import { INITIAL_REELS, INITIAL_MENTIONS, INITIAL_SOCIAL_ACCOUNTS } from '@/lib/supabase/mock-social-data';
import { INITIAL_PONTOS } from '@/lib/supabase/mock-ponto-data';
import { INITIAL_DELIVERABLES } from '@/lib/supabase/mock-deliverables-data';
import { findEventConflicts } from '@/lib/conflicts';
import { createClient } from '@/lib/supabase/client';
import { formatDateIso } from '@/lib/date-utils';
import {
  STORAGE_KEYS,
  loadFromStorage,
  saveToStorage,
  downloadSystemBackup,
  parseBackupFile,
} from '@/lib/storage-backup';
import { ToastContainer, ToastItem, ToastType } from '@/components/ui/Toast';
import { verifyCredentials } from '@/lib/auth-users';

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
  | 'backups';

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
}

const AgendaContext = createContext<AgendaContextType | null>(null);

export function AgendaProvider({ children }: { children: React.ReactNode }) {
  // Theme
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = prefersDark ? 'dark' : 'light';
      setTheme(initial);
      document.documentElement.classList.toggle('theme-dark', initial === 'dark');
      document.documentElement.classList.toggle('theme-light', initial === 'light');
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('theme-dark', next === 'dark');
      document.documentElement.classList.toggle('theme-light', next === 'light');
      return next;
    });
  };

  // State principal Agenda
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  // State Central de Arquivos & Entregáveis (DAM)
  const [deliverables, setDeliverables] = useState<MediaDeliverable[]>(INITIAL_DELIVERABLES);
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
  const [reels, setReels] = useState<ReelMetric[]>(INITIAL_REELS);
  const [mentions, setMentions] = useState<ClientMention[]>(INITIAL_MENTIONS);
  const [socialAccounts, setSocialAccounts] = useState<ClientSocialAccount[]>(INITIAL_SOCIAL_ACCOUNTS);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  
  // Estado de Autenticação & Sessão com Ponto Obrigatório
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [lastLoginPonto, setLastLoginPonto] = useState<PontoRegistro | null>(null);

  // Visão e Data (Inicia na Central de Boas-Vindas)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 14, 12, 0, 0));
  const [currentView, setCurrentView] = useState<AgendaView>('home');

  // Papel e usuário atual
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [loggedEmployeeId, setLoggedEmployeeId] = useState<string>('emp-1');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);

  // Modais de Agenda
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [dayDetailDate, setDayDetailDate] = useState<string | null>(null);

  // State Ponto Eletrônico & Geolocalização
  const [pontos, setPontos] = useState<PontoRegistro[]>(INITIAL_PONTOS);
  const [isPontoModalOpen, setIsPontoModalOpen] = useState(false);
  const [pontoModalConfig, setPontoModalConfig] = useState<{
    preselectedClientId?: string;
    preselectedEventId?: string;
    tipo?: PontoTipo;
  } | null>(null);

  // 1. HIDRATAÇÃO RESILIENTE DO LOCALSTORAGE (Offline-First / Zero perda de dados)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedEvents = loadFromStorage<EventItem[]>(STORAGE_KEYS.EVENTS, []);
      if (savedEvents.length > 0) setEvents(savedEvents);

      const savedClients = loadFromStorage<Client[]>(STORAGE_KEYS.CLIENTS, []);
      if (savedClients.length > 0) setClients(savedClients);

      const savedEmployees = loadFromStorage<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
      if (savedEmployees.length > 0) setEmployees(savedEmployees);

      const savedPontos = loadFromStorage<PontoRegistro[]>(STORAGE_KEYS.PONTOS, []);
      if (savedPontos.length > 0) setPontos(savedPontos);

      const savedDeliverables = loadFromStorage<MediaDeliverable[]>(STORAGE_KEYS.DELIVERABLES, []);
      if (savedDeliverables.length > 0) setDeliverables(savedDeliverables);

      const savedReels = loadFromStorage<ReelMetric[]>(STORAGE_KEYS.REELS, []);
      if (savedReels.length > 0) setReels(savedReels);

      const savedMentions = loadFromStorage<ClientMention[]>(STORAGE_KEYS.MENTIONS, []);
      if (savedMentions.length > 0) setMentions(savedMentions);

      const savedAuth = loadFromStorage<{ isAuth: boolean; employeeId: string; lastPonto: PontoRegistro | null }>(
        'navegando_mkt_auth_session',
        { isAuth: false, employeeId: 'emp-1', lastPonto: null }
      );
      if (savedAuth && savedAuth.isAuth) {
        setIsAuthenticated(true);
        if (savedAuth.employeeId) setLoggedEmployeeId(savedAuth.employeeId);
        if (savedAuth.lastPonto) setLastLoginPonto(savedAuth.lastPonto);
      }
    } catch (e) {
      console.warn('[Storage] Falha na hidratação inicial:', e);
    }
  }, []);

  // 2. AUTO-SAVE CONTÍNUO (Qualquer alteração é salva instantaneamente no dispositivo)
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.EVENTS, events);
    saveToStorage(STORAGE_KEYS.CLIENTS, clients);
    saveToStorage(STORAGE_KEYS.EMPLOYEES, employees);
    saveToStorage(STORAGE_KEYS.PONTOS, pontos);
    saveToStorage(STORAGE_KEYS.DELIVERABLES, deliverables);
    saveToStorage(STORAGE_KEYS.REELS, reels);
    saveToStorage(STORAGE_KEYS.MENTIONS, mentions);
    setIsDataSaved(true);
  }, [events, clients, employees, pontos, deliverables, reels, mentions]);

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
      const registro: PontoRegistro = {
        ...novo,
        id: `ponto-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setPontos((prev) => [registro, ...prev]);
      toast('Ponto eletrônico registrado e validado via GPS!', 'success');
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
      const check = verifyCredentials(employeeId, password);
    if (!check.valid) {
      return { success: false, error: check.error };
    }

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
      foto_url: pontoData.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      latitude: pontoData.lat ?? -23.5505,
      longitude: pontoData.lng ?? -46.6333,
      precisao_metros: pontoData.accuracy ?? 8,
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
    setIsAuthenticated(false);
    saveToStorage('navegando_mkt_auth_session', {
      isAuth: false,
      employeeId: loggedEmployeeId,
      lastPonto: null,
    });
    toast('Sessão encerrada com segurança.', 'info');
  }, [loggedEmployeeId, toast]);

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
        id: `deliv-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setDeliverables((prev) => [item, ...prev]);
      toast(`Arquivo "${item.titulo}" adicionado e salvo com segurança!`, 'success');
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
        aprovado: 'Aprovado ✓',
        publicado: 'Publicado 🚀',
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
  const exportSystemBackup = useCallback(() => {
    downloadSystemBackup({
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
    toast('Backup completo exportado com sucesso! Guarde o arquivo com segurança.', 'success');
  }, [employees, clients, events, pontos, deliverables, reels, mentions, toast]);

  const restoreSystemBackup = useCallback(
    async (file: File): Promise<boolean> => {
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
    },
    [toast]
  );

  const resetToInitialData = useCallback(() => {
    if (confirm('Tem certeza de que deseja restaurar os dados de fábrica? Isso recarregará os restaurantes e escalas padrão.')) {
      setEmployees(INITIAL_EMPLOYEES);
      setClients(INITIAL_CLIENTS);
      setEvents(INITIAL_EVENTS);
      setPontos(INITIAL_PONTOS);
      setDeliverables(INITIAL_DELIVERABLES);
      setReels(INITIAL_REELS);
      setMentions(INITIAL_MENTIONS);
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
    }
  }, []);

  // Carregar dados reais do Supabase se configurado
  useEffect(() => {
    async function loadFromSupabase() {
      try {
        const supabase = createClient();
        const { data: emps, error: empErr } = await supabase.from('employees').select('*').order('nome');
        if (!empErr && emps && emps.length > 0) {
          setIsSupabaseConnected(true);
          setEmployees(emps);
        }

        const { data: clis, error: cliErr } = await supabase.from('clients').select('*').order('nome');
        if (!cliErr && clis && clis.length > 0) {
          setClients(clis);
        }

        const { data: evts, error: evtErr } = await supabase
          .from('events')
          .select('*, event_assignments(employee_id)');
        if (!evtErr && evts && evts.length > 0) {
          const formatted = evts.map((e: any) => ({
            ...e,
            assigned_employee_ids: e.event_assignments?.map((a: any) => a.employee_id) || [],
          }));
          setEvents(formatted);
        }

        // Carregar Reels e Menções do Supabase se existirem
        const { data: dbReels } = await supabase.from('reel_metrics').select('*');
        if (dbReels && dbReels.length > 0) setReels(dbReels);

        const { data: dbMentions } = await supabase.from('client_mentions').select('*');
        if (dbMentions && dbMentions.length > 0) setMentions(dbMentions);
      } catch (err) {
        setIsSupabaseConnected(false);
      }
    }

    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
    ) {
      loadFromSupabase();
    }
  }, []);

  // Navegação de Datas
  const navigate = useCallback((direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date(2026, 9, 14, 12, 0, 0));
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

  // Simular recebimento de nova menção em tempo real (Webhook simulation)
  const simulateNewMention = useCallback(() => {
    const randomInfluencer = Math.random() > 0.4;
    const client = clients[Math.floor(Math.random() * clients.length)] || clients[0];
    const handles = ['foodie.sp', 'dicasgastronomicas', 'paulistando.restaurantes', 'reviews_gastronomia', 'brunagourmet'];
    const chosenHandle = handles[Math.floor(Math.random() * handles.length)] + Math.floor(Math.random() * 99);

    const newMention: ClientMention = {
      id: `men-${Date.now()}`,
      client_id: client.id,
      author_username: chosenHandle,
      author_name: chosenHandle.replace('.', ' ').toUpperCase(),
      author_followers: randomInfluencer ? Math.floor(Math.random() * 80000 + 15000) : Math.floor(Math.random() * 3000 + 500),
      is_influencer: randomInfluencer,
      mention_type: Math.random() > 0.5 ? 'STORY_MENTION' : 'POST_TAG',
      media_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
      caption: `Experiência incrível hoje na ${client.nome}! Tudo impecável ❤️✨`,
      sentiment: randomInfluencer ? 'destaque_gourmet' : 'positivo',
      reposted: false,
      posted_at: new Date().toISOString(),
      client,
    };

    setMentions((prev) => [newMention, ...prev]);
  }, [clients]);

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
        const newId = `evt-${Date.now()}`;
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
        id: `cli-${Date.now()}`,
      };
      setClients((prev) => [...prev, newClient]);
      toast(`Restaurante "${newClient.nome}" cadastrado com sucesso!`, 'success');
      return newClient;
    },
    [toast]
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
        addDeliverable,
        updateDeliverable,
        updateDeliverableStatus,
        deleteDeliverable,
        isDeliverableModalOpen,
        deliverableModalClientId,
        editingDeliverable,
        openDeliverableModal,
        openEditDeliverableModal,
        closeDeliverableModal,
        // Clientes
        addClient,
        updateClient,
        deleteClient,
        isClientModalOpen,
        editingClient,
        openClientModal,
        closeClientModal,
        // Segurança & Backup
        isDataSaved,
        exportSystemBackup,
        restoreSystemBackup,
        resetToInitialData,
        // Social & Reels
        reels: enrichedReels,
        mentions: enrichedMentions,
        socialAccounts,
        pontos: enrichedPontos,
        addPonto,
        isPontoModalOpen,
        pontoModalConfig,
        openPontoModal,
        closePontoModal,
        selectedRestaurantId,
        setSelectedRestaurantId,
        toggleMentionReposted,
        simulateNewMention,
        currentDate,
        currentView,
        setCurrentView,
        navigate,
        setDate: setCurrentDate,
        toggleEmployeeFilter,
        clearEmployeeFilter,
        isEmployeeSelected,
        isEventModalOpen,
        editingEvent,
        dayDetailDate,
        openNewEventModal,
        openEditEventModal,
        closeEventModal,
        openDayDetailModal,
        closeDayDetailModal,
        saveEvent,
        deleteEvent,
        saveEventReport,
        userRole,
        setUserRole,
        loggedEmployeeId,
        setLoggedEmployeeId,
        isSupabaseConnected,
        theme,
        setTheme,
        toggleTheme,
        toast,
        // Autenticação & Ponto Obrigatório no Login
        isAuthenticated,
        setIsAuthenticated,
        lastLoginPonto,
        loginWithCheckIn,
        loginDirect,
        logout,
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
