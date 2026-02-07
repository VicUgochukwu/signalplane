// Objection Tracker: Emit signals to control_plane.signals
// n8n Code node - processes patterns with significant changes and emits signals
// Outputs: SQL INSERT statements for control_plane.signals

const input = $input.first().json;

// Expected input: result from trend analysis
// {
//   week_start: "2026-02-02",
//   week_end: "2026-02-08",
//   patterns_to_signal: [
//     {
//       pattern_id: "uuid",
//       canonical_text: "objection text",
//       category: "price_value",
//       trend: "rising",
//       count_last_7_days: 5,
//       avg_severity: 3.5,
//       evidence_urls: ["url1", "url2"],
//       signal_reason: "New objection" | "Rising trend" | "High severity spike"
//     }
//   ],
//   drift_detected: boolean,
//   drift_summary: "string describing drift"
// }

const weekStart = input.week_start;
const weekEnd = input.week_end;
const patternsToSignal = input.patterns_to_signal || [];
const driftDetected = input.drift_detected || false;
const driftSummary = input.drift_summary || '';

const signals = [];

// Emit signals for each pattern that warrants attention
for (const pattern of patternsToSignal) {
  // Determine severity based on trend and average severity
  let signalSeverity = Math.round(pattern.avg_severity || 3);
  if (pattern.trend === 'rising') {
    signalSeverity = Math.min(5, signalSeverity + 1);  // Boost for rising trends
  }
  if (pattern.signal_reason === 'New objection') {
    signalSeverity = Math.min(5, signalSeverity + 1);  // Boost for new objections
  }

  // Build signal title
  let title = '';
  switch (pattern.signal_reason) {
    case 'New objection':
      title = `New objection detected: ${pattern.category}`;
      break;
    case 'Rising trend':
      title = `Rising objection trend: ${pattern.category}`;
      break;
    case 'High severity spike':
      title = `High-severity objection spike: ${pattern.category}`;
      break;
    default:
      title = `Objection signal: ${pattern.category}`;
  }

  // Build summary
  const summary = `"${pattern.canonical_text}" - ${pattern.trend} trend with ${pattern.count_last_7_days} occurrences this week (avg severity: ${pattern.avg_severity?.toFixed(1) || 'N/A'})`;

  // Prepare evidence URLs (max 2 per spec)
  const evidenceUrls = (pattern.evidence_urls || []).slice(0, 2);

  signals.push({
    signal_type: 'objection',
    severity: signalSeverity,
    confidence: 0.8,  // Default confidence for automated detection
    title: title,
    summary: summary,
    summary_short: pattern.canonical_text.substring(0, 100),
    evidence_urls: evidenceUrls,
    source_schema: 'objection_tracker',
    source_table: 'patterns',
    source_id: pattern.pattern_id,
    decision_type: 'enablement',  // Objections typically need sales enablement
    recommended_asset: 'talk_track',
    owner_team: 'sales',
    time_sensitivity: pattern.trend === 'rising' ? 'this_week' : 'monitor',
    meta: {
      category: pattern.category,
      trend: pattern.trend,
      count_last_7_days: pattern.count_last_7_days,
      signal_reason: pattern.signal_reason,
      week_start: weekStart,
      week_end: weekEnd
    }
  });
}

// Emit drift signal if drift detected
if (driftDetected && driftSummary) {
  signals.push({
    signal_type: 'objection',
    severity: 4,  // Drift is significant
    confidence: 0.85,
    title: 'Objection pattern drift detected',
    summary: driftSummary,
    summary_short: 'Significant shift in objection patterns',
    evidence_urls: [],
    source_schema: 'objection_tracker',
    source_table: 'trend_snapshots',
    source_id: input.snapshot_id || 'drift-' + weekStart,
    decision_type: 'positioning',  // Drift often requires positioning review
    recommended_asset: 'deck',
    owner_team: 'PMM',
    time_sensitivity: 'this_week',
    meta: {
      drift_detected: true,
      drift_summary: driftSummary,
      week_start: weekStart,
      week_end: weekEnd
    }
  });
}

// Return signals ready for insertion
if (signals.length === 0) {
  return [{ json: { skip: true, reason: 'No signals to emit' } }];
}

return signals.map(signal => ({ json: signal }));
