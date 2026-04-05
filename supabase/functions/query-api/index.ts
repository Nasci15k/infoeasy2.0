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

    // Determinar se é CPF ou CNPJ
    const cleanValue = queryValue.replace(/\D/g, '');
    const isCnpj = cleanValue.length === 14;
    const isCpf = cleanValue.length === 11;
    const queryParam = isCnpj ? 'cnpj' : (isCpf ? 'cpf' : 'doc');

    // Construir URL da API substituindo {valor}
    let apiUrl = api.endpoint
      .replace('{valor}', encodeURIComponent(queryValue))
      .replace('{ddd}', queryValue.substring(0, 2))
      .replace('{telefone}', queryValue.substring(2));
    
    console.log('API Name:', api.name);
    console.log('Initial URL:', apiUrl);

    // Se for API SPC, tentar múltiplas versões
    let responseData: any = null;
    let lastError: any = null;

    if (api.name.includes('SPC')) {
      // Gerar URLs para SPC de 1 a 38
      const spcVersions: string[] = [];
      
      // Base URL sem número
      spcVersions.push(`https://apis-brasil.shop/apis/api${queryParam}spc.php?${queryParam}=${cleanValue}`);
      
      // URLs de 1 a 38
      for (let i = 1; i <= 38; i++) {
        spcVersions.push(`https://apis-brasil.shop/apis/api${queryParam}${i}spc.php?${queryParam}=${cleanValue}`);
      }

      // Tentar cada versão em paralelo (lotes de 5)
      const batchSize = 5;
      for (let i = 0; i < spcVersions.length; i += batchSize) {
        const batch = spcVersions.slice(i, i + batchSize);
        
        const results = await Promise.allSettled(
          batch.map(async (testUrl) => {
            console.log('Trying SPC version:', testUrl);
            const response = await fetch(testUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              signal: AbortSignal.timeout(8000),
            });

            if (response.ok) {
              const text = await response.text();
              let data;
              try {
                data = JSON.parse(text);
              } catch {
                const firstBrace = text.indexOf('{');
                if (firstBrace !== -1) {
                  data = JSON.parse(text.slice(firstBrace));
                }
              }
              
              if (data && typeof data === 'object' && Object.keys(data).length > 0) {
                // Verificar se não é erro da API externa
                if (!data.erro && !data.error && !data.message?.toLowerCase().includes('erro')) {
                  return data;
                }
              }
            }
            throw new Error('Invalid response');
          })
        );

        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            responseData = result.value;
            console.log('SPC Success!');
            break;
          }
        }

        if (responseData) break;
      }

      if (!responseData) {
        return new Response(
          JSON.stringify({ 
            success: false,
            notFound: true,
            message: 'Nenhum dado foi encontrado para esta consulta no SPC.',
            api: api.name
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Fazer requisição normal para outras APIs
      try {
        console.log('Fetching:', apiUrl);
        
        const response = await fetch(apiUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(15000),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          throw new Error(`API retornou status ${response.status}`);
        }

        const textData = await response.text();
        console.log('Response length:', textData.length);

        // Verificar se há erro de banco de dados externo
        if (textData.includes('no such table') || textData.includes('SQLSTATE') || textData.includes('General error')) {
          console.error('External API database error:', textData.substring(0, 500));
          return new Response(
            JSON.stringify({ 
              success: false,
              error: true,
              message: 'A API externa está com problemas temporários. Tente novamente mais tarde.',
              api: api.name
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Tentar parsear como JSON ignorando avisos iniciais
        let parsed: any = null;
        try {
          parsed = JSON.parse(textData);
        } catch (e) {
          // Tentar encontrar JSON no meio do texto (remove avisos PHP)
          const firstBrace = textData.indexOf('{');
          const firstBracket = textData.indexOf('[');
          const startIndex = firstBrace !== -1 && firstBracket !== -1 
            ? Math.min(firstBrace, firstBracket) 
            : Math.max(firstBrace, firstBracket);
            
          if (startIndex !== -1) {
            try {
              parsed = JSON.parse(textData.slice(startIndex));
            } catch (_) {
              // Tentar até a última chave/colchete
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
          // Verificar se há erro no JSON
          if (parsed.erro || parsed.error) {
            const errorMsg = parsed.erro || parsed.error || parsed.message || 'Dados não encontrados';
            return new Response(
              JSON.stringify({ 
                success: false,
                notFound: true,
                message: typeof errorMsg === 'string' ? errorMsg : 'Dados não encontrados',
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
              message: 'Nenhum dado foi encontrado para esta consulta.',
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
              message: 'A API demorou muito para responder. Tente novamente.',
              api: api.name
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        throw fetchError;
      }
    }

    // Filtrar mensagens contendo "astra" (case insensitive)
    const filterAstra = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.replace(/astra/gi, '[FILTRADO]');
      }
      if (Array.isArray(obj)) {
        return obj.map(filterAstra);
      }
      if (obj && typeof obj === 'object') {
        const filtered: any = {};
        for (const [key, value] of Object.entries(obj)) {
          filtered[key] = filterAstra(value);
        }
        return filtered;
      }
      return obj;
    };

    const filteredData = filterAstra(responseData);

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
