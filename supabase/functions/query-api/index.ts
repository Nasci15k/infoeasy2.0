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

    // 1. Verificar se o usuário tem Plano Ativo
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('balance, plan_type, plan_expires_at')
      .eq('id', user.id)
      .single();

    const planExpires = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : null;
    const isPlanExpired = planExpires && planExpires < new Date();
    const hasActivePlan = profile?.plan_type && profile.plan_type !== 'free' && !isPlanExpired;

    if (!hasActivePlan) {
      return new Response(
        JSON.stringify({ error: 'Você precisa de um plano ativo para realizar consultas. Adquira um plano no painel.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verificar se a API é VIP e cobrar saldo
    if (api.is_vip) {
      const price = api.vip_price || 0;
      if (Number(profile?.balance || 0) < price) {
        return new Response(
          JSON.stringify({ error: `Saldo insuficiente. Esta consulta VIP custa R$ ${price.toFixed(2)}. Recarregue sua carteira.` }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Cobrar saldo usando Service Role para evitar problemas de concorrência ou RLS
      const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      const serviceClient = createClient(supabaseUrl!, supabaseServiceRole!);

      const { error: chargeError } = await serviceClient
        .from('profiles')
        .update({ balance: Number(profile.balance) - price })
        .eq('id', user.id);

      if (chargeError) throw new Error('Falha ao processar pagamento da consulta VIP.');

      // Registrar transação
      await serviceClient.from('wallet_transactions').insert({
        user_id: user.id,
        amount: -price,
        type: 'query_vip',
        description: `Consulta VIP: ${api.name}`
      });
    }

    // 3. Verificar limites diários (Só se não for VIP ou se quisermos contar ambos)
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

    // FORÇAR NOVOS VALORES INFO EASY (IGNORAR BANCO SE ANTIGO)
    const TOKEN_PANEL = "5d3En20IijT73XWENEKbtfw6cTnd3Inq_v3ZUQB4PC8";
    const BASE_URL_PANEL = "http://23.81.118.36:7070";
    const TOKEN_DUALITY = "DUALITY-FREE";

    const valueStr = String(queryValue);
    const cleanValue = valueStr.replace(/\D/g, '');
    const encodedValue = encodeURIComponent(valueStr);

    if (endpointStore.startsWith('panel:')) {
      const modulo = endpointStore.split(':')[1];
      
      if (modulo === 'telegram') {
        apiUrl = `${BASE_URL_PANEL}/telegram?token=${TOKEN_PANEL}&user=${encodedValue}`;
      } else if (modulo === 'likes') {
        apiUrl = `${BASE_URL_PANEL}/likes?token=${TOKEN_PANEL}&id=${encodedValue}&region=BR`;
      } else {
        // Mapeamento de nomes exatos da lista do usuário
        const moduloMap: Record<string, string> = {
          'iseek-dados---nomeabreviadofiltros': 'iseek-dados---nomeabreviadofriltros',
        };
        const finalModulo = moduloMap[modulo] || modulo;
        apiUrl = `${BASE_URL_PANEL}/consulta?token=${TOKEN_PANEL}&modulo=${finalModulo}&valor=${encodedValue}`;
      }

    } else if (endpointStore.startsWith('brasilpro:')) {
      const param = endpointStore.split(':')[1];
      apiUrl = `http://apisbrasilpro.site/api/busca_${param}.php?${param}=${encodedValue}`;
    } else if (endpointStore.startsWith('duality:')) {
      const apiName = endpointStore.split(':')[1];
      apiUrl = `https://duality.lat/?token=${TOKEN_DUALITY}&api=${apiName}&query=${cleanValue}`;
    } else if (endpointStore.startsWith('tconect:')) {
      const path = endpointStore.split(':')[1];
      const tconectToken = cfg['tconect_api_token'] || "PNSAPIS";
      const tconectBase = cfg['tconect_api_url'] || "http://node.tconect.xyz:1116";

      // Construir a URL baseada no prefixo tconect:
      apiUrl = `${tconectBase}${path.startsWith('/') ? '' : '/'}${path}`;

      // Injetar o Token se houver placeholders ou se não estiver presente
      if (apiUrl.includes('?')) {
        apiUrl = apiUrl.replace('apikey=SeuToken', `apikey=${tconectToken}`)
          .replace('apikey=SUAKEY', `apikey=${tconectToken}`);
        if (!apiUrl.includes('apikey=')) {
          apiUrl += `&apikey=${tconectToken}`;
        }
      } else {
        apiUrl += `?apikey=${tconectToken}`;
      }

      // Substituir o valor e outros parâmetros
      apiUrl = apiUrl
        .replace('{valor}', encodedValue)
        .replace('{ddd}', valueStr.substring(0, 2))
        .replace('{telefone}', valueStr.substring(2));
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
        const errorBody = await response.text();
        console.error(`[DEBUG] Erro da API (${response.status}):`, errorBody);
        throw new Error(`O provedor retornou erro HTTP ${response.status}: ${errorBody.substring(0, 100)}`);
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
          if (k === 'status' && (
            val === false || val === 0 || String(val) === '0' ||
            ['false', 'error', 'fail', 'failed', 'erro', 'falha'].includes(String(val).toLowerCase())
          )) {
            isError = true;
          } else if (k !== 'status' && val && String(val).length > 2) {
            if (
              String(val).toLowerCase().includes('erro') ||
              String(val).toLowerCase().includes('falha') ||
              String(val).toLowerCase().includes('não encontrado') ||
              String(val).toLowerCase().includes('not found') ||
              String(val).toLowerCase().includes('invalid')
            ) {
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

      const PROVIDER_NAMES = [
        /iseek/gi, /duality/gi, /brasilpro/gi, /astra/gi,
        /tconect/gi, /panel\.api/gi, /node\.tc/gi
      ];

      if (typeof obj === 'string') {
        let cleaned = obj;
        PROVIDER_NAMES.forEach(re => { cleaned = cleaned.replace(re, 'InfoEasy'); });
        return cleaned;
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

    // Desembrulhar campos wrapper comuns (TConect, panel, etc.)
    // TConect tipicamente retorna: { status: true, data: { ...dados reais... } }
    // Desembrulhar campos wrapper comuns (TConect, panel, etc.)
    const unwrapped =
      (responseData.resultado !== undefined && responseData.resultado !== null && typeof responseData.resultado === 'object')
        ? responseData.resultado
        : (responseData.RESULTADOS !== undefined && responseData.RESULTADOS !== null && typeof responseData.RESULTADOS === 'object')
          ? responseData.RESULTADOS
          : (responseData.data !== undefined && responseData.data !== null && typeof responseData.data === 'object')
            ? responseData.data
            : (responseData.dados !== undefined && responseData.dados !== null && typeof responseData.dados === 'object')
              ? responseData.dados
              : (responseData.retorno !== undefined && responseData.retorno !== null && typeof responseData.retorno === 'object')
                ? responseData.retorno
                : (responseData.response !== undefined && responseData.response !== null && typeof responseData.response === 'object')
                  ? responseData.response
                  : responseData;

    const cleanData = sanitizeData(unwrapped);

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
