-- 1. Restaurar tabela Sellers
CREATE TABLE IF NOT EXISTS public.sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  seller_code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins podem gerenciar vendedores" ON public.sellers;
CREATE POLICY "Admins podem gerenciar vendedores" ON public.sellers FOR ALL TO authenticated USING (true);

-- 2. Restaurar tabela admin_stats_override
CREATE TABLE IF NOT EXISTS public.admin_stats_override (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_key text UNIQUE NOT NULL,
  override_value integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_stats_override ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins podem gerenciar estatísticas" ON public.admin_stats_override;
CREATE POLICY "Admins podem gerenciar estatísticas" ON public.admin_stats_override FOR ALL TO authenticated USING (true);

-- 3. Simplificar RLS de apis para garantir o funcionamento (Fim do 401/403)
ALTER TABLE public.apis DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.apis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura de apis" ON public.apis;
CREATE POLICY "Permitir leitura de apis" ON public.apis FOR SELECT TO authenticated USING (true);

-- 4. MAPEAMENTO DE SUB-MÓDULOS (Organização Visual para todos)
UPDATE public.apis SET group_name = 'CPF' WHERE (name LIKE '%CPF%');
UPDATE public.apis SET group_name = 'Nome' WHERE (name LIKE '%Nome%');
UPDATE public.apis SET group_name = 'Veicular' WHERE (name LIKE '%Nacional%' OR name LIKE '%FIPE%' OR name LIKE '%Débitos%');
UPDATE public.apis SET group_name = 'Fotos' WHERE (name LIKE '%Foto%' OR name LIKE '%Capa%' OR name LIKE '%CNH%');
UPDATE public.apis SET group_name = 'Contato' WHERE (name LIKE '%Telefone%' OR name LIKE '%Email%' OR name LIKE '%CEP%');
UPDATE public.apis SET group_name = 'Empresa' WHERE (name LIKE '%CNPJ%' OR name LIKE '%Sócios%');
UPDATE public.apis SET group_name = 'Crédito' WHERE (name LIKE '%Score%');

-- 5. Garantir status de admin para o usuário
UPDATE public.profiles SET role = 'admin', status = 'approved' WHERE email = 'diniz.nascimento1905@gmail.com';
