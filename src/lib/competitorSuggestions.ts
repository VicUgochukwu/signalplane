import { invokeEdgeFunction } from '@/lib/edge-functions';

// ── Types ────────────────────────────────────────────────────────────

export interface CompetitorSuggestion {
  name: string;
  domain: string;
  reason: string;
  confidence: number;
}

export interface SuggestResponse {
  suggestions: CompetitorSuggestion[];
  cached: boolean;
}

export interface RelevanceResponse {
  relevance: number;
  reason: string;
}

export interface ProfileOverride {
  company_name: string;
  company_domain: string;
  industry: string;
}

// ── API calls ────────────────────────────────────────────────────────

/**
 * Fetch AI-generated competitor suggestions.
 * Uses cached results when available (7-day TTL, profile-hash aware).
 *
 * @param profileOverride  Pass this during onboarding when profile isn't saved to DB yet
 */
export async function fetchCompetitorSuggestions(
  profileOverride?: ProfileOverride,
  forceRefresh?: boolean,
): Promise<SuggestResponse> {
  return invokeEdgeFunction<SuggestResponse>('suggest-competitors', {
    action: 'suggest',
    ...(profileOverride ? { profile_override: profileOverride } : {}),
    ...(forceRefresh ? { force_refresh: true } : {}),
  });
}

/**
 * Check how relevant a proposed competitor is to the user's company.
 * Returns a relevance score (0-1) and a short explanation.
 */
export async function checkCompetitorRelevance(
  competitorName: string,
  competitorDomain: string,
): Promise<RelevanceResponse> {
  return invokeEdgeFunction<RelevanceResponse>('suggest-competitors', {
    action: 'check-relevance',
    competitor_name: competitorName,
    competitor_domain: competitorDomain,
  });
}

// ── UI helpers ───────────────────────────────────────────────────────

/** Confidence badge color */
export function confidenceBadge(confidence: number): string {
  if (confidence >= 0.8) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (confidence >= 0.5) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
}

/** Confidence label */
export function confidenceTag(confidence: number): string {
  if (confidence >= 0.8) return 'Strong match';
  if (confidence >= 0.5) return 'Likely match';
  return 'Possible';
}

/** Relevance severity */
export function relevanceLevel(relevance: number): 'high' | 'medium' | 'low' {
  if (relevance >= 0.5) return 'high';
  if (relevance >= 0.3) return 'medium';
  return 'low';
}
