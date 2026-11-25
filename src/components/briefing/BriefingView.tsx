'use client';
import { isFilmmaker } from '@/lib/team-functions';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { todayInSaoPaulo } from '@/lib/date-utils';
import { EventItem, EVENT_TYPE_LABELS, Employee } from '@/types/database';
import { EmployeeBadge } from '../agenda/EmployeeBadge';
import {
  ScheduleStatusCalendar,
  ViewStyleToggle,
} from '../agenda/ScheduleStatusCalendar';
import {
  formatWhatsAppBriefingDocument,
  buildWhatsAppBriefingShareUrl,
} from '@/lib/briefing-whatsapp';
import {
  buildBriefingDocumentData,
  exibirUrl,
  fmtDate,
  getBriefingPdfFileName,
  loadEventBriefingDrafts,
  normalizarUrl,
  parseItems,
  serializeDraftsToRaw,
  type BriefingCategoryMode,
  type EditableVideoDraft,
} from '@/lib/briefing-document';
import {
  BriefingDocumentPages,
  downloadBriefingBlob,
  generateBriefingPdfBlob,
} from './BriefingStandardDocument';
import {
  Share2,
  Download,
  Sparkles,
  CheckCircle2,
  Building,
  Calendar,
  Clock,
  Plus,
  FileText,
  AlertCircle,
  Search,
  ChevronRight,
  Save,
  Eye,
  Scissors,
  Video,
  Lock,
  Copy,
  Send,
  UserCheck,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';

export type {
  BriefingCategoryMode,
  BriefingRefItem,
  BriefingUrlPart,
  BriefingVideoItem,
  EditableVideoDraft,
} from '@/lib/briefing-document';
export {
  draftsFromRaw,
  exibirUrl,
  fmtDate,
  loadEventBriefingDrafts,
  normalizarUrl,
  parseItems,
  serializeDraftsToRaw,
} from '@/lib/briefing-document';

export function isVictorCordoba(employee?: Employee | null, loggedId?: string | null): boolean {
  if (loggedId === 'usr-vitinho') return true;
  if (!employee) return false;
  const nome = (employee.nome || '').toLowerCase();
  const user = (employee.username || '').toLowerCase();
  return (
    employee.id === 'usr-vitinho' ||
    user === 'vitinho' ||
    nome.includes('vitor cordoba') ||
    nome.includes('victor cordoba')
  );
}

export function isEventBriefingApproved(ev: Partial<EventItem>, mode: BriefingCategoryMode): boolean {
  if (mode === 'edicao') {
    if (ev.briefing_edicao_aprovado) return true;
    const vids = ev.briefing_edicao_videos || [];
    const filled = vids.filter((v) => v.roteiro?.trim() || v.titulo?.trim());
    return filled.length > 0 && filled.every((v) => Boolean(v.aprovado));
  }
  if (ev.briefing_aprovado) return true;
  const vids = ev.briefing_videos || [];
  const filled = vids.filter((v) => v.roteiro?.trim() || v.titulo?.trim());
  return filled.length > 0 && filled.every((v) => Boolean(v.aprovado));
}

export interface BriefingViewProps {
  initialMode?: BriefingCategoryMode;
}

function hasVideoBriefingDone(event: EventItem): boolean {
  return Boolean(event.briefing_gravacao && event.briefing_gravacao.trim().length > 0);
}

function hasEditingBriefingDone(event: EventItem): boolean {
  return Boolean(event.briefing_edicao && event.briefing_edicao.trim().length > 0);
}

function countVideoBriefingVideos(event: EventItem): number {
  if (event.briefing_videos?.length) return event.briefing_videos.length;
  if (!event.briefing_gravacao || !event.briefing_gravacao.trim()) return 0;
  return parseItems(event.briefing_gravacao).filter((i) => i.text.trim().length > 0).length;
}

function countEditingBriefingVideos(event: EventItem): number {
  if (event.briefing_edicao_videos?.length) return event.briefing_edicao_videos.length;
  if (!event.briefing_edicao || !event.briefing_edicao.trim()) return 0;
  return parseItems(event.briefing_edicao).filter((i) => i.text.trim().length > 0).length;
}

export function BriefingView({ initialMode }: BriefingViewProps = {}) {
  const {
    clients,
    events,
    employees,
    updateClient,
    saveEvent,
    openNewEventModal,
    toast,
    loggedEmployeeId,
    canManage,
  } = useAgenda();

  // Categoria ativa dentro de Briefing: 'video' (Briefing do Vídeo) ou 'edicao' (Briefing de Edição - Modelos)
  const [briefingMode, setBriefingMode] = useState<BriefingCategoryMode>(
    initialMode || 'video'
  );

  // Sincroniza caso um initialMode específico seja passado
  const [previousInitialMode, setPreviousInitialMode] = useState(initialMode);
  if (previousInitialMode !== initialMode) {
    setPreviousInitialMode(initialMode);
    if (initialMode) setBriefingMode(initialMode);
  }

  // Regras de permissão:
  // - Modelos podem editar APENAS o Briefing de Edição (no Briefing do Vídeo têm acesso somente leitura)
  // - Todos os outros membros podem alterar o Briefing dos Vídeos
  const currentMember = useMemo(
    () => employees.find((e) => e.id === loggedEmployeeId) || null,
    [employees, loggedEmployeeId]
  );
  const isModelMember = currentMember?.funcao === 'modelo' || currentMember?.funcao === 'criadora';
  const isReadOnly = briefingMode === 'video' ? isModelMember : false;
  const canApproveBriefing = useMemo(
    () => isVictorCordoba(currentMember, loggedEmployeeId),
    [currentMember, loggedEmployeeId]
  );

  // Modelos responsáveis pela edição dos vídeos
  const modelEmployees = useMemo(
    () => employees.filter((e) => e.funcao === 'modelo' || e.funcao === 'criadora'),
    [employees]
  );

  const resolveEventEditorModels = useCallback(
    (ev: EventItem): Employee[] => {
      const seen = new Set<string>();
      const list: Employee[] = [];
      const pushById = (id?: string | null) => {
        if (!id || seen.has(id)) return;
        const emp = modelEmployees.find((m) => m.id === id) || employees.find((e) => e.id === id);
        if (emp && (emp.funcao === 'modelo' || emp.funcao === 'criadora')) {
          seen.add(emp.id);
          list.push(emp);
        }
      };

      for (const id of ev.assigned_employee_ids || []) {
        pushById(id);
      }
      pushById(ev.modelo_editora_id);
      for (const vid of ev.briefing_edicao_videos || []) {
        pushById(vid.modeloEditoraId);
      }
      return list;
    },
    [employees, modelEmployees]
  );

  const resolveEventEditorModel = useCallback(
    (ev: EventItem): Employee | null => {
      const models = resolveEventEditorModels(ev);
      if (models.length > 0) return models[0];
      return modelEmployees[0] || null;
    },
    [resolveEventEditorModels, modelEmployees]
  );

  // Filtro de busca e status na tela de cards de compromissos
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendentes' | 'feitos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewStyle, setViewStyle] = useState<'cards' | 'agenda'>('cards');
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
  const [createComposerOpen, setCreateComposerOpen] = useState(false);
  const [composerEventId, setComposerEventId] = useState('');
  const [composerDrafts, setComposerDrafts] = useState<EditableVideoDraft[]>([]);
  const [composerModelId, setComposerModelId] = useState('');
  const [composerError, setComposerError] = useState('');
  const composerInputs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const focusComposerId = useRef<string | null>(null);

  // Compromisso selecionado ao clicar no card do restaurante
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [videoDrafts, setVideoDrafts] = useState<EditableVideoDraft[]>([]);
  const [videoQuantity, setVideoQuantity] = useState('1');
  const [selectedEditorModelId, setSelectedEditorModelId] = useState<string>('');
  const editorHeading = useRef<HTMLHeadingElement | null>(null);
  const videoInputs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const focusVideoId = useRef<string | null>(null);
  const [savedDrafts, setSavedDrafts] = useState('[]');

  useEffect(() => {
    if (focusVideoId.current) {
      const target = videoInputs.current[focusVideoId.current];
      target?.focus();
      target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      focusVideoId.current = null;
    }
  }, [videoDrafts]);

  useEffect(() => {
    if (focusComposerId.current) {
      const target = composerInputs.current[focusComposerId.current];
      target?.focus();
      target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      focusComposerId.current = null;
    }
  }, [composerDrafts]);

  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeEventId) return;
    const frame = requestAnimationFrame(() => {
      editorHeading.current?.focus();
      editorHeading.current?.scrollIntoView({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [activeEventId]);

  useEffect(() => {
    if (!activeEventId || isReadOnly || JSON.stringify(videoDrafts) === savedDrafts) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [activeEventId, videoDrafts, savedDrafts, isReadOnly]);

  // Funções dependentes do modo atual ('video' vs 'edicao')
  const isEventDoneForMode = useCallback(
    (ev: EventItem, mode: BriefingCategoryMode = briefingMode) =>
      mode === 'edicao' ? hasEditingBriefingDone(ev) : hasVideoBriefingDone(ev),
    [briefingMode]
  );

  const countEventVideosForMode = useCallback(
    (ev: EventItem, mode: BriefingCategoryMode = briefingMode) =>
      mode === 'edicao' ? countEditingBriefingVideos(ev) : countVideoBriefingVideos(ev),
    [briefingMode]
  );

  // Todos os compromissos de gravação / foto / edição dos restaurantes ordenados por data
  const recordingEvents = useMemo(() => {
    return [...events]
      .filter((ev) => ev.status !== 'cancelado' && (ev.tipo === 'gravacao' || ev.tipo === 'foto' || ev.tipo === 'edicao'))
      .sort((a, b) => {
        const cmp = a.data.localeCompare(b.data);
        if (cmp !== 0) return cmp;
        return a.hora_inicio.localeCompare(b.hora_inicio);
      });
  }, [events]);

  const counts = useMemo(() => {
    let feitos = 0;
    let pendentes = 0;
    for (const ev of recordingEvents) {
      if (isEventDoneForMode(ev)) feitos++;
      else pendentes++;
    }
    return { total: recordingEvents.length, feitos, pendentes };
  }, [recordingEvents, isEventDoneForMode]);

  // Estatísticas completas de Análise de Performance de Briefings para Gestores
  const managerPerformanceStats = useMemo(() => {
    let videoBriefingsDone = 0;
    let videoBriefingsPending = 0;
    let totalVideosPlanned = 0;
    let edicaoBriefingsDone = 0;
    let edicaoBriefingsPending = 0;
    let totalVideosEdicao = 0;

    for (const ev of recordingEvents) {
      if (hasVideoBriefingDone(ev)) {
        videoBriefingsDone++;
        totalVideosPlanned += countVideoBriefingVideos(ev);
      } else {
        videoBriefingsPending++;
      }

      if (hasEditingBriefingDone(ev)) {
        edicaoBriefingsDone++;
        totalVideosEdicao += countEditingBriefingVideos(ev);
      } else {
        edicaoBriefingsPending++;
      }
    }

    const totalCommitments = recordingEvents.length;
    const videoCompletionPct = totalCommitments
      ? Math.round((videoBriefingsDone / totalCommitments) * 100)
      : 0;
    const edicaoCompletionPct = totalCommitments
      ? Math.round((edicaoBriefingsDone / totalCommitments) * 100)
      : 0;

    // Performance por membro da equipe (Modelos e Filmmakers)
    const teamPerformance = employees
      .filter((emp) => emp.funcao === 'modelo' || emp.funcao === 'criadora' || isFilmmaker(emp))
      .map((emp) => {
        const memberEvents = recordingEvents.filter(
          (ev) =>
            (ev.assigned_employee_ids || []).includes(emp.id) ||
            ev.modelo_editora_id === emp.id ||
            resolveEventEditorModels(ev).some((m) => m.id === emp.id)
        );
        const videoDone = memberEvents.filter((ev) => hasVideoBriefingDone(ev)).length;
        const edicaoDone = memberEvents.filter((ev) => hasEditingBriefingDone(ev)).length;
        const videosCount = memberEvents.reduce(
          (sum, ev) => sum + countVideoBriefingVideos(ev) + countEditingBriefingVideos(ev),
          0
        );
        return {
          employee: emp,
          totalEvents: memberEvents.length,
          videoDone,
          videoPending: Math.max(0, memberEvents.length - videoDone),
          edicaoDone,
          edicaoPending: Math.max(0, memberEvents.length - edicaoDone),
          videosCount,
        };
      })
      .sort((a, b) => b.videoDone + b.edicaoDone - (a.videoDone + a.edicaoDone));

    return {
      totalCommitments,
      videoBriefingsDone,
      videoBriefingsPending,
      videoCompletionPct,
      totalVideosPlanned,
      edicaoBriefingsDone,
      edicaoBriefingsPending,
      edicaoCompletionPct,
      totalVideosEdicao,
      teamPerformance,
    };
  }, [recordingEvents, employees, resolveEventEditorModels]);

  const filteredEvents = useMemo(() => {
    return recordingEvents.filter((ev) => {
      const done = isEventDoneForMode(ev);
      if (statusFilter === 'pendentes' && done) return false;
      if (statusFilter === 'feitos' && !done) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const clientName = (ev.client?.nome || clients.find((c) => c.id === ev.client_id)?.nome || '').toLowerCase();
        const local = (ev.local || '').toLowerCase();
        const dateStr = fmtDate(ev.data).toLowerCase();
        const editorModel = resolveEventEditorModels(ev)
          .map((m) => m.nome)
          .join(' ')
          .toLowerCase();
        return clientName.includes(q) || local.includes(q) || dateStr.includes(q) || editorModel.includes(q);
      }
      return true;
    });
  }, [recordingEvents, statusFilter, searchQuery, clients, isEventDoneForMode, resolveEventEditorModels]);

  const restaurantEvents = useMemo(() => {
    const groups = new Map<string, EventItem[]>();
    for (const event of filteredEvents) groups.set(event.client_id, [...(groups.get(event.client_id) || []), event]);
    const today = todayInSaoPaulo();
    return [...groups.values()].map((group) => group.find((event) => event.data >= today) || group[group.length - 1]);
  }, [filteredEvents]);

  const activeEvent = useMemo(
    () => recordingEvents.find((e) => e.id === activeEventId) || null,
    [recordingEvents, activeEventId]
  );

  const activeClient = useMemo(() => {
    if (!activeEvent) return null;
    return activeEvent.client || clients.find((c) => c.id === activeEvent.client_id) || null;
  }, [activeEvent, clients]);

  // Carrega os drafts do evento conforme o modo ('video' ou 'edicao')
  const loadDraftsForEventAndMode = useCallback(
    (ev: EventItem, mode: BriefingCategoryMode) => {
      const drafts = loadEventBriefingDrafts(ev, mode);

      const defaultModel = resolveEventEditorModel(ev);
      setSelectedEditorModelId(ev.modelo_editora_id || defaultModel?.id || '');
      setVideoDrafts(drafts);
      setVideoQuantity(String(drafts.length));
      setSavedDrafts(JSON.stringify(drafts));
      setShowPdfPreview(false);
      setStatusMsg('');
    },
    [resolveEventEditorModel]
  );

  // Ao clicar no card de um compromisso de restaurante, abre o editor de vídeos
  const handleOpenEventBriefing = (ev: EventItem, targetMode: BriefingCategoryMode = briefingMode) => {
    if (targetMode !== briefingMode) {
      setBriefingMode(targetMode);
    }
    setActiveEventId(ev.id);
    loadDraftsForEventAndMode(ev, targetMode);
  };

  // Troca entre "Briefing do Vídeo" e "Briefing de Edição" mantendo o restaurante aberto se houver
  const handleSwitchMode = (nextMode: BriefingCategoryMode) => {
    if (nextMode === briefingMode) return;
    if (
      activeEvent &&
      !isReadOnly &&
      JSON.stringify(videoDrafts) !== savedDrafts &&
      !window.confirm('Existem alterações não salvas neste briefing. Deseja alternar de aba sem salvar?')
    ) {
      return;
    }
    setBriefingMode(nextMode);
    if (activeEvent) {
      loadDraftsForEventAndMode(activeEvent, nextMode);
    }
  };

  // Manipulação da lista de vídeos separados
  const createVideo = (): EditableVideoDraft => ({
    id: crypto.randomUUID(),
    titulo: '',
    formato: 'Automático',
    roteiro: '',
    refRotulo: 'Referência',
    refUrl: '',
    modeloEditoraId: selectedEditorModelId || undefined,
  });

  const handleAddAnotherVideo = () => {
    if (isReadOnly) return;
    const video = createVideo();
    setVideoDrafts((prev) => {
      const next = [...prev, video];
      setVideoQuantity(String(next.length));
      return next;
    });
    focusVideoId.current = video.id;
  };

  const advanceVideo = (index: number) => {
    if (isReadOnly) return;
    if (index + 1 < videoDrafts.length) {
      const target = videoInputs.current[videoDrafts[index + 1].id];
      target?.focus();
      target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      handleAddAnotherVideo();
    }
  };

  const applyQuantity = () => {
    if (isReadOnly) return;
    const quantity = Number(videoQuantity);
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      toast('Informe uma quantidade inteira maior que zero.', 'error');
      return;
    }
    if (
      quantity < videoDrafts.length &&
      videoDrafts
        .slice(quantity)
        .some((video) => video.titulo.trim() || video.roteiro.trim() || video.refUrl.trim() || video.refsExtras?.length)
    ) {
      toast('Há vídeos preenchidos nessa redução. Remova os cards desejados individualmente.', 'error');
      return;
    }
    setVideoDrafts((prev) =>
      quantity <= prev.length
        ? prev.slice(0, quantity)
        : [...prev, ...Array.from({ length: quantity - prev.length }, createVideo)]
    );
  };

  const leaveEditor = () => {
    if (
      !isReadOnly &&
      JSON.stringify(videoDrafts) !== savedDrafts &&
      !window.confirm('Existem alterações não salvas. Deseja sair sem salvar?')
    )
      return;
    setActiveEventId(null);
  };

  const handleUpdateVideoDraft = (id: string, patch: Partial<EditableVideoDraft>) => {
    if (isReadOnly) return;
    setVideoDrafts((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  const handleRemoveVideoDraft = (id: string) => {
    if (isReadOnly) return;
    setVideoDrafts((prev) => {
      if (prev.length <= 1) {
        return [
          {
            id: `video-1-${Date.now()}`,
            titulo: '',
            formato: 'Automático',
            roteiro: '',
            refRotulo: 'Referência',
            refUrl: '',
          },
        ];
      }
      return prev.filter((v) => v.id !== id);
    });
  };

  // Documento A4 consolidado do evento ativo (mesmo layout de BriefingStandardDocument)
  const serializedRawText = useMemo(() => serializeDraftsToRaw(videoDrafts), [videoDrafts]);
  const parsedPreviewItems = useMemo(() => parseItems(serializedRawText), [serializedRawText]);

  const handleSaveBriefing = () => {
    if (!activeEvent || isReadOnly) return;
    const raw = serializeDraftsToRaw(videoDrafts);

    for (const video of videoDrafts) {
      if (!video.refUrl.trim()) continue;
      try {
        const url = new URL(normalizarUrl(video.refUrl.trim()));
        if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
      } catch {
        toast('Confira o link de referência antes de salvar.', 'error');
        return;
      }
    }

    const mappedVideos = videoDrafts.map((video) => ({
      titulo: video.titulo,
      formato: video.formato,
      roteiro: video.roteiro,
      refRotulo: video.refRotulo,
      refUrl: video.refUrl,
      modeloEditoraId: selectedEditorModelId || video.modeloEditoraId,
      aprovado: video.aprovado,
      aprovadoPor: video.aprovadoPor,
      aprovadoEm: video.aprovadoEm,
      refsExtras: video.refsExtras,
    }));

    const filledVideos = mappedVideos.filter((v) => v.roteiro.trim() || v.titulo.trim());
    const allCardsApproved = filledVideos.length > 0 && filledVideos.every((v) => Boolean(v.aprovado));

    const updatedEvent: EventItem =
      briefingMode === 'edicao'
        ? {
            ...activeEvent,
            briefing_edicao_videos: mappedVideos,
            briefing_edicao: raw || null,
            briefing_edicao_aprovado: allCardsApproved || Boolean(activeEvent.briefing_edicao_aprovado),
            modelo_editora_id: selectedEditorModelId || activeEvent.modelo_editora_id || null,
          }
        : {
            ...activeEvent,
            briefing_videos: mappedVideos,
            briefing_gravacao: raw || null,
            briefing_aprovado: allCardsApproved || Boolean(activeEvent.briefing_aprovado),
          };

    const result = saveEvent(updatedEvent, true);

    if (!result?.success) {
      toast('Não foi possível salvar o briefing.', 'error');
      return;
    }
    setSavedDrafts(JSON.stringify(videoDrafts));
    if (canManage && briefingMode === 'video' && activeClient && raw) {
      updateClient(activeClient.id, {
        briefing_roteiros_modelos: raw,
      });
    }

    const qtd = videoDrafts.length;
    const labelTipo = briefingMode === 'edicao' ? 'Briefing de Edição' : 'Briefing do Vídeo';
    if (raw) {
      toast(`${labelTipo} salvo com ${qtd} ${qtd === 1 ? 'vídeo' : 'vídeos'} para ${activeClient?.nome || 'Restaurante'}!`);
      setStatusMsg(`${labelTipo} salvo com sucesso (${qtd} ${qtd === 1 ? 'vídeo' : 'vídeos'}). Status: Feito.`);
    } else {
      toast('Cards salvos. Preencha os briefings para concluir.', 'info');
      setStatusMsg(`${qtd} cards salvos. Briefings ainda pendentes.`);
    }
  };

  const openCreateBriefingComposer = (preferredEventId?: string) => {
    const defaultEv =
      (preferredEventId && recordingEvents.find((ev) => ev.id === preferredEventId)) ||
      recordingEvents.find((ev) => !isEventDoneForMode(ev)) ||
      recordingEvents[0];
    const firstCard = createVideo();
    setComposerEventId(defaultEv?.id || '');
    setComposerDrafts([firstCard]);
    focusComposerId.current = firstCard.id;
    setComposerModelId(defaultEv ? resolveEventEditorModel(defaultEv)?.id || '' : '');
    setComposerError('');
    setCreateComposerOpen(true);
  };

  const addComposerCard = () => {
    const nextCard = createVideo();
    setComposerDrafts((prev) => [...prev, nextCard]);
    focusComposerId.current = nextCard.id;
  };

  const advanceComposerCard = (index: number) => {
    if (index + 1 < composerDrafts.length) {
      const target = composerInputs.current[composerDrafts[index + 1].id];
      target?.focus();
      target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      addComposerCard();
    }
  };

  const updateComposerCard = (id: string, patch: Partial<EditableVideoDraft>) => {
    setComposerDrafts((prev) => prev.map((card) => (card.id === id ? { ...card, ...patch } : card)));
  };

  const removeComposerCard = (id: string) => {
    setComposerDrafts((prev) => (prev.length <= 1 ? prev : prev.filter((card) => card.id !== id)));
  };

  const handleSaveComposedBriefing = (e: React.FormEvent) => {
    e.preventDefault();
    setComposerError('');
    const targetEvent = recordingEvents.find((ev) => ev.id === composerEventId);
    if (!targetEvent) {
      setComposerError('Selecione uma gravação agendada para linkar este briefing.');
      return;
    }
    const chosenModelId =
      briefingMode === 'edicao'
        ? composerModelId || targetEvent.modelo_editora_id || undefined
        : undefined;
    const newFilledDrafts = composerDrafts
      .filter((v) => v.roteiro.trim() || v.titulo.trim() || v.refUrl.trim())
      .map((v) => ({
        ...v,
        titulo: v.titulo.trim(),
        roteiro: v.roteiro.trim(),
        refUrl: v.refUrl.trim(),
        modeloEditoraId: chosenModelId,
      }));
    if (newFilledDrafts.length === 0) {
      setComposerError('Escreva pelo menos um card de vídeo antes de salvar.');
      return;
    }

    const existingDrafts = loadEventBriefingDrafts(targetEvent, briefingMode).filter(
      (v) => v.titulo.trim() || v.roteiro.trim() || v.refUrl.trim() || (v.refsExtras && v.refsExtras.length > 0)
    );
    const combined = [...existingDrafts, ...newFilledDrafts];
    const mappedVideos = combined.map((video) => ({
      titulo: video.titulo,
      formato: video.formato,
      roteiro: video.roteiro,
      refRotulo: video.refRotulo,
      refUrl: video.refUrl,
      modeloEditoraId: chosenModelId || video.modeloEditoraId,
      aprovado: video.aprovado,
      aprovadoPor: video.aprovadoPor,
      aprovadoEm: video.aprovadoEm,
      refsExtras: video.refsExtras,
    }));
    const raw = serializeDraftsToRaw(combined);
    const updatedEvent: EventItem =
      briefingMode === 'edicao'
        ? {
            ...targetEvent,
            briefing_edicao_videos: mappedVideos,
            briefing_edicao: raw || null,
            modelo_editora_id: chosenModelId || targetEvent.modelo_editora_id || null,
          }
        : {
            ...targetEvent,
            briefing_videos: mappedVideos,
            briefing_gravacao: raw || null,
          };

    const result = saveEvent(updatedEvent, true);
    if (!result?.success) {
      setComposerError('Não foi possível salvar o briefing na agenda selecionada.');
      return;
    }

    const targetClient = clients.find((c) => c.id === targetEvent.client_id);
    if (canManage && briefingMode === 'video' && targetClient && raw) {
      updateClient(targetClient.id, { briefing_roteiros_modelos: raw });
    }

    setActiveEventId(targetEvent.id);
    setVideoDrafts(combined);
    setSavedDrafts(JSON.stringify(combined));
    setVideoQuantity(String(combined.length));
    if (chosenModelId) setSelectedEditorModelId(chosenModelId);
    setCreateComposerOpen(false);

    const labelTipo = briefingMode === 'edicao' ? 'Briefing de Edição' : 'Briefing de Vídeo';
    toast(
      `${labelTipo} (${newFilledDrafts.length} ${newFilledDrafts.length === 1 ? 'vídeo' : 'vídeos'}) criado e linkado a ${targetClient?.nome || 'Restaurante'}!`,
      'success'
    );
  };

  // Função exclusiva para Vitor Cordoba: Aprovar / Validar Briefing (muda a borda do card para azul)
  const handleToggleApproveEvent = (ev: EventItem, targetMode: BriefingCategoryMode = briefingMode) => {
    if (!canApproveBriefing) return;
    const currentlyApproved = isEventBriefingApproved(ev, targetMode);
    const nextApproved = !currentlyApproved;
    const nowIso = new Date().toISOString();

    const baseDrafts =
      activeEvent?.id === ev.id && targetMode === briefingMode
        ? videoDrafts
        : loadEventBriefingDrafts(ev, targetMode);

    const updatedDrafts = baseDrafts.map((v) => ({
      ...v,
      aprovado: nextApproved,
      aprovadoPor: nextApproved ? 'Vitor Cordoba' : undefined,
      aprovadoEm: nextApproved ? nowIso : undefined,
    }));

    const mappedVideos = updatedDrafts.map((video) => ({
      titulo: video.titulo,
      formato: video.formato || 'Automático',
      roteiro: video.roteiro,
      refRotulo: video.refRotulo,
      refUrl: video.refUrl,
      modeloEditoraId: selectedEditorModelId || video.modeloEditoraId,
      aprovado: video.aprovado,
      aprovadoPor: video.aprovadoPor,
      aprovadoEm: video.aprovadoEm,
      refsExtras: video.refsExtras,
    }));

    const raw = serializeDraftsToRaw(updatedDrafts);
    const updatedEvent: EventItem =
      targetMode === 'edicao'
        ? {
            ...ev,
            briefing_edicao_videos: mappedVideos,
            briefing_edicao: raw || ev.briefing_edicao || null,
            briefing_edicao_aprovado: nextApproved,
          }
        : {
            ...ev,
            briefing_videos: mappedVideos,
            briefing_gravacao: raw || ev.briefing_gravacao || null,
            briefing_aprovado: nextApproved,
            briefing_aprovado_por: nextApproved ? 'Vitor Cordoba' : null,
            briefing_aprovado_em: nextApproved ? nowIso : null,
          };

    const res = saveEvent(updatedEvent, true);
    if (res?.success) {
      if (activeEvent?.id === ev.id && targetMode === briefingMode) {
        setVideoDrafts(updatedDrafts);
        setSavedDrafts(JSON.stringify(updatedDrafts));
      }
      const clientName = (ev.client || clients.find((c) => c.id === ev.client_id))?.nome || 'Restaurante';
      toast(
        nextApproved
          ? `Briefing de ${clientName} APROVADO e VALIDADO por Vitor Cordoba!`
          : `Aprovação removida do briefing de ${clientName}.`
      );
      setStatusMsg(
        nextApproved
          ? 'Briefing validado por Vitor Cordoba! Card destacado com borda azul para toda a equipe.'
          : 'Validação removida.'
      );
    }
  };

  // Função exclusiva para Vitor Cordoba: Aprovar um card de vídeo individualmente
  const handleToggleApproveVideoCard = (videoId: string) => {
    if (!canApproveBriefing || !activeEvent) return;
    const nowIso = new Date().toISOString();
    const eventAlreadyAllApproved =
      briefingMode === 'edicao' ? Boolean(activeEvent.briefing_edicao_aprovado) : Boolean(activeEvent.briefing_aprovado);

    const updatedDrafts = videoDrafts.map((v) => {
      const currentCardApproved = Boolean(v.aprovado || eventAlreadyAllApproved);
      if (v.id !== videoId) {
        return {
          ...v,
          aprovado: currentCardApproved,
          aprovadoPor: currentCardApproved ? v.aprovadoPor || 'Vitor Cordoba' : undefined,
          aprovadoEm: currentCardApproved ? v.aprovadoEm || nowIso : undefined,
        };
      }
      const nextCardApproved = !currentCardApproved;
      return {
        ...v,
        aprovado: nextCardApproved,
        aprovadoPor: nextCardApproved ? 'Vitor Cordoba' : undefined,
        aprovadoEm: nextCardApproved ? nowIso : undefined,
      };
    });

    setVideoDrafts(updatedDrafts);
    setSavedDrafts(JSON.stringify(updatedDrafts));

    const mappedVideos = updatedDrafts.map((video) => ({
      titulo: video.titulo,
      formato: video.formato || 'Automático',
      roteiro: video.roteiro,
      refRotulo: video.refRotulo,
      refUrl: video.refUrl,
      modeloEditoraId: selectedEditorModelId || video.modeloEditoraId,
      aprovado: video.aprovado,
      aprovadoPor: video.aprovadoPor,
      aprovadoEm: video.aprovadoEm,
      refsExtras: video.refsExtras,
    }));

    const filledVideos = mappedVideos.filter((v) => v.roteiro.trim() || v.titulo.trim());
    const allCardsApproved =
      filledVideos.length > 0
        ? filledVideos.every((v) => Boolean(v.aprovado))
        : mappedVideos.every((v) => Boolean(v.aprovado));
    const raw = serializeDraftsToRaw(updatedDrafts);

    const updatedEvent: EventItem =
      briefingMode === 'edicao'
        ? {
            ...activeEvent,
            briefing_edicao_videos: mappedVideos,
            briefing_edicao: raw || activeEvent.briefing_edicao || null,
            briefing_edicao_aprovado: allCardsApproved,
          }
        : {
            ...activeEvent,
            briefing_videos: mappedVideos,
            briefing_gravacao: raw || activeEvent.briefing_gravacao || null,
            briefing_aprovado: allCardsApproved,
            briefing_aprovado_por: allCardsApproved ? 'Vitor Cordoba' : null,
            briefing_aprovado_em: allCardsApproved ? nowIso : null,
          };

    saveEvent(updatedEvent, true);
    const targetCard = updatedDrafts.find((v) => v.id === videoId);
    toast(
      targetCard?.aprovado
        ? 'Card do vídeo aprovado por Vitor Cordoba (borda azul validada)!'
        : 'Aprovação do card removida.'
    );
  };

  // Monta o documento formatado do Briefing do Vídeo para o Cliente visualizar
  const buildClientDocumentText = useCallback(
    (ev: EventItem, draftsToFormat?: EditableVideoDraft[]) => {
      const clientObj = ev.client || clients.find((c) => c.id === ev.client_id);
      const items = draftsToFormat || loadEventBriefingDrafts(ev, 'video');
      return formatWhatsAppBriefingDocument(ev, items, clientObj?.nome);
    },
    [clients]
  );

  const handleCopyClientDocument = async (ev: EventItem, draftsToFormat?: EditableVideoDraft[]) => {
    const docText = buildClientDocumentText(ev, draftsToFormat);
    try {
      await navigator.clipboard.writeText(docText);
      toast('Documento do cliente copiado! Pronto para colar e enviar para o restaurante.');
      setStatusMsg('Documento formatado copiado para a área de transferência! Envie para o cliente visualizar.');
    } catch {
      toast('Não foi possível copiar automaticamente. Use a opção de WhatsApp ou PDF.', 'error');
    }
  };

  const handleShareClientWhatsApp = (ev: EventItem, draftsToFormat?: EditableVideoDraft[]) => {
    const docText = buildClientDocumentText(ev, draftsToFormat);
    const clientObj = ev.client || clients.find((c) => c.id === ev.client_id);
    const url = buildWhatsAppBriefingShareUrl(docText, clientObj?.contato);
    window.open(url, '_blank', 'noopener,noreferrer');
    toast('Abrindo WhatsApp com o documento de briefing para o cliente visualizar!');
  };

  // Geração de PDF A4 para o compromisso aberto
  const gerarPdfBlob = useCallback(async (): Promise<Blob> => {
    const container = previewContainerRef.current;
    if (!container) throw new Error('Ative a visualização A4 para gerar o PDF.');
    return generateBriefingPdfBlob(container);
  }, []);

  const handleDownloadOrSharePdf = async (mode: 'download' | 'share', forClientDoc = false) => {
    if (!showPdfPreview) {
      setShowPdfPreview(true);
      await new Promise((r) => setTimeout(r, 280));
    }
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setStatusMsg(forClientDoc ? 'Preparando Briefing PDF A4...' : 'Gerando Briefing PDF A4...');
    try {
      const blob = await gerarPdfBlob();
      const fileName = getBriefingPdfFileName(activeClient?.nome, briefingMode);

      if (mode === 'share') {
        const file = new File([blob], fileName, { type: 'application/pdf' });
        if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: fileName });
          setStatusMsg(`Documento "${fileName}" compartilhado com sucesso!`);
          return;
        }
      }
      downloadBriefingBlob(blob, fileName);
      setStatusMsg(`Documento "${fileName}" gerado no formato oficial Navegando MKT!`);
    } catch (e) {
      setStatusMsg('Erro ao gerar PDF: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleOpenAndSharePdfFromList = async (ev: EventItem) => {
    handleOpenEventBriefing(ev, briefingMode);
    setShowPdfPreview(true);
    setTimeout(() => {
      handleDownloadOrSharePdf('share', true);
    }, 320);
  };

  // Barra de Seleção da Categoria de Briefing (Briefing do Vídeo vs Briefing de Edição)
  const renderCategorySwitcher = () => (
    <div className="p-2 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
        <button
          type="button"
          onClick={() => handleSwitchMode('video')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer border ${
            briefingMode === 'video'
              ? 'bg-[var(--ui-accent)]/15 border-[var(--ui-accent)] text-foreground shadow-[0_0_20px_rgba(255,102,0,0.15)]'
              : 'bg-[var(--ui-page)]/60 border-transparent text-zinc-400 hover:text-foreground hover:bg-[var(--ui-page)]'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              briefingMode === 'video'
                ? 'bg-[var(--ui-accent)] text-white'
                : 'bg-[var(--ui-surface)] text-zinc-400 border border-[var(--ui-border)]'
            }`}
          >
            <Video className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-extrabold truncate">Briefing do Vídeo (Gravação)</div>
            <div className="text-[11px] text-zinc-400 truncate">
              Roteiros por vídeo + Documento para o Cliente visualizar
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchMode('edicao')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer border ${
            briefingMode === 'edicao'
              ? 'bg-purple-500/15 border-purple-400/60 text-foreground shadow-[0_0_20px_rgba(168,85,247,0.15)]'
              : 'bg-[var(--ui-page)]/60 border-transparent text-zinc-400 hover:text-foreground hover:bg-[var(--ui-page)]'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              briefingMode === 'edicao'
                ? 'bg-purple-500 text-white'
                : 'bg-[var(--ui-surface)] text-zinc-400 border border-[var(--ui-border)]'
            }`}
          >
            <Scissors className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-extrabold truncate flex items-center gap-1.5">
              <span>Briefing de Edição</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                Modelos Editoras
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 truncate">
              As modelos podem editar o Briefing de Edição separado por vídeo
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  // Banner informativo quando uma Modelo acessa o Briefing do Vídeo (somente leitura)
  const renderModelReadOnlyBanner = () => {
    if (!isReadOnly) return null;
    return (
      <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-purple-200">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-purple-300 shrink-0" />
          <div>
            <span className="font-extrabold text-purple-100">
              Modo Visualização no Briefing do Vídeo (Modelo):
            </span>{' '}
            O Briefing dos Vídeos pode ser alterado por toda a equipe, exceto pelas modelos. Você pode visualizar tudo aqui e editar normalmente na aba <strong>Briefing de Edição</strong>.
          </div>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-[10px] font-extrabold uppercase tracking-wider text-purple-200">
          <Eye className="w-3 h-3" />
          Apenas Leitura
        </span>
      </div>
    );
  };

  const linkedComposerEvent = recordingEvents.find((ev) => ev.id === composerEventId) || null;
  const linkedComposerClient = linkedComposerEvent
    ? clients.find((c) => c.id === linkedComposerEvent.client_id) || linkedComposerEvent.client || null
    : null;

  const createBriefingModal = createComposerOpen ? (
    <div
      className="fixed inset-0 z-50 bg-black/75 p-4 flex items-center justify-center"
      onKeyDown={(event) => {
        if (event.key === 'Escape') setCreateComposerOpen(false);
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={briefingMode === 'edicao' ? 'Criar Briefing de Edição' : 'Criar Briefing de Vídeo'}
        className="w-full max-w-xl max-h-[88dvh] overflow-y-auto rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5 sm:p-6 space-y-4 shadow-2xl"
      >
        <div className="flex justify-between items-start gap-3">
          <div>
            <span
              className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md mb-1 ${
                briefingMode === 'edicao'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-[var(--ui-accent)]/15 text-[var(--ui-accent)]'
              }`}
            >
              {briefingMode === 'edicao' ? 'Edição (Modelos)' : 'Gravação / Vídeo'}
            </span>
            <h2 className="font-bold text-lg text-foreground">
              {briefingMode === 'edicao' ? 'Criar Briefing de Edição' : 'Criar Briefing de Vídeo'}
            </h2>
            <p className="text-xs text-zinc-400">
              {briefingMode === 'edicao'
                ? 'Escreva o novo briefing de edição e vincule ao restaurante/gravação da Agenda.'
                : 'Escreva o novo briefing de vídeo e vincule ao restaurante/gravação da Agenda.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateComposerOpen(false)}
            className="px-3 py-1.5 rounded-lg bg-[var(--ui-raised)] text-xs font-semibold text-zinc-300 hover:text-foreground cursor-pointer"
          >
            Fechar
          </button>
        </div>

        {composerError && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-medium">
            {composerError}
          </div>
        )}

        <form onSubmit={handleSaveComposedBriefing} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-zinc-200">
                Linkar local / gravação da Agenda *
              </label>
              <button
                type="button"
                onClick={() => {
                  setCreateComposerOpen(false);
                  openNewEventModal();
                }}
                className="text-[11px] font-semibold text-[var(--ui-accent)] hover:underline cursor-pointer"
              >
                + Agendar nova gravação
              </button>
            </div>

            {recordingEvents.length === 0 ? (
              <div className="p-4 rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] text-xs text-zinc-300">
                Nenhuma gravação agendada na Agenda ainda. Clique em <strong>+ Agendar nova gravação</strong> para criar uma antes de linkar.
              </div>
            ) : (
              <select
                aria-label="Linkar local conforme a agenda feita"
                value={composerEventId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setComposerEventId(nextId);
                  const found = recordingEvents.find((ev) => ev.id === nextId);
                  if (found) setComposerModelId(resolveEventEditorModel(found)?.id || '');
                }}
                className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ui-accent)]"
              >
                {recordingEvents.map((ev) => {
                  const clientName =
                    ev.client?.nome || clients.find((c) => c.id === ev.client_id)?.nome || 'Restaurante';
                  const addr =
                    ev.local || clients.find((c) => c.id === ev.client_id)?.endereco || '';
                  return (
                    <option key={ev.id} value={ev.id}>
                      {clientName} • {fmtDate(ev.data)} ({ev.hora_inicio.slice(0, 5)}–{ev.hora_fim.slice(0, 5)})
                      {addr ? ` — ${addr}` : ''}
                    </option>
                  );
                })}
              </select>
            )}

            {linkedComposerEvent && (
              <p className="text-[11px] text-zinc-400">
                Vinculado a: <strong className="text-zinc-200">{linkedComposerClient?.nome || 'Restaurante'}</strong>
                {linkedComposerClient?.endereco ? ` (${linkedComposerClient.endereco})` : ''} • {fmtDate(linkedComposerEvent.data)}
              </p>
            )}
          </div>

          {briefingMode === 'edicao' && modelEmployees.length > 0 && (
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-zinc-200">Modelo Responsável pela Edição (opcional)</span>
              <select
                value={composerModelId}
                onChange={(e) => setComposerModelId(e.target.value)}
                className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
              >
                <option value="">Usar modelo escalada na gravação</option>
                {modelEmployees.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-zinc-200">
                Cards de Vídeos ({composerDrafts.length})
              </span>
              <span className="text-[11px] text-zinc-400">
                Enter pula para o próximo vídeo (novo card) · Shift+Enter quebra linha
              </span>
            </div>

            <div className="space-y-3">
              {composerDrafts.map((card, idx) => (
                <article
                  key={card.id}
                  className={`rounded-xl border p-3.5 space-y-2.5 bg-[var(--ui-raised)] ${
                    briefingMode === 'edicao' ? 'border-purple-500/35' : 'border-[var(--ui-border)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--ui-accent)]">
                      {briefingMode === 'edicao' ? `Edição Vídeo ${idx + 1}` : `Vídeo ${idx + 1}`}
                    </span>
                    {composerDrafts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeComposerCard(card.id)}
                        className="text-[11px] text-zinc-400 hover:text-rose-400 cursor-pointer"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={card.titulo}
                    onChange={(ev) => updateComposerCard(card.id, { titulo: ev.target.value })}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter') {
                        ev.preventDefault();
                        composerInputs.current[card.id]?.focus();
                      }
                    }}
                    placeholder={
                      briefingMode === 'edicao'
                        ? `Título do Reel ${idx + 1} (opcional)`
                        : `Título / Ideia do Vídeo ${idx + 1} (opcional)`
                    }
                    className="w-full bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-lg px-3 py-1.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                  />

                  <textarea
                    ref={(element) => {
                      composerInputs.current[card.id] = element;
                    }}
                    rows={4}
                    value={card.roteiro}
                    onChange={(ev) => updateComposerCard(card.id, { roteiro: ev.target.value })}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' && !ev.shiftKey && !ev.nativeEvent.isComposing) {
                        ev.preventDefault();
                        advanceComposerCard(idx);
                      }
                    }}
                    placeholder={
                      briefingMode === 'edicao'
                        ? 'Descreva cortes, gancho, trilha, legenda e CTA (Enter cria o próximo vídeo)...'
                        : 'Escreva o roteiro deste vídeo (Enter cria o próximo vídeo)...'
                    }
                    className="w-full bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-lg px-3 py-2 text-xs sm:text-sm text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--ui-accent)]"
                  />

                  <input
                    type="url"
                    value={card.refUrl}
                    onChange={(ev) => updateComposerCard(card.id, { refUrl: ev.target.value })}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter') {
                        ev.preventDefault();
                        advanceComposerCard(idx);
                      }
                    }}
                    placeholder="Link de referência (opcional) — https://..."
                    className="w-full bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                  />
                </article>
              ))}
            </div>

            <button
              type="button"
              onClick={addComposerCard}
              className="w-full rounded-xl border border-dashed border-[var(--ui-accent)]/60 py-2.5 px-4 text-xs font-bold text-[var(--ui-accent)] hover:bg-[var(--ui-accent)]/10 cursor-pointer"
            >
              + Adicionar {briefingMode === 'edicao' ? `Edição Vídeo ${composerDrafts.length + 1}` : `Vídeo ${composerDrafts.length + 1}`}
            </button>
          </div>

          <div className="pt-2 border-t border-[var(--ui-border)] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateComposerOpen(false)}
              className="px-4 py-2 rounded-xl bg-[var(--ui-raised)] text-xs font-semibold text-zinc-300 hover:text-foreground cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={recordingEvents.length === 0}
              className="px-5 py-2 rounded-xl gradient-cta text-foreground text-xs font-extrabold flex items-center gap-1.5 shadow-lg cursor-pointer disabled:opacity-40"
            >
              <Save className="w-4 h-4" />
              <span>
                {`Salvar Briefing Linkado (${composerDrafts.length} ${composerDrafts.length === 1 ? 'Vídeo' : 'Vídeos'})`}
              </span>
            </button>
          </div>
        </form>
      </section>
    </div>
  ) : null;

  // ============================================================================
  // VISÃO 1: GRADE DE CARDS DOS COMPROMISSOS DOS RESTAURANTES (PENDENTE / FEITO)
  // ============================================================================
  if (!activeEvent) {
    return (
      <div className="space-y-6">
        {renderCategorySwitcher()}
        {renderModelReadOnlyBanner()}

        {/* Cabeçalho e Resumo */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--ui-accent)] mb-1">
              {briefingMode === 'edicao' ? (
                <>
                  <Scissors className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300">Briefing de Edição • Modelos Responsáveis pela Edição</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Central de Briefings de Vídeo por Compromisso</span>
                </>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              {briefingMode === 'edicao'
                ? 'Briefings de Edição dos Restaurantes'
                : 'Gravações & Briefings de Vídeo dos Restaurantes'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              {briefingMode === 'edicao'
                ? 'Mesmo esquema por restaurante e separado por vídeo: organize as instruções de edição para as modelos responsáveis (as modelos visualizam tudo sem editar).'
                : 'Clique no card do restaurante para abrir os briefings separados por vídeo e compartilhar o documento de visualização com o cliente.'}
            </p>
          </div>

          {/* Indicadores Rápidos */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3.5 py-2 rounded-xl bg-[var(--ui-page)] border border-[var(--ui-border)] flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <div>
                <div className="text-[10px] uppercase font-bold text-zinc-400">Compromissos</div>
                <div className="text-sm font-extrabold text-foreground">{counts.total}</div>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] uppercase font-bold text-amber-300/80">Pendentes</div>
                <div className="text-sm font-extrabold text-amber-400">{counts.pendentes}</div>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-300/80">
                  {briefingMode === 'edicao' ? 'Edição Feita' : 'Briefing Feito'}
                </div>
                <div className="text-sm font-extrabold text-emerald-400">{counts.feitos}</div>
              </div>
            </div>

            {!isReadOnly && (
              <button
                type="button"
                onClick={() => openCreateBriefingComposer()}
                className="px-3.5 py-2.5 rounded-xl gradient-cta text-foreground font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{briefingMode === 'edicao' ? 'Criar Briefing de Edição' : 'Criar Briefing de Vídeo'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Barra de Filtros */}
        {canManage && (
          <section
            aria-label="Análise de Performance de Briefings"
            className="p-4 sm:p-5 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--ui-border)] pb-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--ui-accent)]">
                  <BarChart3 className="w-4 h-4" />
                  <span>Análise de Performance de Briefings • Visão do Gestor</span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-foreground mt-0.5">
                  Quantos Briefings e Vídeos foram feitos vs. pendentes
                </h2>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 self-start sm:self-center">
                {managerPerformanceStats.videoBriefingsDone + managerPerformanceStats.edicaoBriefingsDone} briefings concluídos no total
              </span>
            </div>

            {/* 4 KPIs de Briefings para o Gestor */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[var(--ui-page)] border border-[var(--ui-border)]">
                <div className="text-[11px] font-bold text-zinc-400 uppercase">Briefings de Vídeo</div>
                <div className="text-xl sm:text-2xl font-extrabold text-foreground mt-1">
                  {managerPerformanceStats.videoBriefingsDone}{' '}
                  <span className="text-xs font-normal text-zinc-400">
                    / {managerPerformanceStats.totalCommitments}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                  {managerPerformanceStats.videoCompletionPct}% concluídos ({managerPerformanceStats.videoBriefingsPending} pendentes)
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--ui-page)] border border-[var(--ui-border)]">
                <div className="text-[11px] font-bold text-zinc-400 uppercase">Vídeos Roteirizados</div>
                <div className="text-xl sm:text-2xl font-extrabold text-[var(--ui-accent)] mt-1">
                  {managerPerformanceStats.totalVideosPlanned}
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  Vídeos separados em Briefing de Gravação
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--ui-page)] border border-purple-500/30">
                <div className="text-[11px] font-bold text-purple-300 uppercase">Briefings de Edição</div>
                <div className="text-xl sm:text-2xl font-extrabold text-foreground mt-1">
                  {managerPerformanceStats.edicaoBriefingsDone}{' '}
                  <span className="text-xs font-normal text-zinc-400">
                    / {managerPerformanceStats.totalCommitments}
                  </span>
                </div>
                <div className="text-[11px] text-purple-300 font-semibold mt-1">
                  {managerPerformanceStats.edicaoCompletionPct}% concluídos ({managerPerformanceStats.edicaoBriefingsPending} pendentes)
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--ui-page)] border border-purple-500/30">
                <div className="text-[11px] font-bold text-purple-300 uppercase">Vídeos em Edição (Modelos)</div>
                <div className="text-xl sm:text-2xl font-extrabold text-purple-300 mt-1">
                  {managerPerformanceStats.totalVideosEdicao}
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  Vídeos com briefing de edição preenchido
                </div>
              </div>
            </div>

            {/* Tabela de Performance por Modelo / Filmmaker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {managerPerformanceStats.teamPerformance.map((item) => (
                <div
                  key={item.employee.id}
                  className="p-3 rounded-xl bg-[var(--ui-page)] border border-[var(--ui-border)] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <EmployeeBadge employee={item.employee} size="sm" showRole />
                    <div className="text-[11px] text-zinc-400 mt-1">
                      {item.totalEvents} gravações · <strong className="text-foreground">{item.videosCount} vídeos</strong>
                    </div>
                  </div>
                  <div className="text-right shrink-0 text-[11px] space-y-0.5">
                    <div className="font-bold text-emerald-400">
                      Vídeo: {item.videoDone}/{item.totalEvents}
                    </div>
                    <div className="font-bold text-purple-300">
                      Edição: {item.edicaoDone}/{item.totalEvents}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] self-start">
            <button
              type="button"
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'todos'
                  ? 'bg-[var(--ui-accent)] text-white shadow'
                  : 'text-zinc-400 hover:text-foreground'
              }`}
            >
              Todos ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pendentes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'pendentes'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-amber-300'
              }`}
            >
              Pendentes ({counts.pendentes})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('feitos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'feitos'
                  ? 'bg-emerald-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-emerald-300'
              }`}
            >
              Feitos ({counts.feitos})
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 justify-end">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar restaurante, modelo editora, data ou local..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-xs text-foreground focus:outline-none focus:border-[var(--ui-accent)]"
              />
            </div>
            <ViewStyleToggle value={viewStyle} onChange={setViewStyle} />
          </div>
        </div>

        {/* Grade de Cards OU Visão Alternativa de Agenda */}
        {viewStyle === 'agenda' ? (
          <ScheduleStatusCalendar
            events={filteredEvents}
            clients={clients}
            currentMonth={calendarMonth}
            onChangeMonth={setCalendarMonth}
            legend={[
              { tone: 'red', label: 'Sem briefing (nem vídeo, nem edição)' },
              { tone: 'amber', label: '1 feito (só vídeo ou só edição)' },
              { tone: 'green', label: 'Os 2 feitos (vídeo + edição)' },
            ]}
            getEventTone={(ev) => {
              const videoDone = hasVideoBriefingDone(ev);
              const edicaoDone = hasEditingBriefingDone(ev);
              if (videoDone && edicaoDone) {
                return { tone: 'green', badgeText: 'Vídeo + Edição OK' };
              }
              if (videoDone || edicaoDone) {
                return {
                  tone: 'amber',
                  badgeText: videoDone ? 'Só Vídeo feito' : 'Só Edição feita',
                };
              }
              return { tone: 'red', badgeText: 'Sem briefings' };
            }}
            onSelectEvent={(ev) => handleOpenEventBriefing(ev, briefingMode)}
          />
        ) : filteredEvents.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-center space-y-3">
            <Building className="w-10 h-10 text-zinc-500 mx-auto" />
            <div className="text-sm font-bold text-foreground">
              Nenhum compromisso encontrado para este filtro
            </div>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Agende uma gravação na agenda ou altere o filtro acima para visualizar os restaurantes.
            </p>
          </div>
        ) : (
          <div className="briefing-restaurants grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {restaurantEvents.map((ev) => {
              const client = ev.client || clients.find((c) => c.id === ev.client_id);
              const done = isEventDoneForMode(ev);
              const isApproved = isEventBriefingApproved(ev, briefingMode);
              const restaurantRecordings = recordingEvents.filter((event) => event.client_id === ev.client_id);
              const videoCount = restaurantRecordings.reduce(
                (sum, event) => sum + countEventVideosForMode(event),
                0
              );
              const assignedMembers = (ev.assigned_employee_ids || [])
                .map((id) => employees.find((emp) => emp.id === id))
                .filter(Boolean);
              const editorModels = resolveEventEditorModels(ev);
              const rawSource = briefingMode === 'edicao' ? ev.briefing_edicao : ev.briefing_gravacao;
              const parsedPreview = done && rawSource ? parseItems(rawSource) : [];

              return (
                <div
                  key={ev.id}
                  onClick={() => handleOpenEventBriefing(ev)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenEventBriefing(ev);
                    }
                  }}
                  className={`group min-w-0 rounded-2xl p-4 sm:p-5 bg-[var(--ui-surface)] transition-all cursor-pointer flex flex-col justify-between gap-4 hover:-translate-y-0.5 shadow-lg ${
                    isApproved
                      ? 'border-2 border-[#38bdf8] ring-2 ring-[#38bdf8]/35 bg-[#38bdf8]/[0.03] shadow-[0_0_28px_rgba(56,189,248,0.22)] hover:border-sky-300'
                      : done
                        ? 'border border-emerald-500/35 hover:border-emerald-400/70'
                        : briefingMode === 'edicao'
                          ? 'border border-purple-500/35 hover:border-purple-400'
                          : 'border border-amber-500/35 hover:border-[var(--ui-accent)]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Topo do Card: Nome do Restaurante + Status (Validado Azul / Feito / Pendente) */}
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span
                          className={`inline-block text-[10px] font-extrabold uppercase tracking-wider mb-0.5 ${
                            isApproved
                              ? 'text-[#38bdf8]'
                              : briefingMode === 'edicao'
                                ? 'text-purple-300'
                                : 'text-[var(--ui-accent)]'
                          }`}
                        >
                          {briefingMode === 'edicao'
                            ? 'Briefing de Edição • Modelos'
                            : EVENT_TYPE_LABELS[ev.tipo] || 'Gravação'}
                        </span>
                        <h3 className="text-sm sm:text-base font-extrabold text-foreground break-words group-hover:text-[var(--ui-accent)] transition-colors">
                          {client?.nome || 'Restaurante'}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50 shadow-sm">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Validado • Vitor Cordoba</span>
                          </span>
                        )}
                        {done ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{briefingMode === 'edicao' ? 'Edição Feita' : 'Briefing Feito'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pendente</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-zinc-400">
                        {restaurantRecordings.length}{' '}
                        {restaurantRecordings.length === 1 ? 'compromisso' : 'compromissos'} · {videoCount}{' '}
                        {briefingMode === 'edicao' ? 'vídeos para editar' : 'vídeos planejados'}
                      </p>

                      {/* Destaque das Modelos Escaladas / Responsáveis pela Edição */}
                      {editorModels.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/25 text-[11px] font-bold text-purple-200">
                          <Scissors className="w-3 h-3 text-purple-400" />
                          <span>Edição: {editorModels.map((m) => m.nome).join(', ')}</span>
                        </span>
                      )}
                    </div>

                    {/* Data e Horário do Compromisso */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300 bg-[var(--ui-page)] px-3 py-2 rounded-xl border border-[var(--ui-border)]">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-[var(--ui-accent)]" />
                        {fmtDate(ev.data)}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        {ev.hora_inicio.slice(0, 5)} às {ev.hora_fim.slice(0, 5)}
                      </span>
                    </div>

                    {/* Resumo dos Vídeos ou Chamada para Preencher */}
                    {done && parsedPreview.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          {briefingMode === 'edicao' ? 'Vídeos para edição:' : 'Vídeos planejados:'}
                        </div>
                        {parsedPreview.slice(0, 2).map((vid) => (
                          <div
                            key={vid.n}
                            className="text-xs text-zinc-300 line-clamp-1 bg-white/[0.02] px-2.5 py-1.5 rounded-lg border border-white/5"
                          >
                            <strong
                              className={
                                briefingMode === 'edicao'
                                  ? 'text-purple-300 mr-1.5'
                                  : 'text-[var(--ui-accent)] mr-1.5'
                              }
                            >
                              {briefingMode === 'edicao' ? `Edição Vídeo ${vid.n}:` : `Vídeo ${vid.n}:`}
                            </strong>
                            {vid.text}
                          </div>
                        ))}
                        {parsedPreview.length > 2 && (
                          <div className="text-[11px] text-zinc-400 font-medium pl-1">
                            + {parsedPreview.length - 2} outro(s) vídeo(s)...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 text-xs text-amber-200/90 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          {isReadOnly
                            ? 'Este briefing ainda está sendo preparado pela gestão.'
                            : briefingMode === 'edicao'
                              ? 'Nenhum briefing de edição escrito ainda. Clique para separar a edição de cada vídeo para a modelo.'
                              : 'Nenhum briefing escrito ainda. Clique para criar os vídeos desta gravação.'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Rodapé do Card: Equipe + Ações Rápidas */}
                  <div className="pt-3 border-t border-[var(--ui-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      {assignedMembers.length > 0 ? (
                        assignedMembers.slice(0, 3).map((emp) =>
                          emp ? <EmployeeBadge key={emp.id} employee={emp} size="sm" /> : null
                        )
                      ) : (
                        <span className="text-[11px] text-zinc-400">Sem equipe definida</span>
                      )}
                      {assignedMembers.length > 3 && (
                        <span className="text-[10px] text-zinc-400 font-bold">
                          +{assignedMembers.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                      {/* Botão exclusivo para Vitor Cordoba: Aprovar Briefing */}
                      {canApproveBriefing && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleApproveEvent(ev, briefingMode);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                            isApproved
                              ? 'bg-[#38bdf8] text-black shadow-md shadow-[#38bdf8]/25 hover:bg-sky-300'
                              : 'bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 text-[#38bdf8] border border-[#38bdf8]/40'
                          }`}
                          title="Função exclusiva de Vitor Cordoba: Aprovar e validar este briefing (muda a borda para azul)"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{isApproved ? 'Aprovado ✓' : 'Aprovar'}</span>
                        </button>
                      )}

                      {/* Atalho rápido para compartilhar PDF do briefing com o cliente */}
                      {briefingMode === 'video' && done && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAndSharePdfFromList(ev);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          title="Compartilhar documento oficial de briefing em PDF A4"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Compartilhar Briefing</span>
                        </button>
                      )}

                      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[var(--ui-accent)] group-hover:translate-x-0.5 transition-transform">
                        <span>
                          {isReadOnly
                            ? 'Visualizar Briefing'
                            : done
                              ? briefingMode === 'edicao'
                                ? 'Editar Briefing de Edição'
                                : 'Editar Vídeos'
                              : briefingMode === 'edicao'
                                ? 'Criar Briefing de Edição'
                                : 'Escrever Briefing'}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {createBriefingModal}
      </div>
    );
  }

  // ============================================================================
  // VISÃO 2: EDITOR DE BRIEFINGS SEPARADOS POR VÍDEO DO RESTAURANTE SELECIONADO
  // ============================================================================
  const displayClient = activeClient?.nome || 'Restaurante';
  const displayDate = fmtDate(activeEvent.data);
  const isCurrentlyDone = isEventDoneForMode(activeEvent);
  const isCurrentlyApproved = isEventBriefingApproved(activeEvent, briefingMode);
  const activeEditorModels = activeEvent ? resolveEventEditorModels(activeEvent) : [];
  const activeEditorModel =
    employees.find((e) => e.id === selectedEditorModelId) || activeEditorModels[0] || null;

  return (
    <div className="space-y-6">
      {renderCategorySwitcher()}
      {renderModelReadOnlyBanner()}

      {/* Barra Superior do Compromisso Selecionado */}
      <div
        className={`p-4 sm:p-6 rounded-2xl bg-[var(--ui-surface)] flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all ${
          isCurrentlyApproved
            ? 'border-2 border-[#38bdf8] ring-2 ring-[#38bdf8]/30 shadow-[0_0_28px_rgba(56,189,248,0.18)]'
            : 'border border-[var(--ui-border)]'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <button
            type="button"
            onClick={leaveEditor}
            className="p-2.5 rounded-xl bg-[var(--ui-page)] hover:bg-[var(--ui-raised)] border border-[var(--ui-border)] text-zinc-300 hover:text-foreground transition-colors cursor-pointer shrink-0"
            title="Voltar para a lista de restaurantes"
          >
            <span>Voltar</span>
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  briefingMode === 'edicao'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-[var(--ui-accent)]/15 text-[var(--ui-accent)]'
                }`}
              >
                {briefingMode === 'edicao'
                  ? 'Briefing de Edição (Modelos)'
                  : EVENT_TYPE_LABELS[activeEvent.tipo] || 'Briefing do Vídeo'}
              </span>
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[var(--ui-accent)]" />
                {displayDate} ({activeEvent.hora_inicio.slice(0, 5)} às {activeEvent.hora_fim.slice(0, 5)})
              </span>
              {isCurrentlyApproved && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50">
                  <ShieldCheck className="w-3 h-3" />
                  Validado • Vitor Cordoba
                </span>
              )}
              {isCurrentlyDone ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  {briefingMode === 'edicao' ? 'Briefing de Edição Feito' : 'Briefing Feito'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Clock className="w-3 h-3" />
                  {briefingMode === 'edicao' ? 'Edição Pendente' : 'Briefing Pendente'}
                </span>
              )}
            </div>

            <h2
              ref={editorHeading}
              tabIndex={-1}
              className="scroll-mt-24 text-xl sm:text-2xl font-extrabold text-foreground"
            >
              {displayClient}
            </h2>
          </div>
        </div>

        {/* Ações Principais do Briefing */}
        <div className="flex flex-wrap items-center gap-2.5">
          {canApproveBriefing && (
            <button
              type="button"
              onClick={() => handleToggleApproveEvent(activeEvent, briefingMode)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                isCurrentlyApproved
                  ? 'bg-[#38bdf8] text-black shadow-lg shadow-[#38bdf8]/30 hover:bg-sky-300'
                  : 'bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 text-[#38bdf8] border border-[#38bdf8]/50'
              }`}
              title="Exclusivo Vitor Cordoba: Aprovar e validar todos os cards deste briefing (borda azul)"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isCurrentlyApproved ? 'Briefing Aprovado ✓' : 'Aprovar Briefing'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowPdfPreview((v) => !v)}
            className="px-3.5 py-2.5 rounded-xl bg-[var(--ui-page)] hover:bg-[var(--ui-raised)] border border-[var(--ui-border)] text-xs font-bold text-zinc-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-[var(--ui-accent)]" />
            <span>{showPdfPreview ? 'Ocultar Documento A4' : 'Ver Documento A4'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadOrSharePdf('download')}
            disabled={isGeneratingPdf || parsedPreviewItems.length === 0}
            className="px-3.5 py-2.5 rounded-xl bg-[var(--ui-page)] hover:bg-[var(--ui-raised)] border border-[var(--ui-border)] text-xs font-bold text-zinc-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[var(--ui-accent)]" />
            <span>Baixar PDF</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadOrSharePdf('share')}
            disabled={isGeneratingPdf || parsedPreviewItems.length === 0}
            className="px-3.5 py-2.5 rounded-xl bg-[var(--ui-page)] hover:bg-[var(--ui-raised)] border border-[var(--ui-border)] text-xs font-bold text-zinc-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Share2 className="w-4 h-4 text-[var(--ui-accent)]" />
            <span>Compartilhar Briefing</span>
          </button>

          {!isReadOnly && (
            <>
              <button
                type="button"
                onClick={handleSaveBriefing}
                aria-label="Salvar briefings"
                className="px-3.5 py-2.5 rounded-xl bg-[var(--ui-page)] hover:bg-[var(--ui-raised)] border border-[var(--ui-border)] text-xs font-bold text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4 text-[var(--ui-accent)]" />
                <span>
                  {`Salvar (${videoDrafts.length} ${videoDrafts.length === 1 ? 'Vídeo' : 'Vídeos'})`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => openCreateBriefingComposer(activeEvent.id)}
                className="px-5 py-2.5 rounded-xl gradient-cta text-white font-extrabold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {briefingMode === 'edicao'
                    ? 'Criar Briefing de Edição'
                    : 'Criar Briefing de Vídeo'}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* OPÇÃO DE COMPARTILHAR DOCUMENTO PARA O CLIENTE VISUALIZAR (NO VÍDEO)  */}
      {/* ===================================================================== */}
      {briefingMode === 'video' && (
        <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[var(--ui-accent)]/12 via-[var(--ui-surface)] to-emerald-500/10 border border-[var(--ui-accent)]/35 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--ui-accent)]">
              <FileText className="w-4 h-4" />
              <span>Documento do Cliente • Visualização Externa</span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-foreground">
              Compartilhar Documento do Briefing para {displayClient} visualizar
            </h3>
            <p className="text-xs text-zinc-300">
              Gere e compartilhe o documento oficial em PDF A4 ou envie o roteiro estruturado no WhatsApp para o cliente aprovar e acompanhar os vídeos da gravação.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleDownloadOrSharePdf('share', true)}
              disabled={isGeneratingPdf || parsedPreviewItems.length === 0}
              className="px-3.5 py-2.5 rounded-xl gradient-cta text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartilhar Documento PDF c/ Cliente</span>
            </button>

            <button
              type="button"
              onClick={() => handleShareClientWhatsApp(activeEvent, videoDrafts)}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Enviar no WhatsApp do Cliente</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopyClientDocument(activeEvent, videoDrafts)}
              className="px-3.5 py-2.5 rounded-xl bg-[var(--ui-page)] hover:bg-[var(--ui-raised)] border border-[var(--ui-border)] text-zinc-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-4 h-4 text-[var(--ui-accent)]" />
              <span>Copiar Documento do Cliente</span>
            </button>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* PAINEL DA MODELO RESPONSÁVEL PELA EDIÇÃO (NO BRIEFING DE EDIÇÃO)      */}
      {/* ===================================================================== */}
      {briefingMode === 'edicao' && (
        <section className="p-4 sm:p-5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-purple-300">
              <UserCheck className="w-4 h-4" />
              <span>Responsabilidade de Edição • Modelos Navegando MKT</span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-foreground">
              Modelo Responsável pela Edição dos Vídeos de {displayClient}
            </h3>
            <p className="text-xs text-zinc-300">
              Todas as modelos escaladas nesta gravação têm permissão total para editar e salvar o briefing de edição.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {activeEditorModels.length > 0 ? (
              activeEditorModels.map((mod) => (
                <EmployeeBadge key={mod.id} employee={mod} size="md" />
              ))
            ) : (
              activeEditorModel && <EmployeeBadge employee={activeEditorModel} size="md" />
            )}
            <label className="flex items-center gap-2 text-xs font-bold text-zinc-200">
              <span>Modelo Editora:</span>
              <select
                aria-label="Modelo responsável pela edição"
                disabled={isReadOnly}
                value={selectedEditorModelId}
                onChange={(e) => setSelectedEditorModelId(e.target.value)}
                className="rounded-xl border border-purple-500/40 bg-[var(--ui-page)] px-3 py-2 text-xs font-bold text-foreground disabled:opacity-60"
              >
                {modelEmployees.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.nome} (Modelo & Editora)
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      )}

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      <label className="flex flex-col gap-2 text-xs font-semibold">
        Compromisso deste restaurante
        <select
          aria-label="Gravação do restaurante"
          value={activeEvent.id}
          onChange={(event) => {
            if (
              !isReadOnly &&
              JSON.stringify(videoDrafts) !== savedDrafts &&
              !window.confirm('Há alterações não salvas. Trocar de gravação sem salvar?')
            )
              return;
            const selected = recordingEvents.find((item) => item.id === event.target.value);
            if (selected) handleOpenEventBriefing(selected, briefingMode);
          }}
          className="w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-3 text-base"
        >
          {recordingEvents
            .filter((event) => event.client_id === activeEvent.client_id)
            .map((event) => (
              <option key={event.id} value={event.id}>
                {fmtDate(event.data)} · {event.hora_inicio.slice(0, 5)} · {countEventVideosForMode(event)} vídeos (
                {briefingMode === 'edicao' ? 'Edição' : 'Gravação'})
              </option>
            ))}
        </select>
      </label>

      {!isReadOnly && (
        <section className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 space-y-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              applyQuantity();
            }}
            className="flex flex-wrap items-end gap-3"
          >
            <label className="flex flex-col gap-2 text-sm font-semibold">
              {briefingMode === 'edicao' ? 'Quantos vídeos serão editados?' : 'Quantos vídeos serão?'}
              <input
                aria-label="Quantidade de vídeos"
                type="number"
                min="1"
                step="1"
                value={videoQuantity}
                onChange={(event) => setVideoQuantity(event.target.value)}
                className="w-24 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-page)] px-3 py-2 text-base"
              />
            </label>
            <button
              type="submit"
              className="rounded-xl border border-[var(--ui-border)] px-4 py-2 text-sm font-semibold cursor-pointer hover:bg-[var(--ui-raised)]"
            >
              Gerar cards
            </button>
            <span className="text-xs text-zinc-400 pb-2">
              {videoDrafts.length} vídeos · {videoDrafts.filter((video) => video.roteiro.trim()).length}{' '}
              {briefingMode === 'edicao' ? 'briefings de edição preenchidos' : 'briefings preenchidos'}
            </span>
          </form>
          <p className="text-xs text-zinc-400">
            Um card separado por vídeo. Enter avança para o próximo vídeo; Shift+Enter cria uma nova linha. Salve ao finalizar.
          </p>
        </section>
      )}

      {/* Grid de Cards Separados por Vídeo */}
      <div className="briefing-videos grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {videoDrafts.map((video, index) => {
          const isCardApproved = Boolean(video.aprovado || isCurrentlyApproved);

          return (
            <article
              key={video.id}
              aria-label={
                briefingMode === 'edicao'
                  ? `Briefing de Edição do Vídeo ${index + 1}`
                  : `Briefing do Vídeo ${index + 1}`
              }
              className={`min-w-0 rounded-2xl bg-[var(--ui-surface)] p-4 sm:p-5 flex flex-col gap-3 transition-all ${
                isCardApproved
                  ? 'border-2 border-[#38bdf8] ring-2 ring-[#38bdf8]/30 bg-[#38bdf8]/[0.03] shadow-[0_0_24px_rgba(56,189,248,0.18)]'
                  : briefingMode === 'edicao'
                    ? 'border border-purple-500/30'
                    : 'border border-[var(--ui-border)]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ui-border)] pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    className={`text-base sm:text-xl font-bold ${
                      isCardApproved
                        ? 'text-[#38bdf8]'
                        : briefingMode === 'edicao'
                          ? 'text-purple-300'
                          : 'text-[var(--ui-accent)]'
                    }`}
                  >
                    {briefingMode === 'edicao'
                      ? `Edição do Vídeo ${String(index + 1).padStart(2, '0')}`
                      : `Vídeo ${String(index + 1).padStart(2, '0')}`}
                  </h3>
                  {isCardApproved && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Validado</span>
                    </span>
                  )}
                  {briefingMode === 'edicao' && activeEditorModel && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-200 border border-purple-500/30">
                      Editora: {activeEditorModel.nome}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Botão exclusivo para Vitor Cordoba: Aprovar este card de vídeo */}
                  {canApproveBriefing && (
                    <button
                      type="button"
                      onClick={() => handleToggleApproveVideoCard(video.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                        isCardApproved
                          ? 'bg-[#38bdf8] text-black shadow-sm hover:bg-sky-300'
                          : 'bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 text-[#38bdf8] border border-[#38bdf8]/40'
                      }`}
                      title="Exclusivo Vitor Cordoba: Aprovar e validar este card de vídeo (borda azul)"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isCardApproved ? 'Aprovado ✓' : 'Aprovar'}</span>
                    </button>
                  )}

                  {!isReadOnly && (
                    <button
                      type="button"
                      aria-label={`Remover vídeo ${index + 1}`}
                      onClick={() => {
                        if (
                          (video.titulo.trim() || video.roteiro.trim() || video.refUrl.trim()) &&
                          !window.confirm('Remover este vídeo e seu briefing?')
                        )
                          return;
                        handleRemoveVideoDraft(video.id);
                        setVideoQuantity(String(Math.max(1, videoDrafts.length - 1)));
                      }}
                      className="text-xs text-zinc-400 hover:text-rose-400 py-1 cursor-pointer"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>

            <label className="text-xs font-semibold flex flex-col gap-1.5">
              Título do vídeo (opcional)
              <input
                aria-label={`Título do vídeo ${index + 1}`}
                readOnly={isReadOnly}
                disabled={isReadOnly}
                value={video.titulo}
                onChange={(event) => handleUpdateVideoDraft(video.id, { titulo: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    videoInputs.current[video.id]?.focus();
                  }
                }}
                placeholder={
                  briefingMode === 'edicao'
                    ? `Ex: Reel ${index + 1} - Cortes dinâmicos do prato`
                    : `Ideia do vídeo ${index + 1}`
                }
                className="w-full min-w-0 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-page)] px-3 py-2 text-sm sm:text-base read-only:opacity-80"
              />
            </label>

            <label className="text-xs font-semibold flex flex-col gap-2 flex-1">
              {briefingMode === 'edicao'
                ? 'Briefing de Edição (Cortes, Gancho, Áudio/Trilha, Legenda e CTA)'
                : 'Briefing de Gravação'}
              <textarea
                ref={(element) => {
                  videoInputs.current[video.id] = element;
                }}
                aria-label={`Briefing do vídeo ${index + 1}`}
                readOnly={isReadOnly}
                disabled={isReadOnly}
                rows={7}
                value={video.roteiro}
                onChange={(event) => handleUpdateVideoDraft(video.id, { roteiro: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    advanceVideo(index);
                  }
                }}
                placeholder={
                  briefingMode === 'edicao'
                    ? 'Descreva como a modelo deve editar este vídeo: gancho nos 3 primeiros segundos, ritmo dos cortes, música/áudio em alta, estilo de legenda e chamada final…'
                    : 'O que gravar, cenas e falas…'
                }
                className="w-full min-w-0 flex-1 resize-y rounded-xl border border-[var(--ui-border)] bg-[var(--ui-page)] px-3 py-3 text-base leading-relaxed read-only:opacity-85"
              />
            </label>

            <label className="text-xs font-semibold flex flex-col gap-2">
              {briefingMode === 'edicao'
                ? 'Link de referência ou pasta de brutos'
                : 'Link de referência'}
              <input
                aria-label={`Referência do vídeo ${index + 1}`}
                readOnly={isReadOnly}
                disabled={isReadOnly}
                type="url"
                value={video.refUrl}
                onChange={(event) => handleUpdateVideoDraft(video.id, { refUrl: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    advanceVideo(index);
                  }
                }}
                placeholder="https://…"
                className="w-full min-w-0 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-page)] px-3 py-2 text-base read-only:opacity-80"
              />
            </label>

            {video.refUrl.trim() && (
              <a
                href={normalizarUrl(video.refUrl.trim())}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[var(--ui-accent)] hover:underline break-all"
              >
                Abrir link: {exibirUrl(video.refUrl.trim())}
              </a>
            )}

            {(video.refsExtras || []).map((ref, i) => (
              <a
                key={i}
                href={normalizarUrl(ref.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--ui-accent)] break-all"
              >
                {ref.rotulo}: {exibirUrl(ref.url)}
              </a>
            ))}
          </article>
          );
        })}
      </div>

      {!isReadOnly && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            aria-label={`Adicionar vídeo ${videoDrafts.length + 1}`}
            onClick={handleAddAnotherVideo}
            className="flex-1 rounded-xl border border-dashed border-[var(--ui-accent)] py-3 px-4 text-sm font-semibold text-[var(--ui-accent)] cursor-pointer hover:bg-[var(--ui-accent)]/10"
          >
            {briefingMode === 'edicao'
              ? `+ Fazer Briefing de Edição do Vídeo ${videoDrafts.length + 1}`
              : `+ Fazer Briefing do Vídeo ${videoDrafts.length + 1}`}
          </button>
          <button
            type="button"
            onClick={handleSaveBriefing}
            className="gradient-cta rounded-xl py-3 px-5 text-sm font-bold text-white cursor-pointer"
          >
            {briefingMode === 'edicao' ? 'Salvar todos os briefings de edição' : 'Salvar todos os briefings'}
          </button>
        </div>
      )}

      {/* Pré-visualização Folha A4 (Idêntico ao documento padrão "Briefing - Flor do Paraíso.pdf") */}
      {showPdfPreview && (
        <div className="p-4 sm:p-8 rounded-3xl overflow-x-auto bg-[#15100d] border border-[rgba(255,116,31,0.25)] flex justify-center">
          <div
            ref={previewContainerRef}
            className="flex flex-col gap-7 items-center"
            style={{ fontFamily: 'var(--font-body), "Instrument Sans", sans-serif' }}
          >
            <BriefingDocumentPages
              doc={buildBriefingDocumentData(activeEvent, {
                clientName: displayClient,
                mode: briefingMode,
                drafts: videoDrafts,
              })}
            />
          </div>
        </div>
      )}
      {createBriefingModal}
    </div>
  );
}
