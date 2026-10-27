import { PontoRegistro } from '@/types/database';
import { todayInSaoPaulo } from '@/lib/date-utils';

const today = todayInSaoPaulo();

function makePontoPhoto(initials: string, name: string, role: string, hue: number, time: string, loc: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="260" viewBox="0 0 320 260">
    <defs>
      <linearGradient id="bg_${hue}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="320" height="260" fill="url(#bg_${hue})"/>
    <circle cx="160" cy="95" r="46" fill="hsl(${hue}, 70%, 45%)"/>
    <text x="160" y="103" font-family="system-ui, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initials}</text>
    <text x="160" y="162" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#f8fafc" text-anchor="middle">${name}</text>
    <text x="160" y="180" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">${role}</text>
    <rect x="0" y="222" width="320" height="38" fill="rgba(0,0,0,0.65)"/>
    <text x="16" y="246" font-family="monospace" font-size="10" font-weight="bold" fill="#10b981">${time}</text>
    <text x="304" y="246" font-family="system-ui, sans-serif" font-size="9" fill="#94a3b8" text-anchor="end">${loc}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const INITIAL_PONTOS: PontoRegistro[] = [
  // ==========================================
  // PONTO EXTERNO: RESTAURANTES & CAMPO (Filmmakers & Modelos)
  // ==========================================
  {
    id: 'ponto-1',
    employee_id: 'usr-vitinho',
    client_id: 'cli-5',
    event_id: 'evt-5',
    tipo: 'entrada',
    data_hora: `${today}T09:48:15`,
    foto_url: makePontoPhoto('VC', 'Victor Cordoba (Vitinho)', 'Filmmaker Líder', 178, '09:48:15', 'Smash Burger'),
    latitude: -23.5594,
    longitude: -46.6914,
    precisao_metros: 8,
    distancia_metros: 28,
    status_localizacao: 'no_local',
    endereco: 'R. Harmonia, 342 - Vila Madalena, São Paulo',
    observacao: 'Chegada no local com antecedência. Câmera configurada e iluminação testada.',
    created_at: `${today}T09:48:15Z`,
  },
  {
    id: 'ponto-2',
    employee_id: 'usr-mi',
    client_id: 'cli-5',
    event_id: 'evt-5',
    tipo: 'entrada',
    data_hora: `${today}T09:52:40`,
    foto_url: makePontoPhoto('MS', 'Milena', 'Modelo / Apresentadora', 320, '09:52:40', 'Smash Burger'),
    latitude: -23.5593,
    longitude: -46.6911,
    precisao_metros: 12,
    distancia_metros: 15,
    status_localizacao: 'no_local',
    endereco: 'R. Harmonia, 342 - Vila Madalena, São Paulo',
    observacao: 'Chegada no local, alinhando com a equipe os 2 pratos da gravação.',
    created_at: `${today}T09:52:40Z`,
  },
  {
    id: 'ponto-ext-saida-1',
    employee_id: 'usr-vitinho',
    client_id: 'cli-5',
    event_id: 'evt-5',
    tipo: 'saida',
    data_hora: `${today}T13:12:00`,
    foto_url: makePontoPhoto('VC', 'Victor Cordoba (Vitinho)', 'Filmmaker Líder', 178, '13:12:00', 'Smash Burger'),
    latitude: -23.5594,
    longitude: -46.6914,
    precisao_metros: 9,
    distancia_metros: 25,
    status_localizacao: 'no_local',
    endereco: 'R. Harmonia, 342 - Vila Madalena, São Paulo',
    observacao: 'Saída da Hamburgueria Smash. Takes gravados e transferidos.',
    created_at: `${today}T13:12:00Z`,
  },
  {
    id: 'ponto-ext-saida-2',
    employee_id: 'usr-mi',
    client_id: 'cli-5',
    event_id: 'evt-5',
    tipo: 'saida',
    data_hora: `${today}T13:14:30`,
    foto_url: makePontoPhoto('MS', 'Milena', 'Modelo / Apresentadora', 320, '13:14:30', 'Smash Burger'),
    latitude: -23.5593,
    longitude: -46.6911,
    precisao_metros: 11,
    distancia_metros: 18,
    status_localizacao: 'no_local',
    endereco: 'R. Harmonia, 342 - Vila Madalena, São Paulo',
    observacao: 'Sessão concluída com sucesso. Conteúdo gravado conforme briefing.',
    created_at: `${today}T13:14:30Z`,
  },
  {
    id: 'ponto-3',
    employee_id: 'usr-victor',
    client_id: 'cli-1',
    event_id: 'evt-6',
    tipo: 'entrada',
    data_hora: `${today}T14:45:00`,
    foto_url: makePontoPhoto('VR', 'Victor', 'Filmmaker', 178, '14:45:00', 'Bella Massa'),
    latitude: -23.5606,
    longitude: -46.5983,
    precisao_metros: 10,
    distancia_metros: 22,
    status_localizacao: 'no_local',
    endereco: 'Rua da Mooca, 1420 - Mooca, São Paulo',
    observacao: 'No restaurante com lente macro pronta para o preparo das massas.',
    created_at: `${today}T14:45:00Z`,
  },
  {
    id: 'ponto-4',
    employee_id: 'usr-gi',
    client_id: 'cli-1',
    event_id: 'evt-6',
    tipo: 'entrada',
    data_hora: `${today}T14:50:20`,
    foto_url: makePontoPhoto('GL', 'Giovana', 'Modelo / Apresentadora', 275, '14:50:20', 'Bella Massa'),
    latitude: -23.5608,
    longitude: -46.5986,
    precisao_metros: 15,
    distancia_metros: 35,
    status_localizacao: 'no_local',
    endereco: 'Rua da Mooca, 1420 - Mooca, São Paulo',
    observacao: 'Roteiro de apresentação alinhado com a gerência do restaurante.',
    created_at: `${today}T14:50:20Z`,
  },

  // ==========================================
  // PONTO INTERNO: 3 BATIDAS (Entrada, Almoço, Saída)
  // ==========================================
  {
    id: 'ponto-int-1',
    employee_id: 'usr-gui',
    tipo: 'entrada',
    data_hora: `${today}T08:58:12`,
    foto_url: makePontoPhoto('GA', 'Guilherme', 'Editor de Vídeo CLT', 205, '08:58:12', 'Sede Navegando'),
    latitude: -23.5615,
    longitude: -46.6560,
    precisao_metros: 5,
    status_localizacao: 'no_local',
    endereco: 'Sede Agência Navegando MKT - Escritório Interno',
    observacao: '1ª Batida: Entrada da manhã (Jornada diária 8h48min)',
    created_at: `${today}T08:58:12Z`,
  },
  {
    id: 'ponto-int-2',
    employee_id: 'usr-gui',
    tipo: 'almoco',
    data_hora: `${today}T12:05:00`,
    foto_url: makePontoPhoto('GA', 'Guilherme', 'Editor de Vídeo CLT', 205, '12:05:00', 'Sede Navegando'),
    latitude: -23.5615,
    longitude: -46.6560,
    precisao_metros: 6,
    status_localizacao: 'no_local',
    endereco: 'Sede Agência Navegando MKT - Escritório Interno',
    observacao: '2ª Batida: Início do intervalo de almoço intrajornada (1h)',
    created_at: `${today}T12:05:00Z`,
  },
  {
    id: 'ponto-int-3',
    employee_id: 'usr-carol',
    tipo: 'entrada',
    data_hora: `${today}T09:02:10`,
    foto_url: makePontoPhoto('CS', 'Carol', 'Designer Gráfico CLT', 32, '09:02:10', 'Sede Navegando'),
    latitude: -23.5615,
    longitude: -46.6560,
    precisao_metros: 6,
    status_localizacao: 'no_local',
    endereco: 'Sede Agência Navegando MKT - Ilha de Edição',
    observacao: '1ª Batida: Entrada da manhã para pós-produção dos Reels da semana',
    created_at: `${today}T09:02:10Z`,
  },
  {
    id: 'ponto-int-4',
    employee_id: 'usr-bruna',
    tipo: 'entrada',
    data_hora: `${today}T09:00:44`,
    foto_url: makePontoPhoto('BM', 'Bruna', 'Copywriter CLT', 95, '09:00:44', 'Sede Navegando'),
    latitude: -23.5615,
    longitude: -46.6560,
    precisao_metros: 5,
    status_localizacao: 'no_local',
    endereco: 'Sede Agência Navegando MKT - Social Media Desk',
    observacao: '1ª Batida: Entrada da manhã',
    created_at: `${today}T09:00:44Z`,
  },
  {
    id: 'ponto-int-5',
    employee_id: 'usr-lucas',
    tipo: 'entrada',
    data_hora: `${today}T09:05:30`,
    foto_url: makePontoPhoto('LV', 'Lucas Verraz', 'Tráfego Pago CLT', 238, '09:05:30', 'Sede Navegando'),
    latitude: -23.5615,
    longitude: -46.6560,
    precisao_metros: 5,
    status_localizacao: 'no_local',
    endereco: 'Sede Agência Navegando MKT - Ilha de Edição',
    observacao: '1ª Batida: Entrada da manhã',
    created_at: `${today}T09:05:30Z`,
  },
];
