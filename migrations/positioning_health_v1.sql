-- =============================================================================
-- POSITIONING HEALTH MONITOR — Phase 5 Migration
-- Signal Plane Control Plane
-- =============================================================================
-- Creates:
--   1. positioning schema
--   2. positioning.own_messaging — Snapshots of company's own public pages
--   3. positioning.health_scores — Monthly composite health scores
--   4. positioning.audits — Quarterly positioning audits
--   5. positioning.drift_events — Own-messaging drift detections
--   6. RPCs: get_positioning_overview, get_health_scores, get_positioning_audits,
--           get_drift_events, get_own_messaging
--   7. Feature flag for positioning_health
-- =============================================================================

-- ─── 1. Schema ───────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS positioning;

-- ─── 2. Own Messaging (snapshots of company's own public pages) ──────────────
CREATE TABLE IF NOT EXISTS positioning.own_messaging (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  page_url        TEXT NOT NULL,
  page_type       TEXT NOT NULL CHECK (page_type IN ('homepage', 'pricing', 'product', 'comparison', 'about')),
  page_title      TEXT,
  snapshot_text   TEXT,                                  -- latest extracted text
  snapshot_hash   TEXT,                                  -- SHA-256 hash of snapshot_text
  captured_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta            JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Dedup by page_url + snapshot_hash per user
  UNIQUE(user_id, page_url, snapshot_hash)
);

CREATE INDEX IF NOT EXISTS idx_pos_own_messaging_user_id ON positioning.own_messaging(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_own_messaging_user_url ON positioning.own_messaging(user_id, page_url);
CREATE INDEX IF NOT EXISTS idx_pos_own_messaging_captured ON positioning.own_messaging(captured_at DESC);

-- RLS
ALTER TABLE positioning.own_messaging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own messaging"
  ON positioning.own_messaging FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own messaging"
  ON positioning.own_messaging FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own messaging"
  ON positioning.own_messaging FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on own_messaging"
  ON positioning.own_messaging FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 3. Health Scores (monthly composite health scores) ──────────────────────
CREATE TABLE IF NOT EXISTS positioning.health_scores (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id),
  score_month             DATE NOT NULL,                -- first day of month
  total_score             INT NOT NULL DEFAULT 0 CHECK (total_score BETWEEN 0 AND 100),
  buyer_alignment_score   INT DEFAULT 0 CHECK (buyer_alignment_score BETWEEN 0 AND 33),
  differentiation_score   INT DEFAULT 0 CHECK (differentiation_score BETWEEN 0 AND 33),
  narrative_fit_score     INT DEFAULT 0 CHECK (narrative_fit_score BETWEEN 0 AND 33),
  dimensions_available    TEXT[] DEFAULT '{}',           -- which dimensions could be scored
  breakdown               JSONB DEFAULT '{}'::jsonb,     -- detailed scoring breakdown
  trend_vs_prior          TEXT DEFAULT 'stable' CHECK (trend_vs_prior IN ('improving', 'stable', 'declining')),
  prior_total_score       INT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, score_month)
);

CREATE INDEX IF NOT EXISTS idx_pos_health_scores_user_id ON positioning.health_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_health_scores_user_month ON positioning.health_scores(user_id, score_month DESC);

-- RLS
ALTER TABLE positioning.health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own health_scores"
  ON positioning.health_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own health_scores"
  ON positioning.health_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access on health_scores"
  ON positioning.health_scores FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 4. Audits (quarterly positioning audits) ────────────────────────────────
CREATE TABLE IF NOT EXISTS positioning.audits (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id),
  quarter           TEXT NOT NULL,                       -- e.g. '2026-Q1'
  title             TEXT NOT NULL,
  content_json      JSONB DEFAULT '{}'::jsonb,
  content_md        TEXT DEFAULT '',
  claim_count       INT DEFAULT 0,
  recommendations   JSONB DEFAULT '[]'::jsonb,           -- array of recommendations
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, quarter)
);

CREATE INDEX IF NOT EXISTS idx_pos_audits_user_id ON positioning.audits(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_audits_quarter ON positioning.audits(quarter DESC);

-- RLS
ALTER TABLE positioning.audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own audits"
  ON positioning.audits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on audits"
  ON positioning.audits FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 5. Drift Events (own-messaging drift detections) ────────────────────────
CREATE TABLE IF NOT EXISTS positioning.drift_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id),
  page_url            TEXT NOT NULL,
  page_type           TEXT NOT NULL CHECK (page_type IN ('homepage', 'pricing', 'product', 'comparison', 'about')),
  change_description  TEXT NOT NULL,
  severity            TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
  drift_direction     TEXT NOT NULL CHECK (drift_direction IN ('deliberate', 'gradual', 'regression')),
  detected_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  evidence_urls       TEXT[] DEFAULT '{}',
  resolved            BOOLEAN DEFAULT false,
  meta                JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pos_drift_events_user_id ON positioning.drift_events(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_drift_events_user_detected ON positioning.drift_events(user_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_drift_events_severity_resolved ON positioning.drift_events(severity, resolved);

-- RLS
ALTER TABLE positioning.drift_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own drift_events"
  ON positioning.drift_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own drift_events"
  ON positioning.drift_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on drift_events"
  ON positioning.drift_events FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- RPCs
-- =============================================================================

-- ─── 6a. Get positioning overview (dashboard stats) ──────────────────────────
CREATE OR REPLACE FUNCTION public.get_positioning_overview(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'latest_score', (
      SELECT json_build_object(
        'total_score', hs.total_score,
        'buyer_alignment_score', hs.buyer_alignment_score,
        'differentiation_score', hs.differentiation_score,
        'narrative_fit_score', hs.narrative_fit_score,
        'dimensions_available', hs.dimensions_available,
        'score_month', hs.score_month,
        'trend_vs_prior', hs.trend_vs_prior,
        'prior_total_score', hs.prior_total_score
      )
      FROM positioning.health_scores hs
      WHERE hs.user_id = p_user_id
      ORDER BY hs.score_month DESC LIMIT 1
    ),
    'score_trend', COALESCE((
      SELECT json_agg(row_to_json(sub.*))
      FROM (
        SELECT hs.score_month, hs.total_score, hs.buyer_alignment_score,
               hs.differentiation_score, hs.narrative_fit_score, hs.trend_vs_prior
        FROM positioning.health_scores hs
        WHERE hs.user_id = p_user_id
        ORDER BY hs.score_month DESC LIMIT 3
      ) sub
    ), '[]'::json),
    'drift_events_count', (
      SELECT COUNT(*) FROM positioning.drift_events de
      WHERE de.user_id = p_user_id AND de.detected_at >= now() - INTERVAL '90 days'
    ),
    'active_drift_alerts', (
      SELECT COUNT(*) FROM positioning.drift_events de
      WHERE de.user_id = p_user_id AND de.resolved = false
    ),
    'high_severity_drifts', (
      SELECT COUNT(*) FROM positioning.drift_events de
      WHERE de.user_id = p_user_id AND de.severity = 'high' AND de.resolved = false
    ),
    'own_pages_tracked', (
      SELECT COUNT(DISTINCT om.page_url) FROM positioning.own_messaging om
      WHERE om.user_id = p_user_id
    ),
    'latest_audit_quarter', (
      SELECT a.quarter FROM positioning.audits a
      WHERE a.user_id = p_user_id
      ORDER BY a.quarter DESC LIMIT 1
    ),
    'recent_drift_events', COALESCE((
      SELECT json_agg(row_to_json(sub.*))
      FROM (
        SELECT de.id, de.page_url, de.page_type, de.change_description,
               de.severity, de.drift_direction, de.detected_at, de.resolved
        FROM positioning.drift_events de
        WHERE de.user_id = p_user_id
        ORDER BY de.detected_at DESC LIMIT 5
      ) sub
    ), '[]'::json)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ─── 6b. Get health scores (monthly score history) ───────────────────────────
CREATE OR REPLACE FUNCTION public.get_health_scores(
  p_user_id UUID
)
RETURNS TABLE (
  id                      UUID,
  score_month             DATE,
  total_score             INT,
  buyer_alignment_score   INT,
  differentiation_score   INT,
  narrative_fit_score     INT,
  dimensions_available    TEXT[],
  breakdown               JSONB,
  trend_vs_prior          TEXT,
  prior_total_score       INT,
  created_at              TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    hs.id,
    hs.score_month,
    hs.total_score,
    hs.buyer_alignment_score,
    hs.differentiation_score,
    hs.narrative_fit_score,
    hs.dimensions_available,
    hs.breakdown,
    hs.trend_vs_prior,
    hs.prior_total_score,
    hs.created_at
  FROM positioning.health_scores hs
  WHERE hs.user_id = p_user_id
  ORDER BY hs.score_month DESC;
END;
$$;

-- ─── 6c. Get positioning audits (quarterly audits) ───────────────────────────
CREATE OR REPLACE FUNCTION public.get_positioning_audits(
  p_user_id UUID
)
RETURNS TABLE (
  id              UUID,
  quarter         TEXT,
  title           TEXT,
  content_json    JSONB,
  content_md      TEXT,
  claim_count     INT,
  recommendations JSONB,
  created_at      TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.quarter,
    a.title,
    a.content_json,
    a.content_md,
    a.claim_count,
    a.recommendations,
    a.created_at
  FROM positioning.audits a
  WHERE a.user_id = p_user_id
  ORDER BY a.quarter DESC;
END;
$$;

-- ─── 6d. Get drift events ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_drift_events(
  p_user_id   UUID,
  p_days_back INT DEFAULT 90
)
RETURNS TABLE (
  id                  UUID,
  page_url            TEXT,
  page_type           TEXT,
  change_description  TEXT,
  severity            TEXT,
  drift_direction     TEXT,
  detected_at         TIMESTAMPTZ,
  evidence_urls       TEXT[],
  resolved            BOOLEAN,
  meta                JSONB,
  created_at          TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.page_url,
    de.page_type,
    de.change_description,
    de.severity,
    de.drift_direction,
    de.detected_at,
    de.evidence_urls,
    de.resolved,
    de.meta,
    de.created_at
  FROM positioning.drift_events de
  WHERE de.user_id = p_user_id
    AND de.detected_at >= now() - (p_days_back || ' days')::INTERVAL
  ORDER BY de.detected_at DESC;
END;
$$;

-- ─── 6e. Get own messaging (tracked own pages) ──────────────────────────────
CREATE OR REPLACE FUNCTION public.get_own_messaging(
  p_user_id UUID
)
RETURNS TABLE (
  id              UUID,
  page_url        TEXT,
  page_type       TEXT,
  page_title      TEXT,
  snapshot_hash   TEXT,
  captured_at     TIMESTAMPTZ,
  meta            JSONB,
  created_at      TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (om.page_url)
    om.id,
    om.page_url,
    om.page_type,
    om.page_title,
    om.snapshot_hash,
    om.captured_at,
    om.meta,
    om.created_at
  FROM positioning.own_messaging om
  WHERE om.user_id = p_user_id
  ORDER BY om.page_url, om.captured_at DESC;
END;
$$;

-- =============================================================================
-- Feature Flag
-- =============================================================================
INSERT INTO admin.feature_flags (flag_key, label, description, is_enabled, applies_to)
VALUES ('positioning_health', 'Positioning Health', 'Positioning Health Monitor — tracks the gap between stated positioning and market reality across buyer alignment, differentiation, and narrative fit', true, 'all')
ON CONFLICT (flag_key) DO NOTHING;

-- =============================================================================
-- Updated_at triggers
-- =============================================================================
CREATE OR REPLACE FUNCTION positioning.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pos_own_messaging_updated_at
  BEFORE UPDATE ON positioning.own_messaging
  FOR EACH ROW
  EXECUTE FUNCTION positioning.update_updated_at();

CREATE TRIGGER trg_pos_drift_events_updated_at
  BEFORE UPDATE ON positioning.drift_events
  FOR EACH ROW
  EXECUTE FUNCTION positioning.update_updated_at();
