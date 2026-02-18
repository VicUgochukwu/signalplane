-- =============================================================================
-- WIN/LOSS INTELLIGENCE — Phase 3 Migration
-- Signal Plane Control Plane
-- =============================================================================
-- Creates:
--   1. winloss schema
--   2. winloss.indicators — Individual win/loss/switch signals from public sources
--   3. winloss.patterns — Aggregated patterns from indicators
--   4. winloss.reports — Monthly win/loss pattern reports
--   5. winloss.decision_maps — Quarterly category decision maps
--   6. RPCs: get_indicators, get_patterns, get_reports, get_decision_maps,
--           get_overview, get_churn_signals
--   7. Feature flag for winloss
-- =============================================================================

-- ─── 1. Schema ───────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS winloss;

-- ─── 2. Indicators (individual win/loss/switch signals) ─────────────────────
CREATE TABLE IF NOT EXISTS winloss.indicators (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id),
  indicator_type    TEXT NOT NULL CHECK (indicator_type IN ('win', 'loss', 'switch')),
  company_name      TEXT NOT NULL,
  company_id        UUID,                                -- optional FK to tracked company
  reason            TEXT NOT NULL,                        -- extracted reason in buyer language
  source_url        TEXT NOT NULL,                        -- link to source evidence
  source_platform   TEXT NOT NULL,                        -- g2, capterra, reddit, hackernews, etc.
  sentiment_score   NUMERIC(3,2) DEFAULT 0 CHECK (sentiment_score BETWEEN -1 AND 1),
  raw_snippet       TEXT,                                 -- original text snippet
  detected_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta              JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Dedup by source_url per user
  UNIQUE(user_id, source_url)
);

CREATE INDEX IF NOT EXISTS idx_winloss_indicators_user_id ON winloss.indicators(user_id);
CREATE INDEX IF NOT EXISTS idx_winloss_indicators_user_detected ON winloss.indicators(user_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_winloss_indicators_user_company ON winloss.indicators(user_id, company_name);
CREATE INDEX IF NOT EXISTS idx_winloss_indicators_type ON winloss.indicators(indicator_type);
CREATE INDEX IF NOT EXISTS idx_winloss_indicators_platform ON winloss.indicators(source_platform);

-- RLS
ALTER TABLE winloss.indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own indicators"
  ON winloss.indicators FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own indicators"
  ON winloss.indicators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access on indicators"
  ON winloss.indicators FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 3. Patterns (aggregated from indicators) ──────────────────────────────
CREATE TABLE IF NOT EXISTS winloss.patterns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id),
  pattern_type      TEXT NOT NULL CHECK (pattern_type IN ('win', 'loss', 'switch')),
  company_name      TEXT NOT NULL,
  company_id        UUID,
  description       TEXT NOT NULL,                        -- pattern description
  frequency         INT NOT NULL DEFAULT 1,               -- occurrence count
  trend             TEXT NOT NULL DEFAULT 'stable' CHECK (trend IN ('rising', 'stable', 'falling')),
  confidence        NUMERIC(3,2) DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  first_seen        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen         TIMESTAMPTZ NOT NULL DEFAULT now(),
  indicator_ids     UUID[],                               -- linked indicator IDs
  tags              TEXT[],
  meta              JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One pattern per type+company+description per user
  UNIQUE(user_id, pattern_type, company_name, description)
);

CREATE INDEX IF NOT EXISTS idx_winloss_patterns_user_id ON winloss.patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_winloss_patterns_user_company ON winloss.patterns(user_id, company_name);
CREATE INDEX IF NOT EXISTS idx_winloss_patterns_type ON winloss.patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_winloss_patterns_frequency ON winloss.patterns(frequency DESC);

-- RLS
ALTER TABLE winloss.patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own patterns"
  ON winloss.patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own patterns"
  ON winloss.patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own patterns"
  ON winloss.patterns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on patterns"
  ON winloss.patterns FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 4. Reports (monthly win/loss pattern reports) ──────────────────────────
CREATE TABLE IF NOT EXISTS winloss.reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id),
  report_month        DATE NOT NULL,                      -- first day of the month
  title               TEXT NOT NULL,
  content_json        JSONB DEFAULT '{}'::jsonb,
  content_md          TEXT DEFAULT '',
  indicator_count     INT DEFAULT 0,
  pattern_count       INT DEFAULT 0,
  companies_analyzed  TEXT[],
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, report_month)
);

CREATE INDEX IF NOT EXISTS idx_winloss_reports_user_id ON winloss.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_winloss_reports_month ON winloss.reports(report_month DESC);

-- RLS
ALTER TABLE winloss.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own reports"
  ON winloss.reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on reports"
  ON winloss.reports FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 5. Decision Maps (quarterly category decision maps) ────────────────────
CREATE TABLE IF NOT EXISTS winloss.decision_maps (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id),
  quarter             TEXT NOT NULL,                      -- e.g. '2026-Q1'
  title               TEXT NOT NULL,
  content_json        JSONB DEFAULT '{}'::jsonb,
  content_md          TEXT DEFAULT '',
  decision_criteria   JSONB DEFAULT '[]'::jsonb,          -- ranked criteria array
  unmet_needs         JSONB DEFAULT '[]'::jsonb,          -- unmet needs array
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, quarter)
);

CREATE INDEX IF NOT EXISTS idx_winloss_decision_maps_user_id ON winloss.decision_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_winloss_decision_maps_quarter ON winloss.decision_maps(quarter DESC);

-- RLS
ALTER TABLE winloss.decision_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own decision_maps"
  ON winloss.decision_maps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on decision_maps"
  ON winloss.decision_maps FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- RPCs
-- =============================================================================

-- ─── 6a. Get indicators (last N days) ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_winloss_indicators(
  p_user_id   UUID,
  p_days_back INT DEFAULT 90
)
RETURNS TABLE (
  id              UUID,
  indicator_type  TEXT,
  company_name    TEXT,
  company_id      UUID,
  reason          TEXT,
  source_url      TEXT,
  source_platform TEXT,
  sentiment_score NUMERIC,
  raw_snippet     TEXT,
  detected_at     TIMESTAMPTZ,
  meta            JSONB,
  created_at      TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.indicator_type,
    i.company_name,
    i.company_id,
    i.reason,
    i.source_url,
    i.source_platform,
    i.sentiment_score,
    i.raw_snippet,
    i.detected_at,
    i.meta,
    i.created_at
  FROM winloss.indicators i
  WHERE i.user_id = p_user_id
    AND i.detected_at >= now() - (p_days_back || ' days')::INTERVAL
  ORDER BY i.detected_at DESC
  LIMIT 500;
END;
$$;

-- ─── 6b. Get patterns ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_winloss_patterns(
  p_user_id UUID
)
RETURNS TABLE (
  id              UUID,
  pattern_type    TEXT,
  company_name    TEXT,
  company_id      UUID,
  description     TEXT,
  frequency       INT,
  trend           TEXT,
  confidence      NUMERIC,
  first_seen      TIMESTAMPTZ,
  last_seen       TIMESTAMPTZ,
  indicator_ids   UUID[],
  tags            TEXT[],
  meta            JSONB,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.pattern_type,
    p.company_name,
    p.company_id,
    p.description,
    p.frequency,
    p.trend,
    p.confidence,
    p.first_seen,
    p.last_seen,
    p.indicator_ids,
    p.tags,
    p.meta,
    p.created_at,
    p.updated_at
  FROM winloss.patterns p
  WHERE p.user_id = p_user_id
  ORDER BY p.frequency DESC, p.last_seen DESC;
END;
$$;

-- ─── 6c. Get reports ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_winloss_reports(
  p_user_id UUID
)
RETURNS TABLE (
  id                 UUID,
  report_month       DATE,
  title              TEXT,
  content_json       JSONB,
  content_md         TEXT,
  indicator_count    INT,
  pattern_count      INT,
  companies_analyzed TEXT[],
  created_at         TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.report_month,
    r.title,
    r.content_json,
    r.content_md,
    r.indicator_count,
    r.pattern_count,
    r.companies_analyzed,
    r.created_at
  FROM winloss.reports r
  WHERE r.user_id = p_user_id
  ORDER BY r.report_month DESC;
END;
$$;

-- ─── 6d. Get decision maps ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_winloss_decision_maps(
  p_user_id UUID
)
RETURNS TABLE (
  id                UUID,
  quarter           TEXT,
  title             TEXT,
  content_json      JSONB,
  content_md        TEXT,
  decision_criteria JSONB,
  unmet_needs       JSONB,
  created_at        TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dm.id,
    dm.quarter,
    dm.title,
    dm.content_json,
    dm.content_md,
    dm.decision_criteria,
    dm.unmet_needs,
    dm.created_at
  FROM winloss.decision_maps dm
  WHERE dm.user_id = p_user_id
  ORDER BY dm.quarter DESC;
END;
$$;

-- ─── 6e. Get overview (dashboard stats) ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_winloss_overview(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'indicators_30d', (
      SELECT COUNT(*) FROM winloss.indicators i
      WHERE i.user_id = p_user_id AND i.detected_at >= now() - INTERVAL '30 days'
    ),
    'indicators_90d', (
      SELECT COUNT(*) FROM winloss.indicators i
      WHERE i.user_id = p_user_id AND i.detected_at >= now() - INTERVAL '90 days'
    ),
    'win_count', (
      SELECT COUNT(*) FROM winloss.indicators i
      WHERE i.user_id = p_user_id AND i.indicator_type = 'win'
        AND i.detected_at >= now() - INTERVAL '90 days'
    ),
    'loss_count', (
      SELECT COUNT(*) FROM winloss.indicators i
      WHERE i.user_id = p_user_id AND i.indicator_type = 'loss'
        AND i.detected_at >= now() - INTERVAL '90 days'
    ),
    'switch_count', (
      SELECT COUNT(*) FROM winloss.indicators i
      WHERE i.user_id = p_user_id AND i.indicator_type = 'switch'
        AND i.detected_at >= now() - INTERVAL '90 days'
    ),
    'active_patterns', (
      SELECT COUNT(*) FROM winloss.patterns p
      WHERE p.user_id = p_user_id
    ),
    'rising_patterns', (
      SELECT COUNT(*) FROM winloss.patterns p
      WHERE p.user_id = p_user_id AND p.trend = 'rising'
    ),
    'top_win_patterns', COALESCE((
      SELECT json_agg(row_to_json(sub.*))
      FROM (
        SELECT p.company_name, p.description, p.frequency, p.trend
        FROM winloss.patterns p
        WHERE p.user_id = p_user_id AND p.pattern_type = 'win'
        ORDER BY p.frequency DESC LIMIT 3
      ) sub
    ), '[]'::json),
    'top_loss_patterns', COALESCE((
      SELECT json_agg(row_to_json(sub.*))
      FROM (
        SELECT p.company_name, p.description, p.frequency, p.trend
        FROM winloss.patterns p
        WHERE p.user_id = p_user_id AND p.pattern_type = 'loss'
        ORDER BY p.frequency DESC LIMIT 3
      ) sub
    ), '[]'::json),
    'top_switch_patterns', COALESCE((
      SELECT json_agg(row_to_json(sub.*))
      FROM (
        SELECT p.company_name, p.description, p.frequency, p.trend
        FROM winloss.patterns p
        WHERE p.user_id = p_user_id AND p.pattern_type = 'switch'
        ORDER BY p.frequency DESC LIMIT 3
      ) sub
    ), '[]'::json),
    'recent_indicators', COALESCE((
      SELECT json_agg(row_to_json(sub.*))
      FROM (
        SELECT i.id, i.indicator_type, i.company_name, i.reason, i.source_platform, i.detected_at
        FROM winloss.indicators i
        WHERE i.user_id = p_user_id
        ORDER BY i.detected_at DESC LIMIT 10
      ) sub
    ), '[]'::json),
    'companies_tracked', COALESCE((
      SELECT json_agg(DISTINCT i.company_name)
      FROM winloss.indicators i
      WHERE i.user_id = p_user_id AND i.detected_at >= now() - INTERVAL '90 days'
    ), '[]'::json),
    'latest_report_month', (
      SELECT r.report_month FROM winloss.reports r
      WHERE r.user_id = p_user_id
      ORDER BY r.report_month DESC LIMIT 1
    ),
    'latest_decision_map_quarter', (
      SELECT dm.quarter FROM winloss.decision_maps dm
      WHERE dm.user_id = p_user_id
      ORDER BY dm.quarter DESC LIMIT 1
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ─── 6f. Get churn signals (loss + switch, churn-focused) ───────────────────
CREATE OR REPLACE FUNCTION public.get_winloss_churn_signals(
  p_user_id   UUID,
  p_days_back INT DEFAULT 30
)
RETURNS TABLE (
  id              UUID,
  indicator_type  TEXT,
  company_name    TEXT,
  reason          TEXT,
  source_url      TEXT,
  source_platform TEXT,
  sentiment_score NUMERIC,
  detected_at     TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.indicator_type,
    i.company_name,
    i.reason,
    i.source_url,
    i.source_platform,
    i.sentiment_score,
    i.detected_at
  FROM winloss.indicators i
  WHERE i.user_id = p_user_id
    AND i.indicator_type IN ('loss', 'switch')
    AND i.detected_at >= now() - (p_days_back || ' days')::INTERVAL
  ORDER BY i.detected_at DESC
  LIMIT 200;
END;
$$;

-- =============================================================================
-- Feature Flag
-- =============================================================================
INSERT INTO admin.feature_flags (flag_key, label, description, is_enabled, applies_to)
VALUES ('winloss', 'Win/Loss Intelligence', 'Win/Loss Intelligence — monitor public buyer decision signals and surface patterns in why buyers choose or reject products', true, 'all')
ON CONFLICT (flag_key) DO NOTHING;

-- =============================================================================
-- Updated_at trigger for patterns
-- =============================================================================
CREATE OR REPLACE FUNCTION winloss.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_winloss_patterns_updated_at
  BEFORE UPDATE ON winloss.patterns
  FOR EACH ROW
  EXECUTE FUNCTION winloss.update_updated_at();
