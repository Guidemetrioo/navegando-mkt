import { WhatsAppConfig, WhatsAppMessageLog } from '@/types/database';
import { todayInSaoPaulo } from '@/lib/date-utils';

const today = todayInSaoPaulo();

export const INITIAL_WHATSAPP_CONFIG: WhatsAppConfig = {
  conectado: true,
  status: 'conectado',
  instancia_nome: 'Navegando MKT • Bot de Atendimento Oficial',
  numero_conectado: '+55 11 93450-8800',
  pairing_code: 'NW89-4KT2',
  auto_confirmacao_d1: true,
  horario_envio_padrao: '09:00',
  template_mensagem: `Olá, {{responsavel}}! Passando para confirmar a gravação de conteúdo da *Navegando MKT* agendada para amanhã ({{data}}) das {{hora_inicio}} às {{hora_fim}} no *{{restaurante}}*.

Nossa equipe técnica ({{equipe}}) estará no local para captação dos novos vídeos e fotos.

Por favor, responda com uma das opções abaixo:
1 - *Confirmado* (Horário e equipe mantidos)
2 - *Remarcar* (Necessito de nova data)`,
  tentativas_webhook: 0,
  ultima_verificacao: `${today}T09:00:00Z`,
};

export const INITIAL_WHATSAPP_LOGS: WhatsAppMessageLog[] = [
  {
    id: 'wpp-log-1',
    event_id: 'evt-1',
    client_id: 'cli-1',
    cliente_nome: 'Cantina Bella Massa',
    numero_destino: '+55 11 98765-4321',
    tipo: 'envio_confirmacao',
    mensagem: 'Olá, Gianluca! Passando para confirmar a gravação da Navegando MKT agendada para amanhã (12/10) das 09:00 às 12:00 no Cantina Bella Massa. Equipe: Vitinho + Giovana.',
    status: 'respondida',
    resposta_detectada: 'confirmado',
    data_hora: '2026-10-11T09:02:14Z',
  },
  {
    id: 'wpp-log-2',
    event_id: 'evt-1',
    client_id: 'cli-1',
    cliente_nome: 'Cantina Bella Massa',
    numero_destino: '+55 11 98765-4321',
    tipo: 'resposta_cliente',
    mensagem: '1 - Confirmadíssimo! A roda de queijo e os pratos já estarão separados.',
    status: 'respondida',
    resposta_detectada: 'confirmado',
    data_hora: '2026-10-11T09:14:30Z',
  },
  {
    id: 'wpp-log-3',
    event_id: 'evt-2',
    client_id: 'cli-2',
    cliente_nome: 'Sushi Hoshi',
    numero_destino: '+55 11 97654-3210',
    tipo: 'envio_confirmacao',
    mensagem: 'Olá, Kenji Sato! Passando para confirmar a gravação de primavera agendada para amanhã (12/10) das 14:00 às 17:00 no Sushi Hoshi. Equipe: Matheus Gimenez + Milena.',
    status: 'respondida',
    resposta_detectada: 'confirmado',
    data_hora: '2026-10-11T09:03:00Z',
  },
  {
    id: 'wpp-log-4',
    event_id: 'evt-2',
    client_id: 'cli-2',
    cliente_nome: 'Sushi Hoshi',
    numero_destino: '+55 11 97654-3210',
    tipo: 'resposta_cliente',
    mensagem: 'Confirmado! Estaremos aguardando o Gimenez e a Milena às 14h.',
    status: 'respondida',
    resposta_detectada: 'confirmado',
    data_hora: '2026-10-11T09:45:10Z',
  },
  {
    id: 'wpp-log-5',
    event_id: 'evt-5',
    client_id: 'cli-5',
    cliente_nome: 'Hamburgueria Artesanal Smash',
    numero_destino: '+55 11 94321-0987',
    tipo: 'envio_confirmacao',
    mensagem: 'Olá, Thiago! Passando para confirmar a gravação de conteúdo agendada para amanhã (14/10) das 10:00 às 13:30 na Hamburgueria Artesanal Smash.',
    status: 'respondida',
    resposta_detectada: 'confirmado',
    data_hora: '2026-10-13T09:00:15Z',
  },
  {
    id: 'wpp-log-6',
    event_id: 'evt-5',
    client_id: 'cli-5',
    cliente_nome: 'Hamburgueria Artesanal Smash',
    numero_destino: '+55 11 94321-0987',
    tipo: 'resposta_cliente',
    mensagem: 'Sim, tudo certo! O salão estará disponível.',
    status: 'respondida',
    resposta_detectada: 'confirmado',
    data_hora: '2026-10-13T09:30:22Z',
  },
];
