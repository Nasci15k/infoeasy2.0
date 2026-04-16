-- 20260416000004_specific_modules.sql
-- EXHAUSTIVE AND MICRO-CATEGORIZED CATALOG FOR INFOEASY 2.0

-- 1. Add color_group to categories if not exists
ALTER TABLE public.api_categories ADD COLUMN IF NOT EXISTS color_group text DEFAULT 'blue';

-- 2. Clean current categories and APIs to prevent duplicates and ensure ordering
TRUNCATE TABLE public.apis CASCADE;
TRUNCATE TABLE public.api_categories CASCADE;

-- 3. Ingest specific categories (Módulos)
INSERT INTO public.api_categories (id, name, slug, icon, color_group) VALUES
-- PESSOAS Group (Emerald)
('b0000000-0000-0000-0000-000000000001', 'CPF', 'cpf', '🪪', 'emerald'),
('b0000000-0000-0000-0000-000000000002', 'NOME', 'nome', '👤', 'emerald'),
('b0000000-0000-0000-0000-000000000003', 'NOME PAI', 'nome-pai', '🧔', 'emerald'),
('b0000000-0000-0000-0000-000000000004', 'NOME MÃE', 'nome-mae', '👩', 'emerald'),
('b0000000-0000-0000-0000-000000000005', 'RG', 'rg', '🪪', 'emerald'),
('b0000000-0000-0000-0000-000000000006', 'CNH', 'cnh', '🏎️', 'emerald'),
('b0000000-0000-0000-0000-000000000007', 'CNS', 'cns', '💳', 'emerald'),
('b0000000-0000-0000-0000-000000000008', 'NIS', 'nis', '🆔', 'emerald'),
('b0000000-0000-0000-0000-000000000009', 'PIS', 'pis', '📑', 'emerald'),
('b0000000-0000-0000-0000-000000000010', 'PARENTES', 'parentes', '👪', 'emerald'),
('b0000000-0000-0000-0000-000000000011', 'ÓBITO', 'obito', '⚰️', 'emerald'),
('b0000000-0000-0000-0000-000000000012', 'VACINAS', 'vacinas', '💉', 'emerald'),
('b0000000-0000-0000-0000-000000000013', 'RENDA', 'renda', '💵', 'emerald'),
('b0000000-0000-0000-0000-000000000014', 'PODER AQUISITIVO', 'poder-aquisitivo', '🃏', 'emerald'),
('b0000000-0000-0000-0000-000000000015', 'TÍTULO ELEITOR', 'titulo', '🗳️', 'emerald'),
('b0000000-0000-0000-0000-000000000016', 'FACULDADES', 'faculdades', '🎓', 'emerald'),

-- VEÍCULOS Group (Blue)
('b0000000-0000-0000-0000-000000000017', 'PLACA', 'placa', '🚗', 'blue'),
('b0000000-0000-0000-0000-000000000018', 'CHASSI', 'chassi', '🔩', 'blue'),
('b0000000-0000-0000-0000-000000000019', 'MOTOR', 'motor', '⚙️', 'blue'),
('b0000000-0000-0000-0000-000000000020', 'RENAVAM', 'renavam', '📋', 'blue'),
('b0000000-0000-0000-0000-000000000021', 'CRLV', 'crlv', '📄', 'blue'),
('b0000000-0000-0000-0000-000000000022', 'FROTA', 'frota', '🚚', 'blue'),

-- FINANCEIRO Group (Amber)
('b0000000-0000-0000-0000-000000000023', 'SCORE', 'score', '📈', 'amber'),
('b0000000-0000-0000-0000-000000000024', 'CHEQUES', 'cheques', '💸', 'amber'),
('b0000000-0000-0000-0000-000000000025', 'PIX', 'pix', '💎', 'amber'),
('b0000000-0000-0000-0000-000000000026', 'BENS', 'bens', '🏠', 'amber'),
('b0000000-0000-0000-0000-000000000027', 'DÍVIDAS', 'dividas', '💰', 'rose'), -- Red accent for debts
('b0000000-0000-0000-0000-000000000028', 'IRPF', 'irpf', '💹', 'amber'),
('b0000000-0000-0000-0000-000000000029', 'INSS', 'inss', '👴', 'amber'),
('b0000000-0000-0000-0000-000000000030', 'FGTS', 'fgts', '🏦', 'amber'),
('b0000000-0000-0000-0000-000000000031', 'BENEFÍCIOS', 'beneficios', '🎁', 'amber'),

-- EMPRESAS Group (Cyan)
('b0000000-0000-0000-0000-000000000032', 'CNPJ', 'cnpj', '🏢', 'cyan'),

-- CONTATO Group (Purple)
('b0000000-0000-0000-0000-000000000033', 'TELEFONE', 'telefone', '📞', 'purple'),
('b0000000-0000-0000-0000-000000000034', 'E-MAIL', 'email', '📧', 'purple'),
('b0000000-0000-0000-0000-000000000035', 'CEP', 'cep', '📍', 'purple'),

-- FOTOS Group (Orange)
('b0000000-0000-0000-0000-000000000036', 'FOTO NACIONAL', 'foto-nacional', '📸', 'orange'),
('b0000000-0000-0000-0000-000000000037', 'FOTO ESTADOS', 'foto-estados', '📁', 'orange'),

-- CRIMINAL Group (Rose)
('b0000000-0000-0000-0000-000000000038', 'OAB', 'oab', '⚖️', 'rose'),
('b0000000-0000-0000-0000-000000000039', 'PROCESSOS', 'processos', '📂', 'rose'),
('b0000000-0000-0000-0000-000000000040', 'MANDADO', 'mandado', '🚔', 'rose'),
('b0000000-0000-0000-0000-000000000041', 'CERTIDÕES', 'certidoes', '📜', 'rose'),
('b0000000-0000-0000-0000-000000000042', 'ACESSORIA', 'assessoria', '💼', 'rose'),

-- TÉCNICO Group (Cyan)
('b0000000-0000-0000-0000-000000000043', 'IPTU', 'iptu', '🏠', 'cyan'),
('b0000000-0000-0000-0000-000000000044', 'IP', 'ip', '🌐', 'cyan'),
('b0000000-0000-0000-0000-000000000045', 'MAC', 'mac', '💻', 'cyan'),
('b0000000-0000-0000-0000-000000000046', 'BIN', 'bin', '💳', 'cyan'),
('b0000000-0000-0000-0000-000000000047', 'REGISTROS', 'registros', '🗒️', 'cyan');


-- 4. Ingest APIs (Semi-módulos)
DO $$
BEGIN

  -- CPF
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='cpf'), 'Info Easy Básico', 'panel:iseek-cpfbasico', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='cpf'), 'Info Easy Full', 'panel:iseek-cpf', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='cpf'), 'CatCPF', 'panel:iseek-dados---catcpf', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='cpf'), 'BrasilPro CPF', 'brasilpro:cpf', 'BrasilPro', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='cpf'), 'Duality CPF', 'duality:cpf', 'Duality', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='cpf'), 'CadSUS (TConect)', 'tconect:/api/consulta/cpfsus/v1?cpf={valor}', 'TConect', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='cpf'), 'SisregIII (TConect)', 'tconect:/api/consulta/cpf/v1?code={valor}', 'TConect', 'CPF');

  -- PLACA
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='placa'), 'Info Easy Placa', 'panel:iseek-dados---placa', 'Info Easy', 'Placa'),
  ((SELECT id FROM public.api_categories WHERE slug='placa'), 'TConect Placa v1', 'tconect:/api/consulta/placa/v1?placa={valor}', 'TConect', 'Placa'),
  ((SELECT id FROM public.api_categories WHERE slug='placa'), 'TConect Placa v2', 'tconect:/api/consulta/placa/v2?placa={valor}', 'TConect', 'Placa');

  -- CHASSI
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='chassi'), 'Info Easy Chassi', 'panel:iseek-dados---chassi', 'Info Easy', 'Chassi'),
  ((SELECT id FROM public.api_categories WHERE slug='chassi'), 'TConect Chassi', 'tconect:/api/consulta/motor/v1?tipo=chassi&valor={valor}', 'TConect', 'Chassi'),
  ((SELECT id FROM public.api_categories WHERE slug='chassi'), 'BrasilPro Chassi', 'brasilpro:chassi', 'BrasilPro', 'Chassi');

  -- MOTOR
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='motor'), 'Info Easy Motor', 'panel:iseek-dados---motor', 'Info Easy', 'Motor'),
  ((SELECT id FROM public.api_categories WHERE slug='motor'), 'TConect Motor', 'tconect:/api/consulta/motor/v1?tipo=motor&valor={valor}', 'TConect', 'Motor'),
  ((SELECT id FROM public.api_categories WHERE slug='motor'), 'BrasilPro Motor', 'brasilpro:motor', 'BrasilPro', 'Motor');

  -- RENAVAM
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='renavam'), 'Info Easy Renavam', 'panel:iseek-dados---renavam', 'Info Easy', 'Renavam'),
  ((SELECT id FROM public.api_categories WHERE slug='renavam'), 'BrasilPro Renavam', 'brasilpro:renavam', 'BrasilPro', 'Renavam');

  -- NOME
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='nome'), 'Nome Completo - Info Easy', 'panel:iseek-dados---nome', 'Info Easy', 'Nome'),
  ((SELECT id FROM public.api_categories WHERE slug='nome'), 'Nome (TConect)', 'tconect:/api/consulta/nome/v1?nome={valor}', 'TConect', 'Nome'),
  ((SELECT id FROM public.api_categories WHERE slug='nome'), 'Nome (BrasilPro)', 'brasilpro:nome', 'BrasilPro', 'Nome');

  -- NOME PAI / MAE
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='nome-pai'), 'Pai - Info Easy', 'panel:iseek-dados---pai', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='nome-pai'), 'Pai - BrasilPro', 'brasilpro:pai', 'BrasilPro', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='nome-mae'), 'Mãe - Info Easy', 'panel:iseek-dados---mae', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='nome-mae'), 'Mãe - BrasilPro', 'brasilpro:mae', 'BrasilPro', 'CPF');

  -- FOTOS ESTADOS
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto RJ (TConect)', 'tconect:fotorj', 'Estadual', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto SP (Info Easy)', 'panel:iseek-fotos---fotosp', 'Estadual', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto MG (Info Easy)', 'panel:iseek-fotos---fotomg', 'Estadual', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto RJ (Info Easy)', 'panel:iseek-fotos---fotorj', 'Estadual', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto MA (Info Easy)', 'panel:iseek-fotos---fotoma', 'Estadual', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto DF (Info Easy)', 'panel:iseek-fotos---fotodf', 'Estadual', 'CPF');
  -- (Pode adicionar os outros conforme necessário, mantendo a estrutura)

  -- FINANCEIRO
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='score'), 'Score - Info Easy', 'panel:iseek-dados---score', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='score'), 'Score - TConect', 'tconect:/api/consulta/score/v1?cpf={valor}', 'TConect', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='fgts'), 'FGTS - TConect', 'tconect:/api/consulta/fgts/v1?cpf={valor}', 'TConect', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='inss'), 'INSS - TConect', 'tconect:/api/consulta/inss/v1?cpf={valor}', 'TConect', 'CPF');

  -- TÉCNICO
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='bin'), 'BIN / Cartão', 'panel:bin', 'Info Easy', 'BIN'),
  ((SELECT id FROM public.api_categories WHERE slug='ip'), 'IP / Geoloc', 'panel:ip', 'Info Easy', 'IP');

END $$;
