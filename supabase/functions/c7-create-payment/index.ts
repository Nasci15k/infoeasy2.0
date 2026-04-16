import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as crypto from "node:crypto";

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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      throw new Error('Configuração incompleta do servidor');
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
    const { type, planId, period, amount: customAmount, dbId } = body; 
    
    let amount = 0;
    let orderDescription = '';
    const orderType = type || 'plan';

    const supabaseService = createClient(supabaseUrl, serviceRoleKey);
    
    if (orderType === 'plan') {
       if (!planId) throw new Error('ID do plano não fornecido');
       
       const { data: planData, error: planError } = await supabaseService
         .from('api_plans')
         .select('*')
         .eq('id', planId)
         .single();
         
       if (planError || !planData) throw new Error('Plano de API não encontrado');
       
       if (period === 'weekly') {
         amount = planData.price_weekly;
         orderDescription = `Assinatura Semanal: ${planData.name}`;
       } else if (period === 'monthly') {
         amount = planData.price_monthly;
         orderDescription = `Assinatura Mensal: ${planData.name}`;
       } else {
         throw new Error('Período de plano inválido (semanal/mensal)');
       }

       if (!amount || amount <= 0) {
         throw new Error('Este período não está disponível para este plano.');
       }

    } else if (orderType === 'wallet') {
      amount = parseFloat(customAmount);
      if (isNaN(amount) || amount < 1 || amount > 5000) {
        throw new Error('Valor de recarga inválido (Mín R$1, Máx R$5000)');
      }
      orderDescription = `Recarga de Carteira: R$ ${amount.toFixed(2)}`;

    } else if (orderType === 'database') {
      if (!dbId) throw new Error('ID da base de dados não fornecido');
      const { data: dbData } = await supabaseService.from('databases').select('*').eq('id', dbId).single();
      if (!dbData) throw new Error('Base de dados não encontrada');
      amount = dbData.price;
      orderDescription = `Aquisição de Base: ${dbData.name}`;
    }

    const orderId = `${user.id.substring(0,8)}_${Date.now()}`;

    // C7 API Keys
    const apiKey = Deno.env.get('C7_API_KEY');
    const apiSecret = Deno.env.get('C7_API_SECRET');

    if (!apiKey || !apiSecret) {
      throw new Error('Credenciais de pagamento (C7) não configuradas no servidor');
    }

    const payloadObj = {
      amount: amount,
      externalId: orderId,
      callbackUrl: `${supabaseUrl}/functions/v1/c7-webhook`,
      description: orderDescription
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
       console.error("C7 API Error", c7Data);
       throw new Error(`Erro no provedor de pagamento: ${c7Data.message || 'Falha na criação'}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      payment: c7Data.payment 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Payment Error:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), { 
      status: 200, // Return 200 to allow frontend to handle the error properly
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
