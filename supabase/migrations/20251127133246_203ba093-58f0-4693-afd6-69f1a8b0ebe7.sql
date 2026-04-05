-- Consolidar Foto Nacional 1 e 2
UPDATE apis 
SET name = 'Foto Nacional (Consolidado)', 
    description = 'Consulta de foto consolidada - todas as fontes'
WHERE name LIKE 'Foto Nacional%' 
  AND id = (SELECT id FROM apis WHERE name LIKE 'Foto Nacional%' LIMIT 1);

DELETE FROM apis WHERE name LIKE 'Foto Nacional%' AND id != (SELECT id FROM apis WHERE name LIKE 'Foto Nacional%' LIMIT 1);

-- Atualizar ícones das categorias com emojis apropriados
UPDATE api_categories SET icon = '🚗' WHERE name = 'PLACA';
UPDATE api_categories SET icon = '📸' WHERE name = 'FOTO';
UPDATE api_categories SET icon = '🆔' WHERE name = 'CPF';
UPDATE api_categories SET icon = '👤' WHERE name = 'NOME';
UPDATE api_categories SET icon = '📮' WHERE name = 'CEP';
UPDATE api_categories SET icon = '🌐' WHERE name = 'IP';
UPDATE api_categories SET icon = '📡' WHERE name = 'MAC';
UPDATE api_categories SET icon = '🏢' WHERE name = 'CNPJ';
UPDATE api_categories SET icon = '📞' WHERE name = 'TELEFONE';
UPDATE api_categories SET icon = '📧' WHERE name = 'EMAIL';
UPDATE api_categories SET icon = '📋' WHERE name = 'RG';

-- Criar enum para roles/classes de usuários
CREATE TYPE public.app_role AS ENUM ('teste', 'usuario', 'usuario_premium', 'revendedor', 'admin');

-- Criar tabela de roles separada (segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'teste',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Criar função security definer para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Criar função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- RLS policies para user_roles
CREATE POLICY "Admins podem gerenciar roles"
  ON public.user_roles
  FOR ALL
  USING (is_admin_role(auth.uid()))
  WITH CHECK (is_admin_role(auth.uid()));

CREATE POLICY "Usuários podem ver seus próprios roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Migrar roles existentes do profiles para user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 
  CASE 
    WHEN role = 'admin' THEN 'admin'::app_role
    ELSE 'usuario'::app_role
  END
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Adicionar campo last_status_check nas APIs para verificação real
ALTER TABLE public.apis ADD COLUMN IF NOT EXISTS last_status_check TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.apis ADD COLUMN IF NOT EXISTS status_response_time INTEGER; -- em ms
ALTER TABLE public.apis ADD COLUMN IF NOT EXISTS status_error TEXT;

-- Função para resetar limites diários automaticamente
CREATE OR REPLACE FUNCTION public.reset_daily_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_limits
  SET daily_count = 0,
      last_reset_daily = NOW()
  WHERE last_reset_daily < CURRENT_DATE;
END;
$$;

-- Criar tabela para estatísticas adicionais do admin
CREATE TABLE IF NOT EXISTS public.admin_dashboard_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_key TEXT UNIQUE NOT NULL,
  stat_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_dashboard_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar estatísticas dashboard"
  ON public.admin_dashboard_stats
  FOR ALL
  USING (is_admin_role(auth.uid()))
  WITH CHECK (is_admin_role(auth.uid()));

-- Adicionar trigger para atualizar updated_at
CREATE TRIGGER update_admin_dashboard_stats_updated_at
  BEFORE UPDATE ON public.admin_dashboard_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Inserir estatísticas iniciais
INSERT INTO public.admin_dashboard_stats (stat_key, stat_value, description)
VALUES 
  ('queries_by_category', '{}'::jsonb, 'Consultas por categoria'),
  ('top_users', '{}'::jsonb, 'Usuários mais ativos'),
  ('api_usage', '{}'::jsonb, 'Uso de APIs'),
  ('revenue_stats', '{}'::jsonb, 'Estatísticas de receita')
ON CONFLICT (stat_key) DO NOTHING;