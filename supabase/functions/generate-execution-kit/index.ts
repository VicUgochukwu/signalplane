import { createSupabaseClient, createServiceRoleClient } from '../_shared/supabase.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { fetchWithRetry } from '../_shared/retry.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExecutionKitComponent {
  title: string;
  content: string;
  copyable: boolean;
}

interface ExecutionKit {
  decision_type: string;
  competitor_name: string;
  signal_headline: string;
  components: ExecutionKitComponent[];
  generated_at: string;
}

interface KitTemplateConfig {
  components: string[];
  artifacts: string[];
}

// ---------------------------------------------------------------------------
// Kit Templates
// ---------------------------------------------------------------------------

const KIT_TEMPLATES: Record<string, KitTemplateConfig> = {
  positioning: {
    components: ['Copy Diff', 'Internal Brief', 'Leadership Summary', 'Slide-Ready Block'],
    artifacts: ['battlecard', 'swipe_file'],
  },
  packaging: {
    components: ['Pricing Comparison Table', 'Value Reframe Script', 'Internal Impact Brief', 'Packaging Counter-Move Options'],
    artifacts: ['battlecard'],
  },
  distribution: {
    components: ['Channel Gap Analysis', 'Integration Priority Brief', 'Partnership Outreach Draft', 'GTM Co-Marketing Angle'],
    artifacts: ['market_winners'],
  },
  proof: {
    components: ['Proof Gap Audit', 'Customer Story Prompt', 'Counter-Proof Talking Points', 'Review Site Response Plan'],
    artifacts: ['swipe_file', 'market_winners'],
  },
  enablement: {
    components: ['Battlecard Section Update', 'Objection Rebuttal', 'Discovery Question Set', 'Win/Loss Talking Points'],
    artifacts: ['battlecard', 'objection_library'],
  },
  risk: {
    components: ['Risk Severity Assessment', 'Customer Retention Playbook', 'Internal Escalation Brief', 'Defensive Positioning Moves'],
    artifacts: ['objection_library', 'battlecard'],
  },
  hiring: {
    components: ['Strategic Read', 'Competitive Timeline Estimate', 'Preemptive Moves Brief', 'Internal Briefing Slide'],
    artifacts: [],
  },
  launch: {
    components: ['Launch Impact Assessment', 'Rapid Response Draft', 'Sales Talking Points', 'Counter-Narrative Angles'],
    artifacts: ['swipe_file', 'market_winners'],
  },
};

// Which components are copyable per decision_type
const COPYABLE_FLAGS: Record<string, boolean[]> = {
  positioning: [true, true, true, true],
  packaging:   [true, true, true, false],
  distribution: [true, true, true, true],
  proof:       [true, true, true, false],
  enablement:  [true, true, true, true],
  risk:        [false, true, true, false],
  hiring:      [false, false, true, true],
  launch:      [false, true, true, true],
};

// ---------------------------------------------------------------------------
// Main Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  try {
    // 1. Authenticate
    const supabase = createSupabaseClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers,
      });
    }

    // 2. Parse request body
    const body = await req.json().catch(() => null);
    if (!body?.card_id) {
      return new Response(
        JSON.stringify({ error: 'card_id is required' }),
        { status: 400, headers },
      );
    }

    const { card_id } = body;
    console.log(`[generate-execution-kit] Starting for card=${card_id} user=${user.id}`);

    // We use service role for cross-schema reads
    const serviceClient = createServiceRoleClient();

    // 3. Fetch the board card and verify ownership
    const { data: card, error: cardError } = await serviceClient
      .schema('learning')
      .from('action_board_cards')
      .select('*')
      .eq('id', card_id)
      .single();

    if (cardError || !card) {
      console.error('Card fetch error:', cardError?.message);
      return new Response(
        JSON.stringify({ error: 'Card not found' }),
        { status: 404, headers },
      );
    }

    if (card.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers },
      );
    }

    // Map action-level decision types to kit template types
    // Cards from packet action_mapping use 'act_now'/'monitor', which need mapping
    const rawDecisionType = card.decision_type || 'positioning';
    const DECISION_TYPE_MAP: Record<string, string> = {
      act_now: 'positioning',
      monitor: 'positioning',
    };
    const decisionType = DECISION_TYPE_MAP[rawDecisionType] || rawDecisionType;
    const template = KIT_TEMPLATES[decisionType];
    if (!template) {
      // Fallback to positioning if still unknown
      console.warn(`[generate-execution-kit] Unknown decision_type: ${rawDecisionType}, falling back to positioning`);
    }
    const finalTemplate = template || KIT_TEMPLATES['positioning'];

    console.log(`[generate-execution-kit] decision_type=${decisionType}, competitor=${card.competitor_name}`);

    // 4. Fetch source packet
    const { data: packet, error: packetError } = await serviceClient
      .schema('control_plane')
      .from('packets')
      .select('*')
      .eq('id', card.packet_id)
      .single();

    if (packetError) {
      console.error('Packet fetch error:', packetError.message);
    }

    // 5. Fetch related signals (same competitor, last 4 weeks)
    let relatedSignals: any[] = [];
    if (card.competitor_name) {
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const { data: signals, error: signalsError } = await serviceClient
        .schema('control_plane')
        .from('signals')
        .select('id, signal_type, title, summary, severity, decision_type, created_at')
        .gte('created_at', fourWeeksAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (signalsError) {
        console.error('Signals fetch error:', signalsError.message);
      } else {
        // Filter signals that relate to this competitor via the meta field or company_id
        // Since signals don't have a competitor_name column directly, we fetch recent ones
        // and include them as context. The Anthropic model will use what's relevant.
        relatedSignals = signals || [];
      }
    }

    // 6. Fetch relevant artifacts based on decision_type
    const artifactContext: Record<string, any> = {};

    if (finalTemplate.artifacts.includes('battlecard') && card.competitor_name) {
      const { data: battlecard } = await serviceClient
        .schema('gtm_artifacts')
        .from('battlecard_versions')
        .select('content_json, content_md, competitor_name')
        .eq('competitor_name', card.competitor_name)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (battlecard) {
        artifactContext.battlecard = battlecard.content_json || battlecard.content_md || null;
        console.log(`[generate-execution-kit] Found battlecard for ${card.competitor_name}`);
      }
    }

    if (finalTemplate.artifacts.includes('objection_library')) {
      const { data: objectionLib } = await serviceClient
        .schema('gtm_artifacts')
        .from('objection_library_versions')
        .select('content_json, content_md')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (objectionLib) {
        artifactContext.objection_library = objectionLib.content_json || objectionLib.content_md || null;
        console.log('[generate-execution-kit] Found objection library');
      }
    }

    if (finalTemplate.artifacts.includes('swipe_file')) {
      const { data: swipeFile } = await serviceClient
        .schema('gtm_artifacts')
        .from('swipe_file_versions')
        .select('content_json, content_md')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (swipeFile) {
        artifactContext.swipe_file = swipeFile.content_json || swipeFile.content_md || null;
        console.log('[generate-execution-kit] Found swipe file');
      }
    }

    if (finalTemplate.artifacts.includes('market_winners') && packet?.market_winners) {
      artifactContext.market_winners = packet.market_winners;
      console.log('[generate-execution-kit] Found market winners from packet');
    }

    // 7. Fetch user's company profile (ICP config / messaging baseline)
    const { data: userProfile } = await serviceClient
      .from('user_company_profiles')
      .select('company_name, company_domain, industry, company_size, department, job_title')
      .eq('user_id', user.id)
      .maybeSingle();

    const companyName = userProfile?.company_name || 'Your Company';

    // 8. Build the Anthropic prompt
    const componentDescriptions = finalTemplate.components
      .map((c, i) => `${i + 1}. "${c}" - A ready-to-use ${c.toLowerCase()} deliverable`)
      .join('\n');

    const artifactSections: string[] = [];
    if (artifactContext.battlecard) {
      artifactSections.push(`### Battlecard (${card.competitor_name})\n${JSON.stringify(artifactContext.battlecard, null, 2).slice(0, 3000)}`);
    }
    if (artifactContext.objection_library) {
      artifactSections.push(`### Objection Library\n${JSON.stringify(artifactContext.objection_library, null, 2).slice(0, 3000)}`);
    }
    if (artifactContext.swipe_file) {
      artifactSections.push(`### Swipe File\n${JSON.stringify(artifactContext.swipe_file, null, 2).slice(0, 3000)}`);
    }
    if (artifactContext.market_winners) {
      artifactSections.push(`### Market Winners\n${JSON.stringify(artifactContext.market_winners, null, 2).slice(0, 2000)}`);
    }

    const signalSummaries = relatedSignals
      .slice(0, 10)
      .map((s) => `- [${s.signal_type}] ${s.title}: ${s.summary}`)
      .join('\n');

    const systemPrompt = `You are a GTM execution specialist generating ready-to-use competitive response materials for a ${decisionType} scenario.`;

    const userPrompt = `CONTEXT:
- Company: ${companyName}
- Competitor: ${card.competitor_name || 'Unknown'}
- Signal: ${card.signal_headline || 'N/A'}
- Action: ${card.action_text}
- Evidence: ${(card.evidence_urls || []).join(', ') || 'None provided'}
- Company industry: ${userProfile?.industry || 'N/A'}
- Company size: ${userProfile?.company_size || 'N/A'}
- Department: ${userProfile?.department || 'N/A'}
${artifactSections.length > 0 ? `\n- Related artifacts:\n${artifactSections.join('\n\n')}` : ''}
${signalSummaries ? `\n- Recent signals:\n${signalSummaries}` : ''}

TASK: Generate a ${decisionType} execution kit with these components:
${componentDescriptions}

RULES:
- Every component must be immediately usable — no placeholders like [INSERT HERE]
- Reference specific evidence from the signal, not generic claims
- Format as JSON array of objects: [{ "title": "Component Name", "content": "markdown content" }]
- Return ONLY the JSON array, no other text`;

    // 9. Call Anthropic API
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    console.log('[generate-execution-kit] Calling Anthropic API...');
    const anthropicResponse = await fetchWithRetry(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          system: systemPrompt,
        }),
      },
      { maxRetries: 2, baseDelayMs: 2000, timeoutMs: 90000, label: 'Anthropic' },
    );

    if (!anthropicResponse.ok) {
      const errBody = await anthropicResponse.text();
      console.error('Anthropic API error:', anthropicResponse.status, errBody);
      throw new Error(`Anthropic API returned ${anthropicResponse.status}: ${errBody.slice(0, 200)}`);
    }

    const anthropicResult = await anthropicResponse.json();
    const rawContent = anthropicResult.content?.[0]?.text;

    if (!rawContent) {
      throw new Error('Empty response from Anthropic API');
    }

    console.log('[generate-execution-kit] Anthropic response received, parsing...');

    // 10. Parse the response as JSON
    let parsedComponents: { title: string; content: string }[];
    try {
      // The model should return a clean JSON array, but handle possible markdown fences
      const jsonStr = rawContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      parsedComponents = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse Anthropic response as JSON:', (parseError as Error).message);
      console.error('Raw content (first 500 chars):', rawContent.slice(0, 500));
      throw new Error('Failed to parse execution kit response. The AI returned an invalid format.');
    }

    if (!Array.isArray(parsedComponents) || parsedComponents.length === 0) {
      throw new Error('Execution kit response was empty or not an array');
    }

    // Build the final kit with copyable flags
    const copyableFlags = COPYABLE_FLAGS[decisionType] || finalTemplate.components.map(() => true);
    const kitComponents: ExecutionKitComponent[] = parsedComponents.map((comp, index) => ({
      title: comp.title,
      content: comp.content,
      copyable: copyableFlags[index] ?? true,
    }));

    const executionKit: ExecutionKit = {
      decision_type: decisionType,
      competitor_name: card.competitor_name || 'Unknown',
      signal_headline: card.signal_headline || '',
      components: kitComponents,
      generated_at: new Date().toISOString(),
    };

    // 11. Update the card with the generated kit
    const { error: updateError } = await serviceClient
      .schema('learning')
      .from('action_board_cards')
      .update({
        execution_kit: executionKit,
        kit_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', card_id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update card with execution kit:', updateError.message);
      // Still return the kit even if the save failed
    } else {
      console.log(`[generate-execution-kit] Kit saved to card ${card_id}`);
    }

    // 12. Return the kit
    return new Response(
      JSON.stringify({
        success: true,
        execution_kit: executionKit,
        card_id,
        save_error: updateError ? updateError.message : null,
      }),
      { headers },
    );
  } catch (error) {
    console.error('[generate-execution-kit] Error:', (error as Error).message);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers },
    );
  }
});
