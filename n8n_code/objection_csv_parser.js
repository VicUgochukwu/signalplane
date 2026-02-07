// Objection Tracker: CSV/Batch Parser
// Parses CSV or JSON array input for bulk imports
// Commonly used for LinkedIn Sales Navigator exports, CRM exports

const input = $input.first().json;
const sourceName = input.source_name || 'csv_import';
const sourceType = input.source_type || 'manual';
const sourceId = input.source_id || null;

// Input can be:
// 1. Array of items in input.items or input.data
// 2. CSV string in input.csv
// 3. Direct array as input

let rawItems = [];

if (Array.isArray(input.items)) {
  rawItems = input.items;
} else if (Array.isArray(input.data)) {
  rawItems = input.data;
} else if (Array.isArray(input)) {
  rawItems = input;
} else if (typeof input.csv === 'string') {
  // Parse CSV string
  // Simple CSV parser - assumes first row is headers
  const lines = input.csv.trim().split('\n');
  if (lines.length > 1) {
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'));
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      rawItems.push(row);
    }
  }
}

// CSV line parser that handles quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Map various field names to our standard format
function mapToStandard(row) {
  // Find the text field - try various common names
  const textFields = ['text', 'content', 'raw_text', 'message', 'body', 'note', 'notes', 'comment', 'feedback', 'objection', 'description'];
  let rawText = '';
  for (const field of textFields) {
    if (row[field]) {
      rawText = row[field];
      break;
    }
  }

  // Find date field
  const dateFields = ['date', 'created_at', 'created', 'timestamp', 'time', 'sent_date', 'received_date'];
  let sourceDate = null;
  for (const field of dateFields) {
    if (row[field]) {
      sourceDate = row[field];
      break;
    }
  }

  // Find author field
  const authorFields = ['author', 'name', 'from', 'sender', 'contact', 'first_name', 'full_name', 'customer', 'prospect'];
  let sourceAuthor = null;
  for (const field of authorFields) {
    if (row[field]) {
      sourceAuthor = row[field];
      break;
    }
  }

  // Find URL field
  const urlFields = ['url', 'link', 'source_url', 'profile_url', 'linkedin_url'];
  let sourceUrl = null;
  for (const field of urlFields) {
    if (row[field]) {
      sourceUrl = row[field];
      break;
    }
  }

  // Build external ID
  const externalId = row.id || row.external_id ||
    `${sourceName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    external_id: externalId,
    raw_text: rawText,
    source_url: sourceUrl,
    source_author: sourceAuthor,
    source_date: sourceDate ? new Date(sourceDate).toISOString() : new Date().toISOString(),
    meta: {
      platform: sourceType,
      import_method: 'csv_batch',
      imported_at: new Date().toISOString(),
      // Preserve additional fields
      company: row.company || row.organization || row.account || null,
      title: row.title || row.job_title || row.position || null,
      deal_stage: row.deal_stage || row.stage || row.status || null,
      deal_value: row.deal_value || row.amount || row.value || null,
      industry: row.industry || null,
      // LinkedIn specific
      connection_degree: row.connection_degree || row.degree || null,
      profile_url: row.profile_url || row.linkedin_url || null,
      // Original row for debugging
      _original_row: row
    }
  };
}

// Process all items
const items = [];
for (const row of rawItems) {
  const mapped = mapToStandard(row);

  // Skip items without text content
  if (!mapped.raw_text || mapped.raw_text.trim().length < 10) {
    continue;
  }

  items.push(mapped);
}

return [{
  json: {
    source_id: sourceId,
    source_name: sourceName,
    source_type: sourceType,
    items: items,
    import_stats: {
      total_rows: rawItems.length,
      valid_items: items.length,
      skipped: rawItems.length - items.length
    },
    _action: 'csv_import'
  }
}];
