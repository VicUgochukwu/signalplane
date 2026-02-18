import { createSupabaseClient, createServiceRoleClient } from '../_shared/supabase.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_BATCH_SIZE = 50; // Resend batch limit
const DAILY_SEND_LIMIT = 100; // Resend free tier

interface ResendEmail {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text?: string;
  reply_to?: string;
  headers?: Record<string, string>;
}

interface Recipient {
  user_id: string;
  email: string;
  display_name: string | null;
  unsubscribe_token: string;
}

// ---- Template personalization ----

function personalizeTemplate(
  template: string,
  vars: { first_name: string; email: string; company_name: string; unsubscribe_url: string }
): string {
  return template
    .replace(/\{\{first_name\}\}/g, vars.first_name || 'there')
    .replace(/\{\{email\}\}/g, vars.email)
    .replace(/\{\{company_name\}\}/g, vars.company_name || 'SignalPlane')
    .replace(/\{\{unsubscribe_url\}\}/g, vars.unsubscribe_url);
}

// ---- Resend API call ----

async function sendViaResend(emails: ResendEmail[]): Promise<{ data: { id: string }[] }> {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

  // Single email vs batch
  if (emails.length === 1) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emails[0]),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Resend API error ${response.status}: ${errorBody}`);
    }
    const result = await response.json();
    return { data: [{ id: result.id }] };
  }

  // Batch send
  const response = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emails),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend batch API error ${response.status}: ${errorBody}`);
  }
  return response.json();
}

// ---- Action handlers ----

async function handleSendTest(req: Request, headers: Record<string, string>) {
  // Auth: admin JWT required
  const userClient = createSupabaseClient(req);
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  const body = await req.json();
  const templateId = body.template_id;

  if (!templateId) {
    return new Response(JSON.stringify({ error: 'template_id is required' }), { status: 400, headers });
  }

  const serviceClient = createServiceRoleClient();

  // Load template
  const { data: templates, error: tplError } = await serviceClient.rpc('admin_get_newsletter_template', {
    p_template_id: templateId,
  });
  if (tplError || !templates || templates.length === 0) {
    return new Response(JSON.stringify({ error: 'Template not found' }), { status: 404, headers });
  }
  const template = templates[0];

  // Personalize for the admin
  const firstName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Admin';
  const unsubscribeUrl = 'https://signalplane.dev/unsubscribe?token=TEST_TOKEN';

  const personalizedSubject = personalizeTemplate(template.subject, {
    first_name: firstName,
    email: user.email || '',
    company_name: 'SignalPlane',
    unsubscribe_url: unsubscribeUrl,
  });

  const personalizedHtml = personalizeTemplate(template.body_html, {
    first_name: firstName,
    email: user.email || '',
    company_name: 'SignalPlane',
    unsubscribe_url: unsubscribeUrl,
  });

  const personalizedText = template.body_text
    ? personalizeTemplate(template.body_text, {
        first_name: firstName,
        email: user.email || '',
        company_name: 'SignalPlane',
        unsubscribe_url: unsubscribeUrl,
      })
    : undefined;

  // Send via Resend
  const resendEmail: ResendEmail = {
    from: `${body.from_name || 'SignalPlane'} <${body.from_email || 'hello@signalplane.dev'}>`,
    to: [user.email!],
    subject: `[TEST] ${personalizedSubject}`,
    html: personalizedHtml,
    text: personalizedText,
    reply_to: body.reply_to || 'hello@signalplane.dev',
  };

  const result = await sendViaResend([resendEmail]);

  return new Response(JSON.stringify({
    success: true,
    message: `Test email sent to ${user.email}`,
    resend_id: result.data[0]?.id,
  }), { status: 200, headers });
}

async function handleSendCampaign(req: Request, headers: Record<string, string>, opts?: { skipAuth?: boolean }) {
  // Auth: admin JWT required (skip when called internally from check_scheduled)
  if (!opts?.skipAuth) {
    const userClient = createSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }
  }

  const body = await req.json();
  const campaignId = body.campaign_id;
  if (!campaignId) {
    return new Response(JSON.stringify({ error: 'campaign_id is required' }), { status: 400, headers });
  }

  const serviceClient = createServiceRoleClient();

  // Load campaign
  const { data: campaigns, error: campError } = await serviceClient.rpc('admin_get_email_campaign', {
    p_campaign_id: campaignId,
  });
  if (campError || !campaigns || campaigns.length === 0) {
    return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404, headers });
  }
  const campaign = campaigns[0];

  if (!['draft', 'scheduled'].includes(campaign.status)) {
    return new Response(JSON.stringify({ error: `Cannot send campaign with status: ${campaign.status}` }), {
      status: 400, headers,
    });
  }

  // Check daily send limit
  const { count: todaySends } = await serviceClient
    .from('email_send_log')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

  if ((todaySends || 0) >= DAILY_SEND_LIMIT) {
    return new Response(JSON.stringify({
      error: `Daily send limit reached (${DAILY_SEND_LIMIT}). Try again tomorrow or upgrade your Resend plan.`,
    }), { status: 429, headers });
  }

  // Update campaign status to 'sending'
  await serviceClient
    .from('email_campaigns')
    .update({ status: 'sending', sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', campaignId)
    .eq('status', campaign.status); // Optimistic lock

  // Load template
  const { data: templates } = await serviceClient.rpc('admin_get_newsletter_template', {
    p_template_id: campaign.template_id,
  });
  if (!templates || templates.length === 0) {
    await serviceClient.from('email_campaigns').update({
      status: 'failed', metadata: { error: 'Template not found' }, updated_at: new Date().toISOString(),
    }).eq('id', campaignId);
    return new Response(JSON.stringify({ error: 'Template not found' }), { status: 404, headers });
  }
  const template = templates[0];

  // Evaluate segment — get ALL matching users (no limit)
  const { data: segmentUsers, error: segError } = await serviceClient.rpc('admin_preview_segment', {
    p_criteria: campaign.segment_criteria,
    p_limit: 10000, // Large limit to get all users
  });

  if (segError || !segmentUsers || segmentUsers.length === 0) {
    await serviceClient.from('email_campaigns').update({
      status: 'failed', metadata: { error: 'No matching users in segment' }, updated_at: new Date().toISOString(),
    }).eq('id', campaignId);
    return new Response(JSON.stringify({ error: 'No matching users in segment' }), { status: 400, headers });
  }

  // Filter out unsubscribed users
  const { data: unsubscribed } = await serviceClient
    .from('email_unsubscribe_tokens')
    .select('user_id')
    .eq('is_unsubscribed', true);

  const unsubscribedSet = new Set((unsubscribed || []).map((u: { user_id: string }) => u.user_id));
  const eligibleUsers = segmentUsers.filter(
    (u: { user_id: string }) => !unsubscribedSet.has(u.user_id)
  );

  if (eligibleUsers.length === 0) {
    await serviceClient.from('email_campaigns').update({
      status: 'failed', metadata: { error: 'All matching users are unsubscribed' }, updated_at: new Date().toISOString(),
    }).eq('id', campaignId);
    return new Response(JSON.stringify({ error: 'All matching users are unsubscribed' }), { status: 400, headers });
  }

  // Check if we'd exceed daily limit
  const remainingDaily = DAILY_SEND_LIMIT - (todaySends || 0);
  const usersToSend = eligibleUsers.slice(0, remainingDaily);

  // Update total_recipients
  await serviceClient.from('email_campaigns')
    .update({ total_recipients: usersToSend.length, updated_at: new Date().toISOString() })
    .eq('id', campaignId);

  // Ensure unsubscribe tokens exist for all recipients
  const recipients: Recipient[] = [];
  for (const u of usersToSend) {
    // Upsert unsubscribe token
    const { data: tokenData } = await serviceClient
      .from('email_unsubscribe_tokens')
      .upsert({ user_id: u.user_id }, { onConflict: 'user_id', ignoreDuplicates: true })
      .select('token')
      .single();

    // If upsert didn't return (already existed), fetch it
    let token = tokenData?.token;
    if (!token) {
      const { data: existing } = await serviceClient
        .from('email_unsubscribe_tokens')
        .select('token')
        .eq('user_id', u.user_id)
        .single();
      token = existing?.token || 'unknown';
    }

    recipients.push({
      user_id: u.user_id,
      email: u.email,
      display_name: u.display_name,
      unsubscribe_token: token,
    });
  }

  // Batch send
  let totalSent = 0;
  let totalFailed = 0;

  for (let i = 0; i < recipients.length; i += RESEND_BATCH_SIZE) {
    const batch = recipients.slice(i, i + RESEND_BATCH_SIZE);

    const emails: ResendEmail[] = batch.map((r) => {
      const firstName = r.display_name || r.email.split('@')[0] || 'there';
      const unsubscribeUrl = `https://signalplane.dev/unsubscribe?token=${r.unsubscribe_token}`;

      return {
        from: `${campaign.from_name} <${campaign.from_email}>`,
        to: [r.email],
        subject: personalizeTemplate(template.subject, {
          first_name: firstName,
          email: r.email,
          company_name: 'SignalPlane',
          unsubscribe_url: unsubscribeUrl,
        }),
        html: personalizeTemplate(template.body_html, {
          first_name: firstName,
          email: r.email,
          company_name: 'SignalPlane',
          unsubscribe_url: unsubscribeUrl,
        }),
        text: template.body_text
          ? personalizeTemplate(template.body_text, {
              first_name: firstName,
              email: r.email,
              company_name: 'SignalPlane',
              unsubscribe_url: unsubscribeUrl,
            })
          : undefined,
        reply_to: campaign.reply_to,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      };
    });

    try {
      const result = await sendViaResend(emails);
      const resendIds = result.data || [];

      // Log each send
      const logRows = batch.map((r, idx) => ({
        campaign_id: campaignId,
        recipient_id: r.user_id,
        recipient_email: r.email,
        resend_message_id: resendIds[idx]?.id || null,
        status: 'sent',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      await serviceClient.from('email_send_log').insert(logRows);
      totalSent += batch.length;
    } catch (batchError) {
      console.error(`Batch ${i / RESEND_BATCH_SIZE + 1} failed:`, batchError);

      // Log failures
      const failRows = batch.map((r) => ({
        campaign_id: campaignId,
        recipient_id: r.user_id,
        recipient_email: r.email,
        status: 'failed',
        failed_reason: (batchError as Error).message,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      await serviceClient.from('email_send_log').insert(failRows);
      totalFailed += batch.length;
    }
  }

  // Update campaign status
  const finalStatus = totalFailed === recipients.length ? 'failed' : 'sent';
  await serviceClient.from('email_campaigns').update({
    status: finalStatus,
    completed_at: new Date().toISOString(),
    metadata: { total_sent: totalSent, total_failed: totalFailed },
    updated_at: new Date().toISOString(),
  }).eq('id', campaignId);

  return new Response(JSON.stringify({
    success: true,
    campaign_id: campaignId,
    status: finalStatus,
    total_sent: totalSent,
    total_failed: totalFailed,
    total_recipients: recipients.length,
  }), { status: 200, headers });
}

async function handleCheckScheduled(req: Request, headers: Record<string, string>) {
  // Auth: n8n webhook secret
  const authSecret = req.headers.get('x-n8n-secret');
  if (authSecret !== Deno.env.get('N8N_WEBHOOK_SECRET')) {
    // Also accept admin JWT
    const userClient = createSupabaseClient(req);
    const { data: { user }, error } = await userClient.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }
  }

  const serviceClient = createServiceRoleClient();

  // Find campaigns past their scheduled time
  const { data: scheduled, error: queryError } = await serviceClient
    .from('email_campaigns')
    .select('id, name')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString());

  if (queryError) {
    return new Response(JSON.stringify({ error: queryError.message }), { status: 500, headers });
  }

  if (!scheduled || scheduled.length === 0) {
    return new Response(JSON.stringify({ message: 'No scheduled campaigns to send', count: 0 }), {
      status: 200, headers,
    });
  }

  // Process each scheduled campaign inline
  const results = [];
  for (const campaign of scheduled) {
    try {
      console.log(`Processing scheduled campaign: ${campaign.name} (${campaign.id})`);

      // Build a synthetic request with the campaign_id so handleSendCampaign can process it
      const campaignReq = new Request(req.url, {
        method: 'POST',
        headers: req.headers,
        body: JSON.stringify({ action: 'send_campaign', campaign_id: campaign.id }),
      });

      const sendResponse = await handleSendCampaign(campaignReq, headers, { skipAuth: true });
      const sendResult = await sendResponse.json();

      if (sendResponse.ok) {
        results.push({
          id: campaign.id,
          name: campaign.name,
          status: 'sent',
          total_sent: sendResult.total_sent,
          total_failed: sendResult.total_failed,
        });
      } else {
        results.push({
          id: campaign.id,
          name: campaign.name,
          status: 'error',
          error: sendResult.error,
        });
      }
    } catch (err) {
      console.error(`Failed to process campaign ${campaign.id}:`, err);
      // Mark campaign as failed
      await serviceClient.from('email_campaigns')
        .update({ status: 'failed', metadata: { error: (err as Error).message }, updated_at: new Date().toISOString() })
        .eq('id', campaign.id);
      results.push({ id: campaign.id, name: campaign.name, status: 'error', error: (err as Error).message });
    }
  }

  return new Response(JSON.stringify({
    message: `Processed ${results.length} scheduled campaign(s)`,
    results,
  }), { status: 200, headers });
}

// ---- Main handler ----

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers,
      });
    }

    // Clone request so we can read body in handlers
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);
    const action = body.action;

    // Reconstruct request with body for auth checking
    const newReq = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: bodyText,
    });

    switch (action) {
      case 'send_test':
        return await handleSendTest(newReq, headers);
      case 'send_campaign':
        return await handleSendCampaign(newReq, headers);
      case 'check_scheduled':
        return await handleCheckScheduled(newReq, headers);
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers,
        });
    }
  } catch (error) {
    console.error('Email send error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers,
    });
  }
});
