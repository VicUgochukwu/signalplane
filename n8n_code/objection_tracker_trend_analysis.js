// Objection Tracker: Trend Analysis and Drift Detection
// n8n Code node - analyzes patterns and determines which need signaling
// Outputs: Patterns to signal + drift detection results

const input = $input.first().json;

// Expected input from Load Patterns node:
// {
//   week_start: "2026-02-02",
//   week_end: "2026-02-08",
//   patterns: [...],  // All patterns with updated counts
//   previous_snapshot: { category_counts: {...}, ... } or null
// }

const weekStart = input.week_start;
const weekEnd = input.week_end;
const patterns = input.patterns || [];
const previousSnapshot = input.previous_snapshot;

const patternsToSignal = [];
let driftDetected = false;
let driftSummary = '';

// --- 1. Identify patterns that warrant signals ---

for (const pattern of patterns) {
  let signalReason = null;

  // Check for NEW objections (first seen this week)
  const firstSeenDate = new Date(pattern.first_seen_at);
  const weekStartDate = new Date(weekStart);
  if (firstSeenDate >= weekStartDate) {
    signalReason = 'New objection';
  }

  // Check for RISING trends with significant volume
  if (!signalReason && pattern.trend === 'rising' && pattern.count_last_7_days >= 3) {
    signalReason = 'Rising trend';
  }

  // Check for HIGH SEVERITY spikes
  if (!signalReason && pattern.avg_severity >= 4 && pattern.count_last_7_days >= 2) {
    signalReason = 'High severity spike';
  }

  // Add to signal list if reason found
  if (signalReason) {
    patternsToSignal.push({
      pattern_id: pattern.id,
      canonical_text: pattern.canonical_text,
      category: pattern.category,
      trend: pattern.trend,
      trend_score: pattern.trend_score,
      count_last_7_days: pattern.count_last_7_days,
      count_last_30_days: pattern.count_last_30_days,
      avg_severity: pattern.avg_severity,
      evidence_urls: pattern.evidence_urls || [],
      signal_reason: signalReason
    });
  }
}

// Sort by severity and trend importance
patternsToSignal.sort((a, b) => {
  // Prioritize: new > rising > high severity
  const priorityMap = { 'New objection': 3, 'Rising trend': 2, 'High severity spike': 1 };
  const priorityDiff = (priorityMap[b.signal_reason] || 0) - (priorityMap[a.signal_reason] || 0);
  if (priorityDiff !== 0) return priorityDiff;

  // Then by severity
  return (b.avg_severity || 0) - (a.avg_severity || 0);
});

// Cap at max 8 signals per week (to avoid noise)
const cappedPatterns = patternsToSignal.slice(0, 8);

// --- 2. Drift Detection ---

if (previousSnapshot && previousSnapshot.category_counts) {
  const prevCounts = previousSnapshot.category_counts;

  // Calculate current week's category counts
  const currentCounts = {};
  for (const pattern of patterns) {
    if (pattern.count_last_7_days > 0) {
      currentCounts[pattern.category] = (currentCounts[pattern.category] || 0) + pattern.count_last_7_days;
    }
  }

  // Calculate total for proportions
  const prevTotal = Object.values(prevCounts).reduce((a, b) => a + b, 0) || 1;
  const currTotal = Object.values(currentCounts).reduce((a, b) => a + b, 0) || 1;

  // Track significant shifts
  const significantShifts = [];
  const allCategories = new Set([...Object.keys(prevCounts), ...Object.keys(currentCounts)]);

  for (const category of allCategories) {
    const prevProp = (prevCounts[category] || 0) / prevTotal;
    const currProp = (currentCounts[category] || 0) / currTotal;
    const shift = currProp - prevProp;

    // Significant if shift is > 15% of total
    if (Math.abs(shift) > 0.15) {
      significantShifts.push({
        category,
        direction: shift > 0 ? 'increased' : 'decreased',
        magnitude: Math.abs(shift * 100).toFixed(1)
      });
    }
  }

  // Check for new categories appearing
  for (const category of Object.keys(currentCounts)) {
    if (!prevCounts[category] && currentCounts[category] >= 3) {
      significantShifts.push({
        category,
        direction: 'emerged',
        magnitude: currentCounts[category]
      });
    }
  }

  // Check for categories disappearing
  for (const category of Object.keys(prevCounts)) {
    if (prevCounts[category] >= 3 && !currentCounts[category]) {
      significantShifts.push({
        category,
        direction: 'disappeared',
        magnitude: prevCounts[category]
      });
    }
  }

  // Build drift summary if significant shifts found
  if (significantShifts.length > 0) {
    driftDetected = true;
    const shiftDescriptions = significantShifts.map(s => {
      if (s.direction === 'emerged') {
        return `${s.category} objections emerged (${s.magnitude} occurrences)`;
      } else if (s.direction === 'disappeared') {
        return `${s.category} objections disappeared`;
      } else {
        return `${s.category} ${s.direction} by ${s.magnitude}%`;
      }
    });
    driftSummary = `Objection pattern drift detected: ${shiftDescriptions.join('; ')}`;
  }
}

// --- 3. Output ---

return [{
  json: {
    week_start: weekStart,
    week_end: weekEnd,
    patterns_to_signal: cappedPatterns,
    total_patterns_analyzed: patterns.length,
    total_signals: cappedPatterns.length,
    drift_detected: driftDetected,
    drift_summary: driftSummary
  }
}];
