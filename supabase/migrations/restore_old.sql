DO $$
DECLARE
  v_cpf UUID := 'b0000000-0000-0000-0000-000000000001';
  v_nome UUID := 'b0000000-0000-0000-0000-000000000002';
  v_fin UUID := 'b0000000-0000-0000-0000-000000000003';
  v_vei UUID := 'b0000000-0000-0000-0000-000000000004';
  v_con UUID := 'b0000000-0000-0000-0000-000000000005';
  v_doc UUID := 'b0000000-0000-0000-0000-000000000006';
  v_jud UUID := 'b0000000-0000-0000-0000-000000000007';
  v_emp UUID := 'b0000000-0000-0000-0000-000000000008';
  v_fot UUID := 'b0000000-0000-0000-0000-000000000009';
  
  -- NEW CATEGORIES FOR EXTERNAL PROVIDERS
  v_rede UUID := 'b0000000-0000-0000-0000-000000000010';
BEGIN

  INSERT INTO public.api_categories (id, name, description, slug, icon) VALUES
  (v_rede, 'Rede e Internet', 'Consultas de IP e Endereço MAC', 'rede', '🌐')
  ON CONFLICT (id) DO NOTHING;

  -- Banners for the alternative APIs
  INSERT INTO public.apis (category_id, name, endpoint, requirement) VALUES
  (v_cpf, 'CPF (BrasilPro)', 'brasilpro:cpf', 'CPF'),
  (v_nome, 'Nome (BrasilPro)', 'brasilpro:nome', 'NOME'),
  (v_nome, 'Nome da Mãe (BrasilPro)', 'brasilpro:mae', 'NOME_MAE'),
  (v_doc, 'Título (BrasilPro)', 'brasilpro:titulo', 'TITULO'),
  (v_nome, 'Pai (BrasilPro)', 'brasilpro:pai', 'NOME_PAI'),
  (v_doc, 'RG (BrasilPro)', 'brasilpro:rg', 'RG'),
  (v_cpf, 'CPF Completo (Duality)', 'duality:cpf', 'CPF'),
  
  (v_rede, 'IP Geolocation', 'http://ip-api.com/json/{valor}', 'IP'),
  (v_rede, 'MAC Lookup', 'https://api.macvendors.com/{valor}', 'MAC_ADDRESS'),
  (v_fin, 'BIN Checker', 'https://lookup.binlist.net/{valor}', 'BIN')
  ON CONFLICT DO NOTHING;

END $$;
