export function buildSlackOAuthUrl(state: string): string {
  const clientId = Deno.env.get('SLACK_CLIENT_ID');
  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/slack-oauth-callback`;

  const scopes = ['incoming-webhook', 'chat:write', 'channels:read'].join(',');

  const params = new URLSearchParams({
    client_id: clientId!,
    scope: scopes,
    redirect_uri: redirectUri,
    state: state,
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export function buildNotionOAuthUrl(state: string): string {
  const clientId = Deno.env.get('NOTION_CLIENT_ID');
  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/notion-oauth-callback`;

  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    response_type: 'code',
    owner: 'user',
    state: state,
  });

  return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
}
