-- Phase 3 & 4 Complete Schema Fix
-- Run this in Supabase SQL Editor to fix all missing schemas and tables

-- 1. Create view for public.companies pointing to core.companies
CREATE OR REPLACE VIEW public.companies AS SELECT * FROM core.companies;

-- 2. Create schemas
CREATE SCHEMA IF NOT EXISTS pricing_tracker;
CREATE SCHEMA IF NOT EXISTS proof_tracker;
CREATE SCHEMA IF NOT EXISTS launch_tracker;

-- 3. Pricing tracker tables
CREATE TABLE IF NOT EXISTS pricing_tracker.pricing_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  tracked_page_id UUID,
  snapshot_date DATE NOT NULL,
  plan_count INT,
  plan_names TEXT[],
  has_free_tier BOOLEAN,
  has_enterprise BOOLEAN,
  trial_days INT,
  pricing_model TEXT,
  gating_signals TEXT[],
  limits JSONB,
  page_features_id UUID,
  content_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, snapshot_date)
);

CREATE TABLE IF NOT EXISTS pricing_tracker.pricing_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  old_snapshot_id UUID REFERENCES pricing_tracker.pricing_snapshots(id),
  new_snapshot_id UUID REFERENCES pricing_tracker.pricing_snapshots(id),
  detected_at DATE NOT NULL,
  change_type TEXT NOT NULL,
  change_details JSONB NOT NULL,
  significance TEXT NOT NULL,
  interpretation TEXT,
  strategic_signal TEXT,
  confidence NUMERIC,
  signal_emitted BOOLEAN DEFAULT FALSE,
  signal_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Proof tracker tables
CREATE TABLE IF NOT EXISTS proof_tracker.proof_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  tracked_page_id UUID,
  page_type TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  logo_count INT,
  logo_companies TEXT[],
  case_study_count INT,
  case_study_industries TEXT[],
  testimonial_count INT,
  testimonial_titles TEXT[],
  compliance_badges TEXT[],
  security_claims TEXT[],
  page_features_id UUID,
  content_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, page_type, snapshot_date)
);

CREATE TABLE IF NOT EXISTS proof_tracker.proof_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  page_type TEXT NOT NULL,
  old_snapshot_id UUID REFERENCES proof_tracker.proof_snapshots(id),
  new_snapshot_id UUID REFERENCES proof_tracker.proof_snapshots(id),
  detected_at DATE NOT NULL,
  change_type TEXT NOT NULL,
  change_details JSONB NOT NULL,
  significance TEXT NOT NULL,
  interpretation TEXT,
  buyer_signal TEXT,
  confidence NUMERIC,
  signal_emitted BOOLEAN DEFAULT FALSE,
  signal_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Launch tracker tables
CREATE TABLE IF NOT EXISTS launch_tracker.launches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  horizon_signal_id UUID,
  launch_name TEXT NOT NULL,
  launch_type TEXT NOT NULL,
  launch_date DATE NOT NULL,
  initial_momentum_score NUMERIC,
  current_momentum_score NUMERIC,
  peak_momentum_score NUMERIC,
  peak_momentum_date DATE,
  decay_rate NUMERIC,
  status TEXT DEFAULT 'tracking',
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS launch_tracker.momentum_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id UUID NOT NULL REFERENCES launch_tracker.launches(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  momentum_score NUMERIC NOT NULL,
  mentions_count INT,
  sentiment_score NUMERIC,
  reach_estimate INT,
  source_breakdown JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(launch_id, snapshot_date)
);

CREATE TABLE IF NOT EXISTS launch_tracker.decay_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id UUID NOT NULL REFERENCES launch_tracker.launches(id) ON DELETE CASCADE,
  detected_at DATE NOT NULL,
  signal_type TEXT NOT NULL,
  decay_percentage NUMERIC,
  weeks_since_launch INT,
  details JSONB,
  signal_emitted BOOLEAN DEFAULT FALSE,
  signal_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_pricing_snapshots_company ON pricing_tracker.pricing_snapshots(company_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_changes_company ON pricing_tracker.pricing_changes(company_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_launches_company ON launch_tracker.launches(company_id, launch_date DESC);
CREATE INDEX IF NOT EXISTS idx_launches_status ON launch_tracker.launches(status) WHERE status = 'tracking';

-- 7. Grants
GRANT USAGE ON SCHEMA pricing_tracker TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA pricing_tracker TO authenticated;

GRANT USAGE ON SCHEMA proof_tracker TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA proof_tracker TO authenticated;

GRANT USAGE ON SCHEMA launch_tracker TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA launch_tracker TO authenticated;

-- Done
SELECT 'Phase 3 & 4 schema fix complete' AS status;
