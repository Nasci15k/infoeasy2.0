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
    const shouldRender = url.searchParams.get('render') === 'true';

    if (!token) {
      return new Response(JSON.stringify({ error: 'Falta o parâmetro [token]' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Validate Token
    const { data: apiToken, error: tokenError } = await serviceClient
      .from('api_tokens')
      .select('*')
      .eq('token_hash', token)
      .single();

    if (tokenError || !apiToken || !apiToken.is_active) {
      return new Response(JSON.stringify({ error: 'Token inválido ou inativo.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const allowedApis = apiToken.allowed_apis || [];

    // DOCUMENTATION MODE: If token exists but no modulo, show full module list
    if (!modulo || modulo.trim() === '') {
      // Fetch all allowed modules with names
      let allowedModules: any[] = [];
      if (!allowedApis.includes('*')) {
        const { data: moduleData } = await serviceClient
          .from('apis')
          .select('slug, name, group_name')
          .in('slug', allowedApis);
        allowedModules = moduleData || [];
      } else {
        const { data: moduleData } = await serviceClient
          .from('apis')
          .select('slug, name, group_name')
          .not('slug', 'is', null)
          .order('group_name');
        allowedModules = moduleData || [];
      }

      return new Response(JSON.stringify({
        status: 'online',
        client: apiToken.label,
        client_name: apiToken.client_name,
        daily_usage: `${apiToken.requests_made} / ${apiToken.daily_limit}`,
        allowed_modules: allowedModules,
        usage: 'GET /api?token=SEU_TOKEN&modulo=SLUG_DO_MODULO&valor=VALOR'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!valor) {
      return new Response(JSON.stringify({ error: 'Falta o parâmetro [valor]' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // granular permission check
    if (!allowedApis.includes('*') && !allowedApis.includes(modulo)) {
      return new Response(JSON.stringify({
        error: 'Seu token não possui permissão para este módulo.',
        requested_module: modulo,
        help: 'Contate o suporte para liberar acesso a este endpoint.'
      }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (apiToken.requests_made >= apiToken.daily_limit) {
      return new Response(JSON.stringify({ error: 'Limite diário da API excedido.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Resolve slug to real endpoint — try exact slug first, then endpoint contains
    let apiMeta: any = null;

    // Attempt 1: exact slug match
    const { data: bySlug } = await serviceClient
      .from('apis')
      .select('endpoint, name, slug')
      .eq('slug', modulo)
      .maybeSingle();

    if (bySlug) {
      apiMeta = bySlug;
    } else {
      // Attempt 2: endpoint contains the modulo string (e.g. 'panel:iseek-dados---placa')
      const { data: byEndpoint } = await serviceClient
        .from('apis')
        .select('endpoint, name, slug')
        .or(`endpoint.eq.panel:${modulo},endpoint.like.%${modulo}%`)
        .order('group_name', { ascending: true }) // Info Easy first
        .limit(1)
        .maybeSingle();

      if (byEndpoint) {
        apiMeta = byEndpoint;
      }
    }

    if (!apiMeta) {
      // Build helpful list of valid module slugs
      const { data: validModules } = await serviceClient
        .from('apis')
        .select('slug, name')
        .not('slug', 'is', null)
        .limit(20);

      const examples = validModules?.slice(0, 5).map((m: any) => m.slug).join(', ') || '';
      return new Response(JSON.stringify({
        error: `O módulo [${modulo}] não existe ou foi renomeado.`,
        hint: `Exemplos de módulos válidos: ${examples}`,
        docs: 'Acesse /api?token=SEU_TOKEN para ver todos os módulos disponíveis no seu plano.'
      }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get Target API details
    const { data: settings } = await serviceClient.from('bot_settings').select('key, value');
    const cfg: Record<string, string> = {};
    settings?.forEach((s: any) => { cfg[s.key] = s.value; });

    const encodedValue = encodeURIComponent(valor);
    const cleanValue = valor.replace(/\D/g, '');
    let targetUrl = '';

    if (apiMeta.endpoint.startsWith('panel:')) {
      const panelModulo = apiMeta.endpoint.split(':')[1];
      const API_TOKEN = cfg['external_api_token'] || "23btetakuv3zx8HkEcfRpEy_zonEFilQBDLOJl9rEPk";
      const API_BASE_URL = cfg['external_api_url'] || "http://158.173.2.17:7070/consulta";
      targetUrl = `${API_BASE_URL}?token=${API_TOKEN}&modulo=${panelModulo}&valor=${encodedValue}`;

    } else if (apiMeta.endpoint.startsWith('brasilpro:')) {
      const param = apiMeta.endpoint.split(':')[1];
      targetUrl = `http://apisbrasilpro.site/api/busca_${param}.php?${param}=${encodedValue}`;

    } else if (apiMeta.endpoint.startsWith('duality:')) {
      const apiName = apiMeta.endpoint.split(':')[1];
      targetUrl = `https://duality.lat/?token=DUALITY-FREE&api=${apiName}&query=${cleanValue}`;

    } else if (apiMeta.endpoint.startsWith('tconect:')) {
      const path = apiMeta.endpoint.split(':')[1];
      const tconectToken = cfg['tconect_api_token'] || "PNSAPIS";
      const tconectBase = cfg['tconect_api_url'] || "http://node.tconect.xyz:1116";

      targetUrl = `${tconectBase}${path.startsWith('/') ? '' : '/'}${path}`;
      if (targetUrl.includes('?')) {
        targetUrl = targetUrl.replace('apikey=SeuToken', `apikey=${tconectToken}`).replace('apikey=SUAKEY', `apikey=${tconectToken}`);
        if (!targetUrl.includes('apikey=')) targetUrl += `&apikey=${tconectToken}`;
      } else {
        targetUrl += `?apikey=${tconectToken}`;
      }
      targetUrl = targetUrl.replace('{valor}', encodedValue);
    } else {
      // Direct URL support
      targetUrl = apiMeta.endpoint.replace('{valor}', encodedValue);
    }

    // Execute Request
    const response = await fetch(targetUrl, {
      headers: { 
        'User-Agent': 'InfoEasy/Proxy API (Public)',
        'Accept': 'application/json'
      }
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

    // SANITIZATION & PHOTO RENDERING
    const sanitize = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        if (typeof obj === 'string') {
          return obj
            .replace(/iseek/gi, 'InfoEasy')
            .replace(/duality/gi, 'InfoEasy')
            .replace(/brasilpro/gi, 'InfoEasy')
            .replace(/astra/gi, 'InfoEasy')
            .replace(/tconect/gi, 'InfoEasy')
            .replace(/pode conter erros/gi, 'Dados verificados')
            .replace(/consulta realizada com sucesso/gi, 'Busca concluída');
        }
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }

      const cleaned: any = {};
      const forbiddenKeys = [
        'server_time', 'execution_ms', 'provider', 'provider_info',
        'source_db', 'raw_response', 'token_info', 'api_info',
        'requests_remaining', 'owner', 'reset_interval_minutes',
        'minutes_until_reset', 'used_in_period', 'developer', 'developer2',
        'resposta', 'status', 'copyright', 'criado_por', 'desenvolvedor'
      ];

      for (const key in obj) {
        if (forbiddenKeys.includes(key.toLowerCase())) continue;
        const cleanKey = key.replace(/iseek/gi, '').replace(/provider/gi, 'source');
        cleaned[cleanKey] = sanitize(obj[key]);
      }
      return cleaned;
    };

    const sanitizedResp = sanitize(jsonResp);

    // Deep Search for Base64 (Enhanced for nested provider responses)
    const findBase64 = (obj: any): string | null => {
      if (!obj || typeof obj !== 'object') return null;
      if (typeof obj.base64 === 'string') return obj.base64;
      if (typeof obj.foto === 'string') return obj.foto;
      if (typeof obj.imagem === 'string') return obj.imagem;

      for (const key in obj) {
        const result = findBase64(obj[key]);
        if (result) return result;
      }
      return null;
    };

    // PHOTO RENDERING LOGIC: If ?render=true and it's a photo slug
    if (shouldRender && modulo.startsWith('foto')) {
      const base64Data = findBase64(sanitizedResp);

      if (base64Data) {
        const pureBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

        try {
          const binaryString = atob(pureBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          return new Response(bytes, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'public, max-age=86400'
            }
          });
        } catch (e) {
          console.error("Base64 decode failed:", e);
        }
      }
    }

    // Update Token Usage & Log
    await serviceClient.from('api_tokens').update({ requests_made: Number(apiToken.requests_made) + 1 }).eq('id', apiToken.id);
    await serviceClient.from('api_logs').insert({
      token_id: apiToken.id,
      endpoint: modulo,
      query: valor,
      status_code: response.status
    });

    // FINAL RESPONSE WRAPPING: Intelligent flattening to avoid duplication
    // We look for 'resultado', 'data', 'dados' or 'resultados' to return the core info
    const realData = sanitizedResp.resultado || 
                     sanitizedResp.RESULTADOS || 
                     sanitizedResp.data || 
                     sanitizedResp.dados || 
                     sanitizedResp.RETORNO || 
                     sanitizedResp.retorno || 
                     sanitizedResp;

    const finalResponse = {
      consulta: {
        modulo: modulo,
        valor: valor
      },
      data: realData
    };

    return new Response(JSON.stringify(finalResponse), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
