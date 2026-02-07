-- Phase 3 & 4 Dependencies Fix
-- Creates missing base tables and schemas required by the new workflows
-- Run this BEFORE phase3 and phase4 migrations

-- =========================================
-- 1. PUBLIC SCHEMA - Core tables
-- =========================================

-- Companies table (required by all trackers)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  website_url TEXT,
  description TEXT,
  industry TEXT,
  employee_count_range TEXT,
  funding_stage TEXT,

  -- Tracking settings
  enabled BOOLEAN DEFAULT true,
  tracking_tier TEXT DEFAULT 'standard', -- 'basic', 'standard', 'premium'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_domain ON public.companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_enabled ON public.companies(enabled) WHERE enabled = true;

-- Tracked pages table (required by distribution tracker)
CREATE TABLE IF NOT EXISTS public.tracked_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  page_type TEXT DEFAULT 'homepage', -- 'homepage', 'pricing', 'security', 'customers', 'integrations', 'docs', 'comparison', 'partners'

  enabled BOOLEAN DEFAULT true,

  -- Fetch settings
  fetch_frequency TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
  last_fetched_at TIMESTAMPTZ,
  last_changed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_id, url)
);

CREATE INDEX IF NOT EXISTS idx_tracked_pages_company ON public.tracked_pages(company_id);
CREATE INDEX IF NOT EXISTS idx_tracked_pages_type ON public.tracked_pages(page_type) WHERE enabled = true;

-- Page snapshots table (referenced by trackers)
CREATE TABLE IF NOT EXISTS public.page_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_page_id UUID REFERENCES public.tracked_pages(id) ON DELETE CASCADE,

  content_hash TEXT,
  raw_html TEXT,
  extracted_text TEXT,

  -- Fetch metadata
  http_status INT,
  fetch_duration_ms INT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_snapshots_page ON public.page_snapshots(tracked_page_id, created_at DESC);

-- Page diffs table
CREATE TABLE IF NOT EXISTS public.page_diffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_snapshot_id UUID REFERENCES public.page_snapshots(id),
  new_snapshot_id UUID REFERENCES public.page_snapshots(id),

  diff_type TEXT, -- 'content', 'structure', 'both'
  diff_summary TEXT,
  changes_detected JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Page features table (for deterministic extraction)
CREATE TABLE IF NOT EXISTS public.page_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID REFERENCES public.page_snapshots(id) ON DELETE CASCADE,
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

-- =========================================
-- 2. PRICING TRACKER SCHEMA (Phase 2)
-- =========================================

CREATE SCHEMA IF NOT EXISTS pricing_tracker;

-- Pricing snapshots
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
  pricing_model TEXT,
  gating_signals TEXT[],
  limits JSONB,

  -- Raw backup
  page_features_id UUID,
  content_hash TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_pricing_snapshots_company
  ON pricing_tracker.pricing_snapshots(company_id, snapshot_date DESC);

-- Pricing changes
CREATE TABLE IF NOT EXISTS pricing_tracker.pricing_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  old_snapshot_id UUID REFERENCES pricing_tracker.pricing_snapshots(id),
  new_snapshot_id UUID REFERENCES pricing_tracker.pricing_snapshots(id),
  detected_at DATE NOT NULL,

  -- Change classification
  change_type TEXT NOT NULL, -- 'plan_added', 'plan_removed', 'model_change', 'gating_change', 'limit_change', 'trial_change'
  change_details JSONB NOT NULL,
  significance TEXT NOT NULL, -- 'major', 'minor'

  -- LLM interpretation
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

-- =========================================
-- 3. PROOF TRACKER SCHEMA (Phase 2)
-- =========================================

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
  compliance_badges TEXT[],
  security_claims TEXT[],

  -- Raw backup
  page_features_id UUID,
  content_hash TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, page_type, snapshot_date)
);

-- Proof changes
CREATE TABLE IF NOT EXISTS proof_tracker.proof_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  page_type TEXT NOT NULL,
  old_snapshot_id UUID REFERENCES proof_tracker.proof_snapshots(id),
  new_snapshot_id UUID REFERENCES proof_tracker.proof_snapshots(id),
  detected_at DATE NOT NULL,

  -- Change classification
  change_type TEXT NOT NULL, -- 'logo_added', 'compliance_added', 'case_study_added', 'industry_expansion', 'persona_shift'
  change_details JSONB NOT NULL,
  significance TEXT NOT NULL,

  -- LLM interpretation
  interpretation TEXT,
  buyer_signal TEXT, -- 'enterprise_ready', 'vertical_expansion', 'upmarket_move', 'trust_surge'
  confidence NUMERIC,

  -- Signal emission
  signal_emitted BOOLEAN DEFAULT FALSE,
  signal_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 4. SEED SAMPLE DATA (for testing)
-- =========================================

-- Insert sample companies
INSERT INTO public.companies (id, name, domain, website_url, industry, enabled) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Stripe', 'stripe.com', 'https://stripe.com', 'FinTech', true),
  ('a0000000-0000-0000-0000-000000000002', 'Segment', 'segment.com', 'https://segment.com', 'Data', true),
  ('a0000000-0000-0000-0000-000000000003', 'Amplitude', 'amplitude.com', 'https://amplitude.com', 'Analytics', true)
ON CONFLICT (domain) DO NOTHING;

-- Insert sample tracked pages
INSERT INTO public.tracked_pages (company_id, url, page_type, enabled) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'https://stripe.com', 'homepage', true),
  ('a0000000-0000-0000-0000-000000000001', 'https://stripe.com/pricing', 'pricing', true),
  ('a0000000-0000-0000-0000-000000000001', 'https://stripe.com/partners/integrations', 'integrations', true),
  ('a0000000-0000-0000-0000-000000000002', 'https://segment.com', 'homepage', true),
  ('a0000000-0000-0000-0000-000000000002', 'https://segment.com/pricing', 'pricing', true),
  ('a0000000-0000-0000-0000-000000000003', 'https://amplitude.com', 'homepage', true),
  ('a0000000-0000-0000-0000-000000000003', 'https://amplitude.com/pricing', 'pricing', true)
ON CONFLICT (company_id, url) DO NOTHING;

-- =========================================
-- 5. GRANTS
-- =========================================

GRANT USAGE ON SCHEMA pricing_tracker TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA pricing_tracker TO authenticated;

GRANT USAGE ON SCHEMA proof_tracker TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA proof_tracker TO authenticated;

-- =========================================
-- DONE
-- =========================================
SELECT 'Phase 3 & 4 dependencies created successfully' AS status;
