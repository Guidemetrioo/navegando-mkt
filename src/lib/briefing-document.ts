import type { EventItem } from '@/types/database';

export type BriefingCategoryMode = 'video' | 'edicao';

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
  aprovado?: boolean;
  aprovadoPor?: string;
  aprovadoEm?: string;
  refsExtras?: BriefingRefItem[];
}

export const VIDEO_FORMATS = [
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

export const EDITING_FORMATS = [
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

const ALL_KNOWN_FORMATS = new Set<string>([...VIDEO_FORMATS, ...EDITING_FORMATS]);

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
  ) {
    return 'Situação';
  }
  if (s.includes('música em alta') || s.includes('musica em alta') || s.includes('trend')) return 'Trend';
  if (
    s.includes('passo a passo') ||
    s.includes('como eu faço') ||
    s.includes('como eu faco') ||
    s.includes('tutorial')
  ) {
    return 'Tutorial';
  }
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

export function stripLegacyFormatPrefix(text: string): string {
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
      const isOnlyUrl = /^https?:\/\/\S+$/i.test(cleanText) && cleanText.split(/\s+/).length === 1;
      if (isOnlyUrl && merged.length > 0) {
        merged[merged.length - 1].refs.push({
          rotulo: 'Exemplo',
          url: normalizarUrl(cleanText),
        });
      } else if (!cleanText && parsed.refs.length > 0 && merged.length > 0) {
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

    const titleMatch = text.match(/^([^\n:]{1,60}):\s*([\s\S]+)$/);
    if (titleMatch && !/^https?$/i.test(titleMatch[1].trim())) {
      titulo = titleMatch[1].trim();
      text = titleMatch[2].trim();
    }

    return {
      id: `video-${idx + 1}`,
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
      id: `video-${index + 1}`,
    }));
  }
  return draftsFromRaw(sourceRaw);
}

export function serializeDraftsToRaw(drafts: EditableVideoDraft[]): string {
  const valid = drafts.filter(
    (d) =>
      d.roteiro.trim() ||
      d.titulo.trim() ||
      d.refUrl.trim() ||
      Boolean(d.refsExtras?.some((ref) => ref.url.trim()))
  );
  if (valid.length === 0) return '';

  return valid
    .map((d, idx) => {
      const num = idx + 1;
      const prefixTitle = d.titulo.trim() ? `${d.titulo.trim()}: ` : '';
      const mainBody = `${num} - ${prefixTitle}${d.roteiro.trim()}`.trim();
      const refLine = d.refUrl.trim() ? `\n${d.refRotulo}: ${normalizarUrl(d.refUrl.trim())}` : '';
      return `${mainBody}${refLine}${(d.refsExtras || []).map((ref) => `\n${ref.rotulo}: ${normalizarUrl(ref.url)}`).join('')}`;
    })
    .join('\n\n');
}

export function getBriefingPdfFileName(clientName?: string | null, mode: BriefingCategoryMode = 'video'): string {
  const cleanName = (clientName || 'Restaurante').trim().replace(/[\/\\:*?"<>|]/g, '-');
  return mode === 'edicao'
    ? `Briefing de Edicao - ${cleanName}.pdf`
    : `Briefing - ${cleanName}.pdf`;
}

export interface BriefingDocumentData {
  displayClient: string;
  displayDate: string;
  fileName: string;
  items: BriefingVideoItem[];
  formatsCount: number;
  pages: BriefingVideoItem[][];
}

export function buildBriefingDocumentData(
  ev: Pick<EventItem, 'data' | 'briefing_gravacao' | 'briefing_videos' | 'briefing_edicao' | 'briefing_edicao_videos' | 'client'>,
  options?: {
    clientName?: string | null;
    mode?: BriefingCategoryMode;
    drafts?: EditableVideoDraft[];
  }
): BriefingDocumentData {
  const mode = options?.mode || 'video';
  const displayClient = (options?.clientName || ev.client?.nome || 'Restaurante').trim();
  const displayDate = fmtDate(ev.data) || 'Data em aberto';
  const drafts = options?.drafts ?? loadEventBriefingDrafts(ev, mode);
  const raw = serializeDraftsToRaw(drafts);
  const items = parseItems(raw);
  const formatsCount = new Set(items.map((i) => inferCategory(i.text))).size;

  const pages: BriefingVideoItem[][] = [];
  for (let i = 0; i < items.length; i += 4) {
    pages.push(items.slice(i, i + 4));
  }
  if (pages.length === 0) pages.push([]);

  return {
    displayClient,
    displayDate,
    fileName: getBriefingPdfFileName(displayClient, mode),
    items,
    formatsCount,
    pages,
  };
}
