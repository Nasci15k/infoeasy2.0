CREATE TABLE IF NOT EXISTS public.api_categories (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    icon text,
    slug text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.apis (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid REFERENCES public.api_categories(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    endpoint text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.query_history (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    api_id uuid REFERENCES public.apis(id),
    query_value text NOT NULL,
    response_data jsonb,
    created_at timestamp with time zone DEFAULT now()
);

TRUNCATE TABLE public.query_history CASCADE;
TRUNCATE TABLE public.apis CASCADE;
TRUNCATE TABLE public.api_categories CASCADE;

INSERT INTO public.api_categories (id, name, description, icon, slug) VALUES
('a0000000-0000-0000-0000-000000000001', 'VEÍCULOS', 'Consultas de Placa, Chassi, Motor e Renavam', '🚗', 'veiculos'),
('a0000000-0000-0000-0000-000000000002', 'PESSOAS', 'Consultas por CPF, RG, Nome, Parentes, Score', '👤', 'pessoas'),
('a0000000-0000-0000-0000-000000000003', 'EMPRESAS', 'Consultas por CNPJ', '🏢', 'empresas'),
('a0000000-0000-0000-0000-000000000004', 'CONTATO E ENDEREÇO', 'Consultas de Telefone, Email e CEP', '📞', 'contato'),
('a0000000-0000-0000-0000-000000000005', 'PROCESSOS E CRIMINAIS', 'Consultas de Processos Judiciais e Antecedentes', '⚖️', 'criminal'),
('a0000000-0000-0000-0000-000000000006', 'FOTOS', 'Busca de Fotos de RG/CNH por Estado', '📸', 'fotos');

-- INSERÇÕES DE MÓDULOS - VEÍCULOS
INSERT INTO public.apis (category_id, name, description, endpoint) VALUES
('a0000000-0000-0000-0000-000000000001', 'Placa SESP', 'Consulta detalhada de Placa via SESP', 'panel:placa-sesp'),
('a0000000-0000-0000-0000-000000000001', 'Placa Simples', 'Consulta de Placa Básica', 'panel:placa-simples'),
('a0000000-0000-0000-0000-000000000001', 'Placa FIPE', 'Consulta de valores da Placa na FIPE', 'panel:placa-fipe'),
('a0000000-0000-0000-0000-000000000001', 'Chassi', 'Consulta de veículo pelo Chassi', 'panel:chassi'),
('a0000000-0000-0000-0000-000000000001', 'Motor', 'Consulta de veículo pelo número do Motor', 'panel:motor'),
('a0000000-0000-0000-0000-000000000001', 'Placa Nacional', 'Consulta nacional de Placa', 'panel:placa'),
('a0000000-0000-0000-0000-000000000001', 'Renavam', 'Consulta por Renavam do Veículo', 'panel:renavam');

-- INSERÇÕES DE MÓDULOS - PESSOAS
INSERT INTO public.apis (category_id, name, description, endpoint) VALUES
('a0000000-0000-0000-0000-000000000002', 'RG 3', 'Consulta RG modelo 3', 'panel:rg-3'),
('a0000000-0000-0000-0000-000000000002', 'Nome 3', 'Consulta Nome modelo 3', 'panel:nome-3'),
('a0000000-0000-0000-0000-000000000002', 'PIS 3', 'Consulta PIS modelo 3', 'panel:pis-3'),
('a0000000-0000-0000-0000-000000000002', 'Parentes 3', 'Grade de Parentes modelo 3', 'panel:parentes-3'),
('a0000000-0000-0000-0000-000000000002', 'Score 3', 'Score de Crédito modelo 3', 'panel:score-3'),
('a0000000-0000-0000-0000-000000000002', 'TSE 3', 'Consulta Eleitoral TSE 3', 'panel:tse-3'),
('a0000000-0000-0000-0000-000000000002', 'CPF SUS', 'Consulta CadSUS por CPF', 'panel:cpfsus'),
('a0000000-0000-0000-0000-000000000002', 'Mãe', 'Busca por nome da Mãe', 'panel:mae'),
('a0000000-0000-0000-0000-000000000002', 'Mãe Full', 'Busca completa pelo nome da Mãe', 'panel:maefull'),
('a0000000-0000-0000-0000-000000000002', 'Nome', 'Busca Simples por Nome', 'panel:nome'),
('a0000000-0000-0000-0000-000000000002', 'Nome Full', 'Busca Completa por Nome', 'panel:nomefull'),
('a0000000-0000-0000-0000-000000000002', 'Parentes', 'Grade de Vínculos Familiares', 'panel:parentes'),
('a0000000-0000-0000-0000-000000000002', 'PIS Geral', 'Consulta cadastro PIS Nacional', 'panel:pis'),
('a0000000-0000-0000-0000-000000000002', 'Poder Aquisitivo', 'Estimativa de poder aquisitivo', 'panel:poderaquisitivo'),
('a0000000-0000-0000-0000-000000000002', 'RG Geral', 'Consulta de Base Nacional por RG', 'panel:rg'),
('a0000000-0000-0000-0000-000000000002', 'Título de Eleitor', 'Situação Eleitoral Titulo', 'panel:titulo'),
('a0000000-0000-0000-0000-000000000002', 'Score de Crédito', 'Análise de Capacidade Financeira', 'panel:score'),
('a0000000-0000-0000-0000-000000000002', 'Renda Estimada', 'Estimativa de Renda Pessoal', 'panel:renda'),
('a0000000-0000-0000-0000-000000000002', 'CPF ISK', 'Analise ISK CPF', 'panel:cpf-isk'),
('a0000000-0000-0000-0000-000000000002', 'Conta PIX', 'Buscar contas PIX', 'panel:pix'),
('a0000000-0000-0000-0000-000000000002', 'CPF (BrasilPro)', 'Consulta de CPF (Novo Provider)', 'brasilpro:cpf'),
('a0000000-0000-0000-0000-000000000002', 'Nome (BrasilPro)', 'Busca de Nome (Novo Provider)', 'brasilpro:nome'),
('a0000000-0000-0000-0000-000000000002', 'Nome da Mãe (BrasilPro)', 'Busca Nome da Mãe (Novo Provider)', 'brasilpro:mae'),
('a0000000-0000-0000-0000-000000000002', 'Título (BrasilPro)', 'Busca por Titulo Eleitoral (Novo Provider)', 'brasilpro:titulo'),
('a0000000-0000-0000-0000-000000000002', 'Pai (BrasilPro)', 'Busca por Nome do Pai (Novo Provider)', 'brasilpro:pai'),
('a0000000-0000-0000-0000-000000000002', 'RG (BrasilPro)', 'Busca RG Estadual (Novo Provider)', 'brasilpro:rg'),
('a0000000-0000-0000-0000-000000000002', 'CPF Completo (Duality)', 'Consulta Avançada Duality por CPF', 'duality:cpf');

-- INSERÇÕES DE MÓDULOS - EMPRESAS
INSERT INTO public.apis (category_id, name, description, endpoint) VALUES
('a0000000-0000-0000-0000-000000000003', 'CNPJ Creditício', 'Análise corporativa de crédito CNPJ', 'panel:cnpj-cred');

-- INSERÇÕES DE MÓDULOS - CONTATO E ENDEREÇO
INSERT INTO public.apis (category_id, name, description, endpoint) VALUES
('a0000000-0000-0000-0000-000000000004', 'Email 3', 'Consulta de Email Modelo 3', 'panel:email-3'),
('a0000000-0000-0000-0000-000000000004', 'CEP 3', 'Consulta de CEP Modelo 3', 'panel:cep-3'),
('a0000000-0000-0000-0000-000000000004', 'Telefone 3', 'Consulta de Telefone Modelo 3', 'panel:telefone-3'),
('a0000000-0000-0000-0000-000000000004', 'CEP', 'Busca simples de logradouro via CEP', 'panel:cep'),
('a0000000-0000-0000-0000-000000000004', 'CEP Full', 'Busca avançada de endereço via CEP', 'panel:cepfull'),
('a0000000-0000-0000-0000-000000000004', 'Email', 'Localizador por e-mail', 'panel:email'),
('a0000000-0000-0000-0000-000000000004', 'Email Full', 'Localizador avançado por e-mail', 'panel:emailfull'),
('a0000000-0000-0000-0000-000000000004', 'Endereço', 'Busca de pessoas em endereço específico', 'panel:endereco'),
('a0000000-0000-0000-0000-000000000004', 'Telefone', 'Identificador Simples de Chamadas', 'panel:telefone'),
('a0000000-0000-0000-0000-000000000004', 'Telefone Full', 'Identificador Completo de Linha', 'panel:telefonefull');

-- INSERÇÕES DE MÓDULOS - PROCESSOS E CRIMINAIS
INSERT INTO public.apis (category_id, name, description, endpoint) VALUES
('a0000000-0000-0000-0000-000000000005', 'Credilink', 'Relatório Credilink', 'panel:credilink'),
('a0000000-0000-0000-0000-000000000005', 'SIEL Judiciário', 'Busca Judicial SIEL', 'panel:siel'),
('a0000000-0000-0000-0000-000000000005', 'Processos', 'Busca de processos e mandados de prisão', 'panel:processos'),
('a0000000-0000-0000-0000-000000000005', 'Processos Online', 'Monitoramento Processual em Tempo Real', 'panel:processos-online');

-- INSERÇÕES DE MÓDULOS - FOTOS
INSERT INTO public.apis (category_id, name, description, endpoint) VALUES
('a0000000-0000-0000-0000-000000000006', 'Foto MG', 'Foto CNH/RG de Minas Gerais', 'panel:fotomg'),
('a0000000-0000-0000-0000-000000000006', 'Foto SP', 'Foto CNH/RG de São Paulo', 'panel:fotosp'),
('a0000000-0000-0000-0000-000000000006', 'Foto MA', 'Foto CNH/RG de Maranhão', 'panel:fotoma'),
('a0000000-0000-0000-0000-000000000006', 'Foto MS', 'Foto CNH/RG de Mato Grosso do Sul', 'panel:fotoms'),
('a0000000-0000-0000-0000-000000000006', 'Foto TO', 'Foto CNH/RG de Tocantins', 'panel:fototo'),
('a0000000-0000-0000-0000-000000000006', 'Foto RO', 'Foto CNH/RG de Rondônia', 'panel:fotoro'),
('a0000000-0000-0000-0000-000000000006', 'Foto PI', 'Foto CNH/RG de Piauí', 'panel:fotopi'),
('a0000000-0000-0000-0000-000000000006', 'Foto ES', 'Foto CNH/RG de Espírito Santo', 'panel:fotoes'),
('a0000000-0000-0000-0000-000000000006', 'Foto DF', 'Foto CNH/RG do Distrito Federal', 'panel:fotodf'),
('a0000000-0000-0000-0000-000000000006', 'Foto CE', 'Foto CNH/RG do Cerará', 'panel:fotoce'),
('a0000000-0000-0000-0000-000000000006', 'Foto RJ', 'Foto CNH/RG do Rio de Janeiro', 'panel:fotorj'),
('a0000000-0000-0000-0000-000000000006', 'Foto PR', 'Foto CNH/RG do Paraná', 'panel:fotopr'),
('a0000000-0000-0000-0000-000000000006', 'Foto SC', 'Foto CNH/RG de Santa Catarina', 'panel:Foto-sc');

