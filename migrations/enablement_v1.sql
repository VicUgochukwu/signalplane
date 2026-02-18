-- =============================================================================
-- SALES ENABLEMENT MODULE — Phase 1 Migration
-- Signal Plane Control Plane
-- =============================================================================
-- Creates:
--   1. enablement schema
--   2. enablement.deliveries — tracks artifact distribution events
--   3. enablement.feedback — stores rep feedback on artifacts
--   4. enablement.outcomes — correlates enablement to deal results
--   5. enablement.gaps — tracks identified coverage gaps
--   6. enablement.scorecards — weekly scorecard artifacts
--   7. enablement.deal_artifacts — junction table linking deals to artifacts
--   8. enablement.view_events — tracks artifact views (click-throughs)
--   9. RPCs for all operations
--  10. New signal types for enablement
-- =============================================================================

-- ─── 1. Schema ───────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS enablement;

-- ─── 2. Deliveries ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enablement.deliveries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('battlecard', 'objection_library', 'swipe_file', 'maturity_model', 'deal_brief', 'scorecard')),
  artifact_id   UUID,                        -- FK to artifact_versions.id (optional, for versioned artifacts)
  competitor_name TEXT,                       -- which competitor's battlecard, if applicable
  channel       TEXT NOT NULL CHECK (channel IN ('slack', 'email', 'in_app', 'notion')),
  recipient_team TEXT,                        -- team name or channel name
  recipient_ids  UUID[],                      -- specific user IDs if targeted
  deal_id       UUID,                         -- optional link to deals table
  delivered_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata      JSONB DEFAULT '{}'::jsonb     -- extra context (channel_name, message_ts, etc.)
);

CREATE INDEX IF NOT EXISTS idx_deliveries_user_id ON enablement.deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_artifact_type ON enablement.deliveries(artifact_type);
CREATE INDEX IF NOT EXISTS idx_deliveries_delivered_at ON enablement.deliveries(delivered_at DESC);

-- RLS
ALTER TABLE enablement.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own deliveries"
  ON enablement.deliveries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own deliveries"
  ON enablement.deliveries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access on deliveries"
  ON enablement.deliveries FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 3. Feedback ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enablement.feedback (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  delivery_id   UUID REFERENCES enablement.deliveries(id),
  artifact_type TEXT NOT NULL,
  artifact_id   UUID,
  competitor_name TEXT,
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  useful_sections TEXT[],                     -- which sections the rep found useful
  missing_items   TEXT[],                     -- what was missing
  comments      TEXT,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON enablement.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_artifact_type ON enablement.feedback(artifact_type);
CREATE INDEX IF NOT EXISTS idx_feedback_submitted_at ON enablement.feedback(submitted_at DESC);

ALTER TABLE enablement.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own team feedback"
  ON enablement.feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert feedback"
  ON enablement.feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access on feedback"
  ON enablement.feedback FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 4. Outcomes ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enablement.outcomes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  deal_id       UUID NOT NULL,                -- FK to public.deals
  artifacts_used JSONB DEFAULT '[]'::jsonb,   -- [{artifact_type, artifact_id, competitor_name}]
  outcome       TEXT NOT NULL CHECK (outcome IN ('won', 'lost', 'stalled', 'in_progress')),
  close_date    DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outcomes_user_id ON enablement.outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_deal_id ON enablement.outcomes(deal_id);

ALTER TABLE enablement.outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own outcomes"
  ON enablement.outcomes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own outcomes"
  ON enablement.outcomes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access on outcomes"
  ON enablement.outcomes FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 5. Gaps ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enablement.gaps (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id),
  gap_type              TEXT NOT NULL CHECK (gap_type IN ('missing_battlecard', 'stale_battlecard', 'missing_objection', 'no_competitive_context', 'missing_talk_track')),
  description           TEXT NOT NULL,
  severity              TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
  competitor_name       TEXT,
  deal_id               UUID,
  identified_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at           TIMESTAMPTZ,
  resolution_artifact_id UUID,
  resolution_notes      TEXT
);

CREATE INDEX IF NOT EXISTS idx_gaps_user_id ON enablement.gaps(user_id);
CREATE INDEX IF NOT EXISTS idx_gaps_severity ON enablement.gaps(severity);
CREATE INDEX IF NOT EXISTS idx_gaps_resolved ON enablement.gaps(resolved_at) WHERE resolved_at IS NULL;

ALTER TABLE enablement.gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own gaps"
  ON enablement.gaps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on gaps"
  ON enablement.gaps FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 6. Scorecards ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enablement.scorecards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  week_start  DATE NOT NULL,
  week_end    DATE NOT NULL,
  data        JSONB NOT NULL,                 -- full scorecard JSON
  /*
    data schema:
    {
      deliveries_count: number,
      artifacts_updated: number,
      feedback_count: number,
      avg_rating: number,
      top_referenced_sections: string[],
      unaddressed_objections: string[],
      coverage_gaps: [{gap_type, description, severity, competitor_name}],
      actions_recommended: string[],
      views_count: number,
      unique_viewers: number
    }
  */
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, week_start)
);

ALTER TABLE enablement.scorecards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own scorecards"
  ON enablement.scorecards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on scorecards"
  ON enablement.scorecards FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 7. Deal-Artifact Junction ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enablement.deal_artifacts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  deal_id       UUID NOT NULL,                -- FK to public.deals
  artifact_type TEXT NOT NULL,
  artifact_id   UUID,
  competitor_name TEXT,
  linked_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes         TEXT
);

-- Use a unique index with COALESCE (can't use UNIQUE constraint with function expressions)
CREATE UNIQUE INDEX IF NOT EXISTS idx_deal_artifacts_unique
  ON enablement.deal_artifacts(deal_id, artifact_type, COALESCE(competitor_name, ''));

CREATE INDEX IF NOT EXISTS idx_deal_artifacts_deal_id ON enablement.deal_artifacts(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_artifacts_user_id ON enablement.deal_artifacts(user_id);

ALTER TABLE enablement.deal_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own deal_artifacts"
  ON enablement.deal_artifacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own deal_artifacts"
  ON enablement.deal_artifacts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on deal_artifacts"
  ON enablement.deal_artifacts FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 8. View Events ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enablement.view_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id),  -- who viewed
  viewer_id     UUID NOT NULL REFERENCES auth.users(id),  -- the actual viewer (could be a rep on the team)
  artifact_type TEXT NOT NULL,
  artifact_id   UUID,
  competitor_name TEXT,
  source        TEXT NOT NULL CHECK (source IN ('slack', 'email', 'direct', 'notification')),
  viewed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_view_events_user_id ON enablement.view_events(user_id);
CREATE INDEX IF NOT EXISTS idx_view_events_artifact_type ON enablement.view_events(artifact_type);
CREATE INDEX IF NOT EXISTS idx_view_events_viewed_at ON enablement.view_events(viewed_at DESC);

ALTER TABLE enablement.view_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own view_events"
  ON enablement.view_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert view_events"
  ON enablement.view_events FOR INSERT
  WITH CHECK (true);  -- any authenticated user can log a view

CREATE POLICY "Service role full access on view_events"
  ON enablement.view_events FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 9. Add 'enablement' to control_plane.signals signal_type ───────────────
-- The signals table uses a TEXT column, not an enum, so no ALTER TYPE needed.
-- We just need to ensure the ingest-external-signal edge function accepts it.
-- Handled in code by adding to VALID_SIGNAL_TYPES array.

-- =============================================================================
-- RPCs (wrapper functions for PostgREST access to enablement schema)
-- =============================================================================

-- ─── 9a. Log a delivery event ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_enablement_delivery(
  p_user_id       UUID,
  p_artifact_type TEXT,
  p_artifact_id   UUID DEFAULT NULL,
  p_competitor_name TEXT DEFAULT NULL,
  p_channel       TEXT DEFAULT 'in_app',
  p_recipient_team TEXT DEFAULT NULL,
  p_recipient_ids  UUID[] DEFAULT NULL,
  p_deal_id       UUID DEFAULT NULL,
  p_metadata      JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO enablement.deliveries (
    user_id, artifact_type, artifact_id, competitor_name,
    channel, recipient_team, recipient_ids, deal_id, metadata
  )
  VALUES (
    p_user_id, p_artifact_type, p_artifact_id, p_competitor_name,
    p_channel, p_recipient_team, p_recipient_ids, p_deal_id, p_metadata
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ─── 9b. Submit feedback ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_enablement_feedback(
  p_user_id       UUID,
  p_artifact_type TEXT,
  p_rating        SMALLINT,
  p_delivery_id   UUID DEFAULT NULL,
  p_artifact_id   UUID DEFAULT NULL,
  p_competitor_name TEXT DEFAULT NULL,
  p_useful_sections TEXT[] DEFAULT NULL,
  p_missing_items   TEXT[] DEFAULT NULL,
  p_comments      TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO enablement.feedback (
    user_id, delivery_id, artifact_type, artifact_id,
    competitor_name, rating, useful_sections, missing_items, comments
  )
  VALUES (
    p_user_id, p_delivery_id, p_artifact_type, p_artifact_id,
    p_competitor_name, p_rating, p_useful_sections, p_missing_items, p_comments
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ─── 9c. Log a view event ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_artifact_view(
  p_user_id       UUID,
  p_viewer_id     UUID,
  p_artifact_type TEXT,
  p_source        TEXT DEFAULT 'direct',
  p_artifact_id   UUID DEFAULT NULL,
  p_competitor_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO enablement.view_events (
    user_id, viewer_id, artifact_type, artifact_id, competitor_name, source
  )
  VALUES (
    p_user_id, p_viewer_id, p_artifact_type, p_artifact_id, p_competitor_name, p_source
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ─── 9d. Link artifact to deal ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.link_deal_artifact(
  p_user_id       UUID,
  p_deal_id       UUID,
  p_artifact_type TEXT,
  p_artifact_id   UUID DEFAULT NULL,
  p_competitor_name TEXT DEFAULT NULL,
  p_notes         TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO enablement.deal_artifacts (
    user_id, deal_id, artifact_type, artifact_id, competitor_name, notes
  )
  VALUES (
    p_user_id, p_deal_id, p_artifact_type, p_artifact_id, p_competitor_name, p_notes
  )
  ON CONFLICT (deal_id, artifact_type, COALESCE(competitor_name, ''))
  DO UPDATE SET
    artifact_id = EXCLUDED.artifact_id,
    notes = COALESCE(EXCLUDED.notes, enablement.deal_artifacts.notes),
    linked_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ─── 9e. Unlink artifact from deal ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.unlink_deal_artifact(
  p_link_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM enablement.deal_artifacts WHERE id = p_link_id;
END;
$$;

-- ─── 9f. Get deal artifacts ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_deal_artifacts(
  p_deal_id UUID
)
RETURNS TABLE (
  id UUID,
  artifact_type TEXT,
  artifact_id UUID,
  competitor_name TEXT,
  linked_at TIMESTAMPTZ,
  notes TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    da.id,
    da.artifact_type,
    da.artifact_id,
    da.competitor_name,
    da.linked_at,
    da.notes
  FROM enablement.deal_artifacts da
  WHERE da.deal_id = p_deal_id
  ORDER BY da.linked_at DESC;
END;
$$;

-- ─── 9g. Get enablement stats for scorecard ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_enablement_stats(
  p_user_id   UUID,
  p_from_date TIMESTAMPTZ DEFAULT now() - INTERVAL '7 days',
  p_to_date   TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (
  deliveries_count BIGINT,
  feedback_count BIGINT,
  avg_rating NUMERIC,
  views_count BIGINT,
  unique_viewers BIGINT,
  open_gaps BIGINT,
  high_severity_gaps BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM enablement.deliveries d
     WHERE d.user_id = p_user_id AND d.delivered_at BETWEEN p_from_date AND p_to_date),
    (SELECT COUNT(*) FROM enablement.feedback f
     WHERE f.user_id = p_user_id AND f.submitted_at BETWEEN p_from_date AND p_to_date),
    (SELECT ROUND(AVG(f.rating)::numeric, 1) FROM enablement.feedback f
     WHERE f.user_id = p_user_id AND f.submitted_at BETWEEN p_from_date AND p_to_date),
    (SELECT COUNT(*) FROM enablement.view_events v
     WHERE v.user_id = p_user_id AND v.viewed_at BETWEEN p_from_date AND p_to_date),
    (SELECT COUNT(DISTINCT v.viewer_id) FROM enablement.view_events v
     WHERE v.user_id = p_user_id AND v.viewed_at BETWEEN p_from_date AND p_to_date),
    (SELECT COUNT(*) FROM enablement.gaps g
     WHERE g.user_id = p_user_id AND g.resolved_at IS NULL),
    (SELECT COUNT(*) FROM enablement.gaps g
     WHERE g.user_id = p_user_id AND g.resolved_at IS NULL AND g.severity = 'high');
END;
$$;

-- ─── 9h. Get enablement feedback summary ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_enablement_feedback_summary(
  p_user_id UUID,
  p_days    INT DEFAULT 30
)
RETURNS TABLE (
  artifact_type TEXT,
  feedback_count BIGINT,
  avg_rating NUMERIC,
  top_useful_sections TEXT[],
  top_missing_items TEXT[]
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.artifact_type,
    COUNT(*)::BIGINT AS feedback_count,
    ROUND(AVG(f.rating)::numeric, 1) AS avg_rating,
    -- Get most-mentioned useful sections (flatten arrays, count, take top 5)
    ARRAY(
      SELECT us FROM (
        SELECT unnest(f2.useful_sections) AS us, COUNT(*) AS cnt
        FROM enablement.feedback f2
        WHERE f2.user_id = p_user_id
          AND f2.artifact_type = f.artifact_type
          AND f2.submitted_at > now() - (p_days || ' days')::interval
        GROUP BY us ORDER BY cnt DESC LIMIT 5
      ) sub
    ) AS top_useful_sections,
    ARRAY(
      SELECT mi FROM (
        SELECT unnest(f3.missing_items) AS mi, COUNT(*) AS cnt
        FROM enablement.feedback f3
        WHERE f3.user_id = p_user_id
          AND f3.artifact_type = f.artifact_type
          AND f3.submitted_at > now() - (p_days || ' days')::interval
        GROUP BY mi ORDER BY cnt DESC LIMIT 5
      ) sub2
    ) AS top_missing_items
  FROM enablement.feedback f
  WHERE f.user_id = p_user_id
    AND f.submitted_at > now() - (p_days || ' days')::interval
  GROUP BY f.artifact_type;
END;
$$;

-- ─── 9i. Get scorecards ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_enablement_scorecards(
  p_user_id UUID,
  p_limit   INT DEFAULT 12
)
RETURNS TABLE (
  id UUID,
  week_start DATE,
  week_end DATE,
  data JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.week_start, s.week_end, s.data, s.created_at
  FROM enablement.scorecards s
  WHERE s.user_id = p_user_id
  ORDER BY s.week_start DESC
  LIMIT p_limit;
END;
$$;

-- ─── 9j. Admin: global enablement stats ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_enablement_stats()
RETURNS TABLE (
  total_deliveries BIGINT,
  total_feedback BIGINT,
  total_views BIGINT,
  total_gaps BIGINT,
  open_gaps BIGINT,
  avg_global_rating NUMERIC,
  users_with_deliveries BIGINT,
  users_with_feedback BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM enablement.deliveries),
    (SELECT COUNT(*) FROM enablement.feedback),
    (SELECT COUNT(*) FROM enablement.view_events),
    (SELECT COUNT(*) FROM enablement.gaps),
    (SELECT COUNT(*) FROM enablement.gaps WHERE resolved_at IS NULL),
    (SELECT ROUND(AVG(rating)::numeric, 1) FROM enablement.feedback),
    (SELECT COUNT(DISTINCT user_id) FROM enablement.deliveries),
    (SELECT COUNT(DISTINCT user_id) FROM enablement.feedback);
END;
$$;
