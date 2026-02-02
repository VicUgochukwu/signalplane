import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { buildSlackOAuthUrl } from '../_shared/oauth-helpers.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient(req);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const state = btoa(
      JSON.stringify({
        user_id: user.id,
        timestamp: Date.now(),
        nonce: crypto.randomUUID(),
      })
    );

    const authUrl = buildSlackOAuthUrl(state);

    return new Response(JSON.stringify({ url: authUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
