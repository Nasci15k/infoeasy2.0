import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gerador de token curto alfanumérico (8 chars)
function generateToken(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (const byte of array) {
    result += chars[byte % chars.length];
  }
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verificar autenticação do usuário do site
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { apiName, queryValue, responseData } = body;

    if (!apiName || !queryValue || !responseData) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios ausentes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar service role para insert (bypassa RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar URL do site configurada no admin
    const { data: siteUrlSetting } = await serviceClient
      .from('bot_settings')
      .select('value')
      .eq('key', 'site_url')
      .single();

    const siteUrl = siteUrlSetting?.value || 'https://infoseasy.netlify.app';

    // Gerar token único
    let token = generateToken();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await serviceClient
        .from('shared_queries')
        .select('id')
        .eq('token', token)
        .single();
      if (!existing) break;
      token = generateToken();
      attempts++;
    }

    // Inserir link compartilhável
    const { error: insertError } = await serviceClient
      .from('shared_queries')
      .insert({
        token,
        api_name: apiName,
        query_value: queryValue,
        response_data: responseData,
        source: 'web',
      });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        token,
        url: `${siteUrl}/share/${token}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('create-share-link error:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno', message: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
