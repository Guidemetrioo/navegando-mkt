import type { Employee } from '@/types/database';

/** A production assignment does not change the member authorization role. */
export function isFilmmaker(employee: Employee | null | undefined): boolean {
  return Boolean(employee && (employee.funcao === 'filmmaker' || employee.funcoes_producao?.includes('filmmaker')));
}
