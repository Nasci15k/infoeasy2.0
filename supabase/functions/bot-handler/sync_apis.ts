import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const supabase = createClient(supabaseUrl, supabaseKey)

async function syncApis() {
  console.log('Iniciando sincronização de APIs...')

  // 1. Garantir categorias básicas
  const categories = [
    { name: 'ENDEREÇO', slug: 'endereco', icon: '📍' },
    { name: 'TELEGRAM', slug: 'telegram', icon: '👤' },
    { name: 'SOCIAL', slug: 'social', icon: '❤️' }
  ]

  for (const cat of categories) {
    const { error } = await supabase.from('api_categories').upsert({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      color_group: 'blue'
    }, { onConflict: 'slug' })
    if (error) console.error(`Erro na categoria ${cat.slug}:`, error)
  }

  // 2. Adicionar/Atualizar Módulos do Novo Servidor
  const apisToAdd = [
    { 
      category_slug: 'endereco', 
      name: 'Endereço - Info Easy', 
      endpoint: 'panel:iseek-dados---endereco', 
      group_name: 'Info Easy', 
      requirement: 'CEP/Rua' 
    },
    { 
      category_slug: 'telegram', 
      name: 'Telegram - Info Easy', 
      endpoint: 'panel:telegram', 
      group_name: 'Info Easy', 
      requirement: 'Username' 
    },
    { 
      category_slug: 'social', 
      name: 'Likes - Info Easy', 
      endpoint: 'panel:likes', 
      group_name: 'Info Easy', 
      requirement: 'ID' 
    },
    { 
      category_slug: 'nome', 
      name: 'Nome (Direto) - Info Easy', 
      endpoint: 'panel:iseek-dados---nomeabreviadofriltros', 
      group_name: 'Info Easy', 
      requirement: 'Nome' 
    }
  ]

  for (const api of apisToAdd) {
    const { data: cat } = await supabase.from('api_categories').select('id').eq('slug', api.category_slug).single()
    if (cat) {
      const { error } = await supabase.from('apis').upsert({
        category_id: cat.id,
        name: api.name,
        endpoint: api.endpoint,
        group_name: api.group_name,
        requirement: api.requirement
      }, { onConflict: 'endpoint' })
      if (error) console.error(`Erro na API ${api.endpoint}:`, error)
      else console.log(`API sincronizada: ${api.name}`)
    }
  }

  console.log('Sincronização concluída!')
}

syncApis()
