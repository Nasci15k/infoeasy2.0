-- 1. CORREÇÃO DE SEGURANÇA SUPREMA (Destravar 401/403)
-- Desativar RLS temporariamente para profiles (para evitar erros de loop ou checagem que matam o Auth)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS DE ACESSO PARA APIS E CATEGORIAS (Simples e Eficazes)
ALTER TABLE public.apis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura para autenticados" ON public.api_categories;
CREATE POLICY "Permitir leitura para autenticados" ON public.api_categories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Permitir leitura de apis" ON public.apis;
CREATE POLICY "Permitir leitura de apis" ON public.apis FOR SELECT TO authenticated USING (true);

-- 3. POLÍTICAS PARA USER LIMITS (Garantir que a função consiga atualizar o contador)
ALTER TABLE public.user_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Garantir acesso aos limites" ON public.user_limits;
CREATE POLICY "Garantir acesso aos limites" ON public.user_limits FOR ALL TO authenticated USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 4. MAPEAMENTO TOTAL DE SUB-MÓDULOS (Organização Visual)

-- PESSOAS (a0000000-0000-0000-0000-000000000002)
UPDATE public.apis SET group_name = 'CPF' WHERE (name LIKE '%CPF%') AND category_id = 'a0000000-0000-0000-0000-000000000002';
UPDATE public.apis SET group_name = 'Nome' WHERE (name LIKE '%Nome%') AND category_id = 'a0000000-0000-0000-0000-000000000002';
UPDATE public.apis SET group_name = 'Parentes / Vizinhos' WHERE (name LIKE '%Mãe%' OR name LIKE '%Vizinho%' OR name LIKE '%Parentes%') AND category_id = 'a0000000-0000-0000-0000-000000000002';
UPDATE public.apis SET group_name = 'Financeiro / Score' WHERE (name LIKE '%Score%' OR name LIKE '%Renda%' OR name LIKE '%Bancários%') AND category_id = 'a0000000-0000-0000-0000-000000000002';
UPDATE public.apis SET group_name = 'Fotos' WHERE (name LIKE '%Foto%' OR name LIKE '%Capa%') AND category_id = 'a0000000-0000-0000-0000-000000000002';

-- VEÍCULOS (a0000000-0000-0000-0000-000000000001)
UPDATE public.apis SET group_name = 'Nacional' WHERE (name LIKE '%Nacional%') AND category_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE public.apis SET group_name = 'Leilão / Sinistro' WHERE (name LIKE '%Leilão%' OR name LIKE '%Sinistro%') AND category_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE public.apis SET group_name = 'Débitos / Gravame' WHERE (name LIKE '%Débito%' OR name LIKE '%Gravame%' OR name LIKE '%Multas%') AND category_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE public.apis SET group_name = 'Proprietário Atual' WHERE (name LIKE '%Proprietário%' OR name LIKE '%Placa%') AND category_id = 'a0000000-0000-0000-0000-000000000001';

-- EMPRESAS (a0000000-0000-0000-0000-000000000003)
UPDATE public.apis SET group_name = 'CNPJ Geral' WHERE (name LIKE '%CNPJ%') AND category_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.apis SET group_name = 'Sócio / QSA' WHERE (name LIKE '%Sócio%' OR name LIKE '%QSA%') AND category_id = 'a0000000-0000-0000-0000-000000000003';

-- CONTATO (a0000000-0000-0000-0000-000000000004)
UPDATE public.apis SET group_name = 'Telefone / WhatsApp' WHERE (name LIKE '%Telefone%' OR name LIKE '%Zap%' OR name LIKE '%WhatsApp%') AND category_id = 'a0000000-0000-0000-0000-000000000004';
UPDATE public.apis SET group_name = 'Endereço / CEP' WHERE (name LIKE '%Endereço%' OR name LIKE '%CEP%') AND category_id = 'a0000000-0000-0000-0000-000000000004';
UPDATE public.apis SET group_name = 'Email' WHERE (name LIKE '%Email%') AND category_id = 'a0000000-0000-0000-0000-000000000004';

-- FOTOS (a0000000-0000-0000-0000-000000000006)
UPDATE public.apis SET group_name = 'Fotos CNH' WHERE (name LIKE '%CNH%') AND category_id = 'a0000000-0000-0000-0000-000000000006';
UPDATE public.apis SET group_name = 'Vigilância' WHERE (name LIKE '%Capa%' OR name LIKE '%Radar%') AND category_id = 'a0000000-0000-0000-0000-000000000006';
UPDATE public.apis SET group_name = 'Fotos Estaduais' WHERE (group_name = 'Geral') AND category_id = 'a0000000-0000-0000-0000-000000000006';

-- 5. FINALIZAÇÃO: Garantir que o usuário principal seja Admin e Aprovado
UPDATE public.profiles SET role = 'admin', status = 'approved' WHERE email = 'diniz.nascimento1905@gmail.com';
