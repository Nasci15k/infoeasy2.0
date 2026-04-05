import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar todas as APIs ativas
    const { data: apis, error: apisError } = await supabaseClient
      .from('apis')
      .select('id, endpoint, name')
      .eq('is_active', true);

    if (apisError) throw apisError;

    const results = [];

    // Verificar status de cada API
    for (const api of apis || []) {
      const startTime = Date.now();
      let isOnline = false;
      let responseTime = null;
      let errorMsg = null;

      try {
        // Fazer request HEAD para verificar se o endpoint responde
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(api.endpoint, {
          method: 'HEAD',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        responseTime = Date.now() - startTime;
        isOnline = response.status < 500; // Considerar online se não for erro 5xx
      } catch (error: any) {
        errorMsg = error.message;
        responseTime = Date.now() - startTime;
      }

      // Atualizar status no banco
      await supabaseClient
        .from('apis')
        .update({
          is_active: isOnline,
          last_status_check: new Date().toISOString(),
          status_response_time: responseTime,
          status_error: errorMsg,
        })
        .eq('id', api.id);

      results.push({
        id: api.id,
        name: api.name,
        isOnline,
        responseTime,
        error: errorMsg,
      });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error checking API status:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
