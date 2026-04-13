import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Node.js crypto module is available in modern Deno via compatibility layer
import * as crypto from "node:crypto";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Configuração incompleta');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não logado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { plan } = body; 
    
    let amount = 0;
    if (plan === 'diario') amount = 9.90;
    else if (plan === 'semanal') amount = 24.90;
    else if (plan === 'mensal') amount = 59.90;
    else {
      return new Response(JSON.stringify({ error: 'Plano inválido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const orderId = `${user.id}_${plan}_${Date.now()}`;

    // C7 API Keys
    const C7_API_KEY = Deno.env.get('C7_API_KEY') || 'c7_live_4072...31ac'; // The one provided by user
    const C7_API_SECRET = Deno.env.get('C7_API_SECRET') || 'd89a9d2cb8a8dfcdfbf0e05b24ab2ffd49f2a100cba7331d8aae44f8f6ceda0c87960dc3f2ee58234eb83fe87503192098709d66bb340021086a78aade251c6e'; // Given by user
    
    // We should ideally fetch real API Key/Secret from bot_settings or env constants
    const supabaseService = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: c7keys } = await supabaseService.from('bot_settings').select('key,value').in('key', ['c7_api_key', 'c7_api_secret']);
    
    let apiKey = C7_API_KEY;
    let apiSecret = C7_API_SECRET;

    if (c7keys && c7keys.length) {
      const dbKey = c7keys.find(k => k.key === 'c7_api_key')?.value;
      const dbSecret = c7keys.find(k => k.key === 'c7_api_secret')?.value;
      if (dbKey) apiKey = dbKey;
      if (dbSecret) apiSecret = dbSecret;
    }

    const payloadObj = {
      amount: amount,
      externalId: orderId,
      callbackUrl: `${supabaseUrl}/functions/v1/c7-webhook`
    };

    const payloadBody = JSON.stringify(payloadObj);
    const ts = Math.floor(Date.now() / 1000).toString();
    const sig = crypto.createHmac("sha256", apiSecret)
      .update(ts + "." + payloadBody)
      .digest("hex");

    const c7Response = await fetch('https://api.carteirado7.com/v2/payment/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-C7-Timestamp': ts,
        'X-C7-Signature': sig
      },
      body: payloadBody
    });

    const c7Data = await c7Response.json();

    if (!c7Response.ok || !c7Data.ok) {
       console.error("C7 Error", c7Data);
       throw new Error('Falha ao gerar o pagamento no servidor (C7)');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      payment: c7Data.payment 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
