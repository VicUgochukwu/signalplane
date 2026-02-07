// Objection Tracker: Classify raw text into objection events
// n8n Code node - receives raw text from source fetchers
// Outputs: Anthropic API request body for classification

const input = $input.first().json;

// Expected input structure:
// {
//   source_id: "uuid",
//   source_name: "G2 Reviews",
//   source_type: "review_site",
//   items: [
//     { external_id: "...", raw_text: "...", source_url: "...", source_date: "...", meta: {} }
//   ]
// }

const sourceId = input.source_id;
const sourceName = input.source_name;
const sourceType = input.source_type;
const items = input.items || [];

if (!items.length) {
  return [{ json: { skip: true, reason: 'No items to classify' } }];
}

// System prompt for objection classification
const systemPrompt = `You are an expert at identifying and classifying buyer objections from customer feedback, reviews, and conversations.

Your task is to analyze text and extract any buyer objections present.

## Objection Categories
- price_value: Cost concerns, ROI unclear, budget issues
- timing: Not the right time, not ready, bad timing
- complexity: Too hard to implement, steep learning curve, integration challenges
- risk: Security concerns, compliance issues, vendor risk
- fit: Doesn't fit needs, wrong solution, feature gaps
- competition: Competitor is better/cheaper, already using alternative
- inertia: Current solution works fine, don't want to change
- authority: Need buy-in from others, not the decision maker
- trust: Don't trust vendor, product quality concerns, reliability worries

## Severity Scale (1-5)
1 = Minor concern, easily addressed
2 = Moderate concern, requires explanation
3 = Significant concern, needs proof/case study
4 = Major concern, potential deal-breaker
5 = Critical concern, likely deal-killer

## Output Format
For each text input, identify objections and output a JSON array.
If no objection is found, output an empty array for that item.

CRITICAL: Output STRICT JSON only. No markdown code fences, no explanation text.

Output structure:
{
  "classifications": [
    {
      "item_index": 0,
      "objections": [
        {
          "objection_text": "exact objection phrase from text",
          "category": "price_value|timing|complexity|risk|fit|competition|inertia|authority|trust",
          "severity": 1-5,
          "confidence": 0.0-1.0,
          "persona": "detected persona or null",
          "segment": "detected segment or null",
          "funnel_stage": "awareness|consideration|decision|onboarding|expansion or null",
          "context": "brief context around the objection"
        }
      ]
    }
  ]
}`;

// Build user content with items to classify
const itemsForClassification = items.map((item, idx) => ({
  index: idx,
  text: item.raw_text,
  source: sourceName,
  url: item.source_url || null
}));

const userContent = `Analyze the following ${items.length} text items from "${sourceName}" (${sourceType}) and extract any buyer objections.

Items to analyze:
${JSON.stringify(itemsForClassification, null, 2)}

Remember:
- Only extract actual objections (complaints, concerns, hesitations about buying/using)
- Skip generic positive/neutral feedback
- Be precise with the objection_text - use the buyer's actual words
- Confidence should reflect how clearly this is an objection (vs general feedback)`;

// Build Anthropic API request
const anthropicBody = {
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4000,
  temperature: 0.1,  // Low temperature for consistent classification
  system: systemPrompt,
  messages: [
    {
      role: 'user',
      content: userContent
    }
  ]
};

return [{
  json: {
    source_id: sourceId,
    source_name: sourceName,
    source_type: sourceType,
    items: items,  // Pass through for later processing
    anthropic_body: anthropicBody
  }
}];
