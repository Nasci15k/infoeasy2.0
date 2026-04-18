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
      // Support both field names used by different C7 API versions
      const externalId = payload.data.externalId || payload.data.correlationID;
      const paidAmount = parseFloat(payload.data.amount || 0);

      if (!externalId) {
        console.warn('No externalId/correlationID in payload');
        return new Response('OK', { status: 200 });
      }

      const incomingTxId = externalId;

      // 1. Fetch the original payment details using the short TxID
      const { data: pending, error: searchError } = await serviceClient
        .from('pending_payments')
        .select('*')
        .eq('txid', incomingTxId)
        .single();

      if (searchError || !pending) {
        console.error('Pending payment not found for ID:', pendingId);
        return new Response('OK', { status: 200 }); // Return 200 to stop retries if not our business
      }

      if (pending.status === 'confirmed') {
        console.log('Payment already processed:', pendingId);
        return new Response('OK', { status: 200 });
      }

      const userId = pending.user_id;
      const orderType = pending.type;
      const itemId = pending.item_id;
      const period = pending.period;

      console.log(`Processing Fulfillment: userId=${userId}, type=${orderType}, item=${itemId}`);

      if (orderType === 'plan') {
        const { data: plan, error: planError } = await serviceClient
          .from('site_plans')
          .select('*')
          .eq('id', itemId)
          .single();

        let durationDays = (period === 'weekly') ? 7 : 30;

        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + durationDays);

        await serviceClient.from('profiles').update({
          status: 'approved',
          plan_type: plan?.name || 'Plano Ativo',
          plan_expires_at: expirationDate.toISOString()
        }).eq('id', userId);

        await serviceClient.from('wallet_transactions').insert({
          user_id: userId,
          amount: paidAmount,
          type: 'purchase_plan',
          description: `Assinatura: ${plan?.name || itemId} — ${durationDays} dias`
        });

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

      // Mark as confirmed
      await serviceClient.from('pending_payments').update({ status: 'confirmed' }).eq('id', pending.id);
      console.log(`Transaction ${pendingId} finalized successfully.`);
    }

    return new Response('OK', { status: 200 });

  } catch (e: any) {
    console.error('Webhook Error:', e.message);
    return new Response('Server Error', { status: 500 });
  }
});
