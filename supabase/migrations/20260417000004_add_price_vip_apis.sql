-- 20260417000004_add_price_vip_apis.sql
-- Add price_vip column to apis table for granular pricing

ALTER TABLE public.apis ADD COLUMN IF NOT EXISTS price_vip numeric DEFAULT 0;
