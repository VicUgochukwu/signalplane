-- Phase 4: Experiment Surveillance
-- Detect experiments, score survivorship + propagation, emit winners
-- Created: 2026-02-06

-- =========================================
-- SCHEMA
-- =========================================
CREATE SCHEMA IF NOT EXISTS experiment_surveillance;

-- =========================================
-- EXPERIMENT PATTERNS (cross-company)
-- =========================================
CREATE TABLE IF NOT EXISTS experiment_surveillance.patterns (
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

CREATE INDEX IF NOT EXISTS idx_patterns_status ON experiment_surveillance.patterns(status);
CREATE INDEX IF NOT EXISTS idx_patterns_category ON experiment_surveillance.patterns(pattern_category);
CREATE INDEX IF NOT EXISTS idx_patterns_combined_score ON experiment_surveillance.patterns(combined_score DESC);

-- =========================================
-- PATTERN INSTANCES (observations)
-- =========================================
CREATE TABLE IF NOT EXISTS experiment_surveillance.pattern_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID NOT NULL REFERENCES experiment_surveillance.patterns(id) ON DELETE CASCADE,

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
  detection_method TEXT, -- 'feature_diff', 'llm_classification', 'ship_signal'
  confidence NUMERIC,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pattern_id, company_id, page_type, observed_at)
);

CREATE INDEX IF NOT EXISTS idx_pattern_instances_pattern ON experiment_surveillance.pattern_instances(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_instances_company ON experiment_surveillance.pattern_instances(company_id);
CREATE INDEX IF NOT EXISTS idx_pattern_instances_observed ON experiment_surveillance.pattern_instances(observed_at DESC);

-- =========================================
-- SURVIVORSHIP TRACKING (weekly rollups)
-- =========================================
CREATE TABLE IF NOT EXISTS experiment_surveillance.pattern_survival (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID NOT NULL REFERENCES experiment_surveillance.patterns(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  week_start DATE NOT NULL,

  -- Survival metrics
  consecutive_weeks INT NOT NULL,
  still_present BOOLEAN NOT NULL,
  reverted BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pattern_id, company_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_pattern_survival_pattern ON experiment_surveillance.pattern_survival(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_survival_week ON experiment_surveillance.pattern_survival(week_start DESC);

-- =========================================
-- SIGNAL EMISSIONS (track which patterns emitted signals)
-- =========================================
CREATE TABLE IF NOT EXISTS experiment_surveillance.signal_emissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID NOT NULL REFERENCES experiment_surveillance.patterns(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES control_plane.signals(id),
  emission_type TEXT NOT NULL, -- 'proven', 'emerging', 'weekly_winner'
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pattern_id, emission_type, week_start)
);

-- =========================================
-- SURVIVORSHIP SCORING FUNCTION
-- =========================================
CREATE OR REPLACE FUNCTION experiment_surveillance.compute_survivorship(p_pattern_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_score NUMERIC := 0;
  v_company_count INT;
  v_max_weeks INT;
  v_reverted_count INT;
BEGIN
  -- Count companies where pattern survived 4+ weeks
  SELECT COUNT(DISTINCT company_id), COALESCE(MAX(consecutive_weeks), 0)
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

-- =========================================
-- PROPAGATION SCORING FUNCTION
-- =========================================
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
  SELECT COALESCE(EXTRACT(WEEK FROM (MAX(observed_at) - MIN(observed_at))), 0)::INT
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

-- =========================================
-- UPDATE PATTERN SCORES (run weekly)
-- =========================================
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
      WHEN p.last_seen < CURRENT_DATE - INTERVAL '4 weeks' THEN 'fading'
      ELSE 'candidate'
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- DETECT PATTERN FROM SHIP SIGNALS
-- =========================================
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
  v_pattern_label TEXT;
  v_category TEXT;
BEGIN
  -- Normalize pattern key from change
  v_pattern_key := p_source_schema || ':' || p_change_type || ':' ||
    COALESCE(p_change_details->>'variant', 'default');

  -- Create human-readable label
  v_pattern_label := REPLACE(p_change_type, '_', ' ');
  v_pattern_label := UPPER(SUBSTRING(v_pattern_label FROM 1 FOR 1)) || SUBSTRING(v_pattern_label FROM 2);

  -- Determine category based on source schema
  v_category := CASE p_source_schema
    WHEN 'pricing_tracker' THEN 'packaging'
    WHEN 'proof_tracker' THEN 'proof'
    WHEN 'distribution_tracker' THEN 'distribution'
    WHEN 'launch_tracker' THEN 'positioning'
    WHEN 'hiring_tracker' THEN 'strategy'
    ELSE 'positioning'
  END;

  -- Upsert pattern
  INSERT INTO experiment_surveillance.patterns (
    id, pattern_key, pattern_label, pattern_category, first_seen, last_seen
  ) VALUES (
    gen_random_uuid(),
    v_pattern_key,
    v_pattern_label,
    v_category,
    CURRENT_DATE,
    CURRENT_DATE
  )
  ON CONFLICT (pattern_key) DO UPDATE SET
    last_seen = CURRENT_DATE,
    updated_at = NOW()
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

-- =========================================
-- UPDATE SURVIVAL TRACKING (run weekly)
-- =========================================
CREATE OR REPLACE FUNCTION experiment_surveillance.update_survival_tracking()
RETURNS void AS $$
DECLARE
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
  v_pattern RECORD;
  v_company RECORD;
  v_previous RECORD;
  v_still_present BOOLEAN;
  v_consecutive INT;
BEGIN
  -- For each pattern
  FOR v_pattern IN SELECT id FROM experiment_surveillance.patterns WHERE status != 'fading' LOOP
    -- For each company that has observed this pattern
    FOR v_company IN
      SELECT DISTINCT company_id
      FROM experiment_surveillance.pattern_instances
      WHERE pattern_id = v_pattern.id
    LOOP
      -- Check if pattern was observed this week
      SELECT EXISTS(
        SELECT 1 FROM experiment_surveillance.pattern_instances
        WHERE pattern_id = v_pattern.id
          AND company_id = v_company.company_id
          AND observed_at >= v_week_start
      ) INTO v_still_present;

      -- Get previous week's survival record
      SELECT * INTO v_previous
      FROM experiment_surveillance.pattern_survival
      WHERE pattern_id = v_pattern.id
        AND company_id = v_company.company_id
        AND week_start = v_week_start - INTERVAL '7 days';

      -- Calculate consecutive weeks
      IF v_still_present THEN
        v_consecutive := COALESCE(v_previous.consecutive_weeks, 0) + 1;
      ELSE
        v_consecutive := 0;
      END IF;

      -- Upsert survival record
      INSERT INTO experiment_surveillance.pattern_survival (
        pattern_id, company_id, week_start,
        consecutive_weeks, still_present,
        reverted
      ) VALUES (
        v_pattern.id, v_company.company_id, v_week_start,
        v_consecutive, v_still_present,
        NOT v_still_present AND COALESCE(v_previous.consecutive_weeks, 0) >= 2
      )
      ON CONFLICT (pattern_id, company_id, week_start) DO UPDATE SET
        consecutive_weeks = EXCLUDED.consecutive_weeks,
        still_present = EXCLUDED.still_present,
        reverted = EXCLUDED.reverted;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- EMIT SIGNAL FOR PROVEN PATTERNS
-- =========================================
CREATE OR REPLACE FUNCTION experiment_surveillance.emit_proven_patterns()
RETURNS INT AS $$
DECLARE
  v_pattern RECORD;
  v_signal_id UUID;
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
  v_count INT := 0;
  v_companies TEXT[];
  v_evidence TEXT[];
BEGIN
  -- Find proven patterns not yet emitted this week
  FOR v_pattern IN
    SELECT p.*
    FROM experiment_surveillance.patterns p
    WHERE p.status = 'proven'
      AND NOT EXISTS (
        SELECT 1 FROM experiment_surveillance.signal_emissions se
        WHERE se.pattern_id = p.id
          AND se.emission_type = 'proven'
          AND se.week_start = v_week_start
      )
    ORDER BY p.combined_score DESC
    LIMIT 5
  LOOP
    -- Get companies where pattern is present
    SELECT ARRAY_AGG(DISTINCT c.name)
    INTO v_companies
    FROM experiment_surveillance.pattern_instances pi
    JOIN public.companies c ON c.id = pi.company_id
    WHERE pi.pattern_id = v_pattern.id
      AND pi.observed_at >= CURRENT_DATE - INTERVAL '30 days'
    LIMIT 5;

    -- Get evidence URLs
    SELECT ARRAY_AGG(DISTINCT evidence_url)
    INTO v_evidence
    FROM experiment_surveillance.pattern_instances
    WHERE pattern_id = v_pattern.id
      AND evidence_url IS NOT NULL
    LIMIT 3;

    -- Create signal
    INSERT INTO control_plane.signals (
      id, signal_type, severity, confidence,
      title, summary, evidence_urls,
      source_schema, source_table, source_id,
      decision_type, time_sensitivity,
      meta, created_at
    ) VALUES (
      gen_random_uuid(),
      'experiment',
      4, -- high severity for proven patterns
      0.9,
      'Market Winner: ' || v_pattern.pattern_label,
      'Pattern observed across ' || COALESCE(ARRAY_LENGTH(v_companies, 1), 0) ||
        ' companies with ' || v_pattern.survivorship_score || ' survivorship score. ' ||
        'Category: ' || v_pattern.pattern_category,
      COALESCE(v_evidence, ARRAY[]::TEXT[]),
      'experiment_surveillance', 'patterns', v_pattern.id,
      v_pattern.pattern_category,
      'this_week',
      jsonb_build_object(
        'pattern_key', v_pattern.pattern_key,
        'survivorship_score', v_pattern.survivorship_score,
        'propagation_score', v_pattern.propagation_score,
        'combined_score', v_pattern.combined_score,
        'companies', v_companies,
        'first_seen', v_pattern.first_seen,
        'scope', 'experiment_surveillance'
      ),
      NOW()
    )
    RETURNING id INTO v_signal_id;

    -- Record emission
    INSERT INTO experiment_surveillance.signal_emissions (
      pattern_id, signal_id, emission_type, week_start
    ) VALUES (
      v_pattern.id, v_signal_id, 'proven', v_week_start
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- EMIT SIGNAL FOR EMERGING PATTERNS
-- =========================================
CREATE OR REPLACE FUNCTION experiment_surveillance.emit_emerging_patterns()
RETURNS INT AS $$
DECLARE
  v_pattern RECORD;
  v_signal_id UUID;
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
  v_count INT := 0;
  v_companies TEXT[];
BEGIN
  -- Find emerging patterns not yet emitted this week
  FOR v_pattern IN
    SELECT p.*
    FROM experiment_surveillance.patterns p
    WHERE p.status = 'emerging'
      AND NOT EXISTS (
        SELECT 1 FROM experiment_surveillance.signal_emissions se
        WHERE se.pattern_id = p.id
          AND se.emission_type = 'emerging'
          AND se.week_start = v_week_start
      )
    ORDER BY p.combined_score DESC
    LIMIT 3
  LOOP
    -- Get companies
    SELECT ARRAY_AGG(DISTINCT c.name)
    INTO v_companies
    FROM experiment_surveillance.pattern_instances pi
    JOIN public.companies c ON c.id = pi.company_id
    WHERE pi.pattern_id = v_pattern.id
    LIMIT 3;

    -- Create signal
    INSERT INTO control_plane.signals (
      id, signal_type, severity, confidence,
      title, summary,
      source_schema, source_table, source_id,
      decision_type, time_sensitivity,
      meta, created_at
    ) VALUES (
      gen_random_uuid(),
      'experiment',
      2, -- lower severity for emerging
      0.7,
      'Emerging Pattern: ' || v_pattern.pattern_label,
      'Pattern gaining traction. Category: ' || v_pattern.pattern_category,
      'experiment_surveillance', 'patterns', v_pattern.id,
      v_pattern.pattern_category,
      'monitor',
      jsonb_build_object(
        'pattern_key', v_pattern.pattern_key,
        'survivorship_score', v_pattern.survivorship_score,
        'propagation_score', v_pattern.propagation_score,
        'companies', v_companies,
        'scope', 'experiment_surveillance'
      ),
      NOW()
    )
    RETURNING id INTO v_signal_id;

    -- Record emission
    INSERT INTO experiment_surveillance.signal_emissions (
      pattern_id, signal_id, emission_type, week_start
    ) VALUES (
      v_pattern.id, v_signal_id, 'emerging', v_week_start
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- WEEKLY MAINTENANCE FUNCTION
-- =========================================
CREATE OR REPLACE FUNCTION experiment_surveillance.run_weekly_maintenance()
RETURNS TABLE (
  survival_updated INT,
  scores_updated INT,
  proven_signals INT,
  emerging_signals INT
) AS $$
DECLARE
  v_survival INT;
  v_proven INT;
  v_emerging INT;
BEGIN
  -- Update survival tracking
  PERFORM experiment_surveillance.update_survival_tracking();
  GET DIAGNOSTICS v_survival = ROW_COUNT;

  -- Update pattern scores
  PERFORM experiment_surveillance.update_pattern_scores();

  -- Emit proven patterns
  SELECT experiment_surveillance.emit_proven_patterns() INTO v_proven;

  -- Emit emerging patterns
  SELECT experiment_surveillance.emit_emerging_patterns() INTO v_emerging;

  RETURN QUERY SELECT
    v_survival,
    (SELECT COUNT(*)::INT FROM experiment_surveillance.patterns),
    v_proven,
    v_emerging;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- VIEWS
-- =========================================

-- View: Top patterns by combined score
CREATE OR REPLACE VIEW experiment_surveillance.top_patterns AS
SELECT
  p.id,
  p.pattern_key,
  p.pattern_label,
  p.pattern_category,
  p.status,
  p.survivorship_score,
  p.propagation_score,
  p.combined_score,
  p.first_seen,
  p.last_seen,
  COUNT(DISTINCT pi.company_id) AS company_count,
  COUNT(pi.id) AS instance_count
FROM experiment_surveillance.patterns p
LEFT JOIN experiment_surveillance.pattern_instances pi ON pi.pattern_id = p.id
GROUP BY p.id
ORDER BY p.combined_score DESC;

-- View: Recent pattern instances
CREATE OR REPLACE VIEW experiment_surveillance.recent_instances AS
SELECT
  pi.*,
  p.pattern_label,
  p.pattern_category,
  p.status AS pattern_status,
  c.name AS company_name
FROM experiment_surveillance.pattern_instances pi
JOIN experiment_surveillance.patterns p ON p.id = pi.pattern_id
LEFT JOIN public.companies c ON c.id = pi.company_id
WHERE pi.observed_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY pi.observed_at DESC;

-- =========================================
-- ADD EXPERIMENT TO SIGNAL TYPE CONSTRAINT
-- =========================================
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE control_plane.signals
    DROP CONSTRAINT IF EXISTS signals_signal_type_check;

  -- Add updated constraint including 'experiment'
  ALTER TABLE control_plane.signals
    ADD CONSTRAINT signals_signal_type_check CHECK (
      signal_type IN (
        'messaging', 'narrative', 'icp', 'horizon', 'objection',
        'pricing', 'proof', 'distribution', 'hiring', 'launch_decay',
        'experiment'
      )
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Signal type constraint update skipped: %', SQLERRM;
END $$;

-- =========================================
-- GRANT PERMISSIONS
-- =========================================
GRANT USAGE ON SCHEMA experiment_surveillance TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA experiment_surveillance TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA experiment_surveillance TO authenticated;

-- =========================================
-- COMMENTS
-- =========================================
COMMENT ON SCHEMA experiment_surveillance IS 'Tracks cross-company experiment patterns, survivorship, and propagation';
COMMENT ON TABLE experiment_surveillance.patterns IS 'Experiment patterns observed across companies';
COMMENT ON TABLE experiment_surveillance.pattern_instances IS 'Individual observations of patterns at specific companies';
COMMENT ON TABLE experiment_surveillance.pattern_survival IS 'Weekly survival tracking for patterns by company';
COMMENT ON FUNCTION experiment_surveillance.compute_survivorship IS 'Calculates survivorship score based on consecutive weeks and company count';
COMMENT ON FUNCTION experiment_surveillance.compute_propagation IS 'Calculates propagation score based on spread velocity';
COMMENT ON FUNCTION experiment_surveillance.detect_pattern IS 'Detects and records pattern from ship signal changes';
COMMENT ON FUNCTION experiment_surveillance.run_weekly_maintenance IS 'Runs all weekly maintenance: survival tracking, scoring, signal emission';
