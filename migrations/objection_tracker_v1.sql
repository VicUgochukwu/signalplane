-- Objection Tracker v1: Ship for tracking buyer objections from public VoC surfaces
-- Owner: Magneto
-- Run order: Execute in Supabase SQL Editor after control_plane_v1_upgrade.sql
-- =========================================================

-- =========================================================
-- SECTION 1: Create objection_tracker schema
-- =========================================================

CREATE SCHEMA IF NOT EXISTS objection_tracker;

-- =========================================================
-- SECTION 2: Source configuration table
-- =========================================================

-- Table: objection_sources - Configurable VoC surfaces to monitor
CREATE TABLE IF NOT EXISTS objection_tracker.sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source identification
    source_name TEXT NOT NULL,  -- e.g., "G2 Reviews", "Capterra", "Reddit r/sales"
    source_type TEXT NOT NULL CHECK (source_type IN (
        'review_site',      -- G2, Capterra, TrustRadius
        'social_media',     -- Twitter, LinkedIn
        'forum',            -- Reddit, community forums
        'support_channel',  -- Zendesk, Intercom (if integrated)
        'sales_call',       -- Gong, Chorus transcripts
        'email'             -- Sales email replies
    )),

    -- Configuration
    url_pattern TEXT,           -- URL pattern to monitor (for scraping)
    api_endpoint TEXT,          -- API endpoint if available
    fetch_method TEXT NOT NULL CHECK (fetch_method IN ('rss', 'api', 'scrape', 'webhook', 'manual')),
    fetch_config JSONB DEFAULT '{}'::jsonb,  -- Method-specific config (headers, auth, etc.)

    -- Scheduling
    fetch_frequency_hours INT DEFAULT 24,  -- How often to check (default: daily)
    last_fetched_at TIMESTAMPTZ,

    -- Quality weighting
    source_quality TEXT DEFAULT 'medium' CHECK (source_quality IN ('high', 'medium', 'low')),

    -- Status
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_objection_sources_name
ON objection_tracker.sources (source_name);

-- =========================================================
-- SECTION 3: Raw objection events table
-- =========================================================

-- Table: objection_events - Individual objection occurrences detected
CREATE TABLE IF NOT EXISTS objection_tracker.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source linkage
    source_id UUID NOT NULL REFERENCES objection_tracker.sources(id) ON DELETE CASCADE,
    external_id TEXT,  -- ID from source system (for deduplication)

    -- Content
    raw_text TEXT NOT NULL,         -- Original text containing the objection
    objection_text TEXT NOT NULL,   -- Extracted objection phrase
    context_text TEXT,              -- Surrounding context

    -- Classification (filled by Anthropic)
    category TEXT CHECK (category IN (
        'price_value',     -- Too expensive, ROI unclear
        'timing',          -- Not now, not ready, bad timing
        'complexity',      -- Too hard to implement/learn
        'risk',            -- Security, compliance, vendor risk
        'fit',             -- Doesn't fit our needs/stack
        'competition',     -- Competitor is better/cheaper
        'inertia',         -- Current solution works fine
        'authority',       -- Need buy-in from others
        'trust'            -- Don't trust vendor/product
    )),
    severity INT CHECK (severity BETWEEN 1 AND 5),  -- 1=minor, 5=deal-killer
    confidence NUMERIC CHECK (confidence BETWEEN 0 AND 1),

    -- Targeting
    persona TEXT,           -- Detected buyer persona
    segment TEXT,           -- Detected company segment
    funnel_stage TEXT CHECK (funnel_stage IN (
        'awareness', 'consideration', 'decision', 'onboarding', 'expansion'
    )),

    -- Metadata
    source_url TEXT,        -- URL where objection was found
    source_author TEXT,     -- Author name if available
    source_date TIMESTAMPTZ,  -- When the objection was originally posted
    meta JSONB DEFAULT '{}'::jsonb,

    -- Processing status
    processed BOOLEAN DEFAULT false,
    signal_emitted BOOLEAN DEFAULT false,
    signal_id UUID,  -- Link to control_plane.signals if emitted

    -- Timestamps
    detected_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Prevent duplicate ingestion from same source
CREATE UNIQUE INDEX IF NOT EXISTS idx_objection_events_source_external
ON objection_tracker.events (source_id, external_id)
WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_objection_events_category
ON objection_tracker.events (category)
WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_objection_events_detected
ON objection_tracker.events (detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_objection_events_unprocessed
ON objection_tracker.events (processed)
WHERE processed = false;

CREATE INDEX IF NOT EXISTS idx_objection_events_source
ON objection_tracker.events (source_id);

-- =========================================================
-- SECTION 4: Objection tracking (aggregated patterns)
-- =========================================================

-- Table: objection_patterns - Aggregated objection tracking over time
CREATE TABLE IF NOT EXISTS objection_tracker.patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Objection identification (normalized)
    objection_key TEXT NOT NULL,  -- Normalized key for matching similar objections
    canonical_text TEXT NOT NULL,  -- Canonical phrasing of the objection
    category TEXT NOT NULL CHECK (category IN (
        'price_value', 'timing', 'complexity', 'risk', 'fit',
        'competition', 'inertia', 'authority', 'trust'
    )),

    -- Frequency tracking
    total_count INT DEFAULT 1,
    count_last_7_days INT DEFAULT 0,
    count_last_30_days INT DEFAULT 0,
    count_last_90_days INT DEFAULT 0,

    -- Trend detection
    trend TEXT DEFAULT 'stable' CHECK (trend IN ('rising', 'stable', 'fading')),
    trend_score NUMERIC DEFAULT 0,  -- Positive = rising, negative = fading
    trend_updated_at TIMESTAMPTZ DEFAULT now(),

    -- Severity tracking (average)
    avg_severity NUMERIC DEFAULT 3,
    max_severity INT DEFAULT 3,

    -- Targeting patterns
    top_personas TEXT[],  -- Most common personas raising this objection
    top_segments TEXT[],  -- Most common company segments
    top_funnel_stages TEXT[],  -- Most common funnel stages

    -- Evidence (most recent)
    evidence_urls TEXT[] DEFAULT '{}',  -- Recent example URLs
    recent_event_ids UUID[] DEFAULT '{}',  -- Recent event IDs

    -- Linked knowledge item
    knowledge_item_id UUID REFERENCES gtm_memory.knowledge_items(id) ON DELETE SET NULL,

    -- Timestamps
    first_seen_at TIMESTAMPTZ DEFAULT now(),
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_objection_patterns_key
ON objection_tracker.patterns (objection_key);

CREATE INDEX IF NOT EXISTS idx_objection_patterns_category
ON objection_tracker.patterns (category);

CREATE INDEX IF NOT EXISTS idx_objection_patterns_trend
ON objection_tracker.patterns (trend);

CREATE INDEX IF NOT EXISTS idx_objection_patterns_count
ON objection_tracker.patterns (total_count DESC);

CREATE INDEX IF NOT EXISTS idx_objection_patterns_last_seen
ON objection_tracker.patterns (last_seen_at DESC);

-- =========================================================
-- SECTION 5: Trend snapshots for drift detection
-- =========================================================

-- Table: trend_snapshots - Weekly snapshots for drift detection
CREATE TABLE IF NOT EXISTS objection_tracker.trend_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Time period
    snapshot_date DATE NOT NULL,  -- Start of the week
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,

    -- Aggregate metrics
    total_events INT DEFAULT 0,
    new_objections_detected INT DEFAULT 0,  -- Never seen before

    -- Category breakdown
    category_counts JSONB DEFAULT '{}'::jsonb,  -- {category: count}

    -- Top patterns this week
    top_patterns JSONB DEFAULT '[]'::jsonb,  -- [{pattern_id, count, trend}]

    -- Drift indicators
    drift_score NUMERIC DEFAULT 0,  -- 0 = no drift, higher = more drift
    drift_signals JSONB DEFAULT '[]'::jsonb,  -- What changed significantly

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_trend_snapshots_week
ON objection_tracker.trend_snapshots (week_start, week_end);

CREATE INDEX IF NOT EXISTS idx_trend_snapshots_date
ON objection_tracker.trend_snapshots (snapshot_date DESC);

-- =========================================================
-- SECTION 6: Extend control_plane.signals for objection type
-- =========================================================

-- Add 'objection' to the signal_type constraint
-- First drop the existing constraint, then recreate with new value
ALTER TABLE control_plane.signals
DROP CONSTRAINT IF EXISTS signals_signal_type_check;

ALTER TABLE control_plane.signals
ADD CONSTRAINT signals_signal_type_check
CHECK (signal_type IN ('messaging', 'narrative', 'icp', 'horizon', 'objection'));

-- =========================================================
-- SECTION 7: Helper functions
-- =========================================================

-- Function: Compute trend score for an objection pattern
CREATE OR REPLACE FUNCTION objection_tracker.compute_trend_score(
    p_count_7 INT,
    p_count_30 INT,
    p_count_90 INT
) RETURNS NUMERIC AS $$
DECLARE
    recent_rate NUMERIC;
    medium_rate NUMERIC;
    historical_rate NUMERIC;
    trend_score NUMERIC;
BEGIN
    -- Calculate weekly rates
    recent_rate := COALESCE(p_count_7, 0);  -- Last week
    medium_rate := COALESCE(p_count_30 - p_count_7, 0) / 3.0;  -- Weeks 2-4 avg
    historical_rate := COALESCE(p_count_90 - p_count_30, 0) / 8.0;  -- Weeks 5-12 avg

    -- Score: positive = rising, negative = fading
    -- Compare recent to medium-term, weighted by historical baseline
    IF medium_rate = 0 AND historical_rate = 0 THEN
        -- New objection, check if it has any recent activity
        trend_score := CASE WHEN recent_rate > 0 THEN recent_rate * 2 ELSE 0 END;
    ELSE
        trend_score := (recent_rate - medium_rate) * 2 + (medium_rate - historical_rate);
    END IF;

    RETURN ROUND(trend_score, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Determine trend label from score
CREATE OR REPLACE FUNCTION objection_tracker.get_trend_label(
    p_trend_score NUMERIC
) RETURNS TEXT AS $$
BEGIN
    IF p_trend_score > 2 THEN
        RETURN 'rising';
    ELSIF p_trend_score < -2 THEN
        RETURN 'fading';
    ELSE
        RETURN 'stable';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Upsert objection pattern from event
CREATE OR REPLACE FUNCTION objection_tracker.upsert_pattern_from_event(
    p_event_id UUID
) RETURNS UUID AS $$
DECLARE
    v_event objection_tracker.events;
    v_objection_key TEXT;
    v_pattern_id UUID;
BEGIN
    -- Get the event
    SELECT * INTO v_event FROM objection_tracker.events WHERE id = p_event_id;

    IF v_event IS NULL THEN
        RAISE EXCEPTION 'Event not found: %', p_event_id;
    END IF;

    -- Generate objection key (lowercase, stripped)
    v_objection_key := lower(regexp_replace(v_event.objection_text, '[^a-z0-9 ]', '', 'gi'));
    v_objection_key := regexp_replace(v_objection_key, '\s+', ' ', 'g');
    v_objection_key := trim(v_objection_key);
    v_objection_key := left(v_objection_key, 100);  -- Truncate for index

    -- Upsert pattern
    INSERT INTO objection_tracker.patterns (
        objection_key,
        canonical_text,
        category,
        total_count,
        avg_severity,
        max_severity,
        evidence_urls,
        recent_event_ids,
        first_seen_at,
        last_seen_at
    ) VALUES (
        v_objection_key,
        v_event.objection_text,
        v_event.category,
        1,
        COALESCE(v_event.severity, 3),
        COALESCE(v_event.severity, 3),
        CASE WHEN v_event.source_url IS NOT NULL THEN ARRAY[v_event.source_url] ELSE '{}' END,
        ARRAY[p_event_id],
        v_event.detected_at,
        v_event.detected_at
    )
    ON CONFLICT (objection_key) DO UPDATE SET
        total_count = objection_tracker.patterns.total_count + 1,
        avg_severity = (objection_tracker.patterns.avg_severity * objection_tracker.patterns.total_count + COALESCE(v_event.severity, 3)) / (objection_tracker.patterns.total_count + 1),
        max_severity = GREATEST(objection_tracker.patterns.max_severity, COALESCE(v_event.severity, 3)),
        evidence_urls = (
            SELECT array_agg(DISTINCT url)
            FROM (
                SELECT unnest(objection_tracker.patterns.evidence_urls) AS url
                UNION
                SELECT v_event.source_url WHERE v_event.source_url IS NOT NULL
                LIMIT 5
            ) subq
        ),
        recent_event_ids = (
            SELECT array_agg(eid)
            FROM (
                SELECT unnest(objection_tracker.patterns.recent_event_ids) AS eid
                UNION
                SELECT p_event_id
                ORDER BY 1 DESC
                LIMIT 10
            ) subq
        ),
        last_seen_at = v_event.detected_at,
        updated_at = now()
    RETURNING id INTO v_pattern_id;

    RETURN v_pattern_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Update trend counts for all patterns
CREATE OR REPLACE FUNCTION objection_tracker.update_all_trend_counts()
RETURNS void AS $$
BEGIN
    UPDATE objection_tracker.patterns p SET
        count_last_7_days = (
            SELECT COUNT(*) FROM objection_tracker.events e
            WHERE e.category = p.category
            AND lower(regexp_replace(e.objection_text, '[^a-z0-9 ]', '', 'gi')) LIKE p.objection_key || '%'
            AND e.detected_at >= now() - interval '7 days'
        ),
        count_last_30_days = (
            SELECT COUNT(*) FROM objection_tracker.events e
            WHERE e.category = p.category
            AND lower(regexp_replace(e.objection_text, '[^a-z0-9 ]', '', 'gi')) LIKE p.objection_key || '%'
            AND e.detected_at >= now() - interval '30 days'
        ),
        count_last_90_days = (
            SELECT COUNT(*) FROM objection_tracker.events e
            WHERE e.category = p.category
            AND lower(regexp_replace(e.objection_text, '[^a-z0-9 ]', '', 'gi')) LIKE p.objection_key || '%'
            AND e.detected_at >= now() - interval '90 days'
        ),
        trend_score = objection_tracker.compute_trend_score(
            count_last_7_days, count_last_30_days, count_last_90_days
        ),
        trend = objection_tracker.get_trend_label(
            objection_tracker.compute_trend_score(
                count_last_7_days, count_last_30_days, count_last_90_days
            )
        ),
        trend_updated_at = now(),
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function: Create weekly trend snapshot
CREATE OR REPLACE FUNCTION objection_tracker.create_weekly_snapshot(
    p_week_start DATE,
    p_week_end DATE
) RETURNS UUID AS $$
DECLARE
    v_snapshot_id UUID;
    v_total_events INT;
    v_new_objections INT;
    v_category_counts JSONB;
    v_top_patterns JSONB;
    v_drift_score NUMERIC;
    v_prev_category_counts JSONB;
BEGIN
    -- Count events this week
    SELECT COUNT(*) INTO v_total_events
    FROM objection_tracker.events
    WHERE detected_at >= p_week_start AND detected_at < p_week_end + interval '1 day';

    -- Count new objection patterns (first seen this week)
    SELECT COUNT(*) INTO v_new_objections
    FROM objection_tracker.patterns
    WHERE first_seen_at >= p_week_start AND first_seen_at < p_week_end + interval '1 day';

    -- Category breakdown
    SELECT jsonb_object_agg(category, cnt) INTO v_category_counts
    FROM (
        SELECT category, COUNT(*) as cnt
        FROM objection_tracker.events
        WHERE detected_at >= p_week_start AND detected_at < p_week_end + interval '1 day'
        AND category IS NOT NULL
        GROUP BY category
    ) subq;

    -- Top patterns
    SELECT jsonb_agg(pattern_data) INTO v_top_patterns
    FROM (
        SELECT jsonb_build_object(
            'pattern_id', p.id,
            'canonical_text', p.canonical_text,
            'count', p.count_last_7_days,
            'trend', p.trend
        ) as pattern_data
        FROM objection_tracker.patterns p
        WHERE p.last_seen_at >= p_week_start
        ORDER BY p.count_last_7_days DESC
        LIMIT 10
    ) subq;

    -- Calculate drift score (compare to previous week)
    SELECT category_counts INTO v_prev_category_counts
    FROM objection_tracker.trend_snapshots
    WHERE week_end < p_week_start
    ORDER BY week_end DESC
    LIMIT 1;

    IF v_prev_category_counts IS NOT NULL THEN
        -- Simple drift: sum of absolute differences in category proportions
        v_drift_score := 0;
        -- More sophisticated drift detection would go here
    ELSE
        v_drift_score := 0;
    END IF;

    -- Insert snapshot
    INSERT INTO objection_tracker.trend_snapshots (
        snapshot_date,
        week_start,
        week_end,
        total_events,
        new_objections_detected,
        category_counts,
        top_patterns,
        drift_score
    ) VALUES (
        p_week_start,
        p_week_start,
        p_week_end,
        v_total_events,
        v_new_objections,
        COALESCE(v_category_counts, '{}'::jsonb),
        COALESCE(v_top_patterns, '[]'::jsonb),
        v_drift_score
    )
    ON CONFLICT (week_start, week_end) DO UPDATE SET
        total_events = EXCLUDED.total_events,
        new_objections_detected = EXCLUDED.new_objections_detected,
        category_counts = EXCLUDED.category_counts,
        top_patterns = EXCLUDED.top_patterns,
        drift_score = EXCLUDED.drift_score
    RETURNING id INTO v_snapshot_id;

    RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- SECTION 8: Row Level Security
-- =========================================================

ALTER TABLE objection_tracker.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE objection_tracker.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE objection_tracker.patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE objection_tracker.trend_snapshots ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all
CREATE POLICY "Allow read for authenticated users" ON objection_tracker.sources
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated users" ON objection_tracker.events
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated users" ON objection_tracker.patterns
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated users" ON objection_tracker.trend_snapshots
    FOR SELECT TO authenticated USING (true);

-- Service role full access (for n8n workflows)
CREATE POLICY "Service role full access" ON objection_tracker.sources
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON objection_tracker.events
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON objection_tracker.patterns
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON objection_tracker.trend_snapshots
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =========================================================
-- SECTION 9: Seed default sources
-- =========================================================

INSERT INTO objection_tracker.sources (source_name, source_type, fetch_method, source_quality, fetch_frequency_hours)
VALUES
    ('G2 Reviews', 'review_site', 'scrape', 'high', 24),
    ('Capterra Reviews', 'review_site', 'scrape', 'high', 24),
    ('TrustRadius Reviews', 'review_site', 'scrape', 'high', 24),
    ('Reddit r/sales', 'forum', 'api', 'medium', 12),
    ('Reddit r/SaaS', 'forum', 'api', 'medium', 12),
    ('Twitter/X Mentions', 'social_media', 'api', 'medium', 6),
    ('LinkedIn Comments', 'social_media', 'scrape', 'medium', 24),
    ('Manual Entry', 'sales_call', 'manual', 'high', NULL)
ON CONFLICT (source_name) DO NOTHING;

-- =========================================================
-- DONE: Objection Tracker schema complete
-- =========================================================
