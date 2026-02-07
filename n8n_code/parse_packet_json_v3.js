// Parse Packet JSON v3 (with predictions + action_mapping fallback + SQL escaping)
// Handles Anthropic response and extracts structured packet data

const anthropicResponse = $input.first().json;
const weekData = $('Score + Select Top Signals').first().json;

// Extract the text content from Anthropic response
let responseText = '';
if (anthropicResponse.content && anthropicResponse.content[0]) {
  responseText = anthropicResponse.content[0].text || '';
} else if (typeof anthropicResponse === 'string') {
  responseText = anthropicResponse;
}

// Clean up potential markdown code fences
responseText = responseText.trim();
if (responseText.startsWith('```json')) {
  responseText = responseText.slice(7);
}
if (responseText.startsWith('```')) {
  responseText = responseText.slice(3);
}
if (responseText.endsWith('```')) {
  responseText = responseText.slice(0, -3);
}
responseText = responseText.trim();

// Parse the JSON
let packet;
const jsonMatch = responseText.match(/\{[\s\S]*\}/);
if (jsonMatch) {
  try {
    packet = JSON.parse(jsonMatch[0]);
  } else {
    throw new Error('Failed to parse packet JSON: ' + e.message);
  }
}

// Ensure required fields with fallbacks
const parsedPacket = {
  packet_title: packet.packet_title || `Week of ${weekData.week_start}: GTM Intelligence Packet`,
  exec_summary: Array.isArray(packet.exec_summary) ? packet.exec_summary.slice(0, 7) : [],
  sections: {
    messaging: packet.sections?.messaging || { summary: '', highlights: [], action_items: [] },
    narrative: packet.sections?.narrative || { summary: '', highlights: [], action_items: [] },
    icp: packet.sections?.icp || { summary: '', highlights: [], action_items: [] },
    horizon: packet.sections?.horizon || { summary: '', highlights: [], action_items: [] },
    objection: packet.sections?.objection || { summary: '', highlights: [], action_items: [] }
  },
  key_questions: Array.isArray(packet.key_questions) ? packet.key_questions.slice(0, 5) : [],
  bets: Array.isArray(packet.bets) ? packet.bets.slice(0, 3) : [],
  // New fields from v4
  predictions: Array.isArray(packet.predictions) ? packet.predictions.slice(0, 5) : [],
  action_mapping: packet.action_mapping || { this_week: [], monitor: [] },
  market_winners: packet.market_winners || { proven: [], emerging: [] }
};

// Helper function to escape a string for PostgreSQL SQL literals
// Escapes backslashes first, then single quotes
function escapeForPg(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/'/g, "''");     // Then escape single quotes (double them for SQL)
}

// Helper to escape JSON for PostgreSQL jsonb column
function escapeJsonForPg(obj) {
  const jsonStr = JSON.stringify(obj);
  return escapeForPg(jsonStr);
}

// Return with both original packet data AND pre-escaped versions for SQL
return [{
  json: {
    week_start: weekData.week_start,
    week_end: weekData.week_end,
    // Original packet object (for reference/debugging)
    packet: parsedPacket,
    // Pre-escaped fields for direct SQL insertion
    packet_title_escaped: escapeForPg(parsedPacket.packet_title),
    exec_summary_escaped: parsedPacket.exec_summary.map(s => escapeForPg(s)),
    sections_escaped: escapeJsonForPg(parsedPacket.sections),
    key_questions_escaped: parsedPacket.key_questions.map(q => escapeForPg(q)),
    bets_escaped: escapeJsonForPg(parsedPacket.bets),
    predictions_escaped: escapeJsonForPg(parsedPacket.predictions),
    action_mapping_escaped: escapeJsonForPg(parsedPacket.action_mapping),
    // Additional data passed through
    selected_signals: weekData.selected_signals,
    action_summary: weekData.action_summary,
    total_signals: weekData.total_signals,
    selected_count: weekData.selected_count
  }
}];
