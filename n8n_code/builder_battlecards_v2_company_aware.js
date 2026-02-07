// Builder: Battlecards v2 (Company-Aware)
// Generates "[Your Company] vs [Competitor]" format when user context available
// Falls back to generic competitor battlecards otherwise

// Reference data from previous nodes using n8n syntax
const weekRange = $('Compute Week Range').first().json;
const packetResult = $('Upsert Packet').first().json;
const scoreResult = $('Score + Select Top Signals').first().json;

const weekStart = weekRange.week_start;
const weekEnd = weekRange.week_end;
const packetId = packetResult.id;

// Check for user context from scoring node
const userContext = {
  user_id: scoreResult.user_id || null,
  company_name: scoreResult.user_company_name || null,
  is_personalized: scoreResult.is_personalized || false
};

// Get signals most relevant for battlecards (messaging and icp signals)
const signals = scoreResult.selected_signals.filter(s =>
  ['messaging', 'icp', 'pricing', 'proof'].includes(s.signal_type)
);

// Configuration
const MAX_COMPETITORS = 3;

// =====================================================
// BUILD COMPANY-AWARE PROMPT
// =====================================================

const isPersonalized = userContext.is_personalized && userContext.company_name;
const companyName = userContext.company_name || 'Your Company';

// Build system prompt based on personalization
const systemPrompt = isPersonalized
  ? `You are a competitive intelligence expert building Battlecards for ${companyName}.

IMPORTANT: All battlecards should be framed as "${companyName} vs [Competitor Name]"

Battlecards are delta-focused: they emphasize WHAT CHANGED THIS WEEK and what ${companyName} should do about it.

CRITICAL: Output STRICT JSON only.

Schema:
{
  "battlecards": [
    {
      "title": "${companyName} vs [Competitor Name]",
      "competitor_name": "string",
      "positioning_statement": "string (why ${companyName} wins against this competitor)",
      "what_changed_this_week": [
        {
          "change": "string (what the competitor did)",
          "implication": "string (what this means for ${companyName})",
          "our_advantage": "string (how ${companyName} is better positioned)",
          "counter_move": "string (recommended response for ${companyName})",
          "signal_ids": ["uuid"],
          "evidence_urls": ["string"]
        }
      ],
      "head_to_head": {
        "we_win_when": ["string (scenarios where ${companyName} has advantage)"],
        "they_win_when": ["string (scenarios to avoid or reframe)"],
        "battleground": "string (where to steer the conversation)"
      },
      "talk_tracks": [
        {
          "scenario": "string (when to use)",
          "opener": "string (how ${companyName} reps should start)",
          "key_points": ["string (3 bullets max)"],
          "proof_point": "string (${companyName} evidence to cite)"
        }
      ],
      "landmines": [
        {
          "claim_to_avoid": "string (what ${companyName} reps should NOT say)",
          "why": "string (why it's risky)",
          "alternative": "string (what to say instead)"
        }
      ]
    }
  ],
  "summary": {
    "company": "${companyName}",
    "competitors_covered": number,
    "total_changes_this_week": number,
    "highest_priority_competitor": "string",
    "key_competitive_shifts": ["string (market movements affecting ${companyName})"]
  }
}

CONSTRAINTS:
- Max ${MAX_COMPETITORS} competitors
- Every battlecard MUST have title in format "${companyName} vs [Competitor]"
- Focus on CHANGES this week and ${companyName}'s response
- positioning_statement is REQUIRED for each competitor
- head_to_head section shows clear competitive dynamics
- Talk tracks must reference ${companyName} specifically
- Landmines protect ${companyName} reps from making risky claims`

  : `You are a competitive intelligence expert building generic Battlecards from GTM signals.

Battlecards are delta-focused: they emphasize WHAT CHANGED THIS WEEK and the implications.

CRITICAL: Output STRICT JSON only.

Schema:
{
  "battlecards": [
    {
      "competitor_name": "string",
      "what_changed_this_week": [
        {
          "change": "string (specific change observed)",
          "implication": "string (what this means for buyers)",
          "counter_move": "string (recommended response)",
          "signal_ids": ["uuid"],
          "evidence_urls": ["string"]
        }
      ],
      "talk_tracks": [
        {
          "scenario": "string (when to use)",
          "opener": "string (how to start)",
          "key_points": ["string (3 bullets max)"],
          "proof_point": "string (evidence to cite)"
        }
      ],
      "landmines": [
        {
          "claim_to_avoid": "string (what NOT to say)",
          "why": "string (why it's risky)",
          "alternative": "string (what to say instead)"
        }
      ],
      "win_themes": ["string (why we win against them)"],
      "lose_themes": ["string (why we might lose)"],
      "ideal_battleground": "string (where to steer the conversation)"
    }
  ],
  "summary": {
    "competitors_covered": number,
    "total_changes_this_week": number,
    "highest_priority_competitor": "string",
    "key_market_shifts": ["string"]
  }
}

CONSTRAINTS:
- Max ${MAX_COMPETITORS} competitors
- Focus on CHANGES this week, not static info
- Talk tracks must be specific, not generic
- Landmines are critical: what claims to AVOID
- Each change needs evidence (signal_ids, evidence_urls)`;

// Build user content with signals
const userContent = `Week: ${weekStart} to ${weekEnd}
Packet ID: ${packetId}
${isPersonalized ? `Company: ${companyName}` : ''}

Build ${isPersonalized ? `"${companyName} vs Competitor"` : ''} Battlecards from these competitive signals:

SIGNALS (${signals.length} total):
${JSON.stringify(signals.map(s => ({
  id: s.id,
  type: s.signal_type,
  severity: s.severity,
  title: s.title,
  summary: s.summary,
  evidence_urls: s.evidence_urls || [],
  decision_type: s.decision_type
})), null, 2)}

Instructions:
1. Identify up to ${MAX_COMPETITORS} competitors mentioned or implied
2. ${isPersonalized ? `Frame each as "${companyName} vs [Competitor]"` : 'Focus on WHAT CHANGED this week'}
3. ${isPersonalized ? `Include positioning_statement showing why ${companyName} wins` : 'Provide specific talk tracks'}
4. ${isPersonalized ? `Add head_to_head section showing competitive dynamics` : 'Highlight landmines'}
5. Include evidence (signal_ids, evidence_urls) for each change`;

// Build Anthropic API body
const anthropicBody = {
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4000,
  temperature: 0.2,
  system: systemPrompt,
  messages: [{ role: 'user', content: userContent }]
};

return [{
  json: {
    builder_type: 'battlecards',
    week_start: weekStart,
    week_end: weekEnd,
    packet_id: packetId,
    // Company context for storage
    user_id: userContext.user_id,
    user_company_name: userContext.company_name,
    is_personalized: isPersonalized,
    // Signal info
    input_signal_count: signals.length,
    input_signal_ids: signals.map(s => s.id),
    anthropic_body: anthropicBody
  }
}];
