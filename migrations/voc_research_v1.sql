-- =============================================================================
-- VOC RESEARCH — Phase 4 Migration
-- Signal Plane Control Plane
-- =============================================================================
-- Creates:
--   1. research schema
--   2. research.voc_entries — Individual buyer voice data points (pain/desire/language/criteria)
--   3. research.persona_reports — Monthly per-persona language reports
--   4. research.market_pulse — Monthly category-level synthesis
--   5. RPCs: get_voc_entries, get_voc_overview, get_persona_reports,
--           get_market_pulse, get_voc_trends
--   6. Feature flag for voc_research
-- =============================================================================

-- ─── 1. Schema ───────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS research;

-- ─── 2. VoC Entries (individual buyer voice data points) ─────────────────────
CREATE TABLE IF NOT EXISTS research.voc_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id),
  dimension         TEXT NOT NULL CHECK (dimension IN ('pain', 'desire', 'language', 'criteria')),
  text              TEXT NOT NULL,                        -- the buyer voice data point
  source_url        TEXT NOT NULL,                        -- link to source evidence
  source_platform   TEXT NOT NULL,                        -- g2, capterra, reddit, etc.
  persona           TEXT,                                 -- buyer persona tag
  funnel_stage      TEXT CHECK (funnel_stage IN ('awareness', 'consideration', 'decision', 'retention')),
  industry          TEXT,                                 -- optional industry tag
  company_size      TEXT,                                 -- optional company size tag
  trend             TEXT NOT NULL DEFAULT 'stable' CHECK (trend IN ('rising', 'stable', 'fading')),
  frequency         INT NOT NULL DEFAULT 1,
  first_seen        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen         TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_snippet       TEXT,                                 -- original text snippet
  tags              TEXT[],
  meta              JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Dedup by source_url per user
  UNIQUE(user_id, source_url)
);

CREATE INDEX IF NOT EXISTS idx_voc_entries_user_id ON research.voc_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_voc_entries_user_dimension ON research.voc_entries(user_id, dimension);
CREATE INDEX IF NOT EXISTS idx_voc_entries_user_persona ON research.voc_entries(user_id, persona);
CREATE INDEX IF NOT EXISTS idx_voc_entries_user_first_seen ON research.voc_entries(user_id, first_seen DESC);
CREATE INDEX IF NOT EXISTS idx_voc_entries_dimension_trend ON research.voc_entries(dimension, trend);
CREATE INDEX IF NOT EXISTS idx_voc_entries_platform ON research.voc_entries(source_platform);

-- RLS
ALTER TABLE research.voc_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own voc_entries"
  ON research.voc_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own voc_entries"
  ON research.voc_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own voc_entries"
  ON research.voc_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on voc_entries"
  ON research.voc_entries FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 3. Persona Reports (monthly per-persona language reports) ───────────────
CREATE TABLE IF NOT EXISTS research.persona_reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id),
  persona             TEXT NOT NULL,
  report_month        DATE NOT NULL,                      -- first day of the month
  title               TEXT NOT NULL,
  content_json        JSONB DEFAULT '{}'::jsonb,
  content_md          TEXT DEFAULT '',
  entry_count         INT DEFAULT 0,
  dimension_breakdown JSONB DEFAULT '{}'::jsonb,          -- { pain: N, desire: N, ... }
  language_shifts     JSONB DEFAULT '[]'::jsonb,          -- detected shifts in language
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, persona, report_month)
);

CREATE INDEX IF NOT EXISTS idx_persona_reports_user_id ON research.persona_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_persona_reports_month ON research.persona_reports(report_month DESC);

-- RLS
ALTER TABLE research.persona_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own persona_reports"
  ON research.persona_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on persona_reports"
  ON research.persona_reports FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 4. Market Pulse (monthly category-level synthesis) ──────────────────────
CREATE TABLE IF NOT EXISTS research.market_pulse (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id),
  report_month        DATE NOT NULL,
  title               TEXT NOT NULL,
  content_json        JSONB DEFAULT '{}'::jsonb,
  content_md          TEXT DEFAULT '',
  top_pains           JSONB DEFAULT '[]'::jsonb,          -- ranked pain points
  emerging_desires    JSONB DEFAULT '[]'::jsonb,          -- emerging desires
  language_shifts     JSONB DEFAULT '[]'::jsonb,          -- language evolution
  criteria_shifts     JSONB DEFAULT '[]'::jsonb,          -- decision criteria shifts
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, report_month)
);

CREATE INDEX IF NOT EXISTS idx_market_pulse_user_id ON research.market_pulse(user_id);
CREATE INDEX IF NOT EXISTS idx_market_pulse_month ON research.market_pulse(report_month DESC);

-- RLS
ALTER TABLE research.market_pulse ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own market_pulse"
  ON research.market_pulse FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on market_pulse"
  ON research.market_pulse FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- RPCs
-- =============================================================================

-- ─── 5a. Get VoC entries (filtered, last N days) ─────────────────────────────
CREATE OR REPLACE FUNCTION public.get_voc_entries(
  p_user_id    UUID,
  p_dimension  TEXT DEFAULT NULL,
  p_persona    TEXT DEFAULT NULL,
  p_days_back  INT DEFAULT 90
)
RETURNS TABLE (
  id              UUID,
  dimension       TEXT,
  text            TEXT,
  source_url      TEXT,
  source_platform TEXT,
  persona         TEXT,
  funnel_stage    TEXT,
  industry        TEXT,
  company_size    TEXT,
  trend           TEXT,
  frequency       INT,
  first_seen      TIMESTAMPTZ,
  last_seen       TIMESTAMPTZ,
  raw_snippet     TEXT,
  tags            TEXT[],
  meta            JSONB,
  created_at      TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.dimension,
    e.text,
    e.source_url,
    e.source_platform,
    e.persona,
    e.funnel_stage,
    e.industry,
    e.company_size,
    e.trend,
    e.frequency,
    e.first_seen,
    e.last_seen,
    e.raw_snippet,
    e.tags,
    e.meta,
    e.created_at
  FROM research.voc_entries e
  WHERE e.user_id = p_user_id
    AND e.first_seen >= now() - (p_days_back || ' days')::INTERVAL
    AND (p_dimension IS NULL OR e.dimension = p_dimension)
    AND (p_persona IS NULL OR e.persona = p_persona)
  ORDER BY e.first_seen DESC
  LIMIT 500;
END;
$$;

-- ─── 5b. Get VoC overview (dashboard stats) ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_voc_overview(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_entries', (
      SELECT COUNT(*) FROM research.voc_entries e
      WHERE e.user_id = p_user_id
    ),
    'entries_30d', (
      SELECT COUNT(*) FROM research.voc_entries e
      WHERE e.user_id = p_user_id AND e.first_seen >= now() - INTERVAL '30 days'
    ),
    'entries_90d', (
      SELECT COUNT(*) FROM research.voc_entries e
      WHERE e.user_id = p_user_id AND e.first_seen >= now() - INTERVAL '90 days'
    ),
    'pain_count', (
      SELECT COUNT(*) FROM research.voc_entries e
      WHERE e.user_id = p_user_id AND e.dimension = 'pain'
        AND e.first_seen >= now() - INTERVAL '90 days'
    ),
    'desire_count', (
      SELECT COUNT(*) FROM research.voc_entries e
      WHERE e.user_id = p_user_id AND e.dimension = 'desire'
        AND e.first_seen >= now() - INTERVAL '90 days'
    ),
    'language_count', (
      SELECT COUNT(*) FROM research.voc_entries e
      WHERE e.user_id = p_user_id AND e.dimension = 'language'
        AND e.first_seen >= now() - INTERVAL '90 days'
    ),
    'criteria_count', (
      SELECT COUNT(*) FROM research.voc_entries e
      WHERE e.user_id = p_user_id AND e.dimension = 'criteria'
        AND e.first_seen >= now() - INTERVAL '90 days'
    ),
    'rising_entries', (
      SELECT COUNT(*) FROM research.voc_entries e
      WHERE e.user_id = p_user_id AND e.trend = 'rising'
    ),
    'fading_entries', (
      SELECT COUNT(*) FROM research.voc_entries e
      WHERE e.user_id = p_user_id AND e.trend = 'fading'
    ),
    'top_pains', COALESCE((
      SELECT json_agg(row_to_json(sub.*))
      FROM (
        SELECT e.text, e.persona, e.frequency, e.trend
        FROM research.voc_entries e
        WHERE e.user_id = p_user_id AND e.dimension = 'pain'
        ORDER BY e.frequency DESC LIMIT 5
      ) sub
    ), '[]'::json),
    'top_desires', COALESCE((
      SELECT json_agg(row_to_json(sub.*))
      FROM (
        SELECT e.text, e.persona, e.frequency, e.trend
        FROM research.voc_entries e
        WHERE e.user_id = p_user_id AND e.dimension = 'desire'
        ORDER BY e.frequency DESC LIMIT 5
      ) sub
    ), '[]'::json),
    'top_language', COALESCE((
      SELECT json_agg(row_to_json(sub.*))
      FROM (
        SELECT e.text, e.persona, e.frequency, e.trend
        FROM research.voc_entries e
        WHERE e.user_id = p_user_id AND e.dimension = 'language'
        ORDER BY e.frequency DESC LIMIT 5
      ) sub
    ), '[]'::json),
    'top_criteria', COALESCE((
      SELECT json_agg(row_to_json(sub.*))
      FROM (
        SELECT e.text, e.persona, e.frequency, e.trend
        FROM research.voc_entries e
        WHERE e.user_id = p_user_id AND e.dimension = 'criteria'
        ORDER BY e.frequency DESC LIMIT 5
      ) sub
    ), '[]'::json),
    'recent_entries', COALESCE((
      SELECT json_agg(row_to_json(sub.*))
      FROM (
        SELECT e.id, e.dimension, e.text, e.persona, e.source_platform, e.trend, e.first_seen
        FROM research.voc_entries e
        WHERE e.user_id = p_user_id
        ORDER BY e.first_seen DESC LIMIT 10
      ) sub
    ), '[]'::json),
    'personas_tracked', COALESCE((
      SELECT json_agg(DISTINCT e.persona)
      FROM research.voc_entries e
      WHERE e.user_id = p_user_id AND e.persona IS NOT NULL
        AND e.first_seen >= now() - INTERVAL '90 days'
    ), '[]'::json),
    'latest_persona_report_month', (
      SELECT pr.report_month FROM research.persona_reports pr
      WHERE pr.user_id = p_user_id
      ORDER BY pr.report_month DESC LIMIT 1
    ),
    'latest_market_pulse_month', (
      SELECT mp.report_month FROM research.market_pulse mp
      WHERE mp.user_id = p_user_id
      ORDER BY mp.report_month DESC LIMIT 1
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ─── 5c. Get persona reports ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_persona_reports(
  p_user_id UUID
)
RETURNS TABLE (
  id                  UUID,
  persona             TEXT,
  report_month        DATE,
  title               TEXT,
  content_json        JSONB,
  content_md          TEXT,
  entry_count         INT,
  dimension_breakdown JSONB,
  language_shifts     JSONB,
  created_at          TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.id,
    pr.persona,
    pr.report_month,
    pr.title,
    pr.content_json,
    pr.content_md,
    pr.entry_count,
    pr.dimension_breakdown,
    pr.language_shifts,
    pr.created_at
  FROM research.persona_reports pr
  WHERE pr.user_id = p_user_id
  ORDER BY pr.report_month DESC, pr.persona ASC;
END;
$$;

-- ─── 5d. Get market pulse ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_market_pulse(
  p_user_id UUID
)
RETURNS TABLE (
  id                UUID,
  report_month      DATE,
  title             TEXT,
  content_json      JSONB,
  content_md        TEXT,
  top_pains         JSONB,
  emerging_desires  JSONB,
  language_shifts   JSONB,
  criteria_shifts   JSONB,
  created_at        TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mp.id,
    mp.report_month,
    mp.title,
    mp.content_json,
    mp.content_md,
    mp.top_pains,
    mp.emerging_desires,
    mp.language_shifts,
    mp.criteria_shifts,
    mp.created_at
  FROM research.market_pulse mp
  WHERE mp.user_id = p_user_id
  ORDER BY mp.report_month DESC;
END;
$$;

-- ─── 5e. Get VoC trends ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_voc_trends(
  p_user_id   UUID,
  p_days_back INT DEFAULT 90
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'rising_by_dimension', COALESCE((
      SELECT json_agg(row_to_json(sub.*))
      FROM (
        SELECT e.dimension, e.text, e.persona, e.frequency, e.first_seen
        FROM research.voc_entries e
        WHERE e.user_id = p_user_id AND e.trend = 'rising'
          AND e.first_seen >= now() - (p_days_back || ' days')::INTERVAL
        ORDER BY e.frequency DESC
        LIMIT 20
      ) sub
    ), '[]'::json),
    'fading_by_dimension', COALESCE((
      SELECT json_agg(row_to_json(sub.*))
      FROM (
        SELECT e.dimension, e.text, e.persona, e.frequency, e.first_seen
        FROM research.voc_entries e
        WHERE e.user_id = p_user_id AND e.trend = 'fading'
          AND e.first_seen >= now() - (p_days_back || ' days')::INTERVAL
        ORDER BY e.frequency DESC
        LIMIT 20
      ) sub
    ), '[]'::json),
    'new_entries_this_period', (
      SELECT COUNT(*) FROM research.voc_entries e
      WHERE e.user_id = p_user_id
        AND e.created_at >= now() - (p_days_back || ' days')::INTERVAL
    ),
    'dimension_summary', COALESCE((
      SELECT json_agg(row_to_json(sub.*))
      FROM (
        SELECT
          e.dimension,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE e.trend = 'rising') AS rising,
          COUNT(*) FILTER (WHERE e.trend = 'fading') AS fading,
          COUNT(*) FILTER (WHERE e.trend = 'stable') AS stable
        FROM research.voc_entries e
        WHERE e.user_id = p_user_id
          AND e.first_seen >= now() - (p_days_back || ' days')::INTERVAL
        GROUP BY e.dimension
        ORDER BY total DESC
      ) sub
    ), '[]'::json),
    'persona_summary', COALESCE((
      SELECT json_agg(row_to_json(sub.*))
      FROM (
        SELECT
          e.persona,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE e.trend = 'rising') AS rising,
          COUNT(*) FILTER (WHERE e.trend = 'fading') AS fading
        FROM research.voc_entries e
        WHERE e.user_id = p_user_id AND e.persona IS NOT NULL
          AND e.first_seen >= now() - (p_days_back || ' days')::INTERVAL
        GROUP BY e.persona
        ORDER BY total DESC
      ) sub
    ), '[]'::json)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- =============================================================================
-- Feature Flag
-- =============================================================================
INSERT INTO admin.feature_flags (flag_key, label, description, is_enabled, applies_to)
VALUES ('voc_research', 'VoC Research', 'Voice of Customer Research — aggregate and classify buyer language across pains, desires, language patterns, and decision criteria from public sources', true, 'all')
ON CONFLICT (flag_key) DO NOTHING;

-- =============================================================================
-- Updated_at trigger for voc_entries
-- =============================================================================
CREATE OR REPLACE FUNCTION research.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_voc_entries_updated_at
  BEFORE UPDATE ON research.voc_entries
  FOR EACH ROW
  EXECUTE FUNCTION research.update_updated_at();
