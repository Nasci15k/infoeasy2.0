-- Fix RLS policies to use correct admin check function
-- Drop old policies that use is_admin(auth.uid())
DROP POLICY IF EXISTS "Admins podem gerenciar estatísticas" ON public.admin_stats_override;
DROP POLICY IF EXISTS "Admins podem gerenciar categorias" ON public.api_categories;
DROP POLICY IF EXISTS "Admins podem gerenciar APIs" ON public.apis;
DROP POLICY IF EXISTS "Admins podem atualizar perfis" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem atualizar limites" ON public.user_limits;
DROP POLICY IF EXISTS "Admins podem ver todos os limites" ON public.user_limits;
DROP POLICY IF EXISTS "Admins podem ver todo o histórico" ON public.query_history;

-- Recreate policies with is_admin_role(auth.uid())
CREATE POLICY "Admins podem gerenciar estatísticas"
ON public.admin_stats_override
FOR ALL
TO authenticated
USING (is_admin_role(auth.uid()))
WITH CHECK (is_admin_role(auth.uid()));

CREATE POLICY "Admins podem gerenciar categorias"
ON public.api_categories
FOR ALL
TO authenticated
USING (is_admin_role(auth.uid()));

CREATE POLICY "Admins podem gerenciar APIs"
ON public.apis
FOR ALL
TO authenticated
USING (is_admin_role(auth.uid()));

CREATE POLICY "Admins podem atualizar perfis"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_admin_role(auth.uid()));

CREATE POLICY "Admins podem ver todos os perfis"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin_role(auth.uid()));

CREATE POLICY "Admins podem atualizar limites"
ON public.user_limits
FOR UPDATE
TO authenticated
USING (is_admin_role(auth.uid()));

CREATE POLICY "Admins podem ver todos os limites"
ON public.user_limits
FOR SELECT
TO authenticated
USING (is_admin_role(auth.uid()));

CREATE POLICY "Admins podem ver todo o histórico"
ON public.query_history
FOR SELECT
TO authenticated
USING (is_admin_role(auth.uid()));