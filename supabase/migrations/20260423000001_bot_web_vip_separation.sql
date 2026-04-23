-- 20260423000001_bot_web_vip_separation.sql
-- Separa as tags VIP do site (is_web_vip) e Telegram (is_vip passará a ser apenas para o bot)

-- 1. Tabela api_categories: Adicionando is_web_vip
ALTER TABLE public.api_categories ADD COLUMN IF NOT EXISTS is_web_vip boolean DEFAULT false;

-- 2. Tabela apis: Adicionando is_web_vip
ALTER TABLE public.apis ADD COLUMN IF NOT EXISTS is_web_vip boolean DEFAULT false;

-- Por padrão, garantimos que todos os web vips estão desativados (pois "no site não é pra ter nenhuma, quem compra pode usar tudo")
UPDATE public.api_categories SET is_web_vip = false;
UPDATE public.apis SET is_web_vip = false;

-- 3. Tabela profiles: Adicionando last_bot_interaction para enviar mensagens broadcast
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_bot_interaction timestamp with time zone;
CREATE INDEX IF NOT EXISTS idx_profiles_last_bot_interaction ON public.profiles(last_bot_interaction);
