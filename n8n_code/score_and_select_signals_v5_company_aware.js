// Score + Select Top Signals v5 (Company-Aware)
// Supports per-user competitor filtering when userContext is provided
// Falls back to all signals if no user context (generic mode)

const signals = $input.all().map(item => item.json);
const weekRange = $('Compute Week Range').first().json;

// Check if we have user context from upstream "Load User Context" node
let userContext = null;
try {
  const userContextNode = $('Load User Context');
  if (userContextNode && userContextNode.first()) {
    userContext = userContextNode.first().json;
  }
} catch (e) {
  // No user context node - run in generic mode
  userContext = null;
}

// Configuration: per-ship caps (from Control Plane v2 implementation plan Phase 6)
const SHIP_CAPS = {
  // Original ships
  messaging: 8,
  narrative: 5,
  icp: 5,
  horizon: 3,
  objection: 5,
  // New ships from Phase 2-3
  pricing: 4,
  proof: 3,
  distribution: 3,
  hiring: 2,
  launch_decay: 2,
  // Experiment surveillance
  experiment: 5
};

const MAX_PER_SECTION = 6;
const MAX_TOTAL = 45;

// Scoring weights
const WEIGHTS = {
  severity: 8,      // 1-5 severity * 8 = 0-40 points
  recency: 30,      // max 30 points, decays over 7 days
  confidence: 15,   // 0-1 confidence * 15 = 0-15 points
  source_quality: 15 // high=15, medium=10, low=5
};

// =====================================================
// COMPANY-AWARE FILTERING
// =====================================================

// Filter signals to only include user's tracked competitors
function filterByUserCompetitors(allSignals, userCtx) {
  if (!userCtx || !userCtx.competitor_ids || userCtx.competitor_ids.length === 0) {
    // No filtering - return all signals (generic mode)
    return allSignals;
  }

  const competitorIds = new Set(userCtx.competitor_ids);
  const competitorDomains = new Set((userCtx.competitor_domains || []).map(d => d?.toLowerCase()));
  const competitorNames = new Set((userCtx.competitor_names || []).map(n => n?.toLowerCase()));

  return allSignals.filter(signal => {
    // Check direct company_id match
    if (signal.company_id && competitorIds.has(signal.company_id)) {
      return true;
    }

    // Check domain match in evidence URLs or signal content
    const evidenceUrls = signal.evidence_urls || [];
    for (const url of evidenceUrls) {
      const urlLower = (url || '').toLowerCase();
      for (const domain of competitorDomains) {
        if (domain && urlLower.includes(domain)) {
          return true;
        }
      }
    }

    // Check competitor name mention in title/summary
    const titleLower = (signal.title || '').toLowerCase();
    const summaryLower = (signal.summary || '').toLowerCase();
    for (const name of competitorNames) {
      if (name && (titleLower.includes(name) || summaryLower.includes(name))) {
        return true;
      }
    }

    return false;
  });
}

// Apply company-aware filtering if user context exists
const filteredSignals = filterByUserCompetitors(signals, userContext);

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

  // Experiment signals get a boost based on combined_score from surveillance
  let experimentBoost = 0;
  if (signal.signal_type === 'experiment' && signal.meta?.combined_score) {
    experimentBoost = Math.min(signal.meta.combined_score * 0.5, 20);
  }

  return Math.round((severityScore + recencyScore + confidenceScore + sourceScore + experimentBoost) * 100) / 100;
}

// Infer decision_type based on signal type and content
function inferDecisionType(signal) {
  const signalType = signal.signal_type;
  const title = (signal.title || '').toLowerCase();
  const summary = (signal.summary || '').toLowerCase();

  // Original ships
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
  if (signalType === 'objection') {
    if (title.includes('pricing') || summary.includes('price')) return 'packaging';
    if (title.includes('compet') || summary.includes('alternative')) return 'positioning';
    return 'enablement';
  }

  // New ships from Phase 2-3
  if (signalType === 'pricing') return 'packaging';
  if (signalType === 'proof') return 'proof';
  if (signalType === 'distribution') return 'distribution';
  if (signalType === 'hiring') return 'risk';
  if (signalType === 'launch_decay') return 'positioning';

  // Experiment surveillance
  if (signalType === 'experiment') {
    const category = signal.meta?.pattern_category || signal.decision_type;
    if (category === 'packaging') return 'packaging';
    if (category === 'proof') return 'proof';
    if (category === 'distribution') return 'distribution';
    if (category === 'strategy') return 'risk';
    return 'positioning';
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
    risk: 'deck',
    hiring: 'battlecard'
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
    risk: 'exec',
    hiring: 'exec'
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
const enrichedSignals = filteredSignals.map(signal => {
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

// All sections including experiment
const sections = [
  'messaging', 'narrative', 'icp', 'horizon', 'objection',
  'pricing', 'proof', 'distribution', 'hiring', 'launch_decay',
  'experiment'
];

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
  signalSummaries[section] = (selectedBySection[section] || []).map(s => ({
    id: s.id,
    severity: s.severity,
    title: s.title,
    summary_short: s.summary_short,
    score: s.score,
    decision_type: s.decision_type,
    time_sensitivity: s.time_sensitivity,
    // Include experiment-specific fields
    ...(s.signal_type === 'experiment' ? {
      survivorship_score: s.meta?.survivorship_score,
      propagation_score: s.meta?.propagation_score,
      companies: s.meta?.companies
    } : {})
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

// =====================================================
// BUILD PERSONALIZED PROMPT
// =====================================================

const isPersonalized = userContext && userContext.company_name;
const companyName = userContext?.company_name || 'your company';
const competitorsList = userContext?.competitor_names?.join(', ') || 'competitors in your market';

// Build system prompt with strict JSON schema
const systemPrompt = `You are a GTM intelligence analyst creating weekly packets for ${isPersonalized ? companyName + "'s" : 'a'} PMM team. Synthesize signals into actionable intelligence.

${isPersonalized ? `
COMPANY CONTEXT:
- Company: ${companyName}
- Tracked competitors: ${competitorsList}
- Frame all insights as "${companyName} vs [Competitor]" where relevant
` : ''}

SIGNAL CATEGORIES:
- messaging: Homepage and positioning changes
- narrative: Market narrative shifts
- icp: Target audience signals
- horizon: Platform and market shifts
- objection: Customer objections and concerns
- pricing: Pricing and packaging changes
- proof: Trust signals and social proof
- distribution: Integration and partnership moves
- hiring: Hiring signals indicating strategy
- launch_decay: Post-launch momentum tracking
- experiment: Market-wide pattern winners (proven and emerging)

CRITICAL: Output STRICT JSON only. No markdown, no explanations outside the JSON.

Required JSON schema:
{
  "packet_title": "string (Week of YYYY-MM-DD: descriptive title)",
  "exec_summary": ["string (max 7 bullets, each under 100 chars)"],
  "sections": {
    "messaging": {"summary": "string", "highlights": ["string"], "action_items": ["string"]},
    "narrative": {"summary": "string", "highlights": ["string"], "action_items": ["string"]},
    "icp": {"summary": "string", "highlights": ["string"], "action_items": ["string"]},
    "horizon": {"summary": "string", "highlights": ["string"], "action_items": ["string"]},
    "objection": {"summary": "string", "highlights": ["string"], "action_items": ["string"]},
    "pricing": {"summary": "string", "highlights": ["string"], "action_items": ["string"]},
    "proof": {"summary": "string", "highlights": ["string"], "action_items": ["string"]},
    "distribution": {"summary": "string", "highlights": ["string"], "action_items": ["string"]},
    "hiring": {"summary": "string", "highlights": ["string"], "action_items": ["string"]},
    "launch_decay": {"summary": "string", "highlights": ["string"], "action_items": ["string"]}
  },
  "market_winners": {
    "proven": [
      {
        "pattern_label": "string",
        "what_changed": "string (1 line)",
        "where_seen": ["company names"],
        "survival_weeks": number,
        "why_it_matters": "string",
        "implementation_guidance": "string"
      }
    ],
    "emerging": [
      {
        "pattern_label": "string",
        "what_changed": "string",
        "where_seen": ["company names"],
        "why_it_matters": "string"
      }
    ]
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
- All signal_ids must be valid UUIDs from the input
- For sections with no signals, use {"summary": "No signals this week", "highlights": [], "action_items": []}
- market_winners: synthesize experiment signals into actionable patterns
  - proven: max 3 patterns with high survivorship
  - emerging: max 3 patterns gaining traction`;

// Build user content with all signal types
const userContent = `Week: ${weekRange.week_start} to ${weekRange.week_end}
${isPersonalized ? `Company: ${companyName}` : ''}
${isPersonalized ? `Tracked Competitors: ${competitorsList}` : ''}
Total signals loaded: ${signals.length}
After competitor filtering: ${filteredSignals.length}
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

OBJECTION SIGNALS (${signalSummaries.objection.length}):
${JSON.stringify(signalSummaries.objection, null, 2)}

PRICING SIGNALS (${signalSummaries.pricing.length}):
${JSON.stringify(signalSummaries.pricing, null, 2)}

PROOF SIGNALS (${signalSummaries.proof.length}):
${JSON.stringify(signalSummaries.proof, null, 2)}

DISTRIBUTION SIGNALS (${signalSummaries.distribution.length}):
${JSON.stringify(signalSummaries.distribution, null, 2)}

HIRING SIGNALS (${signalSummaries.hiring.length}):
${JSON.stringify(signalSummaries.hiring, null, 2)}

LAUNCH DECAY SIGNALS (${signalSummaries.launch_decay.length}):
${JSON.stringify(signalSummaries.launch_decay, null, 2)}

EXPERIMENT SIGNALS (Market Winners) (${signalSummaries.experiment.length}):
${JSON.stringify(signalSummaries.experiment, null, 2)}

Generate weekly GTM intelligence packet with predictions, action mapping, and Market Winners section.`;

// Build Anthropic API body
const anthropicBody = {
  model: 'claude-sonnet-4-20250514',
  max_tokens: 5000,
  temperature: 0.3,
  system: systemPrompt,
  messages: [{ role: 'user', content: userContent }]
};

return [{
  json: {
    week_start: weekRange.week_start,
    week_end: weekRange.week_end,
    // Company context for downstream nodes
    user_id: userContext?.user_id || null,
    user_company_name: userContext?.company_name || null,
    is_personalized: isPersonalized,
    // Stats
    total_signals: signals.length,
    filtered_signals: filteredSignals.length,
    selected_count: totalSelected.length,
    selected_signals: totalSelected,
    signal_summaries: signalSummaries,
    action_summary: actionSummary,
    anthropic_body: anthropicBody
  }
}];
