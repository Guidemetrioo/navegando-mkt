-- ==============================================================================
-- NAVEGANDO MKT - CRM: INSTAGRAM GRAPH API, MÉTRICAS DE REELS E MURAL DE UGC
-- Migration: 002_instagram_metrics_and_mentions.sql
-- ==============================================================================

-- 1. TABELA: Contas Sociais Conectadas por Restaurante
CREATE TABLE IF NOT EXISTS client_social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  instagram_business_id TEXT NOT NULL,
  instagram_handle TEXT NOT NULL, -- ex: @cantinabellamassa
  profile_picture_url TEXT,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  followers_count INTEGER DEFAULT 0,
  follows_count INTEGER DEFAULT 0,
  media_count INTEGER DEFAULT 0,
  connected_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_client_instagram UNIQUE (client_id, instagram_business_id)
);

-- 2. TABELA: Métricas de Reels e Vídeos Gastronômicos
CREATE TABLE IF NOT EXISTS reel_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL, -- Vínculo opcional com a gravação da agenda!
  instagram_media_id TEXT NOT NULL UNIQUE,
  permalink TEXT NOT NULL,
  media_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  media_type TEXT DEFAULT 'VIDEO', -- 'VIDEO', 'REELS'
  published_at TIMESTAMPTZ NOT NULL,
  plays INTEGER DEFAULT 0, -- Visualizações do Reel
  reach INTEGER DEFAULT 0, -- Contas únicas alcançadas
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saved INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0.00,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA: Mural de UGC (Marcações em fotos/Reels e menções em Stories)
CREATE TYPE mention_type AS ENUM ('POST_TAG', 'STORY_MENTION', 'CAPTION_MENTION', 'COMMENT_MENTION');
CREATE TYPE mention_sentiment AS ENUM ('positivo', 'neutro', 'destaque_gourmet');

CREATE TABLE IF NOT EXISTS client_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  author_username TEXT NOT NULL, -- ex: @gabrielafoodie
  author_name TEXT,
  author_followers INTEGER DEFAULT 0,
  is_influencer BOOLEAN DEFAULT false, -- True se tiver > 10k seguidores
  mention_type mention_type NOT NULL DEFAULT 'POST_TAG',
  media_url TEXT,
  permalink TEXT,
  caption TEXT,
  sentiment mention_sentiment DEFAULT 'positivo',
  reposted BOOLEAN NOT NULL DEFAULT false, -- Se a equipe da agência já repostou nos Stories
  reposted_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_reels_client ON reel_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_reels_event ON reel_metrics(event_id);
CREATE INDEX IF NOT EXISTS idx_reels_published ON reel_metrics(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentions_client ON client_mentions(client_id);
CREATE INDEX IF NOT EXISTS idx_mentions_reposted ON client_mentions(reposted);
CREATE INDEX IF NOT EXISTS idx_mentions_posted ON client_mentions(posted_at DESC);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE client_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura autenticados social" ON client_social_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticados reels" ON reel_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticados mentions" ON client_mentions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gerencia social" ON client_social_accounts FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND papel = 'admin'));

CREATE POLICY "Admin gerencia reels" ON reel_metrics FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND papel = 'admin'));

CREATE POLICY "Admin gerencia mentions" ON client_mentions FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND papel = 'admin'));
