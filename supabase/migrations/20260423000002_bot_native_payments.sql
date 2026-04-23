-- 20260423000002_bot_native_payments.sql

-- 1. Create bot_subscriptions for decoupled VIP tracking
CREATE TABLE IF NOT EXISTS public.bot_subscriptions (
    telegram_id text PRIMARY KEY,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS for bot_subscriptions
ALTER TABLE public.bot_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow system access
DROP POLICY IF EXISTS "System can full access bot_subscriptions" ON public.bot_subscriptions;
CREATE POLICY "System can full access bot_subscriptions" 
ON public.bot_subscriptions 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 2. Modify pending_payments
-- Drop NOT NULL constraint on user_id to allow Telegram-only purchases
ALTER TABLE public.pending_payments ALTER COLUMN user_id DROP NOT NULL;

-- Add telegram_id column
ALTER TABLE public.pending_payments ADD COLUMN IF NOT EXISTS telegram_id text;
