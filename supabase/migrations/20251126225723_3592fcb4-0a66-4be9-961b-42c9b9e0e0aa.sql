-- Inserir categorias principais
INSERT INTO api_categories (name, description, icon) VALUES
('Consultas Pessoais', 'Consultas de CPF, nome, email com dados cadastrais completos', '👤'),
('Crédito e Restrições', 'Consultas SPC, Serasa e análise de crédito', '💳'),
('Veículos', 'Consultas de placas, chassi e dados veiculares', '🚗'),
('Telecomunicações', 'Consultas de telefone por operadora', '📱'),
('Documentos e Saúde', 'Consultas Cadsus, Datasus e documentos', '🏥'),
('Empresas', 'Consultas CNPJ e dados empresariais', '🏢'),
('Endereços', 'Consultas de CEP e localização', '📍'),
('Tecnologia', 'Consultas de IP, MAC e dados técnicos', '💻'),
('Fotos', 'Consultas de fotos por CPF ou nome', '📸')
ON CONFLICT DO NOTHING;

-- Inserir APIs de Consultas Pessoais
INSERT INTO apis (name, description, endpoint, category_id, is_active) 
SELECT 
  'Serasa - Consulta CPF',
  'Consulta completa de CPF na base Serasa com dados cadastrais, score e restrições.',
  'https://apis-brasil.shop/apis/apiserasacpf2025.php?cpf={valor}',
  id,
  true
FROM api_categories WHERE name = 'Consultas Pessoais';

INSERT INTO apis (name, description, endpoint, category_id, is_active) 
SELECT 
  'Serasa - Consulta Nome',
  'Consulta por nome completo na base Serasa, retornando CPFs relacionados.',
  'https://apis-brasil.shop/apis/apiserasanome2025.php?nome={valor}',
  id,
  true
FROM api_categories WHERE name = 'Consultas Pessoais';

INSERT INTO apis (name, description, endpoint, category_id, is_active) 
SELECT 
  'Serasa - Consulta Email',
  'Consulta por email na base Serasa, retornando dados relacionados.',
  'https://apis-brasil.shop/apis/apiserasaemail2025.php?email={valor}',
  id,
  true
FROM api_categories WHERE name = 'Consultas Pessoais';

INSERT INTO apis (name, description, endpoint, category_id, is_active) 
SELECT 
  'Assec - Consulta CPF',
  'Consulta de CPF na base Assec com informações cadastrais e comerciais.',
  'https://apis-brasil.shop/apis/apiassecc2025.php?cpf={valor}',
  id,
  true
FROM api_categories WHERE name = 'Consultas Pessoais';

INSERT INTO apis (name, description, endpoint, category_id, is_active) 
SELECT 
  'BigData - Consulta CPF',
  'Consulta de CPF na base BigData com perfil de consumo e interesses.',
  'https://apis-brasil.shop/apis/apicpfbigdata2025.php?CPF={valor}',
  id,
  true
FROM api_categories WHERE name = 'Consultas Pessoais';

INSERT INTO apis (name, description, endpoint, category_id, is_active) 
SELECT 
  'CPF Full - Consulta Completa',
  'Consulta completa de CPF com todos os dados disponíveis.',
  'https://apis-brasil.shop/apis/apifullcpf.php?cpf={valor}',
  id,
  true
FROM api_categories WHERE name = 'Consultas Pessoais';

INSERT INTO apis (name, description, endpoint, category_id, is_active) 
SELECT 
  'Algar 45M - Consulta CPF',
  'Consulta de CPF na base Algar com 45 milhões de registros.',
  'https://apis-brasil.shop/apis/apicpf43malgar.php?cpf={valor}',
  id,
  true
FROM api_categories WHERE name = 'Consultas Pessoais';

INSERT INTO apis (name, description, endpoint, category_id, is_active) 
SELECT 
  'RAIS 35M - Consulta CPF',
  'Consulta de CPF na base RAIS com dados trabalhistas e histórico profissional.',
  'https://apis-brasil.shop/apis/apicpf35rais2019.php?cpf={valor}',
  id,
  true
FROM api_categories WHERE name = 'Consultas Pessoais';

-- Inserir APIs de Crédito (SPC)
INSERT INTO apis (name, description, endpoint, category_id, is_active)
SELECT 
  'SPC - Consulta CPF',
  'Consulta de CPF na base SPC para verificação de restrições comerciais.',
  'https://apis-brasil.shop/apis/apicpfspc.php?doc={valor}',
  id,
  true
FROM api_categories WHERE name = 'Crédito e Restrições';

INSERT INTO apis (name, description, endpoint, category_id, is_active)
SELECT 
  v.name,
  v.description,
  v.endpoint,
  ac.id,
  true
FROM api_categories ac, (VALUES
  ('SPC - Consulta CPF 1', 'Consulta SPC versão 1', 'https://apis-brasil.shop/apis/apicpf1spc.php?doc={valor}'),
  ('SPC - Consulta CPF 2', 'Consulta SPC versão 2', 'https://apis-brasil.shop/apis/apicpf2spc.php?doc={valor}'),
  ('SPC - Consulta CPF 3', 'Consulta SPC versão 3', 'https://apis-brasil.shop/apis/apicpf3spc.php?doc={valor}'),
  ('SPC - Consulta CPF 4', 'Consulta SPC versão 4', 'https://apis-brasil.shop/apis/apicpf4spc.php?cpf={valor}'),
  ('SPC - Consulta CPF/CNPJ 5', 'Consulta SPC versão 5', 'https://apis-brasil.shop/apis/apicpf5spc.php?cpf={valor}'),
  ('SPC - Consulta CPF 6', 'Consulta SPC versão 6', 'https://apis-brasil.shop/apis/apicpf6spc.php?cpf={valor}'),
  ('SPC - Consulta CPF/CNPJ 7', 'Consulta SPC versão 7', 'https://apis-brasil.shop/apis/apicpf7spc.php?cpf={valor}'),
  ('SPC - Consulta CPF/CNPJ 8', 'Consulta SPC versão 8', 'https://apis-brasil.shop/apis/apicpf8spc.php?cpf={valor}'),
  ('SPC - Consulta CPF 9', 'Consulta SPC versão 9', 'https://apis-brasil.shop/apis/apicpf9spc.php?cpf={valor}'),
  ('SPC - Consulta CPF 10', 'Consulta SPC versão 10', 'https://apis-brasil.shop/apis/apicpf10spc.php?cpf={valor}'),
  ('Credilink - Consulta CPF', 'Consulta de CPF na base Credilink', 'https://apis-brasil.shop/apis/apicpfcredilink2025.php?cpf={valor}')
) AS v(name, description, endpoint)
WHERE ac.name = 'Crédito e Restrições';

-- Inserir APIs de Veículos
INSERT INTO apis (name, description, endpoint, category_id, is_active)
SELECT 
  v.name,
  v.description,
  v.endpoint,
  ac.id,
  true
FROM api_categories ac, (VALUES
  ('BV Detran - Consulta Placa', 'Consulta de placa na base do Detran', 'https://apis-brasil.shop/apis/apiplacabvdetran.php?placa={valor}'),
  ('BV Detran - Consulta CPF', 'Consulta veículos vinculados ao CPF', 'https://apis-brasil.shop/apis/apicpfbvdetran.php?cpf={valor}'),
  ('Placa Serpro', 'Consulta de placa via Serpro', 'https://apiradar.onrender.com/api/placa?query={valor}&token=KeyBesh'),
  ('Chassi Serpro', 'Consulta de chassi via Serpro', 'https://apiradar.onrender.com/api/placa?query={valor}&token=KeyBesh')
) AS v(name, description, endpoint)
WHERE ac.name = 'Veículos';

-- Inserir APIs de Telecomunicações
INSERT INTO apis (name, description, endpoint, category_id, is_active)
SELECT 
  v.name,
  v.description,
  v.endpoint,
  ac.id,
  true
FROM api_categories ac, (VALUES
  ('Consulta Telefone Oi', 'Consulta telefone da operadora Oi', 'https://apis-brasil.shop/apis/consulta_telefone_oi.php?telefone={valor}'),
  ('Consulta Telefone Vivo', 'Consulta telefone da operadora Vivo', 'https://apis-brasil.shop/apis/api_consulta_telefone_vivo28x_.php?telefone={valor}'),
  ('Consulta Telefone Tim', 'Consulta telefone da operadora Tim', 'https://apis-brasil.shop/apis/api_telefone_tim_operadora.php?telefone={valor}'),
  ('Consulta Telefone Claro', 'Consulta telefone da operadora Claro', 'https://apis-brasil.shop/apis/api_consulta_telefone_claro.php?telefone={valor}'),
  ('Credilink - Consulta Telefone', 'Consulta telefone na base Credilink', 'https://apis-brasil.shop/apis/apitelcredilink2025.php?telefone={valor}'),
  ('Algar 45M - Consulta Telefone', 'Consulta telefone na base Algar', 'https://apis-brasil.shop/apis/apitel43malgar.php?ddd={ddd}&telefone={valor}')
) AS v(name, description, endpoint)
WHERE ac.name = 'Telecomunicações';

-- Inserir APIs de Documentos e Saúde
INSERT INTO apis (name, description, endpoint, category_id, is_active)
SELECT 
  v.name,
  v.description,
  v.endpoint,
  ac.id,
  true
FROM api_categories ac, (VALUES
  ('Datasus - Consulta CPF', 'Consulta de CPF na base Datasus com informações de saúde', 'https://apis-brasil.shop/apis/apicpfdatasus.php?cpf={valor}'),
  ('Cadsus - Consulta CPF', 'Consulta de CPF na base Cadsus com dados do SUS', 'https://apis-brasil.shop/apis/apicpfcadsus.php?cpf={valor}'),
  ('Cadsus - Consulta RG', 'Consulta por RG na base Cadsus', 'https://apis-brasil.shop/apis/apirgcadsus.php?rg={valor}'),
  ('Cadsus - Consulta Telefone 1', 'Consulta telefone versão 1', 'https://apis-brasil.shop/apis/apitel1cadsus.php?telefone={valor}'),
  ('Cadsus - Consulta Telefone 2', 'Consulta telefone versão 2', 'https://apis-brasil.shop/apis/apitel2cadsus.php?telefone2={valor}'),
  ('Cadsus - Consulta Telefone 3', 'Consulta telefone versão 3', 'https://apis-brasil.shop/apis/apitel3cadsus.php?telefone3={valor}')
) AS v(name, description, endpoint)
WHERE ac.name = 'Documentos e Saúde';

-- Inserir APIs de Empresas
INSERT INTO apis (name, description, endpoint, category_id, is_active)
SELECT 
  'RAIS 35M - Consulta CNPJ',
  'Consulta de CNPJ na base RAIS com dados da empresa',
  'https://apis-brasil.shop/apis/apicnpj35rais2019.php?cnpj={valor}',
  id,
  true
FROM api_categories WHERE name = 'Empresas';

-- Inserir APIs de Endereços
INSERT INTO apis (name, description, endpoint, category_id, is_active)
SELECT 
  'Algar 45M - Consulta CEP',
  'Consulta de CEP na base Algar com endereço completo',
  'https://apis-brasil.shop/apis/apicep43malgar.php?cep={valor}',
  id,
  true
FROM api_categories WHERE name = 'Endereços';

-- Inserir APIs de Tecnologia
INSERT INTO apis (name, description, endpoint, category_id, is_active)
SELECT 
  v.name,
  v.description,
  v.endpoint,
  ac.id,
  true
FROM api_categories ac, (VALUES
  ('IP API', 'Consulta informações de endereço IP', 'http://ip-api.com/json/{valor}'),
  ('MAC API', 'Consulta fabricante por MAC address', 'https://api.macvendors.com/{valor}')
) AS v(name, description, endpoint)
WHERE ac.name = 'Tecnologia';

-- Inserir APIs de Fotos
INSERT INTO apis (name, description, endpoint, category_id, is_active)
SELECT 
  v.name,
  v.description,
  v.endpoint,
  ac.id,
  true
FROM api_categories ac, (VALUES
  ('MA - Consulta Foto por CPF', 'Consulta foto 3x4 por CPF', 'https://apis-brasil.shop/apis/apicpffotoma.php?cpf={valor}'),
  ('MA - Consulta Foto por Nome', 'Consulta foto 3x4 por nome completo', 'https://apis-brasil.shop/apis/apinomefotoma.php?nome={valor}'),
  ('Foto Nacional - Consulta CPF', 'Consulta foto por CPF na base nacional', 'https://apis-brasil.shop/apis/apifotonacional.php?cpf={valor}'),
  ('Foto Nacional 2 - Consulta CPF', 'Consulta foto por CPF - versão 2', 'https://apis-brasil.shop/apis/apifotonacional2.php?cpf={valor}')
) AS v(name, description, endpoint)
WHERE ac.name = 'Fotos';