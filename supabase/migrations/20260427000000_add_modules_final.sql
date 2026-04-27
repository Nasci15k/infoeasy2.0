-- 20260427000000_add_modules_final.sql
-- Adição de novos módulos: cnh-full, placa-fipe, credilink, placa-serpro, vistoria, cpf-spc

-- 1. Criar nova categoria VISTORIA se não existir
INSERT INTO public.api_categories (id, name, slug, icon, color_group)
VALUES (gen_random_uuid(), 'VISTORIA', 'vistoria', '🔍', 'blue')
ON CONFLICT (slug) DO NOTHING;

-- 2. Inserção dos módulos
DO $$
DECLARE
    v_cnh UUID;
    v_placa UUID;
    v_cpf UUID;
    v_vistoria UUID;
    v_score UUID;
    v_dividas UUID;
    v_renda UUID;
    v_poder UUID;
    v_fin UUID;
BEGIN
    -- Localizar IDs das categorias pelos slugs
    SELECT id INTO v_cnh FROM public.api_categories WHERE slug = 'cnh';
    SELECT id INTO v_placa FROM public.api_categories WHERE slug = 'placa';
    SELECT id INTO v_cpf FROM public.api_categories WHERE slug = 'cpf';
    SELECT id INTO v_vistoria FROM public.api_categories WHERE slug = 'vistoria';
    SELECT id INTO v_score FROM public.api_categories WHERE slug = 'score';
    SELECT id INTO v_dividas FROM public.api_categories WHERE slug = 'dividas';
    SELECT id INTO v_renda FROM public.api_categories WHERE slug = 'renda';
    SELECT id INTO v_poder FROM public.api_categories WHERE slug = 'poder-aquisitivo';
    SELECT id INTO v_fin FROM public.api_categories WHERE slug = 'financeiro';

    -- [CNH]
    INSERT INTO public.apis (category_id, name, endpoint, requirement, group_name, is_active)
    VALUES (v_cnh, 'CNH Full', 'panel:cnh-full', 'CPF', 'Info Easy', true);

    -- [PLACA]
    INSERT INTO public.apis (category_id, name, endpoint, requirement, group_name, is_active)
    VALUES 
    (v_placa, 'Placa Fipe', 'panel:placa-fipe', 'Placa', 'Info Easy', true),
    (v_placa, 'Placa Serpro', 'panel:placa-serpro', 'Placa', 'Info Easy', true);

    -- [VISTORIA]
    INSERT INTO public.apis (category_id, name, endpoint, requirement, group_name, is_active)
    VALUES (v_vistoria, 'Vistoria Completa', 'panel:vistoria', 'Placa/String', 'Info Easy', true);

    -- [CREDILINK] - Múltiplas categorias
    INSERT INTO public.apis (category_id, name, endpoint, requirement, group_name, is_active)
    VALUES 
    (v_cpf, 'Credilink', 'panel:credilink', 'CPF', 'Info Easy', true),
    (v_score, 'Credilink', 'panel:credilink', 'CPF', 'Info Easy', true),
    (v_dividas, 'Credilink', 'panel:credilink', 'CPF', 'Info Easy', true),
    (v_renda, 'Credilink', 'panel:credilink', 'CPF', 'Info Easy', true),
    (v_poder, 'Credilink', 'panel:credilink', 'CPF', 'Info Easy', true);

    -- [CPF SPC] - Múltiplas categorias
    INSERT INTO public.apis (category_id, name, endpoint, requirement, group_name, is_active)
    VALUES 
    (v_fin, 'CPF SPC', 'panel:cpf-spc', 'CPF', 'Info Easy', true),
    (v_score, 'CPF SPC', 'panel:cpf-spc', 'CPF', 'Info Easy', true),
    (v_dividas, 'CPF SPC', 'panel:cpf-spc', 'CPF', 'Info Easy', true),
    (v_renda, 'CPF SPC', 'panel:cpf-spc', 'CPF', 'Info Easy', true),
    (v_poder, 'CPF SPC', 'panel:cpf-spc', 'CPF', 'Info Easy', true);

END $$;
