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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { apiId, queryValue } = await req.json();

    // Buscar dados da API
    const { data: api, error: apiError } = await supabaseClient
      .from('apis')
      .select('*')
      .eq('id', apiId)
      .single();

    if (apiError || !api) {
      return new Response(
        JSON.stringify({ error: 'API não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar limites do usuário
    const { data: limits } = await supabaseClient
      .from('user_limits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (limits && limits.daily_count >= limits.daily_limit) {
      return new Response(
        JSON.stringify({ error: 'Limite diário atingido' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Processar o endpoint armazenado
    const endpointStore = api.endpoint || '';
    let apiUrl = '';
    
    // Pegar token puro passado (idealmente estaria no secrets do Supabase)
    const TOKEN_PANEL = "PvhdVpk8zw4PRjIyzpUlpS2ztYB54FmdxWtxTSJAjyk";
    const TOKEN_DUALITY = "DUALITY-FREE";

    const cleanValue = queryValue.replace(/\D/g, '');
    const encodedValue = encodeURIComponent(queryValue);
    
    // Determinar se o endpoint segue a nova arquitetura com provider:*
    if (endpointStore.startsWith('panel:')) {
      const modulo = endpointStore.split(':')[1];
      apiUrl = `http://45.190.208.48:7070/consulta?token=${TOKEN_PANEL}&modulo=${modulo}&valor=${encodedValue}`;
    } else if (endpointStore.startsWith('brasilpro:')) {
      const param = endpointStore.split(':')[1];
      apiUrl = `http://apisbrasilpro.site/api/busca_${param}.php?${param}=${encodedValue}`;
    } else if (endpointStore.startsWith('duality:')) {
      const apiName = endpointStore.split(':')[1];
      apiUrl = `https://duality.lat/?token=${TOKEN_DUALITY}&api=${apiName}&query=${cleanValue}`;
    } else {
      // Fallback para api antiga caso alguma escape
      apiUrl = endpointStore
        .replace('{valor}', encodedValue)
        .replace('{ddd}', queryValue.substring(0, 2))
        .replace('{telefone}', queryValue.substring(2));
    }
    
    console.log('API Name:', api.name);
    console.log('Fetching:', apiUrl.replace(TOKEN_PANEL, 'HIDDEN').replace(TOKEN_DUALITY, 'HIDDEN'));

    let responseData: any = null;

    try {
      const response = await fetch(apiUrl, {
        headers: { 
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json, text/plain, */*'
        },
        signal: AbortSignal.timeout(15000), // 15 segundos timeout
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Servidor externo retornou status ${response.status}`);
      }

      const textData = await response.text();
      
      // Checar mensagens clássicas de erro de conexão SQL na ponta
      if (textData.includes('no such table') || textData.includes('SQLSTATE') || textData.includes('General error') || textData.includes('Connection refused')) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: true,
            message: 'O fornecedor da API está fora do ar ou com problemas temporários.',
            api: api.name
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Parser Resiliente JSON
      let parsed: any = null;
      try {
        parsed = JSON.parse(textData);
      } catch (e) {
        const firstBrace = textData.indexOf('{');
        const firstBracket = textData.indexOf('[');
        const startIndex = firstBrace !== -1 && firstBracket !== -1 
          ? Math.min(firstBrace, firstBracket) 
          : Math.max(firstBrace, firstBracket);
          
        if (startIndex !== -1) {
          try {
            parsed = JSON.parse(textData.slice(startIndex));
          } catch (_) {
            const lastBrace = textData.lastIndexOf('}');
            const lastBracket = textData.lastIndexOf(']');
            const endIndex = Math.max(lastBrace, lastBracket);
            if (endIndex > startIndex) {
              try {
                parsed = JSON.parse(textData.slice(startIndex, endIndex + 1));
              } catch (_) {
                parsed = null;
              }
            }
          }
        }
      }

      if (parsed && typeof parsed === 'object') {
        if (parsed.erro || parsed.error || (parsed.status === false && parsed.msg)) {
          const errorMsg = parsed.msg || parsed.erro || parsed.error || parsed.message || 'Dados não encontrados no momento';
          return new Response(
            JSON.stringify({ 
              success: false,
              notFound: true,
              message: typeof errorMsg === 'string' ? errorMsg : 'Nenhum dado encontrado para essa busca.',
              api: api.name
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (Object.keys(parsed).length > 0) {
          responseData = parsed;
        }
      }

      if (!responseData) {
        return new Response(
          JSON.stringify({ 
            success: false,
            notFound: true,
            message: 'A fonte não retornou dados úteis (Retorno Vazio).',
            api: api.name
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      const errorMsg = fetchError instanceof Error ? fetchError.message : 'Erro desconhecido';
      
      if (errorMsg.includes('timeout') || errorMsg.includes('AbortError')) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: true,
            message: 'A consulta demorou muito e excedeu o tempo limite. Tente novamente.',
            api: api.name
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw fetchError;
    }

    // Sanitização de dados (Filtrar "astra" e metadados sensíveis do provedor)
    const sanitizeData = (obj: any): any => {
      const BLACK_LIST = [
        'consumo_hoje', 'reset_em', 'total_diario', 'limites', 
        'protocolo', 'sucesso', 'usuario', 'conta', 'success',
        'token', 'key', 'apikey', 'auth'
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
          const lowerKey = key.toLowerCase();
          // Pular se a chave estiver na lista negra ou contiver termos sensíveis
          if (BLACK_LIST.some(item => lowerKey === item || lowerKey.includes('token') || lowerKey.includes('apikey'))) {
            continue;
          }
          filtered[key] = sanitizeData(value);
        }
        return filtered;
      }
      return obj;
    };

    const filteredData = sanitizeData(responseData);

    // Salvar no histórico
    await supabaseClient.from('query_history').insert({
      user_id: user.id,
      api_id: apiId,
      query_value: queryValue,
      response_data: filteredData,
    });

    // Atualizar contador de uso
    if (limits) {
      await supabaseClient
        .from('user_limits')
        .update({ 
          daily_count: limits.daily_count + 1,
          monthly_count: limits.monthly_count + 1
        })
        .eq('user_id', user.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: filteredData,
        api: api.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: true,
        message: errorMessage
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
