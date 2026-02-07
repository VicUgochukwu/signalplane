-- Phase 2.1: Pricing Drift Monitor
-- Tracks pricing page changes and emits signals to Control Plane

CREATE SCHEMA IF NOT EXISTS pricing_tracker;

-- Pricing snapshots (enriched from page_features)
CREATE TABLE IF NOT EXISTS pricing_tracker.pricing_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  tracked_page_id UUID,
  snapshot_date DATE NOT NULL,

  -- From feature extractor
  plan_count INT,
  plan_names TEXT[],
  has_free_tier BOOLEAN,
  has_enterprise BOOLEAN,
  trial_days INT,
  pricing_model TEXT, -- 'seat', 'usage', 'flat', 'hybrid', 'unknown'
  gating_signals TEXT[], -- 'sso', 'audit_logs', 'sla', 'dedicated'
  limits JSONB,

  -- Raw backup
  page_features_id UUID,
  content_hash TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_pricing_snapshots_company
  ON pricing_tracker.pricing_snapshots(company_id, snapshot_date DESC);

-- Pricing changes (computed when diff is detected)
CREATE TABLE IF NOT EXISTS pricing_tracker.pricing_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  old_snapshot_id UUID REFERENCES pricing_tracker.pricing_snapshots(id),
  new_snapshot_id UUID REFERENCES pricing_tracker.pricing_snapshots(id),
  detected_at DATE NOT NULL,

  -- Change classification
  change_type TEXT NOT NULL, -- 'plan_added', 'plan_removed', 'model_change', 'gating_change', 'limit_change', 'trial_change', 'free_tier_change', 'enterprise_change'
  change_details JSONB NOT NULL,
  significance TEXT NOT NULL, -- 'major', 'minor'

  -- LLM interpretation (if called)
  interpretation TEXT,
  strategic_signal TEXT, -- 'enterprise_push', 'plg_pivot', 'value_metric_shift', 'friction_reduction'
  confidence NUMERIC,

  -- Signal emission
  signal_emitted BOOLEAN DEFAULT FALSE,
  signal_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_changes_company
  ON pricing_tracker.pricing_changes(company_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_changes_type
  ON pricing_tracker.pricing_changes(change_type);

-- Function to upsert pricing snapshot
CREATE OR REPLACE FUNCTION pricing_tracker.upsert_snapshot(
  p_company_id UUID,
  p_tracked_page_id UUID,
  p_plan_count INT,
  p_plan_names TEXT[],
  p_has_free_tier BOOLEAN,
  p_has_enterprise BOOLEAN,
  p_trial_days INT,
  p_pricing_model TEXT,
  p_gating_signals TEXT[],
  p_limits JSONB,
  p_page_features_id UUID DEFAULT NULL,
  p_content_hash TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_snapshot_id UUID;
  v_today DATE := CURRENT_DATE;
BEGIN
  INSERT INTO pricing_tracker.pricing_snapshots (
    company_id, tracked_page_id, snapshot_date,
    plan_count, plan_names, has_free_tier, has_enterprise,
    trial_days, pricing_model, gating_signals, limits,
    page_features_id, content_hash
  ) VALUES (
    p_company_id, p_tracked_page_id, v_today,
    p_plan_count, p_plan_names, p_has_free_tier, p_has_enterprise,
    p_trial_days, p_pricing_model, p_gating_signals, p_limits,
    p_page_features_id, p_content_hash
  )
  ON CONFLICT (company_id, snapshot_date) DO UPDATE SET
    plan_count = EXCLUDED.plan_count,
    plan_names = EXCLUDED.plan_names,
    has_free_tier = EXCLUDED.has_free_tier,
    has_enterprise = EXCLUDED.has_enterprise,
    trial_days = EXCLUDED.trial_days,
    pricing_model = EXCLUDED.pricing_model,
    gating_signals = EXCLUDED.gating_signals,
    limits = EXCLUDED.limits,
    page_features_id = EXCLUDED.page_features_id,
    content_hash = EXCLUDED.content_hash
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- Function to detect and record pricing changes
CREATE OR REPLACE FUNCTION pricing_tracker.detect_changes(
  p_company_id UUID,
  p_new_snapshot_id UUID
) RETURNS SETOF pricing_tracker.pricing_changes AS $$
DECLARE
  v_old_snapshot RECORD;
  v_new_snapshot RECORD;
  v_change_id UUID;
BEGIN
  -- Get new snapshot
  SELECT * INTO v_new_snapshot
  FROM pricing_tracker.pricing_snapshots
  WHERE id = p_new_snapshot_id;

  -- Get previous snapshot (before today)
  SELECT * INTO v_old_snapshot
  FROM pricing_tracker.pricing_snapshots
  WHERE company_id = p_company_id
    AND snapshot_date < v_new_snapshot.snapshot_date
  ORDER BY snapshot_date DESC
  LIMIT 1;

  IF NOT FOUND THEN
    -- First snapshot, no changes to detect
    RETURN;
  END IF;

  -- Check for plan count change
  IF v_old_snapshot.plan_count != v_new_snapshot.plan_count THEN
    INSERT INTO pricing_tracker.pricing_changes (
      company_id, old_snapshot_id, new_snapshot_id, detected_at,
      change_type, change_details, significance
    ) VALUES (
      p_company_id, v_old_snapshot.id, p_new_snapshot_id, CURRENT_DATE,
      CASE WHEN v_new_snapshot.plan_count > v_old_snapshot.plan_count THEN 'plan_added' ELSE 'plan_removed' END,
      jsonb_build_object('old_count', v_old_snapshot.plan_count, 'new_count', v_new_snapshot.plan_count),
      'major'
    ) RETURNING * INTO v_change_id;
    RETURN NEXT (SELECT * FROM pricing_tracker.pricing_changes WHERE id = v_change_id);
  END IF;

  -- Check for pricing model change
  IF v_old_snapshot.pricing_model != v_new_snapshot.pricing_model THEN
    INSERT INTO pricing_tracker.pricing_changes (
      company_id, old_snapshot_id, new_snapshot_id, detected_at,
      change_type, change_details, significance
    ) VALUES (
      p_company_id, v_old_snapshot.id, p_new_snapshot_id, CURRENT_DATE,
      'model_change',
      jsonb_build_object('old_model', v_old_snapshot.pricing_model, 'new_model', v_new_snapshot.pricing_model),
      'major'
    ) RETURNING * INTO v_change_id;
    RETURN NEXT (SELECT * FROM pricing_tracker.pricing_changes WHERE id = v_change_id);
  END IF;

  -- Check for free tier change
  IF v_old_snapshot.has_free_tier != v_new_snapshot.has_free_tier THEN
    INSERT INTO pricing_tracker.pricing_changes (
      company_id, old_snapshot_id, new_snapshot_id, detected_at,
      change_type, change_details, significance
    ) VALUES (
      p_company_id, v_old_snapshot.id, p_new_snapshot_id, CURRENT_DATE,
      'free_tier_change',
      jsonb_build_object('old_value', v_old_snapshot.has_free_tier, 'new_value', v_new_snapshot.has_free_tier),
      'major'
    ) RETURNING * INTO v_change_id;
    RETURN NEXT (SELECT * FROM pricing_tracker.pricing_changes WHERE id = v_change_id);
  END IF;

  -- Check for enterprise tier change
  IF v_old_snapshot.has_enterprise != v_new_snapshot.has_enterprise THEN
    INSERT INTO pricing_tracker.pricing_changes (
      company_id, old_snapshot_id, new_snapshot_id, detected_at,
      change_type, change_details, significance
    ) VALUES (
      p_company_id, v_old_snapshot.id, p_new_snapshot_id, CURRENT_DATE,
      'enterprise_change',
      jsonb_build_object('old_value', v_old_snapshot.has_enterprise, 'new_value', v_new_snapshot.has_enterprise),
      'major'
    ) RETURNING * INTO v_change_id;
    RETURN NEXT (SELECT * FROM pricing_tracker.pricing_changes WHERE id = v_change_id);
  END IF;

  -- Check for trial days change
  IF COALESCE(v_old_snapshot.trial_days, 0) != COALESCE(v_new_snapshot.trial_days, 0) THEN
    INSERT INTO pricing_tracker.pricing_changes (
      company_id, old_snapshot_id, new_snapshot_id, detected_at,
      change_type, change_details, significance
    ) VALUES (
      p_company_id, v_old_snapshot.id, p_new_snapshot_id, CURRENT_DATE,
      'trial_change',
      jsonb_build_object('old_days', v_old_snapshot.trial_days, 'new_days', v_new_snapshot.trial_days),
      'minor'
    ) RETURNING * INTO v_change_id;
    RETURN NEXT (SELECT * FROM pricing_tracker.pricing_changes WHERE id = v_change_id);
  END IF;

  -- Check for gating signals change
  IF v_old_snapshot.gating_signals != v_new_snapshot.gating_signals THEN
    INSERT INTO pricing_tracker.pricing_changes (
      company_id, old_snapshot_id, new_snapshot_id, detected_at,
      change_type, change_details, significance
    ) VALUES (
      p_company_id, v_old_snapshot.id, p_new_snapshot_id, CURRENT_DATE,
      'gating_change',
      jsonb_build_object('old_signals', v_old_snapshot.gating_signals, 'new_signals', v_new_snapshot.gating_signals),
      'minor'
    ) RETURNING * INTO v_change_id;
    RETURN NEXT (SELECT * FROM pricing_tracker.pricing_changes WHERE id = v_change_id);
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to emit pricing signal to Control Plane
CREATE OR REPLACE FUNCTION pricing_tracker.emit_signal(p_change_id UUID)
RETURNS UUID AS $$
DECLARE
  v_change RECORD;
  v_signal_id UUID;
  v_title TEXT;
  v_summary TEXT;
BEGIN
  SELECT pc.*, ps.plan_names, ps.pricing_model as new_model
  INTO v_change
  FROM pricing_tracker.pricing_changes pc
  JOIN pricing_tracker.pricing_snapshots ps ON ps.id = pc.new_snapshot_id
  WHERE pc.id = p_change_id;

  -- Build title based on change type
  v_title := CASE v_change.change_type
    WHEN 'plan_added' THEN 'New pricing tier added'
    WHEN 'plan_removed' THEN 'Pricing tier removed'
    WHEN 'model_change' THEN 'Pricing model changed to ' || v_change.new_model
    WHEN 'free_tier_change' THEN CASE WHEN (v_change.change_details->>'new_value')::boolean THEN 'Free tier introduced' ELSE 'Free tier removed' END
    WHEN 'enterprise_change' THEN CASE WHEN (v_change.change_details->>'new_value')::boolean THEN 'Enterprise tier added' ELSE 'Enterprise tier removed' END
    WHEN 'trial_change' THEN 'Trial period changed'
    WHEN 'gating_change' THEN 'Feature gating updated'
    ELSE 'Pricing update detected'
  END;

  v_summary := COALESCE(v_change.interpretation, 'Pricing change detected: ' || v_change.change_type);

  INSERT INTO control_plane.signals (
    id, signal_type, company_id, severity, confidence,
    title, summary, evidence_urls,
    source_schema, source_table, source_id,
    decision_type, recommended_asset, time_sensitivity,
    meta, created_at
  ) VALUES (
    gen_random_uuid(),
    'pricing',
    v_change.company_id,
    CASE v_change.significance WHEN 'major' THEN 4 ELSE 2 END,
    COALESCE(v_change.confidence, 0.8),
    v_title,
    v_summary,
    ARRAY[]::TEXT[],
    'pricing_tracker', 'pricing_changes', v_change.id,
    'packaging',
    'pricing',
    CASE v_change.significance WHEN 'major' THEN 'this_week' ELSE 'monitor' END,
    v_change.change_details,
    NOW()
  )
  RETURNING id INTO v_signal_id;

  UPDATE pricing_tracker.pricing_changes
  SET signal_emitted = true, signal_id = v_signal_id
  WHERE id = p_change_id;

  RETURN v_signal_id;
END;
$$ LANGUAGE plpgsql;
