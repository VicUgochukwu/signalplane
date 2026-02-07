-- Company-Aware Intelligence v2: Add unique constraint for per-user packets
-- Run this AFTER company_aware_intelligence_v1.sql

-- =========================================================
-- SECTION 1: Update packets unique constraint to support per-user packets
-- =========================================================

-- Drop existing unique constraint on packets if it exists
DROP INDEX IF EXISTS control_plane.packets_week_unique;
DROP INDEX IF EXISTS control_plane.idx_packets_week_unique;

-- Create new unique constraint that allows one packet per user per week
-- NULL user_id = generic packet, non-NULL = personalized packet
CREATE UNIQUE INDEX IF NOT EXISTS idx_packets_user_week_unique
ON control_plane.packets (
  COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid),
  week_start,
  week_end
);

COMMENT ON INDEX control_plane.idx_packets_user_week_unique IS
'Ensures one packet per user per week. NULL user_id (coalesced to zero UUID) = generic packet.';


-- =========================================================
-- SECTION 2: Update battlecard_versions unique constraint
-- =========================================================

-- Drop old unique constraint
DROP INDEX IF EXISTS gtm_artifacts.idx_battlecard_competitor_week;

-- Create new unique constraint that includes user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_battlecard_user_competitor_week
ON gtm_artifacts.battlecard_versions (
  COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid),
  competitor_name,
  week_start,
  week_end
);

COMMENT ON INDEX gtm_artifacts.idx_battlecard_user_competitor_week IS
'Ensures one battlecard per user per competitor per week.';


-- =========================================================
-- SECTION 3: Add index for querying user's packets
-- =========================================================

-- Index for fetching all packets for a specific user
CREATE INDEX IF NOT EXISTS idx_packets_user_created
ON control_plane.packets (user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- Index for fetching generic packets (for explorers)
CREATE INDEX IF NOT EXISTS idx_packets_generic
ON control_plane.packets (created_at DESC)
WHERE user_id IS NULL;


-- =========================================================
-- SECTION 4: Helper view for fetching user-appropriate packets
-- =========================================================

-- View that returns either personalized or generic packets for a user
CREATE OR REPLACE VIEW control_plane.user_packets AS
SELECT
  p.*,
  CASE
    WHEN p.user_id IS NOT NULL THEN 'personalized'
    ELSE 'generic'
  END as packet_type
FROM control_plane.packets p;

COMMENT ON VIEW control_plane.user_packets IS
'View for fetching packets with packet_type indicator (personalized vs generic).';


-- =========================================================
-- SECTION 5: Function to get appropriate packets for user
-- =========================================================

-- Function: Get packets for a user (personalized if available, else generic)
CREATE OR REPLACE FUNCTION control_plane.get_user_packets(p_user_id UUID, p_limit INT DEFAULT 10)
RETURNS SETOF control_plane.packets AS $$
BEGIN
  -- First try to get personalized packets for this user
  IF EXISTS (
    SELECT 1 FROM control_plane.packets
    WHERE user_id = p_user_id
    LIMIT 1
  ) THEN
    -- User has personalized packets
    RETURN QUERY
    SELECT * FROM control_plane.packets
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT p_limit;
  ELSE
    -- Fall back to generic packets
    RETURN QUERY
    SELECT * FROM control_plane.packets
    WHERE user_id IS NULL
    ORDER BY created_at DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION control_plane.get_user_packets IS
'Returns personalized packets for user if available, otherwise generic packets.';
