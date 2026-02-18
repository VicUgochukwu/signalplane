-- ============================================================
-- Credibility Framework: evidence weighting, corroboration,
-- counter-hypotheses, and intelligence-grade confidence levels
-- ============================================================

-- 1. Add evidence weight + page_type to arc edges
ALTER TABLE diff_tracker.narrative_arc_edges
  ADD COLUMN IF NOT EXISTS evidence_weight TEXT NOT NULL DEFAULT 'medium'
    CHECK (evidence_weight IN ('high','medium','low')),
  ADD COLUMN IF NOT EXISTS page_type TEXT;

COMMENT ON COLUMN diff_tracker.narrative_arc_edges.evidence_weight IS
  'Signal strength: high = homepage/pricing (board-level), medium = product page, low = blog/partners/docs';
COMMENT ON COLUMN diff_tracker.narrative_arc_edges.page_type IS
  'Source page type: homepage, pricing, product, blog, partners, docs, etc.';

-- 2. Add corroboration fields to narrative arcs
ALTER TABLE diff_tracker.narrative_arcs
  ADD COLUMN IF NOT EXISTS corroboration_score TEXT NOT NULL DEFAULT 'weak'
    CHECK (corroboration_score IN ('strong','moderate','weak')),
  ADD COLUMN IF NOT EXISTS page_type_diversity INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS alternative_explanation TEXT,
  ADD COLUMN IF NOT EXISTS confidence_level TEXT NOT NULL DEFAULT 'low'
    CHECK (confidence_level IN ('high','moderate-high','moderate','low'));

COMMENT ON COLUMN diff_tracker.narrative_arcs.corroboration_score IS
  'strong = 3+ signals across 2+ page types, moderate = 2+ signals OR 2+ page types, weak = single signal/page type';
COMMENT ON COLUMN diff_tracker.narrative_arcs.page_type_diversity IS
  'Count of distinct page types across all edges in this arc';
COMMENT ON COLUMN diff_tracker.narrative_arcs.alternative_explanation IS
  'LLM-generated counter-hypothesis explaining why this arc might not be a deliberate strategic shift';
COMMENT ON COLUMN diff_tracker.narrative_arcs.confidence_level IS
  'Overall assessment confidence based on signal count, page diversity, and temporal persistence';

-- 3. Add corroboration fields to convergences
ALTER TABLE diff_tracker.cross_company_convergences
  ADD COLUMN IF NOT EXISTS corroboration_score TEXT NOT NULL DEFAULT 'weak'
    CHECK (corroboration_score IN ('strong','moderate','weak')),
  ADD COLUMN IF NOT EXISTS alternative_explanation TEXT,
  ADD COLUMN IF NOT EXISTS confidence_level TEXT NOT NULL DEFAULT 'low'
    CHECK (confidence_level IN ('high','moderate-high','moderate','low'));

COMMENT ON COLUMN diff_tracker.cross_company_convergences.corroboration_score IS
  'Strength of evidence for this convergence pattern';
COMMENT ON COLUMN diff_tracker.cross_company_convergences.alternative_explanation IS
  'Counter-hypothesis: why these companies might not actually be converging on the same narrative';
COMMENT ON COLUMN diff_tracker.cross_company_convergences.confidence_level IS
  'Assessment confidence level for this convergence detection';

-- ============================================================
-- Update RPCs to include new fields
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_narrative_arcs_for_user(p_user_id UUID)
RETURNS TABLE (
  arc_id              UUID,
  company_id          UUID,
  company_name        TEXT,
  arc_title           TEXT,
  arc_theme           TEXT,
  arc_status          TEXT,
  first_seen_week     DATE,
  last_seen_week      DATE,
  weeks_active        INT,
  escalation_count    INT,
  trajectory          TEXT,
  current_severity    INT,
  strategic_summary   TEXT,
  corroboration_score TEXT,
  page_type_diversity INT,
  alternative_explanation TEXT,
  confidence_level    TEXT,
  edges               JSONB
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
    na.corroboration_score,
    na.page_type_diversity,
    na.alternative_explanation,
    na.confidence_level,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'edge_id', e.id,
          'signal_source', e.signal_source,
          'source_id', e.source_id,
          'week_start_date', e.week_start_date,
          'edge_label', e.edge_label,
          'llm_reasoning', e.llm_reasoning,
          'evidence_weight', e.evidence_weight,
          'page_type', e.page_type
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

CREATE OR REPLACE FUNCTION public.get_active_convergences(p_user_id UUID)
RETURNS TABLE (
  convergence_id          UUID,
  convergence_theme       TEXT,
  week_detected           DATE,
  company_ids             UUID[],
  company_names           TEXT[],
  arc_ids                 UUID[],
  severity                INT,
  summary                 TEXT,
  corroboration_score     TEXT,
  alternative_explanation TEXT,
  confidence_level        TEXT
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
    cc.summary,
    cc.corroboration_score,
    cc.alternative_explanation,
    cc.confidence_level
  FROM diff_tracker.cross_company_convergences cc
  WHERE cc.company_ids && v_company_ids
    AND cc.week_detected >= (CURRENT_DATE - INTERVAL '12 weeks')
  ORDER BY cc.severity DESC, cc.week_detected DESC;
END;
$$;
