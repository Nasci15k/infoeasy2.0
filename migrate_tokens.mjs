import postgres from 'postgres';
const sql = postgres('postgresql://postgres:Nasci15k777@db.qvzoeguwilqurujbnvem.supabase.co:5432/postgres', {ssl: 'require'});

async function run() {
  console.log('Modifying api_tokens table...');
  
  // Make user_id optional
  await sql`ALTER TABLE public.api_tokens ALTER COLUMN user_id DROP NOT NULL;`;
  
  // Add new columns
  await sql`ALTER TABLE public.api_tokens ADD COLUMN IF NOT EXISTS client_name TEXT;`;
  await sql`ALTER TABLE public.api_tokens ADD COLUMN IF NOT EXISTS contact_info TEXT;`;
  await sql`ALTER TABLE public.api_tokens ADD COLUMN IF NOT EXISTS allowed_apis JSONB DEFAULT '[]'::jsonb;`;
  
  // Refresh schema
  await sql`NOTIFY pgrst, 'reload schema';`;
  
  console.log('Migration complete!');
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
