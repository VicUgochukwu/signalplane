// Parse Packet JSON v2 (with predictions + action_mapping fallback)
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
try {
  packet = JSON.parse(responseText);
} catch (e) {
  // Try to extract JSON from response if wrapped in text
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
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

  // Predictions fallback handling
  predictions: Array.isArray(packet.predictions) ? packet.predictions.map(p => ({
    hypothesis: p.hypothesis || '',
    what_to_watch: p.what_to_watch || '',
    signal_ids: Array.isArray(p.signal_ids) ? p.signal_ids : [],
    confidence: ['low', 'medium', 'high'].includes(p.confidence) ? p.confidence : 'medium',
    timeframe: p.timeframe || 'next 2 weeks'
  })).slice(0, 5) : [],

  // Action mapping fallback handling
  action_mapping: {
    this_week: Array.isArray(packet.action_mapping?.this_week)
      ? packet.action_mapping.this_week.map(a => ({
          action: a.action || '',
          owner: a.owner || 'PMM',
          asset: a.asset || ''
        }))
      : [],
    monitor: Array.isArray(packet.action_mapping?.monitor)
      ? packet.action_mapping.monitor
      : []
  },

  // Bets fallback handling
  bets: Array.isArray(packet.bets) ? packet.bets.map(b => ({
    hypothesis: b.hypothesis || '',
    signal_ids: Array.isArray(b.signal_ids) ? b.signal_ids : [],
    confidence: ['low', 'medium', 'high'].includes(b.confidence) ? b.confidence : 'medium'
  })).slice(0, 3) : []
};

// Build output for database insert
return [{
  json: {
    week_start: weekData.week_start,
    week_end: weekData.week_end,
    packet_title: parsedPacket.packet_title,
    exec_summary: parsedPacket.exec_summary,
    sections_json: parsedPacket.sections,
    key_questions: parsedPacket.key_questions,
    predictions_json: parsedPacket.predictions,
    action_mapping_json: parsedPacket.action_mapping,
    bets_json: parsedPacket.bets,
    selected_signals: weekData.selected_signals,
    action_summary: weekData.action_summary,
    total_signals: weekData.total_signals,
    selected_count: weekData.selected_count
  }
}];
