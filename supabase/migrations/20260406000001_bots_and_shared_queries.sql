-- ============================================================
-- Tabela: shared_queries
-- Armazena consultas compartilhadas por link temporal (15 min)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shared_queries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT        UNIQUE NOT NULL,
  api_name    TEXT        NOT NULL,
  query_value TEXT        NOT NULL,
  response_data JSONB     NOT NULL,
  source      TEXT        NOT NULL DEFAULT 'web', -- 'telegram' | 'discord' | 'web'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '15 minutes')
);

-- Índice para busca rápida por token
CREATE INDEX IF NOT EXISTS shared_queries_token_idx ON public.shared_queries (token);
-- Índice para limpeza de expirados
CREATE INDEX IF NOT EXISTS shared_queries_expires_idx ON public.shared_queries (expires_at);

-- RLS: leitura pública (sem auth) para qualquer pessoa com o link
ALTER TABLE public.shared_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shared_queries_public_read"
  ON public.shared_queries FOR SELECT
  USING (expires_at > now());

-- Apenas service_role pode inserir (Edge Functions)
-- (sem política de insert para anon/authenticated => apenas service_role bypassa RLS)

-- ============================================================
-- Tabela: bot_settings
-- Configurações dos bots (tokens, URL do site) gerenciadas pelo admin
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bot_settings (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT        UNIQUE NOT NULL,
  value      TEXT        NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler/escrever configurações dos bots
CREATE POLICY "bot_settings_admin_only"
  ON public.bot_settings FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Inserir configurações padrão
INSERT INTO public.bot_settings (key, value) VALUES
  ('telegram_token',       ''),
  ('discord_token',        ''),
  ('discord_app_id',       ''),
  ('discord_public_key',   ''),
  ('site_url',             'https://infoseasy.netlify.app')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Limpeza automática de links expirados via função
-- (Chamada periodicamente pela edge function bot-handler ou
--  pode ser agendada com pg_cron se disponível)
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_shared_queries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.shared_queries WHERE expires_at < now();
END;
$$;
