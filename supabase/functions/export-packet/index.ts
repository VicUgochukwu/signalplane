import { createSupabaseClient, createServiceRoleClient } from '../_shared/supabase.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface IntelSection {
  summary: string;
  highlights: string[];
  action_items: string[];
}

interface IntelPacket {
  id: string;
  week_start: string;
  week_end: string;
  packet_title: string;
  exec_summary: string[];
  sections: Record<string, IntelSection>;
  key_questions: string[];
  bets: { hypothesis: string; confidence: number; signal_ids: string[] }[];
  predictions: { prediction: string; timeframe: string; confidence: number; signals: string[] }[];
  action_mapping: {
    this_week: { action: string; owner: string; priority: string }[];
    monitor: { signal: string; trigger: string; action: string }[];
  };
  market_winners?: { proven: any[]; emerging: any[] };
  status: string;
  metrics?: {
    signals_detected?: number;
    confidence_score?: number;
    impact_score?: number;
  };
  user_id?: string;
  is_personalized?: boolean;
  user_company_name?: string;
}

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
    const { action, packet_id, packet_data } = body;

    if (action !== 'email') {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}` }),
        { status: 400, headers }
      );
    }

    if (!packet_id && !packet_data) {
      return new Response(
        JSON.stringify({ error: 'packet_id or packet_data is required' }),
        { status: 400, headers }
      );
    }

    if (!RESEND_API_KEY) {
      throw new Error('Email service not configured');
    }

    let packet: IntelPacket | null = null;

    // Try fetching from database first
    if (packet_id) {
      const serviceClient = createServiceRoleClient();
      const { data, error: packetError } = await serviceClient
        .schema('control_plane')
        .from('packets')
        .select('*')
        .eq('id', packet_id)
        .single();

      if (!packetError && data) {
        // Verify access: packet is generic (no user_id) or belongs to this user
        if (data.user_id && data.user_id !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers }
          );
        }
        packet = data as IntelPacket;
      }
    }

    // Fall back to inline packet data (for mock/client-side data)
    if (!packet && packet_data) {
      packet = packet_data as IntelPacket;
    }

    if (!packet) {
      return new Response(
        JSON.stringify({ error: 'Packet not found' }),
        { status: 404, headers }
      );
    }

    // Build and send email
    const html = buildPacketEmailHtml(packet as IntelPacket);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Control Plane <hello@signalplane.dev>',
        to: [user.email],
        subject: `Intel Packet: ${packet.packet_title}`,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend error:', errorText);
      throw new Error('Failed to send email');
    }

    return new Response(
      JSON.stringify({ success: true, message: `Packet sent to ${user.email}` }),
      { headers }
    );
  } catch (error) {
    console.error('export-packet error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers }
    );
  }
});

function buildPacketEmailHtml(packet: IntelPacket): string {
  const sectionNames: Record<string, string> = {
    messaging: 'Messaging Intel',
    narrative: 'Narrative Intel',
    icp: 'ICP Intel',
    horizon: 'Horizon Intel',
    objection: 'Objection Intel',
  };

  const sectionColors: Record<string, string> = {
    messaging: '#06b6d4',
    narrative: '#a855f7',
    icp: '#22c55e',
    horizon: '#f59e0b',
    objection: '#ef4444',
  };

  const priorityColors: Record<string, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#22c55e',
  };

  const confidenceColor = (c: number) =>
    c >= 80 ? '#22c55e' : c >= 60 ? '#f59e0b' : '#ef4444';

  // Build sections HTML
  let sectionsHtml = '';
  if (packet.sections) {
    for (const [key, section] of Object.entries(packet.sections)) {
      if (!section || (!section.summary && !section.highlights?.length)) continue;

      const color = sectionColors[key] || '#06b6d4';
      const name = sectionNames[key] || key;

      sectionsHtml += `
        <div style="margin-bottom:24px;padding:16px;background:#1a1a2e;border-radius:8px;border-left:3px solid ${color};">
          <h3 style="margin:0 0 8px;color:${color};font-size:14px;text-transform:uppercase;letter-spacing:1px;">${name}</h3>
          ${section.summary ? `<p style="margin:0 0 12px;color:#d1d5db;font-size:14px;line-height:1.6;">${escapeHtml(section.summary)}</p>` : ''}
          ${
            section.highlights?.length
              ? `<div style="margin-bottom:8px;">
                  <h4 style="margin:0 0 6px;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Highlights</h4>
                  <ul style="margin:0;padding-left:20px;">
                    ${section.highlights.map((h: string) => `<li style="color:#e5e7eb;font-size:13px;margin-bottom:4px;">${escapeHtml(h)}</li>`).join('')}
                  </ul>
                </div>`
              : ''
          }
          ${
            section.action_items?.length
              ? `<div style="padding-top:8px;border-top:1px solid #374151;">
                  <h4 style="margin:0 0 6px;color:#22c55e;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Action Items</h4>
                  <ul style="margin:0;padding-left:20px;">
                    ${section.action_items.map((a: string) => `<li style="color:#22c55e;font-size:13px;margin-bottom:4px;">${escapeHtml(a)}</li>`).join('')}
                  </ul>
                </div>`
              : ''
          }
        </div>
      `;
    }
  }

  // Predictions HTML
  let predictionsHtml = '';
  if (packet.predictions?.length) {
    predictionsHtml = `
      <div style="margin-bottom:24px;">
        <h2 style="margin:0 0 12px;color:#a855f7;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Predictions</h2>
        ${packet.predictions
          .map(
            (p) => `
          <div style="margin-bottom:8px;padding:12px;background:#1a1a2e;border-radius:8px;border:1px solid ${confidenceColor(p.confidence)}33;">
            <p style="margin:0 0 6px;color:#e5e7eb;font-size:13px;">${escapeHtml(p.prediction)}</p>
            <div style="color:#9ca3af;font-size:11px;">
              <span>${escapeHtml(p.timeframe)}</span> &middot;
              <span style="color:${confidenceColor(p.confidence)};">Confidence: ${p.confidence}%</span> &middot;
              <span>${p.signals.length} signal${p.signals.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  // Action mapping HTML
  let actionsHtml = '';
  if (packet.action_mapping) {
    const thisWeek = packet.action_mapping.this_week || [];
    const monitor = packet.action_mapping.monitor || [];

    if (thisWeek.length || monitor.length) {
      actionsHtml = '<div style="margin-bottom:24px;">';

      if (thisWeek.length) {
        actionsHtml += `
          <h2 style="margin:0 0 12px;color:#22c55e;font-size:14px;text-transform:uppercase;letter-spacing:1px;">This Week</h2>
          ${thisWeek
            .map(
              (a) => `
            <div style="margin-bottom:8px;padding:12px;background:#1a1a2e;border-radius:8px;display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                <p style="margin:0 0 4px;color:#e5e7eb;font-size:13px;">${escapeHtml(a.action)}</p>
                <span style="color:#9ca3af;font-size:11px;">Owner: ${escapeHtml(a.owner)}</span>
              </div>
              <span style="padding:2px 8px;border-radius:4px;font-size:11px;color:${priorityColors[a.priority.toLowerCase()] || '#9ca3af'};background:${priorityColors[a.priority.toLowerCase()] || '#9ca3af'}22;">${escapeHtml(a.priority)}</span>
            </div>
          `
            )
            .join('')}
        `;
      }

      if (monitor.length) {
        actionsHtml += `
          <h2 style="margin:16px 0 12px;color:#f59e0b;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Monitor</h2>
          ${monitor
            .map(
              (m) => `
            <div style="margin-bottom:8px;padding:12px;background:#1a1a2e;border-radius:8px;">
              <p style="margin:0 0 4px;color:#e5e7eb;font-size:13px;font-weight:600;">${escapeHtml(m.signal)}</p>
              <p style="margin:0 0 2px;color:#f59e0b;font-size:11px;">Trigger: ${escapeHtml(m.trigger)}</p>
              <p style="margin:0;color:#22c55e;font-size:11px;">&rarr; ${escapeHtml(m.action)}</p>
            </div>
          `
            )
            .join('')}
        `;
      }

      actionsHtml += '</div>';
    }
  }

  // Bets HTML
  let betsHtml = '';
  if (packet.bets?.length) {
    betsHtml = `
      <div style="margin-bottom:24px;">
        <h2 style="margin:0 0 12px;color:#f59e0b;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Strategic Bets</h2>
        ${packet.bets
          .map(
            (b) => `
          <div style="margin-bottom:8px;padding:12px;background:#1a1a2e;border-radius:8px;border:1px solid ${confidenceColor(b.confidence)}33;">
            <p style="margin:0 0 6px;color:#e5e7eb;font-size:13px;">${escapeHtml(b.hypothesis)}</p>
            <div style="color:#9ca3af;font-size:11px;">
              Confidence: <span style="color:${confidenceColor(b.confidence)};">${b.confidence}%</span> &middot;
              ${b.signal_ids.length} signal${b.signal_ids.length !== 1 ? 's' : ''}
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  // Key questions HTML
  let questionsHtml = '';
  if (packet.key_questions?.length) {
    questionsHtml = `
      <div style="margin-bottom:24px;">
        <h2 style="margin:0 0 12px;color:#06b6d4;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Key Questions</h2>
        <ol style="margin:0;padding-left:20px;">
          ${packet.key_questions.map((q: string) => `<li style="color:#d1d5db;font-size:13px;margin-bottom:4px;">${escapeHtml(q)}</li>`).join('')}
        </ol>
      </div>
    `;
  }

  // Metrics bar
  let metricsHtml = '';
  if (packet.metrics) {
    const items = [];
    if (packet.metrics.signals_detected != null) items.push(`${packet.metrics.signals_detected} signals`);
    if (packet.metrics.confidence_score != null) {
      const confLabel = packet.metrics.confidence_score >= 80 ? 'Strong' : packet.metrics.confidence_score >= 60 ? 'Moderate' : 'Weak';
      items.push(`${packet.metrics.confidence_score}% confidence (${confLabel})`);
    }
    if (packet.metrics.impact_score != null) {
      const raw = packet.metrics.impact_score;
      const normalized = raw > 10 ? Math.round(raw / 10 * 10) / 10 : raw;
      const impactLabel = normalized >= 9 ? 'Critical' : normalized >= 7 ? 'High' : normalized >= 4 ? 'Moderate' : 'Low';
      const impactColor = normalized >= 9 ? '#ef4444' : normalized >= 7 ? '#f59e0b' : normalized >= 4 ? '#06b6d4' : '#22c55e';
      items.push(`Impact: <span style="color:${impactColor};font-weight:600;">${normalized}/10 (${impactLabel})</span>`);
    }

    if (items.length) {
      metricsHtml = `
        <div style="margin-bottom:24px;display:flex;gap:16px;flex-wrap:wrap;">
          ${items.map((item) => `<div style="padding:8px 16px;background:#1a1a2e;border-radius:8px;color:#d1d5db;font-size:13px;">${item}</div>`).join('')}
        </div>
      `;
    }
  }

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://signalplane.dev/favicon-cropped.png" alt="Control Plane" width="48" height="48" style="display:block;margin:0 auto 16px;border-radius:12px;" />
      <h1 style="margin:0 0 8px;color:#e5e7eb;font-size:22px;font-weight:700;">${escapeHtml(packet.packet_title)}</h1>
      <p style="margin:0;color:#9ca3af;font-size:13px;">${escapeHtml(packet.week_start)} &mdash; ${escapeHtml(packet.week_end)}</p>
    </div>

    ${metricsHtml}

    <!-- Executive Summary -->
    <div style="margin-bottom:24px;padding:16px;background:#1a1a2e;border-radius:8px;">
      <h2 style="margin:0 0 12px;color:#e5e7eb;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Executive Summary</h2>
      <ul style="margin:0;padding-left:20px;">
        ${(packet.exec_summary || []).map((s: string) => `<li style="color:#d1d5db;font-size:14px;line-height:1.6;margin-bottom:6px;">${escapeHtml(s)}</li>`).join('')}
      </ul>
    </div>

    <!-- Intel Sections -->
    ${sectionsHtml}

    <!-- Predictions -->
    ${predictionsHtml}

    <!-- Actions -->
    ${actionsHtml}

    <!-- Bets -->
    ${betsHtml}

    <!-- Key Questions -->
    ${questionsHtml}

    <!-- Footer -->
    <div style="text-align:center;padding-top:24px;border-top:1px solid #1f2937;">
      <p style="margin:0;color:#6b7280;font-size:12px;">
        Sent from <a href="https://signalplane.dev" style="color:#06b6d4;text-decoration:none;">Control Plane</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
