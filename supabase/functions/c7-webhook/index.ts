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
        const externalId = payload.data.correlationID; // e.g. "USERID_type_item_12345"
        
        if (!externalId) {
            return new Response('OK', { status: 200 });
        }

        const parts = externalId.split('_');
        if (parts.length >= 2) {
          const userId = parts[0];
          const orderType = parts[1]; // 'plan', 'wallet', 'database', 'api_plan'
          const item = parts[2];
          const amount = payload.data.amount;

          if (orderType === 'plan') {
            // Determine limits
            let dailyLimit = 0;
            let expirationDate = new Date();

            if (item === 'diario') {
               dailyLimit = 50;
               expirationDate.setDate(expirationDate.getDate() + 1);
            } else if (item === 'semanal') {
               dailyLimit = 100;
               expirationDate.setDate(expirationDate.getDate() + 7);
            } else if (item === 'mensal') {
               dailyLimit = 999999; 
               expirationDate.setDate(expirationDate.getDate() + 30);
            }

            await serviceClient.from('profiles').update({ 
                status: 'approved',
                plan_type: item,
                plan_expires_at: expirationDate.toISOString()
            }).eq('id', userId);

            await serviceClient.from('user_limits').upsert({
               user_id: userId,
               daily_limit: dailyLimit,
               daily_count: 0
            });

          } else if (orderType === 'wallet') {
            // Increment balance
            const { data: profile } = await serviceClient.from('profiles').select('balance').eq('id', userId).single();
            const newBalance = (profile?.balance || 0) + amount;
            
            await serviceClient.from('profiles').update({ balance: newBalance }).eq('id', userId);
            
            // Record transaction
            await serviceClient.from('wallet_transactions').insert({
              user_id: userId,
              amount: amount,
              type: 'topup',
              description: `Recarga de carteira via Pix: R$ ${amount.toFixed(2)}`
            });

          } else if (orderType === 'database') {
            const dbId = item;
            await serviceClient.from('purchased_databases').upsert({
              user_id: userId,
              database_id: dbId
            });
            
            await serviceClient.from('wallet_transactions').insert({
               user_id: userId,
               amount: amount,
               type: 'purchase_db',
               description: `Compra de Base de Dados (ID: ${dbId})`
            });
          }
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
