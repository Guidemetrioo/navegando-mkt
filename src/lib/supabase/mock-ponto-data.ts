import { PontoRegistro } from '@/types/database';

export const INITIAL_PONTOS: PontoRegistro[] = [
  {
    id: 'ponto-1',
    employee_id: 'emp-1', // Vitinho (Filmmaker)
    client_id: 'cli-5', // Hamburgueria Artesanal Smash
    event_id: 'evt-5',
    tipo: 'entrada',
    data_hora: '2026-10-14T09:48:15',
    foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    latitude: -23.5594,
    longitude: -46.6914,
    precisao_metros: 8,
    distancia_metros: 28, // 28 metros do restaurante (No local!)
    status_localizacao: 'no_local',
    observacao: 'Cheguei com 12 min de antecedência. Câmera configurada e iluminação testada.',
    created_at: '2026-10-14T09:48:15Z',
  },
  {
    id: 'ponto-2',
    employee_id: 'emp-6', // Milena (Criadora / Vídeo)
    client_id: 'cli-5', // Hamburgueria Artesanal Smash
    event_id: 'evt-5',
    tipo: 'entrada',
    data_hora: '2026-10-14T09:52:40',
    foto_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    latitude: -23.5593,
    longitude: -46.6911,
    precisao_metros: 12,
    distancia_metros: 15, // 15 metros do restaurante (No local!)
    status_localizacao: 'no_local',
    observacao: 'Cheguei no local, alinhando com o chef os 2 burgers que vamos gravar primeiro.',
    created_at: '2026-10-14T09:52:40Z',
  },
  {
    id: 'ponto-3',
    employee_id: 'emp-4', // Victor (Filmmaker)
    client_id: 'cli-1', // Cantina Bella Massa
    event_id: 'evt-6',
    tipo: 'entrada',
    data_hora: '2026-10-14T14:45:00',
    foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    latitude: -23.5606,
    longitude: -46.5983,
    precisao_metros: 10,
    distancia_metros: 22,
    status_localizacao: 'no_local',
    observacao: 'No restaurante com lente macro pronta para o Tiramisù.',
    created_at: '2026-10-14T14:45:00Z',
  },
  {
    id: 'ponto-4',
    employee_id: 'emp-5', // Giovana (Criadora / Vídeo)
    client_id: 'cli-1', // Cantina Bella Massa
    event_id: 'evt-6',
    tipo: 'entrada',
    data_hora: '2026-10-14T14:50:20',
    foto_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    latitude: -23.5608,
    longitude: -46.5986,
    precisao_metros: 15,
    distancia_metros: 35,
    status_localizacao: 'no_local',
    observacao: 'Roteiro de apresentação revisado com o dono da cantina.',
    created_at: '2026-10-14T14:50:20Z',
  },
  {
    id: 'ponto-5',
    employee_id: 'emp-2', // Gimenez (Filmmaker)
    client_id: 'cli-2', // Sushi Hoshi
    event_id: 'evt-2',
    tipo: 'entrada',
    data_hora: '2026-10-12T13:50:00',
    foto_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    latitude: -23.5415,
    longitude: -46.5703,
    precisao_metros: 14,
    distancia_metros: 40,
    status_localizacao: 'no_local',
    observacao: 'Entrada confirmada. Equipamento de iluminação montado.',
    created_at: '2026-10-12T13:50:00Z',
  },
  {
    id: 'ponto-6',
    employee_id: 'emp-2', // Gimenez (Filmmaker)
    client_id: 'cli-2', // Sushi Hoshi
    event_id: 'evt-2',
    tipo: 'saida',
    data_hora: '2026-10-12T17:15:30',
    foto_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    latitude: -23.5413,
    longitude: -46.5702,
    precisao_metros: 10,
    distancia_metros: 18,
    status_localizacao: 'no_local',
    observacao: 'Gravação finalizada com sucesso! Todos os combinados gravados.',
    created_at: '2026-10-12T17:15:30Z',
  },
];
