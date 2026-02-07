// Parse Battlecards response from Anthropic
// Input: Anthropic API response
// Output: Array of parsed battlecards ready for database insert (one per competitor)

const anthropicResponse = $input.first().json;
const builderData = $('Builder: Battlecards').first().json;

// Extract the JSON content from Anthropic response
const content = anthropicResponse.content[0].text;

// Parse the JSON
let battlecardsData;
try {
  battlecardsData = JSON.parse(content);
} catch (e) {
  // If parsing fails, try to extract JSON from markdown code blocks
  const jsonMatch = content.match(/```json?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    battlecardsData = JSON.parse(jsonMatch[1]);
  } else {
    throw new Error('Failed to parse Anthropic response as JSON');
  }
}

// Validate required fields
if (!battlecardsData.battlecards || !Array.isArray(battlecardsData.battlecards)) {
  battlecardsData.battlecards = [];
}

// Build the output - one item per competitor for database insert
const items = battlecardsData.battlecards.map(card => ({
  json: {
    competitor_name: card.competitor_name,
    week_start: builderData.week_start,
    week_end: builderData.week_end,
    content_md: JSON.stringify(card, null, 2),
    included_signal_ids: card.what_changed_this_week?.flatMap(c => c.signal_ids || []) || [],
    what_changed_summary: card.what_changed_this_week?.map(c => c.change).join('; ') || ''
  }
}));

// Return all items (n8n will process each as a separate insert)
return items;
