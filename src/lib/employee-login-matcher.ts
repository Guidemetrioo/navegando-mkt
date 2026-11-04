import { USERS_DATABASE, UserAccount } from '@/lib/auth-users';
import { INITIAL_EMPLOYEES } from '@/lib/supabase/mock-data';
import { Employee, TeamRole } from '@/types/database';

export interface IdentifiedLogin {
  employee: Employee;
  account: UserAccount;
  role: 'dono' | 'gerente' | 'filmmaker' | 'modelo' | 'interno';
  matchedBy: string;
}

function normalizeToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function normalizeRole(funcao: TeamRole): 'dono' | 'gerente' | 'filmmaker' | 'modelo' | 'interno' {
  if (funcao === 'criadora') return 'modelo';
  return funcao;
}

/**
 * Identifica automaticamente qual funcionário da Navegando MKT e qual nível
 * de hierarquia corresponde ao login do Supabase Auth (e-mail ou metadados).
 */
export function identifyEmployeeFromLogin(
  email?: string | null,
  metadata?: Record<string, unknown> | null
): IdentifiedLogin | null {
  const candidates: string[] = [];

  if (metadata) {
    for (const key of ['employee_id', 'employeeId', 'username', 'nome', 'name', 'full_name']) {
      const val = metadata[key];
      if (typeof val === 'string' && val.trim()) {
        candidates.push(val.trim());
      }
    }
  }

  if (email && email.trim()) {
    const localPart = email.trim().split('@')[0] || '';
    if (localPart) {
      candidates.push(localPart);
      // Também testa sem números no final (ex: victor123@... -> victor)
      const withoutTrailingDigits = localPart.replace(/\d+$/, '');
      if (withoutTrailingDigits && withoutTrailingDigits !== localPart) {
        candidates.push(withoutTrailingDigits);
      }
      // Partes separadas por ponto, traço ou underline (ex: milena.modelo@... -> milena)
      const subParts = localPart.split(/[._-]+/).filter(Boolean);
      candidates.push(...subParts);
    }
  }

  for (const rawCandidate of candidates) {
    const clean = normalizeToken(rawCandidate);
    if (!clean) continue;

    // 1. Busca exata por employeeId, username, nome ou aliases
    const exactMatch = USERS_DATABASE.find((u) => {
      if (normalizeToken(u.employeeId) === clean) return true;
      if (normalizeToken(u.username) === clean) return true;
      if (normalizeToken(u.nome) === clean) return true;
      return u.aliases.some((a) => normalizeToken(a) === clean);
    });

    if (exactMatch) {
      const emp =
        INITIAL_EMPLOYEES.find((e) => e.id === exactMatch.employeeId) || {
          id: exactMatch.employeeId,
          nome: exactMatch.nome,
          cor: exactMatch.cor,
          funcao: exactMatch.funcao,
          regime: exactMatch.regime,
          cargo_detalhado: exactMatch.cargo,
          username: exactMatch.username,
          ativo: true,
        };
      return {
        employee: emp,
        account: exactMatch,
        role: normalizeRole(exactMatch.funcao),
        matchedBy: rawCandidate,
      };
    }

    // 2. Busca por prefixo de apelido conhecido (ex: "milenaoliveira" -> milena -> usr-mi)
    const prefixMatch = USERS_DATABASE.find((u) => {
      const tokens = [u.username, u.nome, ...u.aliases].map(normalizeToken).filter((t) => t.length >= 3);
      return tokens.some((t) => clean.startsWith(t) || t.startsWith(clean));
    });

    if (prefixMatch) {
      const emp =
        INITIAL_EMPLOYEES.find((e) => e.id === prefixMatch.employeeId) || {
          id: prefixMatch.employeeId,
          nome: prefixMatch.nome,
          cor: prefixMatch.cor,
          funcao: prefixMatch.funcao,
          regime: prefixMatch.regime,
          cargo_detalhado: prefixMatch.cargo,
          username: prefixMatch.username,
          ativo: true,
        };
      return {
        employee: emp,
        account: prefixMatch,
        role: normalizeRole(prefixMatch.funcao),
        matchedBy: rawCandidate,
      };
    }
  }

  return null;
}

export const HIERARCHY_LABELS: Record<'dono' | 'gerente' | 'filmmaker' | 'modelo' | 'criadora' | 'interno', {
  label: string;
  nivel: string;
  acessos: string;
}> = {
  dono: {
    label: 'Dono / Diretoria',
    nivel: 'Nível 1 • Acesso Total',
    acessos: 'Agenda, Briefing, Ponto Equipe, Relatórios, Reembolsos, Restaurantes, Financeiro, WhatsApp e Backup',
  },
  gerente: {
    label: 'Gerente',
    nivel: 'Nível 2 • Gestão Operacional',
    acessos: 'Agenda, Briefing, Ponto Equipe, Relatórios, Reembolsos, Restaurantes, Financeiro, WhatsApp e Backup',
  },
  filmmaker: {
    label: 'Filmmaker (Campo)',
    nivel: 'Nível 3 • Captação Externa',
    acessos: 'Agenda, Escala, Minha Agenda, Ponto GPS no Restaurante, Relatórios de Vídeos, Briefing e Meus Reembolsos',
  },
  modelo: {
    label: 'Modelo / Apresentadora (Campo)',
    nivel: 'Nível 4 • Apresentação Externa',
    acessos: 'Agenda, Minha Agenda, Ponto GPS no Restaurante, Briefing e Meus Reembolsos (sem dados contratuais)',
  },
  criadora: {
    label: 'Modelo / Apresentadora (Campo)',
    nivel: 'Nível 4 • Apresentação Externa',
    acessos: 'Agenda, Minha Agenda, Ponto GPS no Restaurante, Briefing e Meus Reembolsos (sem dados contratuais)',
  },
  interno: {
    label: 'Equipe Interna (CLT)',
    nivel: 'Nível 3 • Operação Interna',
    acessos: 'Agenda, Minha Agenda, Ponto CLT (3 batidas: Entrada, Almoço e Saída), Briefing e Meus Reembolsos',
  },
};
