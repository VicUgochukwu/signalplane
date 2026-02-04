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
      console.error('Slack OAuth error from provider:', error);
      return new Response(null, {
        status: 302,
        headers: { Location: `${frontendUrl}/settings?slack_error=connection_failed` },
      });
    }

    if (!code || !state) {
      throw new Error('Missing authorization code');
    }

    // Verify cryptographic signature and extract user ID
    const stateData = await verifySignedState(state);
    const userId = stateData.user_id;

    // Exchange code for access token
    const clientId = Deno.env.get('SLACK_CLIENT_ID');
    const clientSecret = Deno.env.get('SLACK_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/slack-oauth-callback`;

    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      console.error('Slack token exchange failed:', tokenData.error);
      throw new Error('Token exchange failed');
    }

    // Store credentials in delivery_preferences
    const supabase = createServiceRoleClient();

    const channelConfig = {
      access_token: tokenData.access_token,
      team_id: tokenData.team?.id,
      team_name: tokenData.team?.name,
      channel_id: tokenData.incoming_webhook?.channel_id,
      channel_name: tokenData.incoming_webhook?.channel,
      incoming_webhook_url: tokenData.incoming_webhook?.url,
    };

    const { error: upsertError } = await supabase.from('delivery_preferences').upsert(
      {
        user_id: userId,
        channel_type: 'slack',
        channel_config: channelConfig,
        enabled: true,
      },
      { onConflict: 'user_id,channel_type' }
    );

    if (upsertError) throw upsertError;

    return new Response(null, {
      status: 302,
      headers: { Location: `${frontendUrl}/settings?slack_success=true` },
    });
  } catch (error) {
    console.error('Slack OAuth callback error:', error);
    const frontendUrl = Deno.env.get('FRONTEND_URL') || '';
    // Return generic error to avoid information leakage
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${frontendUrl}/settings?slack_error=connection_failed`,
      },
    });
  }
});
