import { usePilot } from './usePilot';
import type { GatedFeature, Tier } from '@/types/teams';
import { FEATURE_TIER_MAP } from '@/types/teams';

/**
 * Hook for tier-based feature gating.
 *
 * Returns the current tier and a `canUse(feature)` helper
 * that checks whether the user's tier allows a specific feature.
 *
 * Usage:
 *   const { tier, canUse } = useTierGate();
 *   if (canUse('judgment_loop')) { ... }
 */
export function useTierGate() {
  const { tier, status, isPilot, isGrace, isFree, isPaid, isLoading } = usePilot();

  /**
   * Check if the user's current tier allows a given feature.
   * - Pilot users (60-day trial) can use ALL features.
   * - Grace period users keep full access (7-day warning window).
   * - Free users get limited features.
   * - Growth / Enterprise get everything.
   */
  const canUse = (feature: GatedFeature): boolean => {
    const allowedTiers = FEATURE_TIER_MAP[feature];
    if (!allowedTiers) return false;
    return allowedTiers.includes(tier as Tier);
  };

  const { maxCompetitors } = usePilot();

  /**
   * Check if the user can add another competitor based on their tier limit.
   */
  const canAddCompetitor = (currentCount: number): boolean => {
    return currentCount < maxCompetitors;
  };

  return {
    tier,
    status,
    isPilot,
    isGrace,
    isFree,
    isPaid,
    canUse,
    canAddCompetitor,
    maxCompetitors,
    isLoading,
  };
}
