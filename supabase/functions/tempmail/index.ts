import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TEMPMAIL_API_BASE = 'https://api.tempmail.lol';

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    console.log('TempMail action:', action);

    if (action === 'create') {
      // Create new inbox
      const response = await fetch(`${TEMPMAIL_API_BASE}/v2/inbox/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TempMail create error:', errorText);
        throw new Error('Falha ao criar caixa de entrada');
      }

      const data = await response.json();
      console.log('TempMail inbox created:', data.address);
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'fetch') {
      const token = url.searchParams.get('token');
      
      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Token é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(`${TEMPMAIL_API_BASE}/v2/inbox?token=${token}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TempMail fetch error:', errorText);
        throw new Error('Falha ao buscar emails');
      }

      const data = await response.json();
      console.log('TempMail emails fetched:', data.emails?.length || 0);
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('TempMail error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
