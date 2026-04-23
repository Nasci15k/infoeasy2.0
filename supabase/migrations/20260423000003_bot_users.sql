-- 20260423000003_bot_users.sql

-- 1. Create bot_users table telemetry for ALL telegram users
CREATE TABLE IF NOT EXISTS public.bot_users (
    telegram_id text PRIMARY KEY,
    first_name text,
    last_interaction timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- 2. Index for broadcast queries
CREATE INDEX IF NOT EXISTS idx_bot_users_last_interaction ON public.bot_users(last_interaction);

-- Enable RLS for bot_users
ALTER TABLE public.bot_users ENABLE ROW LEVEL SECURITY;

-- Allow system access
DROP POLICY IF EXISTS "System can full access bot_users" ON public.bot_users;
CREATE POLICY "System can full access bot_users" 
ON public.bot_users 
FOR ALL 
USING (true) 
WITH CHECK (true);
