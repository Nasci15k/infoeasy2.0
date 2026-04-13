import postgres from 'postgres';
const sql = postgres('postgresql://postgres:Nasci15k777@db.qvzoeguwilqurujbnvem.supabase.co:5432/postgres', {ssl: 'require'});

async function grantAll() {
  await sql`GRANT ALL ON TABLE public.api_tokens TO anon, authenticated, service_role;`;
  await sql`GRANT ALL ON TABLE public.api_logs TO anon, authenticated, service_role;`;
  console.log('Granted');
  process.exit(0);
}

grantAll().catch(console.error);
