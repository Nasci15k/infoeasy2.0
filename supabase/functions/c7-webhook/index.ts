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

      // Format: {UUID-36chars}_{orderType}_{itemId}_{timestamp}
      // UUID is ALWAYS exactly 36 characters: 8-4-4-4-12 with hyphens
      // We cannot split by '_' alone because itemId might also be a UUID with hyphens
      if (externalId.length < 38) {
        console.warn('externalId too short to be valid:', externalId);
        return new Response('OK', { status: 200 });
      }

      const userId = externalId.substring(0, 36); // always 36 chars for UUID
      const afterUser = externalId.substring(37); // skip the '_' separator

      // orderType is the next segment before the first '_'
      const typeEnd = afterUser.indexOf('_');
      if (typeEnd === -1) {
        console.warn('Could not find orderType in externalId:', externalId);
        return new Response('OK', { status: 200 });
      }
      const orderType = afterUser.substring(0, typeEnd); // 'plan' | 'wallet' | 'database'
      const afterType = afterUser.substring(typeEnd + 1); // "{itemId}_{timestamp}"

      // timestamp is the last numeric segment; itemId is everything before it
      const lastUnderscore = afterType.lastIndexOf('_');
      const itemId = lastUnderscore !== -1 ? afterType.substring(0, lastUnderscore) : afterType;

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
