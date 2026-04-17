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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Configuração do backend incompleta.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Client for authenticating the current user
    const authClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization') ?? '',
        },
      },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();

    if (userError || !user) {
      console.error('Auth error in ensure-profile:', userError);
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service-role client to bypass RLS for setup operations
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    // Ensure profile exists
    const { data: existingProfile, error: profileSelectError } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileSelectError) {
      console.error('Error selecting profile in ensure-profile:', profileSelectError);
      throw profileSelectError;
    }

    let profile = existingProfile;

    if (!profile) {
      const fullName = (user.user_metadata as any)?.full_name ?? null;
      const sellerCode = (user.user_metadata as any)?.seller_code ?? null;
      const termsAcceptedAt = (user.user_metadata as any)?.terms_accepted_at ?? null;

      const { data: insertedProfile, error: insertProfileError } = await serviceClient
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: fullName,
          seller_code: sellerCode,
          status: 'pending',
          role: 'usuario',
          balance: 0,
          plan_type: 'free',
          terms_accepted_at: termsAcceptedAt,
        })
        .select('*')
        .single();

      if (insertProfileError) {
        console.error('Error inserting profile in ensure-profile:', insertProfileError);
        throw insertProfileError;
      }

      profile = insertedProfile;
    }

    // Ensure user_limits exists
    const { data: existingLimits, error: limitsSelectError } = await serviceClient
      .from('user_limits')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (limitsSelectError) {
      console.error('Error selecting user_limits in ensure-profile:', limitsSelectError);
      throw limitsSelectError;
    }

    if (!existingLimits) {
      const { error: insertLimitsError } = await serviceClient
        .from('user_limits')
        .insert({ user_id: user.id });

      if (insertLimitsError) {
        console.error('Error inserting user_limits in ensure-profile:', insertLimitsError);
        throw insertLimitsError;
      }
    }

    // Ensure user_roles exists with default role "teste"
    const { data: existingRole, error: roleSelectError } = await serviceClient
      .from('user_roles')
      .select('id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleSelectError) {
      console.error('Error selecting user_roles in ensure-profile:', roleSelectError);
      throw roleSelectError;
    }

    if (!existingRole) {
      const { error: insertRoleError } = await serviceClient
        .from('user_roles')
        .insert({ user_id: user.id, role: 'teste' as any });

      if (insertRoleError) {
        console.error('Error inserting user_roles in ensure-profile:', insertRoleError);
        throw insertRoleError;
      }
    }

    return new Response(
      JSON.stringify({ profile }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in ensure-profile function:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
