-- 1. Adicionar coluna group_name à tabela apis
ALTER TABLE public.apis ADD COLUMN IF NOT EXISTS group_name text DEFAULT 'Geral';

-- 2. Atribuir grupos às APIs (Baseado nos nomes ou categorias)

-- VEÍCULOS
UPDATE public.apis SET group_name = 'Veicular' WHERE category_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE public.apis SET group_name = 'Nacional' WHERE name LIKE '%Nacional%';
UPDATE public.apis SET group_name = 'SESP/FIPE' WHERE name LIKE '%SESP%' OR name LIKE '%FIPE%';

-- PESSOAS
UPDATE public.apis SET group_name = 'Documentos' WHERE category_id = 'a0000000-0000-0000-0000-000000000002';
UPDATE public.apis SET group_name = 'Nome' WHERE name LIKE '%Nome%';
UPDATE public.apis SET group_name = 'CPF' WHERE name LIKE '%CPF%';
UPDATE public.apis SET group_name = 'Família' WHERE name LIKE '%Mãe%' OR name LIKE '%Pai%' OR name LIKE '%Parentes%';
UPDATE public.apis SET group_name = 'Financeiro/Crédito' WHERE name LIKE '%Score%' OR name LIKE '%Renda%' OR name LIKE '%Poder%';
UPDATE public.apis SET group_name = 'Eleitoral' WHERE name LIKE '%Título%' OR name LIKE '%TSE%';

-- CONTATO
UPDATE public.apis SET group_name = 'Telefone' WHERE category_id = 'a0000000-0000-0000-0000-000000000004' AND name LIKE '%Telefone%';
UPDATE public.apis SET group_name = 'Email' WHERE category_id = 'a0000000-0000-0000-0000-000000000004' AND name LIKE '%Email%';
UPDATE public.apis SET group_name = 'Endereço/CEP' WHERE category_id = 'a0000000-0000-0000-0000-000000000004' AND (name LIKE '%CEP%' OR name LIKE '%Endereço%');

-- PROCESSOS
UPDATE public.apis SET group_name = 'Jurídico' WHERE category_id = 'a0000000-0000-0000-0000-000000000005';

-- FOTOS
UPDATE public.apis SET group_name = 'Fotos Estaduais' WHERE category_id = 'a0000000-0000-0000-0000-000000000006';

-- 3. AJUSTE DE SEGURANÇA (Para resolver o 401 na query-api)
-- Garantir que o auth.uid() consiga ler seu próprio perfil (necessário para a função getUser() interna da edge function)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all" ON public.profiles;
CREATE POLICY "Admins can read all" ON public.profiles FOR SELECT TO authenticated USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
