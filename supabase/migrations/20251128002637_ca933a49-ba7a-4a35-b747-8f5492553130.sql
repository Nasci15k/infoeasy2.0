-- Criar tabela de vendedores
CREATE TABLE public.sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  seller_code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para sellers
CREATE POLICY "Admins podem gerenciar vendedores"
ON public.sellers
FOR ALL
TO authenticated
USING (is_admin_role(auth.uid()))
WITH CHECK (is_admin_role(auth.uid()));

CREATE POLICY "Vendedores podem ver seus próprios dados"
ON public.sellers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Adicionar campos em profiles
ALTER TABLE public.profiles
ADD COLUMN seller_code text,
ADD COLUMN plan_type text CHECK (plan_type IN ('daily', 'weekly', 'monthly')),
ADD COLUMN plan_expires_at timestamp with time zone;

-- Atualizar limites padrão baseado em roles
ALTER TABLE public.user_limits
ALTER COLUMN daily_limit SET DEFAULT 10;

-- Criar função para atualizar limites baseado em role
CREATE OR REPLACE FUNCTION public.update_limits_by_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se o role foi atualizado, ajusta os limites
  IF NEW.role != OLD.role THEN
    UPDATE user_limits
    SET 
      daily_limit = CASE NEW.role
        WHEN 'teste'::app_role THEN 10
        WHEN 'usuario'::app_role THEN 50
        WHEN 'usuario_premium'::app_role THEN 999999
        WHEN 'revendedor'::app_role THEN 999999
        WHEN 'admin'::app_role THEN 999999
      END,
      monthly_limit = CASE NEW.role
        WHEN 'teste'::app_role THEN 300
        WHEN 'usuario'::app_role THEN 1500
        WHEN 'usuario_premium'::app_role THEN 999999
        WHEN 'revendedor'::app_role THEN 999999
        WHEN 'admin'::app_role THEN 999999
      END
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_role_changed
AFTER UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_limits_by_role();

-- Criar índices
CREATE INDEX idx_profiles_seller_code ON public.profiles(seller_code);
CREATE INDEX idx_sellers_code ON public.sellers(seller_code);
CREATE INDEX idx_profiles_plan_expires ON public.profiles(plan_expires_at);

-- Trigger para atualizar updated_at em sellers
CREATE TRIGGER update_sellers_updated_at
BEFORE UPDATE ON public.sellers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();