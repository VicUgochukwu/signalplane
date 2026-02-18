-- =============================================================================
-- PRICING & PACKAGING INTELLIGENCE — Phase 6 Migration
-- Signal Plane Control Plane
-- =============================================================================
-- Creates:
--   1. packaging schema
--   2. packaging.landscape — Current packaging state per tracked competitor
--   3. packaging.landscape_maps — Monthly landscape map artifacts
--   4. packaging.briefs — Per-event pricing intelligence briefs
--   5. packaging.audits — Quarterly packaging strategy audits
--   6. RPCs: get_packaging_overview, get_packaging_landscape,
--           get_packaging_briefs, get_packaging_audits, get_packaging_changes
--   7. Feature flag for packaging_intel
-- =============================================================================

-- ─── 1. Schema ───────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS packaging;

-- ─── 2. Landscape (current packaging state per competitor) ───────────────────
CREATE TABLE IF NOT EXISTS packaging.landscape (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  company_id      UUID NOT NULL,
  company_name    TEXT NOT NULL,
  tier_structure  JSONB DEFAULT '[]'::jsonb,             -- [{name, price, position, features}]
  value_metric    TEXT DEFAULT 'unknown' CHECK (value_metric IN ('seat', 'usage', 'flat', 'hybrid', 'unknown')),
  gating_strategy JSONB DEFAULT '{}'::jsonb,             -- {free_features, paid_gates, enterprise_gates}
  pricing_url     TEXT,
  plan_count      INT DEFAULT 0,
  has_free_tier   BOOLEAN DEFAULT false,
  has_enterprise  BOOLEAN DEFAULT false,
  snapshot_date   DATE NOT NULL,
  meta            JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, company_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_pkg_landscape_user_id ON packaging.landscape(user_id);
CREATE INDEX IF NOT EXISTS idx_pkg_landscape_user_company ON packaging.landscape(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_pkg_landscape_snapshot_date ON packaging.landscape(snapshot_date DESC);

-- RLS
ALTER TABLE packaging.landscape ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own landscape"
  ON packaging.landscape FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own landscape"
  ON packaging.landscape FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own landscape"
  ON packaging.landscape FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on landscape"
  ON packaging.landscape FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 3. Landscape Maps (monthly artifacts) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS packaging.landscape_maps (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id),
  report_month        DATE NOT NULL,                     -- first day of month
  title               TEXT NOT NULL,
  content_json        JSONB DEFAULT '{}'::jsonb,
  content_md          TEXT DEFAULT '',
  trends              JSONB DEFAULT '[]'::jsonb,         -- [{trend, direction, evidence}]
  companies_included  TEXT[] DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, report_month)
);

CREATE INDEX IF NOT EXISTS idx_pkg_landscape_maps_user_id ON packaging.landscape_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_pkg_landscape_maps_month ON packaging.landscape_maps(report_month DESC);

-- RLS
ALTER TABLE packaging.landscape_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own landscape_maps"
  ON packaging.landscape_maps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on landscape_maps"
  ON packaging.landscape_maps FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 4. Briefs (per-event pricing intelligence briefs) ───────────────────────
CREATE TABLE IF NOT EXISTS packaging.briefs (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id),
  company_name             TEXT NOT NULL,
  company_id               UUID,
  change_id                UUID,                          -- links to pricing_tracker.pricing_changes
  change_type              TEXT NOT NULL,
  strategic_interpretation TEXT NOT NULL,
  response_recommendations JSONB DEFAULT '[]'::jsonb,     -- [{action, description, priority}]
  severity                 TEXT NOT NULL CHECK (severity IN ('major', 'minor')),
  change_details           JSONB DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, change_id)
);

CREATE INDEX IF NOT EXISTS idx_pkg_briefs_user_id ON packaging.briefs(user_id);
CREATE INDEX IF NOT EXISTS idx_pkg_briefs_user_created ON packaging.briefs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pkg_briefs_company ON packaging.briefs(company_name);

-- RLS
ALTER TABLE packaging.briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own briefs"
  ON packaging.briefs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on briefs"
  ON packaging.briefs FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 5. Audits (quarterly packaging strategy audits) ─────────────────────────
CREATE TABLE IF NOT EXISTS packaging.audits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  quarter         TEXT NOT NULL,                          -- e.g. '2026-Q1'
  title           TEXT NOT NULL,
  content_json    JSONB DEFAULT '{}'::jsonb,
  content_md      TEXT DEFAULT '',
  strengths       JSONB DEFAULT '[]'::jsonb,             -- [{claim, evidence_count}]
  vulnerabilities JSONB DEFAULT '[]'::jsonb,             -- [{gap, competitor, severity}]
  opportunities   JSONB DEFAULT '[]'::jsonb,             -- [{position, rationale}]
  threats         JSONB DEFAULT '[]'::jsonb,             -- [{threat, competitors, urgency}]
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, quarter)
);

CREATE INDEX IF NOT EXISTS idx_pkg_audits_user_id ON packaging.audits(user_id);
CREATE INDEX IF NOT EXISTS idx_pkg_audits_quarter ON packaging.audits(quarter DESC);

-- RLS
ALTER TABLE packaging.audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own audits"
  ON packaging.audits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on audits"
  ON packaging.audits FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- RPCs
-- =============================================================================

-- ─── 6a. Get packaging overview (dashboard stats) ────────────────────────────
CREATE OR REPLACE FUNCTION public.get_packaging_overview(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'companies_tracked', (
      SELECT COUNT(DISTINCT l.company_id) FROM packaging.landscape l
      WHERE l.user_id = p_user_id
    ),
    'recent_changes_count', (
      SELECT COUNT(*) FROM packaging.briefs b
      WHERE b.user_id = p_user_id AND b.created_at >= now() - INTERVAL '30 days'
    ),
    'major_changes_count', (
      SELECT COUNT(*) FROM packaging.briefs b
      WHERE b.user_id = p_user_id AND b.severity = 'major' AND b.created_at >= now() - INTERVAL '30 days'
    ),
    'latest_landscape_month', (
      SELECT lm.report_month FROM packaging.landscape_maps lm
      WHERE lm.user_id = p_user_id
      ORDER BY lm.report_month DESC LIMIT 1
    ),
    'latest_audit_quarter', (
      SELECT a.quarter FROM packaging.audits a
      WHERE a.user_id = p_user_id
      ORDER BY a.quarter DESC LIMIT 1
    ),
    'landscape_trends', COALESCE((
      SELECT lm.trends FROM packaging.landscape_maps lm
      WHERE lm.user_id = p_user_id
      ORDER BY lm.report_month DESC LIMIT 1
    ), '[]'::jsonb),
    'recent_briefs', COALESCE((
      SELECT json_agg(row_to_json(sub.*))
      FROM (
        SELECT b.id, b.company_name, b.change_type, b.strategic_interpretation,
               b.severity, b.created_at
        FROM packaging.briefs b
        WHERE b.user_id = p_user_id
        ORDER BY b.created_at DESC LIMIT 5
      ) sub
    ), '[]'::json),
    'value_metric_distribution', COALESCE((
      SELECT json_agg(row_to_json(sub.*))
      FROM (
        SELECT l.value_metric, COUNT(*) AS count
        FROM packaging.landscape l
        WHERE l.user_id = p_user_id
          AND l.snapshot_date = (
            SELECT MAX(l2.snapshot_date) FROM packaging.landscape l2
            WHERE l2.user_id = p_user_id AND l2.company_id = l.company_id
          )
        GROUP BY l.value_metric
        ORDER BY count DESC
      ) sub
    ), '[]'::json)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ─── 6b. Get packaging landscape (current state per company) ─────────────────
CREATE OR REPLACE FUNCTION public.get_packaging_landscape(
  p_user_id UUID
)
RETURNS TABLE (
  id              UUID,
  company_id      UUID,
  company_name    TEXT,
  tier_structure  JSONB,
  value_metric    TEXT,
  gating_strategy JSONB,
  pricing_url     TEXT,
  plan_count      INT,
  has_free_tier   BOOLEAN,
  has_enterprise  BOOLEAN,
  snapshot_date   DATE,
  meta            JSONB,
  created_at      TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (l.company_id)
    l.id,
    l.company_id,
    l.company_name,
    l.tier_structure,
    l.value_metric,
    l.gating_strategy,
    l.pricing_url,
    l.plan_count,
    l.has_free_tier,
    l.has_enterprise,
    l.snapshot_date,
    l.meta,
    l.created_at
  FROM packaging.landscape l
  WHERE l.user_id = p_user_id
  ORDER BY l.company_id, l.snapshot_date DESC;
END;
$$;

-- ─── 6c. Get packaging briefs (intelligence briefs) ──────────────────────────
CREATE OR REPLACE FUNCTION public.get_packaging_briefs(
  p_user_id   UUID,
  p_days_back INT DEFAULT 90
)
RETURNS TABLE (
  id                       UUID,
  company_name             TEXT,
  company_id               UUID,
  change_id                UUID,
  change_type              TEXT,
  strategic_interpretation TEXT,
  response_recommendations JSONB,
  severity                 TEXT,
  change_details           JSONB,
  created_at               TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.company_name,
    b.company_id,
    b.change_id,
    b.change_type,
    b.strategic_interpretation,
    b.response_recommendations,
    b.severity,
    b.change_details,
    b.created_at
  FROM packaging.briefs b
  WHERE b.user_id = p_user_id
    AND b.created_at >= now() - (p_days_back || ' days')::INTERVAL
  ORDER BY b.created_at DESC;
END;
$$;

-- ─── 6d. Get packaging audits (quarterly audits) ─────────────────────────────
CREATE OR REPLACE FUNCTION public.get_packaging_audits(
  p_user_id UUID
)
RETURNS TABLE (
  id              UUID,
  quarter         TEXT,
  title           TEXT,
  content_json    JSONB,
  content_md      TEXT,
  strengths       JSONB,
  vulnerabilities JSONB,
  opportunities   JSONB,
  threats         JSONB,
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
    a.strengths,
    a.vulnerabilities,
    a.opportunities,
    a.threats,
    a.created_at
  FROM packaging.audits a
  WHERE a.user_id = p_user_id
  ORDER BY a.quarter DESC;
END;
$$;

-- ─── 6e. Get packaging changes (enriched from pricing_tracker) ───────────────
-- Joins pricing_tracker.pricing_changes with core companies for user-scoped view
CREATE OR REPLACE FUNCTION public.get_packaging_changes(
  p_user_id   UUID,
  p_days_back INT DEFAULT 90
)
RETURNS TABLE (
  id                UUID,
  company_id        UUID,
  company_name      TEXT,
  change_type       TEXT,
  change_details    JSONB,
  significance      TEXT,
  interpretation    TEXT,
  strategic_signal  TEXT,
  detected_at       DATE,
  signal_emitted    BOOLEAN,
  created_at        TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.id,
    pc.company_id,
    tp.company_name,
    pc.change_type,
    pc.change_details,
    pc.significance,
    pc.interpretation,
    pc.strategic_signal,
    pc.detected_at,
    pc.signal_emitted,
    pc.created_at
  FROM pricing_tracker.pricing_changes pc
  JOIN pricing_tracker.pricing_snapshots ps ON ps.id = pc.new_snapshot_id
  JOIN core.tracked_pages tp ON tp.id = ps.tracked_page_id
  WHERE tp.user_id = p_user_id
    AND pc.detected_at >= (CURRENT_DATE - (p_days_back || ' days')::INTERVAL)::DATE
  ORDER BY pc.detected_at DESC;
END;
$$;

-- =============================================================================
-- Feature Flag
-- =============================================================================
INSERT INTO admin.feature_flags (flag_key, label, description, is_enabled, applies_to)
VALUES ('packaging_intel', 'Packaging Intelligence', 'Pricing & Packaging Intelligence — tracks competitor packaging moves and surfaces strategic pricing patterns across the category landscape', true, 'all')
ON CONFLICT (flag_key) DO NOTHING;

-- =============================================================================
-- Updated_at trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION packaging.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pkg_landscape_updated_at
  BEFORE UPDATE ON packaging.landscape
  FOR EACH ROW
  EXECUTE FUNCTION packaging.update_updated_at();
