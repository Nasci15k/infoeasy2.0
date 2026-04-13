import postgres from 'postgres';

const sql = postgres('postgresql://postgres:Nasci15k777@db.qvzoeguwilqurujbnvem.supabase.co:5432/postgres', {ssl: 'require'});

async function check() {
  const result = await sql`SELECT relrowsecurity FROM pg_class WHERE relname = 'api_tokens'`;
  console.log('RLS API_TOKENS:', result);
  
  // Disable RLS just in case it is messing with reading/writing
  await sql`ALTER TABLE public.api_tokens DISABLE ROW LEVEL SECURITY`;
  await sql`ALTER TABLE public.api_logs DISABLE ROW LEVEL SECURITY`;
  
  // also, let's verify if there is any data inside api_tokens just to be sure
  const data = await sql`SELECT * FROM public.api_tokens`;
  console.log('Data inside api_tokens:', data);
  
  process.exit(0);
}

check().catch(console.error);
