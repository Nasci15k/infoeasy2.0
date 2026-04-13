import postgres from 'postgres';
const sql = postgres('postgresql://postgres:Nasci15k777@db.qvzoeguwilqurujbnvem.supabase.co:5432/postgres', {ssl: 'require'});

async function reload() {
  await sql`NOTIFY pgrst, 'reload schema';`;
  console.log('Schema reloaded!');
  process.exit(0);
}

reload().catch(console.error);
