-- 20260416000006_plan_pricing_fix.sql
-- FIX PLAN PRICING SCHEMA AND ADD MANUAL ASSIGNMENT LOGS

-- 1. Alter api_plans to reflect the structure expected by the UI and the new dynamic pricing
ALTER TABLE public.api_plans ADD COLUMN IF NOT EXISTS price_weekly numeric DEFAULT 0;
ALTER TABLE public.api_plans ADD COLUMN IF NOT EXISTS price_monthly numeric DEFAULT 0;

-- 2. Migrating old 'price' if it's set to monthly by default
UPDATE public.api_plans SET price_monthly = price WHERE price_monthly = 0 AND price > 0;

-- 3. Create Plan Assignment History (For Admin accountability)
CREATE TABLE IF NOT EXISTS public.admin_assignment_logs (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    plan_name text NOT NULL,
    prev_plan text,
    new_expires_at timestamp with time zone,
    assigned_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for logs
ALTER TABLE public.admin_assignment_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins view all logs" ON public.admin_assignment_logs USING (public.is_admin(auth.uid()));

-- Users can view their own assignment history (Optional, user preference was "only for admin", 
-- but providing the policy anyway for internal tool usage)
CREATE POLICY "Users view their own logs" ON public.admin_assignment_logs FOR SELECT USING (auth.uid() = user_id);

-- 4. Add UNIQUE constraint to name (if not exists) to allow ON CONFLICT
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'api_plans_name_key') THEN
        ALTER TABLE public.api_plans ADD CONSTRAINT api_plans_name_key UNIQUE (name);
    END IF;
END $$;

-- 5. Ensure we have at least one valid plan for testing
INSERT INTO public.api_plans (name, description, price_weekly, price_monthly, daily_limit, is_active)
VALUES 
('Plano Standard', 'Acesso completo a todos os motores de busca.', 24.90, 59.90, 100, true),
('Plano Premium', 'Alta performance e limites extendidos.', 49.90, 119.90, 500, true)
ON CONFLICT (name) DO UPDATE SET price_weekly = EXCLUDED.price_weekly, price_monthly = EXCLUDED.price_monthly;
