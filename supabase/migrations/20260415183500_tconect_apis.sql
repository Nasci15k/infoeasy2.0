-- 1. Insert TCONECT configuration into bot_settings
INSERT INTO public.bot_settings (key, value)
VALUES 
  ('tconect_api_url', 'http://node.tconect.xyz:1116'),
  ('tconect_api_token', 'PNSAPIS')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Garantir que as categorias existam (evitar erro de FK)
-- Usamos um bloco anônimo para inserir apenas se o slug não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.api_categories WHERE slug = 'veiculos') THEN
        INSERT INTO public.api_categories (id, name, slug, icon) VALUES ('a0000000-0000-0000-0000-000000000001', 'VEÍCULOS', 'veiculos', '🚗');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.api_categories WHERE slug = 'pessoas') THEN
        INSERT INTO public.api_categories (id, name, slug, icon) VALUES ('a0000000-0000-0000-0000-000000000002', 'PESSOAS', 'pessoas', '👤');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.api_categories WHERE slug = 'empresas') THEN
        INSERT INTO public.api_categories (id, name, slug, icon) VALUES ('a0000000-0000-0000-0000-000000000003', 'EMPRESAS', 'empresas', '🏢');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.api_categories WHERE slug = 'contato') THEN
        INSERT INTO public.api_categories (id, name, slug, icon) VALUES ('a0000000-0000-0000-0000-000000000004', 'CONTATO E ENDEREÇO', 'contato', '📞');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.api_categories WHERE slug = 'criminal') THEN
        INSERT INTO public.api_categories (id, name, slug, icon) VALUES ('a0000000-0000-0000-0000-000000000005', 'PROCESSOS E CRIMINAIS', 'criminal', '⚖️');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.api_categories WHERE slug = 'fotos') THEN
        INSERT INTO public.api_categories (id, name, slug, icon) VALUES ('a0000000-0000-0000-0000-000000000006', 'FOTOS', 'fotos', '📸');
    END IF;
END $$;

-- 3. Insert new TCONECT APIs into public.apis
DO $$
DECLARE
  v_pessoas UUID;
  v_veiculos UUID;
  v_empresas UUID;
  v_contato UUID;
  v_fotos UUID;
BEGIN
  -- Buscar IDs reais das categorias pelos slugs (método mais seguro)
  SELECT id INTO v_veiculos FROM public.api_categories WHERE slug = 'veiculos' LIMIT 1;
  SELECT id INTO v_pessoas FROM public.api_categories WHERE slug = 'pessoas' LIMIT 1;
  SELECT id INTO v_empresas FROM public.api_categories WHERE slug = 'empresas' LIMIT 1;
  SELECT id INTO v_contato FROM public.api_categories WHERE slug = 'contato' LIMIT 1;
  SELECT id INTO v_fotos FROM public.api_categories WHERE slug = 'fotos' LIMIT 1;

  -- Módulo Pessoas
  INSERT INTO public.apis (category_id, name, endpoint, group_name) VALUES
  (v_pessoas, 'Consulta CPF v1 (TCONECT)', 'tconect:/api/consulta/cpf/v1?code={valor}', 'CPF'),
  (v_pessoas, 'Consulta CPF v2 (TCONECT)', 'tconect:/api/consulta/cpf/v2?code={valor}', 'CPF'),
  (v_pessoas, 'Consulta CPF v3 (Com Foto) (TCONECT)', 'tconect:/api/consulta/cpf/v3?code={valor}', 'CPF'),
  (v_pessoas, 'Consulta CPF v4 (TCONECT)', 'tconect:/api/consulta/cpf/v4?code={valor}', 'CPF'),
  (v_pessoas, 'Consulta CPF v5 (TCONECT)', 'tconect:/api/consulta/cpf/v5?code={valor}', 'CPF'),
  (v_pessoas, 'Consulta CPF SUS (TCONECT)', 'tconect:/api/consulta/cpfsus/v1?cpf={valor}', 'CPF'),
  (v_pessoas, 'Consulta INSS (TCONECT)', 'tconect:/api/consulta/inss/v1?cpf={valor}', 'CPF'),
  (v_pessoas, 'Consulta Score (TCONECT)', 'tconect:/api/consulta/score/v1?cpf={valor}', 'Financeiro / Score'),
  (v_pessoas, 'Consulta Nome v1 (TCONECT)', 'tconect:/api/consulta/nome/v1?nome={valor}', 'Nome');

  -- Módulo Veículos
  INSERT INTO public.apis (category_id, name, endpoint, group_name) VALUES
  (v_veiculos, 'Consulta Placa v1 (TCONECT)', 'tconect:/api/consulta/placa/v1?placa={valor}', 'Proprietário Atual'),
  (v_veiculos, 'Consulta Placa v2 (TCONECT)', 'tconect:/api/consulta/placa/v2?placa={valor}', 'Proprietário Atual'),
  (v_veiculos, 'Consulta Motor v1 (TCONECT)', 'tconect:/api/consulta/motor/v1?tipo=motor&valor={valor}', 'Nacional'),
  (v_veiculos, 'Consulta Chassi v1 (TCONECT)', 'tconect:/api/consulta/motor/v1?tipo=chassi&valor={valor}', 'Nacional');

  -- Módulo Contato
  INSERT INTO public.apis (category_id, name, endpoint, group_name) VALUES
  (v_contato, 'Consulta Telefone v1 (TCONECT)', 'tconect:/api/consulta/telefone/v1?telefone={valor}', 'Telefone / WhatsApp'),
  (v_contato, 'Consulta CEP v1 (TCONECT)', 'tconect:/api/consulta/cep/v1?cep={valor}', 'Endereço / CEP');

  -- Módulo Empresas
  INSERT INTO public.apis (category_id, name, endpoint, group_name) VALUES
  (v_empresas, 'Consulta CNPJ v1 (TCONECT)', 'tconect:/api/consulta/cnpj/v1?cnpj={valor}', 'CNPJ Geral'),
  (v_empresas, 'Consulta CNPJ FGTS (TCONECT)', 'tconect:/api/consulta/cnpjFGTS/v2?cnpj={valor}', 'CNPJ Geral');

  -- Módulo Fotos
  INSERT INTO public.apis (category_id, name, endpoint, group_name) VALUES
  (v_fotos, 'Consulta Fotope v1 (TCONECT)', 'tconect:/api/consulta/fotope/v1?nome={valor}', 'Fotos Estaduais');

END $$;
