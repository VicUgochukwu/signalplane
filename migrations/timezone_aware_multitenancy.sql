-- Timezone-Aware Multi-Tenant Schema for Control Plane
-- This migration adds timezone support so packets align with each user's local business week
--
-- Key Concepts:
-- 1. All timestamps stored in UTC
-- 2. User/org has a configured timezone
-- 3. Week boundaries calculated per-user's timezone
-- 4. Packets can be generated on-demand or cached per timezone-week

-- ============================================================================
-- PART 1: User/Organization Timezone Configuration
-- ============================================================================

-- Add timezone to organizations table (if using org-level config)
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS packet_delivery_day TEXT DEFAULT 'sunday' CHECK (packet_delivery_day IN ('sunday', 'monday')),
ADD COLUMN IF NOT EXISTS packet_delivery_hour INTEGER DEFAULT 18 CHECK (packet_delivery_hour >= 0 AND packet_delivery_hour <= 23),
ADD COLUMN IF NOT EXISTS week_start_day TEXT DEFAULT 'sunday' CHECK (week_start_day IN ('sunday', 'monday'));

-- Add timezone preferences to users table (for user-level override)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS timezone TEXT, -- NULL means use org default
ADD COLUMN IF NOT EXISTS packet_delivery_preference TEXT DEFAULT 'org_default' CHECK (packet_delivery_preference IN ('org_default', 'sunday_evening', 'monday_morning'));

COMMENT ON COLUMN public.organizations.timezone IS 'IANA timezone identifier (e.g., America/New_York, Europe/London, Asia/Tokyo)';
COMMENT ON COLUMN public.organizations.packet_delivery_day IS 'Day of week when weekly packet should be ready';
COMMENT ON COLUMN public.organizations.packet_delivery_hour IS 'Hour (0-23) when packet should be ready in org timezone';
COMMENT ON COLUMN public.organizations.week_start_day IS 'What day starts the business week for this org';

-- ============================================================================
-- PART 2: Enhanced Packets Table with Timezone Awareness
-- ============================================================================

-- Add timezone-aware columns to packets table
ALTER TABLE control_plane.packets
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS week_start_local TIMESTAMP, -- Week start in org's local timezone (for display)
ADD COLUMN IF NOT EXISTS week_end_local TIMESTAMP,   -- Week end in org's local timezone (for display)
ADD COLUMN IF NOT EXISTS generated_for_timezone TEXT, -- The timezone this packet was generated for
ADD COLUMN IF NOT EXISTS is_cached BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS cache_expires_at TIMESTAMPTZ;

-- Index for efficient per-org packet lookups
CREATE INDEX IF NOT EXISTS idx_packets_org_week
ON control_plane.packets(org_id, week_start, week_end);

CREATE INDEX IF NOT EXISTS idx_packets_timezone_week
ON control_plane.packets(generated_for_timezone, week_start, week_end);

COMMENT ON COLUMN control_plane.packets.timezone IS 'Timezone used to calculate week boundaries for this packet';
COMMENT ON COLUMN control_plane.packets.week_start_local IS 'Week start displayed in local timezone (for UI)';
COMMENT ON COLUMN control_plane.packets.week_end_local IS 'Week end displayed in local timezone (for UI)';

-- ============================================================================
-- PART 3: Timezone Utility Functions
-- ============================================================================

-- Function to get effective timezone for a user (user override > org default > UTC)
CREATE OR REPLACE FUNCTION control_plane.get_user_timezone(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_user_tz TEXT;
    v_org_tz TEXT;
BEGIN
    -- Get user's timezone (if set)
    SELECT u.timezone, o.timezone
    INTO v_user_tz, v_org_tz
    FROM public.users u
    LEFT JOIN public.organizations o ON u.organization_id = o.id
    WHERE u.id = p_user_id;

    -- Return user timezone if set, otherwise org timezone, otherwise UTC
    RETURN COALESCE(v_user_tz, v_org_tz, 'UTC');
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate week boundaries for a given timezone
CREATE OR REPLACE FUNCTION control_plane.get_week_boundaries(
    p_timezone TEXT,
    p_reference_date TIMESTAMPTZ DEFAULT NOW(),
    p_week_start_day TEXT DEFAULT 'sunday'
)
RETURNS TABLE(week_start TIMESTAMPTZ, week_end TIMESTAMPTZ, week_start_local TIMESTAMP, week_end_local TIMESTAMP) AS $$
DECLARE
    v_local_date DATE;
    v_days_since_week_start INTEGER;
    v_week_start_local TIMESTAMP;
    v_week_end_local TIMESTAMP;
BEGIN
    -- Convert reference date to local date in the target timezone
    v_local_date := (p_reference_date AT TIME ZONE p_timezone)::DATE;

    -- Calculate days since week start (Sunday = 0, Monday = 1, etc.)
    IF p_week_start_day = 'monday' THEN
        v_days_since_week_start := EXTRACT(ISODOW FROM v_local_date)::INTEGER - 1;
        IF v_days_since_week_start < 0 THEN v_days_since_week_start := 6; END IF;
    ELSE -- sunday
        v_days_since_week_start := EXTRACT(DOW FROM v_local_date)::INTEGER;
    END IF;

    -- Calculate local week start (beginning of day in local timezone)
    v_week_start_local := (v_local_date - v_days_since_week_start * INTERVAL '1 day')::TIMESTAMP;
    v_week_end_local := v_week_start_local + INTERVAL '7 days' - INTERVAL '1 second';

    RETURN QUERY SELECT
        (v_week_start_local::TEXT || ' ' || p_timezone)::TIMESTAMPTZ AS week_start,
        (v_week_end_local::TEXT || ' ' || p_timezone)::TIMESTAMPTZ AS week_end,
        v_week_start_local,
        v_week_end_local;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get signals for a user's current week (timezone-aware)
CREATE OR REPLACE FUNCTION control_plane.get_signals_for_user_week(
    p_user_id UUID,
    p_reference_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(
    id UUID,
    signal_type TEXT,
    title TEXT,
    summary TEXT,
    priority INTEGER,
    decision_type TEXT,
    source_refs JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_timezone TEXT;
    v_week_start TIMESTAMPTZ;
    v_week_end TIMESTAMPTZ;
BEGIN
    -- Get user's effective timezone
    v_timezone := control_plane.get_user_timezone(p_user_id);

    -- Get week boundaries in user's timezone
    SELECT wb.week_start, wb.week_end
    INTO v_week_start, v_week_end
    FROM control_plane.get_week_boundaries(v_timezone, p_reference_date) wb;

    -- Return signals within that week
    RETURN QUERY
    SELECT
        s.id,
        s.signal_type,
        s.title,
        s.summary,
        s.priority,
        s.decision_type,
        s.source_refs,
        s.metadata,
        s.created_at
    FROM control_plane.signals s
    WHERE s.created_at >= v_week_start
      AND s.created_at < v_week_end
    ORDER BY s.priority DESC, s.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- PART 4: Packet Generation with Timezone Support
-- ============================================================================

-- Function to get or generate packet for a user's week
CREATE OR REPLACE FUNCTION control_plane.get_packet_for_user_week(
    p_user_id UUID,
    p_reference_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS control_plane.packets AS $$
DECLARE
    v_timezone TEXT;
    v_week_bounds RECORD;
    v_packet control_plane.packets;
    v_org_id UUID;
BEGIN
    -- Get user's timezone and org
    SELECT control_plane.get_user_timezone(p_user_id) INTO v_timezone;
    SELECT organization_id INTO v_org_id FROM public.users WHERE id = p_user_id;

    -- Get week boundaries
    SELECT * INTO v_week_bounds
    FROM control_plane.get_week_boundaries(v_timezone, p_reference_date);

    -- Check for cached packet
    SELECT * INTO v_packet
    FROM control_plane.packets
    WHERE org_id = v_org_id
      AND generated_for_timezone = v_timezone
      AND week_start = v_week_bounds.week_start::DATE
      AND week_end = v_week_bounds.week_end::DATE
      AND (cache_expires_at IS NULL OR cache_expires_at > NOW())
    LIMIT 1;

    -- Return cached packet if found
    IF FOUND THEN
        RETURN v_packet;
    END IF;

    -- Otherwise return NULL (packet needs to be generated)
    -- Actual packet generation happens in n8n workflow or application code
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 5: Common Timezones Reference Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS control_plane.supported_timezones (
    timezone_id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    utc_offset TEXT NOT NULL,
    region TEXT NOT NULL
);

INSERT INTO control_plane.supported_timezones (timezone_id, display_name, utc_offset, region) VALUES
-- Americas
('America/New_York', 'Eastern Time (US)', 'UTC-5/UTC-4', 'Americas'),
('America/Chicago', 'Central Time (US)', 'UTC-6/UTC-5', 'Americas'),
('America/Denver', 'Mountain Time (US)', 'UTC-7/UTC-6', 'Americas'),
('America/Los_Angeles', 'Pacific Time (US)', 'UTC-8/UTC-7', 'Americas'),
('America/Toronto', 'Eastern Time (Canada)', 'UTC-5/UTC-4', 'Americas'),
('America/Sao_Paulo', 'Brasilia Time', 'UTC-3', 'Americas'),
-- Europe
('Europe/London', 'Greenwich Mean Time', 'UTC+0/UTC+1', 'Europe'),
('Europe/Paris', 'Central European Time', 'UTC+1/UTC+2', 'Europe'),
('Europe/Berlin', 'Central European Time', 'UTC+1/UTC+2', 'Europe'),
('Europe/Amsterdam', 'Central European Time', 'UTC+1/UTC+2', 'Europe'),
-- Asia Pacific
('Asia/Tokyo', 'Japan Standard Time', 'UTC+9', 'Asia Pacific'),
('Asia/Shanghai', 'China Standard Time', 'UTC+8', 'Asia Pacific'),
('Asia/Singapore', 'Singapore Time', 'UTC+8', 'Asia Pacific'),
('Asia/Dubai', 'Gulf Standard Time', 'UTC+4', 'Asia Pacific'),
('Asia/Kolkata', 'India Standard Time', 'UTC+5:30', 'Asia Pacific'),
('Australia/Sydney', 'Australian Eastern Time', 'UTC+10/UTC+11', 'Asia Pacific'),
-- Other
('UTC', 'Coordinated Universal Time', 'UTC+0', 'Universal')
ON CONFLICT (timezone_id) DO NOTHING;

-- ============================================================================
-- PART 6: Views for Easy Access
-- ============================================================================

-- View showing packets with timezone-aware week info
CREATE OR REPLACE VIEW control_plane.packets_with_timezone AS
SELECT
    p.*,
    st.display_name AS timezone_display_name,
    st.utc_offset,
    st.region
FROM control_plane.packets p
LEFT JOIN control_plane.supported_timezones st ON p.generated_for_timezone = st.timezone_id;

-- ============================================================================
-- PART 7: Sample Queries for Reference
-- ============================================================================

-- Example: Get signals for a specific user's current week
-- SELECT * FROM control_plane.get_signals_for_user_week('user-uuid-here');

-- Example: Get week boundaries for a timezone
-- SELECT * FROM control_plane.get_week_boundaries('America/New_York');

-- Example: Check if packet exists for user's week
-- SELECT * FROM control_plane.get_packet_for_user_week('user-uuid-here');

COMMENT ON FUNCTION control_plane.get_user_timezone IS 'Returns effective timezone for a user (user setting > org setting > UTC)';
COMMENT ON FUNCTION control_plane.get_week_boundaries IS 'Calculates week start/end in both UTC and local time for a given timezone';
COMMENT ON FUNCTION control_plane.get_signals_for_user_week IS 'Returns all signals within the current week for a user based on their timezone';
COMMENT ON FUNCTION control_plane.get_packet_for_user_week IS 'Gets cached packet for user week or returns NULL if not found';
