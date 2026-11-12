'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { todayInSaoPaulo } from '@/lib/date-utils';
import { EventItem, EVENT_TYPE_LABELS, Employee } from '@/types/database';
import { EmployeeBadge } from '../agenda/EmployeeBadge';
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
} from 'lucide-react';

export interface BriefingRefItem {
  rotulo: 'Referência' | 'Exemplo';
  url: string;
}

export interface BriefingVideoItem {
  n: number;
  text: string;
  refs: BriefingRefItem[];
}

export interface BriefingUrlPart {
  type: 'text' | 'link';
  value: string;
  href?: string;
  display?: string;
}

export interface EditableVideoDraft {
  id: string;
  titulo: string;
  formato: string;
  roteiro: string;
  refRotulo: 'Referência' | 'Exemplo';
  refUrl: string;
  modeloEditoraId?: string;
  refsExtras?: BriefingRefItem[];
}

export type BriefingCategoryMode = 'video' | 'edicao';

export interface BriefingViewProps {
  initialMode?: BriefingCategoryMode;
}

const VIDEO_FORMATS = [
  'Automático',
  'POV',
  'ASMR',
  'Foodporn',
  'Trend',
  'Situação',
  'Entrevista',
  'Preparo',
  'Tutorial',
  'Falado',
  'Conteúdo',
] as const;

const EDITING_FORMATS = [
  'Automático',
  'Cortes Rápidos / Dinâmico',
  'ASMR',
  'Trend / Áudio em Alta',
  'Foodporn / Slow Motion',
  'Storytelling',
  'Legenda Dinâmica',
  'POV',
  'Narrado / Voiceover',
  'Conteúdo',
] as const;

const RE_URL = /((?:https?:\/\/|www\.)[^\s<>"']+)/;
const RE_ROTULADO =
  /(refer[eê]ncias?|ref|exemplos?|ex)\s*:?\s*((?:https?:\/\/|www\.|(?:instagram\.com|tiktok\.com|vt\.tiktok\.com|youtube\.com|youtu\.be)\/)[^\s<>"']+)/gi;

export function normalizarUrl(u: string): string {
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export function exibirUrl(u: string): string {
  return u.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

export function fmtDate(v: string): string {
  if (!v) return '';
  const parts = v.split('-');
  if (parts.length !== 3) return v;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

export function inferCategory(t: string): string {
  const s = t.toLowerCase();
  if (s.includes('asmr')) return 'ASMR';
  if (s.includes('foodporn') || s.includes('food porn') || s.includes('slow motion')) return 'Foodporn';
  if (s.includes('cortes rápidos') || s.includes('dinâmico') || s.includes('dinamico')) return 'Dinâmico';
  if (s.includes('legenda')) return 'Legenda Dinâmica';
  if (s.includes('storytelling') || s.includes('narrado') || s.includes('voiceover')) return 'Storytelling';
  if (s.includes('entrevist') || s.includes('perguntar') || s.includes('ele responder')) return 'Entrevista';
  if (s.includes('pov') || s.includes('óculos meta') || s.includes('oculos meta')) return 'POV';
  if (
    s.includes('cliente:') ||
    s.includes('cliente "') ||
    s.includes('cliente \u201c') ||
    s.includes('comanda') ||
    s.includes('pedir para') ||
    s.includes('fingir') ||
    s.includes('simular') ||
    s.includes('situação') ||
    s.includes('situacao')
  )
    return 'Situação';
  if (s.includes('música em alta') || s.includes('musica em alta') || s.includes('trend')) return 'Trend';
  if (
    s.includes('passo a passo') ||
    s.includes('como eu faço') ||
    s.includes('como eu faco') ||
    s.includes('tutorial')
  )
    return 'Tutorial';
  if (s.includes('prepar')) return 'Preparo';
  if (s.includes('apresentando') || s.includes('falando') || s.includes('mostrar todos')) return 'Falado';
  return 'Conteúdo';
}

export function inferSub(t: string): string {
  const s = t.toLowerCase();
  if (s.includes('carro')) return 'No carro';
  if (s.includes('oriental') || s.includes('sushi') || s.includes('japon')) return 'Linha oriental';
  if (s.includes('pastel')) return 'Linha de pastel';
  if (s.includes('hambúrg') || s.includes('hamburg')) return 'Hamburgueria';
  if (s.includes('óculos meta') || s.includes('oculos meta')) return 'Institucional • Óculos Meta';
  if (s.includes('fábrica') || s.includes('fabrica') || s.includes('24print')) return 'Institucional';
  return 'Geral';
}

export function extrairRefs(texto: string): { texto: string; refs: BriefingRefItem[] } {
  const refs: BriefingRefItem[] = [];
  const limpo = texto.replace(RE_ROTULADO, (_m, rot: string, url: string) => {
    refs.push({
      rotulo: /^ref/i.test(rot) ? 'Referência' : 'Exemplo',
      url: normalizarUrl(url),
    });
    return '';
  });
  return {
    texto: limpo
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
    refs,
  };
}

export function parseBodyWithLinks(texto: string): BriefingUrlPart[] {
  const re = new RegExp(RE_URL.source, 'g');
  const parts: BriefingUrlPart[] = [];
  let ultimo = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    if (m.index > ultimo) {
      parts.push({ type: 'text', value: texto.slice(ultimo, m.index) });
    }
    const rawUrl = m[1];
    parts.push({
      type: 'link',
      value: rawUrl,
      href: normalizarUrl(rawUrl),
      display: exibirUrl(rawUrl),
    });
    ultimo = m.index + rawUrl.length;
  }
  if (ultimo < texto.length) {
    parts.push({ type: 'text', value: texto.slice(ultimo) });
  }
  return parts;
}

const ALL_KNOWN_FORMATS = new Set<string>([...VIDEO_FORMATS, ...EDITING_FORMATS]);

function stripLegacyFormatPrefix(text: string): string {
  const m = text.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
  if (m && ALL_KNOWN_FORMATS.has(m[1].trim())) {
    return m[2].trim();
  }
  return text;
}

export function parseItems(raw: string): BriefingVideoItem[] {
  const normalized = raw.replace(/\r/g, '').trim();
  if (!normalized) return [];

  const starts = [...normalized.matchAll(/(?:^|\n)\s*(\d+)\s*[-.)]\s*/g)];
  const montar = (bruto: string, n: number): BriefingVideoItem => {
    const { texto, refs } = extrairRefs(bruto.trim());
    return { n, text: stripLegacyFormatPrefix(texto), refs };
  };

  if (!starts.length) {
    const rawBlocks = normalized.split(/\n\s*\n+/).filter(Boolean);
    const merged: BriefingVideoItem[] = [];
    for (const block of rawBlocks) {
      const parsed = extrairRefs(block.trim());
      const cleanText = stripLegacyFormatPrefix(parsed.texto);
      if (!cleanText && parsed.refs.length > 0 && merged.length > 0) {
        merged[merged.length - 1].refs.push(...parsed.refs);
      } else {
        merged.push({
          n: merged.length + 1,
          text: cleanText,
          refs: parsed.refs,
        });
      }
    }
    return merged;
  }

  return starts.map((m, i) => {
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < starts.length ? (starts[i + 1].index ?? normalized.length) : normalized.length;
    return montar(normalized.slice(start, end), Number(m[1]));
  });
}

export function draftsFromRaw(raw?: string | null): EditableVideoDraft[] {
  if (!raw || !raw.trim()) {
    return [
      {
        id: 'video-1',
        titulo: '',
        formato: 'Automático',
        roteiro: '',
        refRotulo: 'Referência',
        refUrl: '',
      },
    ];
  }
  const parsed = parseItems(raw);
  if (parsed.length === 0) {
    return [
      {
        id: 'video-1',
        titulo: '',
        formato: 'Automático',
        roteiro: '',
        refRotulo: 'Referência',
        refUrl: '',
      },
    ];
  }
  return parsed.map((item, idx) => {
    let text = stripLegacyFormatPrefix(item.text);
    const formato = 'Automático';
    let titulo = '';

    // Extrai prefixo opcional "Título: " na primeira linha se curto
    const titleMatch = text.match(/^([^\n:]{1,60}):\s*([\s\S]+)$/);
    if (titleMatch && !/^https?$/i.test(titleMatch[1].trim())) {
      titulo = titleMatch[1].trim();
      text = titleMatch[2].trim();
    }

    return {
      id: `video-${idx + 1}-${Date.now()}`,
      titulo,
      formato,
      roteiro: text,
      refRotulo: item.refs[0]?.rotulo || 'Referência',
      refUrl: item.refs[0]?.url || '',
      refsExtras: item.refs.slice(1),
    };
  });
}

export function loadEventBriefingDrafts(ev: Partial<EventItem>, mode: BriefingCategoryMode): EditableVideoDraft[] {
  const sourceVideos = mode === 'edicao' ? ev.briefing_edicao_videos : ev.briefing_videos;
  const sourceRaw = mode === 'edicao' ? ev.briefing_edicao : ev.briefing_gravacao;

  if (sourceVideos && sourceVideos.length > 0) {
    return sourceVideos.map((video, index) => ({
      ...video,
      formato: 'Automático',
      roteiro: stripLegacyFormatPrefix(video.roteiro || ''),
      id: `video-${index + 1}-${crypto.randomUUID()}`,
    }));
  }
  return draftsFromRaw(sourceRaw);
}

export function serializeDraftsToRaw(drafts: EditableVideoDraft[]): string {
  const valid = drafts.filter((d) => d.roteiro.trim() || d.titulo.trim() || d.refUrl.trim());
  if (valid.length === 0) return '';

  return valid
    .map((d, idx) => {
      const num = idx + 1;
      const prefixTitle = d.titulo.trim() ? `${d.titulo.trim()}: ` : '';
      const mainBody = `${num} - ${prefixTitle}${d.roteiro.trim()}`.trim();
      const refLine = d.refUrl.trim() ? `\n${d.refRotulo}: ${normalizarUrl(d.refUrl.trim())}` : '';
      return `${mainBody}${refLine}${(d.refsExtras || []).map((ref) => `\n${ref.rotulo}: ${ref.url}`).join('')}`;
    })
    .join('\n\n');
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

function NavegandoBrandLogo() {
  return (
    <svg
      style={{ height: 48, width: 'auto', display: 'block' }}
      viewBox="0 0 1084 613"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Navegando MKT"
    >
      <path
        d="M11.1492 564.243V449.566H30.5806L83.7782 530.397V449.566H103.21V564.243H83.7782L30.5806 483.411V564.243H11.1492ZM136.78 566.632C130.569 566.632 125.313 565.464 121.012 563.128C116.712 560.739 113.447 557.58 111.217 553.651C109.04 549.723 107.952 545.396 107.952 540.671C107.952 536.529 108.642 532.813 110.022 529.521C111.403 526.177 113.526 523.31 116.393 520.921C119.26 518.478 122.977 516.487 127.543 514.948C130.994 513.833 135.028 512.824 139.647 511.922C144.319 511.019 149.363 510.196 154.778 509.453C160.247 508.656 165.954 507.807 171.9 506.904L165.052 510.807C165.105 504.86 163.777 500.48 161.07 497.667C158.362 494.853 153.796 493.446 147.372 493.446C143.497 493.446 139.754 494.348 136.143 496.153C132.533 497.959 130.011 501.064 128.578 505.471L111.058 499.976C113.181 492.702 117.216 486.862 123.163 482.456C129.162 478.049 137.232 475.846 147.372 475.846C155.017 475.846 161.733 477.094 167.52 479.589C173.36 482.084 177.687 486.172 180.501 491.853C182.041 494.879 182.97 497.985 183.289 501.171C183.607 504.303 183.766 507.727 183.766 511.444V564.243H166.963V545.608L169.75 548.634C165.875 554.846 161.335 559.412 156.132 562.332C150.982 565.199 144.532 566.632 136.78 566.632ZM140.603 551.342C144.957 551.342 148.673 550.572 151.752 549.032C154.832 547.493 157.274 545.608 159.079 543.378C160.937 541.148 162.185 539.051 162.822 537.087C163.831 534.645 164.388 531.857 164.494 528.725C164.653 525.54 164.733 522.965 164.733 521L170.626 522.752C164.839 523.655 159.875 524.451 155.734 525.141C151.593 525.832 148.036 526.495 145.063 527.132C142.09 527.716 139.462 528.38 137.179 529.123C134.949 529.92 133.064 530.849 131.524 531.91C129.985 532.972 128.79 534.193 127.941 535.574C127.144 536.954 126.746 538.573 126.746 540.432C126.746 542.555 127.277 544.44 128.339 546.086C129.401 547.679 130.94 548.953 132.958 549.908C135.028 550.864 137.577 551.342 140.603 551.342ZM211.901 564.243L180.683 478.235H199.875L221.537 540.591L243.118 478.235H262.391L231.173 564.243H211.901ZM299.932 566.632C291.225 566.632 283.58 564.748 276.997 560.978C270.413 557.209 265.263 551.979 261.547 545.29C257.884 538.6 256.052 530.902 256.052 522.195C256.052 512.798 257.857 504.648 261.467 497.746C265.078 490.791 270.095 485.402 276.519 481.58C282.943 477.757 290.376 475.846 298.817 475.846C307.737 475.846 315.302 477.943 321.514 482.137C327.779 486.278 332.424 492.145 335.45 499.737C338.476 507.329 339.618 516.275 338.875 526.575H319.841V519.567C319.788 510.223 318.142 503.4 314.904 499.1C311.665 494.8 306.569 492.649 299.614 492.649C291.756 492.649 285.916 495.092 282.093 499.976C278.271 504.807 276.359 511.895 276.359 521.239C276.359 529.946 278.271 536.689 282.093 541.467C285.916 546.245 291.491 548.634 298.817 548.634C303.542 548.634 307.604 547.599 311.002 545.528C314.453 543.405 317.107 540.352 318.965 536.37L337.919 542.104C334.627 549.855 329.531 555.881 322.629 560.182C315.78 564.482 308.214 566.632 299.932 566.632ZM270.307 526.575V512.081H329.477V526.575H270.307ZM380.057 604.858C375.279 604.858 370.686 604.115 366.28 602.628C361.926 601.142 357.998 598.992 354.493 596.178C350.989 593.417 348.123 590.072 345.893 586.143L363.572 577.383C365.218 580.516 367.527 582.825 370.501 584.312C373.527 585.851 376.739 586.621 380.137 586.621C384.118 586.621 387.676 585.904 390.808 584.471C393.94 583.091 396.356 581.02 398.055 578.259C399.807 575.552 400.63 572.154 400.524 568.066V543.617H402.913V478.235H419.716V568.384C419.716 570.561 419.61 572.632 419.398 574.596C419.238 576.613 418.946 578.578 418.522 580.489C417.248 586.064 414.805 590.63 411.195 594.187C407.585 597.797 403.099 600.478 397.736 602.23C392.427 603.982 386.534 604.858 380.057 604.858ZM378.385 566.632C370.474 566.632 363.572 564.641 357.679 560.659C351.786 556.678 347.22 551.262 343.981 544.414C340.743 537.565 339.124 529.84 339.124 521.239C339.124 512.532 340.743 504.781 343.981 497.985C347.273 491.136 351.919 485.747 357.918 481.819C363.917 477.837 370.978 475.846 379.101 475.846C387.277 475.846 394.126 477.837 399.648 481.819C655.214 485.747 659.435 491.136 662.302 497.985C665.169 504.834 666.603 512.585 666.603 521.239C666.603 529.787 665.169 537.512 662.302 544.414C659.435 551.262 655.161 556.678 649.481 560.659C643.8 564.641 636.765 566.632 628.377 566.632ZM784.314 564.243V449.566H801.595L841.254 530.796L880.914 449.566H898.195V564.243H880.276V490.738L845.077 564.243H837.432L802.312 490.738V564.243H784.314ZM907.826 564.243V449.566H927.018V502.763L972.81 449.566H996.382L947.087 505.79L999.727 564.243H975.358L927.018 510.727V564.243H907.826ZM1025.76 564.243V467.564H988.651V449.566H1082.07V467.564H1044.95V564.243H1025.76Z"
        fill="#FE731B"
      />
      <path
        d="M365.667 356.453C420.323 318.867 498.567 365.986 530.858 394.243C515.358 267.595 533.917 78.6444 545.133 0C377.903 29.415 355.81 249.892 365.667 356.453Z"
        fill="#FE731B"
      />
      <path
        d="M556.35 394.243C643.364 375.859 766.203 284.345 561.448 65.3667C590.679 132.436 630.583 292.108 556.35 394.243Z"
        fill="#FE731B"
      />
    </svg>
  );
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
    currentView,
    setCurrentView,
  } = useAgenda();

  // Categoria ativa dentro de Briefing: 'video' (Briefing do Vídeo) ou 'edicao' (Briefing de Edição - Modelos)
  const [briefingMode, setBriefingMode] = useState<BriefingCategoryMode>(
    initialMode || (currentView === 'briefing-edicao' ? 'edicao' : 'video')
  );

  useEffect(() => {
    if (initialMode) {
      setBriefingMode(initialMode);
    } else if (currentView === 'briefing-edicao') {
      setBriefingMode('edicao');
    } else if (currentView === 'briefing') {
      setBriefingMode('video');
    }
  }, [initialMode, currentView]);

  // Regras de permissão:
  // - Modelos podem editar APENAS o Briefing de Edição (no Briefing do Vídeo têm acesso somente leitura)
  // - Todos os outros membros podem alterar o Briefing dos Vídeos
  const currentMember = useMemo(
    () => employees.find((e) => e.id === loggedEmployeeId) || null,
    [employees, loggedEmployeeId]
  );
  const isModelMember = currentMember?.funcao === 'modelo' || currentMember?.funcao === 'criadora';
  const isReadOnly = briefingMode === 'video' ? isModelMember : false;

  // Modelos responsáveis pela edição dos vídeos
  const modelEmployees = useMemo(
    () => employees.filter((e) => e.funcao === 'modelo' || e.funcao === 'criadora'),
    [employees]
  );

  const resolveEventEditorModel = useCallback(
    (ev: EventItem): Employee | null => {
      if (ev.modelo_editora_id) {
        const explicit = employees.find((e) => e.id === ev.modelo_editora_id);
        if (explicit) return explicit;
      }
      const fromVideo = ev.briefing_edicao_videos?.find((v) => v.modeloEditoraId)?.modeloEditoraId;
      if (fromVideo) {
        const found = employees.find((e) => e.id === fromVideo);
        if (found) return found;
      }
      const assignedModelId = (ev.assigned_employee_ids || []).find((id) =>
        modelEmployees.some((m) => m.id === id)
      );
      if (assignedModelId) {
        return modelEmployees.find((m) => m.id === assignedModelId) || null;
      }
      return modelEmployees[0] || null;
    },
    [employees, modelEmployees]
  );

  // Filtro de busca e status na tela de cards de compromissos
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendentes' | 'feitos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');

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
      videoInputs.current[focusVideoId.current]?.focus();
      focusVideoId.current = null;
    }
  }, [videoDrafts]);

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
      .filter((emp) => emp.funcao === 'modelo' || emp.funcao === 'criadora' || emp.funcao === 'filmmaker')
      .map((emp) => {
        const memberEvents = recordingEvents.filter(
          (ev) =>
            (ev.assigned_employee_ids || []).includes(emp.id) ||
            ev.modelo_editora_id === emp.id ||
            resolveEventEditorModel(ev)?.id === emp.id
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
  }, [recordingEvents, employees, resolveEventEditorModel]);

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
        const editorModel = (resolveEventEditorModel(ev)?.nome || '').toLowerCase();
        return clientName.includes(q) || local.includes(q) || dateStr.includes(q) || editorModel.includes(q);
      }
      return true;
    });
  }, [recordingEvents, statusFilter, searchQuery, clients, isEventDoneForMode, resolveEventEditorModel]);

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
    if (currentView === 'briefing' && nextMode === 'edicao') {
      setCurrentView('briefing-edicao');
    } else if (currentView === 'briefing-edicao' && nextMode === 'video') {
      setCurrentView('briefing');
    }
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
    setVideoDrafts((prev) => [...prev, video]);
    setVideoQuantity(String(videoDrafts.length + 1));
    focusVideoId.current = video.id;
  };

  const advanceVideo = (index: number) => {
    if (isReadOnly) return;
    if (index + 1 < videoDrafts.length) videoInputs.current[videoDrafts[index + 1].id]?.focus();
    else handleAddAnotherVideo();
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

  // Texto bruto consolidado para o evento e para o PDF A4
  const serializedRawText = useMemo(() => serializeDraftsToRaw(videoDrafts), [videoDrafts]);
  const parsedPreviewItems = useMemo(() => parseItems(serializedRawText), [serializedRawText]);
  const formatsCount = useMemo(
    () => new Set(parsedPreviewItems.map((i) => inferCategory(i.text))).size,
    [parsedPreviewItems]
  );
  const pages = useMemo(() => {
    const list: BriefingVideoItem[][] = [];
    for (let i = 0; i < parsedPreviewItems.length; i += 4) {
      list.push(parsedPreviewItems.slice(i, i + 4));
    }
    if (list.length === 0) list.push([]);
    return list;
  }, [parsedPreviewItems]);

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
      refsExtras: video.refsExtras,
    }));

    const updatedEvent: EventItem =
      briefingMode === 'edicao'
        ? {
            ...activeEvent,
            briefing_edicao_videos: mappedVideos,
            briefing_edicao: raw || null,
            modelo_editora_id: selectedEditorModelId || activeEvent.modelo_editora_id || null,
          }
        : {
            ...activeEvent,
            briefing_videos: mappedVideos,
            briefing_gravacao: raw || null,
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

  // Monta o documento formatado do Briefing do Vídeo para o Cliente visualizar
  const buildClientDocumentText = useCallback(
    (ev: EventItem, draftsToFormat?: EditableVideoDraft[]) => {
      const clientObj = ev.client || clients.find((c) => c.id === ev.client_id);
      const nomeCliente = clientObj?.nome || 'Restaurante Parceiro';
      const dataFmt = fmtDate(ev.data);
      const horario = `${ev.hora_inicio.slice(0, 5)} às ${ev.hora_fim.slice(0, 5)}`;

      const items = draftsToFormat
        ? draftsToFormat.filter((d) => d.roteiro.trim() || d.titulo.trim())
        : draftsFromRaw(ev.briefing_gravacao).filter((d) => d.roteiro.trim() || d.titulo.trim());

      const header = [
        `📋 *DOCUMENTO DE BRIEFING DE GRAVAÇÃO — NAVEGANDO MKT*`,
        `🍽️ *Cliente:* ${nomeCliente}`,
        `📅 *Data da Gravação:* ${dataFmt} (${horario})`,
        `🎬 *Total de Vídeos Planejados:* ${items.length}`,
        `----------------------------------------`,
      ].join('\n');

      const body =
        items.length > 0
          ? items
              .map((v, idx) => {
                const num = String(idx + 1).padStart(2, '0');
                const titlePart = v.titulo.trim() ? ` — *${v.titulo.trim()}*` : '';
                const refPart = v.refUrl.trim() ? `\n🔗 Referência: ${normalizarUrl(v.refUrl.trim())}` : '';
                return `🎥 *VÍDEO ${num}*${titlePart}\n${v.roteiro.trim() || 'Roteiro em definição.'}${refPart}`;
              })
              .join('\n\n')
          : 'Roteiros em preparação pela equipe Navegando MKT.';

      const footer = [
        `----------------------------------------`,
        `✅ *Documento gerado pela Central Criativa Navegando MKT para visualização e alinhamento com o cliente.*`,
      ].join('\n');

      return `${header}\n\n${body}\n\n${footer}`;
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
    const rawDigits = (clientObj?.contato || '').replace(/\D/g, '');
    const phone =
      rawDigits.length >= 10
        ? rawDigits.startsWith('55')
          ? rawDigits
          : `55${rawDigits}`
        : '';
    const encoded = encodeURIComponent(docText);
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    toast('Abrindo WhatsApp com o documento de briefing para o cliente visualizar!');
  };

  // Geração de PDF A4 para o compromisso aberto
  const gerarPdfBlob = useCallback(async (): Promise<Blob> => {
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    const container = previewContainerRef.current;
    if (!container) throw new Error('Ative a visualização A4 para gerar o PDF.');
    const paginas = Array.from(container.querySelectorAll<HTMLElement>('.briefing-a4-page'));
    if (!paginas.length) throw new Error('Nada para gerar.');

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas-pro'),
      import('jspdf'),
    ]);

    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true,
    });

    for (let i = 0; i < paginas.length; i++) {
      let links: Array<{ url: string; x: number; y: number; w: number; h: number }> = [];
      const canvas = await html2canvas(paginas[i], {
        scale: 2,
        backgroundColor: '#0A0705',
        useCORS: true,
        logging: false,
        onclone: (_doc, el) => {
          el.style.transform = 'none';
          const base = el.getBoundingClientRect();
          links = Array.from(el.querySelectorAll<HTMLAnchorElement>('a[href^="http"]')).flatMap(
            (a) =>
              Array.from(a.getClientRects()).map((r) => ({
                url: a.href,
                x: (r.left - base.left) / base.width,
                y: (r.top - base.top) / base.height,
                w: r.width / base.width,
                h: r.height / base.height,
              }))
          );
        },
      });
      if (i > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.94), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      links.forEach((l) => {
        pdf.link(l.x * 210, l.y * 297, l.w * 210, l.h * 297, { url: l.url });
      });
    }

    return pdf.output('blob');
  }, []);

  const baixarBlob = (blob: Blob, nome: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const handleDownloadOrSharePdf = async (mode: 'download' | 'share', forClientDoc = false) => {
    if (!showPdfPreview) {
      setShowPdfPreview(true);
      await new Promise((r) => setTimeout(r, 250));
    }
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setStatusMsg(forClientDoc ? 'Preparando Documento A4 do Cliente...' : 'Gerando PDF A4...');
    try {
      const blob = await gerarPdfBlob();
      const cleanName = (activeClient?.nome || 'Restaurante').replace(/[\/\\:*?"<>|]/g, '-');
      const prefix =
        briefingMode === 'edicao'
          ? 'Briefing de Edicao'
          : forClientDoc
            ? 'Documento do Cliente - Briefing'
            : 'Briefing de Gravacao';
      const fileName = `${prefix} - ${cleanName} - ${activeEvent?.data || ''}.pdf`;

      if (mode === 'share') {
        const file = new File([blob], fileName, { type: 'application/pdf' });
        if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: fileName });
          setStatusMsg('Documento PDF compartilhado com sucesso!');
          return;
        }
      }
      baixarBlob(blob, fileName);
      setStatusMsg(
        forClientDoc
          ? 'Documento PDF do cliente baixado! Pronto para enviar ao restaurante.'
          : 'PDF baixado com sucesso!'
      );
    } catch (e) {
      setStatusMsg('Erro ao gerar PDF: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsGeneratingPdf(false);
    }
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
                onClick={() => openNewEventModal()}
                className="px-3.5 py-2.5 rounded-xl gradient-cta text-foreground font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Gravação</span>
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
        </div>

        {/* Grid de Cards dos Compromissos dos Restaurantes */}
        {filteredEvents.length === 0 ? (
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
              const restaurantRecordings = recordingEvents.filter((event) => event.client_id === ev.client_id);
              const videoCount = restaurantRecordings.reduce(
                (sum, event) => sum + countEventVideosForMode(event),
                0
              );
              const assignedMembers = (ev.assigned_employee_ids || [])
                .map((id) => employees.find((emp) => emp.id === id))
                .filter(Boolean);
              const editorModel = resolveEventEditorModel(ev);
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
                  className={`group min-w-0 rounded-2xl p-4 sm:p-5 bg-[var(--ui-surface)] border transition-all cursor-pointer flex flex-col justify-between gap-4 hover:-translate-y-0.5 shadow-lg ${
                    done
                      ? 'border-emerald-500/35 hover:border-emerald-400/70'
                      : briefingMode === 'edicao'
                        ? 'border-purple-500/35 hover:border-purple-400'
                        : 'border-amber-500/35 hover:border-[var(--ui-accent)]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Topo do Card: Nome do Restaurante + Status (Pendente ou Feito) */}
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span
                          className={`inline-block text-[10px] font-extrabold uppercase tracking-wider mb-0.5 ${
                            briefingMode === 'edicao' ? 'text-purple-300' : 'text-[var(--ui-accent)]'
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

                      {done ? (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{briefingMode === 'edicao' ? 'Edição Feita' : 'Briefing Feito'}</span>
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pendente</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-zinc-400">
                        {restaurantRecordings.length}{' '}
                        {restaurantRecordings.length === 1 ? 'compromisso' : 'compromissos'} · {videoCount}{' '}
                        {briefingMode === 'edicao' ? 'vídeos para editar' : 'vídeos planejados'}
                      </p>

                      {/* Destaque da Modelo Responsável pela Edição */}
                      {editorModel && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/25 text-[11px] font-bold text-purple-200">
                          <Scissors className="w-3 h-3 text-purple-400" />
                          <span>Edição: {editorModel.nome}</span>
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

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* Atalho rápido para compartilhar documento do vídeo com o cliente */}
                      {briefingMode === 'video' && done && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareClientWhatsApp(ev);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          title="Enviar documento de briefing para o cliente visualizar no WhatsApp"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Enviar p/ Cliente</span>
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
      </div>
    );
  }

  // ============================================================================
  // VISÃO 2: EDITOR DE BRIEFINGS SEPARADOS POR VÍDEO DO RESTAURANTE SELECIONADO
  // ============================================================================
  const displayClient = activeClient?.nome || 'Restaurante';
  const displayDate = fmtDate(activeEvent.data);
  const isCurrentlyDone = isEventDoneForMode(activeEvent);
  const activeEditorModel =
    employees.find((e) => e.id === selectedEditorModelId) || resolveEventEditorModel(activeEvent);

  return (
    <div className="space-y-6">
      {renderCategorySwitcher()}
      {renderModelReadOnlyBanner()}

      {/* Barra Superior do Compromisso Selecionado */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
            <span>Compartilhar PDF</span>
          </button>

          {!isReadOnly && (
            <button
              type="button"
              onClick={handleSaveBriefing}
              aria-label="Salvar briefings"
              className="px-5 py-2.5 rounded-xl gradient-cta text-white font-extrabold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>
                {briefingMode === 'edicao'
                  ? `Salvar Briefing de Edição (${videoDrafts.length} ${videoDrafts.length === 1 ? 'Vídeo' : 'Vídeos'})`
                  : `Salvar Briefing (${videoDrafts.length} ${videoDrafts.length === 1 ? 'Vídeo' : 'Vídeos'})`}
              </span>
            </button>
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
              As modelos são responsáveis pela edição dos vídeos e possuem acesso de visualização a todos os cards separados abaixo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeEditorModel && <EmployeeBadge employee={activeEditorModel} size="md" />}
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
        {videoDrafts.map((video, index) => (
          <article
            key={video.id}
            aria-label={
              briefingMode === 'edicao'
                ? `Briefing de Edição do Vídeo ${index + 1}`
                : `Briefing do Vídeo ${index + 1}`
            }
            className={`min-w-0 rounded-2xl border bg-[var(--ui-surface)] p-4 sm:p-5 flex flex-col gap-3 ${
              briefingMode === 'edicao' ? 'border-purple-500/30' : 'border-[var(--ui-border)]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ui-border)] pb-3">
              <div className="flex items-center gap-2">
                <h3
                  className={`text-base sm:text-xl font-bold ${
                    briefingMode === 'edicao' ? 'text-purple-300' : 'text-[var(--ui-accent)]'
                  }`}
                >
                  {briefingMode === 'edicao'
                    ? `Edição do Vídeo ${String(index + 1).padStart(2, '0')}`
                    : `Vídeo ${String(index + 1).padStart(2, '0')}`}
                </h3>
                {briefingMode === 'edicao' && activeEditorModel && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-200 border border-purple-500/30">
                    Editora: {activeEditorModel.nome}
                  </span>
                )}
              </div>

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
        ))}
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

      {/* Pré-visualização Folha A4 (Documento do Cliente / Guia da Modelo) */}
      {showPdfPreview && (
        <div className="p-4 sm:p-8 rounded-3xl overflow-x-auto bg-[#15100d] border border-[rgba(255,116,31,0.25)] flex justify-center">
          <div
            ref={previewContainerRef}
            className="flex flex-col gap-7 items-center"
            style={{ fontFamily: 'var(--font-body), "Instrument Sans", sans-serif' }}
          >
            {pages.map((chunk, idx) => (
              <section
                key={idx}
                className="briefing-a4-page relative overflow-hidden shrink-0"
                style={{
                  width: 794,
                  height: 1123,
                  background: '#0A0705',
                  color: '#F6F0EA',
                  padding: '40px 44px 36px',
                  boxShadow: '0 20px 70px rgba(0,0,0,.4)',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    height: 48,
                  }}
                >
                  <NavegandoBrandLogo />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      fontSize: '11.5px',
                      letterSpacing: '0.24em',
                      textTransform: 'uppercase',
                      color: 'rgba(246,240,234,0.72)',
                      paddingTop: 7,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>Cliente • {displayClient}</span>
                    <span
                      style={{
                        width: 1,
                        height: 16,
                        background: '#FF741F',
                        opacity: 0.7,
                      }}
                    />
                    <span>{displayDate}</span>
                  </div>
                </div>

                {idx === 0 ? (
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      paddingTop: 14,
                      paddingBottom: 12,
                      borderBottom: '1px solid rgba(255,116,31,0.30)',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '11.5px',
                          letterSpacing: '0.24em',
                          textTransform: 'uppercase',
                          color: '#FF741F',
                          fontWeight: 600,
                          marginBottom: 8,
                        }}
                      >
                        {briefingMode === 'edicao'
                          ? `Briefing de Edição • Editora: ${activeEditorModel?.nome || 'Modelo'}`
                          : 'Documento de Briefing Criativo • Visualização do Cliente'}
                      </div>
                      <h2
                        style={{
                          fontFamily: 'var(--font-title), "Bricolage Grotesque", sans-serif',
                          fontSize: 52,
                          lineHeight: 0.92,
                          letterSpacing: '-0.04em',
                          fontWeight: 700,
                          margin: 0,
                          maxWidth: 540,
                          color: '#F6F0EA',
                        }}
                      >
                        {briefingMode === 'edicao' ? 'Guia de edição' : 'Roteiro de vídeos'}
                        <span style={{ color: '#FF741F', display: 'block' }}>{displayClient}.</span>
                      </h2>
                    </div>

                    <div style={{ display: 'flex', gap: 34, paddingBottom: 4 }}>
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--font-title), "Bricolage Grotesque", sans-serif',
                            color: '#FF741F',
                            fontSize: 56,
                            lineHeight: 0.9,
                            fontWeight: 700,
                          }}
                        >
                          {parsedPreviewItems.length}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: 'rgba(246,240,234,0.76)',
                            marginTop: 8,
                            textTransform: 'uppercase',
                            letterSpacing: '0.14em',
                          }}
                        >
                          vídeos
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gridTemplateRows: '1fr 1fr',
                    gap: 12,
                    marginTop: 14,
                    height: 830,
                  }}
                >
                  {chunk.map((item) => {
                    const bodyParts = parseBodyWithLinks(item.text);

                    return (
                      <article
                        key={item.n}
                        style={{
                          border: '1px solid rgba(255,116,31,0.42)',
                          background: 'rgba(255,116,31,0.045)',
                          borderRadius: 16,
                          padding: 20,
                          minHeight: 0,
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                          <div
                            style={{
                              fontFamily: 'var(--font-title), "Bricolage Grotesque", sans-serif',
                              fontSize: 48,
                              lineHeight: 0.88,
                              color: '#FF741F',
                              fontWeight: 600,
                            }}
                          >
                            {String(item.n).padStart(2, '0')}
                          </div>
                          <div>
                            <span
                              style={{
                                display: 'inline-block',
                                border: '1px solid rgba(255,116,31,0.45)',
                                borderRadius: 999,
                                padding: '4px 10px',
                                fontSize: 12,
                                color: '#F6F0EA',
                              }}
                            >
                              {briefingMode === 'edicao' ? `Edição Vídeo ${item.n}` : `Vídeo ${item.n}`}
                            </span>
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: '16px',
                            lineHeight: 1.45,
                            color: '#F6F0EA',
                            marginTop: 12,
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {bodyParts.map((part, pIdx) =>
                            part.type === 'link' ? (
                              <a
                                key={pIdx}
                                href={part.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#FF741F', fontSize: 13 }}
                              >
                                {part.display}
                              </a>
                            ) : (
                              <React.Fragment key={pIdx}>{part.value}</React.Fragment>
                            )
                          )}
                        </div>

                        {item.refs.map((r, rIdx) => (
                          <div key={rIdx} style={{ marginTop: 10 }}>
                            <div
                              style={{
                                fontSize: '10.5px',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: 'rgba(246,240,234,0.55)',
                              }}
                            >
                              {r.rotulo}
                            </div>
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#FF741F', fontSize: 13, wordBreak: 'break-all' }}
                            >
                              {exibirUrl(r.url)}
                            </a>
                          </div>
                        ))}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
