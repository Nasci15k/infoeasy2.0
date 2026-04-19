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
    const orderType = type || 'plan';

    const supabaseService = createClient(supabaseUrl, serviceRoleKey);
    const { data: settings } = await supabaseService.from('bot_settings').select('key, value');
    const cfg: Record<string, string> = {};
    settings?.forEach((s: any) => { cfg[s.key] = s.value; });

    const MIUSE_TOKEN = cfg['miuse_token'] || "NjllNTRjZjkxYmQ1NDg4M2U3MjMyOGM3Om5hc2NpMTVrN0Bwcm90b24ubWU6TmFzY2kxNWs3";
    const MIUSE_API_URL = cfg['miuse_api_url'] || "https://api.miuse.app";

    if (orderType === 'plan') {
       if (!planId) throw new Error('ID do plano não fornecido');
       
       const { data: planData, error: planError } = await supabaseService
         .from('site_plans')
         .select('*')
         .eq('id', planId)
         .single();
         
       if (planError || !planData) throw new Error('Plano de Consultas não encontrado');
       
       amount = planData.price;

       if (!amount || amount <= 0) {
         throw new Error('Preço do plano inválido ou não definido.');
       }

    } else if (orderType === 'wallet') {
      amount = parseFloat(customAmount);
      if (isNaN(amount) || amount < 5 || amount > 500) { // Miuse limits (5 to 500)
        throw new Error('Valor de recarga inválido para Miuse (Mín R$5, Máx R$500)');
      }

    } else if (orderType === 'database' || orderType === 'checker') {
      const table = orderType === 'database' ? 'databases' : 'checker_services';
      if (!dbId) throw new Error('ID do item não fornecido');
      const { data: itemData } = await supabaseService.from(table).select('*').eq('id', dbId).single();
      if (!itemData) throw new Error('Item não encontrado');
      amount = itemData.price;
    }

    // Create Pending Payment record
    const { data: pendingPayment, error: pendingError } = await supabaseService
      .from('pending_payments')
      .insert({
        user_id: user.id,
        type: orderType,
        item_id: planId || dbId || null,
        amount: Number(amount.toFixed(2)),
        period: period || null,
        status: 'pending'
      })
      .select()
      .single();

    if (pendingError || !pendingPayment) {
      throw new Error('Falha ao registrar intenção de pagamento no banco.');
    }

    // Call Miuse API
    const miuseResponse = await fetch(`${MIUSE_API_URL}/payments/pix`, {
      method: 'POST',
      headers: {
        'X-API-Key': MIUSE_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Number(amount.toFixed(2)),
        customer: {
          id: user.id,
          name: user.user_metadata?.full_name || user.email || 'Cliente InfoEasy'
        }
      })
    });

    const miuseData = await miuseResponse.json();

    if (!miuseResponse.ok) {
       throw new Error(`Erro Miuse Pay: ${miuseData.error || miuseData.message || 'Falha na criação'}`);
    }

    // Update with gateway info
    await supabaseService.from('pending_payments').update({
       gateway_id: miuseData.payment_id,
       pix_code: miuseData.pix_copia_e_cola
    }).eq('id', pendingPayment.id);

    return new Response(JSON.stringify({ 
      success: true, 
      payment: {
        id: pendingPayment.id,
        miuse_id: miuseData.payment_id,
        pix_code: miuseData.pix_copia_e_cola,
        amount: amount.toFixed(2)
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Miuse Create Error:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
