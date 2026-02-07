// Prepare Packet for Insert
// This code node properly escapes all packet data for SQL insertion

const packet = $input.first().json.packet;
const weekStart = $input.first().json.week_start;
const weekEnd = $input.first().json.week_end;

// Helper function to escape a string for PostgreSQL
// Doubles single quotes and escapes backslashes
function escapeForPg(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/'/g, "''");     // Then escape single quotes
}

// Helper to escape JSON for PostgreSQL jsonb
// JSON.stringify produces valid JSON, but we need to escape it for SQL string literal
function escapeJsonForPg(obj) {
  const jsonStr = JSON.stringify(obj);
  return escapeForPg(jsonStr);
}

return [{
  json: {
    week_start: weekStart,
    week_end: weekEnd,
    packet_title_escaped: escapeForPg(packet.packet_title),
    exec_summary_escaped: packet.exec_summary.map(s => escapeForPg(s)),
    sections_escaped: escapeJsonForPg(packet.sections),
    key_questions_escaped: packet.key_questions.map(q => escapeForPg(q)),
    bets_escaped: escapeJsonForPg(packet.bets || []),
    predictions_escaped: escapeJsonForPg(packet.predictions || []),
    action_mapping_escaped: escapeJsonForPg(packet.action_mapping || {})
  }
}];
