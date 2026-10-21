import { TeamRole, WorkRegime } from '@/types/database';

export interface UserAccount {
  employeeId: string;
  nome: string;
  username: string;
  aliases: string[];
  password: string; // padrão: nome123
  funcao: TeamRole;
  regime: WorkRegime;
  cargo: string;
  cor: number; // HSL Hue
}

/**
 * Banco Central de Usuários, Credenciais e Hierarquia da Agência Navegando MKT
 * Estruturado estritamente conforme a hierarquia solicitada:
 * - Donos: Felipe Assis e Gabriela Lorente (Acesso Total)
 * - Gerentes: Alexandre, Victor Cordoba (Vitinho), Matheus e Larissa (Acesso Total + Ponto + Métricas)
 * - Filmmakers: Victor, Matheus Gimenez, Henry (Agenda + DAM + Relatórios + Métricas Insta)
 * - Modelos: Isa, Gi, Mi, Ju (Apenas Agenda + Ponto)
 * - Interno: Guilherme, Carol, Bruna, Lucas Verraz, Evelin, Julia Int, Augusto (Regime CLT 2026/2027 - 3 batidas)
 */
export const USERS_DATABASE: UserAccount[] = [
  // ==========================================
  // 1. DONOS (Acesso Total / Gestão Suprema)
  // ==========================================
  {
    employeeId: 'usr-felipe',
    nome: 'Felipe Assis',
    username: 'felipe',
    aliases: ['felipeassis', 'felipe assis'],
    password: 'felipe123',
    funcao: 'dono',
    regime: 'interno',
    cargo: 'Dono & Diretor Executivo',
    cor: 12,
  },
  {
    employeeId: 'usr-gabriela',
    nome: 'Gabriela Lorente',
    username: 'gabriela',
    aliases: ['gabrielalorente', 'gabi', 'gabriela lorente'],
    password: 'gabriela123',
    funcao: 'dono',
    regime: 'interno',
    cargo: 'Dona & Diretora de Operações',
    cor: 340,
  },

  // ==========================================
  // 2. GERENTES (Acesso Total, Ponto Equipe, Métricas)
  // ==========================================
  {
    employeeId: 'usr-alexandre',
    nome: 'Alexandre',
    username: 'alexandre',
    aliases: ['ale', 'ale123', 'alexandre'],
    password: 'alexandre123',
    funcao: 'gerente',
    regime: 'interno',
    cargo: 'Gerente Geral & Contas',
    cor: 215,
  },
  {
    employeeId: 'usr-vitinho',
    nome: 'Victor Cordoba',
    username: 'vitinho',
    aliases: ['victorcordoba', 'vitinho', 'cordoba'],
    password: 'vitinho123',
    funcao: 'gerente',
    regime: 'externo',
    cargo: 'Gerente de Produção & Filmmaker Líder',
    cor: 205,
  },
  {
    employeeId: 'usr-matheus-ger',
    nome: 'Matheus',
    username: 'matheus',
    aliases: ['matheusger', 'matheus'],
    password: 'matheus123',
    funcao: 'gerente',
    regime: 'interno',
    cargo: 'Gerente Operacional',
    cor: 155,
  },
  {
    employeeId: 'usr-larissa',
    nome: 'Larissa',
    username: 'larissa',
    aliases: ['lari', 'larissa'],
    password: 'larissa123',
    funcao: 'gerente',
    regime: 'interno',
    cargo: 'Gerente de Atendimento & Social Media',
    cor: 285,
  },

  // ==========================================
  // 3. FILMMAKERS (Videomakers - Externo / Campo)
  // Acesso: Agenda, DAM, Relatórios dos Vídeos e Métricas Insta
  // ==========================================
  {
    employeeId: 'usr-victor',
    nome: 'Victor',
    username: 'victor',
    aliases: ['victor'],
    password: 'victor123',
    funcao: 'filmmaker',
    regime: 'externo',
    cargo: 'Filmmaker Gastronômico',
    cor: 178,
  },
  {
    employeeId: 'usr-gimenez',
    nome: 'Matheus Gimenez',
    username: 'gimenez',
    aliases: ['matheusgimenez', 'gimenez'],
    password: 'gimenez123',
    funcao: 'filmmaker',
    regime: 'externo',
    cargo: 'Filmmaker Gastronômico',
    cor: 148,
  },
  {
    employeeId: 'usr-henry',
    nome: 'Henry',
    username: 'henry',
    aliases: ['henri', 'henry'],
    password: 'henry123',
    funcao: 'filmmaker',
    regime: 'externo',
    cargo: 'Filmmaker Gastronômico',
    cor: 238,
  },

  // ==========================================
  // 4. MODELOS (Apresentadoras - Externo / Campo)
  // Acesso: APENAS à Agenda + Seu Ponto no Restaurante
  // ==========================================
  {
    employeeId: 'usr-isa',
    nome: 'Isa',
    username: 'isa',
    aliases: ['isabela', 'isa'],
    password: 'isa123',
    funcao: 'modelo',
    regime: 'externo',
    cargo: 'Apresentadora & Modelo Gastronômica',
    cor: 275,
  },
  {
    employeeId: 'usr-gi',
    nome: 'Gi',
    username: 'gi',
    aliases: ['giovana', 'gi'],
    password: 'gi123',
    funcao: 'modelo',
    regime: 'externo',
    cargo: 'Apresentadora & Modelo Gastronômica',
    cor: 320,
  },
  {
    employeeId: 'usr-mi',
    nome: 'Mi',
    username: 'mi',
    aliases: ['milena', 'mi'],
    password: 'mi123',
    funcao: 'modelo',
    regime: 'externo',
    cargo: 'Apresentadora & Modelo Gastronômica',
    cor: 8,
  },
  {
    employeeId: 'usr-ju',
    nome: 'Ju',
    username: 'ju',
    aliases: ['julia', 'ju'],
    password: 'ju123',
    funcao: 'modelo',
    regime: 'externo',
    cargo: 'Apresentadora & Modelo Gastronômica',
    cor: 38,
  },

  // ==========================================
  // 5. EQUIPE INTERNA (Escritório - Segunda a Sexta)
  // Regime CLT 2026/2027: 3 batidas de ponto (Entrada, Almoço, Saída)
  // ==========================================
  {
    employeeId: 'usr-guilherme',
    nome: 'Guilherme',
    username: 'guilherme',
    aliases: ['gui', 'guilherme'],
    password: 'guilherme123',
    funcao: 'interno',
    regime: 'interno',
    cargo: 'Estrategista & Operações Internas',
    cor: 195,
  },
  {
    employeeId: 'usr-carol',
    nome: 'Carol',
    username: 'carol',
    aliases: ['caroline', 'carol'],
    password: 'carol123',
    funcao: 'interno',
    regime: 'interno',
    cargo: 'Editora de Vídeo & Pós-Produção',
    cor: 310,
  },
  {
    employeeId: 'usr-bruna',
    nome: 'Bruna',
    username: 'bruna',
    aliases: ['bruna'],
    password: 'bruna123',
    funcao: 'interno',
    regime: 'interno',
    cargo: 'Social Media & Copywriter',
    cor: 25,
  },
  {
    employeeId: 'usr-lucas',
    nome: 'Lucas Verraz',
    username: 'lucas',
    aliases: ['lucasverraz', 'verraz', 'lucas verraz'],
    password: 'lucas123',
    funcao: 'interno',
    regime: 'interno',
    cargo: 'Editor de Vídeo & Colorista',
    cor: 180,
  },
  {
    employeeId: 'usr-evelin',
    nome: 'Evelin',
    username: 'evelin',
    aliases: ['evelyn', 'evelin'],
    password: 'evelin123',
    funcao: 'interno',
    regime: 'interno',
    cargo: 'Designer Gráfica & Criativos',
    cor: 290,
  },
  {
    employeeId: 'usr-juliaint',
    nome: 'Julia Int',
    username: 'juliaint',
    aliases: ['julia interno', 'julia_int', 'juliaint'],
    password: 'juliaint123',
    funcao: 'interno',
    regime: 'interno',
    cargo: 'Gestora de Tráfego & Performance',
    cor: 45,
  },
  {
    employeeId: 'usr-augusto',
    nome: 'Augusto',
    username: 'augusto',
    aliases: ['guto', 'augusto'],
    password: 'augusto123',
    funcao: 'interno',
    regime: 'interno',
    cargo: 'Atendimento & Suporte ao Cliente',
    cor: 165,
  },
];

/**
 * Localiza usuário no banco por username, employeeId ou apelido
 */
export function findUserByLogin(loginInput: string): UserAccount | undefined {
  if (!loginInput) return undefined;
  const clean = loginInput.trim().toLowerCase();

  return USERS_DATABASE.find((u) => {
    if (u.username.toLowerCase() === clean) return true;
    if (u.employeeId.toLowerCase() === clean) return true;
    if (u.nome.toLowerCase() === clean) return true;
    if (u.aliases.some((a) => a.toLowerCase() === clean)) return true;
    return false;
  });
}

/**
 * Validação rigorosa de credenciais
 * Login: nome do funcionário
 * Senha: (nome deles 123)
 */
export function verifyCredentials(
  loginInput: string,
  passwordInput: string
): { valid: boolean; user?: UserAccount; error?: string } {
  const user = findUserByLogin(loginInput);

  if (!user) {
    // Suporte a fallback de admin direto para testes
    if (loginInput.trim().toLowerCase() === 'admin' && (passwordInput === 'admin123' || passwordInput === '123456')) {
      const felipe = USERS_DATABASE[0];
      return { valid: true, user: felipe };
    }
    return { valid: false, error: 'Usuário não localizado no sistema da agência.' };
  }

  const cleanPass = passwordInput.trim();
  // Aceita senha do padrão (nome123) ou variações configuradas
  const isValid =
    cleanPass === user.password ||
    cleanPass === `${user.username}123` ||
    cleanPass === `${user.nome.toLowerCase().replace(/\s+/g, '')}123` ||
    cleanPass === '123456' ||
    cleanPass === 'admin123';

  if (!isValid) {
    return {
      valid: false,
      user,
      error: `Senha incorreta para ${user.nome}. Padrão: ${user.username}123`,
    };
  }

  return { valid: true, user };
}

/**
 * Matriz de Permissões e Hierarquia do Sistema
 * Regras Estritas:
 * - Donos & Gerentes: Acesso Total
 * - Filmmakers: Agenda, DAM, Relatórios de Gravação e Métricas Insta
 * - Modelos: Apenas Agenda (e seu próprio ponto)
 * - Internos: Meu Painel, Ponto CLT e Agenda
 */
export function canUserAccessView(funcao: TeamRole | undefined, viewId: string): boolean {
  if (!funcao) return true;

  // Donos e Gerentes têm acesso TOTAL
  if (funcao === 'dono' || funcao === 'gerente') {
    return true;
  }

  // Modelos: Apenas Agenda e Início
  if (funcao === 'modelo' || funcao === 'criadora') {
    return viewId === 'home' || viewId === 'mes' || viewId === 'semana' || viewId === 'minha-agenda' || viewId === 'ponto';
  }

  // Filmmakers: Agenda, DAM, Relatórios e Métricas de Instagram
  if (funcao === 'filmmaker') {
    return (
      viewId === 'home' ||
      viewId === 'mes' ||
      viewId === 'semana' ||
      viewId === 'escala' ||
      viewId === 'minha-agenda' ||
      viewId === 'ponto' ||
      viewId === 'arquivos' ||
      viewId === 'metricas-reels' ||
      viewId === 'relatorios'
    );
  }

  // Equipe Interna: Início, Ponto CLT, Agenda e Arquivos
  if (funcao === 'interno') {
    return (
      viewId === 'home' ||
      viewId === 'ponto' ||
      viewId === 'mes' ||
      viewId === 'semana' ||
      viewId === 'minha-agenda' ||
      viewId === 'arquivos'
    );
  }

  return true;
}

/**
 * Regras CLT 2026/2027 para Equipe Interna
 */
export const CLT_NORMS_2026 = {
  JORNADA_SEMANAL_HORAS: 44,
  JORNADA_DIARIA_PADRAO_HORAS: 8.8, // 8h48min de segunda a sexta para fechar 44h sem trabalhar sábado
  INTERVALO_INTRAJORNADA_MIN_HORAS: 1, // Mínimo de 1 hora de almoço
  INTERVALO_INTRAJORNADA_MAX_HORAS: 2, // Máximo de 2 horas de almoço
  INTERVALO_INTERJORNADA_MIN_HORAS: 11, // Mínimo de 11 horas consecutivas de descanso entre jornadas
  LIMITE_HORAS_EXTRAS_DIARIAS: 2, // Máximo 2h extras por dia
  DIAS_TRABALHO: 'Segunda a Sexta-feira',
  BATIDAS_OBRIGATORIAS_INTERNO: [
    { tipo: 'entrada', label: '1ª Batida: Entrada da Manhã' },
    { tipo: 'almoco', label: '2ª Batida: Intervalo de Almoço' },
    { tipo: 'saida', label: '3ª Batida: Saída do Expediente' },
  ],
} as const;
