import { WhatsAppConfig, WhatsAppMessageLog } from '@/types/database';

export const INITIAL_WHATSAPP_CONFIG: WhatsAppConfig = {
  conectado: false,
  status: 'desconectado',
  instancia_nome: 'Navegando MKT • Atendimento Oficial',
  numero_conectado: '',
  auto_confirmacao_d1: true,
  horario_envio_padrao: '09:00',
  template_mensagem: `Olá, {{responsavel}}! Passando para confirmar a gravação de conteúdo da *Navegando MKT* agendada para amanhã ({{data}}) das {{hora_inicio}} às {{hora_fim}} no *{{restaurante}}*.

Nossa equipe técnica ({{equipe}}) estará no local para captação dos novos vídeos e fotos.

Por favor, responda com uma das opções abaixo:
1 - *Confirmado* (Horário e equipe mantidos)
2 - *Remarcar* (Necessito de nova data)`,
  tentativas_webhook: 0,
};

export const INITIAL_WHATSAPP_LOGS: WhatsAppMessageLog[] = [];
