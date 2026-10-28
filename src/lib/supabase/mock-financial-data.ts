import {
  FuncionarioSalario,
  DespesaGravacao,
  TransacaoFinanceira,
} from '@/types/database';
import { USERS_DATABASE } from '@/lib/auth-users';

export const INITIAL_SALARIOS: FuncionarioSalario[] = USERS_DATABASE.map((u) => ({
  employee_id: u.employeeId,
  nome: u.nome,
  cargo: u.cargo,
  regime: u.regime,
  tipo_contrato: u.regime === 'interno' ? 'clt' : 'pj',
  valor_base: 0,
  dia_pagamento: 5,
  chave_pix: '',
  banco: '',
  status_mes_atual: 'pendente',
}));

export const INITIAL_DESPESAS_GRAVACOES: DespesaGravacao[] = [];

export const INITIAL_TRANSACOES: TransacaoFinanceira[] = [];
