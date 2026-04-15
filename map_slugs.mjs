import postgres from 'postgres';
const sql = postgres('postgresql://postgres:Nasci15k777@db.qvzoeguwilqurujbnvem.supabase.co:5432/postgres', {ssl: 'require'});

const mapping = {
  "panel:iseek-cpf": "cpf-ultra",
  "panel:iseek-cpfbasico": "cpf-simples",
  "panel:iseek-dados---catcpf": "cpf-catalogado",
  "panel:iseek-dados---nis": "nis",
  "panel:iseek-dados---nasc": "data-nascimento",
  "panel:iseek-dados---beneficios": "inss-beneficios",
  "panel:iseek-dados---mae": "filiacao-mae",
  "panel:iseek-dados---pai": "filiacao-pai",
  "panel:iseek-dados---nomeabreviadofiltros": "busca-nome-filtro",
  "panel:iseek-dados---parentes": "relacionamento-parentes",
  "panel:iseek-dados---score2": "score-v2",
  "panel:iseek-dados---score": "score-v1",
  "panel:iseek-dados---pix": "chave-pix",
  "panel:iseek-dados---cheque": "ccf-cheque",
  "panel:iseek-dados---bens": "bens-patrimonio",
  "panel:iseek-dados---irpf": "irpf-declaracao",
  "panel:iseek-dados---dividas": "serasa-dividas",
  "panel:iseek-dados---placa": "detran-placa",
  "panel:iseek-dados---chassi": "detran-chassi",
  "panel:iseek-dados---motor": "detran-motor",
  "panel:iseek-dados---renavam": "detran-renavam",
  "panel:iseek-dados---crlvto": "documento-crlv-to",
  "panel:iseek-dados---crlvmt": "documento-crlv-mt",
  "panel:iseek-dados---veiculos": "veiculos-proprietario",
  "panel:iseek-dados---cnh": "cnh-digital",
  "panel:iseek-dados---cnham": "cnh-amazonas",
  "panel:iseek-dados---cnhrs": "cnh-rs",
  "panel:iseek-dados---cnhrr": "cnh-roraima",
  "panel:iseek-dados---cnhnc": "cnh-nacional",
  "panel:iseek-dados---cep": "busca-cep",
  "panel:iseek-dados---email": "busca-email",
  "panel:iseek-dados---telefone": "busca-telefone",
  "panel:iseek-dados---catnumero": "telefone-catalogado",
  "panel:iseek-dados---rg": "documento-rg",
  "panel:iseek-dados---titulo": "titulo-eleitor",
  "panel:iseek-dados---func": "servidor-funcional",
  "panel:iseek-dados---vacinas": "saude-vacinas",
  "panel:iseek-dados---faculdades": "educacao-superior",
  "panel:iseek-dados---obito": "certidao-obito",
  "panel:iseek-dados---assessoria": "assessoria-cobranca",
  "panel:iseek-dados---registro": "cbo-trabalho",
  "panel:iseek-dados---processos": "justica-processos",
  "panel:iseek-dados---processo": "justica-detalhe",
  "panel:iseek-dados---advogadooab": "oab-advogado",
  "panel:iseek-dados---advogadooabuf": "oab-uf-adv",
  "panel:iseek-dados---advogadocpf": "oab-por-cpf",
  "panel:iseek-dados---oab": "oab-validacao",
  "panel:iseek-dados---mandado": "justica-mandado",
  "panel:iseek-dados---certidoes": "cartorio-certidoes",
  "panel:iseek-dados---matricula": "imovel-matricula",
  "panel:iseek-dados---iptu": "imovel-iptu",
  "panel:iseek-dados---cnpj": "busca-cnpj-full",
  "panel:iseek-dados---rais": "trabalho-rais",
  "panel:iseek-fotos---fotocnh": "foto-cnh-hd",
  "panel:iseek-dados---fotodetran": "foto-detran-full",
  "panel:iseek-fotos---fotomg": "foto-estado-mg",
  "panel:iseek-fotos---fotosp": "foto-estado-sp",
  "panel:iseek-fotos---fotoma": "foto-estado-ma",
  "panel:iseek-fotos---fotoms": "foto-estado-ms",
  "panel:iseek-fotos---fototo": "foto-estado-to",
  "panel:iseek-fotos---fotoro": "foto-estado-ro",
  "panel:iseek-fotos---fotopi": "foto-estado-pi",
  "panel:iseek-fotos---fotoes": "foto-estado-es",
  "panel:iseek-fotos---fotodf": "foto-estado-df",
  "panel:iseek-fotos---fotoce": "foto-estado-ce",
  "panel:iseek-fotos---fotorj": "foto-estado-rj",
  "panel:iseek-fotos---fotopr": "foto-estado-pr",
  "panel:iseek-fotos---fotonc": "foto-nacional-all",
  "panel:iseek-fotos---fotorn": "foto-estado-rn",
  "panel:iseek-fotos---fotope": "foto-estado-pe",
  "panel:iseek-fotos---fotopb": "foto-estado-pb",
  "panel:iseek-fotos---fotogo": "foto-estado-go",
  "panel:iseek-fotos---fotoal": "foto-estado-al",
  "panel:iseek-fotos---fotomapresos": "foto-presos-ma",
  "brasilpro:cpf": "extra-cpf-v1",
  "brasilpro:nome": "extra-nome-v1",
  "brasilpro:mae": "extra-mae-v1",
  "brasilpro:titulo": "extra-titulo-v1",
  "brasilpro:pai": "extra-pai-v1",
  "brasilpro:rg": "extra-rg-v1",
  "duality:cpf": "extra-cpf-v2",
  "http://ip-api.com/json/{valor}": "geek-ip-geo",
  "https://api.macvendors.com/{valor}": "geek-mac-brand",
  "https://lookup.binlist.net/{valor}": "finance-card-bin",
  "tconect:/api/consulta/cpf/v1?code={valor}": "tconect-cpf-v1",
  "tconect:/api/consulta/cpf/v2?code={valor}": "tconect-cpf-v2",
  "tconect:/api/consulta/cpf/v3?code={valor}": "tconect-cpf-v3",
  "tconect:/api/consulta/cpf/v4?code={valor}": "tconect-cpf-v4",
  "tconect:/api/consulta/cpf/v5?code={valor}": "tconect-cpf-v5",
  "tconect:/api/consulta/cpfsus/v1?cpf={valor}": "tconect-cpf-sus",
  "tconect:/api/consulta/inss/v1?cpf={valor}": "tconect-inss",
  "tconect:/api/consulta/score/v1?cpf={valor}": "tconect-score",
  "tconect:/api/consulta/nome/v1?nome={valor}": "tconect-nome",
  "tconect:/api/consulta/placa/v1?placa={valor}": "tconect-placa-v1",
  "tconect:/api/consulta/placa/v2?placa={valor}": "tconect-placa-v2",
  "tconect:/api/consulta/motor/v1?tipo=motor&valor={valor}": "tconect-motor",
  "tconect:/api/consulta/motor/v1?tipo=chassi&valor={valor}": "tconect-chassi",
  "tconect:/api/consulta/telefone/v1?telefone={valor}": "tconect-telefone",
  "tconect:/api/consulta/cep/v1?cep={valor}": "tconect-cep",
  "tconect:/api/consulta/cnpj/v1?cnpj={valor}": "tconect-cnpj",
  "tconect:/api/consulta/cnpjFGTS/v2?cnpj={valor}": "tconect-cnpj-fgts",
  "tconect:/api/consulta/fotope/v1?nome={valor}": "tconect-fotope"
};

async function run() {
  console.log('Adding slug column...');
  try {
    await sql`ALTER TABLE public.apis ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;`;
  } catch (e) {
    console.log('Slug column might already exist.');
  }

  console.log('Updating slugs...');
  for (const [endpoint, slug] of Object.entries(mapping)) {
    await sql`UPDATE public.apis SET slug = ${slug} WHERE endpoint = ${endpoint}`;
  }

  // Reload schema
  await sql`NOTIFY pgrst, 'reload schema';`;
  console.log('Migration complete!');
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
