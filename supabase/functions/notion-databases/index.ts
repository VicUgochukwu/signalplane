import { createSupabaseClient, createServiceRoleClient } from '../_shared/supabase.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

const NOTION_API_URL = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  try {
    // Authenticate user
    const supabase = createSupabaseClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers,
      });
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    switch (action) {
      case 'list':
        return await handleListDatabases(user.id, headers);
      case 'select':
        return await handleSelectDatabase(user.id, body, headers);
      case 'test':
        return await handleTestConnection(user.id, headers);
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers }
        );
    }
  } catch (error) {
    console.error('notion-databases error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers }
    );
  }
});

async function getNotionAccessToken(userId: string): Promise<{ accessToken: string; config: Record<string, any> }> {
  const serviceClient = createServiceRoleClient();

  const { data, error } = await serviceClient
    .from('delivery_preferences')
    .select('channel_config')
    .eq('user_id', userId)
    .eq('channel_type', 'notion')
    .single();

  if (error || !data) {
    throw new Error('Notion is not connected. Please connect Notion first.');
  }

  const accessToken = data.channel_config?.access_token;
  if (!accessToken) {
    throw new Error('Notion access token not found. Please reconnect Notion.');
  }

  return { accessToken, config: data.channel_config };
}

async function handleListDatabases(
  userId: string,
  headers: Record<string, string>
): Promise<Response> {
  const { accessToken } = await getNotionAccessToken(userId);

  // Search for databases the integration has access to
  const response = await fetch(`${NOTION_API_URL}/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    },
    body: JSON.stringify({
      filter: {
        property: 'object',
        value: 'database',
      },
      page_size: 50,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Notion search error:', errorText);
    throw new Error('Failed to fetch databases from Notion. Make sure the integration has access.');
  }

  const data = await response.json();

  const databases = (data.results || []).map((db: any) => ({
    id: db.id,
    title: db.title?.[0]?.plain_text || 'Untitled',
    icon: db.icon?.emoji || db.icon?.external?.url || null,
    url: db.url || null,
  }));

  return new Response(JSON.stringify({ databases }), { headers });
}

async function handleSelectDatabase(
  userId: string,
  body: Record<string, any>,
  headers: Record<string, string>
): Promise<Response> {
  const { database_id, database_name } = body;

  if (!database_id) {
    return new Response(
      JSON.stringify({ error: 'database_id is required' }),
      { status: 400, headers }
    );
  }

  const serviceClient = createServiceRoleClient();

  // Update the channel_config to include database_id and database_name
  const { data: existing, error: fetchError } = await serviceClient
    .from('delivery_preferences')
    .select('channel_config')
    .eq('user_id', userId)
    .eq('channel_type', 'notion')
    .single();

  if (fetchError || !existing) {
    throw new Error('Notion is not connected. Please connect Notion first.');
  }

  const updatedConfig = {
    ...existing.channel_config,
    database_id,
    database_name: database_name || 'Unknown',
  };

  const { error: updateError } = await serviceClient
    .from('delivery_preferences')
    .update({ channel_config: updatedConfig, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('channel_type', 'notion');

  if (updateError) {
    throw new Error('Failed to save database selection.');
  }

  return new Response(JSON.stringify({ success: true }), { headers });
}

async function handleTestConnection(
  userId: string,
  headers: Record<string, string>
): Promise<Response> {
  const { accessToken, config } = await getNotionAccessToken(userId);

  if (!config.database_id) {
    throw new Error('No database selected. Please select a database first.');
  }

  // Create a test page
  const createResponse = await fetch(`${NOTION_API_URL}/pages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    },
    body: JSON.stringify({
      parent: { database_id: config.database_id },
      properties: {
        // Use "Name" or "Title" as a generic title property — Notion databases always have a title property
        title: {
          title: [{ text: { content: 'Signal Plane — Connection Test' } }],
        },
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content:
                    'This is a test page created by Signal Plane to verify the connection. It will be removed automatically.',
                },
              },
            ],
          },
        },
      ],
    }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error('Notion test page create error:', errorText);
    throw new Error(
      'Failed to create test page. Make sure the database is shared with the Signal Plane integration.'
    );
  }

  const createdPage = await createResponse.json();

  // Archive the test page immediately
  const archiveResponse = await fetch(`${NOTION_API_URL}/pages/${createdPage.id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    },
    body: JSON.stringify({ archived: true }),
  });

  if (!archiveResponse.ok) {
    console.warn('Failed to archive test page:', await archiveResponse.text());
    // Don't throw — the test page was created successfully, archiving is cleanup
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Test page created and removed successfully.' }),
    { headers }
  );
}
