-- ============================================================
-- Narrative Graph: cross-signal, cross-week campaign detection
-- ============================================================

-- 1. narrative_arcs: groups related drifts into campaign arcs
CREATE TABLE IF NOT EXISTS diff_tracker.narrative_arcs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
  arc_title   TEXT NOT NULL,
  arc_theme   TEXT NOT NULL,
  arc_status  TEXT NOT NULL DEFAULT 'building'
    CHECK (arc_status IN ('building','escalating','peaked','fading')),
  first_seen_week  DATE NOT NULL,
  last_seen_week   DATE NOT NULL,
  weeks_active     INT NOT NULL DEFAULT 1,
  escalation_count INT NOT NULL DEFAULT 1,
  trajectory  TEXT NOT NULL DEFAULT 'steady'
    CHECK (trajectory IN ('accelerating','steady','decelerating')),
  current_severity INT NOT NULL DEFAULT 1 CHECK (current_severity BETWEEN 1 AND 5),
  strategic_summary TEXT,
  meta        JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_narrative_arcs_company   ON diff_tracker.narrative_arcs (company_id);
CREATE INDEX idx_narrative_arcs_status    ON diff_tracker.narrative_arcs (arc_status) WHERE arc_status != 'fading';
CREATE INDEX idx_narrative_arcs_last_week ON diff_tracker.narrative_arcs (last_seen_week DESC);

-- 2. narrative_arc_edges: links individual signals into arcs (graph edges)
CREATE TABLE IF NOT EXISTS diff_tracker.narrative_arc_edges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arc_id          UUID NOT NULL REFERENCES diff_tracker.narrative_arcs(id) ON DELETE CASCADE,
  signal_source   TEXT NOT NULL
    CHECK (signal_source IN ('narrative_drift','classified_change','category_drift')),
  source_id       UUID NOT NULL,
  week_start_date DATE NOT NULL,
  edge_label      TEXT NOT NULL DEFAULT 'origin'
    CHECK (edge_label IN ('origin','escalation','reinforcement','pivot')),
  llm_reasoning   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_arc_edges_arc   ON diff_tracker.narrative_arc_edges (arc_id);
CREATE INDEX idx_arc_edges_week  ON diff_tracker.narrative_arc_edges (week_start_date DESC);
CREATE UNIQUE INDEX idx_arc_edges_unique_signal ON diff_tracker.narrative_arc_edges (arc_id, signal_source, source_id);

-- 3. cross_company_convergences: market-wide narrative convergence detection
CREATE TABLE IF NOT EXISTS diff_tracker.cross_company_convergences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convergence_theme TEXT NOT NULL,
  week_detected     DATE NOT NULL,
  company_ids       UUID[] NOT NULL DEFAULT '{}',
  arc_ids           UUID[] NOT NULL DEFAULT '{}',
  severity          INT NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
  summary           TEXT,
  meta              JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_convergences_week ON diff_tracker.cross_company_convergences (week_detected DESC);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE diff_tracker.narrative_arcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE diff_tracker.narrative_arc_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE diff_tracker.cross_company_convergences ENABLE ROW LEVEL SECURITY;

-- Service role: full access for pipeline operations
CREATE POLICY "service_role_full_arcs"
  ON diff_tracker.narrative_arcs FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_edges"
  ON diff_tracker.narrative_arc_edges FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_convergences"
  ON diff_tracker.cross_company_convergences FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Authenticated users: read arcs for companies they track
CREATE POLICY "users_read_own_arcs"
  ON diff_tracker.narrative_arcs FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_tracked_competitors
      WHERE user_id = auth.uid() AND is_active = true AND company_id IS NOT NULL
    )
  );

CREATE POLICY "users_read_own_edges"
  ON diff_tracker.narrative_arc_edges FOR SELECT
  TO authenticated
  USING (
    arc_id IN (
      SELECT na.id FROM diff_tracker.narrative_arcs na
      JOIN public.user_tracked_competitors utc ON utc.company_id = na.company_id
      WHERE utc.user_id = auth.uid() AND utc.is_active = true
    )
  );

CREATE POLICY "users_read_own_convergences"
  ON diff_tracker.cross_company_convergences FOR SELECT
  TO authenticated
  USING (
    company_ids && (
      SELECT COALESCE(array_agg(company_id), '{}')
      FROM public.user_tracked_competitors
      WHERE user_id = auth.uid() AND is_active = true AND company_id IS NOT NULL
    )
  );

-- ============================================================
-- Grants
-- ============================================================

GRANT SELECT ON diff_tracker.narrative_arcs TO authenticated;
GRANT ALL ON diff_tracker.narrative_arcs TO service_role;

GRANT SELECT ON diff_tracker.narrative_arc_edges TO authenticated;
GRANT ALL ON diff_tracker.narrative_arc_edges TO service_role;

GRANT SELECT ON diff_tracker.cross_company_convergences TO authenticated;
GRANT ALL ON diff_tracker.cross_company_convergences TO service_role;

-- ============================================================
-- RPC: get_narrative_arcs_for_user
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_narrative_arcs_for_user(p_user_id UUID)
RETURNS TABLE (
  arc_id           UUID,
  company_id       UUID,
  company_name     TEXT,
  arc_title        TEXT,
  arc_theme        TEXT,
  arc_status       TEXT,
  first_seen_week  DATE,
  last_seen_week   DATE,
  weeks_active     INT,
  escalation_count INT,
  trajectory       TEXT,
  current_severity INT,
  strategic_summary TEXT,
  edges            JSONB
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    na.id AS arc_id,
    na.company_id,
    c.name AS company_name,
    na.arc_title,
    na.arc_theme,
    na.arc_status,
    na.first_seen_week,
    na.last_seen_week,
    na.weeks_active,
    na.escalation_count,
    na.trajectory,
    na.current_severity,
    na.strategic_summary,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'edge_id', e.id,
          'signal_source', e.signal_source,
          'source_id', e.source_id,
          'week_start_date', e.week_start_date,
          'edge_label', e.edge_label,
          'llm_reasoning', e.llm_reasoning
        ) ORDER BY e.week_start_date ASC
      )
      FROM diff_tracker.narrative_arc_edges e
      WHERE e.arc_id = na.id),
      '[]'::jsonb
    ) AS edges
  FROM diff_tracker.narrative_arcs na
  JOIN core.companies c ON c.id = na.company_id
  JOIN public.user_tracked_competitors utc
    ON utc.company_id = na.company_id
    AND utc.user_id = p_user_id
    AND utc.is_active = true
  WHERE na.arc_status != 'fading'
  ORDER BY na.current_severity DESC, na.last_seen_week DESC;
END;
$$;

-- ============================================================
-- RPC: get_active_convergences
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_active_convergences(p_user_id UUID)
RETURNS TABLE (
  convergence_id    UUID,
  convergence_theme TEXT,
  week_detected     DATE,
  company_ids       UUID[],
  company_names     TEXT[],
  arc_ids           UUID[],
  severity          INT,
  summary           TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_ids UUID[];
BEGIN
  SELECT COALESCE(array_agg(company_id), '{}')
  INTO v_company_ids
  FROM public.user_tracked_competitors
  WHERE user_id = p_user_id AND is_active = true AND company_id IS NOT NULL;

  RETURN QUERY
  SELECT
    cc.id AS convergence_id,
    cc.convergence_theme,
    cc.week_detected,
    cc.company_ids,
    (SELECT array_agg(c.name)
     FROM core.companies c
     WHERE c.id = ANY(cc.company_ids)) AS company_names,
    cc.arc_ids,
    cc.severity,
    cc.summary
  FROM diff_tracker.cross_company_convergences cc
  WHERE cc.company_ids && v_company_ids
    AND cc.week_detected >= (CURRENT_DATE - INTERVAL '12 weeks')
  ORDER BY cc.severity DESC, cc.week_detected DESC;
END;
$$;
