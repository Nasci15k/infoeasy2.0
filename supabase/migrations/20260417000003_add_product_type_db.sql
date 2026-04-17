-- 20260417000003_add_product_type_db.sql
-- Unified product management for Databases and Checkers

ALTER TABLE public.databases ADD COLUMN IF NOT EXISTS product_type text DEFAULT 'database';
ALTER TABLE public.databases ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Update apis table to support more metadata if needed
ALTER TABLE public.apis ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.apis ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE public.apis ADD COLUMN IF NOT EXISTS preview_url text;

-- Add category_id to databases to allow grouping if desired (optional but good for consistency)
ALTER TABLE public.databases ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.api_categories(id);

-- Ensure RLS allows admin to manage these
-- (Already covered by public.is_admin policies in previous migrations)
