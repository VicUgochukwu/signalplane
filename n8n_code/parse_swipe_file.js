// Parse Swipe File response from Anthropic
// Input: Anthropic API response
// Output: Parsed swipe file data ready for database insert

const anthropicResponse = $input.first().json;
const builderData = $('Builder: Swipe File').first().json;

// Extract the JSON content from Anthropic response
const content = anthropicResponse.content[0].text;

// Parse the JSON
let swipeFile;
try {
  swipeFile = JSON.parse(content);
} catch (e) {
  // If parsing fails, try to extract JSON from markdown code blocks
  const jsonMatch = content.match(/```json?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    swipeFile = JSON.parse(jsonMatch[1]);
  } else {
    throw new Error('Failed to parse Anthropic response as JSON');
  }
}

// Validate required fields
if (!swipeFile.phrases || !Array.isArray(swipeFile.phrases)) {
  swipeFile.phrases = [];
}

if (!swipeFile.summary) {
  swipeFile.summary = {
    total_phrases: swipeFile.phrases.length,
    by_persona: {},
    by_category: {},
    new_this_week: swipeFile.phrases.filter(p => p.is_new_this_week).length,
    trending_up: [],
    trending_down: []
  };
}

if (!swipeFile.usage_tips) {
  swipeFile.usage_tips = [];
}

// Build the output for database insert
return [{
  json: {
    week_start: builderData.week_start,
    week_end: builderData.week_end,
    packet_id: builderData.packet_id,
    content_json: swipeFile,
    content_md: JSON.stringify(swipeFile, null, 2),
    included_signal_ids: builderData.input_signal_ids,
    phrase_count: swipeFile.phrases.length
  }
}];
