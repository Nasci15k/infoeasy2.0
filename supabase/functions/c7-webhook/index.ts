import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as crypto from "node:crypto";

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    // Use the environment secret — NOT the database
    const apiSecret = Deno.env.get('C7_API_SECRET');

    if (!supabaseUrl || !supabaseServiceKey || !apiSecret) {
      console.error('Missing server config');
      return new Response('Server Error', { status: 500 });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const sig = req.headers.get("x-c7-signature");
    const ts = req.headers.get("x-c7-timestamp");
    const bodyText = await req.text();

    if (!sig || !ts) {
      return new Response('Missing signature headers', { status: 401 });
    }

    // Validate timestamp window (5 min)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(ts)) > 300) {
      return new Response('Timestamp expired', { status: 401 });
    }

    // Validate HMAC
    const expected = crypto.createHmac("sha256", apiSecret)
      .update(ts + "." + bodyText)
      .digest("hex");

    if (sig !== expected) {
      console.error('HMAC mismatch. Got:', sig, 'Expected:', expected);
      return new Response('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(bodyText);
    console.log('C7 Webhook received:', payload.event);

    if (payload.event === 'payment.confirmed') {
      const externalId = payload.data.correlationID;
      const paidAmount = parseFloat(payload.data.amount || 0);

      if (!externalId) {
        return new Response('OK', { status: 200 });
      }

      // Format: USER_UUID_orderType_itemId_timestamp
      // e.g.: "550e8400-e29b-41d4-a716-446655440000_plan_abc-plan-uuid_1713289200000"
      const parts = externalId.split('_');
      if (parts.length < 3) {
        console.warn('Unexpected externalId format:', externalId);
        return new Response('OK', { status: 200 });
      }

      // UUID has 5 parts separated by hyphens, so we need to reconstruct
      // Format: `${userId}_${orderType}_${itemId}_${timestamp}`
      // userId is a full UUID (36 chars), so let's parse by position
      const userId = parts[0]; // full UUID
      const orderType = parts[1]; // plan | wallet | database
      const itemId = parts[2]; // planId UUID or 'wallet'

      console.log(`Processing: userId=${userId}, type=${orderType}, item=${itemId}`);

      if (orderType === 'plan') {
        // Look up the plan from site_plans to get duration and limit
        const { data: plan, error: planError } = await serviceClient
          .from('site_plans')
          .select('*')
          .eq('id', itemId)
          .single();

        let dailyLimit = 100;
        let durationDays = 30;

        if (plan && !planError) {
          dailyLimit = plan.daily_limit || 100;
          // Determine duration by price comparison
          if (paidAmount <= (plan.price_weekly || 0) + 2) {
            durationDays = 7; // Weekly
          } else {
            durationDays = 30; // Monthly
          }
        }

        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + durationDays);

        await serviceClient.from('profiles').update({
          status: 'approved',
          plan_type: plan?.name || 'Plano Ativo',
          plan_expires_at: expirationDate.toISOString()
        }).eq('id', userId);

        // Log the transaction
        await serviceClient.from('wallet_transactions').insert({
          user_id: userId,
          amount: paidAmount,
          type: 'purchase_plan',
          description: `Assinatura: ${plan?.name || itemId} — ${durationDays} dias`
        });

        console.log(`Plan activated for user ${userId}: ${plan?.name}, ${durationDays} days`);

      } else if (orderType === 'wallet') {
        const { data: profile } = await serviceClient.from('profiles').select('balance').eq('id', userId).single();
        const newBalance = (parseFloat(profile?.balance || 0)) + paidAmount;

        await serviceClient.from('profiles').update({ balance: newBalance }).eq('id', userId);

        await serviceClient.from('wallet_transactions').insert({
          user_id: userId,
          amount: paidAmount,
          type: 'topup',
          description: `Recarga de carteira via Pix: R$ ${paidAmount.toFixed(2)}`
        });

        console.log(`Wallet topped up for user ${userId}: +R$${paidAmount}`);

      } else if (orderType === 'database') {
        await serviceClient.from('purchased_databases').upsert({
          user_id: userId,
          database_id: itemId
        });

        await serviceClient.from('wallet_transactions').insert({
          user_id: userId,
          amount: paidAmount,
          type: 'purchase_db',
          description: `Compra de Base de Dados (ID: ${itemId})`
        });

        console.log(`Database purchased for user ${userId}: ${itemId}`);
      }
    }

    return new Response('OK', { status: 200 });

  } catch (e: any) {
    console.error('Webhook Error:', e.message);
    return new Response('Server Error', { status: 500 });
  }
});
