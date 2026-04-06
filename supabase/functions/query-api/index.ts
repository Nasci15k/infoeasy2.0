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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('SERVER ERROR: Missing environment variables');
      throw new Error('Configuração do servidor incompleta (Missing Secrets)');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header missing' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado ou sessão expirada' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { apiId, queryValue } = body;

    if (!apiId || queryValue === undefined) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros apiId ou queryValue ausentes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados da API
    const { data: api, error: apiError } = await supabaseClient
      .from('apis')
      .select('*')
      .eq('id', apiId)
      .single();

    if (apiError || !api) {
      return new Response(
        JSON.stringify({ error: 'Módulo de consulta não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar limites do usuário
    const { data: limits } = await supabaseClient
      .from('user_limits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (limits && Number(limits.daily_count) >= Number(limits.daily_limit)) {
      return new Response(
        JSON.stringify({ error: 'Seu limite diário de consultas foi atingido.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Processar o endpoint
    const endpointStore = api.endpoint || '';
    let apiUrl = '';

    // Buscar configurações globais (Tokens e URLs)

    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const serviceClient = createClient(supabaseUrl!, supabaseServiceRole!);
    const { data: settings } = await serviceClient.from('bot_settings').select('key, value');
    const cfg: Record<string, string> = {};
    settings?.forEach((s: any) => { cfg[s.key] = s.value; });

    const TOKEN_PANEL = cfg['external_api_token'] || "PvhdVpk8zw4PRjIyzpUlpS2ztYB54FmdxWtxTSJAjyk";
    const BASE_URL_PANEL = cfg['external_api_url'] || "http://45.190.208.48:7070/consulta";
    const TOKEN_DUALITY = "DUALITY-FREE";

    const valueStr = String(queryValue);
    const cleanValue = valueStr.replace(/\D/g, '');
    const encodedValue = encodeURIComponent(valueStr);
    
    if (endpointStore.startsWith('panel:')) {
      const modulo = endpointStore.split(':')[1];
      apiUrl = `${BASE_URL_PANEL}?token=${TOKEN_PANEL}&modulo=${modulo}&valor=${encodedValue}`;

    } else if (endpointStore.startsWith('brasilpro:')) {
      const param = endpointStore.split(':')[1];
      apiUrl = `http://apisbrasilpro.site/api/busca_${param}.php?${param}=${encodedValue}`;
    } else if (endpointStore.startsWith('duality:')) {
      const apiName = endpointStore.split(':')[1];
      apiUrl = `https://duality.lat/?token=${TOKEN_DUALITY}&api=${apiName}&query=${cleanValue}`;
    } else {
      apiUrl = endpointStore
        .replace('{valor}', encodedValue)
        .replace('{ddd}', valueStr.substring(0, 2))
        .replace('{telefone}', valueStr.substring(2));
    }
    
    console.log(`Processing ${api.name} for ${user.email}`);

    let responseData: any = null;

    try {
      // Timeout resiliente (Deno 1.x)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos

      const response = await fetch(apiUrl, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`O provedor retornou erro HTTP ${response.status}`);
      }

      const textData = await response.text();
      
      // Checagem de erros SQL/Servidor no retorno do provedor
      const serverErrorKeywords = ['SQLSTATE', 'General error', 'Connection refused', 'PDOException', 'no such table'];
      if (serverErrorKeywords.some(kw => textData.includes(kw))) {
         throw new Error('A fonte de dados está instável ou em manutenção.');
      }

      // Parser Robusto
      try {
        responseData = JSON.parse(textData);
      } catch {
        // Tentativa de extração de JSON sujo
        const firstBrace = textData.indexOf('{');
        const lastBrace = textData.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          responseData = JSON.parse(textData.slice(firstBrace, lastBrace + 1));
        }
      }

      if (!responseData || typeof responseData !== 'object') {
        throw new Error('A resposta do provedor é inválida ou vazia.');
      }

      // Checar se o provedor retornou erro no JSON (Busca proativa de chaves de erro comuns)
      const errorKeys = ['erro', 'error', 'msg', 'mensagem', 'message', 'status'];
      let isError = false;
      let errorMsg = 'Nenhum registro encontrado.';

      // Busca insensível a maiúsculas/minúsculas
      for (const key of Object.keys(responseData)) {
        const k = key.toLowerCase();
        if (errorKeys.includes(k)) {
          const val = responseData[key];
          if (k === 'status' && (val === false || String(val) === '0' || String(val).toLowerCase() === 'error')) {
            isError = true;
          } else if (k !== 'status' && val && String(val).length > 2) {
            // Se tiver uma mensagem de erro explícita
            if (String(val).toLowerCase().includes('erro') || String(val).toLowerCase().includes('falha') || String(val).toLowerCase().includes('não encontrado')) {
              isError = true;
              errorMsg = String(val);
            }
          }
        }
      }

      if (isError || responseData.erro || responseData.error) {
         errorMsg = responseData.msg || responseData.erro || responseData.error || responseData.mensagem || responseData.message || errorMsg;
         return new Response(
           JSON.stringify({ success: false, notFound: true, message: String(errorMsg), api: api.name }),
           { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
         );
      }

    } catch (fetchError: any) {
      console.error('Fetch error:', fetchError.message);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: true, 
      message: fetchError.name === 'AbortError' ? 'Tempo esgotado (O provedor demorou mais de 60s)' : fetchError.message, 
          api: api.name 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitização Profunda (Recursiva)
    const sanitizeData = (obj: any): any => {
      const BLACK_LIST = [
        'consumo_hoje', 'reset_em', 'total_diario', 'limites', 'token', 
        'apikey', 'auth', 'senha', 'password', 'protocolo', 'usuario', 'conta'
      ];

      if (typeof obj === 'string') {
        return obj.replace(/astra/gi, '[FILTRADO]');
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeData);
      }
      
      if (obj && typeof obj === 'object') {
        const filtered: any = {};
        for (const [key, value] of Object.entries(obj)) {
          const k = key.toLowerCase();
          if (BLACK_LIST.some(item => k === item || k.includes('token') || k.includes('apikey'))) {
            continue;
          }
          filtered[key] = sanitizeData(value);
        }
        return filtered;
      }
      return obj;
    };

    const cleanData = sanitizeData(responseData);

    // Persistência no Histórico (Usa service role para garantir a gravação independente de RLS)
    try {
      const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseServiceRole) {
        const serviceClient = createClient(supabaseUrl!, supabaseServiceRole);
        await serviceClient.from('query_history').insert({
          user_id: user.id,
          api_id: apiId,
          query_value: String(queryValue),
          response_data: cleanData,
        });
      }
    } catch (dbError) {
      console.error('History Save Error (Logged):', dbError);
    }

    // Atualizar Limites
    if (limits) {
      await supabaseClient
        .from('user_limits')
        .update({ 
          daily_count: Number(limits.daily_count) + 1,
          monthly_count: Number(limits.monthly_count) + 1
        })
        .eq('user_id', user.id);
    }

    return new Response(
      JSON.stringify({ success: true, data: cleanData, api: api.name }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('CRITICAL ERROR:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: true, 
        message: error instanceof Error ? error.message : 'Erro interno do servidor' 
      }),
      { 
        status: 200, // Retornamos 200 para o painel não travar, mas com flag success: false
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
