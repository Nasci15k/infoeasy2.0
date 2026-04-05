-- Adicionar campo slug para URLs amigáveis
ALTER TABLE api_categories ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Atualizar slugs baseados nos nomes existentes
UPDATE api_categories SET slug = 'cpf' WHERE name = 'CPF';
UPDATE api_categories SET slug = 'cnpj' WHERE name = 'CNPJ';
UPDATE api_categories SET slug = 'placa' WHERE name = 'PLACA';
UPDATE api_categories SET slug = 'telefone' WHERE name = 'TELEFONE';
UPDATE api_categories SET slug = 'email' WHERE name = 'EMAIL';
UPDATE api_categories SET slug = 'cep' WHERE name = 'CEP';
UPDATE api_categories SET slug = 'nome' WHERE name = 'NOME';
UPDATE api_categories SET slug = 'foto' WHERE name = 'FOTO';
UPDATE api_categories SET slug = 'ip' WHERE name = 'IP';
UPDATE api_categories SET slug = 'mac' WHERE name = 'MAC';

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_api_categories_slug ON api_categories(slug);