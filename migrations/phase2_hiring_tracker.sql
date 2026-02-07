-- Phase 2.3: Hiring Signal Monitor
-- Tracks job postings from public ATS APIs (Lever, Greenhouse)

CREATE SCHEMA IF NOT EXISTS hiring_tracker;

-- ATS sources per company
CREATE TABLE IF NOT EXISTS hiring_tracker.company_ats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  ats_type TEXT NOT NULL, -- 'lever', 'greenhouse', 'ashby', 'workday'
  ats_company_slug TEXT NOT NULL, -- e.g., 'stripe' for jobs.lever.co/stripe
  api_endpoint TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, ats_type)
);

CREATE INDEX IF NOT EXISTS idx_company_ats_enabled
  ON hiring_tracker.company_ats(enabled) WHERE enabled = true;

-- Job snapshots (weekly)
CREATE TABLE IF NOT EXISTS hiring_tracker.job_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  ats_id UUID REFERENCES hiring_tracker.company_ats(id),
  snapshot_date DATE NOT NULL,

  -- Aggregates
  total_open_roles INT,
  roles_by_department JSONB, -- {"engineering": 15, "sales": 8, "marketing": 3}
  roles_by_level JSONB, -- {"senior": 10, "staff": 3, "director": 2}
  roles_by_location JSONB, -- {"remote": 5, "san_francisco": 10}

  -- Notable roles (PMM-relevant)
  pmm_roles INT DEFAULT 0,
  solutions_roles INT DEFAULT 0,
  enterprise_sales_roles INT DEFAULT 0,
  gtm_engineering_roles INT DEFAULT 0,

  -- Raw job list for diff
  job_list JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_job_snapshots_company
  ON hiring_tracker.job_snapshots(company_id, snapshot_date DESC);

-- Hiring changes
CREATE TABLE IF NOT EXISTS hiring_tracker.hiring_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  old_snapshot_id UUID REFERENCES hiring_tracker.job_snapshots(id),
  new_snapshot_id UUID REFERENCES hiring_tracker.job_snapshots(id),
  detected_at DATE NOT NULL,

  -- Change classification
  change_type TEXT NOT NULL, -- 'surge', 'freeze', 'pivot', 'department_expansion', 'gtm_investment'
  department TEXT,
  change_magnitude INT, -- +/- count

  -- Interpretation
  strategic_signal TEXT, -- 'gtm_expansion', 'product_investment', 'enterprise_push', 'international'
  notable_roles_added TEXT[],
  confidence NUMERIC,

  -- Signal emission
  signal_emitted BOOLEAN DEFAULT FALSE,
  signal_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hiring_changes_company
  ON hiring_tracker.hiring_changes(company_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_hiring_changes_type
  ON hiring_tracker.hiring_changes(change_type);

-- Function to parse Lever API response
CREATE OR REPLACE FUNCTION hiring_tracker.parse_lever_response(
  p_company_id UUID,
  p_ats_id UUID,
  p_jobs_json JSONB
) RETURNS UUID AS $$
DECLARE
  v_snapshot_id UUID;
  v_today DATE := CURRENT_DATE;
  v_total INT;
  v_by_department JSONB;
  v_by_level JSONB;
  v_pmm_count INT := 0;
  v_solutions_count INT := 0;
  v_enterprise_sales_count INT := 0;
  v_gtm_eng_count INT := 0;
  v_job JSONB;
  v_title TEXT;
  v_team TEXT;
BEGIN
  v_total := jsonb_array_length(p_jobs_json);

  -- Aggregate by department/team
  SELECT jsonb_object_agg(team, cnt) INTO v_by_department
  FROM (
    SELECT COALESCE(j->>'team', 'unknown') as team, COUNT(*) as cnt
    FROM jsonb_array_elements(p_jobs_json) j
    GROUP BY 1
  ) t;

  -- Count notable roles
  FOR v_job IN SELECT * FROM jsonb_array_elements(p_jobs_json)
  LOOP
    v_title := LOWER(COALESCE(v_job->>'text', ''));
    v_team := LOWER(COALESCE(v_job->>'team', ''));

    IF v_title LIKE '%product marketing%' OR v_title LIKE '%pmm%' THEN
      v_pmm_count := v_pmm_count + 1;
    END IF;

    IF v_title LIKE '%solutions%' OR v_title LIKE '%technical account%' THEN
      v_solutions_count := v_solutions_count + 1;
    END IF;

    IF v_title LIKE '%enterprise%' AND (v_title LIKE '%sales%' OR v_title LIKE '%account exec%') THEN
      v_enterprise_sales_count := v_enterprise_sales_count + 1;
    END IF;

    IF v_title LIKE '%growth%' OR v_title LIKE '%gtm%' OR (v_team LIKE '%growth%') THEN
      v_gtm_eng_count := v_gtm_eng_count + 1;
    END IF;
  END LOOP;

  -- Upsert snapshot
  INSERT INTO hiring_tracker.job_snapshots (
    company_id, ats_id, snapshot_date,
    total_open_roles, roles_by_department, roles_by_level,
    pmm_roles, solutions_roles, enterprise_sales_roles, gtm_engineering_roles,
    job_list
  ) VALUES (
    p_company_id, p_ats_id, v_today,
    v_total, v_by_department, '{}'::jsonb,
    v_pmm_count, v_solutions_count, v_enterprise_sales_count, v_gtm_eng_count,
    p_jobs_json
  )
  ON CONFLICT (company_id, snapshot_date) DO UPDATE SET
    total_open_roles = EXCLUDED.total_open_roles,
    roles_by_department = EXCLUDED.roles_by_department,
    pmm_roles = EXCLUDED.pmm_roles,
    solutions_roles = EXCLUDED.solutions_roles,
    enterprise_sales_roles = EXCLUDED.enterprise_sales_roles,
    gtm_engineering_roles = EXCLUDED.gtm_engineering_roles,
    job_list = EXCLUDED.job_list
  RETURNING id INTO v_snapshot_id;

  -- Update last fetched
  UPDATE hiring_tracker.company_ats
  SET last_fetched_at = NOW()
  WHERE id = p_ats_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- Function to detect hiring changes
CREATE OR REPLACE FUNCTION hiring_tracker.detect_changes(
  p_company_id UUID,
  p_new_snapshot_id UUID
) RETURNS SETOF hiring_tracker.hiring_changes AS $$
DECLARE
  v_old_snapshot RECORD;
  v_new_snapshot RECORD;
  v_change_id UUID;
  v_delta INT;
  v_dept TEXT;
  v_old_count INT;
  v_new_count INT;
BEGIN
  SELECT * INTO v_new_snapshot
  FROM hiring_tracker.job_snapshots
  WHERE id = p_new_snapshot_id;

  SELECT * INTO v_old_snapshot
  FROM hiring_tracker.job_snapshots
  WHERE company_id = p_company_id
    AND snapshot_date < v_new_snapshot.snapshot_date
  ORDER BY snapshot_date DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_delta := v_new_snapshot.total_open_roles - v_old_snapshot.total_open_roles;

  -- Hiring surge (> 20% increase or +10 roles)
  IF v_delta > 10 OR (v_old_snapshot.total_open_roles > 0 AND v_delta::float / v_old_snapshot.total_open_roles > 0.2) THEN
    INSERT INTO hiring_tracker.hiring_changes (
      company_id, old_snapshot_id, new_snapshot_id, detected_at,
      change_type, change_magnitude, strategic_signal
    ) VALUES (
      p_company_id, v_old_snapshot.id, p_new_snapshot_id, CURRENT_DATE,
      'surge', v_delta, 'company_scaling'
    ) RETURNING * INTO v_change_id;
    RETURN NEXT (SELECT * FROM hiring_tracker.hiring_changes WHERE id = v_change_id);
  END IF;

  -- Hiring freeze (> 20% decrease or -10 roles)
  IF v_delta < -10 OR (v_old_snapshot.total_open_roles > 0 AND v_delta::float / v_old_snapshot.total_open_roles < -0.2) THEN
    INSERT INTO hiring_tracker.hiring_changes (
      company_id, old_snapshot_id, new_snapshot_id, detected_at,
      change_type, change_magnitude, strategic_signal
    ) VALUES (
      p_company_id, v_old_snapshot.id, p_new_snapshot_id, CURRENT_DATE,
      'freeze', v_delta, 'cost_cutting'
    ) RETURNING * INTO v_change_id;
    RETURN NEXT (SELECT * FROM hiring_tracker.hiring_changes WHERE id = v_change_id);
  END IF;

  -- GTM investment signal
  IF (v_new_snapshot.pmm_roles > v_old_snapshot.pmm_roles)
     OR (v_new_snapshot.enterprise_sales_roles > v_old_snapshot.enterprise_sales_roles + 2)
     OR (v_new_snapshot.solutions_roles > v_old_snapshot.solutions_roles + 2) THEN
    INSERT INTO hiring_tracker.hiring_changes (
      company_id, old_snapshot_id, new_snapshot_id, detected_at,
      change_type, strategic_signal, notable_roles_added
    ) VALUES (
      p_company_id, v_old_snapshot.id, p_new_snapshot_id, CURRENT_DATE,
      'gtm_investment', 'enterprise_push',
      ARRAY['PMM', 'Enterprise Sales', 'Solutions']
    ) RETURNING * INTO v_change_id;
    RETURN NEXT (SELECT * FROM hiring_tracker.hiring_changes WHERE id = v_change_id);
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to emit hiring signal to Control Plane
CREATE OR REPLACE FUNCTION hiring_tracker.emit_signal(p_change_id UUID)
RETURNS UUID AS $$
DECLARE
  v_change RECORD;
  v_signal_id UUID;
  v_title TEXT;
  v_severity INT;
BEGIN
  SELECT hc.*, js.total_open_roles, js.pmm_roles, js.enterprise_sales_roles
  INTO v_change
  FROM hiring_tracker.hiring_changes hc
  JOIN hiring_tracker.job_snapshots js ON js.id = hc.new_snapshot_id
  WHERE hc.id = p_change_id;

  v_title := CASE v_change.change_type
    WHEN 'surge' THEN 'Hiring surge: +' || v_change.change_magnitude || ' roles'
    WHEN 'freeze' THEN 'Hiring freeze: ' || v_change.change_magnitude || ' roles'
    WHEN 'gtm_investment' THEN 'GTM investment signal: new PMM/Sales roles'
    WHEN 'pivot' THEN 'Department pivot detected'
    ELSE 'Hiring signal detected'
  END;

  v_severity := CASE v_change.change_type
    WHEN 'surge' THEN 3
    WHEN 'freeze' THEN 4
    WHEN 'gtm_investment' THEN 3
    ELSE 2
  END;

  INSERT INTO control_plane.signals (
    id, signal_type, company_id, severity, confidence,
    title, summary, evidence_urls,
    source_schema, source_table, source_id,
    decision_type, time_sensitivity,
    meta, created_at
  ) VALUES (
    gen_random_uuid(),
    'hiring',
    v_change.company_id,
    v_severity,
    0.9, -- High confidence from structured data
    v_title,
    'Hiring pattern indicates ' || COALESCE(v_change.strategic_signal, 'strategic shift'),
    ARRAY[]::TEXT[],
    'hiring_tracker', 'hiring_changes', v_change.id,
    'risk', -- Hiring signals affect competitive positioning
    'this_week',
    jsonb_build_object(
      'change_type', v_change.change_type,
      'magnitude', v_change.change_magnitude,
      'total_roles', v_change.total_open_roles,
      'notable_roles', v_change.notable_roles_added
    ),
    NOW()
  )
  RETURNING id INTO v_signal_id;

  UPDATE hiring_tracker.hiring_changes
  SET signal_emitted = true, signal_id = v_signal_id
  WHERE id = p_change_id;

  RETURN v_signal_id;
END;
$$ LANGUAGE plpgsql;

-- Seed some known ATS endpoints
-- Lever: https://api.lever.co/v0/postings/{company}?mode=json
-- Greenhouse: https://boards-api.greenhouse.io/v1/boards/{company}/jobs

INSERT INTO hiring_tracker.company_ats (company_id, company_name, ats_type, ats_company_slug, api_endpoint)
VALUES
  (gen_random_uuid(), 'Stripe', 'lever', 'stripe', 'https://api.lever.co/v0/postings/stripe?mode=json'),
  (gen_random_uuid(), 'Segment', 'lever', 'segment', 'https://api.lever.co/v0/postings/segment?mode=json'),
  (gen_random_uuid(), 'Amplitude', 'greenhouse', 'amplitude', 'https://boards-api.greenhouse.io/v1/boards/amplitude/jobs')
ON CONFLICT DO NOTHING;
