import postgres from 'postgres';
import fs from 'fs';

const sqlText = fs.readFileSync('supabase/migrations/20260413000001_specific_modules.sql', 'utf8');

const sql = postgres('postgresql://postgres:Nasci15k777@db.qvzoeguwilqurujbnvem.supabase.co:5432/postgres', {
  ssl: 'require' // SSL required for Supabase outside local
});

async function run() {
  try {
    console.log("Running migration...");
    // Split into statements if postgres driver crashes on huge scripts with DO blocks, 
    // but Postgres.js can execute raw multiline strings perfectly in unsafe.
    await sql.unsafe(sqlText);
    console.log("Migration executed successfully!");
  } catch(e) {
    console.error("Migration failed:", e);
  } finally {
    process.exit(0);
  }
}

run();
