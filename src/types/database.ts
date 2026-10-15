export type EventTipo = 'gravacao' | 'foto' | 'edicao' | 'reuniao';
export type EventStatus = 'agendado' | 'realizado' | 'cancelado';
export type UserRole = 'admin' | 'funcionario';
export type TeamRole = 'filmmaker' | 'criadora';

export interface Employee {
  id: string;
  nome: string;
  cor: number; // HSL Hue
  funcao?: TeamRole; // 'filmmaker' (Filmmaker / Câmera) ou 'criadora' (Meninas que gravam / Apresentação)
  ativo: boolean;
  created_at?: string;
}

export interface Client {
  id: string;
  nome: string;
  contato?: string | null;
  endereco?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  observacoes?: string | null;
  instagram_handle?: string;
  drive_folder_url?: string; // Pasta do Google Drive com brutos e editados
  responsavel?: string; // Nome do gerente / contato no restaurante
  telefone?: string; // Telefone / WhatsApp do restaurante
  created_at?: string;
}

// ==========================================
// TIPOS: PONTO ELETRÔNICO & GEOLOCALIZAÇÃO
// ==========================================

export type PontoTipo = 'entrada' | 'saida';
export type PontoStatus = 'no_local' | 'fora_do_raio' | 'manual';

export interface PontoRegistro {
  id: string;
  employee_id: string;
  event_id?: string | null;
  client_id?: string | null;
  tipo: PontoTipo; // 'entrada' ou 'saida'
  data_hora: string; // ISO 8601 string com data e hora exatas
  foto_url: string; // Data URL Base64 ou URL da foto capturada
  latitude: number;
  longitude: number;
  precisao_metros: number;
  distancia_metros?: number; // Distância em metros calculada até o restaurante
  status_localizacao: PontoStatus; // 'no_local' (<300m), 'fora_do_raio', etc.
  endereco?: string; // Endereço real detectado via GPS / reverse geocoding
  observacao?: string;
  created_at: string;
  // Relacionamentos populados
  employee?: Employee;
  client?: Client;
  event?: EventItem;
}

export interface EventItem {
  id: string;
  client_id: string;
  tipo: EventTipo;
  data: string; // YYYY-MM-DD
  hora_inicio: string; // HH:mm or HH:mm:ss
  hora_fim: string; // HH:mm or HH:mm:ss
  local?: string | null;
  observacoes?: string | null;
  status: EventStatus;
  created_at?: string;
  // Relacionamentos carregados
  client?: Client;
  assigned_employee_ids?: string[];
  employees?: Employee[];
}

export interface Profile {
  id: string;
  papel: UserRole;
  employee_id?: string | null;
  created_at?: string;
  employee?: Employee | null;
}

export interface ConflictRecord {
  employee_id: string;
  employee_name: string;
  event_id: string;
  client_name: string;
  hora_inicio: string;
  hora_fim: string;
  local?: string | null;
}

// ==========================================
// TIPOS: INSTAGRAM & MÉTRICAS DE SOCIAL MEDIA
// ==========================================

export interface ClientSocialAccount {
  id: string;
  client_id: string;
  instagram_business_id: string;
  instagram_handle: string;
  profile_picture_url?: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  connected_at: string;
}

export interface ReelMetric {
  id: string;
  client_id: string;
  event_id?: string | null; // Vínculo com a gravação da agenda
  instagram_media_id: string;
  permalink: string;
  thumbnail_url?: string;
  caption: string;
  published_at: string;
  plays: number; // Visualizações do Reel
  reach: number; // Alcance
  likes: number;
  comments: number;
  shares: number;
  saved: number;
  engagement_rate: number;
  // Campos populados
  client?: Client;
  event?: EventItem;
}

export type MentionType = 'POST_TAG' | 'STORY_MENTION' | 'CAPTION_MENTION' | 'COMMENT_MENTION';
export type MentionSentiment = 'positivo' | 'neutro' | 'destaque_gourmet';

export interface ClientMention {
  id: string;
  client_id: string;
  author_username: string;
  author_name?: string;
  author_followers: number;
  is_influencer: boolean;
  mention_type: MentionType;
  media_url?: string;
  permalink?: string;
  caption?: string;
  sentiment: MentionSentiment;
  reposted: boolean;
  reposted_at?: string | null;
  posted_at: string;
  // Relacionamento
  client?: Client;
}

export const EMPLOYEE_HUES = [8, 32, 48, 95, 150, 178, 205, 238, 275, 320] as const;

export const EVENT_TYPE_LABELS: Record<EventTipo, string> = {
  gravacao: 'Gravação',
  foto: 'Fotografia',
  edicao: 'Edição',
  reuniao: 'Reunião',
};

export const EVENT_TYPE_COLORS: Record<EventTipo, { dot: string; bg: string; text: string; border: string }> = {
  gravacao: {
    dot: 'bg-[#FF5A3C] dark:bg-[#FF5A3C] text-[#FF5A3C]',
    bg: 'bg-[#FF5A3C]/10',
    text: 'text-[#D93A22] dark:text-[#FF5A3C]',
    border: 'border-[#FF5A3C]',
  },
  foto: {
    dot: 'bg-sky-500 text-sky-500',
    bg: 'bg-sky-500/10',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-500',
  },
  edicao: {
    dot: 'bg-purple-500 text-purple-500',
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500',
  },
  reuniao: {
    dot: 'bg-zinc-400 text-zinc-400',
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-600 dark:text-zinc-400',
    border: 'border-zinc-400',
  },
};

// ==========================================
// TIPOS: ENTREGÁVEIS & CENTRAL DE ARQUIVOS (DAM)
// ==========================================

export type DeliverableStatus =
  | 'captado_raw'
  | 'em_edicao'
  | 'aguardando_aprovacao'
  | 'ajustes_solicitados'
  | 'aprovado'
  | 'publicado';

export type DeliverableFormat =
  | 'reels_9_16'
  | 'feed_post'
  | 'carrossel'
  | 'stories'
  | 'fotos_menu'
  | 'bruto_raw';

export interface MediaDeliverable {
  id: string;
  client_id: string;
  event_id?: string | null;
  titulo: string;
  descricao?: string;
  formato: DeliverableFormat;
  status: DeliverableStatus;
  drive_url?: string; // Link direto do arquivo no Google Drive / Dropbox
  pasta_drive_url?: string; // Link da pasta de brutos da gravação
  thumbnail_url?: string;
  filmmaker_id?: string;
  criadora_id?: string;
  editor_id?: string;
  data_gravacao: string;
  data_limite_aprovacao?: string;
  data_publicacao_prevista?: string;
  link_postado?: string;
  versao: number; // v1, v2...
  observacoes_ajuste?: string;
  created_at: string;
  // Relacionamentos populados
  client?: Client;
  event?: EventItem;
  filmmaker?: Employee;
  criadora?: Employee;
}
