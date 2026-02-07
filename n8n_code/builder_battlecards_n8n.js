// Builder 3: Battlecards that update themselves (delta-first)
// Uses n8n cross-node references to pull data from upstream nodes
// Output: Versioned battlecards per competitor
// Hard caps: max 3 competitors per week

// Reference data from previous nodes using n8n syntax
const weekRange = $('Compute Week Range').first().json;
const packetResult = $('Upsert Packet').first().json;
const scoreResult = $('Score + Select Top Signals').first().json;

const weekStart = weekRange.week_start;
const weekEnd = weekRange.week_end;
const packetId = packetResult.id;

// Get signals most relevant for battlecards (messaging and icp signals)
const signals = scoreResult.selected_signals.filter(s =>
  ['messaging', 'icp'].includes(s.signal_type)
);

// Configuration
const MAX_COMPETITORS = 3;

// Build system prompt for Anthropic
const systemPrompt = `You are a competitive intelligence expert building Battlecards from GTM signals.

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
          "implication": "string (what this means for us)",
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

Build Battlecards from these competitive signals:

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
2. For each competitor, focus on WHAT CHANGED this week
3. Provide specific talk tracks (not generic platitudes)
4. Highlight landmines (claims we should NOT make)
5. Include win/lose themes based on signal evidence`;

// Build Anthropic API body
const anthropicBody = {
  model: 'claude-sonnet-4-20250514',
  max_tokens: 3000,
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
    input_signal_count: signals.length,
    input_signal_ids: signals.map(s => s.id),
    anthropic_body: anthropicBody
  }
}];
