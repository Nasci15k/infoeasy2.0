const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres.qvzoeguwilqurujbnvem:Nasci15k777@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';

const ddl = `
CREATE TABLE IF NOT EXISTS public.api_categories (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    icon text,
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
`;

async function run() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false }});
  try {
    await client.connect();
    console.log('Conectado ao Database Supabase remoto com sucesso!');
    
    // Garantir que as tabelas existem
    await client.query(ddl);
    
    // Ler o arquivo de dados
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20260405153500_update_all_apis.sql');
    const sqlData = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Populando APIs...');
    await client.query(sqlData);
    
    console.log('TUDO PRONTO! Banco de Dados popualdo.');
  } catch (err) {
    console.error('Erro na injeção:', err);
  } finally {
    await client.end();
  }
}

run();
