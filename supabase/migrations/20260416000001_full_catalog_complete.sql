-- 20260416000001_full_catalog_complete.sql
-- COMPREHENSIVE API CATALOG FOR INFOEASY 2.0

-- 1. Ensure Categories Exist
INSERT INTO public.api_categories (id, name, slug, icon) VALUES
('a0000000-0000-0000-0000-000000000001', 'VEÍCULOS', 'veiculos', '🚗'),
('a0000000-0000-0000-0000-000000000002', 'PESSOAS', 'pessoas', '👤'),
('a0000000-0000-0000-0000-000000000003', 'EMPRESAS', 'empresas', '🏢'),
('a0000000-0000-0000-0000-000000000004', 'CONTATO E ENDEREÇO', 'contato', '📞'),
('a0000000-0000-0000-0000-000000000005', 'PROCESSOS E CRIMINAIS', 'criminal', '⚖️'),
('a0000000-0000-0000-0000-000000000006', 'FOTOS', 'fotos', '📸'),
('a0000000-0000-0000-0000-000000000007', 'MÓDULOS TÉCNICOS', 'tecnico', '🛠️'),
('a0000000-0000-0000-0000-000000000008', 'FINANCEIRO', 'financeiro', '💰')
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  icon = EXCLUDED.icon;

-- 2. Clear current APIs to prevent duplicates and ensure ordering
TRUNCATE TABLE public.apis CASCADE;

-- 3. Consolidated Ingestion
DO $$
DECLARE
  v_veiculos UUID := 'a0000000-0000-0000-0000-000000000001';
  v_pessoas UUID := 'a0000000-0000-0000-0000-000000000002';
  v_empresas UUID := 'a0000000-0000-0000-0000-000000000003';
  v_contato UUID := 'a0000000-0000-0000-0000-000000000004';
  v_criminal UUID := 'a0000000-0000-0000-0000-000000000005';
  v_fotos UUID := 'a0000000-0000-0000-0000-000000000006';
  v_tecnico UUID := 'a0000000-0000-0000-0000-000000000007';
  v_financeiro UUID := 'a0000000-0000-0000-0000-000000000008';
BEGIN

  -- PESSOAS / CPF
  INSERT INTO public.apis (category_id, name, endpoint, group_name) VALUES
  (v_pessoas, 'CPF Básico', 'panel:iseek-cpfbasico', 'Info Easy'),
  (v_pessoas, 'CPF Full', 'panel:iseek-cpf', 'Info Easy'),
  (v_pessoas, 'CatCPF', 'panel:iseek-dados---catcpf', 'Info Easy'),
  (v_pessoas, 'CPF (BrasilPro)', 'brasilpro:cpf', 'BrasilPro'),
  (v_pessoas, 'CPF (Duality)', 'duality:cpf', 'Duality'),
  (v_pessoas, 'Cadsus (TConect)', 'tconect:/api/consulta/cpfsus/v1?cpf={valor}', 'TConect'),
  (v_pessoas, 'SisregIII / CPF v1 (TConect)', 'tconect:/api/consulta/cpf/v1?code={valor}', 'TConect'),
  (v_pessoas, 'CPF v2 (TConect)', 'tconect:/api/consulta/cpf/v2?code={valor}', 'TConect'),
  (v_pessoas, 'CPF v3 (Com Foto) (TConect)', 'tconect:/api/consulta/cpf/v3?code={valor}', 'TConect'),
  (v_pessoas, 'CPF v4 (TConect)', 'tconect:/api/consulta/cpf/v4?code={valor}', 'TConect'),
  (v_pessoas, 'CPF v5 (TConect)', 'tconect:/api/consulta/cpf/v5?code={valor}', 'TConect'),
  (v_pessoas, 'SUS', 'panel:cpfsus', 'Info Easy'),
  (v_pessoas, 'NIS', 'panel:iseek-dados---nis', 'Info Easy'),
  (v_pessoas, 'PIS Geral', 'panel:pis', 'Info Easy'),
  (v_pessoas, 'CNS', 'panel:cns', 'Info Easy'),
  (v_pessoas, 'Mãe', 'panel:iseek-dados---mae', 'Info Easy'),
  (v_pessoas, 'Pai', 'panel:iseek-dados---pai', 'Info Easy'),
  (v_pessoas, 'Nome', 'panel:iseek-dados---nomeabreviadofiltros', 'Info Easy'),
  (v_pessoas, 'Nome v1 (TConect)', 'tconect:/api/consulta/nome/v1?nome={valor}', 'TConect'),
  (v_pessoas, 'Nome (BrasilPro)', 'brasilpro:nome', 'BrasilPro'),
  (v_pessoas, 'Parentes', 'panel:iseek-dados---parentes', 'Info Easy'),
  (v_pessoas, 'Poder Aquisitivo', 'panel:poderaquisitivo', 'Info Easy'),
  (v_pessoas, 'Renda Estimada', 'panel:renda', 'Info Easy'),
  (v_pessoas, 'Título de Eleitor', 'panel:iseek-dados---titulo', 'Info Easy'),
  (v_pessoas, 'Título (BrasilPro)', 'brasilpro:titulo', 'BrasilPro'),
  (v_pessoas, 'RG Nacional', 'panel:iseek-dados---rg', 'Info Easy'),
  (v_pessoas, 'RG (BrasilPro)', 'brasilpro:rg', 'BrasilPro'),
  (v_pessoas, 'Mãe (BrasilPro)', 'brasilpro:mae', 'BrasilPro'),
  (v_pessoas, 'Pai (BrasilPro)', 'brasilpro:pai', 'BrasilPro'),
  (v_pessoas, 'Benefícios INSS', 'panel:iseek-dados---beneficios', 'Info Easy'),
  (v_pessoas, 'Consulta INSS (TConect)', 'tconect:/api/consulta/inss/v1?cpf={valor}', 'TConect'),
  (v_pessoas, 'Consulta Óbito', 'panel:iseek-dados---obito', 'Info Easy'),
  (v_pessoas, 'Faculdades / Acadêmico', 'panel:iseek-dados---faculdades', 'Info Easy'),
  (v_pessoas, 'Cadastro Vacinas', 'panel:iseek-dados---vacinas', 'Info Easy');

  -- VEÍCULOS
  INSERT INTO public.apis (category_id, name, endpoint, group_name) VALUES
  (v_veiculos, 'Placa Nacional', 'panel:iseek-dados---placa', 'Info Easy'),
  (v_veiculos, 'Placa v1 (TConect)', 'tconect:/api/consulta/placa/v1?placa={valor}', 'TConect'),
  (v_veiculos, 'Placa v2 (TConect)', 'tconect:/api/consulta/placa/v2?placa={valor}', 'TConect'),
  (v_veiculos, 'Chassi', 'panel:iseek-dados---chassi', 'Info Easy'),
  (v_veiculos, 'Chassi v1 (TConect)', 'tconect:/api/consulta/motor/v1?tipo=chassi&valor={valor}', 'TConect'),
  (v_veiculos, 'Motor', 'panel:iseek-dados---motor', 'Info Easy'),
  (v_veiculos, 'Motor v1 (TConect)', 'tconect:/api/consulta/motor/v1?tipo=motor&valor={valor}', 'TConect'),
  (v_veiculos, 'RENAVAM', 'panel:iseek-dados---renavam', 'Info Easy'),
  (v_veiculos, 'CRLV MT', 'panel:iseek-dados---crlvmt', 'Info Easy'),
  (v_veiculos, 'CRLV TO', 'panel:iseek-dados---crlvto', 'Info Easy'),
  (v_veiculos, 'Frota em Nome', 'panel:iseek-dados---veiculos', 'Info Easy');

  -- FINANCEIRO
  INSERT INTO public.apis (category_id, name, endpoint, group_name) VALUES
  (v_financeiro, 'Score Serasa', 'panel:iseek-dados---score', 'Info Easy'),
  (v_financeiro, 'Score Serasa v2', 'panel:iseek-dados---score2', 'Info Easy'),
  (v_financeiro, 'Score (TConect)', 'tconect:/api/consulta/score/v1?cpf={valor}', 'TConect'),
  (v_financeiro, 'Dívidas e Protestos', 'panel:iseek-dados---dividas', 'Info Easy'),
  (v_financeiro, 'Bens em Nome', 'panel:iseek-dados---bens', 'Info Easy'),
  (v_financeiro, 'IRPF / Restituição', 'panel:iseek-dados---irpf', 'Info Easy'),
  (v_financeiro, 'Cheques sem Fundo', 'panel:iseek-dados---cheque', 'Info Easy'),
  (v_financeiro, 'PIX / Chave', 'panel:iseek-dados---pix', 'Info Easy'),
  (v_financeiro, 'CNPJ Receita', 'panel:iseek-dados---cnpj', 'Info Easy'),
  (v_financeiro, 'CNPJ v1 (TConect)', 'tconect:/api/consulta/cnpj/v1?cnpj={valor}', 'TConect'),
  (v_financeiro, 'CNPJ FGTS (TConect)', 'tconect:/api/consulta/cnpjFGTS/v2?cnpj={valor}', 'TConect'),
  (v_financeiro, 'Assessoria / Advínculo', 'panel:iseek-dados---assessoria', 'Info Easy');

  -- CONTATO
  INSERT INTO public.apis (category_id, name, endpoint, group_name) VALUES
  (v_contato, 'Telefone', 'panel:iseek-dados---telefone', 'Info Easy'),
  (v_contato, 'Telefone v1 (TConect)', 'tconect:/api/consulta/telefone/v1?telefone={valor}', 'TConect'),
  (v_contato, 'E-mail', 'panel:iseek-dados---email', 'Info Easy'),
  (v_contato, 'CEP', 'panel:iseek-dados---cep', 'Info Easy'),
  (v_contato, 'CEP v1 (TConect)', 'tconect:/api/consulta/cep/v1?cep={valor}', 'TConect');

  -- FOTOS
  INSERT INTO public.apis (category_id, name, endpoint, group_name) VALUES
  (v_fotos, 'Foto Nacional', 'panel:iseek-fotos---fotocnh', 'Info Easy'),
  (v_fotos, 'Foto Detran Integrada', 'panel:iseek-dados---fotodetran', 'Info Easy'),
  (v_fotos, 'Fotope v1 (TConect)', 'tconect:/api/consulta/fotope/v1?nome={valor}', 'TConect'),
  
  -- Estaduais InfoEasy
  (v_fotos, 'Foto MG', 'panel:iseek-fotos---fotomg', 'Estados (InfoEasy)'),
  (v_fotos, 'Foto SP', 'panel:iseek-fotos---fotosp', 'Estados (InfoEasy)'),
  (v_fotos, 'Foto MA', 'panel:iseek-fotos---fotoma', 'Estados (InfoEasy)'),
  (v_fotos, 'Foto MS', 'panel:iseek-fotos---fotoms', 'Estados (InfoEasy)'),
  (v_fotos, 'Foto TO', 'panel:iseek-fotos---fototo', 'Estados (InfoEasy)'),
  (v_fotos, 'Foto RO', 'panel:iseek-fotos---fotoro', 'Estados (InfoEasy)'),
  (v_fotos, 'Foto PI', 'panel:iseek-fotos---fotopi', 'Estados (InfoEasy)'),
  (v_fotos, 'Foto ES', 'panel:iseek-fotos---fotoes', 'Estados (InfoEasy)'),
  (v_fotos, 'Foto DF', 'panel:iseek-fotos---fotodf', 'Estados (InfoEasy)'),
  (v_fotos, 'Foto CE', 'panel:iseek-fotos---fotoce', 'Estados (InfoEasy)'),
  (v_fotos, 'Foto RJ', 'panel:iseek-fotos---fotorj', 'Estados (InfoEasy)'),
  (v_fotos, 'Foto PR', 'panel:iseek-fotos---fotopr', 'Estados (InfoEasy)'),
  (v_fotos, 'Foto RN', 'panel:iseek-fotos---fotorn', 'Estados (InfoEasy)'),
  (v_fotos, 'Foto PE', 'panel:iseek-fotos---fotope', 'Estados (InfoEasy)'),
  (v_fotos, 'Foto PB', 'panel:iseek-fotos---fotopb', 'Estados (InfoEasy)'),
  (v_fotos, 'Foto GO', 'panel:iseek-fotos---fotogo', 'Estados (InfoEasy)'),
  (v_fotos, 'Foto AL', 'panel:iseek-fotos---fotoal', 'Estados (InfoEasy)'),
  (v_fotos, 'Presos MA (Foto)', 'panel:iseek-fotos---fotomapresos', 'Estados (InfoEasy)'),
  
  -- Estaduais TConect
  (v_fotos, 'Foto RJ (TConect)', 'tconect:fotorj', 'Estados (TConect)'),
  (v_fotos, 'Foto MA (TConect)', 'tconect:fotoma', 'Estados (TConect)'),
  (v_fotos, 'Foto RO (TConect)', 'tconect:fotoro', 'Estados (TConect)'),
  (v_fotos, 'Foto SP (TConect)', 'tconect:fotosp', 'Estados (TConect)'),
  (v_fotos, 'Foto CE (TConect)', 'tconect:fotoce', 'Estados (TConect)'),
  (v_fotos, 'Foto BA (TConect)', 'tconect:fotoba', 'Estados (TConect)');

  -- CRIMINAL / JUDICIAL
  INSERT INTO public.apis (category_id, name, endpoint, group_name) VALUES
  (v_criminal, 'OAB / Advogados', 'panel:iseek-dados---oab', 'Info Easy'),
  (v_criminal, 'Processos Judiciais', 'panel:iseek-dados---processos', 'Info Easy'),
  (v_criminal, 'Consulta Mandado', 'panel:iseek-dados---mandado', 'Info Easy'),
  (v_criminal, 'Certidões Criminais', 'panel:iseek-dados---certidoes', 'Info Easy'),
  (v_criminal, 'Matrícula de Imóvel', 'panel:iseek-dados---matricula', 'Info Easy');

  -- TÉCNICO / VÁRIOS
  INSERT INTO public.apis (category_id, name, endpoint, group_name) VALUES
  (v_tecnico, 'IP / Geolocalização', 'panel:ip', 'Info Easy'),
  (v_tecnico, 'MAC Address', 'panel:mac', 'Info Easy'),
  (v_tecnico, 'BIN / Cartão', 'panel:bin', 'Info Easy'),
  (v_tecnico, 'IPTU / Imóveis', 'panel:iseek-dados---iptu', 'Info Easy'),
  (v_tecnico, 'Registros Profissionais', 'panel:iseek-dados---registro', 'Info Easy'),
  (v_tecnico, 'CNH Estadual', 'panel:iseek-dados---cnh', 'Info Easy');

END $$;
