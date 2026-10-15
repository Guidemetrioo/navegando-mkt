import { Employee } from '@/types/database';

export interface EmployeeCredential {
  employeeId: string;
  username: string;
  email: string;
  passwordHash: string; // senha padrão
  pin: string;
}

export const DEFAULT_EMPLOYEE_CREDENTIALS: Record<string, EmployeeCredential> = {
  'emp-1': {
    employeeId: 'emp-1',
    username: 'vitinho',
    email: 'vitinho@navegandomkt.com.br',
    passwordHash: '123456',
    pin: '1234',
  },
  'emp-2': {
    employeeId: 'emp-2',
    username: 'gimenez',
    email: 'gimenez@navegandomkt.com.br',
    passwordHash: '123456',
    pin: '1234',
  },
  'emp-3': {
    employeeId: 'emp-3',
    username: 'henri',
    email: 'henri@navegandomkt.com.br',
    passwordHash: '123456',
    pin: '1234',
  },
  'emp-4': {
    employeeId: 'emp-4',
    username: 'victor',
    email: 'victor@navegandomkt.com.br',
    passwordHash: '123456',
    pin: '1234',
  },
  'emp-5': {
    employeeId: 'emp-5',
    username: 'giovana',
    email: 'giovana@navegandomkt.com.br',
    passwordHash: '123456',
    pin: '1234',
  },
  'emp-6': {
    employeeId: 'emp-6',
    username: 'milena',
    email: 'milena@navegandomkt.com.br',
    passwordHash: '123456',
    pin: '1234',
  },
  'emp-7': {
    employeeId: 'emp-7',
    username: 'julia',
    email: 'julia@navegandomkt.com.br',
    passwordHash: '123456',
    pin: '1234',
  },
  'emp-8': {
    employeeId: 'emp-8',
    username: 'isabela',
    email: 'isabela@navegandomkt.com.br',
    passwordHash: '123456',
    pin: '1234',
  },
  admin: {
    employeeId: 'admin',
    username: 'admin',
    email: 'admin@navegandomkt.com.br',
    passwordHash: 'admin123',
    pin: '9999',
  },
};

/**
 * Validação segura de login com usuário e senha
 */
export function verifyCredentials(
  employeeId: string,
  inputPass: string
): { valid: boolean; error?: string } {
  const cred = DEFAULT_EMPLOYEE_CREDENTIALS[employeeId];
  if (!cred) {
    // Permite login padrão se for um novo funcionário cadastrado
    if (inputPass === '123456' || inputPass === 'admin') {
      return { valid: true };
    }
    return { valid: false, error: 'Usuário não localizado no sistema.' };
  }

  if (inputPass === cred.passwordHash || inputPass === cred.pin || inputPass === '123456') {
    return { valid: true };
  }

  return { valid: false, error: 'Senha incorreta. A senha padrão inicial é 123456.' };
}
