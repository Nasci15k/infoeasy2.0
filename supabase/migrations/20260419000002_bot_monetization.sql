-- 20260419000002_bot_monetization.sql
-- IMPLEMENTATION OF TELEGRAM MONETIZATION & FLEXIBLE PLANS

-- 1. Profiles Table Updates
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_id text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_expires_at timestamp with time zone;
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON public.profiles(telegram_id);

-- 2. VIP Flags for Bot
ALTER TABLE public.api_categories ADD COLUMN IF NOT EXISTS is_vip boolean DEFAULT false;
ALTER TABLE public.apis ADD COLUMN IF NOT EXISTS is_vip boolean DEFAULT false;

-- 3. Site Plans Refactoring
ALTER TABLE public.site_plans ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;
ALTER TABLE public.site_plans ADD COLUMN IF NOT EXISTS duration_days integer DEFAULT 30;
ALTER TABLE public.site_plans ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'site' CHECK (plan_type IN ('site', 'telegram', 'both'));
ALTER TABLE public.site_plans ADD COLUMN IF NOT EXISTS benefits text[] DEFAULT '{}';

-- Migration logic for existing plans (if any)
UPDATE public.site_plans 
SET 
  price = COALESCE(price_monthly, price_weekly, 0),
  duration_days = CASE WHEN price_weekly > 0 THEN 7 ELSE 30 END,
  plan_type = 'site'
WHERE price = 0;

-- 4. Initial VIP Configuration based on user request
-- Categories
UPDATE public.api_categories 
SET is_vip = true 
WHERE slug IN (
  'foto-nacional', 'acessoria', 'foto-estados', 'cnh', 'certidoes', 
  'pix', 'frota', 'crlv', 'faculdades', 'mandado', 'oab', 
  'nascimento', 'matricula', 'irpf', 'funcional', 'bens', 
  'beneficios', 'registros', 'nome-pai', 'nome-mae', 'parentes', 'cep'
);

-- Specific APIs
UPDATE public.apis 
SET is_vip = true 
WHERE name IN ('Info Easy Full', 'Data Prime Full', 'Info Easy');

-- 5. Default Plans Setup (Diário, Semanal, Mensal)
-- Clean up old generic names if desired or just insert new ones
DELETE FROM public.site_plans WHERE name IN ('Plano Iniciante', 'Plano Profissional', 'Plano Enterprise');

-- Site Plans
INSERT INTO public.site_plans (name, description, price, duration_days, daily_limit, plan_type, benefits, is_active)
VALUES 
('Plano Diário (Site)', 'Acesso total por 24 horas.', 9.90, 1, 50, 'site', ARRAY['Acesso total no site', 'Suporte prioritário', 'Consultas ilimitadas (respeitando limite diário)'], true),
('Plano Semanal (Site)', 'O melhor custo-benefício para 7 dias.', 24.90, 7, 100, 'site', ARRAY['Acesso total no site', 'Liberação imediata', 'Consultas avançadas'], true),
('Plano Mensal (Site)', 'Acesso supremo por 30 dias.', 59.90, 30, 1000, 'site', ARRAY['Acesso total no site', 'Consultas ilimitadas', 'Suporte 24/7 VIP'], true)
ON CONFLICT (name) DO NOTHING;

-- Telegram Plans
INSERT INTO public.site_plans (name, description, price, duration_days, daily_limit, plan_type, benefits, is_active)
VALUES 
('Plano Diário (Bot)', 'VIP no Telegram por 24 horas.', 7.90, 1, 50, 'telegram', ARRAY['Acesso VIP no Bot Telegram', 'Emoji ⭐ em todas as consultas'], true),
('Plano Semanal (Bot)', 'Acesso VIP por uma semana completa.', 19.90, 7, 100, 'telegram', ARRAY['Acesso VIP no Bot Telegram', 'Liberação imediata no PIX'], true),
('Plano Mensal (Bot)', 'Acesso VIP ilimitado por 30 dias.', 44.90, 30, 200, 'telegram', ARRAY['Acesso VIP no Bot Telegram', 'Suporte prioritário'], true)
ON CONFLICT (name) DO NOTHING;
