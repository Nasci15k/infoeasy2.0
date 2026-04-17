-- 20260416000008_populate_api_slugs.sql
-- Derive and populate the 'slug' column in apis from the endpoint field
-- The slug for a panel: API is the module name after the colon
-- e.g. 'panel:iseek-dados---placa' → slug = 'iseek-dados---placa'
-- This allows: /api?token=...&modulo=iseek-dados---placa to work correctly

-- 1. Ensure slug column exists
ALTER TABLE public.apis ADD COLUMN IF NOT EXISTS slug text;

-- 2. For panel: endpoints, extract the module identifier (after 'panel:')
UPDATE public.apis
SET slug = SPLIT_PART(endpoint, 'panel:', 2)
WHERE endpoint LIKE 'panel:%' AND (slug IS NULL OR slug = '');

-- 3. For tconect: endpoints, extract the path (after 'tconect:')
UPDATE public.apis
SET slug = SPLIT_PART(endpoint, 'tconect:', 2)
WHERE endpoint LIKE 'tconect:%' AND (slug IS NULL OR slug = '');

-- 4. For brasilpro: endpoints
UPDATE public.apis
SET slug = 'brasilpro-' || SPLIT_PART(endpoint, 'brasilpro:', 2)
WHERE endpoint LIKE 'brasilpro:%' AND (slug IS NULL OR slug = '');

-- 5. For duality: endpoints
UPDATE public.apis
SET slug = 'duality-' || SPLIT_PART(endpoint, 'duality:', 2)
WHERE endpoint LIKE 'duality:%' AND (slug IS NULL OR slug = '');

-- 6. Fallback: anything without a slug yet, generate from name
UPDATE public.apis
SET slug = LOWER(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- 7. Show result for verification
SELECT id, name, endpoint, slug FROM public.apis ORDER BY name LIMIT 20;
