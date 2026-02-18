/**
 * suggest-competitors — AI-powered competitor suggestions & relevance checking.
 *
 * Actions:
 *   "suggest"          → Generate 8-12 competitor suggestions based on user profile
 *   "check-relevance"  → Check if a proposed competitor is relevant to the user's company
 */

import { createSupabaseClient, createServiceRoleClient } from '../_shared/supabase.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { fetchWithRetry } from '../_shared/retry.ts';
import { enforceRateLimit } from '../_shared/rate-limit.ts';

// ── Helpers ──────────────────────────────────────────────────────────

function md5Hash(input: string): string {
  // Simple hash for cache key — doesn't need to be cryptographic
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

function buildProfileHash(companyName: string, industry: string, domain: string): string {
  return md5Hash(`${companyName.toLowerCase()}|${industry.toLowerCase()}|${domain.toLowerCase()}`);
}

function stripMarkdownFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')
    .trim();
}

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  console.log('[suggest-competitors] Calling Anthropic API...');
  const response = await fetchWithRetry(
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
        max_tokens: 2048,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
      }),
    },
    { maxRetries: 2, baseDelayMs: 2000, timeoutMs: 60000, label: 'Anthropic' },
  );

  if (!response.ok) {
    const errBody = await response.text();
    console.error('[suggest-competitors] Anthropic API error:', response.status, errBody);
    throw new Error(`Anthropic API returned ${response.status}`);
  }

  const result = await response.json();
  const rawContent = result.content?.[0]?.text;

  if (!rawContent) {
    throw new Error('Empty response from Anthropic API');
  }

  return rawContent;
}

// ── Action: suggest ──────────────────────────────────────────────────

interface ProfileOverride {
  company_name: string;
  company_domain: string;
  industry: string;
}

interface Suggestion {
  name: string;
  domain: string;
  reason: string;
  confidence: number;
}

async function handleSuggest(
  userId: string,
  profileOverride: ProfileOverride | undefined,
  forceRefresh: boolean,
  headers: Record<string, string>,
  req: Request,
): Promise<Response> {
  const serviceClient = createServiceRoleClient();

  // 1. Resolve profile
  let companyName: string;
  let companyDomain: string;
  let industry: string;

  if (profileOverride?.company_name) {
    companyName = profileOverride.company_name;
    companyDomain = profileOverride.company_domain || '';
    industry = profileOverride.industry || '';
    console.log(`[suggest-competitors] Using profile override: ${companyName}`);
  } else {
    const { data: profile, error: profileError } = await serviceClient
      .from('user_company_profiles')
      .select('company_name, company_domain, industry')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile?.company_name) {
      return new Response(
        JSON.stringify({ error: 'No company profile found. Complete onboarding first.' }),
        { status: 400, headers },
      );
    }

    companyName = profile.company_name;
    companyDomain = profile.company_domain || '';
    industry = profile.industry || '';
  }

  // 2. Check cache
  const profileHash = buildProfileHash(companyName, industry, companyDomain);

  const { data: cached } = await serviceClient
    .from('competitor_suggestions')
    .select('suggestions, expires_at, profile_hash')
    .eq('user_id', userId)
    .single();

  if (
    !forceRefresh &&
    cached &&
    cached.profile_hash === profileHash &&
    new Date(cached.expires_at) > new Date()
  ) {
    console.log(`[suggest-competitors] Cache hit for user=${userId}`);
    return new Response(
      JSON.stringify({ suggestions: cached.suggestions, cached: true }),
      { headers },
    );
  }

  // 3. Fetch existing competitors to exclude
  const { data: existingCompetitors } = await serviceClient
    .from('user_tracked_competitors')
    .select('competitor_name, competitor_domain')
    .eq('user_id', userId)
    .eq('is_active', true);

  const existingDomains = (existingCompetitors || []).map((c: any) => c.competitor_domain).filter(Boolean);
  const existingNames = (existingCompetitors || []).map((c: any) => c.competitor_name.toLowerCase());

  const exclusionNote = existingDomains.length > 0
    ? `\n\nIMPORTANT: The user already tracks these competitors, so DO NOT include them: ${existingDomains.join(', ')}`
    : '';

  // 4. Call Claude
  const systemPrompt = `You are a competitive intelligence analyst with deep knowledge of B2B SaaS, martech, AI tools, and emerging tech — including niche and emerging players, not just the largest companies.

Your job is to identify REAL competitors based on what the company actually does (inferred from their domain and industry), not just broad category matches.

IMPORTANT: Many modern companies use non-traditional TLDs like .ai, .so, .io, .co, .dev, .app, .tools, .gg, .sh, .fm, .tech, .cloud. Always use the company's ACTUAL domain — do not assume .com.

Return ONLY a JSON array with no additional text. Each element must have exactly these fields:
- "name": Company name (string)
- "domain": Their primary website domain — use the REAL domain, e.g. "jasper.ai", "copy.ai", "writer.com" (string)
- "reason": 1-sentence explanation of why they compete, max 15 words (string)
- "confidence": How likely they are a direct competitor, 0.0 to 1.0 (number)

Sort by confidence descending. Return 10-15 suggestions. Include both well-known AND niche/emerging competitors.`;

  const userPrompt = `Given this company profile:
- Company: ${companyName}
- Domain: ${companyDomain || 'unknown'}
- Industry: ${industry || 'unknown'}

Think about what ${companyName} actually does based on their domain and industry. Then suggest 10-15 competitors:
- Include direct competitors (same product category, same buyer)
- Include adjacent competitors (overlapping features, competing for budget)
- Include niche/smaller players that compete in specific segments
- Include emerging competitors that may not yet be well-known
- DO NOT include companies from completely different markets

Focus on companies a competitive intelligence professional would flag as threats or alternatives.${exclusionNote}`;

  const rawContent = await callClaude(systemPrompt, userPrompt);

  // 5. Parse response
  let suggestions: Suggestion[];
  try {
    const jsonStr = stripMarkdownFences(rawContent);
    suggestions = JSON.parse(jsonStr);
  } catch (parseError) {
    console.error('[suggest-competitors] Parse error:', (parseError as Error).message);
    console.error('[suggest-competitors] Raw (first 500):', rawContent.slice(0, 500));
    throw new Error('Failed to parse AI response');
  }

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    throw new Error('AI returned empty or invalid suggestions');
  }

  // Validate and clean
  suggestions = suggestions
    .filter((s) => s.name && s.domain && s.reason && typeof s.confidence === 'number')
    .map((s) => ({
      name: String(s.name).trim(),
      domain: String(s.domain).toLowerCase().trim().replace(/^www\./, ''),
      reason: String(s.reason).trim(),
      confidence: Math.max(0, Math.min(1, Number(s.confidence))),
    }))
    // Filter out any that match existing competitors
    .filter((s) => {
      const domainMatch = existingDomains.some((d: string) => d === s.domain);
      const nameMatch = existingNames.some((n: string) => n === s.name.toLowerCase());
      return !domainMatch && !nameMatch;
    })
    .slice(0, 12);

  console.log(`[suggest-competitors] Generated ${suggestions.length} suggestions for user=${userId}`);

  // 6. Cache in DB
  const { error: upsertError } = await serviceClient
    .from('competitor_suggestions')
    .upsert(
      {
        user_id: userId,
        suggestions,
        profile_hash: profileHash,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (upsertError) {
    console.error('[suggest-competitors] Cache upsert failed:', upsertError.message);
    // Continue — still return suggestions even if caching fails
  }

  return new Response(
    JSON.stringify({ suggestions, cached: false }),
    { headers },
  );
}

// ── Action: check-relevance ──────────────────────────────────────────

async function handleCheckRelevance(
  userId: string,
  competitorName: string,
  competitorDomain: string,
  headers: Record<string, string>,
): Promise<Response> {
  const serviceClient = createServiceRoleClient();

  // Fetch user profile
  const { data: profile, error: profileError } = await serviceClient
    .from('user_company_profiles')
    .select('company_name, company_domain, industry')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile?.company_name) {
    // No profile = can't check relevance, return neutral
    return new Response(
      JSON.stringify({ relevance: 0.5, reason: 'Unable to assess — complete your company profile for relevance checks.' }),
      { headers },
    );
  }

  const systemPrompt = `You are a competitive intelligence analyst. You determine whether two companies are actual competitors in the same market.

Return ONLY a JSON object with no additional text:
{
  "relevance": <number 0.0 to 1.0>,
  "reason": "<one sentence explanation, max 20 words>"
}

Scoring guide:
- 0.8-1.0: Direct competitors (same product category, same buyer)
- 0.5-0.7: Indirect competitors (adjacent market, partial overlap)
- 0.2-0.4: Tangential (different market but some feature overlap)
- 0.0-0.1: Not competitors (completely different markets)`;

  const userPrompt = `Company: ${profile.company_name} (${profile.company_domain || 'unknown'}) in ${profile.industry || 'unknown'}
Proposed competitor: ${competitorName} (${competitorDomain || 'unknown'})

Are they competitors?`;

  const rawContent = await callClaude(systemPrompt, userPrompt);

  let result: { relevance: number; reason: string };
  try {
    const jsonStr = stripMarkdownFences(rawContent);
    result = JSON.parse(jsonStr);
  } catch (parseError) {
    console.error('[suggest-competitors] Relevance parse error:', (parseError as Error).message);
    return new Response(
      JSON.stringify({ relevance: 0.5, reason: 'Could not assess relevance' }),
      { headers },
    );
  }

  return new Response(
    JSON.stringify({
      relevance: Math.max(0, Math.min(1, Number(result.relevance) || 0.5)),
      reason: String(result.reason || 'No reason provided').trim(),
    }),
    { headers },
  );
}

// ── Main handler ─────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  try {
    // 1. Auth
    const supabase = createSupabaseClient(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers },
      );
    }

    // 2. Rate limit (10 per minute)
    const rateLimitResponse = enforceRateLimit(req, headers, user.id, 10);
    if (rateLimitResponse) return rateLimitResponse;

    // 3. Parse body
    const body = await req.json().catch(() => null);
    const action = body?.action;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'action is required (suggest | check-relevance)' }),
        { status: 400, headers },
      );
    }

    console.log(`[suggest-competitors] action=${action} user=${user.id}`);

    // 4. Route
    switch (action) {
      case 'suggest':
        return await handleSuggest(user.id, body.profile_override, !!body.force_refresh, headers, req);

      case 'check-relevance': {
        const { competitor_name, competitor_domain } = body;
        if (!competitor_name) {
          return new Response(
            JSON.stringify({ error: 'competitor_name is required' }),
            { status: 400, headers },
          );
        }
        return await handleCheckRelevance(user.id, competitor_name, competitor_domain || '', headers);
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}. Use "suggest" or "check-relevance".` }),
          { status: 400, headers },
        );
    }
  } catch (error) {
    console.error('[suggest-competitors] Error:', (error as Error).message);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers },
    );
  }
});
