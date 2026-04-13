import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as crypto from "node:crypto";

serve(async (req) => {
  if (req.method === 'POST') {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Configuração incompleta');
      }

      const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

      // Fetch Secret to Verify HMAC
      const { data: c7keys } = await serviceClient.from('bot_settings').select('value').eq('key', 'c7_api_secret').single();
      const apiSecret = c7keys?.value || 'd89a9d2cb8a8dfcdfbf0e05b24ab2ffd49f2a100cba7331d8aae44f8f6ceda0c87960dc3f2ee58234eb83fe87503192098709d66bb340021086a78aade251c6e';

      const sig = req.headers.get("x-c7-signature");
      const ts = req.headers.get("x-c7-timestamp");
      const bodyText = await req.text();

      if (!sig || !ts) {
        return new Response('Missing headers', { status: 401 });
      }

      const expected = crypto.createHmac("sha256", apiSecret)
        .update(ts + "." + bodyText)
        .digest("hex");

      if (sig !== expected) {
        return new Response('Invalid signature', { status: 401 });
      }

      const payload = JSON.parse(bodyText);

      // Verify event
      if (payload.event === 'payment.confirmed') {
        const externalId = payload.data.correlationID; // e.g. "USERID_semanal_12345"
        
        if (!externalId) {
            return new Response('OK', { status: 200 });
        }

        const parts = externalId.split('_');
        if (parts.length >= 2) {
          const userId = parts[0];
          const plan = parts[1];

          // Determine limits
          let dailyLimit = 0;
          let expirationDate = new Date();

          if (plan === 'diario') {
             dailyLimit = 50;
             expirationDate.setDate(expirationDate.getDate() + 1);
          } else if (plan === 'semanal') {
             dailyLimit = 100;
             expirationDate.setDate(expirationDate.getDate() + 7);
          } else if (plan === 'mensal') {
             dailyLimit = 999999; // ilimitado
             expirationDate.setDate(expirationDate.getDate() + 30);
          }

          // 1. Approve User Status
          await serviceClient.from('profiles').update({ status: 'approved' }).eq('id', userId);

          // 2. Set limits
          await serviceClient.from('user_limits').upsert({
             user_id: userId,
             daily_limit: dailyLimit,
             daily_count: 0,
             monthly_limit: dailyLimit * 30, // Pro-rata just as fallback
             monthly_count: 0
          });

          // (Optional) We could store expiration date if standard tables support it.
        }
      }

      return new Response('OK', { status: 200 });

    } catch (e: any) {
      console.error('Webhook Error:', e);
      return new Response('Server Error', { status: 500 });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
});
