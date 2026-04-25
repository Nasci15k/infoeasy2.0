import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkApis() {
  const { data, error } = await supabase
    .from('apis')
    .select('name, endpoint')
    .ilike('endpoint', 'panel:%')
  
  if (error) {
    console.error('Error fetching APIs:', error)
    return
  }

  console.log('Current Panel APIs:')
  data.forEach(api => console.log(`- ${api.name}: ${api.endpoint}`))
}

checkApis()
