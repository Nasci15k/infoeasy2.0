import postgres from 'postgres';
const sql = postgres('postgresql://postgres:Nasci15k777@db.qvzoeguwilqurujbnvem.supabase.co:5432/postgres', {ssl: 'require'});

async function run() {
  const apis = await sql`
    SELECT a.name, a.slug, c.name as category 
    FROM public.apis a
    LEFT JOIN public.api_categories c ON a.category_id = c.id
    WHERE a.slug IS NOT NULL 
    ORDER BY c.name, a.name
  `;
  
  let currentCategory = "";
  let message = "*🛰️ CATÁLOGO DE APIS - INFOEASY*\n\n";
  message += "Use o campo em (parênteses) no parâmetro `modulo` da sua consulta.\n\n";

  apis.forEach(api => {
    if (api.category !== currentCategory) {
      currentCategory = api.category;
      let emoji = "🔍";
      if (currentCategory.includes("Foto") || currentCategory.includes("Facial")) emoji = "📸";
      if (currentCategory.includes("Veículo") || currentCategory.includes("CNH")) emoji = "🚗";
      if (currentCategory.includes("Financeiro") || currentCategory.includes("Score")) emoji = "💰";
      if (currentCategory.includes("Localização") || currentCategory.includes("Contato")) emoji = "📍";
      if (currentCategory.includes("Judicial") || currentCategory.includes("Processos")) emoji = "⚖️";
      if (currentCategory.includes("Empresas")) emoji = "🏢";
      if (currentCategory.includes("Documentos")) emoji = "🪪";
      
      message += `\n*${emoji} ${currentCategory.toUpperCase()}*\n`;
    }

    let searchType = "CPF";
    const slug = api.slug.toLowerCase();
    const name = api.name.toLowerCase();

    if (slug.includes("placa") || name.includes("placa")) searchType = "PLACA";
    else if (slug.includes("nome") || name.includes("nome")) searchType = "NOME";
    else if (slug.includes("cnpj") || name.includes("cnpj")) searchType = "CNPJ";
    else if (slug.includes("telefone") || slug.includes("fone") || name.includes("telefone")) searchType = "TELEFONE";
    else if (slug.includes("email") || name.includes("email")) searchType = "EMAIL";
    else if (slug.includes("cep") || name.includes("cep")) searchType = "CEP";
    else if (slug.includes("chassi")) searchType = "CHASSI";
    else if (slug.includes("renavam")) searchType = "RENAVAM";
    else if (slug.includes("motor")) searchType = "MOTOR";
    else if (slug.includes("ip-geo")) searchType = "IP";
    else if (slug.includes("mac-brand")) searchType = "MAC";
    else if (slug.includes("card-bin")) searchType = "6 DÍGITOS CARTÃO";

    message += `• ${api.name} (\`${api.slug}\`) - Busca por: *${searchType}*\n`;
  });

  message += "\n\n*💡 DICA:* Para módulos de foto, adicione `&render=true` no final do link para ver a imagem direto no Zap!";

  console.log(message);
  process.exit(0);
}

run().catch(console.error);
