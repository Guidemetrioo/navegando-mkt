import {
  FuncionarioSalario,
  DespesaGravacao,
  TransacaoFinanceira,
} from '@/types/database';

/**
 * Identifica registros legados prefixados com "sim-".
 */
export function isSimulatedRecord(id?: string | null): boolean {
  if (!id) return false;
  return id.startsWith('sim-');
}

export const INITIAL_SALARIOS: FuncionarioSalario[] = [];

export const INITIAL_DESPESAS_GRAVACOES: DespesaGravacao[] = [];

export const INITIAL_TRANSACOES: TransacaoFinanceira[] = [];
