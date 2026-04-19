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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Configuração incompleta do servidor');
    }

    const { payment_id } = await req.json();
    if (!payment_id) throw new Error('payment_id não fornecido');

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    
    // Get config
    const { data: settings } = await serviceClient.from('bot_settings').select('key, value');
    const cfg: Record<string, string> = {};
    settings?.forEach((s: any) => { cfg[s.key] = s.value; });

    const MIUSE_TOKEN = cfg['miuse_token'] || "NjllNTRjZjkxYmQ1NDg4M2U3MjMyOGM3Om5hc2NpMTVrN0Bwcm90b24ubWU6TmFzY2kxNWs3";
    const MIUSE_API_URL = cfg['miuse_api_url'] || "https://api.miuse.app";

    // 1. Fetch the original payment details
    const { data: pending, error: searchError } = await serviceClient
      .from('pending_payments')
      .eq('gateway_id', payment_id)
      .single();

    if (searchError || !pending) {
      throw new Error('Pagamento não encontrado no banco de dados.');
    }

    if (pending.status === 'confirmed') {
      return new Response(JSON.stringify({ success: true, status: 'paid', already_processed: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 2. Check status via Miuse API
    const miuseResponse = await fetch(`${MIUSE_API_URL}/payments/status/${payment_id}`, {
      headers: { 'X-API-Key': MIUSE_TOKEN }
    });

    if (!miuseResponse.ok) {
       throw new Error(`Erro ao consultar Miuse Pay.`);
    }

    const miuseData = await miuseResponse.json();
    const isPaid = miuseData.status === 'paid';

    if (isPaid) {
      const { user_id: userId, type: orderType, item_id: itemId, period, amount: paidAmount } = pending;
      console.log(`Processing fulfillment for Miuse payment: ${payment_id}`);

      // --- START FULFILLMENT LOGIC (Mirrored from c7-webhook) ---
      if (orderType === 'plan') {
        const { data: plan } = await serviceClient
          .from('site_plans')
          .select('*')
          .eq('id', itemId)
          .single();

        if (!plan) throw new Error('Plano de fulfillment não encontrado.');

        const durationDays = plan.duration_days || 30;
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + durationDays);

        const updates: any = {};
        
        if (plan.plan_type === 'site' || plan.plan_type === 'both') {
          updates.plan_type = plan.name;
          updates.plan_expires_at = expirationDate.toISOString();
          // Site plans also grant Telegram access
          updates.telegram_expires_at = expirationDate.toISOString();
        } else if (plan.plan_type === 'telegram') {
          updates.telegram_expires_at = expirationDate.toISOString();
        }

        updates.status = 'approved';

        await serviceClient.from('profiles').update(updates).eq('id', userId);

        await serviceClient.from('wallet_transactions').insert({
          user_id: userId,
          amount: paidAmount,
          type: 'purchase_plan',
          description: `Assinatura: ${plan.name} — ${durationDays} dias (${plan.plan_type})`
        });

      } else if (orderType === 'wallet') {
        const { data: profile } = await serviceClient.from('profiles').select('balance').eq('id', userId).single();
        const newBalance = (parseFloat(profile?.balance || 0)) + Number(paidAmount);

        await serviceClient.from('profiles').update({ balance: newBalance }).eq('id', userId);

        await serviceClient.from('wallet_transactions').insert({
          user_id: userId,
          amount: paidAmount,
          type: 'topup',
          description: `Recarga de carteira via Pix (Miuse): R$ ${Number(paidAmount).toFixed(2)}`
        });

      } else if (orderType === 'database' || orderType === 'checker') {
        await serviceClient.from('purchased_databases').upsert({
          user_id: userId,
          database_id: itemId
        });

        await serviceClient.from('wallet_transactions').insert({
          user_id: userId,
          amount: paidAmount,
          type: 'purchase_db',
          description: `Compra de ${orderType === 'checker' ? 'Checker' : 'Base'} (ID: ${itemId})`
        });
      }

      // Mark as confirmed in our DB
      await serviceClient.from('pending_payments').update({ status: 'confirmed' }).eq('id', pending.id);
      // --- END FULFILLMENT LOGIC ---

      return new Response(JSON.stringify({ success: true, status: 'paid' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ success: true, status: miuseData.status }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('Miuse Check Error:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
