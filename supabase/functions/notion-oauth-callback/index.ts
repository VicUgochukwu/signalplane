import { createServiceRoleClient } from '../_shared/supabase.ts';
import { verifySignedState } from '../_shared/oauth-state.ts';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const frontendUrl = Deno.env.get('FRONTEND_URL') || '';

    if (error) {
      console.error('Notion OAuth error from provider:', error);
      return new Response(null, {
        status: 302,
        headers: { Location: `${frontendUrl}/settings?notion_error=connection_failed` },
      });
    }

    if (!code || !state) {
      throw new Error('Missing authorization code');
    }

    // Verify cryptographic signature and extract user ID
    const stateData = await verifySignedState(state);
    const userId = stateData.user_id;

    // Exchange code for access token
    const clientId = Deno.env.get('NOTION_CLIENT_ID');
    const clientSecret = Deno.env.get('NOTION_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/notion-oauth-callback`;

    const auth = btoa(`${clientId}:${clientSecret}`);

    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Notion token exchange failed:', tokenData.error);
      throw new Error('Token exchange failed');
    }

    // Store credentials
    const supabase = createServiceRoleClient();

    const channelConfig = {
      access_token: tokenData.access_token,
      workspace_id: tokenData.workspace_id,
      workspace_name: tokenData.workspace_name,
      bot_id: tokenData.bot_id,
      database_id: null,
      page_id: null,
    };

    const { error: upsertError } = await supabase.from('delivery_preferences').upsert(
      {
        user_id: userId,
        channel_type: 'notion',
        channel_config: channelConfig,
        enabled: true,
      },
      { onConflict: 'user_id,channel_type' }
    );

    if (upsertError) throw upsertError;

    return new Response(null, {
      status: 302,
      headers: { Location: `${frontendUrl}/settings?notion_success=true` },
    });
  } catch (error) {
    console.error('Notion OAuth callback error:', error);
    const frontendUrl = Deno.env.get('FRONTEND_URL') || '';
    // Return generic error to avoid information leakage
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${frontendUrl}/settings?notion_error=connection_failed`,
      },
    });
  }
});
