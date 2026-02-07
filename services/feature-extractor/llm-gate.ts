// LLM Gating Logic
// Decides whether to call LLM based on feature diff and budget

import type { FeatureDiff, GatingDecision, CostBudget, GatingReason } from './types';

export function shouldCallLLM(
  featureDiff: FeatureDiff,
  costBudget: CostBudget
): GatingDecision {
  // Rule 1: No meaningful change = no LLM
  if (!featureDiff.has_meaningful_change) {
    return {
      should_call_llm: false,
      reason: 'no_meaningful_change',
      estimated_tokens: 0,
    };
  }

  // Rule 2: Budget exhausted = no LLM
  if (costBudget.remaining_calls <= 0 || costBudget.remaining_tokens <= 0) {
    return {
      should_call_llm: false,
      reason: 'budget_exhausted',
      estimated_tokens: 0,
    };
  }

  // Rule 3: Only cosmetic changes = no LLM
  const nonCosmeticChanges = featureDiff.changes.filter(
    c => c.significance !== 'cosmetic'
  );

  if (nonCosmeticChanges.length === 0) {
    return {
      should_call_llm: false,
      reason: 'cosmetic_only',
      estimated_tokens: 0,
    };
  }

  // Proceed with LLM
  const estimatedTokens = estimateTokens(featureDiff);

  // Final budget check
  if (estimatedTokens > costBudget.remaining_tokens) {
    return {
      should_call_llm: false,
      reason: 'budget_exhausted',
      estimated_tokens: estimatedTokens,
    };
  }

  return {
    should_call_llm: true,
    reason: 'meaningful_change',
    estimated_tokens: estimatedTokens,
  };
}

function estimateTokens(featureDiff: FeatureDiff): number {
  // Base tokens for prompt structure
  let tokens = 500;

  // Add tokens based on number of changes
  tokens += featureDiff.changes.length * 100;

  // Add tokens for complex change types
  for (const change of featureDiff.changes) {
    if (Array.isArray(change.old_value)) {
      tokens += (change.old_value as unknown[]).length * 20;
    }
    if (Array.isArray(change.new_value)) {
      tokens += (change.new_value as unknown[]).length * 20;
    }
  }

  // Response tokens estimation
  tokens += 300;

  return tokens;
}

// Summary generator for when LLM is skipped
export function generateSkipSummary(
  featureDiff: FeatureDiff,
  reason: GatingReason
): string {
  switch (reason) {
    case 'no_meaningful_change':
      return 'No significant changes detected. Page content remains stable.';

    case 'cosmetic_only':
      const cosmeticChanges = featureDiff.changes
        .filter(c => c.significance === 'cosmetic')
        .map(c => c.field.split('.').pop())
        .join(', ');
      return `Minor cosmetic changes only: ${cosmeticChanges}. No strategic signal.`;

    case 'budget_exhausted':
      return 'Budget limit reached. Changes detected but analysis deferred.';

    default:
      return 'Analysis skipped.';
  }
}

// Build a minimal LLM prompt when gating decides to call LLM
export function buildLLMPrompt(featureDiff: FeatureDiff): string {
  const majorChanges = featureDiff.changes.filter(c => c.significance === 'major');
  const minorChanges = featureDiff.changes.filter(c => c.significance === 'minor');

  let prompt = `Analyze these ${featureDiff.page_type} page changes:\n\n`;

  if (majorChanges.length > 0) {
    prompt += `MAJOR CHANGES:\n`;
    for (const change of majorChanges) {
      prompt += `- ${change.field}: ${JSON.stringify(change.old_value)} → ${JSON.stringify(change.new_value)}\n`;
    }
    prompt += '\n';
  }

  if (minorChanges.length > 0) {
    prompt += `MINOR CHANGES:\n`;
    for (const change of minorChanges) {
      prompt += `- ${change.field}: ${JSON.stringify(change.old_value)} → ${JSON.stringify(change.new_value)}\n`;
    }
    prompt += '\n';
  }

  prompt += `Provide a brief strategic analysis (2-3 sentences) of what these changes indicate about the company's direction.`;

  return prompt;
}
