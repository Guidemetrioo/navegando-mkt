'use client';

import React, { useState, useEffect } from 'react';
import { AgendaView, useAgenda } from '@/context/AgendaContext';
import { VisualExamplePreview } from './VisualExamplePreview';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  HelpCircle,
  Eye,
  Layers,
  ListChecks,
  FileCheck2,
  Plus,
} from 'lucide-react';

export interface ExampleField {
  label: string;
  value: string;
  highlight?: boolean;
  hint?: string;
}

export interface PageTutorialData {
  view: AgendaView;
  title: string;
  subtitle: string;
  category: string;
  purpose: string;
  installedFunctions: string[];
  agencyBenefits: string[];
  howToFeedSteps: {
    stepTitle: string;
    description: string;
  }[];
  exampleTitle: string;
  exampleSubtitle: string;
  exampleBadge: string;
  exampleFields: ExampleField[];
  ctaLabel?: string;
  ctaAction?: 'client' | 'event' | 'deliverable' | 'ponto';
}

export const PAGE_TUTORIALS: Record<AgendaView, PageTutorialData> = {
  home: {
    view: 'home',
    title: 'Meu Painel Diário (Central Operacional)',
    subtitle: 'Visão personalizada do dia para cada membro da equipe da agência',
    category: 'Visão Geral',
    purpose:
      'Esta página é a central de comando individual de cada colaborador ao entrar no sistema. Ela reúne em uma única tela os compromissos do dia, o status do ponto eletrônico (CLT 3 batidas para equipe interna ou check-in externo para filmmakers/modelos), atalhos rápidos e avisos operacionais.',
    installedFunctions: [
      'Resumo em tempo real das gravações agendadas para hoje e próximos dias',
      'Painel de controle das 3 batidas obrigatórias CLT (Entrada, Almoço e Saída) ou Check-in em Restaurante',
      'Atalhos de 1 clique para abrir a câmera do ponto, lançar gravações ou cadastrar entregáveis',
      'Relógio sincronizado e identificação clara do cargo e permissões do usuário logado',
    ],
    agencyBenefits: [
      'Elimina dúvidas logo cedo sobre "qual restaurante vou gravar hoje" ou "qual meu horário"',
      'Garante que toda a equipe registre o ponto corretamente sem esquecimentos',
      'Direciona cada perfil (Dono, Gerente, Filmmaker, Modelo ou Interno) exatamente para suas prioridades',
    ],
    howToFeedSteps: [
      {
        stepTitle: '1. Comece cadastrando os Restaurantes (Aba Clientes)',
        description:
          'Os indicadores deste painel são alimentados automaticamente conforme os gestores cadastram os restaurantes parceiros e agendam as gravações.',
      },
      {
        stepTitle: '2. Registre o Ponto pelo botão "Bater Ponto"',
        description:
          'Clique no botão de Ponto na barra lateral ou no card do painel, tire a foto de comprovação e confirme sua localização GPS.',
      },
      {
        stepTitle: '3. Navegue pelos módulos no menu esquerdo',
        description:
          'Cada vez que você clicar em uma nova aba pela primeira vez, um guia rápido como este explicará como usar aquela ferramenta.',
      },
    ],
    exampleTitle: 'Exemplo de Painel Diário Abastecido',
    exampleSubtitle: 'Veja como o painel fica quando as gravações e batidas do dia estão registradas:',
    exampleBadge: 'EXEMPLO ILUSTRATIVO — NÃO SALVO NO SISTEMA',
    exampleFields: [
      {
        label: 'Colaborador Logado',
        value: 'Victor Cordoba — Gerente de Produção & Filmmaker Líder',
        highlight: true,
      },
      {
        label: 'Status de Presença Hoje',
        value: '1ª Batida (Entrada) registrada às 08:58 com Foto + GPS Verificado (< 50m)',
      },
      {
        label: 'Próxima Gravação do Dia',
        value: 'Hoje, 10:00 às 13:00 — Trattoria Famiglia Mancini (Dupla: Victor + Isa)',
        highlight: true,
      },
      {
        label: 'Entregas em Aprovação',
        value: '3 Reels 9:16 aguardando aprovação final da gerência na Central DAM',
      },
    ],
    ctaLabel: 'Cadastrar Primeiro Restaurante',
    ctaAction: 'client',
  },

  dashboard: {
    view: 'dashboard',
    title: 'Dashboard Executivo (Indicadores da Agência)',
    subtitle: 'Visão macro de produtividade, entregas e performance para Donos e Gerentes',
    category: 'Gestão Executiva',
    purpose:
      'O Dashboard Executivo consolida todos os números operacionais da agência em tempo real: total de restaurantes ativos, gravações concluídas no mês, taxa de cumprimento de metas de Reels, presença da equipe e andamento do funil de edição.',
    installedFunctions: [
      'KPIs automáticos de restaurantes ativos, gravações agendadas vs. realizadas e vídeos entregues',
      'Monitoramento da meta contratual de Reels de cada restaurante parceiro',
      'Resumo de produtividade da equipe de campo (Filmmakers e Modelos) e equipe interna',
      'Alertas visuais de gravações pendentes de relatório ou vídeos aguardando aprovação',
    ],
    agencyBenefits: [
      'Dá aos donos e gerentes visão instantânea da saúde operacional da agência sem planilhas manuais',
      'Permite identificar rapidamente se algum cliente está atrasado nas entregas do mês',
      'Ajuda a distribuir melhor a carga de trabalho entre filmmakers e editores',
    ],
    howToFeedSteps: [
      {
        stepTitle: '1. Alimentação 100% Automática',
        description:
          'Você não precisa digitar números manualmente aqui. O Dashboard calcula tudo sozinho a partir dos Clientes, Agenda, Ponto e Central DAM.',
      },
      {
        stepTitle: '2. Defina a Meta Mensal de Reels no cadastro do Cliente',
        description:
          'Ao cadastrar um restaurante em "Clientes", informe quantos Reels o plano dele inclui por mês (ex: 8 Reels). O Dashboard acompanhará essa meta automaticamente.',
      },
      {
        stepTitle: '3. Atualize os status das Gravações e dos Vídeos',
        description:
          'Quando uma gravação muda para "Realizado" e um vídeo muda para "Publicado" na Central DAM, os gráficos executivos sobem imediatamente.',
      },
    ],
    exampleTitle: 'Exemplo de Indicadores Executivos Preenchidos',
    exampleSubtitle: 'Como os cartões de resultado aparecem com a operação em andamento:',
    exampleBadge: 'EXEMPLO ILUSTRATIVO — NÃO SALVO NO SISTEMA',
    exampleFields: [
      {
        label: 'Carteira de Clientes Ativos',
        value: '14 Restaurantes Ativos • Meta Global: 112 Reels/mês',
        highlight: true,
      },
      {
        label: 'Gravações no Mês Atual',
        value: '28 Agendadas • 22 Realizadas (100% com check-in GPS confirmado)',
      },
      {
        label: 'Funil de Entregáveis (DAM)',
        value: '85 Publicados • 12 Aprovados • 9 Em Edição • 6 Brutos RAW',
        highlight: true,
      },
      {
        label: 'Receita Recorrente Contratada (MRR)',
        value: 'R$ 58.800,00 / mês somados dos contratos ativos',
      },
    ],
    ctaLabel: 'Cadastrar Restaurante na Carteira',
    ctaAction: 'client',
  },

  clientes: {
    view: 'clientes',
    title: 'Clientes & Restaurantes (Dossiê 360º)',
    subtitle: 'Cadastro completo da carteira de restaurantes parceiros, contratos, briefing e coordenadas GPS',
    category: 'Comercial & Operação',
    purpose:
      'Aqui ficam armazenados todos os restaurantes atendidos pela agência. Este é o cadastro-base mais importante do sistema: ele abastece a Agenda de Gravações, valida o raio de GPS do Ponto Externo, organiza as pastas do Google Drive e alimenta as mensalidades no Controle Financeiro.',
    installedFunctions: [
      'Cadastro completo com Nome, Responsável, WhatsApp, @Instagram, Endereço e Link do Cardápio',
      'Coordenadas de GPS (Latitude e Longitude) para validação automática de presença no restaurante',
      'Dados de Contrato (Plano contratado, Meta mensal de Reels e Valor da Mensalidade)',
      'Dossiê 360º do Cliente: clique em qualquer restaurante para ver todo o histórico de gravações, vídeos, métricas e briefing em uma única janela',
    ],
    agencyBenefits: [
      'Centraliza briefing, links do Drive, cardápio e contato do chef/gerente em um só lugar',
      'Garante que filmmakers e modelos saibam exatamente o estilo de vídeo e endereço de cada cliente',
      'Protege informações comerciais: valores de contrato só aparecem para Donos e Gerentes',
    ],
    howToFeedSteps: [
      {
        stepTitle: '1. Clique no botão "+ Novo Restaurante"',
        description:
          'Disponível no canto superior direito desta página ou no botão "+ Criar" do topo do sistema.',
      },
      {
        stepTitle: '2. Preencha os dados operacionais e o Briefing',
        description:
          'Informe nome, telefone WhatsApp (com DDD, para envio de confirmação D-1), link da pasta do Google Drive e o briefing estético do restaurante.',
      },
      {
        stepTitle: '3. Insira a Latitude e Longitude do Restaurante',
        description:
          'Abra o Google Maps, clique com o botão direito sobre o restaurante e copie os dois números (ex: -23.5605, -46.5985). Isso ativa a conferência de distância quando a equipe bater ponto lá!',
      },
    ],
    exampleTitle: 'Exemplo de Ficha de Restaurante Preenchida',
    exampleSubtitle: 'Modelo ideal de como cadastrar cada cliente real da agência:',
    exampleBadge: 'EXEMPLO DE PREENCHIMENTO — NÃO SALVO NO SISTEMA',
    exampleFields: [
      {
        label: 'Nome do Restaurante & Instagram',
        value: 'Trattoria Bella Napoli • @bellanapoli.sp',
        highlight: true,
      },
      {
        label: 'Responsável & WhatsApp (para Automação D-1)',
        value: 'Chef Marco Bellini • (11) 98877-6655',
      },
      {
        label: 'Endereço & Coordenadas GPS (Google Maps)',
        value: 'Rua dos Pinheiros, 450 - Pinheiros, SP • Lat: -23.5638 / Lng: -46.6854',
        hint: 'Usado pelo radar de ponto para confirmar que a equipe está a menos de 300m do local.',
      },
      {
        label: 'Plano, Meta Mensal & Mensalidade',
        value: 'Plano Gastro Pro • Meta: 8 Reels/mês • R$ 4.200,00/mês (Status: Ativo)',
        highlight: true,
      },
      {
        label: 'Link do Google Drive & Briefing Criativo',
        value: 'https://drive.google.com/drive/folders/... • "Foco em massas artesanais finalizadas na mesa, queijo gratinando e iluminação quente."',
      },
    ],
    ctaLabel: '+ Cadastrar Restaurante Agora',
    ctaAction: 'client',
  },

  mes: {
    view: 'mes',
    title: 'Agenda Mensal de Produções',
    subtitle: 'Calendário panorâmico de todas as gravações, sessões de fotos, edições e reuniões do mês',
    category: 'Produção & Escala',
    purpose:
      'A Agenda Mensal oferece a visão completa do mês para planejar todas as diárias de gravação nos restaurantes, sessões de fotografia de cardápio, blocos de edição e reuniões de alinhamento, evitando choques de horário entre os membros da equipe.',
    installedFunctions: [
      'Calendário interativo mensal com código de cores por tipo de atividade (Gravação, Foto, Edição, Reunião)',
      'Detector inteligente de conflito de escala: avisa na hora se um filmmaker ou modelo já estiver alocado em outro restaurante no mesmo horário',
      'Filtro rápido por colaborador no topo da agenda para enxergar a rotina de cada pessoa',
      'Abertura de detalhes do dia ou edição completa do evento com 1 clique',
    ],
    agencyBenefits: [
      'Acaba com o erro clássico de escalar a mesma pessoa em dois restaurantes no mesmo horário',
      'Permite visualizar facilmente semanas sobrecarregadas ou dias livres para encaixar novas gravações',
      'Conecta cada gravação diretamente ao relatório técnico do filmmaker e às despesas de transporte/alimentação',
    ],
    howToFeedSteps: [
      {
        stepTitle: '1. Clique em qualquer dia do calendário ou em "+ Criar → Nova Gravação"',
        description:
          'Isso abrirá o formulário completo de agendamento de produção.',
      },
      {
        stepTitle: '2. Escolha o Restaurante, Tipo, Data e Horário de Início/Fim',
        description:
          'Selecione o restaurante previamente cadastrado, defina se é Gravação, Fotografia, Edição ou Reunião e ajuste o horário.',
      },
      {
        stepTitle: '3. Escale a Dupla / Equipe Responsável',
        description:
          'Marque quais colaboradores (ex: 1 Filmmaker + 1 Modelo/Apresentadora) participarão da sessão e adicione observações de roteiro.',
      },
    ],
    exampleTitle: 'Exemplo de Gravação Agendada no Calendário',
    exampleSubtitle: 'Veja como uma diária de gravação deve ser preenchida:',
    exampleBadge: 'EXEMPLO DE PREENCHIMENTO — NÃO SALVO NO SISTEMA',
    exampleFields: [
      {
        label: 'Restaurante & Tipo de Sessão',
        value: 'Trattoria Bella Napoli • Tipo: Gravação (Vídeo / Reels)',
        highlight: true,
      },
      {
        label: 'Data & Horário da Diária',
        value: 'Terça-feira, 29/10/2026 • Das 09:00 às 12:30 (Status: Confirmado)',
      },
      {
        label: 'Equipe Escalada na Produção',
        value: 'Victor (Filmmaker Gastronômico) + Isa (Apresentadora & Modelo)',
        highlight: true,
      },
      {
        label: 'Pauta / Observações da Gravação',
        value: 'Gravar 4 Reels: 1) Carbonara no queijo Grana Padano, 2) Drink autoral fumegante, 3) Tiramisù na colherada, 4) Convite de almoço executivo.',
      },
    ],
    ctaLabel: '+ Agendar Nova Gravação',
    ctaAction: 'event',
  },

  semana: {
    view: 'semana',
    title: 'Agenda Semanal Detalhada',
    subtitle: 'Controle tático dos 7 dias da semana com horários, duplas escaladas e locais',
    category: 'Produção & Escala',
    purpose:
      'Enquanto a visão mensal serve para o planejamento macro, a Agenda Semanal é a ferramenta tática da semana em curso: mostra dia a dia os horários exatos de cada gravação, quem está em campo e os restaurantes visitados.',
    installedFunctions: [
      'Colunas dos 7 dias da semana com cartões detalhados de horário, cliente e equipe',
      'Navegação rápida entre semanas (Anterior, Hoje, Próxima)',
      'Filtro por membro da equipe para isolar a semana de um filmmaker ou modelo específico',
      'Acesso direto ao modal da gravação para lançar relatórios técnicos ou despesas de campo',
    ],
    agencyBenefits: [
      'Facilita a reunião semanal de segunda-feira para alinhar todas as saídas de campo da equipe',
      'Permite conferir rapidamente se todas as gravações de amanhã já foram confirmadas no WhatsApp',
    ],
    howToFeedSteps: [
      {
        stepTitle: '1. Clique no botão "+ Criar → Nova Gravação" ou sobre um dia',
        description:
          'Todas as gravações criadas na visão mensal aparecem automaticamente aqui e vice-versa.',
      },
      {
        stepTitle: '2. Clique sobre o cartão de uma gravação para atualizar o Status',
        description:
          'Conforme a semana avança, altere o status de "Agendado" para "Confirmado" ou "Realizado".',
      },
    ],
    exampleTitle: 'Exemplo de Card na Agenda Semanal',
    exampleSubtitle: 'Como cada compromisso aparece organizado na coluna do dia:',
    exampleBadge: 'EXEMPLO DE PREENCHIMENTO — NÃO SALVO NO SISTEMA',
    exampleFields: [
      {
        label: 'Dia & Janela de Horário',
        value: 'Quinta-feira • 14:00 — 17:00',
        highlight: true,
      },
      {
        label: 'Cliente & Localização',
        value: 'Bistrô Le Jardin • Jardins, São Paulo',
      },
      {
        label: 'Dupla Escalada',
        value: 'Matheus Gimenez (Filmmaker) + Gi (Modelo Gastronômica)',
        highlight: true,
      },
      {
        label: 'Status & Confirmação D-1',
        value: 'Confirmado pelo cliente via WhatsApp • Relatório Técnico Pendente',
      },
    ],
    ctaLabel: '+ Agendar Produção na Semana',
    ctaAction: 'event',
  },

  escala: {
    view: 'escala',
    title: 'Escala por Equipe (Matriz de Alocação)',
    subtitle: 'Painel cruzado de colaboradores vs. dias da semana e relatórios de campo',
    category: 'Produção & Escala',
    purpose:
      'A Escala por Equipe mostra uma linha para cada colaborador da agência (Donos, Gerentes, Filmmakers, Modelos e Equipe Interna), permitindo visualizar quem está em qual restaurante em cada turno e acessar os relatórios técnicos das gravações.',
    installedFunctions: [
      'Grade visual cruzando os 20 colaboradores com os dias da semana',
      'Destaque imediato de quem está em campo, em edição interna ou livre no horário',
      'Acesso rápido ao Relatório de Gravação do Filmmaker diretamente pelo card da escala',
      'Prevenção visual de sobrecarga de diárias em um mesmo profissional',
    ],
    agencyBenefits: [
      'Dá transparência total sobre onde cada pessoa da equipe está alocada ao longo da semana',
      'Permite escalar duplas (Filmmaker + Modelo) de forma equilibrada',
    ],
    howToFeedSteps: [
      {
        stepTitle: '1. Escale os colaboradores dentro do cadastro da Gravação',
        description:
          'Ao criar ou editar uma gravação na Agenda, marque os colaboradores em "Equipe Escalada". Eles aparecerão automaticamente na linha correspondente desta matriz.',
      },
      {
        stepTitle: '2. Clique em uma alocação para abrir ou preencher o Relatório',
        description:
          'Após a gravação, o filmmaker ou gestor pode clicar no card da escala para registrar quantos takes foram gravados e o link dos brutos.',
      },
    ],
    exampleTitle: 'Exemplo de Alocação na Escala da Equipe',
    exampleSubtitle: 'Como a linha de um colaborador fica preenchida na semana:',
    exampleBadge: 'EXEMPLO DE PREENCHIMENTO — NÃO SALVO NO SISTEMA',
    exampleFields: [
      {
        label: 'Colaborador & Função',
        value: 'Henry — Filmmaker Gastronômico (Regime Externo / Campo)',
        highlight: true,
      },
      {
        label: 'Segunda-feira (Manhã / Tarde)',
        value: '09:00-12:00: Parrilla Argentina (c/ Mi) • 14:30-17:30: Gelateria Roma (c/ Ju)',
      },
      {
        label: 'Quarta-feira (Noite)',
        value: '18:00-21:00: Cobertura Evento Omakase Sushi (c/ Isa)',
        highlight: true,
      },
      {
        label: 'Relatórios Técnicos da Semana',
        value: '3 de 3 relatórios de captação preenchidos com link do Drive anexado',
      },
    ],
    ctaLabel: '+ Criar Alocação na Agenda',
    ctaAction: 'event',
  },

  'minha-agenda': {
    view: 'minha-agenda',
    title: 'Minha Agenda Individual',
    subtitle: 'Lista exclusiva das gravações e tarefas atribuídas ao colaborador logado',
    category: 'Produção & Escala',
    purpose:
      'Filtra automaticamente toda a agenda da agência para exibir apenas as gravações, sessões de fotos e reuniões em que você está escalado, com endereço do restaurante, horário, dupla de trabalho e atalho para bater ponto.',
    installedFunctions: [
      'Lista cronológica limpa apenas com as suas gravações e tarefas',
      'Exibição direta do endereço do restaurante e briefing da sessão',
      'Botão rápido para registrar o Ponto no Restaurante ou preencher o Relatório Técnico após gravar',
    ],
    agencyBenefits: [
      'No celular, o filmmaker ou a modelo vê em 2 segundos apenas os seus próprios compromissos sem poluição visual',
      'Evita atrasos por confusão de endereço ou horário',
    ],
    howToFeedSteps: [
      {
        stepTitle: '1. Atribuição pela Gerência',
        description:
          'Sempre que um Dono ou Gerente escalar você em uma gravação, ela aparecerá automaticamente nesta lista.',
      },
      {
        stepTitle: '2. Ao chegar no restaurante, bata o Ponto',
        description:
          'Use o botão de ponto para registrar sua chegada com selfie e localização GPS.',
      },
      {
        stepTitle: '3. Ao finalizar a diária, preencha o Relatório (Filmmakers) ou Despesas',
        description:
          'Clique na gravação realizada para anotar os pratos gravados, link de brutos e eventuais gastos de Uber/estacionamento.',
      },
    ],
    exampleTitle: 'Exemplo de Compromisso na Minha Agenda',
    exampleSubtitle: 'Como o colaborador enxerga sua diária no celular ou computador:',
    exampleBadge: 'EXEMPLO DE PREENCHIMENTO — NÃO SALVO NO SISTEMA',
    exampleFields: [
      {
        label: 'Sua Gravação de Hoje',
        value: '10:00 às 13:00 — Steakhouse Fogo & Brasa',
        highlight: true,
      },
      {
        label: 'Endereço para Navegação (GPS)',
        value: 'Av. Magalhães de Castro, 1200 - Cidade Jardim, SP',
      },
      {
        label: 'Sua Dupla na Sessão',
        value: 'Victor (Filmmaker) + Gi (Apresentadora & Modelo)',
        highlight: true,
      },
      {
        label: 'Ações Disponíveis no Card',
        value: '[Bater Ponto de Entrada] • [Preencher Relatório Técnico] • [Lançar Despesa Uber/Estacionamento]',
      },
    ],
    ctaLabel: 'Bater Ponto Agora',
    ctaAction: 'ponto',
  },

  ponto: {
    view: 'ponto',
    title: 'Ponto Eletrônico, Biometria & Geolocalização GPS',
    subtitle: 'Controle de presença em campo (Restaurantes) e jornada interna CLT (3 batidas)',
    category: 'Operação & RH',
    purpose:
      'Gerencia todos os registros de presença da equipe com foto tirada na hora pela câmera (frontal ou traseira) e coordenadas reais de GPS. O sistema opera em dois regimes automáticos: Regime Interno CLT (3 batidas obrigatórias: Entrada, Almoço e Saída) e Regime Externo de Campo (Entrada e Saída no restaurante com cálculo de distância em metros).',
    installedFunctions: [
      'Captura fotográfica ao vivo com alternador de câmera frontal/traseira (sem permitir fotos antigas da galeria)',
      'Cálculo matemático de distância (Haversine) entre o GPS do celular e a coordenada do restaurante (Raio de 300m)',
      'Regra de 3 batidas diárias para a Equipe Interna (Entrada → Almoço → Saída)',
      'Radar ao vivo e histórico auditável com foto, horário exato, precisão do GPS e distância do local',
    ],
    agencyBenefits: [
      'Garante pontualidade nas gravações em clientes e transparência total de horários',
      'Organiza a folha de frequência da equipe interna (editores, social media, tráfego, atendimento)',
      'Comprova para a gestão (e para o cliente, se necessário) o horário exato de chegada e saída da equipe no restaurante',
    ],
    howToFeedSteps: [
      {
        stepTitle: '1. Clique no botão "Bater Ponto Agora"',
        description:
          'Pode ser acionado pelo topo desta página, pelo botão laranja na barra lateral ou logo após o login.',
      },
      {
        stepTitle: '2. Selecione o Tipo de Batida (e o Restaurante, se for equipe externa)',
        description:
          'Colaboradores internos escolhem Entrada, Almoço ou Saída. Filmmakers e modelos escolhem Entrada ou Saída e selecionam em qual restaurante estão.',
      },
      {
        stepTitle: '3. Permita o GPS, tire a Foto na câmera e confirme',
        description:
          'O registro ficará salvo e imutável no histórico para auditoria da gerência.',
      },
    ],
    exampleTitle: 'Exemplo de Registro de Ponto Validado',
    exampleSubtitle: 'Veja como uma batida de ponto completa fica gravada para auditoria:',
    exampleBadge: 'EXEMPLO DE PREENCHIMENTO — NÃO SALVO NO SISTEMA',
    exampleFields: [
      {
        label: 'Colaborador & Regime',
        value: 'Isa (Apresentadora & Modelo) • Regime Externo / Campo',
        highlight: true,
      },
      {
        label: 'Tipo de Batida & Horário Oficial',
        value: 'ENTRADA NO RESTAURANTE • 28/10/2026 às 09:54:12',
      },
      {
        label: 'Restaurante & Validação de Raio GPS',
        value: 'Trattoria Bella Napoli • Distância calculada: 42 metros (Status: NO LOCAL < 300m)',
        highlight: true,
      },
      {
        label: 'Evidência Biométrica & Coordenadas',
        value: 'Foto capturada via câmera ao vivo • Lat: -23.5639, Lng: -46.6852 (Precisão: 12m)',
      },
    ],
    ctaLabel: 'Abrir Câmera e Bater Ponto',
    ctaAction: 'ponto',
  },

  relatorios: {
    view: 'relatorios',
    title: 'Relatórios Técnicos de Produção (Filmmakers)',
    subtitle: 'Diário de bordo pós-gravação com pratos captados, quantidade de takes, equipamentos e link de brutos',
    category: 'Produção & Pós-Produção',
    purpose:
      'Centraliza os relatórios preenchidos pelos filmmakers logo após cada gravação. Essa página faz a ponte entre quem gravou no restaurante (campo) e quem vai editar os vídeos na agência (pós-produção), garantindo que nenhum prato gravado ou imprevisto se perca.',
    installedFunctions: [
      'Painel de acompanhamento de gravações com relatório preenchido vs. pendentes',
      'Ficha técnica com: Pratos Gravados, Quantidade de Takes, Equipamento Utilizado e Avaliação da Sessão',
      'Registro de ocorrências na cozinha (ex: atraso no preparo de pratos, falta de insumo no restaurante)',
      'Link direto para a pasta de arquivos brutos (RAW) no Google Drive para os editores',
    ],
    agencyBenefits: [
      'Os editores (Carol e Lucas) sabem exatamente o que foi gravado e onde estão os brutos sem precisar perguntar no WhatsApp',
      'Documenta imprevistos causados pelo restaurante (ex: chef atrasou 1h), protegendo a agência em reuniões de cobrança',
      'Padroniza a qualidade técnica de todas as diárias de captação',
    ],
    howToFeedSteps: [
      {
        stepTitle: '1. Localize a gravação na lista ou na Agenda',
        description:
          'Todas as gravações do tipo "Gravação" ou "Fotografia" aparecem listadas aqui automaticamente.',
      },
      {
        stepTitle: '2. Clique em "Preencher / Editar Relatório" na gravação',
        description:
          'Isso abrirá o modal da gravação diretamente na aba do Relatório do Filmmaker.',
      },
      {
        stepTitle: '3. Descreva os pratos, número de takes, avaliação e cole o link do Drive',
        description:
          'Salve o relatório. Ele ficará imediatamente visível para os editores e gerentes!',
      },
    ],
    exampleTitle: 'Exemplo de Relatório de Gravação Preenchido',
    exampleSubtitle: 'Modelo ideal de preenchimento pelo Filmmaker após terminar a captação:',
    exampleBadge: 'EXEMPLO DE PREENCHIMENTO — NÃO SALVO NO SISTEMA',
    exampleFields: [
      {
        label: 'Gravação & Filmmaker Responsável',
        value: 'Trattoria Bella Napoli (28/10/2026) • Preenchido por: Victor (Filmmaker)',
        highlight: true,
      },
      {
        label: 'Pratos & Conteúdos Captados',
        value: '1) Fettuccine no Grana Padano flambado, 2) Bruschetta de Burrata, 3) Negroni Defumado, 4) Depoimento do Chef.',
      },
      {
        label: 'Quantidade de Takes & Equipamento Usado',
        value: '48 takes gravados em 4K 60fps • Sony FX3 + Lente 24-70mm GM + Microfone Lapela DJI Mic 2 + Luz Amaran 60x',
        highlight: true,
      },
      {
        label: 'Avaliação da Sessão & Ocorrências na Cozinha',
        value: 'Avaliação: Ótima • "Cozinha super ágil, todos os pratos saíram na sequência combinada."',
      },
      {
        label: 'Link da Pasta de Brutos (Google Drive)',
        value: 'https://drive.google.com/drive/folders/Brutos_28_10_BellaNapoli',
      },
    ],
    ctaLabel: '+ Agendar Gravação para Gerar Relatório',
    ctaAction: 'event',
  },

  briefing: {
    view: 'briefing',
    title: 'Central de Briefings & Roteiros Criativos',
    subtitle: 'Diretrizes estéticas, posicionamento, pratos carros-chefe, restrições e roteiros de cada restaurante',
    category: 'Criativo & Produção',
    purpose:
      'A Central de Briefings organiza em 7 categorias todas as instruções criativas e técnicas de cada restaurante parceiro, além dos roteiros específicos de cada diária de gravação. Assim, Filmmakers, Modelos e Editores têm acesso imediato ao tom de voz, iluminação, pratos obrigatórios e ganchos (hooks) antes de gravar ou editar.',
    installedFunctions: [
      'Dossiê criativo estruturado em 7 categorias: Conceito Geral, Público-Alvo, Tom de Voz/Trilha, Pratos Carros-Chefe, Iluminação/Estética, Restrições e Banco de Ganchos (Hooks)',
      'Edição rápida por restaurante com salvamento instantâneo para toda a equipe',
      'Lista integrada de Roteiros por Diária de Gravação (sincronizada com a aba Briefing dentro da Agenda)',
      'Acesso liberado para toda a equipe (Donos, Gerentes, Filmmakers, Modelos e Editores Internos)',
    ],
    agencyBenefits: [
      'Garante que nenhum filmmaker ou modelo chegue no restaurante sem saber o que gravar ou o que o cliente não gosta',
      'Alinha os editores (Carol e Lucas) sobre o estilo de corte, música e legendas que cada restaurante aprova de primeira',
      'Reduz drasticamente pedidos de refação e ajustes em vídeos',
    ],
    howToFeedSteps: [
      {
        stepTitle: '1. Selecione o Restaurante na lista à esquerda',
        description:
          'Caso ainda não tenha restaurantes cadastrados, clique em "+ Novo Restaurante" no topo da página.',
      },
      {
        stepTitle: '2. Clique em "Preencher / Editar Categorias"',
        description:
          'Preencha as 7 categorias do Briefing (Conceito, Público-Alvo, Tom de Voz, Pratos Foco, Estética, Restrições e Ganchos/Roteiros) e clique em Salvar.',
      },
      {
        stepTitle: '3. Detalhe o Roteiro de cada Gravação',
        description:
          'Na parte inferior da página (ou clicando na aba "Briefing" dentro de qualquer gravação na Agenda), descreva os Reels específicos que serão gravados naquela visita.',
      },
    ],
    exampleTitle: 'Exemplo Visual de Briefing & Roteiro Preenchido',
    exampleSubtitle: 'Veja na imagem e nos campos abaixo como o Briefing de um restaurante fica estruturado:',
    exampleBadge: 'EXEMPLO COM IMAGEM & CAMPOS PREENCHIDOS',
    exampleFields: [
      {
        label: '1. Conceito Geral & Público-Alvo',
        value: 'Trattoria Italiana artesanal em Pinheiros • Público: Casais 25-45 anos e famílias no almoço de fim de semana.',
        highlight: true,
      },
      {
        label: '2. Pratos Carros-Chefe & Estética de Vídeo',
        value: 'Fettuccine na roda de Grana Padano, Burrata ao Pesto e Negroni defumado • Luz quente 3200K + closes macro 60fps.',
      },
      {
        label: '3. Restrições do Cliente (O que NÃO fazer)',
        value: 'Não filmar a pia de lavagem da cozinha; não usar músicas com palavrão; chef prefere não gravar locução falada.',
        highlight: true,
      },
      {
        label: '4. Banco de Ganchos (Hooks) Aprovados',
        value: '"Descobrimos a massa preparada dentro do queijo mais cremosa de São Paulo..."',
      },
    ],
    ctaLabel: '+ Cadastrar Restaurante para Briefing',
    ctaAction: 'client',
  },

  reembolsos: {
    view: 'reembolsos',
    title: 'Central de Reembolsos de Gravação (3 Campos)',
    subtitle: 'Envio rápido de despesas do dia de gravação com upload de comprovante e controle por hierarquia',
    category: 'Produção & Financeiro',
    purpose:
      'Criada para que os colaboradores lancem rapidamente gastos do dia de gravação (Uber, estacionamento, alimentação, insumos) usando apenas 3 campos simples: Valor do Reembolso, Razão e Upload do Comprovante. O acesso segue privacidade rigorosa: cada funcionário visualiza apenas os seus próprios reembolsos, enquanto Donos e Gerentes visualizam e aprovam os reembolsos de toda a equipe.',
    installedFunctions: [
      'Formulário direto e intuitivo com apenas 3 campos: 1) Valor do Reembolso, 2) Razão da Despesa e 3) Upload do Comprovante (Foto ou PDF)',
      'Privacidade por perfil: Funcionários enxergam somente os seus próprios pedidos e status; Gestores enxergam todos os reembolsos de todos os colaboradores',
      'Visualizador de comprovante integrado (abre a foto do recibo/print do Uber na tela sem precisar sair do sistema)',
      'Sincronização automática com o Controle Financeiro Executivo quando o gestor aprova ou marca como reembolsado',
    ],
    agencyBenefits: [
      'Elimina envio de comprovantes de Uber perdidos no WhatsApp',
      'Garante que nenhum funcionário tenha acesso aos valores ou reembolsos de outros colegas',
      'Dá aos gestores controle centralizado para aprovar e pagar reembolsos com 1 clique',
    ],
    howToFeedSteps: [
      {
        stepTitle: '1. Digite o Valor do Reembolso (R$)',
        description:
          'Informe o valor exato gasto no dia da gravação (ex: 48,90).',
      },
      {
        stepTitle: '2. Escreva a Razão da Despesa',
        description:
          'Descreva de forma direta o motivo (ex: "Uber ida e volta gravação Trattoria Bella Napoli" ou "Estacionamento").',
      },
      {
        stepTitle: '3. Faça o Upload do Comprovante e clique em Enviar',
        description:
          'Clique na caixa de upload (ou arraste a imagem/PDF do recibo) e envie. O gestor receberá na hora para aprovar e reembolsar via PIX!',
      },
    ],
    exampleTitle: 'Exemplo Visual de Pedido de Reembolso Preenchido',
    exampleSubtitle: 'Veja na imagem e nos 3 campos abaixo como solicitar um reembolso de gravação:',
    exampleBadge: 'EXEMPLO COM IMAGEM & 3 CAMPOS PREENCHIDOS',
    exampleFields: [
      {
        label: '1. Valor do Reembolso (R$)',
        value: 'R$ 48,90',
        highlight: true,
      },
      {
        label: '2. Razão da Despesa',
        value: 'Uber ida e volta gravação Trattoria Bella Napoli (com tripé e iluminação)',
      },
      {
        label: '3. Upload do Comprovante Anexado',
        value: 'recibo_uber_29_10.jpg (Imagem verificada disponível para visualização)',
        highlight: true,
      },
      {
        label: 'Regra de Visibilidade Ativa',
        value: 'Funcionário vê apenas seus próprios reembolsos • Gestores veem e aprovam os de toda a equipe',
      },
    ],
  },

  arquivos: {
    view: 'arquivos',
    title: 'Central de Arquivos & Entregáveis (DAM)',
    subtitle: 'Esteira completa de vídeos e criativos: do Bruto RAW até a Aprovação e Publicação',
    category: 'Pós-Produção & Entregas',
    purpose:
      'A Central DAM (Digital Asset Management) organiza todos os vídeos (Reels 9:16), posts de feed, carrosséis e fotos produzidos para os restaurantes. Ela controla em qual etapa cada peça está: Bruto RAW → Em Edição → Aguardando Aprovação → Ajustes Solicitados → Aprovado → Publicado.',
    installedFunctions: [
      'Catálogo visual de entregáveis com pré-visualização vertical 9:16 e filtros por status ou restaurante',
      'Controle de versões (v1, v2, v3...) automático quando um ajuste é solicitado',
      'Links diretos para o vídeo editado no Google Drive e para a pasta de brutos',
      'Fluxo de Aprovação Exclusivo da Gestão: botão para Aprovar peça ou Solicitar Ajustes com anotações para o editor',
    ],
    agencyBenefits: [
      'Acaba com vídeos perdidos em conversas de WhatsApp ou links soltos',
      'Deixa claro para editores e social media o que já está aprovado para postar e o que precisa de correção',
      'Contabiliza automaticamente quantos Reels já foram entregues para bater a meta mensal de cada restaurante',
    ],
    howToFeedSteps: [
      {
        stepTitle: '1. Clique no botão "+ Novo Entregável / Reel"',
        description:
          'Qualquer membro da produção/edição ou gerência pode cadastrar um novo entregável.',
      },
      {
        stepTitle: '2. Selecione o Restaurante, Formato (ex: Reels 9:16) e Responsáveis',
        description:
          'Informe o título da peça (ex: "Reel #01 — Corte Picanha na Brasa"), quem gravou, quem apresentou e cole o link do vídeo no Google Drive.',
      },
      {
        stepTitle: '3. Avance o Status conforme o vídeo passa pela edição e aprovação',
        description:
          'Editores mudam para "Aguardando Aprovação"; Gerentes/Donos revisam e clicam em "Aprovar" ou "Solicitar Ajustes".',
      },
    ],
    exampleTitle: 'Exemplo de Entregável Cadastrado na Central DAM',
    exampleSubtitle: 'Veja como um Reel editado deve ser registrado no catálogo:',
    exampleBadge: 'EXEMPLO DE PREENCHIMENTO — NÃO SALVO NO SISTEMA',
    exampleFields: [
      {
        label: 'Restaurante & Título do Entregável',
        value: 'Trattoria Bella Napoli • Reel #01 — Fettuccine no Queijo Grana Padano (ASMR)',
        highlight: true,
      },
      {
        label: 'Formato, Versão & Status Atual',
        value: 'Formato: Reels 9:16 • Versão: v2 • Status: Aprovado para Publicação',
        highlight: true,
      },
      {
        label: 'Equipe Técnica Vinculada',
        value: 'Captação: Victor (Filmmaker) • Apresentação: Isa (Modelo) • Edição: Carol',
      },
      {
        label: 'Links de Acesso (Google Drive)',
        value: 'Vídeo Editado: https://drive.google.com/file/d/... • Pasta Brutos: https://drive.google.com/drive/folders/...',
      },
      {
        label: 'Data de Gravação & Previsão de Postagem',
        value: 'Gravado em: 28/10/2026 • Publicação prevista: 31/10/2026 às 11:30',
      },
    ],
    ctaLabel: '+ Cadastrar Novo Entregável',
    ctaAction: 'deliverable',
  },

  'metricas-reels': {
    view: 'metricas-reels',
    title: 'Métricas & Performance de Reels (Instagram)',
    subtitle: 'Acompanhamento de visualizações, alcance, salvamentos e taxa de engajamento por restaurante',
    category: 'Social Media & Resultados',
    purpose:
      'Armazena os resultados reais dos Reels publicados no Instagram de cada restaurante parceiro (Plays, Contas Alcançadas, Curtidas, Comentários, Compartilhamentos e Salvamentos), vinculando o desempenho do vídeo à gravação que o originou.',
    installedFunctions: [
      'Cadastro de métricas dos Reels publicados com cálculo automático da Taxa de Engajamento (%)',
      'Soma automática de Visualizações Totais, Alcance e Salvamentos (indicador de desejo de visita ao restaurante)',
      'Filtro por restaurante para apresentar relatórios de resultado nas reuniões mensais com o cliente',
      'Vínculo opcional com a data da gravação na agenda para medir o ROI de cada diária',
    ],
    agencyBenefits: [
      'Prova com números claros para o dono do restaurante o resultado que os vídeos da agência estão gerando',
      'Permite identificar quais formatos de vídeo (ex: ASMR, receita, humor, influencer) geram mais salvamentos',
    ],
    howToFeedSteps: [
      {
        stepTitle: '1. Clique em "+ Cadastrar Reel & Métricas" no topo da página',
        description:
          'Abra o Instagram Insights do restaurante após a publicação do Reel.',
      },
      {
        stepTitle: '2. Selecione o Restaurante e preencha os números do Reel',
        description:
          'Informe a legenda/tema do vídeo, Visualizações (Plays), Contas Alcançadas, Curtidas, Comentários, Compartilhamentos e Salvamentos.',
      },
      {
        stepTitle: '3. Cole o link do Reel no Instagram e salve',
        description:
          'O sistema calculará a taxa de engajamento automaticamente e atualizará os cartões do restaurante.',
      },
    ],
    exampleTitle: 'Exemplo de Métrica de Reel Cadastrada',
    exampleSubtitle: 'Como registrar os dados do Instagram Insights de um vídeo publicado:',
    exampleBadge: 'EXEMPLO DE PREENCHIMENTO — NÃO SALVO NO SISTEMA',
    exampleFields: [
      {
        label: 'Restaurante & Gravação de Origem',
        value: 'Trattoria Bella Napoli • Gravação de 28/10/2026',
        highlight: true,
      },
      {
        label: 'Título / Legenda do Reel',
        value: 'O verdadeiro Fettuccine preparado dentro da roda de Grana Padano fumegante! Quem você levaria?',
      },
      {
        label: 'Visualizações (Plays) & Contas Alcançadas',
        value: '48.500 Visualizações • 36.200 Contas Alcançadas',
        highlight: true,
      },
      {
        label: 'Interações de Alto Valor (Desejo de Visita)',
        value: '2.140 Curtidas • 890 Salvamentos • 620 Compartilhamentos no Direct • 145 Comentários',
      },
      {
        label: 'Taxa de Engajamento Calculada',
        value: '10,48% de Engajamento sobre o Alcance',
        highlight: true,
      },
    ],
  },

  'mural-ugc': {
    view: 'mural-ugc',
    title: 'Mural de UGC & Marcações de Clientes',
    subtitle: 'Controle de Stories, Posts e avaliações espontâneas de clientes e influenciadores nos restaurantes',
    category: 'Social Media & Comunidade',
    purpose:
      'Organiza todas as marcações (@mentions) feitas por clientes e influenciadores gastronômicos nos restaurantes atendidos. Ajuda a equipe de Social Media a não deixar nenhum Story expirar sem repostar e a mapear influenciadores que visitaram a casa.',
    installedFunctions: [
      'Registro de marcações com @usuário, número de seguidores, formato (Story 24h ou Post/Reels) e classificação',
      'Identificação automática de Influenciadores (perfis com mais de 10.000 seguidores ganham selo especial)',
      'Controle de status "Pendente de Repost" vs. "Repostado" com 1 clique',
      'Filtros rápidos por Pendentes, Influenciadores, Stories e por Restaurante',
    ],
    agencyBenefits: [
      'Garante que os Stories dos clientes sejam repostados rapidamente antes de expirarem em 24h',
      'Cria um banco de provas sociais (UGC) e mapeia microinfluenciadores para futuras parcerias',
    ],
    howToFeedSteps: [
      {
        stepTitle: '1. Clique no botão "+ Registrar Marcação / UGC"',
        description:
          'Ao verificar as notificações/direct do Instagram do restaurante, registre as melhores marcações aqui.',
      },
      {
        stepTitle: '2. Informe o Restaurante, @usuário, nº de seguidores e formato',
        description:
          'Se o perfil tiver 10.000 seguidores ou mais, o sistema o destacará automaticamente no Radar de Influenciadores.',
      },
      {
        stepTitle: '3. Marque como "Repostado" assim que publicar nos Stories do cliente',
        description:
          'Clique no botão "Marcar Repostado" no card para manter a fila do Social Media limpa.',
      },
    ],
    exampleTitle: 'Exemplo de Marcação UGC Registrada',
    exampleSubtitle: 'Como fica um card de marcação de cliente/influenciador no mural:',
    exampleBadge: 'EXEMPLO DE PREENCHIMENTO — NÃO SALVO NO SISTEMA',
    exampleFields: [
      {
        label: 'Restaurante Marcado & Formato',
        value: 'Trattoria Bella Napoli • Formato: Story (Expira em 24h)',
        highlight: true,
      },
      {
        label: 'Autor da Marcação & Seguidores',
        value: '@roteirogastronomico.sp • 28.400 seguidores (⭐ Influenciador Detectado)',
        highlight: true,
      },
      {
        label: 'Legenda / Comentário do Cliente',
        value: '"Melhor massa fresca que já comi em São Paulo! Atendimento impecável."',
      },
      {
        label: 'Classificação & Status de Repost',
        value: 'Classificação: Destaque Gastronômico • Status: Pendente de Repost nos Stories',
      },
    ],
  },

  financeiro: {
    view: 'financeiro',
    title: 'Controle Financeiro Executivo',
    subtitle: 'Fluxo de caixa, mensalidades dos clientes, folha salarial da equipe e reembolso de despesas de gravação',
    category: 'Gestão Executiva & Financeiro',
    purpose:
      'Módulo exclusivo para Donos e Gerentes. Centraliza toda a gestão financeira da agência em 4 abas integradas: Visão Geral (Lucro Líquido, Receitas vs. Despesas), Lançamentos (Contas a Pagar e Receber), Folha de Salários da Equipe (20 colaboradores CLT/PJ) e Auditoria de Despesas de Gravação (Uber, alimentação, estacionamento lançados pela equipe em campo).',
    installedFunctions: [
      'Cálculo em tempo real de Receita Bruta, Despesas Totais, Folha Salarial e Resultado Líquido + Margem (%)',
      'Lançamento de Receitas (Mensalidades de Clientes) e Despesas (Equipamentos, Softwares, Impostos, Custos de Sede)',
      'Gestão da Folha de Pagamento dos 20 colaboradores com configuração de Valor Base, Dia de Pagamento, Chave PIX e botão "Marcar Pago"',
      'Aprovação e Reembolso integrado de Despesas de Gravação: quando um filmmaker lança um Uber na agenda, ele cai automaticamente aqui para aprovação!',
    ],
    agencyBenefits: [
      'Dá clareza exata do lucro líquido da agência e de quem já pagou ou está pendente no mês',
      'Evita esquecimentos de reembolso de transporte/estacionamento da equipe de campo',
      'Organiza as chaves PIX e datas de pagamento de todos os 20 membros da equipe em um só lugar',
    ],
    howToFeedSteps: [
      {
        stepTitle: '1. Configure os Salários da Equipe na aba "Salários da Equipe"',
        description:
          'Clique em "Configurar Valor / PIX" no card de cada colaborador para definir o salário/diária base e a chave PIX. Quando pagar no mês, clique em "Marcar Pago".',
      },
      {
        stepTitle: '2. Registre Mensalidades e Contas na aba "Lançamentos" ("+ Nova Transação")',
        description:
          'Cadastre as mensalidades dos restaurantes (Receita) e custos fixos/variáveis da agência (Despesa), controlando o status (Pendente, Pago ou Atrasado).',
      },
      {
        stepTitle: '3. Aprove Reembolsos na aba "Despesas de Gravação"',
        description:
          'Sempre que um colaborador registrar um gasto dentro de uma gravação na agenda, revise e clique em "Aprovar" ou "Marcar Reembolsado".',
      },
    ],
    exampleTitle: 'Exemplo de Lançamento Financeiro & Folha Salarial',
    exampleSubtitle: 'Como ficam organizados os registros financeiros da agência:',
    exampleBadge: 'EXEMPLO DE PREENCHIMENTO — NÃO SALVO NO SISTEMA',
    exampleFields: [
      {
        label: '1. Exemplo de Receita (Mensalidade de Cliente)',
        value: 'Mensalidade Outubro/2026 — Trattoria Bella Napoli • R$ 4.200,00 • Vencimento: 10/10 • Status: Pago (PIX)',
        highlight: true,
      },
      {
        label: '2. Exemplo de Folha de Pagamento (Aba Salários)',
        value: 'Victor (Filmmaker) • Contrato: PJ • Base: R$ 4.500,00 • Pagto: Dia 05 • PIX: victor@... • Status: Pago',
      },
      {
        label: '3. Exemplo de Reembolso de Campo (Aba Despesas de Gravação)',
        value: 'Uber Ida/Volta Gravação Bella Napoli (Isa) • R$ 46,80 • Status: Aprovado & Reembolsado via PIX',
        highlight: true,
      },
      {
        label: '4. Resumo Executivo Calculado Automaticamente',
        value: 'Receitas: R$ 58.800,00 | Folha + Custos: R$ 31.400,00 | Resultado Líquido: +R$ 27.400,00 (Margem: 46,6%)',
      },
    ],
  },

  whatsapp: {
    view: 'whatsapp',
    title: 'Automação & Confirmação de Gravações via WhatsApp (D-1)',
    subtitle: 'Disparo de lembretes 1 dia antes da gravação e atualização automática de confirmação na agenda',
    category: 'Atendimento & Operação',
    purpose:
      'Evita que a equipe chegue ao restaurante e dê "viagem perdida" porque o gerente esqueceu da gravação. Esta página gera a mensagem personalizada de confirmação 1 dia antes (D-1) com a data, horário e nomes da dupla escalada, envia pelo WhatsApp e atualiza o status na Agenda para "Confirmado" ou "Remarcar".',
    installedFunctions: [
      'Template personalizável com variáveis automáticas: {{responsavel}}, {{data}}, {{hora_inicio}}, {{hora_fim}}, {{restaurante}} e {{equipe}}',
      'Disparo em lote D-1 ("Verificar & Disparar D-1 Agora") ou envio individual por gravação abrindo o WhatsApp oficial',
      'Processador de Resposta do Cliente: ao registrar "Confirmado" ou "Remarcar", a Agenda da agência é atualizada automaticamente',
      'Histórico completo (Log) de todas as mensagens enviadas e respostas recebidas com data e hora',
    ],
    agencyBenefits: [
      'Reduz a zero as viagens perdidas da equipe de gravação por falta de alinhamento com o restaurante',
      'Padroniza a comunicação profissional da agência com todos os clientes na véspera das diárias',
      'Deixa registrado no sistema quem confirmou e quem pediu reagendamento',
    ],
    howToFeedSteps: [
      {
        stepTitle: '1. Certifique-se de que o Restaurante tem Telefone/WhatsApp cadastrado',
        description:
          'No cadastro do restaurante (aba Clientes), preencha o telefone com DDD e o nome do responsável.',
      },
      {
        stepTitle: '2. Clique em "Enviar" na fila de gravações ou em "Disparar D-1 Agora"',
        description:
          'O sistema montará o texto automaticamente com os dados da gravação, registrará no histórico e abrirá o WhatsApp pronto para envio.',
      },
      {
        stepTitle: '3. Registre a resposta do cliente para atualizar a Agenda',
        description:
          'Quando o restaurante responder no WhatsApp, selecione a gravação e clique em "Confirmou (Opção 1)" ou "Pediu para Remarcar (Opção 2)". O status mudará na Agenda na mesma hora!',
      },
    ],
    exampleTitle: 'Exemplo de Mensagem D-1 Gerada pelo Sistema',
    exampleSubtitle: 'Veja como o template preenche os dados reais da gravação automaticamente:',
    exampleBadge: 'EXEMPLO DE PREENCHIMENTO — NÃO SALVO NO SISTEMA',
    exampleFields: [
      {
        label: 'Destinatário & Gravação Vinculada',
        value: 'Chef Marco Bellini — Trattoria Bella Napoli • (11) 98877-6655 • Gravação: Amanhã, 09:00 às 12:00',
        highlight: true,
      },
      {
        label: 'Mensagem Montada Automaticamente pelo Template',
        value:
          '"Olá, Chef Marco! Passando para confirmar a gravação de conteúdo da *Navegando MKT* agendada para amanhã (29/10) das 09:00 às 12:00 no *Trattoria Bella Napoli*. Nossa equipe técnica (Victor & Isa) estará no local. Responda: 1 - Confirmado | 2 - Remarcar"',
      },
      {
        label: 'Ação Automática após Resposta "1 - Confirmado"',
        value: 'Status da gravação na Agenda muda automaticamente de "Agendado" para "Confirmado" (Selo Verde)',
        highlight: true,
      },
    ],
  },

  backups: {
    view: 'backups',
    title: 'Segurança, Auditoria & Backup de Dados',
    subtitle: 'Exportação e restauração de cópias de segurança e registro de auditoria da operação',
    category: 'Segurança & Infraestrutura',
    purpose:
      'Garante que nenhuma informação cadastrada pela agência seja perdida. Permite baixar a qualquer momento uma cópia completa (snapshot JSON) com todos os restaurantes, gravações, relatórios, pontos e entregáveis, restaurar backups anteriores ou limpar o banco de dados.',
    installedFunctions: [
      'Exportação instantânea em 1 clique de todos os dados operacionais para o seu computador (.json)',
      'Importação e Restauração validada de arquivos de backup',
      'Contadores em tempo real do volume de registros armazenados no sistema',
      'Trilha de Auditoria das operações realizadas na base central',
    ],
    agencyBenefits: [
      'Proteção total contra perda de dados: a gestão pode guardar uma cópia semanal no computador ou Google Drive da diretoria',
      'Transparência sobre todas as alterações feitas pelos membros da equipe',
    ],
    howToFeedSteps: [
      {
        stepTitle: '1. Exporte uma cópia de segurança periodicamente',
        description:
          'Clique no botão "Baixar Backup Completo Agora (.JSON)" sempre que encerrar o planejamento da semana ou do mês.',
      },
      {
        stepTitle: '2. Guarde o arquivo baixado na pasta segura da diretoria',
        description:
          'Caso precise migrar de computador ou restaurar um estado anterior, basta clicar em "Selecionar Arquivo .JSON" para recarregar tudo.',
      },
    ],
    exampleTitle: 'Exemplo de Snapshot de Backup Gerado',
    exampleSubtitle: 'O que é salvo dentro do arquivo de segurança da agência:',
    exampleBadge: 'EXEMPLO ILUSTRATIVO — NÃO SALVO NO SISTEMA',
    exampleFields: [
      {
        label: 'Arquivo Gerado pelo Sistema',
        value: 'navegando-mkt-backup-2026-10-28.json (Integridade Verificada)',
        highlight: true,
      },
      {
        label: 'Conteúdo Protegido no Pacote',
        value: '20 Membros da Equipe + Todos os Restaurantes + Agenda de Gravações + Relatórios + Pontos + Entregáveis DAM',
      },
      {
        label: 'Status de Sincronização Local & Nuvem',
        value: 'Persistência Automática Ativa — Todas as edições são salvas instantaneamente',
        highlight: true,
      },
    ],
  },
};

const STORAGE_PREFIX = 'navegando_mkt_tutorial_seen_v1_';

export function PageTutorialModal() {
  const {
    currentView,
    loggedEmployeeId,
    isAuthenticated,
    canManage,
    openClientModal,
    openNewEventModal,
    openDeliverableModal,
    openPontoModal,
  } = useAgenda();

  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  const tutorial = PAGE_TUTORIALS[currentView] || PAGE_TUTORIALS.home;

  // Abre automaticamente apenas na PRIMEIRA vez que o usuário entra naquela página/seção
  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;
    const storageKey = `${STORAGE_PREFIX}${loggedEmployeeId || 'default'}`;
    try {
      const raw = localStorage.getItem(storageKey);
      const seenViews: string[] = raw ? JSON.parse(raw) : [];
      if (!seenViews.includes(currentView)) {
        queueMicrotask(() => {
          setActiveStep(1);
          setIsOpen(true);
        });
      }
    } catch {
      // Ignore storage errors
    }
  }, [currentView, loggedEmployeeId, isAuthenticated]);

  const markCurrentViewSeen = () => {
    if (typeof window === 'undefined') return;
    const storageKey = `${STORAGE_PREFIX}${loggedEmployeeId || 'default'}`;
    try {
      const raw = localStorage.getItem(storageKey);
      const seenViews: string[] = raw ? JSON.parse(raw) : [];
      if (!seenViews.includes(currentView)) {
        seenViews.push(currentView);
        localStorage.setItem(storageKey, JSON.stringify(seenViews));
      }
    } catch {
      // Ignore storage errors
    }
  };

  const handleClose = () => {
    markCurrentViewSeen();
    setIsOpen(false);
  };

  const handleOpenManual = (step: 1 | 2 | 3 = 1) => {
    setActiveStep(step);
    setIsOpen(true);
  };

  const handleTriggerCta = () => {
    handleClose();
    if (tutorial.ctaAction === 'client' && canManage) {
      openClientModal();
    } else if (tutorial.ctaAction === 'event' && canManage) {
      openNewEventModal();
    } else if (tutorial.ctaAction === 'deliverable') {
      openDeliverableModal();
    } else if (tutorial.ctaAction === 'ponto') {
      openPontoModal();
    }
  };

  return (
    <>
      {/* Barra Flutuante / Banner Contextual de Ajuda e Exemplo de Preenchimento */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-[var(--ui-surface)]/90 border border-[var(--ui-accent)]/25 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1.5 rounded-lg bg-[var(--ui-accent)]/15 text-[var(--ui-accent)] shrink-0">
            <BookOpen className="w-3.5 h-3.5" />
          </span>
          <div className="truncate">
            <span className="text-xs font-bold text-foreground">
              Guia Rápido: {tutorial.title}
            </span>
            <span className="hidden md:inline text-[11px] text-zinc-400 ml-2">
              — {tutorial.subtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleOpenManual(1)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--ui-raised)] hover:bg-[var(--ui-hover)] border border-[var(--ui-border)] text-zinc-200 text-[11px] font-semibold transition-all cursor-pointer"
            title="Ver explicação de para que serve esta página e como abastecer o sistema"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[var(--ui-accent)]" />
            <span>Como usar esta página</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenManual(3)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--ui-accent)]/15 hover:bg-[var(--ui-accent)]/25 border border-[var(--ui-accent)]/35 text-[var(--ui-accent)] text-[11px] font-bold transition-all cursor-pointer"
            title="Abrir pop-up com exemplo de como esta página deve ficar preenchida"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver Exemplo Preenchido</span>
          </button>
        </div>
      </div>

      {/* POP-UP MODAL DE TUTORIAL & EXEMPLO DE PREENCHIMENTO */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorial-modal-title"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-2xl rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Cabeçalho do Pop-up */}
            <div className="p-5 sm:p-6 border-b border-[var(--ui-border)] bg-gradient-to-r from-[var(--ui-raised)] to-[var(--ui-surface)] flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--ui-accent)]/15 text-[var(--ui-accent)] border border-[var(--ui-accent)]/30 inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Tutorial de Primeiro Acesso • {tutorial.category}
                  </span>
                </div>
                <h2
                  id="tutorial-modal-title"
                  className="text-lg sm:text-xl font-black text-foreground font-heading"
                >
                  {tutorial.title}
                </h2>
                <p className="text-xs text-zinc-400">{tutorial.subtitle}</p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-xl bg-[var(--ui-surface)] hover:bg-[var(--ui-hover)] text-zinc-400 hover:text-foreground border border-[var(--ui-border)] transition-colors cursor-pointer shrink-0"
                title="Fechar tutorial"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Abas / Etapas do Tutorial */}
            <div className="px-5 sm:px-6 pt-3 bg-[var(--ui-page)]/60 border-b border-[var(--ui-border)] flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeStep === 1
                    ? 'border-[var(--ui-accent)] text-[var(--ui-accent)]'
                    : 'border-transparent text-zinc-400 hover:text-foreground'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>1. Para que serve & Benefícios</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeStep === 2
                    ? 'border-[var(--ui-accent)] text-[var(--ui-accent)]'
                    : 'border-transparent text-zinc-400 hover:text-foreground'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>2. Como Abastecer Dados</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeStep === 3
                    ? 'border-[var(--ui-accent)] text-[var(--ui-accent)]'
                    : 'border-transparent text-zinc-400 hover:text-foreground'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>3. Exemplo Preenchido</span>
              </button>
            </div>

            {/* Corpo do Pop-up */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* ETAPA 1: PARA QUE SERVE E COMO MELHORA O DIA A DIA */}
              {activeStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] space-y-1.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--ui-accent)]">
                      Para que serve esta página?
                    </h3>
                    <p className="text-zinc-200 leading-relaxed text-xs sm:text-sm">
                      {tutorial.purpose}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] space-y-2.5">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[var(--ui-accent)]" />
                        <span>Funções Instaladas Aqui</span>
                      </h4>
                      <ul className="space-y-2 text-zinc-300">
                        {tutorial.installedFunctions.map((fn, idx) => (
                          <li key={idx} className="flex items-start gap-2 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--ui-accent)] mt-1.5 shrink-0" />
                            <span>{fn}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
                      <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Como melhora o dia a dia da Agência</span>
                      </h4>
                      <ul className="space-y-2 text-zinc-300">
                        {tutorial.agencyBenefits.map((ben, idx) => (
                          <li key={idx} className="flex items-start gap-2 leading-relaxed">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                            <span>{ben}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 2: COMO USAR E ABASTECER O SISTEMA */}
              {activeStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-2xl bg-[var(--ui-accent)]/10 border border-[var(--ui-accent)]/25 text-zinc-200">
                    Siga este passo a passo para <strong>abastecer e armazenar as informações reais</strong> da agência nesta seção:
                  </div>

                  <div className="space-y-3">
                    {tutorial.howToFeedSteps.map((st, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex items-start gap-3.5"
                      >
                        <div className="w-7 h-7 rounded-xl brand-solid bg-[var(--ui-accent)] text-foreground font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                          {idx + 1}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-foreground">
                            {st.stepTitle}
                          </h4>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {st.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ETAPA 3: POP-UP DE EXEMPLO DE COMO DEVERIA ESTAR PREENCHIDO */}
              {activeStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                    <div>
                      <h4 className="text-xs font-bold text-amber-300">
                        {tutorial.exampleTitle}
                      </h4>
                      <p className="text-[11px] text-zinc-300">
                        {tutorial.exampleSubtitle}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold shrink-0">
                      {tutorial.exampleBadge}
                    </span>
                  </div>

                  {/* IMAGEM ILUSTRADA + SIMULAÇÃO VISUAL DOS CAMPOS QUANDO PREENCHIDOS */}
                  <VisualExamplePreview view={currentView} />

                  {/* Card Detalhado de Exemplo Preenchido */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[var(--ui-raised)] border-2 border-dashed border-[var(--ui-border)] space-y-3">
                    {tutorial.exampleFields.map((field, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border ${
                          field.highlight
                            ? 'bg-[var(--ui-surface)] border-[var(--ui-accent)]/40'
                            : 'bg-[var(--ui-page)]/60 border-[var(--ui-border)]'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          {field.label}
                        </span>
                        <div className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed">
                          {field.value}
                        </div>
                        {field.hint && (
                          <span className="text-[10px] text-emerald-400 mt-1 block">
                            💡 {field.hint}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {tutorial.ctaLabel &&
                    (tutorial.ctaAction === 'ponto' ||
                      tutorial.ctaAction === 'deliverable' ||
                      canManage) && (
                      <div className="flex justify-center pt-1">
                        <button
                          type="button"
                          onClick={handleTriggerCta}
                          className="gradient-cta flex items-center gap-2 px-5 py-2.5 rounded-xl text-foreground font-bold text-xs shadow-lg cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{tutorial.ctaLabel}</span>
                        </button>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Rodapé do Pop-up de Tutorial */}
            <div className="p-4 sm:p-5 border-t border-[var(--ui-border)] bg-[var(--ui-page)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {activeStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep((prev) => (prev === 3 ? 2 : 1))}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--ui-surface)] hover:bg-[var(--ui-hover)] border border-[var(--ui-border)] text-zinc-300 text-xs font-semibold cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Anterior</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-3 py-2 text-xs text-zinc-400 hover:text-foreground cursor-pointer"
                  >
                    Pular tutorial
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep((prev) => (prev === 1 ? 2 : 3))}
                    className="gradient-cta flex items-center gap-1.5 px-4 py-2 rounded-xl text-foreground text-xs font-bold shadow-md cursor-pointer"
                  >
                    <span>
                      {activeStep === 1
                        ? 'Próximo: Como Abastecer'
                        : 'Próximo: Ver Exemplo Preenchido'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="gradient-cta flex items-center gap-1.5 px-5 py-2 rounded-xl text-foreground text-xs font-bold shadow-md cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Entendi, começar a usar!</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

