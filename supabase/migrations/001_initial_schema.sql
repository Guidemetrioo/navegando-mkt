-- ==============================================================================
-- NAVEGANDO MKT - CRM & AGENDA DA EQUIPE
-- Migration: 001_initial_schema.sql
-- ==============================================================================

-- 1. ENUMS
CREATE TYPE event_tipo AS ENUM ('gravacao', 'foto', 'edicao', 'reuniao');
CREATE TYPE event_status AS ENUM ('agendado', 'realizado', 'cancelado');
CREATE TYPE user_role AS ENUM ('admin', 'funcionario');

-- 2. TABELA: employees (10 funcionários base com cores em HSL Hue)
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cor INTEGER NOT NULL, -- HSL Hue (ex: 8, 32, 48, 95, 150, 178, 205, 238, 275, 320)
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA: clients (restaurantes e parceiros da Navegando MKT)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  contato TEXT,
  endereco TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABELA: events (data e hora salvas sem deslocamento de timezone)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  tipo event_tipo NOT NULL DEFAULT 'gravacao',
  data DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  local TEXT,
  observacoes TEXT,
  status event_status NOT NULL DEFAULT 'agendado',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT check_horario CHECK (hora_fim > hora_inicio)
);

-- 5. TABELA: event_assignments (relação N:N entre eventos e funcionários)
CREATE TABLE IF NOT EXISTS event_assignments (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, employee_id)
);

-- 6. TABELA: profiles (vinculada aos usuários do Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  papel user_role NOT NULL DEFAULT 'funcionario',
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_events_data ON events (data);
CREATE INDEX IF NOT EXISTS idx_events_client ON events (client_id);
CREATE INDEX IF NOT EXISTS idx_event_assignments_employee ON event_assignments (employee_id);

-- 8. TRIGGER: Criação automática de profile ao cadastrar usuário no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, papel)
  VALUES (new.id, 'funcionario');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. FUNÇÃO RPC: Verificação no servidor de Conflito de Horário
CREATE OR REPLACE FUNCTION check_event_conflicts(
  p_date DATE,
  p_start TIME,
  p_end TIME,
  p_employee_ids UUID[],
  p_exclude_event_id UUID DEFAULT NULL
)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  event_id UUID,
  client_name TEXT,
  hora_inicio TIME,
  hora_fim TIME,
  local TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    emp.id,
    emp.nome,
    e.id,
    c.nome,
    e.hora_inicio,
    e.hora_fim,
    e.local
  FROM events e
  JOIN event_assignments ea ON ea.event_id = e.id
  JOIN employees emp ON emp.id = ea.employee_id
  JOIN clients c ON c.id = e.client_id
  WHERE e.data = p_date
    AND e.status != 'cancelado'
    AND (p_exclude_event_id IS NULL OR e.id != p_exclude_event_id)
    AND ea.employee_id = ANY(p_employee_ids)
    AND (e.hora_inicio < p_end AND e.hora_fim > p_start);
END;
$$;

-- 10. ROW LEVEL SECURITY (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura (Qualquer usuário logado pode ler a escala geral)
CREATE POLICY "Leitura autenticados employees" ON employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticados clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticados events" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticados assignments" ON event_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura proprio perfil" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- Políticas de Mutação (Apenas Admin cria, atualiza e remove)
CREATE POLICY "Admin total employees" ON employees FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND papel = 'admin'));

CREATE POLICY "Admin total clients" ON clients FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND papel = 'admin'));

CREATE POLICY "Admin total events" ON events FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND papel = 'admin'));

CREATE POLICY "Admin total event_assignments" ON event_assignments FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND papel = 'admin'));

CREATE POLICY "Admin total profiles" ON profiles FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND papel = 'admin'));
