// Parse Objection Library response from Anthropic
// Input: Anthropic API response
// Output: Parsed objection library data ready for database insert

const anthropicResponse = $input.first().json;
const builderData = $('Builder: Objection Library').first().json;

// Extract the JSON content from Anthropic response
const content = anthropicResponse.content[0].text;

// Parse the JSON
let objectionLibrary;
try {
  objectionLibrary = JSON.parse(content);
} catch (e) {
  // If parsing fails, try to extract JSON from markdown code blocks
  const jsonMatch = content.match(/```json?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    objectionLibrary = JSON.parse(jsonMatch[1]);
  } else {
    throw new Error('Failed to parse Anthropic response as JSON');
  }
}

// Validate required fields
if (!objectionLibrary.objections || !Array.isArray(objectionLibrary.objections)) {
  objectionLibrary.objections = [];
}

if (!objectionLibrary.summary) {
  objectionLibrary.summary = {
    total_objections: objectionLibrary.objections.length,
    top_category: objectionLibrary.objections[0]?.category || 'unknown',
    new_this_week: objectionLibrary.objections.filter(o => o.is_new_this_week).length,
    trending_up: [],
    trending_down: []
  };
}

// Build the output for database insert
return [{
  json: {
    week_start: builderData.week_start,
    week_end: builderData.week_end,
    packet_id: builderData.packet_id,
    content_json: objectionLibrary,
    content_md: JSON.stringify(objectionLibrary, null, 2),
    included_signal_ids: builderData.input_signal_ids,
    objection_count: objectionLibrary.objections.length
  }
}];
