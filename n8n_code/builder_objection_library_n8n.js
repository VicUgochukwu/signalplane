// Builder 1: Living Objection Library
// Uses n8n cross-node references to pull data from upstream nodes
// Output: Versioned objection library markdown
// Hard caps: max 12 objections, max 2 evidence links per objection in main view

// Reference data from previous nodes using n8n syntax
const weekRange = $('Compute Week Range').first().json;
const packetResult = $('Upsert Packet').first().json;
const scoreResult = $('Score + Select Top Signals').first().json;

const weekStart = weekRange.week_start;
const weekEnd = weekRange.week_end;
const packetId = packetResult.id;

// Get signals (filtered to messaging, narrative, icp - most relevant for objections)
const signals = scoreResult.selected_signals.filter(s =>
  ['messaging', 'narrative', 'icp'].includes(s.signal_type)
);

// Configuration
const MAX_OBJECTIONS = 12;
const MAX_EVIDENCE_PER_OBJECTION = 2;

// Categories for taxonomy
const OBJECTION_CATEGORIES = [
  'price_value',      // "Too expensive", "ROI unclear"
  'timing',           // "Not now", "Just renewed competitor"
  'complexity',       // "Too complex", "Don't have resources"
  'risk',             // "Security concerns", "Vendor stability"
  'fit',              // "Not right for us", "Missing features"
  'competition',      // "Competitor does X better"
  'inertia'           // "Current solution works fine", "Change is hard"
];

// Build system prompt for Anthropic
const systemPrompt = `You are a sales enablement expert building an Objection Library from GTM signals.

CRITICAL: Output STRICT JSON only.

Schema:
{
  "objections": [
    {
      "category": "price_value|timing|complexity|risk|fit|competition|inertia",
      "objection_text": "string (the objection as a buyer would say it)",
      "frequency": "high|medium|low",
      "personas": ["string (personas who raise this)"],
      "segments": ["string (segments where common)"],
      "evidence_urls": ["string (max ${MAX_EVIDENCE_PER_OBJECTION})"],
      "rebuttal": {
        "acknowledge": "string (validate the concern)",
        "reframe": "string (shift perspective)",
        "proof": "string (evidence to cite)",
        "talk_track": "string (suggested response)"
      },
      "signal_ids": ["uuid (source signals)"],
      "is_new_this_week": true|false
    }
  ],
  "summary": {
    "total_objections": number,
    "top_category": "string",
    "new_this_week": number,
    "trending_up": ["string (objections growing)"],
    "trending_down": ["string (objections fading)"]
  }
}

CONSTRAINTS:
- Max ${MAX_OBJECTIONS} objections
- Max ${MAX_EVIDENCE_PER_OBJECTION} evidence URLs per objection
- Each objection must have at least one signal_id as evidence
- Rebuttals must be specific and actionable, not generic
- Mark objections as new_this_week if they appear for first time`;

// Build user content with signals
const userContent = `Week: ${weekStart} to ${weekEnd}
Packet ID: ${packetId}

Build an Objection Library from these signals:

SIGNALS (${signals.length} total):
${JSON.stringify(signals.map(s => ({
  id: s.id,
  type: s.signal_type,
  severity: s.severity,
  title: s.title,
  summary: s.summary,
  evidence_urls: s.evidence_urls || []
})), null, 2)}

Extract objections mentioned or implied in these signals. Group by category, provide evidence-linked rebuttals.`;

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
    builder_type: 'objection_library',
    week_start: weekStart,
    week_end: weekEnd,
    packet_id: packetId,
    input_signal_count: signals.length,
    input_signal_ids: signals.map(s => s.id),
    anthropic_body: anthropicBody
  }
}];
