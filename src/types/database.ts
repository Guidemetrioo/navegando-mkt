export type EventTipo = 'gravacao' | 'foto' | 'edicao' | 'reuniao';
export type EventStatus = 'agendado' | 'confirmado' | 'realizado' | 'cancelado';
export type UserRole = 'admin' | 'funcionario';
export type TeamRole = 'dono' | 'gerente' | 'filmmaker' | 'modelo' | 'criadora' | 'interno';
export type WorkRegime = 'interno' | 'externo';

export interface Employee {
  id: string;
  nome: string;
  cor: number; // HSL Hue
  funcao?: TeamRole; // 'dono' | 'gerente' | 'filmmaker' | 'modelo' | 'interno'
  regime?: WorkRegime; // 'interno' (segunda a sexta, 3 batidas CLT) ou 'externo' (campo nos restaurantes)
  cargo_detalhado?: string;
  username?: string;
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
  status?: 'ativo' | 'onboarding' | 'pausado';
  plano?: string; // Ex: 'Gastro Pro (8 Reels + 4 Carrosséis)'
  meta_reels_mensal?: number; // Meta de reels por mês contratada
  valor_mensalidade?: number; // Valor mensal do contrato
  cardapio_link?: string; // Link direto do cardápio digital
  briefing?: string; // Diretrizes estéticas, cores, estilo dos vídeos
  briefing_publico_alvo?: string; // Público-alvo e perfil do cliente ideal do restaurante
  briefing_tom_voz?: string; // Tom de voz, estilo de locução, trilha sonora e ritmo de edição
  briefing_pratos_foco?: string; // Pratos carros-chefe, drinks e produtos foco da gravação
  briefing_iluminacao_estetica?: string; // Iluminação, ângulos, estética de cor e enquadramento
  briefing_restricoes?: string; // O que evitar / restrições do restaurante
  briefing_roteiros_modelos?: string; // Ideias de ganchos (hooks) e roteiros base
  created_at?: string;
}

// ==========================================
// TIPOS: PONTO ELETRÔNICO & GEOLOCALIZAÇÃO
// ==========================================

export type PontoTipo = 'entrada' | 'almoco' | 'saida';
export type PontoStatus = 'no_local' | 'fora_do_raio' | 'manual';

export interface PontoRegistro {
  id: string;
  employee_id: string;
  event_id?: string | null;
  client_id?: string | null;
  tipo: PontoTipo; // 'entrada' | 'almoco' | 'saida'
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

export interface RelatorioFilmmaker {
  preenchido: boolean;
  preenchido_por_id?: string;
  preenchido_por_nome?: string;
  preenchido_em?: string;
  relatorio_texto?: string;
  pratos_gravados?: string;
  takes_gravados_qtd?: number;
  equipamento_usado?: string;
  ocorrencias_cozinha?: string;
  pasta_brutos_link?: string;
  avaliacao_sessao?: 'otima' | 'boa' | 'regular' | 'com_imprevistos';
  observacoes?: string;
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
  briefing_gravacao?: string | null; // Roteiro específico, ganchos e lista de cenas da diária
  status: EventStatus;
  relatorio_filmmaker?: RelatorioFilmmaker;
  despesas?: DespesaGravacao[];
  confirmacao_whatsapp?: WhatsAppConfirmacaoInfo;
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
    dot: 'bg-[#FF6600] dark:bg-[#FF6600] text-[#FF6600]',
    bg: 'bg-[#FF6600]/10',
    text: 'text-[#FF6600]',
    border: 'border-[#FF6600]',
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

// ==========================================
// TIPOS: DESPESAS DE GRAVAÇÃO (Inseridas pelos Colaboradores)
// ==========================================

export type CategoriaDespesa = 'transporte' | 'alimentacao' | 'estacionamento' | 'insumos' | 'outros';
export type StatusDespesa = 'pendente' | 'aprovado' | 'reembolsado' | 'recusado';

export interface DespesaGravacao {
  id: string;
  event_id: string;
  employee_id: string;
  employee_nome: string;
  categoria: CategoriaDespesa;
  descricao: string;
  valor: number;
  data: string; // YYYY-MM-DD
  comprovante_url?: string;
  status: StatusDespesa;
  observacao_gestor?: string;
  created_at: string;
  // Campos populados
  client_nome?: string;
}

// ==========================================
// TIPOS: CONTROLE FINANCEIRO EXECUTIVO (Gestores)
// ==========================================

export type TransacaoTipo = 'receita' | 'despesa';
export type TransacaoCategoria =
  | 'mensalidade_cliente'
  | 'salario_equipe'
  | 'custo_gravacao'
  | 'equipamento'
  | 'software_infra'
  | 'impostos'
  | 'outros';
export type TransacaoStatus = 'pago' | 'pendente' | 'atrasado' | 'cancelado';

export interface TransacaoFinanceira {
  id: string;
  tipo: TransacaoTipo;
  categoria: TransacaoCategoria;
  descricao: string;
  valor: number;
  data_vencimento: string; // YYYY-MM-DD
  data_pagamento?: string | null;
  status: TransacaoStatus;
  client_id?: string | null;
  employee_id?: string | null;
  event_id?: string | null;
  despesa_gravacao_id?: string | null;
  forma_pagamento?: 'pix' | 'boleto' | 'transferencia' | 'cartao';
  comprovante_url?: string;
  observacoes?: string;
  created_at: string;
  // Populados
  cliente_nome?: string;
  employee_nome?: string;
}

export interface FuncionarioSalario {
  employee_id: string;
  nome: string;
  cargo: string;
  regime: WorkRegime;
  tipo_contrato: 'clt' | 'pj' | 'freelancer_diaria';
  valor_base: number; // Salário fixo mensal ou valor base da diária
  dia_pagamento: number; // Ex: dia 5 ou dia 20
  chave_pix?: string;
  banco?: string;
  status_mes_atual: 'pago' | 'pendente';
  data_ultimo_pagamento?: string;
}

// ==========================================
// TIPOS: WHATSAPP BOT & CONFIRMAÇÃO AUTOMÁTICA
// ==========================================

export type ConfirmacaoStatus = 'pendente' | 'confirmado' | 'remarcar' | 'cancelado';

export interface WhatsAppConfirmacaoInfo {
  enviado: boolean;
  enviado_em?: string;
  telefone_destino?: string;
  status_resposta?: ConfirmacaoStatus;
  resposta_recebida_em?: string;
  ultima_mensagem?: string;
}

export interface WhatsAppConfig {
  conectado: boolean;
  status: 'desconectado' | 'gerando_qrcode' | 'conectado' | 'reconectando';
  instancia_nome: string;
  numero_conectado?: string;
  pairing_code?: string;
  qr_code?: string;
  auto_confirmacao_d1: boolean;
  horario_envio_padrao: string;
  template_mensagem: string;
  tentativas_webhook: number;
  ultima_verificacao?: string;
}

export interface WhatsAppMessageLog {
  id: string;
  event_id?: string;
  client_id?: string;
  cliente_nome: string;
  numero_destino: string;
  tipo: 'envio_confirmacao' | 'resposta_cliente' | 'notificacao_equipe' | 'manual';
  mensagem: string;
  status: 'enviada' | 'entregue' | 'lida' | 'respondida' | 'falha';
  resposta_detectada?: 'confirmado' | 'remarcar' | 'outro';
  data_hora: string;
}
