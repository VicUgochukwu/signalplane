// Objection Tracker: Upsert Source on Webhook
// Creates or retrieves source record for incoming webhook data
// Used when webhook doesn't provide a source_id

const input = $input.first().json;
const sourceName = input.source_name;
const sourceType = input.source_type;
const existingSourceId = input.source_id;

// If we already have a source_id, just pass through
if (existingSourceId) {
  return [$input.first()];
}

// Build SQL to upsert source
// This will be executed by a Postgres node
const upsertQuery = `
  INSERT INTO objection_tracker.sources (source_name, source_type, fetch_method, enabled)
  VALUES ('${sourceName.replace(/'/g, "''")}', '${sourceType}', 'webhook', true)
  ON CONFLICT (source_name)
  DO UPDATE SET
    last_fetched_at = NOW(),
    enabled = true
  RETURNING id;
`;

return [{
  json: {
    ...input,
    _upsert_query: upsertQuery,
    _needs_source_lookup: true
  }
}];
