import { Employee, Client, EventItem } from '@/types/database';
import { USERS_DATABASE } from '@/lib/auth-users';

export const INITIAL_EMPLOYEES: Employee[] = USERS_DATABASE.map((u) => ({
  id: u.employeeId,
  nome: u.nome,
  cor: u.cor,
  funcao: u.funcao,
  regime: u.regime,
  cargo_detalhado: u.cargo,
  username: u.username,
  ativo: true,
}));

export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_EVENTS: EventItem[] = [];
