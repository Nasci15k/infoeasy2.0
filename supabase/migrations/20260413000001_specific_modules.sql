ALTER TABLE public.apis ADD COLUMN IF NOT EXISTS requirement VARCHAR(255);

DELETE FROM public.apis;
DELETE FROM public.api_categories;

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
BEGIN

  INSERT INTO public.api_categories (id, name, description, slug, icon) VALUES
  (v_cpf, 'Buscas por CPF', 'Dossiê, Benefícios e Dados do SUS e Nacionais', 'cpf', '👤'),
  (v_nome, 'Busca por Nome e Filiação', 'Ache Pais, Mães e Parentes a partir de Nomes', 'nome', '👥'),
  (v_fin, 'Financeiro e Score', 'Dívidas, Protestos, PIX e Scores Avançados', 'financeiro', '💰'),
  (v_vei, 'Veículos e CNH', 'Placas, Chassi, Motor, Infrações e Dados CNH', 'veiculo', '🚗'),
  (v_con, 'Localização e Contato', 'Endereços, Vínculos Telefônicos e Emails', 'contato', '📞'),
  (v_doc, 'Documentos Pessoais', 'Dados Funcionais, Óbito, Registro, Faculdades', 'documento', '🪪'),
  (v_jud, 'Judicial e Processos', 'OAB, Sintegra, Mandados e Histórico Criminal', 'judicial', '⚖️'),
  (v_emp, 'Empresas e Sócios', 'CNPJ Receita e Participação em Sociedades', 'empresa', '🏢'),
  (v_fot, 'Reconhecimento Facial', 'Fotos Base Estaduais e Estaduais Integradas', 'fotos', '📸');

  -- [CPF]
  INSERT INTO public.apis (category_id, name, endpoint, requirement) VALUES
  (v_cpf, 'Básico Receita (CPF)', 'panel:iseek-cpfbasico', 'CPF'),
  (v_cpf, 'Dossiê Info Fácil', 'panel:iseek-cpf', 'CPF'),
  (v_cpf, 'Cadastro Nacional', 'panel:iseek-dados---catcpf', 'CPF'),
  (v_cpf, 'Busca NIS', 'panel:iseek-dados---nis', 'NIS'),
  (v_cpf, 'Nascimento Cartorial', 'panel:iseek-dados---nasc', 'CPF'),
  (v_cpf, 'Benefícios INSS/Sociais', 'panel:iseek-dados---beneficios', 'CPF');

  -- [NOME]
  INSERT INTO public.apis (category_id, name, endpoint, requirement) VALUES
  (v_nome, 'Relacionamento Maternal', 'panel:iseek-dados---mae', 'NOME_MAE'),
  (v_nome, 'Relacionamento Paternal', 'panel:iseek-dados---pai', 'NOME_PAI'),
  (v_nome, 'Abreviado Nacional (Nome)', 'panel:iseek-dados---nomeabreviadofiltros', 'NOME'),
  (v_nome, 'Árvore de Parentes', 'panel:iseek-dados---parentes', 'CPF');

  -- [FINANCEIRO]
  INSERT INTO public.apis (category_id, name, endpoint, requirement) VALUES
  (v_fin, 'Score Serasa Pro', 'panel:iseek-dados---score2', 'CPF'),
  (v_fin, 'Score Serasa Base', 'panel:iseek-dados---score', 'CPF'),
  (v_fin, 'Info de Pagamento PIX', 'panel:iseek-dados---pix', 'PIX'),
  (v_fin, 'Cheques Registrados', 'panel:iseek-dados---cheque', 'CHEQUE'),
  (v_fin, 'Bens/Veículos Ativos', 'panel:iseek-dados---bens', 'CPF'),
  (v_fin, 'Restituição IRPF', 'panel:iseek-dados---irpf', 'CPF'),
  (v_fin, 'Negativações/Dívidas', 'panel:iseek-dados---dividas', 'CPF');

  -- [VEICULOS & CNH]
  INSERT INTO public.apis (category_id, name, endpoint, requirement) VALUES
  (v_vei, 'Aviso de Placa / Status', 'panel:iseek-dados---placa', 'PLACA'),
  (v_vei, 'Busca por Chassi', 'panel:iseek-dados---chassi', 'CHASSI'),
  (v_vei, 'Busca por Motor', 'panel:iseek-dados---motor', 'MOTOR'),
  (v_vei, 'Histórico RENAVAM', 'panel:iseek-dados---renavam', 'RENAVAM'),
  (v_vei, 'CRLV Ativo (TO)', 'panel:iseek-dados---crlvto', 'PLACA'),
  (v_vei, 'CRLV Ativo (MT)', 'panel:iseek-dados---crlvmt', 'PLACA'),
  (v_vei, 'Localizador de Veículo (Nome/CPF)', 'panel:iseek-dados---veiculos', 'CPF'),
  (v_vei, 'Validação CNH Binacional', 'panel:iseek-dados---cnh', 'CPF'),
  (v_vei, 'CNH Estadual Amazonas (AM)', 'panel:iseek-dados---cnham', 'CPF'),
  (v_vei, 'CNH Estadual RS', 'panel:iseek-dados---cnhrs', 'CPF'),
  (v_vei, 'CNH Estadual RR', 'panel:iseek-dados---cnhrr', 'CPF'),
  (v_vei, 'CNH Estadual NC', 'panel:iseek-dados---cnhnc', 'CPF');

  -- [CONTATO E LOC]
  INSERT INTO public.apis (category_id, name, endpoint, requirement) VALUES
  (v_con, 'Pesquisa por Endereço (CEP)', 'panel:iseek-dados---cep', 'CEP'),
  (v_con, 'Pesquisa por E-mail', 'panel:iseek-dados---email', 'EMAIL'),
  (v_con, 'Identidade do Titular do Tel', 'panel:iseek-dados---telefone', 'TELEFONE'),
  (v_con, 'Páginas CAT (Info Número)', 'panel:iseek-dados---catnumero', 'NUMERO_CAT');

  -- [DOCUMENTOS PESSOAIS]
  INSERT INTO public.apis (category_id, name, endpoint, requirement) VALUES
  (v_doc, 'Consulta RG Digital', 'panel:iseek-dados---rg', 'RG'),
  (v_doc, 'Título de Eleitor', 'panel:iseek-dados---titulo', 'TITULO'),
  (v_doc, 'Funcional (Registros)', 'panel:iseek-dados---func', 'CPF'),
  (v_doc, 'Histórico do SUS Vacinas', 'panel:iseek-dados---vacinas', 'CPF'),
  (v_doc, 'Matrícula Faculdades', 'panel:iseek-dados---faculdades', 'CPF'),
  (v_doc, 'Certidão de Óbito', 'panel:iseek-dados---obito', 'CPF'),
  (v_doc, 'Vinculo Assessoria / Cons', 'panel:iseek-dados---assessoria', 'CPF'),
  (v_doc, 'Profissão Ativa CBO', 'panel:iseek-dados---registro', 'CPF');

  -- [JUDICIAL E OAB]
  INSERT INTO public.apis (category_id, name, endpoint, requirement) VALUES
  (v_jud, 'Buscador de Processo unificado', 'panel:iseek-dados---processos', 'CPF'),
  (v_jud, 'Informação de Capa (Proc.)', 'panel:iseek-dados---processo', 'NUMERO_PROCESSO'),
  (v_jud, 'Certidão OAB Geral', 'panel:iseek-dados---advogadooab', 'OAB'),
  (v_jud, 'Certidão OAB Federativa', 'panel:iseek-dados---advogadooabuf', 'OAB'),
  (v_jud, 'Status Advogado OAB', 'panel:iseek-dados---oab', 'OAB'),
  (v_jud, 'Descoberta de Advogado por CPF', 'panel:iseek-dados---advogadocpf', 'CPF'),
  (v_jud, 'Sistema Mandados de Prisão', 'panel:iseek-dados---mandado', 'CPF'),
  (v_jud, 'Certidões Cíveis / Criminais', 'panel:iseek-dados---certidoes', 'CPF'),
  (v_jud, 'Busca Matrícula / IPTU Imóvel', 'panel:iseek-dados---matricula', 'MATRICULA'),
  (v_jud, 'Sistema Tributário IPTU', 'panel:iseek-dados---iptu', 'INSCRICAO_IPTU');

  -- [EMPRESAS E SÓCIOS]
  INSERT INTO public.apis (category_id, name, endpoint, requirement) VALUES
  (v_emp, 'CNPJ Receita', 'panel:iseek-dados---cnpj', 'CNPJ'),
  (v_emp, 'Participação Especial RAIS', 'panel:iseek-dados---rais', 'CPF');

  -- [FOTOS ESTADUAIS]
  INSERT INTO public.apis (category_id, name, endpoint, requirement) VALUES
  (v_fot, 'Acesso CNH Espelho', 'panel:iseek-fotos---fotocnh', 'CPF'),
  (v_fot, 'Binacional DETRAN Faces', 'panel:iseek-dados---fotodetran', 'CPF'),
  (v_fot, 'Identidade MG', 'panel:iseek-fotos---fotomg', 'CPF'),
  (v_fot, 'Identidade SP', 'panel:iseek-fotos---fotosp', 'CPF'),
  (v_fot, 'Identidade MA', 'panel:iseek-fotos---fotoma', 'CPF'),
  (v_fot, 'Identidade MS', 'panel:iseek-fotos---fotoms', 'CPF'),
  (v_fot, 'Identidade TO', 'panel:iseek-fotos---fototo', 'CPF'),
  (v_fot, 'Identidade RO', 'panel:iseek-fotos---fotoro', 'CPF'),
  (v_fot, 'Identidade PI', 'panel:iseek-fotos---fotopi', 'CPF'),
  (v_fot, 'Identidade ES', 'panel:iseek-fotos---fotoes', 'CPF'),
  (v_fot, 'Identidade DF', 'panel:iseek-fotos---fotodf', 'CPF'),
  (v_fot, 'Identidade CE', 'panel:iseek-fotos---fotoce', 'CPF'),
  (v_fot, 'Identidade RJ', 'panel:iseek-fotos---fotorj', 'CPF'),
  (v_fot, 'Identidade PR', 'panel:iseek-fotos---fotopr', 'CPF'),
  (v_fot, 'Identidade NC', 'panel:iseek-fotos---fotonc', 'CPF'),
  (v_fot, 'Identidade RN', 'panel:iseek-fotos---fotorn', 'CPF'),
  (v_fot, 'Identidade PE', 'panel:iseek-fotos---fotope', 'CPF'),
  (v_fot, 'Identidade PB', 'panel:iseek-fotos---fotopb', 'CPF'),
  (v_fot, 'Identidade GO', 'panel:iseek-fotos---fotogo', 'CPF'),
  (v_fot, 'Identidade AL', 'panel:iseek-fotos---fotoal', 'CPF'),
  (v_fot, 'Registro Pris. Faces MA', 'panel:iseek-fotos---fotomapresos', 'CPF');

END $$;
