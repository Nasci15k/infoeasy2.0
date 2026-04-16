-- 20260416000003_exhaustive_catalog.sql
-- COMPLETE AND ORGANIZED CATALOG FOR INFOEASY 2.0

-- 1. Ensure Categories are properly set
INSERT INTO public.api_categories (id, name, slug, icon) VALUES
('a0000000-0000-0000-0000-000000000001', 'VEÍCULOS', 'veiculos', '🚗'),
('a0000000-0000-0000-0000-000000000002', 'PESSOAS', 'pessoas', '👤'),
('a0000000-0000-0000-0000-000000000003', 'EMPRESAS', 'empresas', '🏢'),
('a0000000-0000-0000-0000-000000000004', 'CONTATO E ENDEREÇO', 'contato', '📞'),
('a0000000-0000-0000-0000-000000000005', 'PROCESSOS E CRIMINAIS', 'criminal', '⚖️'),
('a0000000-0000-0000-0000-000000000006', 'FOTOS', 'fotos', '📸'),
('a0000000-0000-0000-0000-000000000007', 'MÓDULOS TÉCNICOS', 'tecnico', '🛠️'),
('a0000000-0000-0000-0000-000000000008', 'FINANCEIRO', 'financeiro', '💰')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

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

  -- PESSOAS / CPF & CO.
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  (v_pessoas, 'CPF - Info Easy Básico', 'panel:iseek-cpfbasico', 'Info Easy', 'CPF'),
  (v_pessoas, 'CPF - Info Easy Full', 'panel:iseek-cpf', 'Info Easy', 'CPF'),
  (v_pessoas, 'CPF - CatCPF', 'panel:iseek-dados---catcpf', 'Info Easy', 'CPF'),
  (v_pessoas, 'CPF - BrasilPro', 'brasilpro:cpf', 'BrasilPro', 'CPF'),
  (v_pessoas, 'CPF - Duality', 'duality:cpf', 'Duality', 'CPF'),
  (v_pessoas, 'CPF - Cadsus (TConect)', 'tconect:/api/consulta/cpfsus/v1?cpf={valor}', 'TConect', 'CPF'),
  (v_pessoas, 'CPF - SisregIII (TConect)', 'tconect:/api/consulta/cpf/v1?code={valor}', 'TConect', 'CPF'),
  -- Documentos
  (v_pessoas, 'RG - Info Easy', 'panel:iseek-dados---rg', 'Info Easy', 'RG'),
  (v_pessoas, 'RG - BrasilPro', 'brasilpro:rg', 'BrasilPro', 'RG'),
  (v_pessoas, 'CNH - Vários Info Easy', 'panel:iseek-dados---cnh', 'Info Easy', 'CPF'),
  -- Trabalho / Social
  (v_pessoas, 'NIS - Info Easy', 'panel:iseek-dados---nis', 'Info Easy', 'CPF'),
  (v_pessoas, 'PIS - Info Easy', 'panel:iseek-dados---pis', 'Info Easy', 'CPF'),
  (v_pessoas, 'FGTS - TConect', 'tconect:/api/consulta/fgts/v1?cpf={valor}', 'TConect', 'CPF'),
  (v_pessoas, 'INSS - TConect', 'tconect:/api/consulta/inss/v1?cpf={valor}', 'TConect', 'CPF'),
  (v_pessoas, 'Benefícios - Info Easy', 'panel:iseek-dados---beneficios', 'Info Easy', 'CPF'),
  -- Identificação
  (v_pessoas, 'NOME - Info Easy', 'panel:iseek-dados---nome', 'Info Easy', 'Nome'),
  (v_pessoas, 'NOME - TConect', 'tconect:/api/consulta/nome/v1?nome={valor}', 'TConect', 'Nome'),
  (v_pessoas, 'NOME - BrasilPro', 'brasilpro:nome', 'BrasilPro', 'Nome'),
  (v_pessoas, 'NOME PAI - Info Easy', 'panel:iseek-dados---pai', 'Info Easy', 'Nome'),
  (v_pessoas, 'NOME PAI - BrasilPro', 'brasilpro:pai', 'BrasilPro', 'Nome'),
  (v_pessoas, 'NOME MÃE - Info Easy', 'panel:iseek-dados---mae', 'Info Easy', 'Nome'),
  (v_pessoas, 'NOME MÃE - BrasilPro', 'brasilpro:mae', 'BrasilPro', 'Nome'),
  -- Outros
  (v_pessoas, 'CNS - TConect', 'tconect:/api/consulta/cns/v1?cns={valor}', 'TConect', 'CNS'),
  (v_pessoas, 'CNS - Info Easy', 'panel:iseek-dados---cns', 'Info Easy', 'CPF'),
  (v_pessoas, 'Parentes - Info Easy', 'panel:iseek-dados---parentes', 'Info Easy', 'CPF'),
  (v_pessoas, 'Óbito - Info Easy', 'panel:iseek-dados---obito', 'Info Easy', 'CPF'),
  (v_pessoas, 'Vacinas - Info Easy', 'panel:iseek-dados---vacinas', 'Info Easy', 'CPF'),
  (v_pessoas, 'Renda Estimada - Info Easy', 'panel:iseek-dados---renda', 'Info Easy', 'CPF'),
  (v_pessoas, 'Poder Aquisitivo - Info Easy', 'panel:iseek-dados---poderaquisitivo', 'Info Easy', 'CPF'),
  (v_pessoas, 'Título de Eleitor - Info Easy', 'panel:iseek-dados---titulo', 'Info Easy', 'CPF'),
  (v_pessoas, 'Faculdades - Info Easy', 'panel:iseek-dados---faculdades', 'Info Easy', 'CPF');

  -- VEÍCULOS
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  (v_veiculos, 'PLACA - Info Easy', 'panel:iseek-dados---placa', 'Info Easy', 'Placa'),
  (v_veiculos, 'PLACA - TConect v1', 'tconect:/api/consulta/placa/v1?placa={valor}', 'TConect', 'Placa'),
  (v_veiculos, 'PLACA - TConect v2', 'tconect:/api/consulta/placa/v2?placa={valor}', 'TConect', 'Placa'),
  (v_veiculos, 'CHASSI - Info Easy', 'panel:iseek-dados---chassi', 'Info Easy', 'Chassi'),
  (v_veiculos, 'CHASSI - TConect', 'tconect:/api/consulta/motor/v1?tipo=chassi&valor={valor}', 'TConect', 'Chassi'),
  (v_veiculos, 'CHASSI - BrasilPro', 'brasilpro:chassi', 'BrasilPro', 'Chassi'),
  (v_veiculos, 'MOTOR - Info Easy', 'panel:iseek-dados---motor', 'Info Easy', 'Motor'),
  (v_veiculos, 'MOTOR - TConect', 'tconect:/api/consulta/motor/v1?tipo=motor&valor={valor}', 'TConect', 'Motor'),
  (v_veiculos, 'MOTOR - BrasilPro', 'brasilpro:motor', 'BrasilPro', 'Motor'),
  (v_veiculos, 'RENAVAM - Info Easy', 'panel:iseek-dados---renavam', 'Info Easy', 'Renavam'),
  (v_veiculos, 'RENAVAM - BrasilPro', 'brasilpro:renavam', 'BrasilPro', 'Renavam'),
  (v_veiculos, 'CRLV - Info Easy MT', 'panel:iseek-dados---crlvmt', 'Info Easy', 'Placa'),
  (v_veiculos, 'CRLV - Info Easy TO', 'panel:iseek-dados---crlvto', 'Info Easy', 'Placa'),
  (v_veiculos, 'FROTA - Info Easy', 'panel:iseek-dados---veiculos', 'Info Easy', 'CPF');

  -- FINANCEIRO
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  (v_financeiro, 'SCORE - Info Easy', 'panel:iseek-dados---score', 'Info Easy', 'CPF'),
  (v_financeiro, 'SCORE - TConect', 'tconect:/api/consulta/score/v1?cpf={valor}', 'TConect', 'CPF'),
  (v_financeiro, 'CHEQUES - Info Easy', 'panel:iseek-dados---cheque', 'Info Easy', 'CPF'),
  (v_financeiro, 'PIX - Info Easy', 'panel:iseek-dados---pix', 'Info Easy', 'CPF'),
  (v_financeiro, 'BENS - Info Easy', 'panel:iseek-dados---bens', 'Info Easy', 'CPF'),
  (v_financeiro, 'DÍVIDAS - Info Easy', 'panel:iseek-dados---dividas', 'Info Easy', 'CPF'),
  (v_financeiro, 'IRPF - Info Easy', 'panel:iseek-dados---irpf', 'Info Easy', 'CPF');

  -- EMPRESAS
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  (v_empresas, 'CNPJ - Info Easy', 'panel:iseek-dados---cnpj', 'Info Easy', 'CNPJ'),
  (v_empresas, 'CNPJ - TConect', 'tconect:/api/consulta/cnpj/v1?cnpj={valor}', 'TConect', 'CNPJ');

  -- CONTATO
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  (v_contato, 'TELEFONE - TConect', 'tconect:/api/consulta/telefone/v1?telefone={valor}', 'TConect', 'Telefone'),
  (v_contato, 'TELEFONE - Info Easy', 'panel:iseek-dados---telefone', 'Info Easy', 'Telefone'),
  (v_contato, 'E-MAIL - Info Easy', 'panel:iseek-dados---email', 'Info Easy', 'E-mail'),
  (v_contato, 'CEP - Info Easy', 'panel:iseek-dados---cep', 'Info Easy', 'CEP'),
  (v_contato, 'CEP - TConect', 'tconect:/api/consulta/cep/v1?cep={valor}', 'TConect', 'CEP');

  -- FOTOS
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  -- Nacional
  (v_fotos, 'FOTO NACIONAL - Foto Nacional', 'panel:iseek-fotos---fotonc', 'Nacional', 'CPF'),
  (v_fotos, 'FOTO NACIONAL - Detran', 'panel:iseek-dados---fotodetran', 'Nacional', 'CPF'),
  (v_fotos, 'FOTO NACIONAL - CNH', 'panel:iseek-fotos---fotocnh', 'Nacional', 'CPF'),
  -- TConect Estados
  (v_fotos, 'FOTO ESTADOS - RJ (TConect)', 'tconect:fotorj', 'TConect (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - MA (TConect)', 'tconect:fotoma', 'TConect (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - RO (TConect)', 'tconect:fotoro', 'TConect (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - SP (TConect)', 'tconect:fotosp', 'TConect (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - CE (TConect)', 'tconect:fotoce', 'TConect (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - BA (TConect)', 'tconect:fotoba', 'TConect (Estados)', 'CPF'),
  -- Info Easy Estados
  (v_fotos, 'FOTO ESTADOS - MG (Info Easy)', 'panel:iseek-fotos---fotomg', 'Info Easy (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - SP (Info Easy)', 'panel:iseek-fotos---fotosp', 'Info Easy (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - MA (Info Easy)', 'panel:iseek-fotos---fotoma', 'Info Easy (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - MS (Info Easy)', 'panel:iseek-fotos---fotoms', 'Info Easy (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - TO (Info Easy)', 'panel:iseek-fotos---fototo', 'Info Easy (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - RO (Info Easy)', 'panel:iseek-fotos---fotoro', 'Info Easy (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - PI (Info Easy)', 'panel:iseek-fotos---fotopi', 'Info Easy (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - ES (Info Easy)', 'panel:iseek-fotos---fotoes', 'Info Easy (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - DF (Info Easy)', 'panel:iseek-fotos---fotodf', 'Info Easy (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - RJ (Info Easy)', 'panel:iseek-fotos---fotorj', 'Info Easy (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - CE (Info Easy)', 'panel:iseek-fotos---fotoce', 'Info Easy (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - PR (Info Easy)', 'panel:iseek-fotos---fotopr', 'Info Easy (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - RN (Info Easy)', 'panel:iseek-fotos---fotorn', 'Info Easy (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - PE (Info Easy)', 'panel:iseek-fotos---fotope', 'Info Easy (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - PB (Info Easy)', 'panel:iseek-fotos---fotopb', 'Info Easy (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - GO (Info Easy)', 'panel:iseek-fotos---fotogo', 'Info Easy (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - AL (Info Easy)', 'panel:iseek-fotos---fotoal', 'Info Easy (Estados)', 'CPF'),
  (v_fotos, 'FOTO ESTADOS - Presos MA (Info Easy)', 'panel:iseek-fotos---fotomapresos', 'Info Easy (Estados)', 'CPF');

  -- CRIMINAL
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  (v_criminal, 'OAB - Info Easy', 'panel:iseek-dados---oab', 'Info Easy', 'OAB/Nome'),
  (v_criminal, 'PROCESSOS - Info Easy', 'panel:iseek-dados---processos', 'Info Easy', 'CPF/Processo'),
  (v_criminal, 'MANDADO - Info Easy', 'panel:iseek-dados---mandado', 'Info Easy', 'CPF'),
  (v_criminal, 'CERTIDÕES - Info Easy', 'panel:iseek-dados---certidoes', 'Info Easy', 'CPF'),
  (v_criminal, 'ACESSORIA - Info Easy', 'panel:iseek-dados---assessoria', 'Info Easy', 'CPF');

  -- TÉCNICO
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  (v_tecnico, 'IPTU - Info Easy', 'panel:iseek-dados---iptu', 'Info Easy', 'CPF'),
  (v_tecnico, 'IP - Info Easy', 'panel:ip', 'Info Easy', 'IP'),
  (v_tecnico, 'MAC - Info Easy', 'panel:mac', 'Info Easy', 'MAC'),
  (v_tecnico, 'BIN - Info Easy', 'panel:bin', 'Info Easy', 'BIN'),
  (v_tecnico, 'REGISTROS - Info Easy', 'panel:iseek-dados---registro', 'Info Easy', 'CPF');

END $$;
