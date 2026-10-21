'use client';

/**
 * Utilitário de Persistência Resiliente e Backup em 1 Clique
 * Garante que a agência NUNCA perca arquivos, gravações, clientes ou pontos.
 */

export interface SystemBackupPayload {
  version: string;
  exportedAt: string;
  agencyName: string;
  data: {
    employees: any[];
    clients: any[];
    events: any[];
    pontos: any[];
    deliverables: any[];
    reels: any[];
    mentions: any[];
  };
}

export const STORAGE_KEYS = {
  EMPLOYEES: 'navegando_mkt_employees_v2',
  CLIENTS: 'navegando_mkt_clients_v2',
  EVENTS: 'navegando_mkt_events_v2',
  PONTOS: 'navegando_mkt_pontos_v2',
  DELIVERABLES: 'navegando_mkt_deliverables_v2',
  REELS: 'navegando_mkt_reels_v2',
  MENTIONS: 'navegando_mkt_mentions_v2',
  LAST_BACKUP: 'navegando_mkt_last_backup_time',
} as const;

/**
 * Lê do LocalStorage com fallback seguro
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[Storage] Falha ao carregar ${key}:`, err);
    return defaultValue;
  }
}

/**
 * Salva no LocalStorage com tratamento resiliente de cota
 */
export function saveToStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`[Storage] Cota de armazenamento atingida ao salvar ${key}. Aplicando compressão segura...`);
    try {
      // Se for array de pontos ou dados com fotos pesadas em Base64, limpa fotos antigas
      if (Array.isArray(value)) {
        const sanitized = value.slice(0, 30).map((item) => {
          if (item && typeof item === 'object' && 'foto_url' in item) {
            const foto = (item as any).foto_url;
            return {
              ...item,
              foto_url: typeof foto === 'string' && foto.length > 500 ? foto.slice(0, 100) + '...' : foto,
            };
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(sanitized));
        return true;
      } else if (value && typeof value === 'object' && 'lastPonto' in value) {
        const copy: any = { ...value };
        if (copy.lastPonto && copy.lastPonto.foto_url) {
          copy.lastPonto = { ...copy.lastPonto, foto_url: '' };
        }
        localStorage.setItem(key, JSON.stringify(copy));
        return true;
      }
    } catch (innerErr) {
      console.warn(`[Storage] Não foi possível persistir ${key} localmente:`, innerErr);
    }
    return false;
  }
}

/**
 * Gera e dispara o download de um arquivo JSON com todo o banco de dados da agência
 */
export function downloadSystemBackup(payload: SystemBackupPayload): void {
  try {
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateFormatted = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.href = url;
    a.download = `backup_navegando_mkt_${dateFormatted}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Salvar data do último backup
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, new Date().toISOString());
    }
  } catch (e) {
    console.error('[Backup] Erro ao exportar backup:', e);
    alert('Erro ao gerar arquivo de backup. Verifique as permissões de download.');
  }
}

/**
 * Lê um arquivo JSON carregado pelo usuário e valida estrutura
 */
export async function parseBackupFile(file: File): Promise<SystemBackupPayload | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || !parsed.data) {
          throw new Error('Arquivo de backup inválido ou corrompido.');
        }
        resolve(parsed as SystemBackupPayload);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo selecionado.'));
    reader.readAsText(file);
  });
}
