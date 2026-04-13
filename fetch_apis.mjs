import postgres from 'postgres';
const sql = postgres('postgresql://postgres:Nasci15k777@db.qvzoeguwilqurujbnvem.supabase.co:5432/postgres', {ssl: 'require'});

async function run() {
  const apis = await sql`SELECT id, name, endpoint FROM public.apis`;
  console.log(JSON.stringify(apis, null, 2));
  process.exit(0);
}

run().catch(console.error);
