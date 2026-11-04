import { PontoRegistro } from '@/types/database';

function buildSimulatedSelfieSvg(nome: string, local: string, dataHora: string, cor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1e293b"/>
      </linearGradient>
    </defs>
    <rect width="320" height="240" rx="16" fill="url(#bg)"/>
    <circle cx="160" cy="92" r="38" fill="${cor}" opacity="0.22" stroke="${cor}" stroke-width="2"/>
    <circle cx="160" cy="82" r="14" fill="${cor}"/>
    <path d="M134 114 C134 98, 186 98, 186 114" fill="${cor}"/>
    <rect x="92" y="16" width="136" height="22" rx="11" fill="#f59e0b" opacity="0.18"/>
    <text x="160" y="31" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#fbbf24" text-anchor="middle">REGISTRO SIMULADO</text>
    <text x="160" y="156" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#f8fafc" text-anchor="middle">${nome}</text>
    <text x="160" y="176" font-family="Arial, sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">${local}</text>
    <text x="160" y="204" font-family=" monospace" font-size="11" fill="#38bdf8" text-anchor="middle">${dataHora} • GPS Verificado</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Coordenadas da Sede Navegando MKT (Pinheiros / Faria Lima - SP)
const HQ_LAT = -23.5673;
const HQ_LNG = -46.6928;
const HQ_ADDRESS = 'Sede Navegando MKT • Pinheiros, São Paulo - SP';

interface InternalSimSpec {
  employee_id: string;
  nome: string;
  cor: string;
  entradaHora: string;
  almocoHora: string;
  saidaHora: string;
}

const INTERNAL_STAFF_SPECS: InternalSimSpec[] = [
  { employee_id: 'usr-carol', nome: 'Carol (Interno)', cor: '#ec4899', entradaHora: '08:58', almocoHora: '12:30', saidaHora: '18:04' },
  { employee_id: 'usr-bruna', nome: 'Bruna (Interno)', cor: '#a855f7', entradaHora: '09:02', almocoHora: '12:35', saidaHora: '18:01' },
  { employee_id: 'usr-lucas', nome: 'Lucas (Interno)', cor: '#3b82f6', entradaHora: '08:55', almocoHora: '12:15', saidaHora: '18:05' },
  { employee_id: 'usr-evelin', nome: 'Evelin (Interno)', cor: '#14b8a6', entradaHora: '09:04', almocoHora: '13:00', saidaHora: '18:10' },
  { employee_id: 'usr-juliaint', nome: 'Júlia (Interno)', cor: '#f97316', entradaHora: '09:00', almocoHora: '12:45', saidaHora: '18:00' },
  { employee_id: 'usr-augusto', nome: 'Augusto (Interno)', cor: '#eab308', entradaHora: '09:06', almocoHora: '12:40', saidaHora: '18:12' },
  { employee_id: 'usr-matheus-ger', nome: 'Matheus (Gerente)', cor: '#06b6d4', entradaHora: '08:48', almocoHora: '12:30', saidaHora: '18:20' },
];

// Dias úteis nos últimos 30 dias (05/10/2026 a 04/11/2026)
const INTERNAL_SIM_DATES = [
  '2026-10-05',
  '2026-10-07',
  '2026-10-09',
  '2026-10-13',
  '2026-10-15',
  '2026-10-19',
  '2026-10-21',
  '2026-10-23',
  '2026-10-26',
  '2026-10-28',
  '2026-10-30',
  '2026-11-03',
  '2026-11-04',
];

function generateInternalPontos(): PontoRegistro[] {
  const list: PontoRegistro[] = [];

  for (const dateStr of INTERNAL_SIM_DATES) {
    for (const staff of INTERNAL_STAFF_SPECS) {
      // No dia 04/11 (hoje), gera entrada e almoço; nos dias anteriores gera os 3 pontos (entrada, almoço e saída)
      const isToday = dateStr === '2026-11-04';
      const punches: Array<{ tipo: 'entrada' | 'almoco' | 'saida'; hora: string; obs: string }> = [
        { tipo: 'entrada', hora: staff.entradaHora, obs: '[SIMULADO] Entrada expediente interno CLT (Sede Pinheiros)' },
        { tipo: 'almoco', hora: staff.almocoHora, obs: '[SIMULADO] Pausa almoço equipe interna' },
      ];
      if (!isToday) {
        punches.push({
          tipo: 'saida',
          hora: staff.saidaHora,
          obs: '[SIMULADO] Encerramento expediente interno (3º ponto diário)',
        });
      }

      for (const punch of punches) {
        const id = `sim-pto-${dateStr}-${staff.employee_id}-${punch.tipo}`;
        const iso = `${dateStr}T${punch.hora}:00-03:00`;
        list.push({
          id,
          employee_id: staff.employee_id,
          tipo: punch.tipo,
          data_hora: iso,
          latitude: HQ_LAT,
          longitude: HQ_LNG,
          precisao_metros: 12,
          distancia_metros: 15,
          endereco: HQ_ADDRESS,
          status_localizacao: 'no_local',
          foto_url: buildSimulatedSelfieSvg(staff.nome, 'Sede Navegando MKT', `${dateStr.split('-').reverse().join('/')} ${punch.hora}`, staff.cor),
          observacao: punch.obs,
          created_at: iso,
        });
      }
    }
  }

  return list;
}

interface ExternalFieldSpec {
  idSuffix: string;
  dateStr: string;
  employee_id: string;
  nome: string;
  cor: string;
  client_id: string;
  clientNome: string;
  endereco: string;
  lat: number;
  lng: number;
  distancia: number;
  status: 'no_local' | 'fora_do_raio';
  entradaHora: string;
  saidaHora?: string;
  obs: string;
}

const EXTERNAL_FIELD_SPECS: ExternalFieldSpec[] = [
  {
    idSuffix: 'ext-01',
    dateStr: '2026-10-06',
    employee_id: 'usr-victor',
    nome: 'Victor (Filmmaker)',
    cor: '#3b82f6',
    client_id: 'cli-bella-paulista',
    clientNome: 'Bella Paulista',
    endereco: 'Rua Haddock Lobo, 354 - Cerqueira César, São Paulo - SP',
    lat: -23.5582,
    lng: -46.6602,
    distancia: 35,
    status: 'no_local',
    entradaHora: '08:52',
    saidaHora: '12:15',
    obs: '[SIMULADO] Check-in gravação matinal Bella Paulista',
  },
  {
    idSuffix: 'ext-02',
    dateStr: '2026-10-06',
    employee_id: 'usr-gi',
    nome: 'Giovana (Modelo)',
    cor: '#ec4899',
    client_id: 'cli-bella-paulista',
    clientNome: 'Bella Paulista',
    endereco: 'Rua Haddock Lobo, 354 - Cerqueira César, São Paulo - SP',
    lat: -23.5584,
    lng: -46.6601,
    distancia: 42,
    status: 'no_local',
    entradaHora: '08:56',
    saidaHora: '12:18',
    obs: '[SIMULADO] Presença modelo gravação Bella Paulista',
  },
  {
    idSuffix: 'ext-03',
    dateStr: '2026-10-08',
    employee_id: 'usr-gimenez',
    nome: 'Gimenez (Filmmaker)',
    cor: '#10b981',
    client_id: 'cli-santo-mar',
    clientNome: 'Santo Mar',
    endereco: 'São Paulo - SP',
    lat: -23.5629,
    lng: -46.6744,
    distancia: 28,
    status: 'no_local',
    entradaHora: '12:50',
    saidaHora: '16:10',
    obs: '[SIMULADO] Captação frutos do mar Santo Mar',
  },
  {
    idSuffix: 'ext-04',
    dateStr: '2026-10-08',
    employee_id: 'usr-mi',
    nome: 'Milena (Modelo)',
    cor: '#f43f5e',
    client_id: 'cli-santo-mar',
    clientNome: 'Santo Mar',
    endereco: 'São Paulo - SP',
    lat: -23.563,
    lng: -46.6745,
    distancia: 31,
    status: 'no_local',
    entradaHora: '12:55',
    saidaHora: '16:12',
    obs: '[SIMULADO] Modelo em set Santo Mar',
  },
  {
    idSuffix: 'ext-05',
    dateStr: '2026-10-12',
    employee_id: 'usr-henry',
    nome: 'Henry (Filmmaker)',
    cor: '#8b5cf6',
    client_id: 'cli-rei-do-abc',
    clientNome: 'Rei do ABC',
    endereco: 'ABC Paulista - SP',
    lat: -23.6639,
    lng: -46.531,
    distancia: 60,
    status: 'no_local',
    entradaHora: '08:50',
    saidaHora: '12:20',
    obs: '[SIMULADO] Gravação externa Rei do ABC',
  },
  {
    idSuffix: 'ext-06',
    dateStr: '2026-10-12',
    employee_id: 'usr-isa',
    nome: 'Isadora (Modelo)',
    cor: '#d946ef',
    client_id: 'cli-rei-do-abc',
    clientNome: 'Rei do ABC',
    endereco: 'ABC Paulista - SP',
    lat: -23.664,
    lng: -46.5312,
    distancia: 65,
    status: 'no_local',
    entradaHora: '08:54',
    saidaHora: '12:22',
    obs: '[SIMULADO] Modelo gravação Rei do ABC',
  },
  {
    idSuffix: 'ext-07',
    dateStr: '2026-10-14',
    employee_id: 'usr-victor',
    nome: 'Victor (Filmmaker)',
    cor: '#3b82f6',
    client_id: 'cli-sampa-burger',
    clientNome: 'Sampa Burger',
    endereco: 'São Paulo - SP',
    lat: -23.5874,
    lng: -46.6576,
    distancia: 22,
    status: 'no_local',
    entradaHora: '13:52',
    saidaHora: '17:05',
    obs: '[SIMULADO] Captação Reels Smash Burger',
  },
  {
    idSuffix: 'ext-08',
    dateStr: '2026-10-14',
    employee_id: 'usr-ju',
    nome: 'Julia (Modelo)',
    cor: '#fb7185',
    client_id: 'cli-sampa-burger',
    clientNome: 'Sampa Burger',
    endereco: 'São Paulo - SP',
    lat: -23.5875,
    lng: -46.6575,
    distancia: 25,
    status: 'no_local',
    entradaHora: '13:55',
    saidaHora: '17:08',
    obs: '[SIMULADO] Modelo degustação Sampa Burger',
  },
  {
    idSuffix: 'ext-09',
    dateStr: '2026-10-17',
    employee_id: 'usr-gimenez',
    nome: 'Gimenez (Filmmaker)',
    cor: '#10b981',
    client_id: 'cli-toca-do-peixe',
    clientNome: 'Toca do Peixe',
    endereco: 'São Paulo - SP',
    lat: -23.612,
    lng: -46.669,
    distancia: 48,
    status: 'no_local',
    entradaHora: '10:45',
    saidaHora: '15:10',
    obs: '[SIMULADO] Diária externa Toca do Peixe',
  },
  {
    idSuffix: 'ext-10',
    dateStr: '2026-10-20',
    employee_id: 'usr-henry',
    nome: 'Henry (Filmmaker)',
    cor: '#8b5cf6',
    client_id: 'cli-24-print',
    clientNome: '24 Print',
    endereco: 'São Paulo - SP',
    lat: -23.5505,
    lng: -46.6333,
    distancia: 33,
    status: 'no_local',
    entradaHora: '13:50',
    saidaHora: '17:00',
    obs: '[SIMULADO] Gravação institucional 24 Print',
  },
  {
    idSuffix: 'ext-11',
    dateStr: '2026-10-20',
    employee_id: 'usr-ju',
    nome: 'Julia (Modelo)',
    cor: '#fb7185',
    client_id: 'cli-24-print',
    clientNome: '24 Print',
    endereco: 'São Paulo - SP',
    lat: -23.5506,
    lng: -46.6334,
    distancia: 38,
    status: 'no_local',
    entradaHora: '13:54',
    saidaHora: '17:02',
    obs: '[SIMULADO] Modelo apresentação 24 Print',
  },
  {
    idSuffix: 'ext-12',
    dateStr: '2026-10-24',
    employee_id: 'usr-victor',
    nome: 'Victor (Filmmaker)',
    cor: '#3b82f6',
    client_id: 'cli-osnir',
    clientNome: 'Osnir Hamburger',
    endereco: 'Av. Jabaquara, 538 - Mirandópolis, São Paulo - SP',
    lat: -23.6061,
    lng: -46.6382,
    distancia: 19,
    status: 'no_local',
    entradaHora: '09:55',
    saidaHora: '13:15',
    obs: '[SIMULADO] Captação Osnir Hamburger',
  },
  {
    idSuffix: 'ext-13',
    dateStr: '2026-10-27',
    employee_id: 'usr-gimenez',
    nome: 'Gimenez (Filmmaker)',
    cor: '#10b981',
    client_id: 'cli-terracolibanes',
    clientNome: 'Terraço Libanês',
    endereco: 'São Paulo - SP',
    lat: -23.5741,
    lng: -46.6452,
    distancia: 44,
    status: 'no_local',
    entradaHora: '11:50',
    saidaHora: '15:05',
    obs: '[SIMULADO] Gravação gastronomia árabe Terraço Libanês',
  },
  {
    idSuffix: 'ext-14',
    dateStr: '2026-10-29',
    employee_id: 'usr-henry',
    nome: 'Henry (Filmmaker)',
    cor: '#8b5cf6',
    client_id: 'cli-red-rose',
    clientNome: 'Red Rose',
    endereco: 'São Paulo - SP',
    lat: -23.5612,
    lng: -46.6559,
    distancia: 140,
    status: 'fora_do_raio',
    entradaHora: '10:52',
    saidaHora: '14:10',
    obs: '[SIMULADO] Check-in no estacionamento próximo ao Red Rose',
  },
  {
    idSuffix: 'ext-15',
    dateStr: '2026-11-01',
    employee_id: 'usr-victor',
    nome: 'Victor (Filmmaker)',
    cor: '#3b82f6',
    client_id: 'cli-pontremoli',
    clientNome: 'Pontremoli',
    endereco: 'Pontremoli - SP',
    lat: -23.591,
    lng: -46.681,
    distancia: 25,
    status: 'no_local',
    entradaHora: '08:50',
    saidaHora: '17:45',
    obs: '[SIMULADO] Diária completa Pontremoli (Agenda Nov)',
  },
  {
    idSuffix: 'ext-16',
    dateStr: '2026-11-03',
    employee_id: 'usr-isa',
    nome: 'Isadora (Modelo)',
    cor: '#d946ef',
    client_id: 'cli-crepefy',
    clientNome: 'Crepefy Butantã',
    endereco: 'Butantã, São Paulo - SP',
    lat: -23.5718,
    lng: -46.7084,
    distancia: 30,
    status: 'no_local',
    entradaHora: '11:52',
    saidaHora: '15:04',
    obs: '[SIMULADO] Gravação Crepefy Butantã (Agenda 03/11)',
  },
  {
    idSuffix: 'ext-17',
    dateStr: '2026-11-03',
    employee_id: 'usr-victor',
    nome: 'Victor (Filmmaker)',
    cor: '#3b82f6',
    client_id: 'cli-the-ozzy',
    clientNome: 'The Ozzy',
    endereco: 'São Paulo - SP',
    lat: -23.564,
    lng: -46.652,
    distancia: 27,
    status: 'no_local',
    entradaHora: '12:54',
    saidaHora: '16:05',
    obs: '[SIMULADO] Gravação The Ozzy com Giovana (Agenda 03/11)',
  },
  {
    idSuffix: 'ext-18',
    dateStr: '2026-11-03',
    employee_id: 'usr-gi',
    nome: 'Giovana (Modelo)',
    cor: '#ec4899',
    client_id: 'cli-the-ozzy',
    clientNome: 'The Ozzy',
    endereco: 'São Paulo - SP',
    lat: -23.5641,
    lng: -46.6521,
    distancia: 29,
    status: 'no_local',
    entradaHora: '12:56',
    saidaHora: '16:06',
    obs: '[SIMULADO] Modelo em set The Ozzy (Agenda 03/11)',
  },
  {
    idSuffix: 'ext-19',
    dateStr: '2026-11-04',
    employee_id: 'usr-gimenez',
    nome: 'Gimenez (Filmmaker)',
    cor: '#10b981',
    client_id: 'cli-legado',
    clientNome: 'Legado',
    endereco: 'São Paulo - SP',
    lat: -23.5685,
    lng: -46.6691,
    distancia: 21,
    status: 'no_local',
    entradaHora: '11:50',
    saidaHora: '15:02',
    obs: '[SIMULADO] Captação Legado (Agenda 04/11)',
  },
  {
    idSuffix: 'ext-20',
    dateStr: '2026-11-04',
    employee_id: 'usr-victor',
    nome: 'Victor (Filmmaker)',
    cor: '#3b82f6',
    client_id: 'cli-nine-nine',
    clientNome: 'Nine Nine',
    endereco: 'São Paulo - SP',
    lat: -23.559,
    lng: -46.663,
    distancia: 34,
    status: 'no_local',
    entradaHora: '13:52',
    obs: '[SIMULADO] Check-in gravação Nine Nine (Agenda 04/11)',
  },
];

function generateExternalPontos(): PontoRegistro[] {
  const list: PontoRegistro[] = [];

  for (const spec of EXTERNAL_FIELD_SPECS) {
    const entradaIso = `${spec.dateStr}T${spec.entradaHora}:00-03:00`;
    list.push({
      id: `sim-pto-${spec.idSuffix}-in`,
      employee_id: spec.employee_id,
      client_id: spec.client_id,
      tipo: 'entrada',
      data_hora: entradaIso,
      latitude: spec.lat,
      longitude: spec.lng,
      precisao_metros: 15,
      distancia_metros: spec.distancia,
      endereco: `${spec.clientNome} • ${spec.endereco}`,
      status_localizacao: spec.status,
      foto_url: buildSimulatedSelfieSvg(spec.nome, spec.clientNome, `${spec.dateStr.split('-').reverse().join('/')} ${spec.entradaHora}`, spec.cor),
      observacao: spec.obs,
      created_at: entradaIso,
    });

    if (spec.saidaHora) {
      const saidaIso = `${spec.dateStr}T${spec.saidaHora}:00-03:00`;
      list.push({
        id: `sim-pto-${spec.idSuffix}-out`,
        employee_id: spec.employee_id,
        client_id: spec.client_id,
        tipo: 'saida',
        data_hora: saidaIso,
        latitude: spec.lat,
        longitude: spec.lng,
        precisao_metros: 15,
        distancia_metros: spec.distancia,
        endereco: `${spec.clientNome} • ${spec.endereco}`,
        status_localizacao: spec.status,
        foto_url: buildSimulatedSelfieSvg(spec.nome, `${spec.clientNome} (Saída)`, `${spec.dateStr.split('-').reverse().join('/')} ${spec.saidaHora}`, spec.cor),
        observacao: `${spec.obs} • Check-out finalização de set`,
        created_at: saidaIso,
      });
    }
  }

  return list;
}

export const INITIAL_PONTOS: PontoRegistro[] = [...generateExternalPontos(), ...generateInternalPontos()].sort(
  (a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime()
);
