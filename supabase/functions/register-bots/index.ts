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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verificar que o usuário é admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar role admin
    const { data: profile } = await serviceClient
      .from('profiles').select('role').eq('id', user.id).single();

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { action } = body; // 'register_telegram' | 'register_discord' | 'save_settings'

    // Buscar todas as configurações
    const { data: settings } = await serviceClient
      .from('bot_settings').select('key, value');

    const cfg: Record<string, string> = {};
    settings?.forEach(s => { cfg[s.key] = s.value; });

    const botHandlerUrl = `${supabaseUrl}/functions/v1/bot-handler`;

    if (action === 'save_settings') {
      const { settings: newSettings } = body;
      for (const [key, value] of Object.entries(newSettings as Record<string, string>)) {
        await serviceClient
          .from('bot_settings')
          .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      }
      return new Response(JSON.stringify({ success: true, message: 'Configurações salvas!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'register_telegram') {
      const token = cfg['telegram_token'];
      if (!token) {
        return new Response(JSON.stringify({ error: 'Token do Telegram não configurado' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const webhookUrl = `${botHandlerUrl}?type=telegram`;
      const tgRes = await fetch(
        `https://api.telegram.org/bot${token}/setWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: webhookUrl,
            allowed_updates: ['message', 'callback_query'],
            drop_pending_updates: true,
          }),
        }
      );
      const tgData = await tgRes.json();

      return new Response(JSON.stringify({
        success: tgData.ok,
        message: tgData.ok ? `✅ Webhook Telegram registrado!` : `❌ Erro: ${tgData.description}`,
        webhook: webhookUrl,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'register_discord') {
      const appId = cfg['discord_app_id'];
      const discordToken = cfg['discord_token'];

      if (!appId || !discordToken) {
        return new Response(JSON.stringify({ error: 'App ID e Token do Discord são obrigatórios' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Registrar slash commands globais do Discord
      const commands = [
        { name: 'cpf',      description: '🔍 Consultar CPF — escolha o módulo', options: [{ type: 3, name: 'valor', description: 'Número do CPF (somente números)', required: true }] },
        { name: 'cnpj',     description: '🏢 Consultar CNPJ', options: [{ type: 3, name: 'valor', description: 'CNPJ (somente números)', required: true }] },
        { name: 'placa',    description: '🚗 Consultar Placa de Veículo', options: [{ type: 3, name: 'valor', description: 'Placa do veículo', required: true }] },
        { name: 'cep',      description: '📍 Consultar CEP / Endereço', options: [{ type: 3, name: 'valor', description: 'CEP (somente números)', required: true }] },
        { name: 'telefone', description: '📞 Consultar Telefone', options: [{ type: 3, name: 'valor', description: 'Número de telefone com DDD', required: true }] },
        { name: 'nome',     description: '👤 Consultar por Nome', options: [{ type: 3, name: 'valor', description: 'Nome completo', required: true }] },
        { name: 'email',    description: '📧 Consultar E-mail', options: [{ type: 3, name: 'valor', description: 'Endereço de e-mail', required: true }] },
        { name: 'ajuda',    description: '❓ Ver todos os comandos disponíveis' },
      ];

      const dcRes = await fetch(
        `https://discord.com/api/v10/applications/${appId}/commands`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bot ${discordToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(commands),
        }
      );
      const dcData = await dcRes.json();

      if (!dcRes.ok) {
        return new Response(JSON.stringify({
          success: false,
          message: `❌ Discord: ${JSON.stringify(dcData)}`,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Também registrar o webhook do bot
      const webhookUrl = `${botHandlerUrl}?type=discord`;
      return new Response(JSON.stringify({
        success: true,
        message: `✅ ${dcData.length} comandos Discord registrados! Configure o Interactions Endpoint URL no portal Discord para: ${webhookUrl}`,
        webhook: webhookUrl,
        commands: dcData.length,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('register-bots error:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno', message: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
