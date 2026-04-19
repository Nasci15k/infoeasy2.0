-- 20260419000001_miuse_integration.sql
-- Integração com Miuse Pay

-- Adicionar gateway_id para rastrear transações da Miuse
ALTER TABLE public.pending_payments ADD COLUMN IF NOT EXISTS gateway_id text;
ALTER TABLE public.pending_payments ADD COLUMN IF NOT EXISTS pix_code text;

-- Inserir ou Atualizar o Token da Miuse nas configurações
INSERT INTO public.bot_settings (key, value)
VALUES ('miuse_token', 'NjllNTRjZjkxYmQ1NDg4M2U3MjMyOGM3Om5hc2NpMTVrN0Bwcm90b24ubWU6TmFzY2kxNWs3')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Inserir URL base da Miuse para facilitar manutenção
INSERT INTO public.bot_settings (key, value)
VALUES ('miuse_api_url', 'https://api.miuse.app')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
