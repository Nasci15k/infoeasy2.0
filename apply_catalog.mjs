import postgres from 'postgres';
import fs from 'fs';

const sqlPath = 'supabase/migrations/20260416000004_specific_modules.sql';
const sqlText = fs.readFileSync(sqlPath, 'utf8');

const connectionString = 'postgresql://postgres.qvzoeguwilqurujbnvem:Nasci15k777@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';

const sql = postgres(connectionString, {
  ssl: 'require',
  connect_timeout: 30
});

async function run() {
  try {
    console.log("Applying specific modules migration...");
    await sql.unsafe(sqlText);
    console.log("SUCCESS: Specific modules updated on Supabase!");
  } catch(e) {
    console.error("ERROR: Migration failed:", e.message);
  } finally {
    process.exit(0);
  }
}

run();
