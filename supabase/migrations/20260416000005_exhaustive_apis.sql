-- 20260416000005_exhaustive_apis.sql
-- COMPLETE POPULATION OF ALL 50+ MICRO-MODULES

-- 1. Add missing specific categories
INSERT INTO public.api_categories (id, name, slug, icon, color_group) VALUES
('b0000000-0000-0000-0000-000000000048', 'NASCIMENTO', 'nascimento', '👶', 'emerald'),
('b0000000-0000-0000-0000-000000000049', 'RAIS', 'rais', '📁', 'cyan'),
('b0000000-0000-0000-0000-000000000050', 'MATRÍCULA', 'matricula', '📜', 'rose'),
('b0000000-0000-0000-0000-000000000051', 'FUNCIONAL', 'funcional', '👔', 'emerald')
ON CONFLICT (slug) DO NOTHING;

-- 2. Clear current APIs to prevent duplicates
TRUNCATE TABLE public.apis CASCADE;

-- 3. Consolidated Ingestion (Info Easy prioritized at the top of inserts)
DO $$
BEGIN

  -- CPF
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='cpf'), 'Info Easy Full', 'panel:iseek-cpf', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='cpf'), 'Info Easy Básico', 'panel:iseek-cpfbasico', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='cpf'), 'CatCPF', 'panel:iseek-dados---catcpf', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='cpf'), 'CPF v1 (TConect)', 'tconect:/api/consulta/cpf/v1?code={valor}', 'TConect', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='cpf'), 'CPF v2 (TConect)', 'tconect:/api/consulta/cpf/v2?code={valor}', 'TConect', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='cpf'), 'CPF v3 (TConect)', 'tconect:/api/consulta/cpf/v3?code={valor}', 'TConect', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='cpf'), 'CPF v4 (TConect)', 'tconect:/api/consulta/cpf/v4?code={valor}', 'TConect', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='cpf'), 'CPF v5 (TConect)', 'tconect:/api/consulta/cpf/v5?code={valor}', 'TConect', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='cpf'), 'CPF CadSUS (TConect)', 'tconect:/api/consulta/cpfsus/v1?cpf={valor}', 'TConect', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='cpf'), 'BrasilPro CPF', 'brasilpro:cpf', 'BrasilPro', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='cpf'), 'Duality CPF', 'duality:cpf', 'Duality', 'CPF');

  -- PLACA
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='placa'), 'Info Easy Placa', 'panel:iseek-dados---placa', 'Info Easy', 'Placa'),
  ((SELECT id FROM public.api_categories WHERE slug='placa'), 'Placa v1 (TConect)', 'tconect:/api/consulta/placa/v1?placa={valor}', 'TConect', 'Placa'),
  ((SELECT id FROM public.api_categories WHERE slug='placa'), 'Placa v2 (TConect)', 'tconect:/api/consulta/placa/v2?placa={valor}', 'TConect', 'Placa');

  -- CHASSI
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='chassi'), 'Info Easy Chassi', 'panel:iseek-dados---chassi', 'Info Easy', 'Chassi'),
  ((SELECT id FROM public.api_categories WHERE slug='chassi'), 'Chassi v1 (TConect)', 'tconect:/api/consulta/motor/v1?tipo=chassi&valor={valor}', 'TConect', 'Chassi');

  -- MOTOR
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='motor'), 'Info Easy Motor', 'panel:iseek-dados---motor', 'Info Easy', 'Motor'),
  ((SELECT id FROM public.api_categories WHERE slug='motor'), 'Motor v1 (TConect)', 'tconect:/api/consulta/motor/v1?tipo=motor&valor={valor}', 'TConect', 'Motor');

  -- RENAVAM
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='renavam'), 'Info Easy Renavam', 'panel:iseek-dados---renavam', 'Info Easy', 'Renavam');

  -- NOME
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='nome'), 'Nome (Filtros) - Info Easy', 'panel:iseek-dados---nomeabreviadofiltros', 'Info Easy', 'Nome'),
  ((SELECT id FROM public.api_categories WHERE slug='nome'), 'Nome v1 (TConect)', 'tconect:/api/consulta/nome/v1?nome={valor}', 'TConect', 'Nome'),
  ((SELECT id FROM public.api_categories WHERE slug='nome'), 'BrasilPro Nome', 'brasilpro:nome', 'BrasilPro', 'Nome');

  -- NOME PAI / MÃE
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='nome-pai'), 'Pai - Info Easy', 'panel:iseek-dados---pai', 'Info Easy', 'Nome'),
  ((SELECT id FROM public.api_categories WHERE slug='nome-pai'), 'BrasilPro Pai', 'brasilpro:pai', 'BrasilPro', 'Nome'),
  ((SELECT id FROM public.api_categories WHERE slug='nome-mae'), 'Mãe - Info Easy', 'panel:iseek-dados---mae', 'Info Easy', 'Nome'),
  ((SELECT id FROM public.api_categories WHERE slug='nome-mae'), 'BrasilPro Mãe', 'brasilpro:mae', 'BrasilPro', 'Nome');

  -- RG / CNH / OUTROS
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='rg'), 'RG - Info Easy', 'panel:iseek-dados---rg', 'Info Easy', 'RG'),
  ((SELECT id FROM public.api_categories WHERE slug='rg'), 'BrasilPro RG', 'brasilpro:rg', 'BrasilPro', 'RG'),
  ((SELECT id FROM public.api_categories WHERE slug='cnh'), 'CNH - Info Easy', 'panel:iseek-dados---cnh', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='cnh'), 'CNH NC', 'panel:iseek-dados---cnhnc', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='cnh'), 'CNH RS', 'panel:iseek-dados---cnhrs', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='cnh'), 'CNH RR', 'panel:iseek-dados---cnhrr', 'Info Easy', 'CPF');

  -- TELEFONE / EMAIL / CEP
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='telefone'), 'Telefone - Info Easy', 'panel:iseek-dados---telefone', 'Info Easy', 'Telefone'),
  ((SELECT id FROM public.api_categories WHERE slug='telefone'), 'Telefone v1 (TConect)', 'tconect:/api/consulta/telefone/v1?telefone={valor}', 'TConect', 'Telefone'),
  ((SELECT id FROM public.api_categories WHERE slug='email'), 'E-mail - Info Easy', 'panel:iseek-dados---email', 'Info Easy', 'E-mail'),
  ((SELECT id FROM public.api_categories WHERE slug='cep'), 'CEP - Info Easy', 'panel:iseek-dados---cep', 'Info Easy', 'CEP'),
  ((SELECT id FROM public.api_categories WHERE slug='cep'), 'CEP v1 (TConect)', 'tconect:/api/consulta/cep/v1?cep={valor}', 'TConect', 'CEP');

  -- CNPJ
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='cnpj'), 'CNPJ - Info Easy', 'panel:iseek-dados---cnpj', 'Info Easy', 'CNPJ'),
  ((SELECT id FROM public.api_categories WHERE slug='cnpj'), 'CNPJ v1 (TConect)', 'tconect:/api/consulta/cnpj/v1?cnpj={valor}', 'TConect', 'CNPJ'),
  ((SELECT id FROM public.api_categories WHERE slug='cnpj'), 'CNPJ FGTS (TConect)', 'tconect:/api/consulta/cnpjFGTS/v2?cnpj={valor}', 'TConect', 'CNPJ');

  -- FINANCEIRO
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='score'), 'Score - Info Easy', 'panel:iseek-dados---score', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='score'), 'Score 2 - Info Easy', 'panel:iseek-dados---score2', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='score'), 'Score v1 (TConect)', 'tconect:/api/consulta/score/v1?cpf={valor}', 'TConect', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='inss'), 'INSS v1 (TConect)', 'tconect:/api/consulta/inss/v1?cpf={valor}', 'TConect', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='beneficios'), 'Benefícios - Info Easy', 'panel:iseek-dados---beneficios', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='pix'), 'PIX - Info Easy', 'panel:iseek-dados---pix', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='renda'), 'Renda Estimada', 'panel:renda', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='poder-aquisitivo'), 'Poder Aquisitivo', 'panel:poderaquisitivo', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='cheques'), 'Cheques - Info Easy', 'panel:iseek-dados---cheque', 'Info Easy', 'CPF');

  -- FOTOS
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='foto-nacional'), 'Foto Nacional NC', 'panel:iseek-fotos---fotonc', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-nacional'), 'Foto Detran', 'panel:iseek-dados---fotodetran', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-nacional'), 'Foto CNH', 'panel:iseek-fotos---fotocnh', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-nacional'), 'Fotope v1 (TConect)', 'tconect:/api/consulta/fotope/v1?nome={valor}', 'TConect', 'Nome'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto MG', 'panel:iseek-fotos---fotomg', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto SP', 'panel:iseek-fotos---fotosp', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto MA', 'panel:iseek-fotos---fotoma', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto MS', 'panel:iseek-fotos---fotoms', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto TO', 'panel:iseek-fotos---fototo', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto RO', 'panel:iseek-fotos---fotoro', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto PI', 'panel:iseek-fotos---fotopi', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto ES', 'panel:iseek-fotos---fotoes', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto DF', 'panel:iseek-fotos---fotodf', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto CE', 'panel:iseek-fotos---fotoce', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto RJ', 'panel:iseek-fotos---fotorj', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto PR', 'panel:iseek-fotos---fotopr', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto RN', 'panel:iseek-fotos---fotorn', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto PE', 'panel:iseek-fotos---fotope', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto PB', 'panel:iseek-fotos---fotopb', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto GO', 'panel:iseek-fotos---fotogo', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Foto AL', 'panel:iseek-fotos---fotoal', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='foto-estados'), 'Presos MA', 'panel:iseek-fotos---fotomapresos', 'Info Easy', 'CPF');

  -- NOVOS / OUTROS
  INSERT INTO public.apis (category_id, name, endpoint, group_name, requirement) VALUES
  ((SELECT id FROM public.api_categories WHERE slug='processos'), 'Processos (CPF) - Info Easy', 'panel:iseek-dados---processos', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='processos'), 'Processo (Número) - Info Easy', 'panel:iseek-dados---processo', 'Info Easy', 'Processo'),
  ((SELECT id FROM public.api_categories WHERE slug='nascimento'), 'Nascimento - Info Easy', 'panel:iseek-dados---nasc', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='iptu'), 'IPTU - Info Easy', 'panel:iseek-dados---iptu', 'Info Easy', 'Inscrição'),
  ((SELECT id FROM public.api_categories WHERE slug='funcional'), 'Funcional - Info Easy', 'panel:iseek-dados---func', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='oab'), 'Advogado (OAB) - Info Easy', 'panel:iseek-dados---advogadooab', 'Info Easy', 'OAB'),
  ((SELECT id FROM public.api_categories WHERE slug='oab'), 'Advogado (UF) - Info Easy', 'panel:iseek-dados---advogadooabuf', 'Info Easy', 'OAB/UF'),
  ((SELECT id FROM public.api_categories WHERE slug='oab'), 'Advogado (CPF) - Info Easy', 'panel:iseek-dados---advogadocpf', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='oab'), 'OAB Geral - Info Easy', 'panel:iseek-dados---oab', 'Info Easy', 'OAB'),
  ((SELECT id FROM public.api_categories WHERE slug='frota'), 'Veículos (CPF) - Info Easy', 'panel:iseek-dados---veiculos', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='mandado'), 'Mandado - Info Easy', 'panel:iseek-dados---mandado', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='rais'), 'RAIS - Info Easy', 'panel:iseek-dados---rais', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='certidoes'), 'Certidões - Info Easy', 'panel:iseek-dados---certidoes', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='matricula'), 'Matrícula - Info Easy', 'panel:iseek-dados---matricula', 'Info Easy', 'Matrícula'),
  ((SELECT id FROM public.api_categories WHERE slug='vacinas'), 'Vacinas - Info Easy', 'panel:iseek-dados---vacinas', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='dividas'), 'Dívidas - Info Easy', 'panel:iseek-dados---dividas', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='faculdades'), 'Faculdades - Info Easy', 'panel:iseek-dados---faculdades', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='bens'), 'Bens - Info Easy', 'panel:iseek-dados---bens', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='irpf'), 'IRPF - Info Easy', 'panel:iseek-dados---irpf', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='obito'), 'Óbito - Info Easy', 'panel:iseek-dados---obito', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='assessoria'), 'Assessoria - Info Easy', 'panel:iseek-dados---assessoria', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='registros'), 'Registro - Info Easy', 'panel:iseek-dados---registro', 'Info Easy', 'CPF'),
  ((SELECT id FROM public.api_categories WHERE slug='crlv'), 'CRLV TO - Info Easy', 'panel:iseek-dados---crlvto', 'Info Easy', 'Placa'),
  ((SELECT id FROM public.api_categories WHERE slug='crlv'), 'CRLV MT - Info Easy', 'panel:iseek-dados---crlvmt', 'Info Easy', 'Placa');

END $$;
