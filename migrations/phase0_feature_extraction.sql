-- Phase 0.4: Deterministic Feature Extractor Schema
-- Stores extracted features from page snapshots for LLM gating

-- Extracted features stored alongside snapshots
-- NOTE: No FK to page_snapshots because it's a VIEW, not a base table
CREATE TABLE IF NOT EXISTS public.page_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID NOT NULL,
  page_type TEXT NOT NULL,

  -- Universal features (all page types)
  cta_count INT,
  cta_labels TEXT[],
  cta_destinations TEXT[],
  nav_labels TEXT[],
  h1_text TEXT,

  -- Pricing-specific
  plan_count INT,
  plan_names TEXT[],
  has_free_tier BOOLEAN,
  has_enterprise BOOLEAN,
  trial_days INT,
  pricing_model TEXT, -- 'seat', 'usage', 'flat', 'hybrid', 'unknown'
  gating_signals TEXT[], -- 'sso', 'audit_logs', 'sla', 'dedicated'
  limit_mentions JSONB, -- { "storage": "10GB", "users": "5" }

  -- Proof-specific
  logo_count INT,
  logo_companies TEXT[],
  case_study_count INT,
  case_study_industries TEXT[],
  testimonial_count INT,
  testimonial_titles TEXT[], -- job titles
  compliance_badges TEXT[], -- 'SOC2', 'HIPAA', 'GDPR', 'ISO27001'
  security_claims TEXT[],

  -- Integration-specific
  integration_count INT,
  integration_names TEXT[],
  integration_categories JSONB,
  marketplace_presence TEXT[],

  -- Raw extraction metadata
  extraction_version TEXT DEFAULT 'v1',
  extraction_confidence NUMERIC,
  extracted_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(snapshot_id)
);

CREATE INDEX IF NOT EXISTS idx_page_features_page_type ON public.page_features(page_type);
CREATE INDEX IF NOT EXISTS idx_page_features_snapshot ON public.page_features(snapshot_id);

-- Function to check if meaningful features changed
CREATE OR REPLACE FUNCTION public.has_meaningful_feature_change(
  p_old_features_id UUID,
  p_new_features_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_old RECORD;
  v_new RECORD;
BEGIN
  SELECT * INTO v_old FROM public.page_features WHERE id = p_old_features_id;
  SELECT * INTO v_new FROM public.page_features WHERE id = p_new_features_id;

  IF NOT FOUND THEN
    RETURN true; -- New snapshot, treat as meaningful
  END IF;

  -- Major changes (always meaningful)
  IF v_old.pricing_model != v_new.pricing_model THEN RETURN true; END IF;
  IF v_old.plan_count != v_new.plan_count THEN RETURN true; END IF;
  IF v_old.has_free_tier != v_new.has_free_tier THEN RETURN true; END IF;
  IF v_old.has_enterprise != v_new.has_enterprise THEN RETURN true; END IF;

  -- Compliance/security changes (meaningful)
  IF array_length(v_old.compliance_badges, 1) != array_length(v_new.compliance_badges, 1) THEN
    RETURN true;
  END IF;

  -- Significant logo/proof changes (> 3 diff)
  IF ABS(COALESCE(v_old.logo_count, 0) - COALESCE(v_new.logo_count, 0)) > 3 THEN
    RETURN true;
  END IF;

  -- Integration changes (> 5 diff)
  IF ABS(COALESCE(v_old.integration_count, 0) - COALESCE(v_new.integration_count, 0)) > 5 THEN
    RETURN true;
  END IF;

  RETURN false; -- No meaningful change
END;
$$ LANGUAGE plpgsql;

-- View to see pages ready for feature extraction
CREATE OR REPLACE VIEW public.snapshots_pending_extraction AS
SELECT
  ps.id as snapshot_id,
  ps.tracked_page_id,
  tp.page_type,
  tp.url,
  ps.captured_at
FROM public.page_snapshots ps
JOIN public.tracked_pages tp ON tp.id = ps.tracked_page_id
LEFT JOIN public.page_features pf ON pf.snapshot_id = ps.id
WHERE pf.id IS NULL
ORDER BY ps.captured_at DESC;
