-- Phase 2.2: Proof and Trust Monitor
-- Tracks social proof, compliance badges, and trust signals

CREATE SCHEMA IF NOT EXISTS proof_tracker;

-- Proof snapshots
CREATE TABLE IF NOT EXISTS proof_tracker.proof_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  tracked_page_id UUID,
  page_type TEXT NOT NULL, -- 'homepage', 'customers', 'security', 'case_studies'
  snapshot_date DATE NOT NULL,

  -- From feature extractor
  logo_count INT,
  logo_companies TEXT[],
  case_study_count INT,
  case_study_industries TEXT[],
  testimonial_count INT,
  testimonial_titles TEXT[],
  compliance_badges TEXT[], -- 'SOC2', 'HIPAA', 'GDPR', 'ISO27001', etc.
  security_claims TEXT[],

  -- Raw backup
  page_features_id UUID,
  content_hash TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, page_type, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_proof_snapshots_company
  ON proof_tracker.proof_snapshots(company_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_proof_snapshots_page_type
  ON proof_tracker.proof_snapshots(page_type);

-- Proof changes
CREATE TABLE IF NOT EXISTS proof_tracker.proof_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  page_type TEXT NOT NULL,
  old_snapshot_id UUID REFERENCES proof_tracker.proof_snapshots(id),
  new_snapshot_id UUID REFERENCES proof_tracker.proof_snapshots(id),
  detected_at DATE NOT NULL,

  -- Change classification
  change_type TEXT NOT NULL, -- 'logo_added', 'compliance_added', 'compliance_removed', 'case_study_added', 'industry_expansion', 'persona_shift'
  change_details JSONB NOT NULL,
  significance TEXT NOT NULL, -- 'major', 'minor'

  -- LLM interpretation
  interpretation TEXT,
  buyer_signal TEXT, -- 'enterprise_ready', 'vertical_expansion', 'upmarket_move', 'trust_surge'
  confidence NUMERIC,

  -- Signal emission
  signal_emitted BOOLEAN DEFAULT FALSE,
  signal_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proof_changes_company
  ON proof_tracker.proof_changes(company_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_proof_changes_type
  ON proof_tracker.proof_changes(change_type);

-- Function to upsert proof snapshot
CREATE OR REPLACE FUNCTION proof_tracker.upsert_snapshot(
  p_company_id UUID,
  p_tracked_page_id UUID,
  p_page_type TEXT,
  p_logo_count INT,
  p_logo_companies TEXT[],
  p_case_study_count INT,
  p_case_study_industries TEXT[],
  p_testimonial_count INT,
  p_testimonial_titles TEXT[],
  p_compliance_badges TEXT[],
  p_security_claims TEXT[],
  p_page_features_id UUID DEFAULT NULL,
  p_content_hash TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_snapshot_id UUID;
  v_today DATE := CURRENT_DATE;
BEGIN
  INSERT INTO proof_tracker.proof_snapshots (
    company_id, tracked_page_id, page_type, snapshot_date,
    logo_count, logo_companies, case_study_count, case_study_industries,
    testimonial_count, testimonial_titles, compliance_badges, security_claims,
    page_features_id, content_hash
  ) VALUES (
    p_company_id, p_tracked_page_id, p_page_type, v_today,
    p_logo_count, p_logo_companies, p_case_study_count, p_case_study_industries,
    p_testimonial_count, p_testimonial_titles, p_compliance_badges, p_security_claims,
    p_page_features_id, p_content_hash
  )
  ON CONFLICT (company_id, page_type, snapshot_date) DO UPDATE SET
    logo_count = EXCLUDED.logo_count,
    logo_companies = EXCLUDED.logo_companies,
    case_study_count = EXCLUDED.case_study_count,
    case_study_industries = EXCLUDED.case_study_industries,
    testimonial_count = EXCLUDED.testimonial_count,
    testimonial_titles = EXCLUDED.testimonial_titles,
    compliance_badges = EXCLUDED.compliance_badges,
    security_claims = EXCLUDED.security_claims,
    page_features_id = EXCLUDED.page_features_id,
    content_hash = EXCLUDED.content_hash
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- Function to detect proof changes
CREATE OR REPLACE FUNCTION proof_tracker.detect_changes(
  p_company_id UUID,
  p_page_type TEXT,
  p_new_snapshot_id UUID
) RETURNS SETOF proof_tracker.proof_changes AS $$
DECLARE
  v_old_snapshot RECORD;
  v_new_snapshot RECORD;
  v_change_id UUID;
  v_badges_added TEXT[];
  v_badges_removed TEXT[];
BEGIN
  -- Get new snapshot
  SELECT * INTO v_new_snapshot
  FROM proof_tracker.proof_snapshots
  WHERE id = p_new_snapshot_id;

  -- Get previous snapshot
  SELECT * INTO v_old_snapshot
  FROM proof_tracker.proof_snapshots
  WHERE company_id = p_company_id
    AND page_type = p_page_type
    AND snapshot_date < v_new_snapshot.snapshot_date
  ORDER BY snapshot_date DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Check for compliance badges added
  SELECT array_agg(badge) INTO v_badges_added
  FROM unnest(v_new_snapshot.compliance_badges) AS badge
  WHERE badge NOT IN (SELECT unnest(v_old_snapshot.compliance_badges));

  IF array_length(v_badges_added, 1) > 0 THEN
    INSERT INTO proof_tracker.proof_changes (
      company_id, page_type, old_snapshot_id, new_snapshot_id, detected_at,
      change_type, change_details, significance
    ) VALUES (
      p_company_id, p_page_type, v_old_snapshot.id, p_new_snapshot_id, CURRENT_DATE,
      'compliance_added',
      jsonb_build_object('badges_added', v_badges_added, 'old_badges', v_old_snapshot.compliance_badges, 'new_badges', v_new_snapshot.compliance_badges),
      'major'
    ) RETURNING * INTO v_change_id;
    RETURN NEXT (SELECT * FROM proof_tracker.proof_changes WHERE id = v_change_id);
  END IF;

  -- Check for compliance badges removed
  SELECT array_agg(badge) INTO v_badges_removed
  FROM unnest(v_old_snapshot.compliance_badges) AS badge
  WHERE badge NOT IN (SELECT unnest(v_new_snapshot.compliance_badges));

  IF array_length(v_badges_removed, 1) > 0 THEN
    INSERT INTO proof_tracker.proof_changes (
      company_id, page_type, old_snapshot_id, new_snapshot_id, detected_at,
      change_type, change_details, significance
    ) VALUES (
      p_company_id, p_page_type, v_old_snapshot.id, p_new_snapshot_id, CURRENT_DATE,
      'compliance_removed',
      jsonb_build_object('badges_removed', v_badges_removed),
      'major'
    ) RETURNING * INTO v_change_id;
    RETURN NEXT (SELECT * FROM proof_tracker.proof_changes WHERE id = v_change_id);
  END IF;

  -- Check for significant logo count change (> 5)
  IF ABS(v_old_snapshot.logo_count - v_new_snapshot.logo_count) > 5 THEN
    INSERT INTO proof_tracker.proof_changes (
      company_id, page_type, old_snapshot_id, new_snapshot_id, detected_at,
      change_type, change_details, significance
    ) VALUES (
      p_company_id, p_page_type, v_old_snapshot.id, p_new_snapshot_id, CURRENT_DATE,
      'logo_added',
      jsonb_build_object('old_count', v_old_snapshot.logo_count, 'new_count', v_new_snapshot.logo_count, 'delta', v_new_snapshot.logo_count - v_old_snapshot.logo_count),
      'minor'
    ) RETURNING * INTO v_change_id;
    RETURN NEXT (SELECT * FROM proof_tracker.proof_changes WHERE id = v_change_id);
  END IF;

  -- Check for case study count change
  IF v_old_snapshot.case_study_count != v_new_snapshot.case_study_count THEN
    INSERT INTO proof_tracker.proof_changes (
      company_id, page_type, old_snapshot_id, new_snapshot_id, detected_at,
      change_type, change_details, significance
    ) VALUES (
      p_company_id, p_page_type, v_old_snapshot.id, p_new_snapshot_id, CURRENT_DATE,
      'case_study_added',
      jsonb_build_object('old_count', v_old_snapshot.case_study_count, 'new_count', v_new_snapshot.case_study_count),
      'minor'
    ) RETURNING * INTO v_change_id;
    RETURN NEXT (SELECT * FROM proof_tracker.proof_changes WHERE id = v_change_id);
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to emit proof signal to Control Plane
CREATE OR REPLACE FUNCTION proof_tracker.emit_signal(p_change_id UUID)
RETURNS UUID AS $$
DECLARE
  v_change RECORD;
  v_signal_id UUID;
  v_title TEXT;
BEGIN
  SELECT * INTO v_change
  FROM proof_tracker.proof_changes
  WHERE id = p_change_id;

  v_title := CASE v_change.change_type
    WHEN 'compliance_added' THEN 'New compliance badge: ' || (v_change.change_details->'badges_added'->>0)
    WHEN 'compliance_removed' THEN 'Compliance badge removed'
    WHEN 'logo_added' THEN 'Customer logo surge (+' || (v_change.change_details->>'delta') || ')'
    WHEN 'case_study_added' THEN 'New case study added'
    WHEN 'industry_expansion' THEN 'Expanding to new industry'
    ELSE 'Trust signal update'
  END;

  INSERT INTO control_plane.signals (
    id, signal_type, company_id, severity, confidence,
    title, summary, evidence_urls,
    source_schema, source_table, source_id,
    decision_type, recommended_asset, time_sensitivity,
    meta, created_at
  ) VALUES (
    gen_random_uuid(),
    'proof',
    v_change.company_id,
    CASE v_change.significance WHEN 'major' THEN 4 ELSE 2 END,
    COALESCE(v_change.confidence, 0.8),
    v_title,
    COALESCE(v_change.interpretation, 'Trust signal detected: ' || v_change.change_type),
    ARRAY[]::TEXT[],
    'proof_tracker', 'proof_changes', v_change.id,
    'proof',
    'battlecard',
    CASE v_change.significance WHEN 'major' THEN 'this_week' ELSE 'monitor' END,
    v_change.change_details,
    NOW()
  )
  RETURNING id INTO v_signal_id;

  UPDATE proof_tracker.proof_changes
  SET signal_emitted = true, signal_id = v_signal_id
  WHERE id = p_change_id;

  RETURN v_signal_id;
END;
$$ LANGUAGE plpgsql;

-- Proof points also go to gtm_memory (knowledge_items already has 'proof_point' kind)
CREATE OR REPLACE FUNCTION proof_tracker.emit_to_memory(p_change_id UUID)
RETURNS UUID AS $$
DECLARE
  v_change RECORD;
  v_snapshot RECORD;
  v_knowledge_id UUID;
BEGIN
  SELECT pc.*, ps.compliance_badges, ps.logo_companies
  INTO v_change
  FROM proof_tracker.proof_changes pc
  JOIN proof_tracker.proof_snapshots ps ON ps.id = pc.new_snapshot_id
  WHERE pc.id = p_change_id;

  -- Only emit compliance changes to memory
  IF v_change.change_type NOT IN ('compliance_added', 'compliance_removed') THEN
    RETURN NULL;
  END IF;

  -- Upsert to knowledge memory
  INSERT INTO gtm_memory.knowledge_items (
    id, kind, title, body, tags, confidence, created_at
  ) VALUES (
    gen_random_uuid(),
    'proof_point',
    v_change.change_type || ' at company ' || v_change.company_id,
    COALESCE(v_change.interpretation, 'Compliance change detected'),
    v_change.compliance_badges,
    COALESCE(v_change.confidence, 0.8),
    NOW()
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_knowledge_id;

  RETURN v_knowledge_id;
END;
$$ LANGUAGE plpgsql;
