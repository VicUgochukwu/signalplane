// Objection Tracker: Webhook Ingest Handler
// Receives manual objection submissions via webhook
// Supports: LinkedIn exports, CRM exports, manual entry, CSV data

const webhookData = $input.first().json;

// Validate required fields
const rawText = webhookData.text || webhookData.content || webhookData.raw_text || '';
const sourceName = webhookData.source_name || webhookData.source || 'manual_import';

if (!rawText || rawText.trim().length < 10) {
  return [{
    json: {
      success: false,
      error: 'Missing or invalid text content (minimum 10 characters)',
      received: webhookData
    }
  }];
}

// Determine source type from source_name or explicit type
function detectSourceType(name, explicitType) {
  if (explicitType) return explicitType;
  const lower = name.toLowerCase();
  if (lower.includes('linkedin')) return 'linkedin';
  if (lower.includes('call') || lower.includes('gong') || lower.includes('chorus')) return 'call_recording';
  if (lower.includes('chat') || lower.includes('intercom') || lower.includes('drift')) return 'chat';
  if (lower.includes('email')) return 'email';
  if (lower.includes('crm') || lower.includes('salesforce') || lower.includes('hubspot')) return 'crm';
  if (lower.includes('survey') || lower.includes('nps')) return 'survey';
  if (lower.includes('support') || lower.includes('zendesk') || lower.includes('ticket')) return 'support_ticket';
  return 'manual';
}

const sourceType = detectSourceType(sourceName, webhookData.source_type);

// Generate external ID if not provided
const externalId = webhookData.external_id ||
  webhookData.id ||
  `${sourceName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Parse date - accept various formats
function parseDate(dateInput) {
  if (!dateInput) return new Date().toISOString();

  // If already ISO string
  if (typeof dateInput === 'string' && dateInput.includes('T')) {
    return dateInput;
  }

  // Try parsing
  const parsed = new Date(dateInput);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return new Date().toISOString();
}

// Build standardized item
const item = {
  external_id: externalId,
  raw_text: rawText.trim(),
  source_url: webhookData.url || webhookData.source_url || webhookData.link || null,
  source_author: webhookData.author || webhookData.source_author || webhookData.name || webhookData.contact || null,
  source_date: parseDate(webhookData.date || webhookData.source_date || webhookData.created_at),
  meta: {
    platform: sourceType,
    import_method: 'webhook',
    imported_at: new Date().toISOString(),
    // Preserve any additional metadata
    ...(webhookData.meta || {}),
    // Common CRM/LinkedIn fields
    company: webhookData.company || webhookData.organization || null,
    title: webhookData.title || webhookData.job_title || null,
    deal_stage: webhookData.deal_stage || webhookData.stage || null,
    deal_value: webhookData.deal_value || webhookData.amount || null,
    tags: webhookData.tags || [],
    // LinkedIn specific
    connection_degree: webhookData.connection_degree || null,
    profile_url: webhookData.profile_url || webhookData.linkedin_url || null
  }
};

// Look up or create source
// If source_id is provided, use it directly
// Otherwise we'll need to look up/create in next node
const sourceId = webhookData.source_id || null;

return [{
  json: {
    source_id: sourceId,
    source_name: sourceName,
    source_type: sourceType,
    items: [item],
    webhook_metadata: {
      received_at: new Date().toISOString(),
      ip: $input.first().json._ip || 'unknown',
      batch_id: webhookData.batch_id || null
    },
    _action: 'ingest_webhook'
  }
}];
