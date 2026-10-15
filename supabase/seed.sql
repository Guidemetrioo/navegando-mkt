-- ==============================================================================
-- NAVEGANDO MKT - SEED DE DADOS
-- ==============================================================================

-- 1. SEED: Filmmakers e Meninas dos Vídeos
INSERT INTO employees (id, nome, cor, ativo) VALUES
  -- Filmmakers (Câmera & Equipamento)
  ('e1111111-1111-1111-1111-111111111101', 'Vitinho', 205, true),
  ('e1111111-1111-1111-1111-111111111102', 'Gimenez', 150, true),
  ('e1111111-1111-1111-1111-111111111103', 'Henri', 238, true),
  ('e1111111-1111-1111-1111-111111111104', 'Victor', 178, true),
  -- Meninas dos Vídeos (Apresentação & Reels)
  ('e1111111-1111-1111-1111-111111111105', 'Giovana', 320, true),
  ('e1111111-1111-1111-1111-111111111106', 'Milena', 8, true),
  ('e1111111-1111-1111-1111-111111111107', 'Julia', 38, true),
  ('e1111111-1111-1111-1111-111111111108', 'Isabela', 275, true)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, cor = EXCLUDED.cor;

-- 2. SEED: Clientes Restaurantes
INSERT INTO clients (id, nome, contato, endereco, observacoes) VALUES
  ('c1111111-1111-1111-1111-111111111101', 'Cantina Bella Massa', '(11) 98765-4321', 'Rua da Mooca, 1420 - Mooca, São Paulo', 'Reels de massas frescas e pratos do dia'),
  ('c1111111-1111-1111-1111-111111111102', 'Sushi Hoshi', '(11) 97654-3210', 'Rua Coelho Lisboa, 350 - Tatuapé, São Paulo', 'Fotografia de combinados executivos e rodízio premium'),
  ('c1111111-1111-1111-1111-111111111103', 'Churrascaria Fogo Nobre', '(11) 96543-2109', 'Av. Nazaré, 890 - Ipiranga, São Paulo', 'Gravação de cortes de carnes nobres e buffet'),
  ('c1111111-1111-1111-1111-111111111104', 'Café Grão Real', '(11) 95432-1098', 'Rua dos Pinheiros, 512 - Pinheiros, São Paulo', 'Gravação de métodos de extração e cafés especiais'),
  ('c1111111-1111-1111-1111-111111111105', 'Hamburgueria Artesanal Smash', '(11) 94321-0987', 'Rua Fradique Coutinho, 780 - Vila Madalena, São Paulo', 'Takeover de Instagram e Reels de lançamentos'),
  ('c1111111-1111-1111-1111-111111111106', 'Bar do Porto', '(11) 93210-9876', 'Rua Treze de Maio, 410 - Bela Vista, São Paulo', 'Fotografia e vídeos de drinks autorais e petiscos')
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- 3. SEED: Eventos da Escala nos Restaurantes
INSERT INTO events (id, client_id, tipo, data, hora_inicio, hora_fim, local, observacoes, status) VALUES
  ('a1111111-1111-1111-1111-111111111101', 'c1111111-1111-1111-1111-111111111101', 'gravacao', '2026-10-12', '09:00', '12:00', 'Mooca', 'Gravação de 3 Reels: massas artesanais, roda de queijo e apresentação com Giovana', 'agendado'),
  ('a1111111-1111-1111-1111-111111111102', 'c1111111-1111-1111-1111-111111111102', 'foto', '2026-10-12', '14:00', '17:00', 'Tatuapé', 'Fotos do novo rodízio de primavera e gravação de Reels com Milena', 'agendado'),
  ('a1111111-1111-1111-1111-111111111103', 'c1111111-1111-1111-1111-111111111103', 'gravacao', '2026-10-13', '10:00', '13:00', 'Ipiranga', 'Gravação de cortes nobres na parrilla e degustação conduzida por Julia', 'agendado'),
  ('a1111111-1111-1111-1111-111111111104', 'c1111111-1111-1111-1111-111111111104', 'gravacao', '2026-10-13', '14:30', '17:30', 'Pinheiros', 'Tour guiado por Isabela nos métodos filtrados e cafés especiais da casa', 'agendado'),
  ('a1111111-1111-1111-1111-111111111105', 'c1111111-1111-1111-1111-111111111105', 'gravacao', '2026-10-14', '10:00', '13:00', 'Vila Madalena', 'Lançamento do Smash do mês com Milena: mordida em slow motion e queijo derretido', 'agendado'),
  ('a1111111-1111-1111-1111-111111111106', 'c1111111-1111-1111-1111-111111111101', 'gravacao', '2026-10-14', '15:00', '18:00', 'Mooca', 'Gravação da linha de sobremesas italianas tradicionais com Giovana', 'agendado'),
  ('a1111111-1111-1111-1111-111111111107', 'c1111111-1111-1111-1111-111111111106', 'gravacao', '2026-10-15', '11:30', '14:30', 'Bela Vista', 'Almoço executivo e petiscos de boteco gastronômico apresentado por Isabela', 'agendado'),
  ('a1111111-1111-1111-1111-111111111108', 'c1111111-1111-1111-1111-111111111102', 'gravacao', '2026-10-15', '15:30', '18:30', 'Tatuapé', 'Bastidores do Omakase e sequência de niguiris maçaricados com Julia', 'agendado'),
  ('a1111111-1111-1111-1111-111111111109', 'c1111111-1111-1111-1111-111111111105', 'gravacao', '2026-10-16', '13:00', '16:30', 'Vila Madalena', 'Desafio do burger gigante com Julia na apresentação', 'agendado'),
  ('a1111111-1111-1111-1111-111111111110', 'c1111111-1111-1111-1111-111111111106', 'gravacao', '2026-10-16', '17:30', '21:00', 'Bela Vista', 'Gravação noturna de coquetelaria autoral com Giovana e clima da noite', 'agendado'),
  ('a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111103', 'gravacao', '2026-10-17', '12:00', '15:30', 'Ipiranga', 'Almoço de sábado: picanha nobre na tábua e buffet completo com Milena', 'agendado')
ON CONFLICT (id) DO NOTHING;

-- 4. SEED: Duplas de Atendimento aos Restaurantes (Filmmaker + Criadora)
INSERT INTO event_assignments (event_id, employee_id) VALUES
  -- Cantina Bella Massa (12/10): Vitinho (Filmmaker) + Giovana (Criadora)
  ('a1111111-1111-1111-1111-111111111101', 'e1111111-1111-1111-1111-111111111101'),
  ('a1111111-1111-1111-1111-111111111101', 'e1111111-1111-1111-1111-111111111105'),

  -- Sushi Hoshi (12/10): Gimenez (Filmmaker) + Milena (Criadora)
  ('a1111111-1111-1111-1111-111111111102', 'e1111111-1111-1111-1111-111111111102'),
  ('a1111111-1111-1111-1111-111111111102', 'e1111111-1111-1111-1111-111111111106'),

  -- Churrascaria Fogo Nobre (13/10): Henri (Filmmaker) + Julia (Criadora)
  ('a1111111-1111-1111-1111-111111111103', 'e1111111-1111-1111-1111-111111111103'),
  ('a1111111-1111-1111-1111-111111111103', 'e1111111-1111-1111-1111-111111111107'),

  -- Café Grão Real (13/10): Victor (Filmmaker) + Isabela (Criadora)
  ('a1111111-1111-1111-1111-111111111104', 'e1111111-1111-1111-1111-111111111104'),
  ('a1111111-1111-1111-1111-111111111104', 'e1111111-1111-1111-1111-111111111108'),

  -- Hamburgueria Smash (14/10): Vitinho (Filmmaker) + Milena (Criadora)
  ('a1111111-1111-1111-1111-111111111105', 'e1111111-1111-1111-1111-111111111101'),
  ('a1111111-1111-1111-1111-111111111105', 'e1111111-1111-1111-1111-111111111106'),

  -- Cantina Bella Massa (14/10): Victor (Filmmaker) + Giovana (Criadora)
  ('a1111111-1111-1111-1111-111111111106', 'e1111111-1111-1111-1111-111111111104'),
  ('a1111111-1111-1111-1111-111111111106', 'e1111111-1111-1111-1111-111111111105'),

  -- Bar do Porto (15/10): Gimenez (Filmmaker) + Isabela (Criadora)
  ('a1111111-1111-1111-1111-111111111107', 'e1111111-1111-1111-1111-111111111102'),
  ('a1111111-1111-1111-1111-111111111107', 'e1111111-1111-1111-1111-111111111108'),

  -- Sushi Hoshi (15/10): Henri (Filmmaker) + Julia (Criadora)
  ('a1111111-1111-1111-1111-111111111108', 'e1111111-1111-1111-1111-111111111103'),
  ('a1111111-1111-1111-1111-111111111108', 'e1111111-1111-1111-1111-111111111107'),

  -- Hamburgueria Smash (16/10): Vitinho (Filmmaker) + Julia (Criadora)
  ('a1111111-1111-1111-1111-111111111109', 'e1111111-1111-1111-1111-111111111101'),
  ('a1111111-1111-1111-1111-111111111109', 'e1111111-1111-1111-1111-111111111107'),

  -- Bar do Porto (16/10): Henri (Filmmaker) + Giovana (Criadora)
  ('a1111111-1111-1111-1111-111111111110', 'e1111111-1111-1111-1111-111111111103'),
  ('a1111111-1111-1111-1111-111111111110', 'e1111111-1111-1111-1111-111111111105'),

  -- Churrascaria Fogo Nobre (17/10): Victor (Filmmaker) + Milena (Criadora)
  ('a1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111104'),
  ('a1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111106')
ON CONFLICT DO NOTHING;
