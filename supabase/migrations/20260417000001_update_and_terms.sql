-- ============================================================
-- InfoEasy 2.0 — Migration: TConect URL + Terms Acceptance
-- ============================================================

-- 1. Garantir TConect URL atualizada no bot_settings
INSERT INTO public.bot_settings (key, value)
VALUES 
  ('tconect_api_url', 'http://node.tconect.xyz:1116'),
  ('tconect_api_token', 'PNSAPIS')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Adicionar coluna de aceite de termos na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- 3. Corrigir is_active em APIs TConect que possam estar desativadas
UPDATE public.apis
SET is_active = true
WHERE endpoint LIKE 'tconect:%';

-- 4. Garantir slugs únicos para as APIs TConect (se slug estiver nulo)
UPDATE public.apis
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL AND endpoint LIKE 'tconect:%';
