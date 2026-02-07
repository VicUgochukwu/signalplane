// Builder 2: Buyer Swipe File (language that grows)
// Uses n8n cross-node references to pull data from upstream nodes
// Output: Versioned swipe file markdown with persona-tagged phrases
// Hard caps: max 30 phrases total, max 5 per persona

// Reference data from previous nodes using n8n syntax
const weekRange = $('Compute Week Range').first().json;
const packetResult = $('Upsert Packet').first().json;
const scoreResult = $('Score + Select Top Signals').first().json;

const weekStart = weekRange.week_start;
const weekEnd = weekRange.week_end;
const packetId = packetResult.id;

// Get all signals (swipe file uses all types for buyer language)
const signals = scoreResult.selected_signals;

// Configuration
const MAX_PHRASES_TOTAL = 30;
const MAX_PHRASES_PER_PERSONA = 5;

// Phrase categories
const PHRASE_CATEGORIES = [
  'pain',              // Current pain they feel
  'desired_outcome',   // What they want to achieve
  'anxiety',           // Fears about change/buying
  'alternative',       // How they describe alternatives
  'success_criteria',  // How they measure success
  'trigger_event'      // What caused them to look
];

// Build system prompt for Anthropic
const systemPrompt = `You are a buyer language expert building a Swipe File from GTM signals.

A Swipe File contains exact phrases and language buyers use, organized by persona and category.
This helps PMM and sales speak the buyer's language.

CRITICAL: Output STRICT JSON only.

Schema:
{
  "phrases": [
    {
      "phrase": "string (exact language a buyer would use)",
      "category": "pain|desired_outcome|anxiety|alternative|success_criteria|trigger_event",
      "persona": "string (e.g., 'VP Engineering', 'IC Developer', 'CFO')",
      "segment": "string (e.g., 'Enterprise', 'SMB', 'Startup')",
      "funnel_stage": "awareness|consideration|decision|onboarding|expansion",
      "evidence_urls": ["string"],
      "signal_ids": ["uuid"],
      "usage_context": "string (when/how to use this phrase)",
      "is_new_this_week": true|false,
      "trend": "rising|stable|fading"
    }
  ],
  "summary": {
    "total_phrases": number,
    "by_persona": {"persona_name": number},
    "by_category": {"category_name": number},
    "new_this_week": number,
    "trending_up": ["string (phrases gaining traction)"],
    "trending_down": ["string (phrases becoming stale)"]
  },
  "usage_tips": [
    "string (how to use this swipe file effectively)"
  ]
}

CONSTRAINTS:
- Max ${MAX_PHRASES_TOTAL} phrases total
- Max ${MAX_PHRASES_PER_PERSONA} per persona
- Phrases must sound like actual buyer language, not marketing speak
- Each phrase needs context on when/how to use it
- Mark new and trending phrases`;

// Build user content with signals
const userContent = `Week: ${weekStart} to ${weekEnd}
Packet ID: ${packetId}

Build a Buyer Swipe File from these signals:

SIGNALS (${signals.length} total):
${JSON.stringify(signals.map(s => ({
  id: s.id,
  type: s.signal_type,
  severity: s.severity,
  title: s.title,
  summary: s.summary,
  evidence_urls: s.evidence_urls || [],
  meta: s.meta || {}
})), null, 2)}

Extract buyer language phrases. Focus on:
1. Pain statements (how they describe problems)
2. Desired outcomes (what they want to achieve)
3. Anxieties (fears about buying/changing)
4. How they describe alternatives/competitors
5. Success criteria (how they measure ROI)
6. Trigger events (what made them look)`;

// Build Anthropic API body
const anthropicBody = {
  model: 'claude-sonnet-4-20250514',
  max_tokens: 2500,
  temperature: 0.2,
  system: systemPrompt,
  messages: [{ role: 'user', content: userContent }]
};

return [{
  json: {
    builder_type: 'swipe_file',
    week_start: weekStart,
    week_end: weekEnd,
    packet_id: packetId,
    input_signal_count: signals.length,
    input_signal_ids: signals.map(s => s.id),
    anthropic_body: anthropicBody
  }
}];
