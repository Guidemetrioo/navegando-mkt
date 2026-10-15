import { MediaDeliverable } from '@/types/database';

export const INITIAL_DELIVERABLES: MediaDeliverable[] = [
  {
    id: 'deliv-1',
    client_id: 'cli-5', // Smash
    event_id: 'evt-2',
    titulo: 'Reels: Novo Smash Trufado com Queijo Crocante',
    descricao: 'Vídeo dinâmico de 28 segundos com áudio em alta no Instagram, destacando o queijo puxando e o smash na chapa.',
    formato: 'reels_9_16',
    status: 'aguardando_aprovacao',
    drive_url: 'https://drive.google.com/drive/folders/1SmashTrufado_v1',
    pasta_drive_url: 'https://drive.google.com/drive/folders/Smash_Outubro_2026',
    thumbnail_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    filmmaker_id: 'emp-1', // Vitinho
    criadora_id: 'emp-5', // Giovana
    data_gravacao: '2026-10-14',
    data_limite_aprovacao: '2026-10-16',
    data_publicacao_prevista: '2026-10-17',
    versao: 1,
    observacoes_ajuste: 'Aguardando validação do gerente Rodrigo sobre a vinheta final.',
    created_at: '2026-10-14T14:30:00Z',
  },
  {
    id: 'deliv-2',
    client_id: 'cli-1', // Cantina Bella Massa
    event_id: 'evt-1',
    titulo: 'Carrossel: As 5 Etapas da Massa Artesanal Fresca',
    descricao: 'Carrossel educativo de 7 lâminas com fotos em alta definição do chef preparando o fettuccine ao vivo.',
    formato: 'carrossel',
    status: 'aprovado',
    drive_url: 'https://drive.google.com/drive/folders/1BellaMassa_Carrossel',
    pasta_drive_url: 'https://drive.google.com/drive/folders/BellaMassa_Brutos',
    thumbnail_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80',
    filmmaker_id: 'emp-2', // Gimenez
    criadora_id: 'emp-6', // Milena
    data_gravacao: '2026-10-13',
    data_limite_aprovacao: '2026-10-15',
    data_publicacao_prevista: '2026-10-16',
    versao: 2,
    observacoes_ajuste: 'Aprovado pelo proprietário sem alterações na v2.',
    created_at: '2026-10-13T18:00:00Z',
  },
  {
    id: 'deliv-3',
    client_id: 'cli-2', // Sushi Hoshi
    event_id: 'evt-3',
    titulo: 'Reels ASMR: Corte do Salmão Norueguês Fresco',
    descricao: 'Vídeo focado no som da faca e textura brilhante do salmão, ideal para retenção nos primeiros 3 segundos.',
    formato: 'reels_9_16',
    status: 'em_edicao',
    drive_url: 'https://drive.google.com/drive/folders/1SushiHoshi_ASMR',
    pasta_drive_url: 'https://drive.google.com/drive/folders/SushiHoshi_Brutos_Raw',
    thumbnail_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80',
    filmmaker_id: 'emp-3', // Henri
    criadora_id: 'emp-7', // Julia
    data_gravacao: '2026-10-14',
    data_limite_aprovacao: '2026-10-18',
    data_publicacao_prevista: '2026-10-19',
    versao: 1,
    created_at: '2026-10-14T17:15:00Z',
  },
  {
    id: 'deliv-4',
    client_id: 'cli-3', // Fogo Nobre
    event_id: 'evt-4',
    titulo: 'Reels Tendência: O Ponto Perfeito do Tomahawk na Brasa',
    descricao: 'Corte da carne fumegando na mesa com sal grosso trufado.',
    formato: 'reels_9_16',
    status: 'publicado',
    drive_url: 'https://drive.google.com/drive/folders/1FogoNobre_Tomahawk',
    pasta_drive_url: 'https://drive.google.com/drive/folders/FogoNobre_Brutos',
    thumbnail_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    filmmaker_id: 'emp-4', // Victor
    criadora_id: 'emp-8', // Isabela
    data_gravacao: '2026-10-10',
    data_limite_aprovacao: '2026-10-12',
    data_publicacao_prevista: '2026-10-13',
    link_postado: 'https://instagram.com/reel/Cx94218aZ',
    versao: 1,
    created_at: '2026-10-10T19:00:00Z',
  },
  {
    id: 'deliv-5',
    client_id: 'cli-4', // Café Grão Real
    event_id: 'evt-5',
    titulo: 'Pacote de Fotos Profissionais para Cardápio de Brunch',
    descricao: '20 fotos em alta resolução de cafés especiais, avocado toast e croissants.',
    formato: 'fotos_menu',
    status: 'captado_raw',
    drive_url: 'https://drive.google.com/drive/folders/1GraoReal_RAW_Fotos',
    pasta_drive_url: 'https://drive.google.com/drive/folders/GraoReal_Raw_Backup',
    thumbnail_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
    filmmaker_id: 'emp-1', // Vitinho
    criadora_id: 'emp-5', // Giovana
    data_gravacao: '2026-10-14',
    data_limite_aprovacao: '2026-10-19',
    data_publicacao_prevista: '2026-10-21',
    versao: 1,
    observacoes_ajuste: 'Brutos recém-descarregados no Drive da agência.',
    created_at: '2026-10-14T11:45:00Z',
  },
  {
    id: 'deliv-6',
    client_id: 'cli-6', // Paris 6
    titulo: 'Stories Diários: Preparação da Sobremesa Grand Gateau',
    descricao: 'Sequência de 4 stories interativos com enquetes para aumentar engajamento de quinta-feira.',
    formato: 'stories',
    status: 'aguardando_aprovacao',
    drive_url: 'https://drive.google.com/drive/folders/1Paris6_Stories_Gateau',
    pasta_drive_url: 'https://drive.google.com/drive/folders/Paris6_Brutos',
    thumbnail_url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&auto=format&fit=crop&q=80',
    filmmaker_id: 'emp-4', // Victor
    criadora_id: 'emp-8', // Isabela
    data_gravacao: '2026-10-14',
    data_limite_aprovacao: '2026-10-15',
    data_publicacao_prevista: '2026-10-15',
    versao: 1,
    created_at: '2026-10-14T16:00:00Z',
  },
];
