import { createServiceRoleClient } from '../_shared/supabase.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

interface ClassifiedChange {
  week_start_date: string;
  company_name: string;
  company_slug: string;
  url: string;
  url_type: string;
  primary_tag: string;
  diff_summary: string;
  implication: string;
  confidence: number;
  change_magnitude: string;
}

interface DeliveryPref {
  user_id: string;
  user_email: string;
  channel_type: string;
  channel_config: Record<string, any>;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Verify request is from n8n
    const authSecret = req.headers.get('x-n8n-secret');
    if (authSecret !== Deno.env.get('N8N_WEBHOOK_SECRET')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const { week_start_date } = await req.json();
    if (!week_start_date) {
      throw new Error('week_start_date is required');
    }

    const supabase = createServiceRoleClient();

    // 1. Fetch classified changes for the week
    const { data: changes, error: changesError } = await supabase.rpc('get_public_changelog');
    if (changesError) throw changesError;

    const weekChanges = (changes as ClassifiedChange[]).filter(
      (c) => c.week_start_date === week_start_date
    );

    if (weekChanges.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No changes for this week', week_start_date }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // 2. Fetch all enabled delivery preferences
    const { data: preferences, error: prefsError } = await supabase.rpc(
      'get_decrypted_delivery_channels'
    );
    if (prefsError) throw prefsError;

    if (!preferences || preferences.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No delivery preferences configured' }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // 3. Send reports
    const results = [];

    for (const pref of preferences as DeliveryPref[]) {
      try {
        if (pref.channel_type === 'slack') {
          await sendSlackReport(supabase, pref, weekChanges, week_start_date);
          results.push({ user_id: pref.user_id, channel: 'slack', status: 'success' });
        } else if (pref.channel_type === 'notion') {
          await sendNotionReport(supabase, pref, weekChanges, week_start_date);
          results.push({ user_id: pref.user_id, channel: 'notion', status: 'success' });
        }
      } catch (error) {
        console.error(`Failed to send to ${pref.channel_type}:`, error);
        results.push({
          user_id: pref.user_id,
          channel: pref.channel_type,
          status: 'failed',
          error: (error as Error).message,
        });

        await supabase.from('delivery_logs').insert({
          user_id: pref.user_id,
          channel_type: pref.channel_type,
          week_start_date,
          status: 'failed',
          error_message: (error as Error).message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Reports sent',
        week_start_date,
        changes_count: weekChanges.length,
        results,
      }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Send weekly report error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});

async function sendSlackReport(
  supabase: any,
  pref: DeliveryPref,
  changes: ClassifiedChange[],
  weekStart: string
) {
  const config = pref.channel_config;

  const magnitudeEmoji: Record<string, string> = {
    minor: '🟢',
    moderate: '🟡',
    major: '🔴',
  };

  // Group by company
  const byCompany: Record<string, ClassifiedChange[]> = {};
  for (const change of changes) {
    if (!byCompany[change.company_name]) byCompany[change.company_name] = [];
    byCompany[change.company_name].push(change);
  }

  const blocks: any[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `📊 Weekly Messaging Changes — ${weekStart}` },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Found *${changes.length}* change${changes.length === 1 ? '' : 's'} across *${Object.keys(byCompany).length}* companies this week.`,
      },
    },
    { type: 'divider' },
  ];

  for (const [company, companyChanges] of Object.entries(byCompany)) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*${company}*` },
    });

    for (const change of companyChanges) {
      const emoji = magnitudeEmoji[change.change_magnitude] || '⚪';
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            `${emoji} *${change.primary_tag}* (${change.change_magnitude})`,
            `_${change.diff_summary}_`,
            change.implication ? `💡 ${change.implication}` : '',
            `<${change.url}|View page>`,
          ]
            .filter(Boolean)
            .join('\n'),
        },
      });
    }

    blocks.push({ type: 'divider' });
  }

  // Send via webhook or chat.postMessage
  if (config.incoming_webhook_url) {
    const response = await fetch(config.incoming_webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });
    if (!response.ok) throw new Error(`Slack webhook error: ${response.statusText}`);
  } else if (config.access_token && config.channel_id) {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channel: config.channel_id, blocks }),
    });
    const data = await response.json();
    if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
  }

  await supabase.from('delivery_logs').insert({
    user_id: pref.user_id,
    channel_type: 'slack',
    week_start_date: weekStart,
    status: 'success',
  });
}

async function sendNotionReport(
  supabase: any,
  pref: DeliveryPref,
  changes: ClassifiedChange[],
  weekStart: string
) {
  const config = pref.channel_config;

  if (!config.database_id) {
    throw new Error('Notion database_id not configured');
  }

  for (const change of changes) {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.access_token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: config.database_id },
        properties: {
          Company: { title: [{ text: { content: change.company_name } }] },
          Tag: { rich_text: [{ text: { content: change.primary_tag } }] },
          Magnitude: { select: { name: change.change_magnitude } },
          Week: { date: { start: weekStart } },
          URL: { url: change.url },
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: change.diff_summary || '' } }],
            },
          },
          ...(change.implication
            ? [
                {
                  object: 'block' as const,
                  type: 'callout' as const,
                  callout: {
                    rich_text: [{ type: 'text' as const, text: { content: change.implication } }],
                    icon: { emoji: '💡' as const },
                  },
                },
              ]
            : []),
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API error: ${errorText}`);
    }
  }

  await supabase.from('delivery_logs').insert({
    user_id: pref.user_id,
    channel_type: 'notion',
    week_start_date: weekStart,
    status: 'success',
  });
}
