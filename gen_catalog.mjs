import postgres from 'postgres';
const sql = postgres('postgresql://postgres:Nasci15k777@db.qvzoeguwilqurujbnvem.supabase.co:5432/postgres', {ssl: 'require'});

async function run() {
  const apis = await sql`SELECT name, slug FROM public.apis WHERE slug IS NOT NULL ORDER BY name`;
  
  console.log("# Catálogo de APIs - InfoEasy\n");
  console.log("Use o campo **slug** no parâmetro `modulo` da sua requisição.\n");
  console.log("| Nome da API | Slug (modulo) |");
  console.log("| :--- | :--- |");
  
  apis.forEach(api => {
    console.log(`| ${api.name} | \`${api.slug}\` |`);
  });
  
  process.exit(0);
}

run().catch(console.error);
