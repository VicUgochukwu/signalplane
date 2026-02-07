-- Phase 3.2: Launch Decay Analyzer
-- Tracks post-launch momentum and messaging drift over time

CREATE SCHEMA IF NOT EXISTS launch_tracker;

-- Launch events (anchor points)
CREATE TABLE IF NOT EXISTS launch_tracker.launches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,

  -- Launch metadata
  launch_date DATE NOT NULL,
  launch_type TEXT NOT NULL, -- 'product', 'feature', 'pricing', 'rebrand', 'funding'
  launch_title TEXT NOT NULL,
  announcement_url TEXT,

  -- Initial state capture
  initial_messaging JSONB, -- homepage snapshot at T0
  initial_pricing JSONB, -- pricing snapshot at T0

  -- Tracking state
  tracking_status TEXT DEFAULT 'active', -- 'active', 'decayed', 'reframed', 'completed'
  weeks_tracked INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_launches_company
  ON launch_tracker.launches(company_id, launch_date DESC);
CREATE INDEX IF NOT EXISTS idx_launches_status
  ON launch_tracker.launches(tracking_status) WHERE tracking_status = 'active';
CREATE INDEX IF NOT EXISTS idx_launches_type
  ON launch_tracker.launches(launch_type);

-- Decay observations (weekly checks post-launch)
CREATE TABLE IF NOT EXISTS launch_tracker.decay_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id UUID NOT NULL REFERENCES launch_tracker.launches(id),
  observation_date DATE NOT NULL,
  weeks_since_launch INT NOT NULL,

  -- Measurements
  messaging_drift_score NUMERIC, -- 0-1, vs initial
  homepage_change_count INT,
  pricing_change_count INT,

  -- Classification
  decay_signal TEXT, -- 'momentum', 'plateau', 'decay', 'reframe', 'abandoned'
  decay_details JSONB,

  -- Signal emission
  signal_emitted BOOLEAN DEFAULT FALSE,
  signal_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(launch_id, observation_date)
);

CREATE INDEX IF NOT EXISTS idx_decay_observations_launch
  ON launch_tracker.decay_observations(launch_id, observation_date DESC);
CREATE INDEX IF NOT EXISTS idx_decay_observations_signal
  ON launch_tracker.decay_observations(decay_signal);

-- Function to create launch from horizon signal
CREATE OR REPLACE FUNCTION launch_tracker.create_from_horizon_signal(p_signal_id UUID)
RETURNS UUID AS $$
DECLARE
  v_signal RECORD;
  v_launch_id UUID;
  v_launch_type TEXT;
BEGIN
  SELECT * INTO v_signal FROM control_plane.signals WHERE id = p_signal_id;

  -- Only process horizon signals about launches
  IF v_signal.signal_type != 'horizon' THEN
    RETURN NULL;
  END IF;

  -- Determine launch type from signal content
  v_launch_type := COALESCE(
    v_signal.meta->>'launch_type',
    CASE
      WHEN LOWER(v_signal.title) LIKE '%funding%' OR LOWER(v_signal.title) LIKE '%raise%' THEN 'funding'
      WHEN LOWER(v_signal.title) LIKE '%pricing%' THEN 'pricing'
      WHEN LOWER(v_signal.title) LIKE '%rebrand%' OR LOWER(v_signal.title) LIKE '%rename%' THEN 'rebrand'
      WHEN LOWER(v_signal.title) LIKE '%feature%' OR LOWER(v_signal.title) LIKE '%update%' THEN 'feature'
      ELSE 'product'
    END
  );

  INSERT INTO launch_tracker.launches (
    id, company_id, launch_date, launch_type, launch_title, announcement_url
  ) VALUES (
    gen_random_uuid(),
    v_signal.company_id,
    v_signal.created_at::DATE,
    v_launch_type,
    v_signal.title,
    v_signal.evidence_urls[1]
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_launch_id;

  RETURN v_launch_id;
END;
$$ LANGUAGE plpgsql;

-- Function to capture initial state for a launch
CREATE OR REPLACE FUNCTION launch_tracker.capture_initial_state(p_launch_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_launch RECORD;
  v_messaging JSONB;
  v_pricing JSONB;
BEGIN
  SELECT * INTO v_launch FROM launch_tracker.launches WHERE id = p_launch_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Get latest homepage snapshot
  SELECT jsonb_build_object(
    'snapshot_id', ps.id,
    'content_hash', ps.content_hash,
    'captured_at', ps.created_at,
    'h1_text', pf.h1_text,
    'cta_labels', pf.cta_labels
  ) INTO v_messaging
  FROM public.page_snapshots ps
  LEFT JOIN public.page_features pf ON pf.snapshot_id = ps.id
  JOIN public.tracked_pages tp ON tp.id = ps.tracked_page_id
  WHERE tp.company_id = v_launch.company_id
    AND (tp.page_type = 'homepage' OR tp.url NOT LIKE '%/%/%')
  ORDER BY ps.created_at DESC
  LIMIT 1;

  -- Get latest pricing snapshot
  SELECT jsonb_build_object(
    'snapshot_id', ps.id,
    'content_hash', ps.content_hash,
    'captured_at', ps.created_at,
    'plan_count', pf.plan_count,
    'has_free_tier', pf.has_free_tier,
    'pricing_model', pf.pricing_model
  ) INTO v_pricing
  FROM public.page_snapshots ps
  LEFT JOIN public.page_features pf ON pf.snapshot_id = ps.id
  JOIN public.tracked_pages tp ON tp.id = ps.tracked_page_id
  WHERE tp.company_id = v_launch.company_id
    AND tp.page_type = 'pricing'
  ORDER BY ps.created_at DESC
  LIMIT 1;

  UPDATE launch_tracker.launches
  SET initial_messaging = v_messaging,
      initial_pricing = v_pricing
  WHERE id = p_launch_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to record decay observation
CREATE OR REPLACE FUNCTION launch_tracker.record_observation(
  p_launch_id UUID,
  p_messaging_drift_score NUMERIC,
  p_homepage_change_count INT,
  p_pricing_change_count INT
) RETURNS UUID AS $$
DECLARE
  v_launch RECORD;
  v_observation_id UUID;
  v_weeks_since INT;
  v_decay_signal TEXT;
BEGIN
  SELECT * INTO v_launch FROM launch_tracker.launches WHERE id = p_launch_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Calculate weeks since launch
  v_weeks_since := EXTRACT(DAYS FROM (CURRENT_DATE - v_launch.launch_date)) / 7;

  -- Determine decay signal based on metrics
  v_decay_signal := CASE
    WHEN p_messaging_drift_score < 0.1 AND p_homepage_change_count = 0 THEN 'momentum'
    WHEN p_messaging_drift_score < 0.3 AND p_homepage_change_count <= 1 THEN 'plateau'
    WHEN p_messaging_drift_score >= 0.6 OR p_homepage_change_count >= 3 THEN 'reframe'
    WHEN p_messaging_drift_score >= 0.4 THEN 'decay'
    WHEN v_weeks_since > 8 AND p_homepage_change_count = 0 THEN 'abandoned'
    ELSE 'plateau'
  END;

  INSERT INTO launch_tracker.decay_observations (
    launch_id, observation_date, weeks_since_launch,
    messaging_drift_score, homepage_change_count, pricing_change_count,
    decay_signal, decay_details
  ) VALUES (
    p_launch_id, CURRENT_DATE, v_weeks_since,
    p_messaging_drift_score, p_homepage_change_count, p_pricing_change_count,
    v_decay_signal,
    jsonb_build_object(
      'launch_title', v_launch.launch_title,
      'launch_type', v_launch.launch_type,
      'tracking_weeks', v_weeks_since
    )
  )
  ON CONFLICT (launch_id, observation_date) DO UPDATE SET
    messaging_drift_score = EXCLUDED.messaging_drift_score,
    homepage_change_count = EXCLUDED.homepage_change_count,
    pricing_change_count = EXCLUDED.pricing_change_count,
    decay_signal = EXCLUDED.decay_signal,
    decay_details = EXCLUDED.decay_details
  RETURNING id INTO v_observation_id;

  -- Update weeks tracked on launch
  UPDATE launch_tracker.launches
  SET weeks_tracked = v_weeks_since
  WHERE id = p_launch_id;

  -- Update tracking status if needed
  IF v_decay_signal = 'abandoned' OR v_weeks_since >= 12 THEN
    UPDATE launch_tracker.launches
    SET tracking_status = CASE
      WHEN v_decay_signal = 'abandoned' THEN 'decayed'
      WHEN v_decay_signal = 'reframe' THEN 'reframed'
      ELSE 'completed'
    END
    WHERE id = p_launch_id;
  END IF;

  RETURN v_observation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to emit decay signal to Control Plane
CREATE OR REPLACE FUNCTION launch_tracker.emit_signal(p_observation_id UUID)
RETURNS UUID AS $$
DECLARE
  v_observation RECORD;
  v_launch RECORD;
  v_signal_id UUID;
  v_title TEXT;
  v_severity INT;
  v_summary TEXT;
BEGIN
  SELECT * INTO v_observation
  FROM launch_tracker.decay_observations
  WHERE id = p_observation_id;

  SELECT * INTO v_launch
  FROM launch_tracker.launches
  WHERE id = v_observation.launch_id;

  -- Only emit for significant decay signals
  IF v_observation.decay_signal NOT IN ('decay', 'reframe', 'abandoned') THEN
    RETURN NULL;
  END IF;

  v_title := CASE v_observation.decay_signal
    WHEN 'decay' THEN 'Launch momentum fading: ' || v_launch.launch_title
    WHEN 'reframe' THEN 'Launch messaging pivoted: ' || v_launch.launch_title
    WHEN 'abandoned' THEN 'Launch appears abandoned: ' || v_launch.launch_title
    ELSE 'Launch tracking update'
  END;

  v_severity := CASE v_observation.decay_signal
    WHEN 'abandoned' THEN 2
    WHEN 'decay' THEN 3
    WHEN 'reframe' THEN 4
    ELSE 2
  END;

  v_summary := 'After ' || v_observation.weeks_since_launch || ' weeks, ' ||
    CASE v_observation.decay_signal
      WHEN 'decay' THEN 'messaging has drifted significantly from initial launch positioning'
      WHEN 'reframe' THEN 'messaging has been substantially reframed, suggesting strategic pivot'
      WHEN 'abandoned' THEN 'launch appears abandoned with no messaging updates'
      ELSE 'launch tracking continues'
    END;

  INSERT INTO control_plane.signals (
    id, signal_type, company_id, severity, confidence,
    title, summary, evidence_urls,
    source_schema, source_table, source_id,
    decision_type, time_sensitivity,
    meta, created_at
  ) VALUES (
    gen_random_uuid(),
    'launch_decay',
    v_launch.company_id,
    v_severity,
    0.85,
    v_title,
    v_summary,
    ARRAY[COALESCE(v_launch.announcement_url, '')]::TEXT[],
    'launch_tracker', 'decay_observations', v_observation.id,
    'positioning',
    CASE v_observation.decay_signal WHEN 'reframe' THEN 'this_week' ELSE 'monitor' END,
    jsonb_build_object(
      'launch_id', v_launch.id,
      'launch_type', v_launch.launch_type,
      'weeks_tracked', v_observation.weeks_since_launch,
      'drift_score', v_observation.messaging_drift_score,
      'decay_signal', v_observation.decay_signal
    ),
    NOW()
  )
  RETURNING id INTO v_signal_id;

  UPDATE launch_tracker.decay_observations
  SET signal_emitted = true, signal_id = v_signal_id
  WHERE id = p_observation_id;

  RETURN v_signal_id;
END;
$$ LANGUAGE plpgsql;

-- View for active launches needing observation
CREATE OR REPLACE VIEW launch_tracker.active_launches_needing_observation AS
SELECT
  l.id,
  l.company_id,
  l.launch_date,
  l.launch_type,
  l.launch_title,
  l.weeks_tracked,
  EXTRACT(DAYS FROM (CURRENT_DATE - l.launch_date)) / 7 AS current_weeks,
  (
    SELECT MAX(observation_date)
    FROM launch_tracker.decay_observations
    WHERE launch_id = l.id
  ) AS last_observation
FROM launch_tracker.launches l
WHERE l.tracking_status = 'active'
  AND (
    -- No observation yet, or last observation was > 7 days ago
    NOT EXISTS (
      SELECT 1 FROM launch_tracker.decay_observations
      WHERE launch_id = l.id
    )
    OR (
      SELECT MAX(observation_date) FROM launch_tracker.decay_observations
      WHERE launch_id = l.id
    ) < CURRENT_DATE - INTERVAL '7 days'
  );

