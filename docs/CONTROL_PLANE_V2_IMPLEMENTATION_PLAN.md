# Control Plane v2: Comprehensive Implementation Plan

**Date**: 2026-02-06
**Scope**: Ships, Experiment Surveillance, Sector Packs, Orchestration
**Timeline**: 12 weeks (3 months)

---

## Executive Summary

This plan consolidates:
1. **5 New Ships** feeding Control Plane (Pricing, Proof, Distribution, Hiring, Launch Decay)
2. **Experiment Surveillance** (survivorship + propagation = winners)
3. **Sector Packs** (shared intelligence across users)
4. **Orchestration Evolution** (n8n → worker services)
5. **Cost Control Infrastructure** (telemetry, gating, budgets)

### Current State
- ✅ Messaging Tracker: `page_snapshots` → `page_diffs` → `classified_changes` → signals
- ✅ Objection Tracker: `sources` → `events` → `patterns` → signals
- ✅ Control Plane: 5 signal types (`messaging`, `narrative`, `icp`, `horizon`, `objection`)
- ✅ Builders: Objection Library, Battlecards, Swipe File
- ✅ Weekly Packet: with predictions, action mapping

### Target State
- 10 signal types feeding Control Plane
- Deterministic feature extraction before LLM
- Experiment pattern detection with survivorship scoring
- Sector Packs delivering shared "Market Winners"
- Cost telemetry and budget enforcement
- Scalable orchestration path

---

## Phase 0: Foundation (Week 1-2)
**Goal**: Extend core infrastructure to support all ships

### 0.1 Signal Type Extension
```sql
-- File: migrations/phase0_signal_types.sql

ALTER TABLE control_plane.signals
  DROP CONSTRAINT IF EXISTS signals_signal_type_check;

ALTER TABLE control_plane.signals
  ADD CONSTRAINT signals_signal_type_check CHECK (
    signal_type IN (
      -- Existing
      'messaging', 'narrative', 'icp', 'horizon', 'objection',
      -- New ships
      'pricing', 'proof', 'distribution', 'hiring', 'launch_decay',
      -- Experiment surveillance
      'experiment'
    )
  );

-- Add decision_type values for new signal types
COMMENT ON COLUMN control_plane.signals.decision_type IS
  'positioning | packaging | distribution | proof | enablement | risk | hiring | launch';
```

### 0.2 Page Type Classification
```sql
-- Extend tracked_pages for routing to appropriate ships

ALTER TABLE public.tracked_pages
  ADD COLUMN IF NOT EXISTS page_type TEXT DEFAULT 'homepage';

-- Valid page types
COMMENT ON COLUMN public.tracked_pages.page_type IS
  'homepage | pricing | security | customers | case_studies | integrations | docs | comparison | partners';

-- Add index for ship routing
CREATE INDEX IF NOT EXISTS idx_tracked_pages_page_type
  ON public.tracked_pages(page_type) WHERE enabled = true;

-- Seed page types for existing tracked pages (based on URL patterns)
UPDATE public.tracked_pages SET page_type =
  CASE
    WHEN url ILIKE '%/pricing%' THEN 'pricing'
    WHEN url ILIKE '%/security%' OR url ILIKE '%/trust%' THEN 'security'
    WHEN url ILIKE '%/customers%' OR url ILIKE '%/case-stud%' THEN 'customers'
    WHEN url ILIKE '%/integrations%' OR url ILIKE '%/apps%' THEN 'integrations'
    WHEN url ILIKE '%/partners%' THEN 'partners'
    WHEN url ILIKE '%/docs%' OR url ILIKE '%/documentation%' THEN 'docs'
    WHEN url ILIKE '%/compare%' OR url ILIKE '%/vs-%' OR url ILIKE '%versus%' THEN 'comparison'
    ELSE 'homepage'
  END
WHERE page_type IS NULL OR page_type = 'homepage';
```

### 0.3 Cost Telemetry Infrastructure
```sql
-- File: migrations/phase0_cost_telemetry.sql

CREATE SCHEMA IF NOT EXISTS ops;

CREATE TABLE ops.cost_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  run_id UUID,
  run_type TEXT NOT NULL, -- 'ship', 'builder', 'packet', 'experiment'
  ship_name TEXT, -- 'messaging', 'pricing', 'objection', etc.
  user_id UUID,

  -- Fetch costs
  pages_checked INT DEFAULT 0,
  pages_changed INT DEFAULT 0,
  headless_renders INT DEFAULT 0,

  -- LLM costs
  anthropic_calls INT DEFAULT 0,
  tokens_in INT DEFAULT 0,
  tokens_out INT DEFAULT 0,

  -- Timing
  duration_ms INT,

  -- Errors
  errors_count INT DEFAULT 0,
  error_details JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cost_events_run_type ON ops.cost_events(run_type, created_at DESC);
CREATE INDEX idx_cost_events_ship ON ops.cost_events(ship_name, created_at DESC);
CREATE INDEX idx_cost_events_user ON ops.cost_events(user_id, created_at DESC);

-- Weekly cost summary view
CREATE VIEW ops.weekly_cost_summary AS
SELECT
  date_trunc('week', created_at) as week_start,
  ship_name,
  COUNT(*) as runs,
  SUM(pages_checked) as total_pages,
  SUM(headless_renders) as total_headless,
  SUM(anthropic_calls) as total_llm_calls,
  SUM(tokens_in + tokens_out) as total_tokens,
  SUM(duration_ms) as total_duration_ms,
  SUM(errors_count) as total_errors
FROM ops.cost_events
GROUP BY 1, 2
ORDER BY 1 DESC, 2;

-- Budget limits table
CREATE TABLE ops.budget_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL, -- 'global', 'ship', 'user'
  scope_id TEXT, -- ship_name or user_id
  limit_type TEXT NOT NULL, -- 'headless_per_week', 'anthropic_calls_per_week', 'tokens_per_week'
  limit_value INT NOT NULL,
  current_value INT DEFAULT 0,
  period_start DATE,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scope, scope_id, limit_type, period_start)
);

-- Function to check budget before expensive operations
CREATE OR REPLACE FUNCTION ops.check_budget(
  p_scope TEXT,
  p_scope_id TEXT,
  p_limit_type TEXT,
  p_increment INT DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  v_limit_value INT;
  v_current_value INT;
  v_period_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
BEGIN
  SELECT limit_value, current_value
  INTO v_limit_value, v_current_value
  FROM ops.budget_limits
  WHERE scope = p_scope
    AND (scope_id = p_scope_id OR scope_id IS NULL)
    AND limit_type = p_limit_type
    AND period_start = v_period_start
    AND enabled = true;

  IF NOT FOUND THEN
    RETURN true; -- No limit configured
  END IF;

  IF v_current_value + p_increment > v_limit_value THEN
    RETURN false; -- Over budget
  END IF;

  -- Increment counter
  UPDATE ops.budget_limits
  SET current_value = current_value + p_increment
  WHERE scope = p_scope
    AND (scope_id = p_scope_id OR scope_id IS NULL)
    AND limit_type = p_limit_type
    AND period_start = v_period_start;

  RETURN true;
END;
$$ LANGUAGE plpgsql;
```

### 0.4 Deterministic Feature Extractor Schema
```sql
-- File: migrations/phase0_feature_extraction.sql

-- Extracted features stored alongside snapshots
CREATE TABLE public.page_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID NOT NULL REFERENCES public.page_snapshots(id) ON DELETE CASCADE,
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

CREATE INDEX idx_page_features_page_type ON public.page_features(page_type);
```

### Phase 0 Deliverables
- [ ] Signal type constraint extended
- [ ] Page type classification added and seeded
- [ ] Cost telemetry tables created
- [ ] Budget checking function implemented
- [ ] Feature extraction schema ready
- [ ] n8n workflows instrumented with cost logging

---

## Phase 1: Deterministic Feature Extractor (Week 2-3)
**Goal**: Build extraction layer that runs before LLM, reduces cost, improves consistency

### 1.1 Feature Extractor Service
```typescript
// File: src/services/feature-extractor.ts

interface ExtractedFeatures {
  page_type: string;

  // Universal
  ctas: { label: string; destination: string; placement: string }[];
  navigation: string[];
  h1: string;

  // Pricing
  pricing?: {
    plan_count: number;
    plan_names: string[];
    has_free_tier: boolean;
    has_enterprise: boolean;
    trial_days: number | null;
    pricing_model: 'seat' | 'usage' | 'flat' | 'hybrid' | 'unknown';
    gating_signals: string[];
    limits: Record<string, string>;
  };

  // Proof
  proof?: {
    logo_count: number;
    logos: string[];
    case_studies: number;
    industries: string[];
    testimonials: number;
    titles: string[];
    compliance: string[];
    security_claims: string[];
  };

  // Integrations
  integrations?: {
    count: number;
    names: string[];
    categories: Record<string, string[]>;
    marketplaces: string[];
  };
}

// Extraction rules (no LLM, pure parsing)
const PRICING_PATTERNS = {
  free_tier: /free\s*(plan|tier|forever|starter)/i,
  enterprise: /enterprise|custom\s*pricing|contact\s*(us|sales)/i,
  trial_days: /(\d+)[\s-]*(day|week).*?(trial|free)/i,
  seat_based: /per\s*(user|seat|member)/i,
  usage_based: /usage|metered|pay.*as.*you.*go/i,
  gating: {
    sso: /sso|single\s*sign|saml|okta/i,
    audit: /audit\s*log/i,
    sla: /sla|uptime\s*guarantee/i,
    dedicated: /dedicated|private\s*cloud/i,
  }
};

const COMPLIANCE_BADGES = [
  'SOC 2', 'SOC2', 'SOC 2 Type II',
  'HIPAA', 'HIPAA Compliant',
  'GDPR', 'GDPR Compliant',
  'ISO 27001', 'ISO27001',
  'PCI DSS', 'PCI-DSS',
  'FedRAMP', 'StateRAMP',
  'CCPA', 'FERPA'
];

export function extractFeatures(html: string, pageType: string): ExtractedFeatures {
  // DOM parsing with cheerio/jsdom
  // Rule-based extraction
  // Return structured features
}
```

### 1.2 Feature Diff Calculator
```typescript
// File: src/services/feature-diff.ts

interface FeatureDiff {
  page_type: string;
  has_meaningful_change: boolean;
  change_categories: string[]; // 'pricing_model', 'plan_count', 'compliance', etc.
  changes: {
    field: string;
    old_value: any;
    new_value: any;
    significance: 'major' | 'minor' | 'cosmetic';
  }[];
}

// Significance rules
const SIGNIFICANCE_RULES = {
  // Major changes (always emit signal)
  major: [
    'pricing_model',
    'plan_count',
    'has_free_tier',
    'has_enterprise',
    'compliance_added',
    'integration_count_delta_gt_5'
  ],
  // Minor changes (emit if multiple or with major)
  minor: [
    'trial_days',
    'gating_signals',
    'logo_count_delta_gt_3',
    'case_study_count'
  ],
  // Cosmetic (don't emit alone)
  cosmetic: [
    'cta_label_change',
    'nav_reorder',
    'h1_minor_edit'
  ]
};

export function computeFeatureDiff(
  oldFeatures: ExtractedFeatures,
  newFeatures: ExtractedFeatures
): FeatureDiff {
  // Compare structured features
  // Apply significance rules
  // Return diff with has_meaningful_change flag
}
```

### 1.3 LLM Gating Logic
```typescript
// File: src/services/llm-gate.ts

interface GatingDecision {
  should_call_llm: boolean;
  reason: string;
  estimated_tokens: number;
}

export function shouldCallLLM(
  featureDiff: FeatureDiff,
  costBudget: { remaining_calls: number; remaining_tokens: number }
): GatingDecision {
  // Rule 1: No meaningful change = no LLM
  if (!featureDiff.has_meaningful_change) {
    return { should_call_llm: false, reason: 'no_meaningful_change', estimated_tokens: 0 };
  }

  // Rule 2: Budget exhausted = no LLM
  if (costBudget.remaining_calls <= 0) {
    return { should_call_llm: false, reason: 'budget_exhausted', estimated_tokens: 0 };
  }

  // Rule 3: Only cosmetic changes = no LLM
  if (featureDiff.changes.every(c => c.significance === 'cosmetic')) {
    return { should_call_llm: false, reason: 'cosmetic_only', estimated_tokens: 0 };
  }

  // Proceed with LLM
  const estimatedTokens = estimateTokens(featureDiff);
  return { should_call_llm: true, reason: 'meaningful_change', estimated_tokens: estimatedTokens };
}
```

### Phase 1 Deliverables
- [ ] Feature extractor for pricing pages
- [ ] Feature extractor for proof pages (security, customers)
- [ ] Feature extractor for integration pages
- [ ] Feature diff calculator with significance scoring
- [ ] LLM gating logic
- [ ] Integration with existing page_snapshots pipeline
- [ ] Unit tests for extraction rules

---

## Phase 2: Core Ships (Week 3-6)
**Goal**: Build 3 high-value ships that feed Control Plane

### 2.1 Pricing Drift Monitor

```sql
-- File: migrations/phase2_pricing_ship.sql

CREATE SCHEMA IF NOT EXISTS pricing_tracker;

-- Pricing snapshots (enriched from page_features)
CREATE TABLE pricing_tracker.pricing_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  tracked_page_id UUID REFERENCES public.tracked_pages(id),
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
  page_features_id UUID REFERENCES public.page_features(id),
  content_hash TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, snapshot_date)
);

-- Pricing changes (computed weekly)
CREATE TABLE pricing_tracker.pricing_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  old_snapshot_id UUID REFERENCES pricing_tracker.pricing_snapshots(id),
  new_snapshot_id UUID REFERENCES pricing_tracker.pricing_snapshots(id),
  detected_at DATE NOT NULL,

  -- Change classification
  change_type TEXT NOT NULL, -- 'plan_added', 'plan_removed', 'model_change', 'gating_change', 'limit_change', 'trial_change'
  change_details JSONB NOT NULL,
  significance TEXT NOT NULL, -- 'major', 'minor'

  -- LLM interpretation (if called)
  interpretation TEXT,
  strategic_signal TEXT, -- 'enterprise_push', 'plg_pivot', 'value_metric_shift', 'friction_reduction'
  confidence NUMERIC,

  -- Signal emission
  signal_emitted BOOLEAN DEFAULT FALSE,
  signal_id UUID REFERENCES control_plane.signals(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pricing_changes_company ON pricing_tracker.pricing_changes(company_id, detected_at DESC);
CREATE INDEX idx_pricing_changes_type ON pricing_tracker.pricing_changes(change_type);

-- Function to emit pricing signal
CREATE OR REPLACE FUNCTION pricing_tracker.emit_signal(p_change_id UUID)
RETURNS UUID AS $$
DECLARE
  v_change RECORD;
  v_signal_id UUID;
BEGIN
  SELECT * INTO v_change FROM pricing_tracker.pricing_changes WHERE id = p_change_id;

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
    'Pricing change: ' || v_change.change_type,
    v_change.interpretation,
    ARRAY[]::TEXT[], -- TODO: add evidence URLs
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
```

### 2.2 Proof and Trust Monitor

```sql
-- File: migrations/phase2_proof_ship.sql

CREATE SCHEMA IF NOT EXISTS proof_tracker;

-- Proof snapshots
CREATE TABLE proof_tracker.proof_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  tracked_page_id UUID REFERENCES public.tracked_pages(id),
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
  page_features_id UUID REFERENCES public.page_features(id),
  content_hash TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, page_type, snapshot_date)
);

-- Proof changes
CREATE TABLE proof_tracker.proof_changes (
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
  signal_id UUID REFERENCES control_plane.signals(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proof points go to gtm_memory (already has 'proof_point' kind!)
CREATE OR REPLACE FUNCTION proof_tracker.emit_to_memory(p_change_id UUID)
RETURNS UUID AS $$
DECLARE
  v_change RECORD;
  v_knowledge_id UUID;
BEGIN
  SELECT pc.*, ps.company_id, ps.logo_companies, ps.compliance_badges
  INTO v_change
  FROM proof_tracker.proof_changes pc
  JOIN proof_tracker.proof_snapshots ps ON ps.id = pc.new_snapshot_id
  WHERE pc.id = p_change_id;

  -- Upsert to knowledge memory
  SELECT gtm_memory.upsert_knowledge_item(
    p_kind := 'proof_point',
    p_title := v_change.change_type || ' at ' || v_change.company_id,
    p_body := v_change.interpretation,
    p_tags := v_change.compliance_badges,
    p_evidence_urls := ARRAY[]::TEXT[],
    p_confidence := COALESCE(v_change.confidence, 0.8)
  ) INTO v_knowledge_id;

  RETURN v_knowledge_id;
END;
$$ LANGUAGE plpgsql;
```

### 2.3 Hiring Signal Monitor

```sql
-- File: migrations/phase2_hiring_ship.sql

CREATE SCHEMA IF NOT EXISTS hiring_tracker;

-- ATS sources per company
CREATE TABLE hiring_tracker.company_ats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  ats_type TEXT NOT NULL, -- 'lever', 'greenhouse', 'ashby', 'workday'
  ats_company_slug TEXT NOT NULL, -- e.g., 'stripe' for lever.co/stripe
  api_endpoint TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, ats_type)
);

-- Job snapshots (weekly)
CREATE TABLE hiring_tracker.job_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  ats_id UUID REFERENCES hiring_tracker.company_ats(id),
  snapshot_date DATE NOT NULL,

  -- Aggregates
  total_open_roles INT,
  roles_by_department JSONB, -- {"engineering": 15, "sales": 8, "marketing": 3}
  roles_by_level JSONB, -- {"senior": 10, "staff": 3, "director": 2}
  roles_by_location JSONB,

  -- Notable roles (PMM-relevant)
  pmm_roles INT DEFAULT 0,
  solutions_roles INT DEFAULT 0,
  enterprise_sales_roles INT DEFAULT 0,

  -- Raw job list for diff
  job_list JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, snapshot_date)
);

-- Hiring changes
CREATE TABLE hiring_tracker.hiring_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  old_snapshot_id UUID REFERENCES hiring_tracker.job_snapshots(id),
  new_snapshot_id UUID REFERENCES hiring_tracker.job_snapshots(id),
  detected_at DATE NOT NULL,

  -- Change classification
  change_type TEXT NOT NULL, -- 'surge', 'freeze', 'pivot', 'department_expansion'
  department TEXT,
  change_magnitude INT, -- +/- count

  -- Interpretation
  strategic_signal TEXT, -- 'gtm_expansion', 'product_investment', 'enterprise_push', 'international'
  notable_roles_added TEXT[],
  confidence NUMERIC,

  -- Signal emission
  signal_emitted BOOLEAN DEFAULT FALSE,
  signal_id UUID REFERENCES control_plane.signals(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lever API fetcher (public, no auth)
-- https://api.lever.co/v0/postings/{company}?mode=json

-- Greenhouse API fetcher (public, no auth)
-- https://boards-api.greenhouse.io/v1/boards/{company}/jobs
```

### Phase 2 n8n Workflows
- [ ] `pricing_drift_weekly.json` - Weekly pricing page analysis
- [ ] `proof_monitor_weekly.json` - Weekly proof/trust page analysis
- [ ] `hiring_monitor_weekly.json` - Weekly ATS fetch and analysis

### Phase 2 Deliverables
- [ ] Pricing Tracker schema and emission functions
- [ ] Proof Tracker schema with gtm_memory integration
- [ ] Hiring Tracker schema with ATS sources
- [ ] n8n workflows for all 3 ships
- [ ] Signal emission verified in control_plane.signals
- [ ] Cost telemetry captured for each run

---

## Phase 3: Additional Ships (Week 6-8)
**Goal**: Complete ship coverage

### 3.1 Distribution Move Monitor

```sql
-- File: migrations/phase3_distribution_ship.sql

CREATE SCHEMA IF NOT EXISTS distribution_tracker;

-- Integration snapshots
CREATE TABLE distribution_tracker.integration_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  tracked_page_id UUID REFERENCES public.tracked_pages(id),
  snapshot_date DATE NOT NULL,

  -- From feature extractor
  integration_count INT,
  integration_names TEXT[],
  integration_categories JSONB, -- {"crm": ["Salesforce"], "data": ["Snowflake"]}
  marketplace_presence TEXT[], -- 'salesforce_appexchange', 'hubspot_marketplace'
  partner_mentions TEXT[],

  -- API/docs signals
  has_public_api BOOLEAN,
  api_doc_url TEXT,

  page_features_id UUID REFERENCES public.page_features(id),
  content_hash TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, snapshot_date)
);

-- Distribution changes
CREATE TABLE distribution_tracker.distribution_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  old_snapshot_id UUID REFERENCES distribution_tracker.integration_snapshots(id),
  new_snapshot_id UUID REFERENCES distribution_tracker.integration_snapshots(id),
  detected_at DATE NOT NULL,

  change_type TEXT NOT NULL, -- 'integration_added', 'marketplace_listed', 'category_expansion', 'partner_announced'
  change_details JSONB NOT NULL,
  significance TEXT NOT NULL,

  strategic_signal TEXT, -- 'ecosystem_play', 'platform_adjacency', 'channel_expansion'
  confidence NUMERIC,

  signal_emitted BOOLEAN DEFAULT FALSE,
  signal_id UUID REFERENCES control_plane.signals(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Launch Decay Analyzer

```sql
-- File: migrations/phase3_launch_decay_ship.sql

CREATE SCHEMA IF NOT EXISTS launch_tracker;

-- Launch events (anchor points)
CREATE TABLE launch_tracker.launches (
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

-- Decay observations (weekly checks post-launch)
CREATE TABLE launch_tracker.decay_observations (
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
  signal_id UUID REFERENCES control_plane.signals(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(launch_id, observation_date)
);

-- Launch detection from horizon signals
-- When horizon ship detects "company X announced Y", create launch event
CREATE OR REPLACE FUNCTION launch_tracker.create_from_horizon_signal(p_signal_id UUID)
RETURNS UUID AS $$
DECLARE
  v_signal RECORD;
  v_launch_id UUID;
BEGIN
  SELECT * INTO v_signal FROM control_plane.signals WHERE id = p_signal_id;

  -- Only process horizon signals about launches
  IF v_signal.signal_type != 'horizon' THEN
    RETURN NULL;
  END IF;

  INSERT INTO launch_tracker.launches (
    id, company_id, launch_date, launch_type, launch_title, announcement_url
  ) VALUES (
    gen_random_uuid(),
    v_signal.company_id,
    v_signal.created_at::DATE,
    COALESCE(v_signal.meta->>'launch_type', 'product'),
    v_signal.title,
    v_signal.evidence_urls[1]
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_launch_id;

  RETURN v_launch_id;
END;
$$ LANGUAGE plpgsql;
```

### Phase 3 Deliverables
- [ ] Distribution Tracker schema and workflow
- [ ] Launch Decay Tracker schema
- [ ] Launch detection from horizon signals
- [ ] Decay observation workflow (runs weekly for active launches)
- [ ] All 5 ships emitting to control_plane.signals

---

## Phase 4: Experiment Surveillance (Week 8-10)
**Goal**: Detect experiments, score survivorship + propagation, emit winners

### 4.1 Experiment Pattern Schema

```sql
-- File: migrations/phase4_experiment_surveillance.sql

CREATE SCHEMA IF NOT EXISTS experiment_surveillance;

-- Experiment patterns (cross-company)
CREATE TABLE experiment_surveillance.patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern identity
  pattern_key TEXT NOT NULL UNIQUE, -- normalized identifier
  pattern_label TEXT NOT NULL,
  pattern_category TEXT NOT NULL, -- 'packaging', 'conversion', 'proof', 'positioning', 'distribution'
  description TEXT,

  -- Lifecycle
  first_seen DATE NOT NULL,
  last_seen DATE,
  status TEXT DEFAULT 'candidate', -- 'candidate', 'emerging', 'proven', 'fading'

  -- Scoring (computed)
  survivorship_score NUMERIC DEFAULT 0,
  propagation_score NUMERIC DEFAULT 0,
  combined_score NUMERIC DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pattern instances (observations)
CREATE TABLE experiment_surveillance.pattern_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID NOT NULL REFERENCES experiment_surveillance.patterns(id),

  -- Where observed
  company_id UUID NOT NULL,
  page_type TEXT NOT NULL,

  -- When observed
  observed_at DATE NOT NULL,

  -- Evidence
  snapshot_id UUID,
  evidence_url TEXT,
  extracted_fields JSONB,

  -- Detection metadata
  detection_method TEXT, -- 'feature_diff', 'llm_classification'
  confidence NUMERIC,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pattern_id, company_id, page_type, observed_at)
);

-- Survivorship tracking (weekly rollups)
CREATE TABLE experiment_surveillance.pattern_survival (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID NOT NULL REFERENCES experiment_surveillance.patterns(id),
  company_id UUID NOT NULL,
  week_start DATE NOT NULL,

  -- Survival metrics
  consecutive_weeks INT NOT NULL,
  still_present BOOLEAN NOT NULL,
  reverted BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pattern_id, company_id, week_start)
);

-- Survivorship scoring function
CREATE OR REPLACE FUNCTION experiment_surveillance.compute_survivorship(p_pattern_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_score NUMERIC := 0;
  v_company_count INT;
  v_max_weeks INT;
  v_reverted_count INT;
BEGIN
  -- Count companies where pattern survived 4+ weeks
  SELECT COUNT(DISTINCT company_id), MAX(consecutive_weeks)
  INTO v_company_count, v_max_weeks
  FROM experiment_surveillance.pattern_survival
  WHERE pattern_id = p_pattern_id
    AND consecutive_weeks >= 4
    AND NOT reverted;

  -- Count reversions (negative signal)
  SELECT COUNT(*) INTO v_reverted_count
  FROM experiment_surveillance.pattern_survival
  WHERE pattern_id = p_pattern_id AND reverted;

  -- Score: companies * weeks, penalized by reversions
  v_score := (v_company_count * LEAST(v_max_weeks, 12)) - (v_reverted_count * 5);

  RETURN GREATEST(v_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Propagation scoring function
CREATE OR REPLACE FUNCTION experiment_surveillance.compute_propagation(p_pattern_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_score NUMERIC := 0;
  v_company_count INT;
  v_first_seen DATE;
  v_spread_weeks INT;
BEGIN
  -- Count distinct companies
  SELECT COUNT(DISTINCT company_id), MIN(observed_at)
  INTO v_company_count, v_first_seen
  FROM experiment_surveillance.pattern_instances
  WHERE pattern_id = p_pattern_id;

  -- How fast did it spread?
  SELECT EXTRACT(WEEK FROM (MAX(observed_at) - MIN(observed_at)))
  INTO v_spread_weeks
  FROM experiment_surveillance.pattern_instances
  WHERE pattern_id = p_pattern_id;

  -- Score: more companies in shorter time = higher
  IF v_spread_weeks > 0 THEN
    v_score := (v_company_count * 10) / GREATEST(v_spread_weeks, 1);
  ELSE
    v_score := v_company_count * 5;
  END IF;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Update pattern scores (run weekly)
CREATE OR REPLACE FUNCTION experiment_surveillance.update_pattern_scores()
RETURNS void AS $$
BEGIN
  UPDATE experiment_surveillance.patterns p
  SET
    survivorship_score = experiment_surveillance.compute_survivorship(p.id),
    propagation_score = experiment_surveillance.compute_propagation(p.id),
    combined_score = (
      experiment_surveillance.compute_survivorship(p.id) * 0.6 +
      experiment_surveillance.compute_propagation(p.id) * 0.4
    ),
    status = CASE
      WHEN experiment_surveillance.compute_survivorship(p.id) >= 50
           AND experiment_surveillance.compute_propagation(p.id) >= 30 THEN 'proven'
      WHEN experiment_surveillance.compute_survivorship(p.id) >= 20 THEN 'emerging'
      WHEN last_seen < CURRENT_DATE - INTERVAL '4 weeks' THEN 'fading'
      ELSE 'candidate'
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

### 4.2 Pattern Detection from Ship Signals

```sql
-- Detect patterns from pricing/proof/distribution changes
CREATE OR REPLACE FUNCTION experiment_surveillance.detect_pattern(
  p_source_schema TEXT,
  p_source_table TEXT,
  p_source_id UUID,
  p_company_id UUID,
  p_page_type TEXT,
  p_change_type TEXT,
  p_change_details JSONB
) RETURNS UUID AS $$
DECLARE
  v_pattern_key TEXT;
  v_pattern_id UUID;
  v_category TEXT;
BEGIN
  -- Normalize pattern key from change
  v_pattern_key := p_source_schema || ':' || p_change_type || ':' ||
    COALESCE(p_change_details->>'variant', 'default');

  -- Determine category
  v_category := CASE p_source_schema
    WHEN 'pricing_tracker' THEN 'packaging'
    WHEN 'proof_tracker' THEN 'proof'
    WHEN 'distribution_tracker' THEN 'distribution'
    ELSE 'positioning'
  END;

  -- Upsert pattern
  INSERT INTO experiment_surveillance.patterns (
    id, pattern_key, pattern_label, pattern_category, first_seen
  ) VALUES (
    gen_random_uuid(),
    v_pattern_key,
    p_change_type,
    v_category,
    CURRENT_DATE
  )
  ON CONFLICT (pattern_key) DO UPDATE SET
    last_seen = CURRENT_DATE
  RETURNING id INTO v_pattern_id;

  -- Record instance
  INSERT INTO experiment_surveillance.pattern_instances (
    pattern_id, company_id, page_type, observed_at,
    extracted_fields, detection_method, confidence
  ) VALUES (
    v_pattern_id, p_company_id, p_page_type, CURRENT_DATE,
    p_change_details, 'ship_signal', 0.9
  )
  ON CONFLICT (pattern_id, company_id, page_type, observed_at) DO NOTHING;

  RETURN v_pattern_id;
END;
$$ LANGUAGE plpgsql;
```

### Phase 4 Deliverables
- [ ] Experiment patterns schema
- [ ] Pattern instances and survival tracking
- [ ] Survivorship scoring function
- [ ] Propagation scoring function
- [ ] Pattern detection from ship signals
- [ ] Weekly score update job
- [ ] Signal emission for proven patterns

---

## Phase 5: Sector Packs (Week 10-11)
**Goal**: Shared intelligence across users via curated company packs

### 5.1 Sector Pack Schema

```sql
-- File: migrations/phase5_sector_packs.sql

CREATE SCHEMA IF NOT EXISTS sector_packs;

-- Pack definitions
CREATE TABLE sector_packs.packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  pack_slug TEXT NOT NULL UNIQUE, -- 'gtm-engineering', 'devtools', 'cybersecurity'
  pack_name TEXT NOT NULL,
  description TEXT,

  -- Targeting
  sector TEXT NOT NULL,
  motion TEXT, -- 'plg', 'sales_led', 'hybrid'

  -- Configuration
  default_pages TEXT[] DEFAULT ARRAY['homepage', 'pricing', 'customers', 'integrations'],
  crawl_frequency TEXT DEFAULT 'weekly',

  -- Status
  enabled BOOLEAN DEFAULT TRUE,
  company_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies in packs
CREATE TABLE sector_packs.pack_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES sector_packs.packs(id),

  -- Company info
  company_id UUID, -- links to tracked company if exists
  company_name TEXT NOT NULL,
  company_domain TEXT NOT NULL,

  -- Classification
  tier TEXT DEFAULT 'leader', -- 'leader', 'challenger', 'emerging'
  weight NUMERIC DEFAULT 1.0, -- for scoring

  -- Pages to track
  tracked_urls JSONB NOT NULL, -- [{"url": "...", "page_type": "pricing"}]

  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pack_id, company_domain)
);

-- User pack subscriptions
CREATE TABLE sector_packs.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pack_id UUID NOT NULL REFERENCES sector_packs.packs(id),

  is_primary BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pack_id)
);

-- Pack winners (weekly)
CREATE TABLE sector_packs.pack_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES sector_packs.packs(id),
  week_start DATE NOT NULL,

  -- Winners from experiment surveillance
  proven_winners JSONB NOT NULL, -- top 3 proven patterns
  emerging_winners JSONB NOT NULL, -- top 3 emerging patterns

  -- Aggregates
  total_patterns_tracked INT,
  new_patterns_this_week INT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pack_id, week_start)
);

-- Emit pack winners to signals (for subscribed users)
CREATE OR REPLACE FUNCTION sector_packs.emit_winners_to_signals(p_pack_id UUID, p_week_start DATE)
RETURNS void AS $$
DECLARE
  v_winner RECORD;
  v_user RECORD;
BEGIN
  -- Get this week's winners
  SELECT * INTO v_winner
  FROM sector_packs.pack_winners
  WHERE pack_id = p_pack_id AND week_start = p_week_start;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- For each subscribed user, emit pack signals
  FOR v_user IN
    SELECT user_id FROM sector_packs.user_subscriptions WHERE pack_id = p_pack_id
  LOOP
    -- Emit proven winners
    INSERT INTO control_plane.signals (
      id, signal_type, severity, confidence,
      title, summary,
      source_schema, source_table, source_id,
      decision_type, time_sensitivity,
      meta, created_at
    )
    SELECT
      gen_random_uuid(),
      'experiment',
      4,
      0.9,
      'Market Winner: ' || (w->>'pattern_label'),
      w->>'description',
      'sector_packs', 'pack_winners', v_winner.id,
      w->>'category',
      'this_week',
      jsonb_build_object(
        'pack_id', p_pack_id,
        'user_id', v_user.user_id,
        'scope', 'sector_pack',
        'survivorship', w->>'survivorship_score',
        'propagation', w->>'propagation_score'
      ),
      NOW()
    FROM jsonb_array_elements(v_winner.proven_winners) AS w;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 5.2 Initial Sector Packs

```sql
-- Seed initial packs
INSERT INTO sector_packs.packs (pack_slug, pack_name, description, sector, motion) VALUES
  ('gtm-engineering', 'GTM Engineering Leaders', 'Top PLG companies with strong GTM engineering', 'gtm_engineering', 'plg'),
  ('devtools', 'Developer Tools', 'Leading developer tools and platforms', 'devtools', 'plg'),
  ('cybersecurity', 'Cybersecurity', 'Enterprise security vendors', 'cybersecurity', 'sales_led'),
  ('data-ai-infra', 'Data & AI Infrastructure', 'Data platforms and AI infrastructure', 'data_ai', 'hybrid'),
  ('product-analytics', 'Product Analytics', 'Product analytics and experimentation', 'analytics', 'plg');

-- Example: GTM Engineering pack companies
INSERT INTO sector_packs.pack_companies (pack_id, company_name, company_domain, tier, tracked_urls)
SELECT
  p.id,
  c.company_name,
  c.company_domain,
  c.tier,
  c.tracked_urls
FROM sector_packs.packs p
CROSS JOIN (VALUES
  ('Stripe', 'stripe.com', 'leader', '[{"url": "https://stripe.com", "page_type": "homepage"}, {"url": "https://stripe.com/pricing", "page_type": "pricing"}]'::JSONB),
  ('Segment', 'segment.com', 'leader', '[{"url": "https://segment.com", "page_type": "homepage"}, {"url": "https://segment.com/pricing", "page_type": "pricing"}]'::JSONB),
  ('Amplitude', 'amplitude.com', 'leader', '[{"url": "https://amplitude.com", "page_type": "homepage"}, {"url": "https://amplitude.com/pricing", "page_type": "pricing"}]'::JSONB)
  -- Add more companies...
) AS c(company_name, company_domain, tier, tracked_urls)
WHERE p.pack_slug = 'gtm-engineering';
```

### Phase 5 Deliverables
- [ ] Sector pack schema
- [ ] User subscription management
- [ ] Pack winners computation (weekly)
- [ ] Signal emission to subscribed users
- [ ] 5 initial packs seeded with companies
- [ ] Admin UI for pack management

---

## Phase 6: Control Plane Integration (Week 11-12)
**Goal**: Update weekly packet with all new signals + Market Winners section

### 6.1 Update Score + Select Logic

```javascript
// Update SHIP_CAPS to include all signal types
const SHIP_CAPS = {
  messaging: 8,
  narrative: 5,
  icp: 5,
  horizon: 3,
  objection: 5,
  // New ships
  pricing: 4,
  proof: 3,
  distribution: 3,
  hiring: 2,
  launch_decay: 2,
  // Experiment winners
  experiment: 5
};

// Update sections array
const sections = [
  'messaging', 'narrative', 'icp', 'horizon', 'objection',
  'pricing', 'proof', 'distribution', 'hiring', 'launch_decay',
  'experiment'
];

// Add decision type inference for new signals
function inferDecisionType(signal) {
  switch (signal.signal_type) {
    case 'pricing':
      return 'packaging';
    case 'proof':
      return 'proof';
    case 'distribution':
      return 'distribution';
    case 'hiring':
      return 'risk'; // competitive intelligence
    case 'launch_decay':
      return 'positioning';
    case 'experiment':
      return signal.meta?.category || 'positioning';
    // ... existing cases
  }
}
```

### 6.2 Add Market Winners Section to Packet

```javascript
// New packet section structure
interface WeeklyPacket {
  // ... existing sections

  // New section: Market Winners
  market_winners: {
    proven: MarketWinner[];  // max 3
    emerging: MarketWinner[];  // max 3
  };
}

interface MarketWinner {
  pattern_label: string;
  category: string;
  what_changed: string;
  where_seen: string[];  // company names
  survival_weeks: number;
  propagation_count: number;
  why_it_matters: string;
  implementation_guidance: string;
  evidence_urls: string[];
}
```

### 6.3 Update Anthropic Prompt

```javascript
const PACKET_PROMPT = `
You are a senior PMM analyst creating a weekly intelligence packet.

SIGNAL CATEGORIES:
- messaging: Homepage and positioning changes
- narrative: Market narrative shifts
- icp: Target audience signals
- horizon: Platform and market shifts
- objection: Customer objections and concerns
- pricing: Pricing and packaging changes
- proof: Trust signals and social proof
- distribution: Integration and partnership moves
- hiring: Hiring signals indicating strategy
- launch_decay: Post-launch momentum tracking
- experiment: Market-wide pattern winners

NEW SECTION - MARKET WINNERS:
For experiment signals with scope='sector_pack', synthesize into actionable winners:
- What changed (1 line)
- Where it appears (companies)
- Why it matters (decision impact)
- What to do (implementation guidance)

OUTPUT FORMAT:
{
  "packet_title": "...",
  "exec_summary": ["...", "..."],
  "sections": {
    "messaging": { "summary": "...", "highlights": [], "action_items": [] },
    // ... all sections
  },
  "market_winners": {
    "proven": [
      {
        "pattern_label": "...",
        "what_changed": "...",
        "where_seen": ["Company A", "Company B"],
        "survival_weeks": 8,
        "why_it_matters": "...",
        "implementation_guidance": "..."
      }
    ],
    "emerging": [...]
  },
  "key_questions": [...],
  "predictions": [...],
  "action_mapping": {...}
}
`;
```

### Phase 6 Deliverables
- [ ] Score + Select updated for all signal types
- [ ] Parse Packet JSON handles market_winners
- [ ] Anthropic prompt includes all signals
- [ ] Weekly packet includes Market Winners section
- [ ] Builders consume experiment signals
- [ ] End-to-end test of full pipeline

---

## Phase 7: Polish & Optimization (Week 12+)
**Goal**: Production hardening, UI, documentation

### 7.1 Orchestration Improvements
- [ ] Add retry logic to all n8n workflows
- [ ] Implement dead-letter queue for failed runs
- [ ] Add alerting for budget exhaustion
- [ ] Document workflow dependencies

### 7.2 UI Additions
- [ ] Sector pack selection in onboarding
- [ ] Market Winners card component
- [ ] Cost dashboard (admin)
- [ ] Ship status dashboard

### 7.3 Documentation
- [ ] Ship architecture diagram
- [ ] Signal flow documentation
- [ ] API documentation for pack management
- [ ] Runbook for common issues

---

## Summary: Implementation Timeline

| Phase | Weeks | Focus | Key Deliverables |
|-------|-------|-------|------------------|
| **0** | 1-2 | Foundation | Signal types, page types, cost telemetry |
| **1** | 2-3 | Feature Extraction | Deterministic extractor, diff calculator, LLM gating |
| **2** | 3-6 | Core Ships | Pricing, Proof, Hiring ships |
| **3** | 6-8 | Additional Ships | Distribution, Launch Decay ships |
| **4** | 8-10 | Experiment Surveillance | Pattern detection, survivorship, propagation |
| **5** | 10-11 | Sector Packs | Pack schema, subscriptions, winner computation |
| **6** | 11-12 | Control Plane Integration | Full packet with all signals + Market Winners |
| **7** | 12+ | Polish | UI, docs, optimization |

---

## Cost Projections (Per Week, 100 Users)

| Component | Pages/Calls | Est. Cost |
|-----------|-------------|-----------|
| Personal tracking (5 companies × 5 pages × 100 users) | 2,500 pages | ~$25 (headless) |
| Sector packs (5 packs × 10 companies × 5 pages) | 250 pages (shared) | ~$5 (headless) |
| LLM calls (with gating, ~30% pages have changes) | ~800 calls | ~$40 (Anthropic) |
| Packet generation (100 users × 1 packet) | 100 calls | ~$10 (Anthropic) |
| **Total** | | **~$80/week** |

With full gating + batching, target: **< $1/user/week**

---

## Open Decisions

1. **Phase 1**: Which page types get headless vs HTML-only fetch?
2. **Phase 2**: Hiring ship - which ATS types to support initially?
3. **Phase 4**: Pattern promotion thresholds (weeks, company count)?
4. **Phase 5**: How many companies per sector pack?
5. **Phase 6**: Should Market Winners be a separate email or part of weekly packet?

---

## Next Steps

1. Review and approve this plan
2. Create GitHub issues for Phase 0 tasks
3. Begin Phase 0 implementation
4. Weekly check-ins on progress

