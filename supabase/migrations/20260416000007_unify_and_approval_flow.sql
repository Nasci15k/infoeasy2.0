-- 20260416000007_unify_and_approval_flow.sql
-- FINAL UNIFICATION: SITE PLANS & APPROVAL FLOW

-- 1. Ensure Profiles Table has all required columns for the production flow
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_expires_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'usuario';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seller_code text;

-- 2. Consolidate Site Plans Table
-- We will create site_plans and migrate data from api_plans if any
CREATE TABLE IF NOT EXISTS public.site_plans (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    price_weekly numeric DEFAULT 0,
    price_monthly numeric DEFAULT 0,
    daily_limit integer DEFAULT 100,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Copy any existing plans from api_plans to site_plans (if api_plans exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_plans') THEN
        INSERT INTO public.site_plans (name, description, price_weekly, price_monthly, daily_limit, is_active)
        SELECT name, description, price_weekly, price_monthly, daily_limit, is_active 
        FROM public.api_plans
        ON CONFLICT (name) DO NOTHING;
    END IF;
END $$;

-- 3. Audit Logs for Admin (Ensure table exists)
CREATE TABLE IF NOT EXISTS public.admin_assignment_logs (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    plan_name text NOT NULL,
    prev_plan text,
    new_expires_at timestamp with time zone,
    assigned_at timestamp with time zone DEFAULT now()
);

-- 4. Set Default RLS for new table
ALTER TABLE public.site_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage site_plans" ON public.site_plans;
CREATE POLICY "Admins manage site_plans" ON public.site_plans USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Users view site_plans" ON public.site_plans;
CREATE POLICY "Users view site_plans" ON public.site_plans FOR SELECT USING (is_active = true);

-- 5. Insert production plan models
INSERT INTO public.site_plans (name, description, price_weekly, price_monthly, daily_limit, is_active)
VALUES 
('Plano Iniciante', 'Ideal para consultas ocasionais.', 19.90, 49.90, 50, true),
('Plano Profissional', 'Acesso completo com alta performance.', 39.90, 89.90, 200, true),
('Plano Enterprise', 'Consultas ilimitadas e suporte VIP.', 99.90, 249.90, 1000, true)
ON CONFLICT (name) DO UPDATE SET 
    price_weekly = EXCLUDED.price_weekly, 
    price_monthly = EXCLUDED.price_monthly,
    daily_limit = EXCLUDED.daily_limit;
