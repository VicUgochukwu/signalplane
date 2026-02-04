import { corsHeaders, handleCors, getCorsHeaders } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { buildSlackOAuthUrl } from '../_shared/oauth-helpers.ts';
import { createSignedState } from '../_shared/oauth-state.ts';

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
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    // Create cryptographically signed state to prevent CSRF/tampering
    const signedState = await createSignedState(user.id);
    const authUrl = buildSlackOAuthUrl(signedState);

    return new Response(JSON.stringify({ url: authUrl }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Slack OAuth start error:', error);
    return new Response(JSON.stringify({ error: 'Failed to initiate OAuth' }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
