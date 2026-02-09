import { createServiceRoleClient } from '../_shared/supabase.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { sendEvent } from '../_shared/loops.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const CONTROL_PLANE_URL = 'https://signalplane.dev/control-plane';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserContext {
  email: string;
  firstName: string;
  companyName: string;
  competitors: { name: string; domain: string; pageCount: number }[];
}

type DripKey =
  | 'edu_your_competitors'
  | 'edu_reading_packets'
  | 'edu_judgment_loop'
  | 'edu_integrations'
  | 'edu_power_tips'
  | 'pkt_preview'
  | 'pkt_first_ready'
  | 'pkt_already_waiting'
  | 'setup_nudge';

interface DripEmailRequest {
  user_id: string;
  drip_key: DripKey;
  context?: Record<string, any>;
}

// ─── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  try {
    // Verify request is from n8n
    const authSecret = req.headers.get('x-n8n-secret');
    if (authSecret !== Deno.env.get('N8N_WEBHOOK_SECRET')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers,
      });
    }

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const body: DripEmailRequest = await req.json();
    const { user_id, drip_key } = body;

    if (!user_id || !drip_key) {
      return new Response(
        JSON.stringify({ error: 'user_id and drip_key are required' }),
        { status: 400, headers }
      );
    }

    const supabase = createServiceRoleClient();

    // ── Check if already sent (idempotent) ────────────────────────────────
    const { data: existing } = await supabase
      .from('onboarding_drip_log')
      .select('id')
      .eq('user_id', user_id)
      .eq('drip_key', drip_key)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'already_sent' }),
        { headers }
      );
    }

    // ── Fetch user context ────────────────────────────────────────────────
    const userCtx = await fetchUserContext(supabase, user_id);
    if (!userCtx) {
      return new Response(
        JSON.stringify({ error: 'User not found or has no email' }),
        { status: 404, headers }
      );
    }

    // ── Build email ───────────────────────────────────────────────────────
    const email = buildEmail(drip_key, userCtx);
    if (!email) {
      return new Response(
        JSON.stringify({ error: `Unknown drip_key: ${drip_key}` }),
        { status: 400, headers }
      );
    }

    // ── Send via Resend ───────────────────────────────────────────────────
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Signal Plane <hello@signalplane.dev>',
        to: [userCtx.email],
        subject: email.subject,
        html: email.html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Resend error:', errorText);
      throw new Error(`Failed to send email: ${resendResponse.status}`);
    }

    // ── Log to drip table (idempotent insert) ─────────────────────────────
    await supabase.from('onboarding_drip_log').insert({
      user_id,
      drip_key,
    });

    // ── Fire Loops event (fire-and-forget) ────────────────────────────────
    sendEvent(userCtx.email, 'drip_sent', { drip_key }).catch(() => {});

    return new Response(
      JSON.stringify({
        success: true,
        drip_key,
        sent_to: userCtx.email,
      }),
      { headers }
    );
  } catch (error) {
    console.error('send-drip-email error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers }
    );
  }
});

// ─── User Context Fetcher ────────────────────────────────────────────────────

async function fetchUserContext(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string
): Promise<UserContext | null> {
  // Get user email and name
  const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
  if (authError || !authData?.user?.email) return null;

  const user = authData.user;
  const displayName =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    '';
  const firstName = displayName ? displayName.split(' ')[0] : user.email!.split('@')[0];

  // Get company profile
  const { data: profile } = await supabase
    .from('user_company_profiles')
    .select('company_name')
    .eq('user_id', userId)
    .maybeSingle();

  // Get tracked competitors with page counts
  const { data: competitors } = await supabase
    .from('user_tracked_competitors')
    .select('company_name, domain')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('priority', { ascending: true });

  const competitorList: UserContext['competitors'] = [];

  if (competitors) {
    for (const comp of competitors) {
      // Get page count for this competitor
      const { count } = await supabase
        .schema('core')
        .from('tracked_pages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('company_slug', comp.domain?.replace(/\./g, '-') || '')
        .eq('enabled', true);

      competitorList.push({
        name: comp.company_name,
        domain: comp.domain || '',
        pageCount: count || 0,
      });
    }
  }

  return {
    email: user.email!,
    firstName,
    companyName: profile?.company_name || 'your company',
    competitors: competitorList,
  };
}

// ─── Email Builder ───────────────────────────────────────────────────────────

function buildEmail(
  dripKey: DripKey,
  ctx: UserContext
): { subject: string; html: string } | null {
  switch (dripKey) {
    case 'edu_your_competitors':
      return buildEduYourCompetitors(ctx);
    case 'edu_reading_packets':
      return buildEduReadingPackets(ctx);
    case 'edu_judgment_loop':
      return buildEduJudgmentLoop(ctx);
    case 'edu_integrations':
      return buildEduIntegrations(ctx);
    case 'edu_power_tips':
      return buildEduPowerTips(ctx);
    case 'pkt_preview':
      return buildPktPreview(ctx);
    case 'pkt_first_ready':
      return buildPktFirstReady(ctx);
    case 'pkt_already_waiting':
      return buildPktAlreadyWaiting(ctx);
    case 'setup_nudge':
      return buildSetupNudge(ctx);
    default:
      return null;
  }
}

// ─── HTML Shell ──────────────────────────────────────────────────────────────

function wrapHtml(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:28px;">
      <img src="https://signalplane.dev/signal-plane-logo.png" alt="Signal Plane" width="40" height="40" style="display:block;margin:0 auto 12px;border-radius:10px;" />
      <h1 style="margin:0;color:#e5e7eb;font-size:20px;font-weight:700;">${esc(title)}</h1>
    </div>
    ${bodyContent}
    <div style="text-align:center;padding-top:24px;margin-top:24px;border-top:1px solid #1f2937;">
      <p style="margin:0;color:#6b7280;font-size:11px;">
        <a href="https://signalplane.dev" style="color:#06b6d4;text-decoration:none;">Signal Plane</a> &middot; Competitive intelligence on autopilot
      </p>
    </div>
  </div>
</body>
</html>`.trim();
}

function ctaButton(text: string, url: string): string {
  return `
    <div style="text-align:center;margin:24px 0;">
      <a href="${esc(url)}" style="display:inline-block;padding:12px 32px;background:#06b6d4;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
        ${esc(text)}
      </a>
    </div>`;
}

function card(content: string, borderColor = '#1f2937'): string {
  return `<div style="margin-bottom:16px;padding:16px;background:#1a1a2e;border-radius:8px;border-left:3px solid ${borderColor};">${content}</div>`;
}

function p(text: string, color = '#d1d5db'): string {
  return `<p style="margin:0 0 14px;color:${color};font-size:14px;line-height:1.7;">${text}</p>`;
}

function heading(text: string, color = '#e5e7eb'): string {
  return `<h2 style="margin:0 0 12px;color:${color};font-size:15px;font-weight:600;">${esc(text)}</h2>`;
}

function esc(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Education Track Emails ──────────────────────────────────────────────────

function buildEduYourCompetitors(ctx: UserContext) {
  const competitorRows = ctx.competitors.length > 0
    ? ctx.competitors.map(c =>
        `<tr>
          <td style="padding:8px 12px;color:#e5e7eb;font-size:13px;border-bottom:1px solid #1f2937;">${esc(c.name)}</td>
          <td style="padding:8px 12px;color:#9ca3af;font-size:13px;border-bottom:1px solid #1f2937;">${esc(c.domain)}</td>
          <td style="padding:8px 12px;color:#06b6d4;font-size:13px;border-bottom:1px solid #1f2937;text-align:center;">${c.pageCount}</td>
        </tr>`
      ).join('')
    : `<tr><td colspan="3" style="padding:12px;color:#9ca3af;font-size:13px;text-align:center;">No competitors tracked yet</td></tr>`;

  const body = `
    ${p(`Hi ${esc(ctx.firstName)},`)}
    ${p(`Welcome aboard! Signal Plane is now monitoring your competitive landscape around the clock. Here's what we're tracking for <strong style="color:#e5e7eb;">${esc(ctx.companyName)}</strong>:`)}

    <table style="width:100%;border-collapse:collapse;background:#1a1a2e;border-radius:8px;overflow:hidden;margin-bottom:16px;">
      <thead>
        <tr style="background:#111827;">
          <th style="padding:10px 12px;color:#9ca3af;font-size:11px;text-align:left;text-transform:uppercase;letter-spacing:1px;">Competitor</th>
          <th style="padding:10px 12px;color:#9ca3af;font-size:11px;text-align:left;text-transform:uppercase;letter-spacing:1px;">Domain</th>
          <th style="padding:10px 12px;color:#9ca3af;font-size:11px;text-align:center;text-transform:uppercase;letter-spacing:1px;">Pages</th>
        </tr>
      </thead>
      <tbody>${competitorRows}</tbody>
    </table>

    ${p('Every week, our AI crawls these pages for messaging changes, pricing shifts, new feature launches, and narrative pivots. You\'ll receive a personalized intel packet every Monday.')}
    ${p('Want to add more competitors or adjust tracked pages? You can do that anytime from your control plane.')}
    ${ctaButton('View Your Control Plane', CONTROL_PLANE_URL)}
  `;

  return {
    subject: `Here's What We're Tracking For ${ctx.companyName}`,
    html: wrapHtml("Here's What We're Tracking", body),
  };
}

function buildEduReadingPackets(ctx: UserContext) {
  const sections = [
    { name: 'Messaging Intel', color: '#06b6d4', desc: 'Tracks how competitors describe their product, value props, and positioning. Spot when they shift messaging before your market notices.' },
    { name: 'Narrative Intel', color: '#a855f7', desc: 'Monitors the broader story competitors tell about the market. Understand how they\'re trying to shape industry perception.' },
    { name: 'ICP Intel', color: '#22c55e', desc: 'Watches for changes in who competitors are targeting. New personas, verticals, or use cases they\'re pursuing.' },
    { name: 'Horizon Intel', color: '#f59e0b', desc: 'Detects new features, products, or strategic bets. Know what\'s coming before it ships.' },
    { name: 'Objection Intel', color: '#ef4444', desc: 'Identifies competitive battlecards, comparison pages, and objection-handling tactics being used against you.' },
  ];

  const sectionCards = sections.map(s =>
    card(`
      <h3 style="margin:0 0 6px;color:${s.color};font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">${s.name}</h3>
      <p style="margin:0;color:#d1d5db;font-size:13px;line-height:1.6;">${s.desc}</p>
    `, s.color)
  ).join('');

  const body = `
    ${p(`Hi ${esc(ctx.firstName)},`)}
    ${p('Your weekly intel packet is packed with insights. Here\'s how to get the most from each section:')}
    ${sectionCards}
    ${p('Each section includes <strong style="color:#e5e7eb;">highlights</strong> (what changed) and <strong style="color:#22c55e;">action items</strong> (what to do about it). Start with the executive summary for a quick overview, then dive into the sections most relevant to your current priorities.')}
    ${ctaButton('Read Your Latest Packet', CONTROL_PLANE_URL)}
  `;

  return {
    subject: 'How to Read Your Intel Packet (5 Sections Explained)',
    html: wrapHtml('How to Read Your Intel Packet', body),
  };
}

function buildEduJudgmentLoop(ctx: UserContext) {
  const body = `
    ${p(`Hi ${esc(ctx.firstName)},`)}
    ${p('Signal Plane has a feature most users don\'t discover until week 3. We want you to know about it now.')}

    ${heading('The Judgment Loop')}

    ${card(`
      <p style="margin:0 0 10px;color:#d1d5db;font-size:14px;line-height:1.7;">When you read your intel packet, you'll see <strong style="color:#22c55e;">Agree</strong> and <strong style="color:#ef4444;">Disagree</strong> buttons on predictions and insights.</p>
      <p style="margin:0;color:#d1d5db;font-size:14px;line-height:1.7;">This isn't just feedback &mdash; it's <strong style="color:#e5e7eb;">training data</strong>. Every time you agree or disagree, Signal Plane learns how <em>you</em> think about your market.</p>
    `, '#a855f7')}

    ${p('<strong style="color:#e5e7eb;">How it works:</strong>')}

    ${card(`
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
        <span style="color:#22c55e;font-size:16px;">1.</span>
        <p style="margin:0;color:#d1d5db;font-size:13px;">Read an insight or prediction in your packet</p>
      </div>
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
        <span style="color:#22c55e;font-size:16px;">2.</span>
        <p style="margin:0;color:#d1d5db;font-size:13px;">Click <strong style="color:#22c55e;">Agree</strong> or <strong style="color:#ef4444;">Disagree</strong></p>
      </div>
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
        <span style="color:#22c55e;font-size:16px;">3.</span>
        <p style="margin:0;color:#d1d5db;font-size:13px;">Optionally add a note explaining your reasoning</p>
      </div>
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <span style="color:#22c55e;font-size:16px;">4.</span>
        <p style="margin:0;color:#d1d5db;font-size:13px;">Future packets improve based on your input</p>
      </div>
    `)}

    ${p('The more you use it, the sharper your packets become. Think of it as training a junior analyst who gets smarter every week.')}
    ${ctaButton('Try the Judgment Loop', CONTROL_PLANE_URL)}
  `;

  return {
    subject: 'Your Secret Weapon: The Judgment Loop',
    html: wrapHtml('Your Secret Weapon', body),
  };
}

function buildEduIntegrations(ctx: UserContext) {
  const integrations = [
    { name: 'Slack', icon: '#', color: '#E01E5A', desc: 'Get intel packets posted directly to your team channel. No more forwarding emails.' },
    { name: 'Notion', icon: '#', color: '#ffffff', desc: 'Auto-create pages in your Notion database with structured intel data. Perfect for team wikis.' },
    { name: 'Email', icon: '#', color: '#06b6d4', desc: 'Receive polished HTML packets in your inbox every Monday. Share with your team.' },
  ];

  const integrationCards = integrations.map(i =>
    card(`
      <h3 style="margin:0 0 6px;color:${i.color};font-size:14px;">${i.name}</h3>
      <p style="margin:0;color:#d1d5db;font-size:13px;line-height:1.6;">${i.desc}</p>
    `)
  ).join('');

  const body = `
    ${p(`Hi ${esc(ctx.firstName)},`)}
    ${p('Signal Plane works best when intel reaches you where you already work. Connect your favorite tools to get packets delivered automatically:')}
    ${integrationCards}
    ${p('Setting up takes less than 2 minutes. Just click the integration you want and follow the OAuth flow.')}
    ${ctaButton('Set Up Integrations', CONTROL_PLANE_URL + '?tab=integrations')}
  `;

  return {
    subject: 'Get Intel Where You Work (Slack, Notion, Email)',
    html: wrapHtml('Get Intel Where You Work', body),
  };
}

function buildEduPowerTips(ctx: UserContext) {
  const tips = [
    { title: 'Add competitors mid-cycle', desc: 'New competitor on your radar? Add them anytime and they\'ll be included in your next Monday packet.' },
    { title: 'Export packets as Markdown', desc: 'Click the download button on any packet to get a clean Markdown file. Perfect for pasting into Notion, Docs, or your team wiki.' },
    { title: 'Use predictions to plan ahead', desc: 'Each packet includes AI predictions with confidence scores. Use these to anticipate competitor moves before they happen.' },
    { title: 'Review action items weekly', desc: 'The "This Week" section gives you concrete actions. Add these to your sprint planning for competitive advantage.' },
    { title: 'Train the AI with the Judgment Loop', desc: 'The more you agree/disagree with insights, the more accurate your packets become. Aim for 5+ judgments per packet.' },
  ];

  const tipCards = tips.map((t, i) =>
    card(`
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <span style="color:#f59e0b;font-size:18px;font-weight:700;min-width:20px;">${i + 1}</span>
        <div>
          <h3 style="margin:0 0 4px;color:#e5e7eb;font-size:14px;">${t.title}</h3>
          <p style="margin:0;color:#d1d5db;font-size:13px;line-height:1.5;">${t.desc}</p>
        </div>
      </div>
    `, '#f59e0b')
  ).join('');

  const body = `
    ${p(`Hi ${esc(ctx.firstName)},`)}
    ${p('You\'ve been using Signal Plane for a bit now. Here are 5 power tips from our most active users:')}
    ${tipCards}
    ${p('Have questions or feedback? Reply to this email &mdash; we read every response.')}
    ${ctaButton('Open Your Control Plane', CONTROL_PLANE_URL)}
  `;

  return {
    subject: '5 Power Tips From Top Signal Plane Users',
    html: wrapHtml('5 Power Tips', body),
  };
}

// ─── Packet-Aware Track Emails ───────────────────────────────────────────────

function buildPktPreview(ctx: UserContext) {
  const competitorList = ctx.competitors.length > 0
    ? ctx.competitors.map(c => `<li style="color:#d1d5db;font-size:13px;margin-bottom:4px;">${esc(c.name)} (${c.pageCount} pages)</li>`).join('')
    : '<li style="color:#9ca3af;font-size:13px;">Your tracked competitors</li>';

  const body = `
    ${p(`Hi ${esc(ctx.firstName)},`)}
    ${p('Your first intel packet ships <strong style="color:#f59e0b;">this Monday</strong>. Here\'s what to expect:')}

    ${card(`
      ${heading('What\'s inside your packet')}
      <ul style="margin:0;padding-left:20px;">
        <li style="color:#d1d5db;font-size:13px;margin-bottom:6px;"><strong style="color:#06b6d4;">Executive Summary</strong> &mdash; Key changes at a glance</li>
        <li style="color:#d1d5db;font-size:13px;margin-bottom:6px;"><strong style="color:#a855f7;">5 Intel Sections</strong> &mdash; Messaging, Narrative, ICP, Horizon, Objection</li>
        <li style="color:#d1d5db;font-size:13px;margin-bottom:6px;"><strong style="color:#22c55e;">Predictions</strong> &mdash; AI-powered forecasts with confidence scores</li>
        <li style="color:#d1d5db;font-size:13px;margin-bottom:6px;"><strong style="color:#f59e0b;">Action Items</strong> &mdash; Concrete steps for this week</li>
      </ul>
    `)}

    ${heading('Companies we\'re watching for you:')}
    <ul style="margin:0 0 16px;padding-left:20px;">${competitorList}</ul>

    ${p('Keep an eye on your inbox Monday morning. Your packet will be ready in your control plane.')}
    ${ctaButton('Preview Your Control Plane', CONTROL_PLANE_URL)}
  `;

  return {
    subject: 'Your First Intel Packet Ships Monday',
    html: wrapHtml('Your First Packet Ships Monday', body),
  };
}

function buildPktFirstReady(ctx: UserContext) {
  const body = `
    ${p(`Hi ${esc(ctx.firstName)},`)}
    ${p('Your first intel packet just shipped. This is the real deal &mdash; personalized competitive intelligence for <strong style="color:#e5e7eb;">${esc(ctx.companyName)}</strong>.')}

    ${card(`
      <div style="text-align:center;">
        <p style="margin:0 0 6px;color:#22c55e;font-size:24px;">&#x1F389;</p>
        <p style="margin:0 0 4px;color:#e5e7eb;font-size:16px;font-weight:600;">Your Intel Packet Is Ready</p>
        <p style="margin:0;color:#9ca3af;font-size:13px;">Covering ${ctx.competitors.length} competitor${ctx.competitors.length !== 1 ? 's' : ''}</p>
      </div>
    `, '#22c55e')}

    ${p('Here\'s what to do:')}

    ${card(`
      <div style="margin-bottom:8px;">
        <span style="color:#06b6d4;">1.</span> <span style="color:#d1d5db;font-size:13px;">Open your control plane and read the executive summary</span>
      </div>
      <div style="margin-bottom:8px;">
        <span style="color:#06b6d4;">2.</span> <span style="color:#d1d5db;font-size:13px;">Dive into the intel sections most relevant to you</span>
      </div>
      <div>
        <span style="color:#06b6d4;">3.</span> <span style="color:#d1d5db;font-size:13px;">Use the Judgment Loop to agree/disagree with insights</span>
      </div>
    `)}

    ${p('Your next packet arrives next Monday. Each one gets smarter as Signal Plane learns your market.')}
    ${ctaButton('Read Your Packet Now', CONTROL_PLANE_URL)}
  `;

  return {
    subject: 'Your First Intel Packet Is Ready',
    html: wrapHtml('Your Packet Is Ready', body),
  };
}

function buildPktAlreadyWaiting(ctx: UserContext) {
  const body = `
    ${p(`Hi ${esc(ctx.firstName)},`)}
    ${p('Great timing! Your first intel packet is <strong style="color:#22c55e;">already waiting</strong> in your control plane.')}

    ${card(`
      <div style="text-align:center;">
        <p style="margin:0 0 6px;color:#06b6d4;font-size:24px;">&#x1F4E6;</p>
        <p style="margin:0 0 4px;color:#e5e7eb;font-size:16px;font-weight:600;">Intel Packet Available</p>
        <p style="margin:0;color:#9ca3af;font-size:13px;">Personalized for ${esc(ctx.companyName)} &middot; ${ctx.competitors.length} competitor${ctx.competitors.length !== 1 ? 's' : ''}</p>
      </div>
    `, '#06b6d4')}

    ${p('This packet was generated from signals detected across your competitors\' pages this week. Open it up and see what changed.')}
    ${ctaButton('Read Your Packet', CONTROL_PLANE_URL)}
  `;

  return {
    subject: 'Your Intel Packet Is Already Waiting',
    html: wrapHtml('Your Packet Is Waiting', body),
  };
}

function buildSetupNudge(ctx: UserContext) {
  const body = `
    ${p(`Hi ${esc(ctx.firstName)},`)}
    ${p('You signed up for Signal Plane, but you haven\'t finished setting up your competitive tracking yet.')}

    ${card(`
      ${heading('What you\'re missing:')}
      <ul style="margin:0;padding-left:20px;">
        <li style="color:#d1d5db;font-size:13px;margin-bottom:6px;">Weekly intel packets with AI-powered competitive analysis</li>
        <li style="color:#d1d5db;font-size:13px;margin-bottom:6px;">Messaging change detection across competitor pages</li>
        <li style="color:#d1d5db;font-size:13px;margin-bottom:6px;">Predictions on competitor moves with confidence scores</li>
        <li style="color:#d1d5db;font-size:13px;">Actionable insights delivered every Monday</li>
      </ul>
    `, '#f59e0b')}

    ${p('Setup takes less than 2 minutes. Just tell us your company name and add the competitors you want to track.')}
    ${ctaButton('Complete Your Setup', CONTROL_PLANE_URL)}
    ${p('Intel packets ship every Monday. Complete your setup before then to get your first one.', '#9ca3af')}
  `;

  return {
    subject: 'Complete Your Setup to Get Your First Packet',
    html: wrapHtml('Complete Your Setup', body),
  };
}
