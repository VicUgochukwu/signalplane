-- Control Plane v1 Upgrade: Blindspots + Future-Proofing
-- Owner: Magneto
-- Run order: Execute in Supabase SQL Editor
-- =========================================================

-- =========================================================
-- SECTION 1: Create gtm_memory schema and tables
-- =========================================================

-- Create schema for GTM Memory (knowledge that compounds)
CREATE SCHEMA IF NOT EXISTS gtm_memory;

-- Table: knowledge_items - Stores durable knowledge objects
CREATE TABLE IF NOT EXISTS gtm_memory.knowledge_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Classification
    kind TEXT NOT NULL CHECK (kind IN (
        'objection',
        'buyer_phrase',
        'competitor_claim',
        'proof_point',
        'tactic',
        'risk_signal'
    )),
    title TEXT NOT NULL,
    body TEXT, -- markdown content

    -- Taxonomy/Targeting
    tags JSONB DEFAULT '[]'::jsonb, -- array of strings
    persona TEXT, -- nullable
    segment TEXT, -- nullable
    funnel_stage TEXT CHECK (funnel_stage IN (
        'awareness',
        'consideration',
        'decision',
        'onboarding',
        'expansion'
    )),

    -- Temporal tracking
    first_seen_at TIMESTAMPTZ DEFAULT now(),
    last_seen_at TIMESTAMPTZ DEFAULT now(),

    -- Evidence
    evidence_urls JSONB DEFAULT '[]'::jsonb, -- array of URLs
    evidence_count INT DEFAULT 1,
    confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint to prevent duplicates (same kind + title)
CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_items_kind_title
ON gtm_memory.knowledge_items (kind, title);

-- Alternative: unique by content hash for body-based dedup
CREATE INDEX IF NOT EXISTS idx_knowledge_items_body_hash
ON gtm_memory.knowledge_items (kind, md5(body))
WHERE body IS NOT NULL;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_knowledge_items_kind
ON gtm_memory.knowledge_items (kind);

CREATE INDEX IF NOT EXISTS idx_knowledge_items_persona
ON gtm_memory.knowledge_items (persona)
WHERE persona IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_knowledge_items_funnel_stage
ON gtm_memory.knowledge_items (funnel_stage)
WHERE funnel_stage IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_knowledge_items_last_seen
ON gtm_memory.knowledge_items (last_seen_at DESC);

-- Table: knowledge_mentions - Links knowledge items to signals/packets
CREATE TABLE IF NOT EXISTS gtm_memory.knowledge_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_item_id UUID NOT NULL REFERENCES gtm_memory.knowledge_items(id) ON DELETE CASCADE,
    signal_id UUID REFERENCES control_plane.signals(id) ON DELETE SET NULL,
    packet_id UUID REFERENCES control_plane.packets(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_mentions_item
ON gtm_memory.knowledge_mentions (knowledge_item_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_mentions_signal
ON gtm_memory.knowledge_mentions (signal_id)
WHERE signal_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_knowledge_mentions_packet
ON gtm_memory.knowledge_mentions (packet_id)
WHERE packet_id IS NOT NULL;


-- =========================================================
-- SECTION 2: Create gtm_artifacts schema and tables
-- =========================================================

-- Create schema for artifacts (builder outputs)
CREATE SCHEMA IF NOT EXISTS gtm_artifacts;

-- Table: objection_library_versions - Weekly versioned objection library
CREATE TABLE IF NOT EXISTS gtm_artifacts.objection_library_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    content_md TEXT NOT NULL, -- Full markdown content
    included_signal_ids JSONB DEFAULT '[]'::jsonb,
    included_knowledge_item_ids JSONB DEFAULT '[]'::jsonb,
    objection_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_objection_library_week
ON gtm_artifacts.objection_library_versions (week_start, week_end);

CREATE INDEX IF NOT EXISTS idx_objection_library_created
ON gtm_artifacts.objection_library_versions (created_at DESC);

-- Table: swipe_file_versions - Weekly versioned buyer swipe file
CREATE TABLE IF NOT EXISTS gtm_artifacts.swipe_file_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    content_md TEXT NOT NULL, -- Full markdown content
    included_signal_ids JSONB DEFAULT '[]'::jsonb,
    included_knowledge_item_ids JSONB DEFAULT '[]'::jsonb,
    phrase_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_swipe_file_week
ON gtm_artifacts.swipe_file_versions (week_start, week_end);

CREATE INDEX IF NOT EXISTS idx_swipe_file_created
ON gtm_artifacts.swipe_file_versions (created_at DESC);

-- Table: battlecard_versions - Weekly versioned battlecards per competitor
CREATE TABLE IF NOT EXISTS gtm_artifacts.battlecard_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor_name TEXT NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    content_md TEXT NOT NULL, -- Full markdown content
    included_signal_ids JSONB DEFAULT '[]'::jsonb,
    what_changed_summary TEXT, -- Quick delta summary
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_battlecard_competitor_week
ON gtm_artifacts.battlecard_versions (competitor_name, week_start, week_end);

CREATE INDEX IF NOT EXISTS idx_battlecard_competitor
ON gtm_artifacts.battlecard_versions (competitor_name);

CREATE INDEX IF NOT EXISTS idx_battlecard_created
ON gtm_artifacts.battlecard_versions (created_at DESC);


-- =========================================================
-- SECTION 3: Upgrade control_plane.signals table
-- =========================================================

-- Add action mapping fields
ALTER TABLE control_plane.signals
ADD COLUMN IF NOT EXISTS decision_type TEXT CHECK (decision_type IN (
    'positioning',
    'packaging',
    'distribution',
    'proof',
    'enablement',
    'risk'
));

ALTER TABLE control_plane.signals
ADD COLUMN IF NOT EXISTS recommended_asset TEXT CHECK (recommended_asset IN (
    'homepage',
    'pricing',
    'deck',
    'talk_track',
    'email',
    'onboarding',
    'none'
));

ALTER TABLE control_plane.signals
ADD COLUMN IF NOT EXISTS owner_team TEXT CHECK (owner_team IN (
    'PMM',
    'sales',
    'CS',
    'product',
    'exec'
));

ALTER TABLE control_plane.signals
ADD COLUMN IF NOT EXISTS time_sensitivity TEXT DEFAULT 'monitor' CHECK (time_sensitivity IN (
    'now',
    'this_week',
    'monitor'
));

-- Add scoring/display fields
ALTER TABLE control_plane.signals
ADD COLUMN IF NOT EXISTS promo_score NUMERIC; -- for ranking/capping

ALTER TABLE control_plane.signals
ADD COLUMN IF NOT EXISTS summary_short TEXT; -- one-liner for UI lists

-- Indexes for new fields
CREATE INDEX IF NOT EXISTS idx_signals_decision_type
ON control_plane.signals (decision_type)
WHERE decision_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_signals_time_sensitivity
ON control_plane.signals (time_sensitivity)
WHERE time_sensitivity IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_signals_owner_team
ON control_plane.signals (owner_team)
WHERE owner_team IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_signals_promo_score
ON control_plane.signals (promo_score DESC NULLS LAST)
WHERE promo_score IS NOT NULL;


-- =========================================================
-- SECTION 4: Upgrade control_plane.packets table
-- =========================================================

-- Add predictions tracking (judgment loop)
ALTER TABLE control_plane.packets
ADD COLUMN IF NOT EXISTS predictions_json JSONB DEFAULT '[]'::jsonb;
-- Schema: [{hypothesis: string, what_to_watch: string, signal_ids: uuid[], confidence: string}]

ALTER TABLE control_plane.packets
ADD COLUMN IF NOT EXISTS resolved_predictions_json JSONB DEFAULT '[]'::jsonb;
-- Schema: [{hypothesis: string, outcome: string, evidence_urls: string[], resolved_at: timestamp}]

-- Add artifact linkage
ALTER TABLE control_plane.packets
ADD COLUMN IF NOT EXISTS artifacts_generated JSONB DEFAULT '{}'::jsonb;
-- Schema: {objection_library_id: uuid, swipe_file_id: uuid, battlecard_ids: uuid[]}

-- Index for packets with predictions
CREATE INDEX IF NOT EXISTS idx_packets_has_predictions
ON control_plane.packets ((predictions_json IS NOT NULL AND predictions_json != '[]'::jsonb));


-- =========================================================
-- SECTION 5: Helper functions
-- =========================================================

-- Function to compute actual scoring for signals
CREATE OR REPLACE FUNCTION control_plane.compute_signal_score(
    p_severity INT,
    p_confidence NUMERIC,
    p_created_at TIMESTAMPTZ,
    p_source_quality TEXT DEFAULT 'medium'
) RETURNS NUMERIC AS $$
DECLARE
    severity_weight NUMERIC;
    recency_weight NUMERIC;
    source_weight NUMERIC;
    confidence_weight NUMERIC;
    days_old NUMERIC;
BEGIN
    -- Severity weight (0-40 points based on 1-5 severity)
    severity_weight := COALESCE(p_severity, 3) * 8;

    -- Recency weight (0-30 points, decays over 7 days)
    days_old := EXTRACT(EPOCH FROM (now() - COALESCE(p_created_at, now()))) / 86400;
    recency_weight := GREATEST(0, 30 - (days_old * 4.3));

    -- Source quality weight (0-15 points)
    source_weight := CASE COALESCE(p_source_quality, 'medium')
        WHEN 'high' THEN 15
        WHEN 'medium' THEN 10
        WHEN 'low' THEN 5
        ELSE 10
    END;

    -- Confidence weight (0-15 points)
    confidence_weight := COALESCE(p_confidence, 0.5) * 15;

    RETURN ROUND(severity_weight + recency_weight + source_weight + confidence_weight, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to upsert knowledge item (idempotent)
CREATE OR REPLACE FUNCTION gtm_memory.upsert_knowledge_item(
    p_kind TEXT,
    p_title TEXT,
    p_body TEXT DEFAULT NULL,
    p_tags JSONB DEFAULT '[]'::jsonb,
    p_persona TEXT DEFAULT NULL,
    p_segment TEXT DEFAULT NULL,
    p_funnel_stage TEXT DEFAULT NULL,
    p_evidence_urls JSONB DEFAULT '[]'::jsonb,
    p_confidence TEXT DEFAULT 'medium'
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO gtm_memory.knowledge_items (
        kind, title, body, tags, persona, segment, funnel_stage,
        evidence_urls, evidence_count, confidence
    )
    VALUES (
        p_kind, p_title, p_body, p_tags, p_persona, p_segment, p_funnel_stage,
        p_evidence_urls, jsonb_array_length(p_evidence_urls), p_confidence
    )
    ON CONFLICT (kind, title) DO UPDATE SET
        body = COALESCE(EXCLUDED.body, gtm_memory.knowledge_items.body),
        tags = gtm_memory.knowledge_items.tags || EXCLUDED.tags,
        evidence_urls = gtm_memory.knowledge_items.evidence_urls || EXCLUDED.evidence_urls,
        evidence_count = jsonb_array_length(
            gtm_memory.knowledge_items.evidence_urls || EXCLUDED.evidence_urls
        ),
        last_seen_at = now(),
        updated_at = now(),
        confidence = CASE
            WHEN EXCLUDED.confidence = 'high' OR gtm_memory.knowledge_items.confidence = 'high' THEN 'high'
            WHEN EXCLUDED.confidence = 'medium' OR gtm_memory.knowledge_items.confidence = 'medium' THEN 'medium'
            ELSE 'low'
        END
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;


-- =========================================================
-- SECTION 6: Row Level Security (RLS) policies
-- =========================================================

-- Enable RLS on new tables
ALTER TABLE gtm_memory.knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtm_memory.knowledge_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtm_artifacts.objection_library_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtm_artifacts.swipe_file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtm_artifacts.battlecard_versions ENABLE ROW LEVEL SECURITY;

-- Permissive policies for authenticated users (adjust as needed)
CREATE POLICY "Allow all for authenticated users" ON gtm_memory.knowledge_items
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON gtm_memory.knowledge_mentions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON gtm_artifacts.objection_library_versions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON gtm_artifacts.swipe_file_versions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON gtm_artifacts.battlecard_versions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service role policies (for n8n workflows)
CREATE POLICY "Service role full access" ON gtm_memory.knowledge_items
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON gtm_memory.knowledge_mentions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON gtm_artifacts.objection_library_versions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON gtm_artifacts.swipe_file_versions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON gtm_artifacts.battlecard_versions
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- =========================================================
-- SECTION 7: Backfill existing signals with scores
-- =========================================================

-- Update existing signals with computed promo_score
UPDATE control_plane.signals
SET promo_score = control_plane.compute_signal_score(
    severity::int,
    confidence::numeric,
    created_at,
    'medium'
)
WHERE promo_score IS NULL;

-- Generate summary_short from first 100 chars of summary
UPDATE control_plane.signals
SET summary_short = LEFT(summary, 100) || CASE WHEN LENGTH(summary) > 100 THEN '...' ELSE '' END
WHERE summary_short IS NULL AND summary IS NOT NULL;


-- =========================================================
-- DONE: All migrations complete
-- =========================================================
