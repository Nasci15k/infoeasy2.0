import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuração do servidor incompleta.');
    }
    
    // Parse URL param
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const modulo = url.searchParams.get('modulo');
    const valor = url.searchParams.get('valor');

    if (!token) {
       return new Response(JSON.stringify({ error: 'Falta o parâmetro [token]' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Validate Token
    const { data: apiToken, error: tokenError } = await serviceClient
      .from('api_tokens')
      .select('*')
      .eq('token_hash', token)
      .single();

    if (tokenError || !apiToken || !apiToken.is_active) {
       return new Response(JSON.stringify({ error: 'Token inválido ou inativo.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // DOCUMENTATION MODE: If token exists but no modulo/valor, show status
    if (!modulo || !valor) {
      return new Response(JSON.stringify({
        status: 'online',
        client: apiToken.label,
        client_name: apiToken.client_name,
        usage: `${apiToken.requests_made} / ${apiToken.daily_limit}`,
        allowed_apis: apiToken.allowed_apis,
        message: 'Para consultar, envie os parâmetros [modulo] e [valor].'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // granular permission check
    const allowedApis = apiToken.allowed_apis || [];
    // If list is empty, default to blocked (must explicitly allow)
    // Or if list contains '*', allow all.
    if (!allowedApis.includes('*') && !allowedApis.includes(modulo)) {
       return new Response(JSON.stringify({ 
         error: 'Seu token não possui permissão para este módulo.', 
         requested_module: modulo,
         help: 'Contate o suporte para liberar acesso a este endpoint.'
       }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    if (apiToken.requests_made >= apiToken.daily_limit) {
       return new Response(JSON.stringify({ error: 'Limite diário da API excedido.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // Resolve slug to real endpoint
    const { data: apiMeta, error: metaError } = await serviceClient
      .from('apis')
      .select('endpoint, name')
      .eq('slug', modulo)
      .single();

    if (metaError || !apiMeta) {
       return new Response(JSON.stringify({ error: `O módulo [${modulo}] não existe ou foi renomeado.` }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // Get internal provider modulo (e.g. "iseek-cpf" from "panel:iseek-cpf")
    const providerModulo = apiMeta.endpoint.includes(':') ? apiMeta.endpoint.split(':')[1] : apiMeta.endpoint;

    // Get Target API details
    const { data: settings } = await serviceClient.from('bot_settings').select('key, value');
    const cfg: Record<string, string> = {};
    settings?.forEach((s: any) => { cfg[s.key] = s.value; });

    const API_TOKEN = cfg['external_api_token'] || "23btetakuv3zx8HkEcfRpEy_zonEFilQBDLOJl9rEPk";
    const API_BASE_URL = cfg['external_api_url'] || "http://158.173.2.17:7070/consulta";

    const encodedValue = encodeURIComponent(valor);
    const targetUrl = `${API_BASE_URL}?token=${API_TOKEN}&modulo=${providerModulo}&valor=${encodedValue}`;

    // Execute Request
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'InfoEasy/Proxy API' }
    });

    if (!response.ok) {
       throw new Error(`Upstream Error: ${response.status}`);
    }

    const respData = await response.text();

    let jsonResp;
    try {
      jsonResp = JSON.parse(respData);
    } catch {
       jsonResp = { raw: respData };
    }

    // SANITIZATION: Recursive cleaning function
    const sanitize = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        if (typeof obj === 'string') {
          // Replace provider mentions
          return obj
            .replace(/iseek/gi, 'InfoEasy')
            .replace(/duality/gi, 'InfoEasy')
            .replace(/brasilpro/gi, 'InfoEasy')
            .replace(/astra/gi, 'InfoEasy')
            .replace(/pode conter erros/gi, 'Dados verificados')
            .replace(/consulta realizada com sucesso/gi, 'Busca concluída');
        }
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }

      const cleaned: any = {};
      const forbiddenKeys = ['server_time', 'execution_ms', 'provider', 'provider_info', 'source_db', 'raw_response'];
      
      for (const key in obj) {
        if (forbiddenKeys.includes(key.toLowerCase())) continue;
        
        // Clean key names if they contain provider names
        const cleanKey = key.replace(/iseek/gi, '').replace(/provider/gi, 'source');
        cleaned[cleanKey] = sanitize(obj[key]);
      }
      return cleaned;
    };

    const sanitizedResp = sanitize(jsonResp);

    // Update Token Usage & Log
    await serviceClient.from('api_tokens').update({ requests_made: Number(apiToken.requests_made) + 1 }).eq('id', apiToken.id);
    await serviceClient.from('api_logs').insert({ 
      token_id: apiToken.id, 
      endpoint: modulo, // store the slug used
      query: valor,
      status_code: response.status
    });

    // Respond back to client
    return new Response(JSON.stringify(sanitizedResp), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
  }
});
