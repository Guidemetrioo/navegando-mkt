-- ==============================================================================
-- NAVEGANDO MKT - PONTO ELETRÔNICO COM FOTO E GEOLOCALIZAÇÃO (GPS)
-- Migration: 003_ponto_eletronico_geolocalizacao.sql
-- ==============================================================================

-- 1. ENUMS PARA PONTO
DO $$ BEGIN
  CREATE TYPE ponto_tipo AS ENUM ('entrada', 'saida');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ponto_status AS ENUM ('no_local', 'fora_do_raio', 'manual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. ADICIONAR COORDENADAS GEOGRÁFICAS NA TABELA CLIENTS (SE NÃO EXISTIREM)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

-- 3. ADICIONAR CARGO NA TABELA EMPLOYEES
ALTER TABLE employees ADD COLUMN IF NOT EXISTS funcao TEXT DEFAULT 'filmmaker';

-- 4. TABELA: ponto_registros
CREATE TABLE IF NOT EXISTS ponto_registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  tipo ponto_tipo NOT NULL DEFAULT 'entrada',
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  foto_url TEXT NOT NULL, -- URL do Supabase Storage ou Base64 data URL
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  precisao_metros NUMERIC(8, 2) NOT NULL DEFAULT 10,
  distancia_metros NUMERIC(10, 2), -- Distância calculada até o restaurante
  status_localizacao ponto_status NOT NULL DEFAULT 'no_local',
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_ponto_employee ON ponto_registros(employee_id);
CREATE INDEX IF NOT EXISTS idx_ponto_client ON ponto_registros(client_id);
CREATE INDEX IF NOT EXISTS idx_ponto_data_hora ON ponto_registros(data_hora DESC);

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE ponto_registros ENABLE ROW LEVEL SECURITY;

-- Qualquer membro autenticado pode registrar seu ponto
CREATE POLICY "Membros podem registrar ponto"
  ON ponto_registros FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Todos podem visualizar os pontos da equipe (ou Admin vê todos)
CREATE POLICY "Membros podem ler registros de ponto"
  ON ponto_registros FOR SELECT
  TO authenticated
  USING (true);
