// AI Agent Chat Edge Function
// Authenticates user, fetches context, calls Claude API with streaming, relays SSE.

import { createSupabaseClient, createServiceRoleClient } from '../_shared/supabase.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface PageContext {
  page: string;
  path: string;
  params: Record<string, string>;
}

interface ChatRequest {
  messages: ChatMessage[];
  context: PageContext;
}

// ─── Rate Limiting (simple in-memory, per-user) ──────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(userId: string, maxPerMinute = 20): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count++;
  return entry.count > maxPerMinute;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(
  profile: Record<string, any> | null,
  competitors: Array<{ competitor_name: string }>,
  context: PageContext,
  contextData: Record<string, any>,
): string {
  const companyName = profile?.company_name || 'your company';
  const competitorNames = competitors.map((c) => c.competitor_name).join(', ') || 'none configured yet';
  const pageLabel = PAGE_LABELS[context.page] || context.page;

  // Truncate context data to avoid token bloat
  let contextJson = JSON.stringify(contextData, null, 2);
  if (contextJson.length > 8000) contextJson = contextJson.slice(0, 8000) + '\n... (truncated)';

  return `You are the Signal Plane AI assistant — an expert competitive intelligence analyst embedded in the Signal Plane Control Plane application.

## Your Identity
You help PMMs (Product Marketing Managers), competitive intelligence analysts, and GTM leaders understand and act on their competitive intelligence data. You speak in the confident, measured voice of an intelligence analyst. Use phrases like "Indicators suggest...", "We assess...", "Consistent with..." — never state conclusions as facts without evidence.

## Current User Context
- Company: ${companyName}
- Industry: ${profile?.industry || 'Not specified'}
- Tracked competitors: ${competitorNames}
- Current page: ${pageLabel}
- User role: ${profile?.job_title || 'Not specified'} in ${profile?.department || 'their organization'}

## Signal Plane Product Knowledge
Signal Plane is a competitive intelligence platform that automatically tracks competitor websites, analyzes messaging changes, detects narrative shifts, and generates weekly intelligence packets.

1. **Intel Packets** — Weekly CI reports with executive summary, 5 signal sections (Messaging, Narrative, ICP, Horizon, Objection), bets/hypotheses, predictions with timeframes, action mapping, and market winners.

2. **Messaging Diff** — Competitor messaging changes tracked over time, showing what changed on their website pages, when, and what it signals strategically.

3. **Narrative Arcs** — Cross-competitor storylines that evolve: building, escalating, peaked, fading. Each has a credibility assessment (corroboration score, confidence level, evidence weight) and alternative explanations.

4. **Convergences** — When 2+ competitors make similar moves simultaneously, signaling a market shift.

5. **Action Board** — Kanban board (Inbox → This Week → In Progress → Done) with auto-generated cards from packet action items. Each card has severity (1-5), decision type, and can have execution kits generated.

6. **Artifacts** — Living GTM documents: Battlecards (per competitor), Objection Library, Swipe File (effective competitor messaging), Maturity Model.

7. **Win/Loss Intelligence** — Public buyer decision signals from G2, Capterra, Reddit, HN, etc. Tracks indicators, patterns, and trends for why buyers choose, reject, or switch products.

8. **Positioning Health** — Gap between stated positioning and market reality across 3 dimensions: buyer alignment, differentiation, narrative fit. Tracks score trends and drift events.

9. **Packaging Intelligence** — Competitor pricing moves, tier changes, value metric shifts, gating changes. Generates strategic intel briefs with response recommendations.

10. **VoC Research** — Voice of Customer research aggregated from public buyer signals.

11. **Enablement** — Sales enablement content and battle-ready materials.

12. **Launch Ops** — Product launch operations tracking.

13. **Deal Logger** — Win/loss deal outcome tracking against specific competitors.

14. **Submit Signal** — Manual signal submission for intel from sales calls, support tickets, etc.

## Current Page Data
${contextJson}

## Your Capabilities
1. **Explain** — Interpret data, explain what narrative arcs or convergences mean, decode competitive signals
2. **Summarize** — Condense intel packets, board status, artifact updates into key takeaways
3. **Advise** — Recommend priorities, identify gaps, suggest strategic responses
4. **Navigate** — Tell users which pages to visit for specific information. Reference exact page names from the sidebar.
5. **Onboard** — Help new users understand Signal Plane features and how to get started

## Response Style
- Be concise. Use bullet points and short paragraphs.
- Use markdown: **bold** for emphasis, bullet lists, \`code\` for specific values.
- When referencing data, cite the source (e.g., "In the Jan 27 packet..." or "The Acme battlecard...").
- When uncertain, say so: "I don't have enough data to assess..."
- If asked to perform an action, describe what would happen and ask for confirmation.
- Keep responses under 400 words unless a detailed analysis is explicitly requested.

## Important Rules
- Never fabricate data. Only reference information from the context above.
- Never share raw database IDs or internal implementation details.
- If asked about features that don't exist, explain what's available and suggest workarounds.
- If the current page data is empty, acknowledge this and suggest exploring other sections or submitting signals.`;
}

const PAGE_LABELS: Record<string, string> = {
  'intel-packets': 'Intel Packets',
  'artifacts': 'Artifacts',
  'messaging-diff': 'Messaging Diff',
  'action-board': 'Action Board',
  'deals': 'Deal Logger',
  'win-loss': 'Win/Loss Intelligence',
  'voc-research': 'VoC Research',
  'positioning': 'Positioning Health',
  'packaging': 'Packaging Intelligence',
  'enablement': 'Enablement',
  'launches': 'Launch Ops',
  'submit-signal': 'Submit Signal',
  'bulk-upload': 'Bulk Upload',
  'my-pages': 'Tracked Pages',
  'team': 'Team Settings',
  'settings': 'Settings',
};

// ─── Page Context Fetcher ─────────────────────────────────────────────────────

async function fetchPageContext(
  serviceClient: any,
  userId: string,
  context: PageContext,
): Promise<Record<string, any>> {
  const data: Record<string, any> = {};

  try {
    switch (context.page) {
      case 'intel-packets': {
        if (context.params?.packetId) {
          const { data: packet } = await serviceClient
            .from('packets')
            .select('packet_title, exec_summary, week_start, created_at')
            .eq('id', context.params.packetId)
            .maybeSingle();
          data.currentPacket = packet;
        } else {
          const { data: packets } = await serviceClient
            .from('packets')
            .select('id, packet_title, exec_summary, week_start, created_at')
            .order('created_at', { ascending: false })
            .limit(3);
          data.recentPackets = packets;
        }
        break;
      }
      case 'action-board': {
        const { data: cards } = await serviceClient
          .from('action_board_cards')
          .select('id, title, severity, decision_type, status, priority, created_at')
          .order('created_at', { ascending: false })
          .limit(20);
        data.boardCards = cards;
        break;
      }
      case 'messaging-diff': {
        const { data: arcs } = await serviceClient
          .rpc('get_narrative_arcs_for_user', { p_user_id: userId });
        data.narrativeArcs = (arcs || []).slice(0, 10);

        const { data: convergences } = await serviceClient
          .rpc('get_active_convergences', { p_user_id: userId });
        data.convergences = (convergences || []).slice(0, 5);
        break;
      }
      case 'deals': {
        const { data: deals } = await serviceClient
          .from('deals')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);
        data.deals = deals;
        break;
      }
      // Other pages: rely on the general system prompt knowledge
    }
  } catch (err) {
    console.warn('[ai-agent-chat] Context fetch warning:', (err as Error).message);
  }

  return data;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = getCorsHeaders(req);

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // 1. Authenticate
    const supabase = createSupabaseClient(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // 2. Rate limit
    if (isRateLimited(user.id)) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment.' }), {
        status: 429,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // 3. Parse request
    const body: ChatRequest = await req.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // 4. Fetch user context in parallel
    const serviceClient = createServiceRoleClient();

    const [profileResult, competitorsResult, contextData] = await Promise.all([
      serviceClient
        .from('user_company_profiles')
        .select('company_name, industry, company_size, job_title, department')
        .eq('user_id', user.id)
        .maybeSingle(),
      serviceClient
        .from('user_tracked_competitors')
        .select('competitor_name')
        .eq('user_id', user.id)
        .eq('is_active', true),
      fetchPageContext(serviceClient, user.id, context),
    ]);

    const profile = profileResult.data;
    const competitors = competitorsResult.data || [];

    // 5. Build system prompt
    const systemPrompt = buildSystemPrompt(profile, competitors, context, contextData);

    // 6. Call Anthropic API with streaming
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        stream: true,
        system: systemPrompt,
        messages: messages.slice(-20).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!anthropicResponse.ok) {
      const errBody = await anthropicResponse.text();
      console.error('[ai-agent-chat] Anthropic error:', anthropicResponse.status, errBody);
      throw new Error(`AI service returned ${anthropicResponse.status}`);
    }

    // 7. Relay SSE stream directly
    const stream = new ReadableStream({
      async start(controller) {
        const reader = anthropicResponse.body!.getReader();
        const encoder = new TextEncoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              break;
            }
            controller.enqueue(value);
          }
        } catch (err) {
          console.error('[ai-agent-chat] Stream error:', (err as Error).message);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...headers,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('[ai-agent-chat] Error:', (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message || 'Internal server error' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
