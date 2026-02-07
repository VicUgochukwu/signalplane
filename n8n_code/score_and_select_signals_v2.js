// Score + Select Top Signals v2 (with actual scoring logic + action mapping)
// Max 6 per section, max 25 total
// Enforces per-ship caps from upgrade plan

const signals = $input.all().map(item => item.json);
const weekRange = $('Compute Week Range').first().json;

// Configuration: per-ship caps (from upgrade plan)
const SHIP_CAPS = {
  messaging: 8,
  narrative: 5,
  icp: 5,
  horizon: 3
};

const MAX_PER_SECTION = 6;
const MAX_TOTAL = 25;

// Scoring weights
const WEIGHTS = {
  severity: 8,      // 1-5 severity * 8 = 0-40 points
  recency: 30,      // max 30 points, decays over 7 days
  confidence: 15,   // 0-1 confidence * 15 = 0-15 points
  source_quality: 15 // high=15, medium=10, low=5
};

// Compute actual score for a signal
function computeScore(signal) {
  const now = new Date();
  const createdAt = new Date(signal.created_at);
  const daysOld = (now - createdAt) / (1000 * 60 * 60 * 24);

  // Severity weight (0-40 points)
  const severityScore = (signal.severity || 3) * WEIGHTS.severity;

  // Recency weight (decays over 7 days)
  const recencyScore = Math.max(0, WEIGHTS.recency - (daysOld * 4.3));

  // Confidence weight (0-15 points)
  const confidenceScore = (parseFloat(signal.confidence) || 0.5) * WEIGHTS.confidence;

  // Source quality weight
  const sourceQuality = signal.source_quality || 'medium';
  const sourceScore = sourceQuality === 'high' ? 15 : sourceQuality === 'medium' ? 10 : 5;

  return Math.round((severityScore + recencyScore + confidenceScore + sourceScore) * 100) / 100;
}

// Infer decision_type based on signal type and content
function inferDecisionType(signal) {
  const signalType = signal.signal_type;
  const title = (signal.title || '').toLowerCase();
  const summary = (signal.summary || '').toLowerCase();

  if (signalType === 'messaging') {
    if (title.includes('pricing') || summary.includes('pricing')) return 'packaging';
    if (title.includes('compet') || summary.includes('compet')) return 'positioning';
    return 'positioning';
  }
  if (signalType === 'narrative') {
    if (title.includes('risk') || summary.includes('risk')) return 'risk';
    return 'positioning';
  }
  if (signalType === 'icp') {
    if (title.includes('churn') || summary.includes('churn')) return 'risk';
    if (title.includes('expand') || summary.includes('expand')) return 'distribution';
    return 'distribution';
  }
  if (signalType === 'horizon') {
    if (title.includes('threat') || summary.includes('threat')) return 'risk';
    return 'proof';
  }
  return 'enablement';
}

// Infer recommended_asset based on decision_type
function inferRecommendedAsset(decisionType) {
  const mapping = {
    positioning: 'homepage',
    packaging: 'pricing',
    distribution: 'deck',
    proof: 'talk_track',
    enablement: 'talk_track',
    risk: 'deck'
  };
  return mapping[decisionType] || 'none';
}

// Infer owner_team based on decision_type
function inferOwnerTeam(decisionType) {
  const mapping = {
    positioning: 'PMM',
    packaging: 'PMM',
    distribution: 'sales',
    proof: 'PMM',
    enablement: 'sales',
    risk: 'exec'
  };
  return mapping[decisionType] || 'PMM';
}

// Infer time_sensitivity based on severity
function inferTimeSensitivity(severity) {
  if (severity >= 4) return 'now';
  if (severity >= 3) return 'this_week';
  return 'monitor';
}

// Process each signal: compute score and action mapping
const enrichedSignals = signals.map(signal => {
  const score = computeScore(signal);
  const decisionType = inferDecisionType(signal);

  return {
    ...signal,
    score: score,
    promo_score: score,
    decision_type: decisionType,
    recommended_asset: inferRecommendedAsset(decisionType),
    owner_team: inferOwnerTeam(decisionType),
    time_sensitivity: inferTimeSensitivity(signal.severity || 3),
    summary_short: signal.summary ? signal.summary.substring(0, 100) + (signal.summary.length > 100 ? '...' : '') : ''
  };
});

// Group by signal_type and apply caps
const sections = ['messaging', 'narrative', 'icp', 'horizon'];
const selectedBySection = {};
let totalSelected = [];

for (const section of sections) {
  const cap = SHIP_CAPS[section] || MAX_PER_SECTION;

  // Get signals for this section, sort by score descending
  const sectionSignals = enrichedSignals
    .filter(s => s.signal_type === section)
    .sort((a, b) => b.score - a.score)
    .slice(0, cap);

  selectedBySection[section] = sectionSignals;
  totalSelected = totalSelected.concat(sectionSignals);
}

// Enforce total cap (keep highest scores)
if (totalSelected.length > MAX_TOTAL) {
  totalSelected.sort((a, b) => b.score - a.score);
  totalSelected = totalSelected.slice(0, MAX_TOTAL);
}

// Build signal summaries for Anthropic prompt
const signalSummaries = {};
for (const section of sections) {
  signalSummaries[section] = selectedBySection[section].map(s => ({
    id: s.id,
    severity: s.severity,
    title: s.title,
    summary_short: s.summary_short,
    score: s.score,
    decision_type: s.decision_type,
    time_sensitivity: s.time_sensitivity
  }));
}

// Build action mapping summary for prompt
const actionSummary = {
  positioning: totalSelected.filter(s => s.decision_type === 'positioning').length,
  packaging: totalSelected.filter(s => s.decision_type === 'packaging').length,
  distribution: totalSelected.filter(s => s.decision_type === 'distribution').length,
  proof: totalSelected.filter(s => s.decision_type === 'proof').length,
  enablement: totalSelected.filter(s => s.decision_type === 'enablement').length,
  risk: totalSelected.filter(s => s.decision_type === 'risk').length,
  urgent_count: totalSelected.filter(s => s.time_sensitivity === 'now').length,
  this_week_count: totalSelected.filter(s => s.time_sensitivity === 'this_week').length
};

// Build system prompt with strict JSON schema
const systemPrompt = `You are a GTM intelligence analyst creating weekly packets for a PMM team. Synthesize signals into actionable intelligence.

CRITICAL: Output STRICT JSON only. No markdown, no explanations outside the JSON.

Required JSON schema:
{
  "packet_title": "string (Week of YYYY-MM-DD: descriptive title)",
  "exec_summary": ["string (max 7 bullets, each under 100 chars)"],
  "sections": {
    "messaging": {"summary": "string", "highlights": ["string"], "action_items": ["string"]},
    "narrative": {"summary": "string", "highlights": ["string"], "action_items": ["string"]},
    "icp": {"summary": "string", "highlights": ["string"], "action_items": ["string"]},
    "horizon": {"summary": "string", "highlights": ["string"], "action_items": ["string"]}
  },
  "key_questions": ["string (3-5 strategic questions)"],
  "predictions": [
    {
      "hypothesis": "string (testable prediction)",
      "what_to_watch": "string (evidence to track)",
      "signal_ids": ["uuid"],
      "confidence": "low|medium|high",
      "timeframe": "string (e.g., 'next 2 weeks')"
    }
  ],
  "action_mapping": {
    "this_week": [{"action": "string", "owner": "PMM|sales|CS|product|exec", "asset": "string"}],
    "monitor": ["string (things to track)"]
  },
  "bets": [
    {
      "hypothesis": "string",
      "signal_ids": ["uuid"],
      "confidence": "low|medium|high"
    }
  ]
}

CONSTRAINTS:
- exec_summary: max 7 bullets
- predictions: 2-5 items, must be testable hypotheses
- bets: max 3 items
- All signal_ids must be valid UUIDs from the input`;

// Build user content
const userContent = `Week: ${weekRange.week_start} to ${weekRange.week_end}
Total signals loaded: ${signals.length}
Selected for packet: ${totalSelected.length}

ACTION MAPPING SUMMARY:
- Positioning signals: ${actionSummary.positioning}
- Packaging signals: ${actionSummary.packaging}
- Distribution signals: ${actionSummary.distribution}
- Proof signals: ${actionSummary.proof}
- Enablement signals: ${actionSummary.enablement}
- Risk signals: ${actionSummary.risk}
- URGENT (act now): ${actionSummary.urgent_count}
- This week priority: ${actionSummary.this_week_count}

MESSAGING SIGNALS (${signalSummaries.messaging.length}):
${JSON.stringify(signalSummaries.messaging, null, 2)}

NARRATIVE SIGNALS (${signalSummaries.narrative.length}):
${JSON.stringify(signalSummaries.narrative, null, 2)}

ICP SIGNALS (${signalSummaries.icp.length}):
${JSON.stringify(signalSummaries.icp, null, 2)}

HORIZON SIGNALS (${signalSummaries.horizon.length}):
${JSON.stringify(signalSummaries.horizon, null, 2)}

Generate weekly GTM intelligence packet with predictions and action mapping.`;

// Build Anthropic API body
const anthropicBody = {
  model: 'claude-sonnet-4-20250514',
  max_tokens: 3000,
  temperature: 0.3,
  system: systemPrompt,
  messages: [{ role: 'user', content: userContent }]
};

return [{
  json: {
    week_start: weekRange.week_start,
    week_end: weekRange.week_end,
    total_signals: signals.length,
    selected_count: totalSelected.length,
    selected_signals: totalSelected,
    signal_summaries: signalSummaries,
    action_summary: actionSummary,
    anthropic_body: anthropicBody
  }
}];
