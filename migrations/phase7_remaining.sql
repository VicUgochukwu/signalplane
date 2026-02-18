-- =============================================================================
-- Phase 7 Remaining: Updated ship_status view + Sector Pack RPCs
-- =============================================================================

-- ─── 1. Updated ship_status view ────────────────────────────────────────────
-- Expands from original 5 signal types to all current signal types

CREATE OR REPLACE VIEW ops.ship_status AS
WITH latest_signals AS (
  SELECT
    signal_type,
    MAX(created_at) as last_signal_at,
    COUNT(*) as signal_count_7d
  FROM control_plane.signals
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY signal_type
),
expected_ships AS (
  SELECT unnest(ARRAY[
    -- Original core ships
    'messaging', 'narrative', 'icp', 'horizon', 'objection',
    -- Phase 2-3 ships
    'pricing', 'proof', 'distribution', 'hiring', 'launch_decay', 'experiment',
    -- External signal types
    'social', 'review', 'video', 'code', 'launch', 'community',
    'funding', 'talent', 'patent', 'crm_intel',
    -- Win/Loss signals
    'winloss_win_pattern', 'winloss_loss_pattern', 'winloss_switch_pattern', 'winloss_trend_shift',
    -- VoC Research signals
    'research_pain_trend', 'research_desire_trend', 'research_language_shift', 'research_criteria_shift',
    -- Positioning signals
    'positioning_alignment', 'positioning_differentiation', 'positioning_narrative_fit', 'positioning_drift',
    -- Packaging signals
    'packaging_tier_change', 'packaging_metric_shift', 'packaging_gate_change', 'packaging_landscape_shift'
  ]) as ship_name
)
SELECT
  es.ship_name,
  ls.last_signal_at,
  COALESCE(ls.signal_count_7d, 0) as signal_count_7d,
  CASE
    WHEN ls.last_signal_at IS NULL THEN 'missing'
    WHEN ls.last_signal_at < NOW() - INTERVAL '14 days' THEN 'stale'
    WHEN ls.last_signal_at > NOW() - INTERVAL '3 days' THEN 'healthy'
    ELSE 'ok'
  END as status,
  EXTRACT(EPOCH FROM (NOW() - ls.last_signal_at)) / 3600 as hours_since_last_signal
FROM expected_ships es
LEFT JOIN latest_signals ls ON es.ship_name = ls.signal_type
ORDER BY es.ship_name;

COMMENT ON VIEW ops.ship_status IS 'Real-time status of all signal-emitting ships (expanded to all signal types)';

-- ─── 2. Sector Pack RPCs ────────────────────────────────────────────────────

-- 2a. Get all enabled sector packs (for onboarding selection)
CREATE OR REPLACE FUNCTION public.get_sector_packs()
RETURNS TABLE (
  id UUID,
  pack_slug TEXT,
  pack_name TEXT,
  description TEXT,
  sector TEXT,
  motion TEXT,
  company_count INT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.pack_slug,
    p.pack_name,
    p.description,
    p.sector,
    p.motion,
    p.company_count
  FROM sector_packs.packs p
  WHERE p.enabled = true
  ORDER BY p.pack_name;
END;
$$;

-- 2b. Get companies for a specific sector pack
CREATE OR REPLACE FUNCTION public.get_pack_companies(p_pack_id UUID)
RETURNS TABLE (
  id UUID,
  company_name TEXT,
  company_domain TEXT,
  tier TEXT,
  tracked_urls JSONB
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.id,
    pc.company_name,
    pc.company_domain,
    pc.tier,
    pc.tracked_urls
  FROM sector_packs.pack_companies pc
  WHERE pc.pack_id = p_pack_id
    AND pc.enabled = true
  ORDER BY
    CASE pc.tier
      WHEN 'leader' THEN 1
      WHEN 'challenger' THEN 2
      WHEN 'emerging' THEN 3
      ELSE 4
    END,
    pc.company_name;
END;
$$;

-- 2c. Subscribe user to a sector pack (called after onboarding)
CREATE OR REPLACE FUNCTION public.subscribe_to_sector_pack(
  p_user_id UUID,
  p_pack_id UUID,
  p_is_primary BOOLEAN DEFAULT true
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO sector_packs.user_subscriptions (user_id, pack_id, is_primary)
  VALUES (p_user_id, p_pack_id, p_is_primary)
  ON CONFLICT (user_id, pack_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;
END;
$$;
