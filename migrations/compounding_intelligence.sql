-- =============================================================================
-- Compounding Intelligence Architecture
-- Learning schema: signal velocity, source reliability, prediction calibration,
-- recommendation adoption, artifact edits, market severity baselines
-- =============================================================================

-- ── Schema ──────────────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS learning;
GRANT USAGE ON SCHEMA learning TO service_role, authenticated;

-- ── 1. Signal Velocity Baselines ────────────────────────────────────────────────
-- Tracks per-competitor signal frequency by type. After 8 weeks of data,
-- deviations from baseline boost/dampen severity via velocity_multiplier.
CREATE TABLE learning.signal_velocity_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  -- Rolling stats (recalculated weekly by calibration pipeline)
  weeks_tracked INT NOT NULL DEFAULT 0,
  avg_signals_per_week NUMERIC NOT NULL DEFAULT 0,
  stddev_signals_per_week NUMERIC NOT NULL DEFAULT 0,
  last_signal_at TIMESTAMPTZ,
  -- Calibration output
  velocity_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  -- Versioning for rollback
  calibration_version INT NOT NULL DEFAULT 1,
  previous_multiplier NUMERIC,
  calibrated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_id, signal_type)
);

CREATE INDEX idx_velocity_user ON learning.signal_velocity_baselines(user_id);
CREATE INDEX idx_velocity_company ON learning.signal_velocity_baselines(company_id);

-- ── 2. Source Reliability Scores ────────────────────────────────────────────────
-- Dynamic source quality that adjusts based on Judgment Loop outcomes.
-- Reliability is tracked per source per signal type per tenant.
CREATE TABLE learning.source_reliability_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_identifier TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  -- Reliability metrics
  total_signals INT NOT NULL DEFAULT 0,
  signals_in_correct_predictions INT NOT NULL DEFAULT 0,
  signals_in_incorrect_predictions INT NOT NULL DEFAULT 0,
  reliability_score NUMERIC NOT NULL DEFAULT 0.5,
  -- Thresholds
  is_calibrated BOOLEAN NOT NULL DEFAULT false,
  -- Versioning
  calibration_version INT NOT NULL DEFAULT 1,
  previous_score NUMERIC,
  calibrated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, source_identifier, signal_type)
);

CREATE INDEX idx_source_reliability_user ON learning.source_reliability_scores(user_id);

-- ── 3. Prediction-Signal Links ──────────────────────────────────────────────────
-- Junction table linking predictions to the signals that contributed to them.
-- Required for source reliability calibration (tracing outcomes back to sources).
CREATE TABLE learning.prediction_signal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES control_plane.predictions(id) ON DELETE CASCADE,
  signal_id UUID NOT NULL REFERENCES control_plane.signals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prediction_id, signal_id)
);

CREATE INDEX idx_pred_signal_prediction ON learning.prediction_signal_links(prediction_id);
CREATE INDEX idx_pred_signal_signal ON learning.prediction_signal_links(signal_id);

-- ── 4. Market Severity Baselines ────────────────────────────────────────────────
-- Per-tenant severity percentile distributions for market-relative scoring.
-- Activated after 50+ signals of a given type.
CREATE TABLE learning.market_severity_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  -- Distribution stats
  total_signals INT NOT NULL DEFAULT 0,
  severity_p25 NUMERIC,
  severity_p50 NUMERIC,
  severity_p75 NUMERIC,
  severity_p90 NUMERIC,
  -- Calibration output
  is_calibrated BOOLEAN NOT NULL DEFAULT false,
  calibration_version INT NOT NULL DEFAULT 1,
  calibrated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, signal_type)
);

CREATE INDEX idx_severity_user ON learning.market_severity_baselines(user_id);

-- ── 5. Recommendation Adoptions ─────────────────────────────────────────────────
-- Tracks whether users adopt, dismiss, or defer recommended actions from packets.
-- Outcome tracking columns populated in Phase 2 once adoption data accumulates.
CREATE TABLE learning.recommendation_adoptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  packet_id UUID NOT NULL REFERENCES control_plane.packets(id) ON DELETE CASCADE,
  -- What was recommended
  action_text TEXT NOT NULL,
  decision_type TEXT,
  owner_team TEXT,
  priority TEXT,
  -- Adoption tracking
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'adopted', 'dismissed', 'deferred')),
  adopted_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  dismiss_reason TEXT,
  -- Outcome tracking (Phase 2)
  outcome TEXT CHECK (outcome IN ('positive', 'neutral', 'negative')),
  outcome_notes TEXT,
  outcome_recorded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_adoptions_user ON learning.recommendation_adoptions(user_id);
CREATE INDEX idx_adoptions_packet ON learning.recommendation_adoptions(packet_id);
CREATE INDEX idx_adoptions_status ON learning.recommendation_adoptions(status);
CREATE INDEX idx_adoptions_decision_type ON learning.recommendation_adoptions(decision_type);

-- ── 6. Artifact Edits ───────────────────────────────────────────────────────────
-- Records every user edit to generated artifacts (battlecard talk tracks,
-- objection rebuttals, etc.) for tone/language calibration.
CREATE TABLE learning.artifact_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL
    CHECK (artifact_type IN (
      'battlecard_talk_track', 'battlecard_landmine',
      'objection_rebuttal', 'swipe_phrase'
    )),
  artifact_version_id UUID NOT NULL,
  -- What was edited
  section_key TEXT NOT NULL,
  original_content TEXT NOT NULL,
  edited_content TEXT NOT NULL,
  -- Metadata
  edit_type TEXT NOT NULL DEFAULT 'modify'
    CHECK (edit_type IN ('modify', 'delete', 'add')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artifact_edits_user ON learning.artifact_edits(user_id);
CREATE INDEX idx_artifact_edits_type ON learning.artifact_edits(artifact_type);
CREATE INDEX idx_artifact_edits_section ON learning.artifact_edits(artifact_type, section_key);

-- ── 7. Prediction Calibration ───────────────────────────────────────────────────
-- Per-competitor and per-signal-type prediction accuracy tracking.
-- Generates confidence_adjustment and predictability_score after 8+ predictions.
CREATE TABLE learning.prediction_calibration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Calibration dimensions
  company_id UUID,
  company_name TEXT,
  signal_type TEXT,
  -- Accuracy stats
  total_predictions INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  partial_count INT NOT NULL DEFAULT 0,
  incorrect_count INT NOT NULL DEFAULT 0,
  accuracy_rate NUMERIC NOT NULL DEFAULT 0,
  -- Calibration output
  confidence_adjustment NUMERIC NOT NULL DEFAULT 0,
  predictability_score NUMERIC,
  is_calibrated BOOLEAN NOT NULL DEFAULT false,
  -- Multi-signal correlation
  multi_signal_accuracy NUMERIC,
  single_signal_accuracy NUMERIC,
  -- Versioning
  calibration_version INT NOT NULL DEFAULT 1,
  calibrated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Functional unique index (COALESCE handles NULLs for company_id and signal_type)
CREATE UNIQUE INDEX idx_pred_calibration_unique
  ON learning.prediction_calibration(
    user_id,
    COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::UUID),
    COALESCE(signal_type, '__overall__')
  );

CREATE INDEX idx_pred_calibration_user ON learning.prediction_calibration(user_id);
CREATE INDEX idx_pred_calibration_company ON learning.prediction_calibration(company_id);

-- ── 8. Calibration Audit Log ────────────────────────────────────────────────────
-- Every calibration adjustment is logged for rollback and transparency.
CREATE TABLE learning.calibration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calibration_type TEXT NOT NULL,
  target_key TEXT NOT NULL,
  previous_value JSONB NOT NULL,
  new_value JSONB NOT NULL,
  data_points_used INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calibration_log_user ON learning.calibration_log(user_id);
CREATE INDEX idx_calibration_log_type ON learning.calibration_log(calibration_type, created_at DESC);

-- ── RLS Policies ────────────────────────────────────────────────────────────────
ALTER TABLE learning.signal_velocity_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning.source_reliability_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning.prediction_signal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning.market_severity_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning.recommendation_adoptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning.artifact_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning.prediction_calibration ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning.calibration_log ENABLE ROW LEVEL SECURITY;

-- signal_velocity_baselines
CREATE POLICY "Users read own velocity baselines"
  ON learning.signal_velocity_baselines FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on velocity baselines"
  ON learning.signal_velocity_baselines TO service_role
  USING (true) WITH CHECK (true);

-- source_reliability_scores
CREATE POLICY "Users read own source reliability"
  ON learning.source_reliability_scores FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on source reliability"
  ON learning.source_reliability_scores TO service_role
  USING (true) WITH CHECK (true);

-- prediction_signal_links (users can read links for their predictions)
CREATE POLICY "Users read own prediction signal links"
  ON learning.prediction_signal_links FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM control_plane.predictions p
    WHERE p.id = prediction_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "Service role full access on prediction signal links"
  ON learning.prediction_signal_links TO service_role
  USING (true) WITH CHECK (true);

-- market_severity_baselines
CREATE POLICY "Users read own severity baselines"
  ON learning.market_severity_baselines FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on severity baselines"
  ON learning.market_severity_baselines TO service_role
  USING (true) WITH CHECK (true);

-- recommendation_adoptions (users can read + write own)
CREATE POLICY "Users read own recommendation adoptions"
  ON learning.recommendation_adoptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own recommendation adoptions"
  ON learning.recommendation_adoptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own recommendation adoptions"
  ON learning.recommendation_adoptions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access on recommendation adoptions"
  ON learning.recommendation_adoptions TO service_role
  USING (true) WITH CHECK (true);

-- artifact_edits (users can read + insert own)
CREATE POLICY "Users read own artifact edits"
  ON learning.artifact_edits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own artifact edits"
  ON learning.artifact_edits FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access on artifact edits"
  ON learning.artifact_edits TO service_role
  USING (true) WITH CHECK (true);

-- prediction_calibration
CREATE POLICY "Users read own prediction calibration"
  ON learning.prediction_calibration FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on prediction calibration"
  ON learning.prediction_calibration TO service_role
  USING (true) WITH CHECK (true);

-- calibration_log
CREATE POLICY "Users read own calibration log"
  ON learning.calibration_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on calibration log"
  ON learning.calibration_log TO service_role
  USING (true) WITH CHECK (true);

-- ── Grants ──────────────────────────────────────────────────────────────────────
GRANT ALL ON ALL TABLES IN SCHEMA learning TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA learning TO authenticated;
GRANT INSERT, UPDATE ON learning.recommendation_adoptions TO authenticated;
GRANT INSERT ON learning.artifact_edits TO authenticated;

-- ── RPC: get_calibrated_signal_context ───────────────────────────────────────────
-- Called by the n8n scoring workflow before signal scoring. Returns all active
-- calibration data for a tenant, enabling calibration-aware scoring.
CREATE OR REPLACE FUNCTION learning.get_calibrated_signal_context(p_user_id UUID)
RETURNS TABLE(
  company_id UUID,
  company_name TEXT,
  signal_type TEXT,
  velocity_multiplier NUMERIC,
  source_reliability JSONB,
  severity_percentiles JSONB,
  prediction_confidence_adj NUMERIC,
  competitor_predictability NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = learning, control_plane, public
AS $$
BEGIN
  RETURN QUERY
  WITH velocity AS (
    SELECT
      v.company_id,
      v.company_name,
      v.signal_type,
      v.velocity_multiplier
    FROM learning.signal_velocity_baselines v
    WHERE v.user_id = p_user_id
      AND v.weeks_tracked >= 8
  ),
  reliability AS (
    SELECT
      sr.signal_type,
      jsonb_object_agg(sr.source_identifier, sr.reliability_score) AS scores
    FROM learning.source_reliability_scores sr
    WHERE sr.user_id = p_user_id
      AND sr.is_calibrated = true
    GROUP BY sr.signal_type
  ),
  severity AS (
    SELECT
      ms.signal_type,
      jsonb_build_object(
        'p25', ms.severity_p25,
        'p50', ms.severity_p50,
        'p75', ms.severity_p75,
        'p90', ms.severity_p90
      ) AS percentiles
    FROM learning.market_severity_baselines ms
    WHERE ms.user_id = p_user_id
      AND ms.is_calibrated = true
  ),
  pred_cal AS (
    SELECT
      pc.company_id,
      pc.signal_type,
      pc.confidence_adjustment,
      pc.predictability_score
    FROM learning.prediction_calibration pc
    WHERE pc.user_id = p_user_id
      AND pc.is_calibrated = true
  )
  SELECT
    COALESCE(v.company_id, pc.company_id) AS company_id,
    v.company_name,
    COALESCE(v.signal_type, pc.signal_type) AS signal_type,
    COALESCE(v.velocity_multiplier, 1.0) AS velocity_multiplier,
    r.scores AS source_reliability,
    s.percentiles AS severity_percentiles,
    COALESCE(pc.confidence_adjustment, 0) AS prediction_confidence_adj,
    pc.predictability_score AS competitor_predictability
  FROM velocity v
  FULL OUTER JOIN pred_cal pc
    ON v.company_id = pc.company_id
    AND v.signal_type = pc.signal_type
  LEFT JOIN reliability r
    ON COALESCE(v.signal_type, pc.signal_type) = r.signal_type
  LEFT JOIN severity s
    ON COALESCE(v.signal_type, pc.signal_type) = s.signal_type;
END;
$$;

-- ── RPC: record_recommendation_adoption ──────────────────────────────────────────
-- Called from frontend when user marks a recommendation as adopted/dismissed/deferred.
CREATE OR REPLACE FUNCTION learning.record_recommendation_adoption(
  p_user_id UUID,
  p_packet_id UUID,
  p_action_text TEXT,
  p_status TEXT,
  p_decision_type TEXT DEFAULT NULL,
  p_owner_team TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT NULL,
  p_dismiss_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = learning
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Upsert: if same action_text + packet_id exists, update status
  INSERT INTO learning.recommendation_adoptions (
    user_id, packet_id, action_text, decision_type, owner_team, priority,
    status, adopted_at, dismissed_at, dismiss_reason
  )
  VALUES (
    p_user_id, p_packet_id, p_action_text, p_decision_type, p_owner_team, p_priority,
    p_status,
    CASE WHEN p_status = 'adopted' THEN NOW() ELSE NULL END,
    CASE WHEN p_status = 'dismissed' THEN NOW() ELSE NULL END,
    CASE WHEN p_status = 'dismissed' THEN p_dismiss_reason ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO v_id;

  -- If no insert (duplicate), update existing
  IF v_id IS NULL THEN
    UPDATE learning.recommendation_adoptions
    SET
      status = p_status,
      adopted_at = CASE WHEN p_status = 'adopted' THEN NOW() ELSE adopted_at END,
      dismissed_at = CASE WHEN p_status = 'dismissed' THEN NOW() ELSE dismissed_at END,
      dismiss_reason = CASE WHEN p_status = 'dismissed' THEN p_dismiss_reason ELSE dismiss_reason END,
      updated_at = NOW()
    WHERE user_id = p_user_id
      AND packet_id = p_packet_id
      AND action_text = p_action_text
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$;

-- ── RPC: record_artifact_edit ────────────────────────────────────────────────────
-- Called from frontend when user edits a battlecard talk track or objection rebuttal.
CREATE OR REPLACE FUNCTION learning.record_artifact_edit(
  p_user_id UUID,
  p_artifact_type TEXT,
  p_artifact_version_id UUID,
  p_section_key TEXT,
  p_original_content TEXT,
  p_edited_content TEXT,
  p_edit_type TEXT DEFAULT 'modify'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = learning
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO learning.artifact_edits (
    user_id, artifact_type, artifact_version_id,
    section_key, original_content, edited_content, edit_type
  )
  VALUES (
    p_user_id, p_artifact_type, p_artifact_version_id,
    p_section_key, p_original_content, p_edited_content, p_edit_type
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ── RPC: get_compounding_metrics ─────────────────────────────────────────────────
-- Dashboard RPC returning compounding health metrics for the frontend.
CREATE OR REPLACE FUNCTION learning.get_compounding_metrics(p_user_id UUID)
RETURNS TABLE(
  weeks_of_data INT,
  velocity_baselines_active INT,
  source_calibrations_active INT,
  prediction_accuracy_trend NUMERIC[],
  recommendations_adopted INT,
  recommendations_total INT,
  recommendations_with_outcomes INT,
  artifact_edits_total INT,
  calibration_adjustments_total INT,
  compounding_score NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = learning, control_plane
AS $$
DECLARE
  v_weeks INT;
  v_velocity INT;
  v_sources INT;
  v_accuracy_trend NUMERIC[];
  v_adopted INT;
  v_total_recs INT;
  v_with_outcomes INT;
  v_edits INT;
  v_adjustments INT;
  v_score NUMERIC;
BEGIN
  -- Weeks of signal data
  SELECT COALESCE(
    EXTRACT(EPOCH FROM (NOW() - MIN(s.created_at))) / (86400 * 7),
    0
  )::INT INTO v_weeks
  FROM control_plane.signals s
  JOIN control_plane.packets p ON p.id = s.packet_id
  WHERE p.user_id = p_user_id;

  -- Active velocity baselines (weeks_tracked >= 8)
  SELECT COUNT(*)::INT INTO v_velocity
  FROM learning.signal_velocity_baselines
  WHERE user_id = p_user_id AND weeks_tracked >= 8;

  -- Active source calibrations
  SELECT COUNT(*)::INT INTO v_sources
  FROM learning.source_reliability_scores
  WHERE user_id = p_user_id AND is_calibrated = true;

  -- Prediction accuracy trend (last 8 weeks, per-week accuracy)
  SELECT COALESCE(
    ARRAY_AGG(week_acc ORDER BY week_num),
    ARRAY[]::NUMERIC[]
  ) INTO v_accuracy_trend
  FROM (
    SELECT
      FLOOR(EXTRACT(EPOCH FROM (NOW() - po.scored_at)) / (86400 * 7)) AS week_num,
      ROUND(
        100.0 * SUM(CASE WHEN po.outcome = 'correct' THEN 1 ELSE 0 END)::NUMERIC
        / NULLIF(COUNT(*), 0),
        1
      ) AS week_acc
    FROM control_plane.prediction_outcomes po
    JOIN control_plane.predictions pr ON pr.id = po.prediction_id
    WHERE pr.user_id = p_user_id
      AND po.scored_at > NOW() - INTERVAL '8 weeks'
    GROUP BY FLOOR(EXTRACT(EPOCH FROM (NOW() - po.scored_at)) / (86400 * 7))
  ) sub;

  -- Recommendation adoption stats
  SELECT
    COUNT(*) FILTER (WHERE status = 'adopted')::INT,
    COUNT(*)::INT,
    COUNT(*) FILTER (WHERE outcome IS NOT NULL)::INT
  INTO v_adopted, v_total_recs, v_with_outcomes
  FROM learning.recommendation_adoptions
  WHERE user_id = p_user_id;

  -- Artifact edits total
  SELECT COUNT(*)::INT INTO v_edits
  FROM learning.artifact_edits
  WHERE user_id = p_user_id;

  -- Calibration adjustments total
  SELECT COUNT(*)::INT INTO v_adjustments
  FROM learning.calibration_log
  WHERE user_id = p_user_id;

  -- Compounding score (0-100 composite)
  -- Weighted: data age (20%), velocity calibrations (20%), source calibrations (15%),
  --   prediction accuracy (20%), adoption rate (15%), artifact edits (10%)
  v_score := LEAST(100, ROUND(
    -- Data age: max 20 pts at 20+ weeks
    LEAST(20, (v_weeks::NUMERIC / 20) * 20)
    -- Velocity baselines: max 20 pts at 10+ baselines
    + LEAST(20, (v_velocity::NUMERIC / 10) * 20)
    -- Source calibrations: max 15 pts at 5+ calibrated
    + LEAST(15, (v_sources::NUMERIC / 5) * 15)
    -- Prediction accuracy: based on latest week (if available)
    + CASE
        WHEN array_length(v_accuracy_trend, 1) > 0
        THEN LEAST(20, v_accuracy_trend[array_length(v_accuracy_trend, 1)] * 0.2)
        ELSE 0
      END
    -- Adoption rate: max 15 pts at 50%+ adoption
    + CASE
        WHEN v_total_recs > 0
        THEN LEAST(15, (v_adopted::NUMERIC / v_total_recs) * 30)
        ELSE 0
      END
    -- Artifact edits: max 10 pts at 20+ edits
    + LEAST(10, (v_edits::NUMERIC / 20) * 10)
  , 1));

  RETURN QUERY SELECT
    v_weeks, v_velocity, v_sources, v_accuracy_trend,
    v_adopted, v_total_recs, v_with_outcomes,
    v_edits, v_adjustments, v_score;
END;
$$;

-- ── Grant execute on learning schema RPCs ─────────────────────────────────────────
GRANT EXECUTE ON FUNCTION learning.get_calibrated_signal_context(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION learning.record_recommendation_adoption(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION learning.record_artifact_edit(UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION learning.get_compounding_metrics(UUID) TO authenticated, service_role;

-- ── Public schema wrappers (PostgREST only exposes public by default) ────────────

CREATE OR REPLACE FUNCTION public.get_compounding_metrics(p_user_id UUID)
RETURNS TABLE(
  weeks_of_data INT, velocity_baselines_active INT, source_calibrations_active INT,
  prediction_accuracy_trend NUMERIC[], recommendations_adopted INT,
  recommendations_total INT, recommendations_with_outcomes INT,
  artifact_edits_total INT, calibration_adjustments_total INT, compounding_score NUMERIC
)
LANGUAGE sql SECURITY DEFINER SET search_path = public, learning
AS $$ SELECT * FROM learning.get_compounding_metrics(p_user_id); $$;

CREATE OR REPLACE FUNCTION public.get_calibrated_signal_context(p_user_id UUID)
RETURNS TABLE(
  company_id UUID, company_name TEXT, signal_type TEXT, velocity_multiplier NUMERIC,
  source_reliability JSONB, severity_percentiles JSONB,
  prediction_confidence_adj NUMERIC, competitor_predictability NUMERIC
)
LANGUAGE sql SECURITY DEFINER SET search_path = public, learning
AS $$ SELECT * FROM learning.get_calibrated_signal_context(p_user_id); $$;

CREATE OR REPLACE FUNCTION public.record_recommendation_adoption(
  p_user_id UUID, p_packet_id UUID, p_action_text TEXT, p_status TEXT,
  p_decision_type TEXT DEFAULT NULL, p_owner_team TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT NULL, p_dismiss_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE sql SECURITY DEFINER SET search_path = public, learning
AS $$ SELECT learning.record_recommendation_adoption(
  p_user_id, p_packet_id, p_action_text, p_status,
  p_decision_type, p_owner_team, p_priority, p_dismiss_reason); $$;

CREATE OR REPLACE FUNCTION public.record_artifact_edit(
  p_user_id UUID, p_artifact_type TEXT, p_artifact_version_id UUID,
  p_section_key TEXT, p_original_content TEXT, p_edited_content TEXT,
  p_edit_type TEXT DEFAULT 'modify'
)
RETURNS UUID
LANGUAGE sql SECURITY DEFINER SET search_path = public, learning
AS $$ SELECT learning.record_artifact_edit(
  p_user_id, p_artifact_type, p_artifact_version_id,
  p_section_key, p_original_content, p_edited_content, p_edit_type); $$;

CREATE OR REPLACE FUNCTION public.get_recommendation_adoptions(p_user_id UUID, p_packet_id UUID)
RETURNS TABLE(
  id UUID, user_id UUID, packet_id UUID, action_text TEXT, decision_type TEXT,
  owner_team TEXT, priority TEXT, status TEXT, adopted_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ, dismiss_reason TEXT, outcome TEXT,
  outcome_notes TEXT, outcome_recorded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER SET search_path = public, learning
AS $$ SELECT ra.id, ra.user_id, ra.packet_id, ra.action_text, ra.decision_type,
  ra.owner_team, ra.priority, ra.status, ra.adopted_at, ra.dismissed_at,
  ra.dismiss_reason, ra.outcome, ra.outcome_notes, ra.outcome_recorded_at,
  ra.created_at, ra.updated_at
FROM learning.recommendation_adoptions ra
WHERE ra.user_id = p_user_id AND ra.packet_id = p_packet_id
ORDER BY ra.created_at; $$;

GRANT EXECUTE ON FUNCTION public.get_compounding_metrics(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_calibrated_signal_context(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_recommendation_adoption(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_artifact_edit(UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_recommendation_adoptions(UUID, UUID) TO authenticated, service_role;
