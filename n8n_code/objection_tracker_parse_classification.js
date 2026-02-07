// Objection Tracker: Parse Anthropic classification response
// n8n Code node - receives Anthropic response, outputs structured events
// Outputs: Array of objection events ready for database insertion

const anthropicResponse = $input.first().json;
const classifyData = $('Classify Objections').first().json;

// Get the source info and original items
const sourceId = classifyData.source_id;
const sourceName = classifyData.source_name;
const items = classifyData.items;

// Extract content from Anthropic response
const content = anthropicResponse.content[0].text;

// Parse JSON (handle potential markdown code fences)
let classifications;
try {
  // First try to extract JSON from markdown code blocks
  const jsonMatch = content.match(/```json?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    classifications = JSON.parse(jsonMatch[1]);
  } else {
    classifications = JSON.parse(content);
  }
} catch (e) {
  throw new Error('Failed to parse Anthropic classification response: ' + e.message + '\n\nRaw content: ' + content.substring(0, 500));
}

// Validate structure
if (!classifications.classifications || !Array.isArray(classifications.classifications)) {
  throw new Error('Invalid classification response structure. Expected { classifications: [...] }');
}

// Build objection events
const events = [];

for (const classification of classifications.classifications) {
  const itemIndex = classification.item_index;
  const originalItem = items[itemIndex];

  if (!originalItem) {
    console.warn(`Item index ${itemIndex} not found in original items`);
    continue;
  }

  // Skip if no objections found
  if (!classification.objections || classification.objections.length === 0) {
    continue;
  }

  // Create an event for each objection found
  for (const objection of classification.objections) {
    // Validate required fields
    if (!objection.objection_text || !objection.category) {
      console.warn('Skipping objection with missing required fields');
      continue;
    }

    // Validate category
    const validCategories = [
      'price_value', 'timing', 'complexity', 'risk', 'fit',
      'competition', 'inertia', 'authority', 'trust'
    ];
    if (!validCategories.includes(objection.category)) {
      console.warn(`Invalid category: ${objection.category}, defaulting to 'fit'`);
      objection.category = 'fit';
    }

    // Validate severity
    const severity = Math.max(1, Math.min(5, Math.round(objection.severity || 3)));

    // Validate confidence
    const confidence = Math.max(0, Math.min(1, objection.confidence || 0.7));

    // Validate funnel stage
    const validFunnelStages = ['awareness', 'consideration', 'decision', 'onboarding', 'expansion'];
    const funnelStage = validFunnelStages.includes(objection.funnel_stage) ? objection.funnel_stage : null;

    events.push({
      source_id: sourceId,
      external_id: originalItem.external_id || null,
      raw_text: originalItem.raw_text,
      objection_text: objection.objection_text,
      context_text: objection.context || null,
      category: objection.category,
      severity: severity,
      confidence: confidence,
      persona: objection.persona || null,
      segment: objection.segment || null,
      funnel_stage: funnelStage,
      source_url: originalItem.source_url || null,
      source_author: originalItem.source_author || null,
      source_date: originalItem.source_date || null,
      meta: originalItem.meta || {}
    });
  }
}

// Return events for database insertion
// If no events, return a skip indicator
if (events.length === 0) {
  return [{ json: { skip: true, reason: 'No objections found in classification' } }];
}

return events.map(event => ({ json: event }));
