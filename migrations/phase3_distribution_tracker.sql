-- Phase 3.1: Distribution Move Monitor
-- Tracks integration pages, marketplace presence, and partner announcements

CREATE SCHEMA IF NOT EXISTS distribution_tracker;

-- Integration snapshots
CREATE TABLE IF NOT EXISTS distribution_tracker.integration_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  tracked_page_id UUID,
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

  -- Raw backup
  page_features_id UUID,
  content_hash TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_integration_snapshots_company
  ON distribution_tracker.integration_snapshots(company_id, snapshot_date DESC);

-- Distribution changes
CREATE TABLE IF NOT EXISTS distribution_tracker.distribution_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  old_snapshot_id UUID REFERENCES distribution_tracker.integration_snapshots(id),
  new_snapshot_id UUID REFERENCES distribution_tracker.integration_snapshots(id),
  detected_at DATE NOT NULL,

  -- Change classification
  change_type TEXT NOT NULL, -- 'integration_added', 'integration_removed', 'marketplace_listed', 'category_expansion', 'partner_announced', 'api_launched'
  change_details JSONB NOT NULL,
  significance TEXT NOT NULL, -- 'major', 'minor'

  -- LLM interpretation
  interpretation TEXT,
  strategic_signal TEXT, -- 'ecosystem_play', 'platform_adjacency', 'channel_expansion', 'api_first'
  confidence NUMERIC,

  -- Signal emission
  signal_emitted BOOLEAN DEFAULT FALSE,
  signal_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_distribution_changes_company
  ON distribution_tracker.distribution_changes(company_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_distribution_changes_type
  ON distribution_tracker.distribution_changes(change_type);

-- Function to upsert integration snapshot
CREATE OR REPLACE FUNCTION distribution_tracker.upsert_snapshot(
  p_company_id UUID,
  p_tracked_page_id UUID,
  p_integration_count INT,
  p_integration_names TEXT[],
  p_integration_categories JSONB,
  p_marketplace_presence TEXT[],
  p_partner_mentions TEXT[],
  p_has_public_api BOOLEAN,
  p_api_doc_url TEXT,
  p_page_features_id UUID DEFAULT NULL,
  p_content_hash TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_snapshot_id UUID;
  v_today DATE := CURRENT_DATE;
BEGIN
  INSERT INTO distribution_tracker.integration_snapshots (
    company_id, tracked_page_id, snapshot_date,
    integration_count, integration_names, integration_categories,
    marketplace_presence, partner_mentions,
    has_public_api, api_doc_url,
    page_features_id, content_hash
  ) VALUES (
    p_company_id, p_tracked_page_id, v_today,
    p_integration_count, p_integration_names, p_integration_categories,
    p_marketplace_presence, p_partner_mentions,
    p_has_public_api, p_api_doc_url,
    p_page_features_id, p_content_hash
  )
  ON CONFLICT (company_id, snapshot_date) DO UPDATE SET
    integration_count = EXCLUDED.integration_count,
    integration_names = EXCLUDED.integration_names,
    integration_categories = EXCLUDED.integration_categories,
    marketplace_presence = EXCLUDED.marketplace_presence,
    partner_mentions = EXCLUDED.partner_mentions,
    has_public_api = EXCLUDED.has_public_api,
    api_doc_url = EXCLUDED.api_doc_url,
    page_features_id = EXCLUDED.page_features_id,
    content_hash = EXCLUDED.content_hash
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- Function to detect distribution changes
CREATE OR REPLACE FUNCTION distribution_tracker.detect_changes(
  p_company_id UUID,
  p_new_snapshot_id UUID
) RETURNS SETOF distribution_tracker.distribution_changes AS $$
DECLARE
  v_old_snapshot RECORD;
  v_new_snapshot RECORD;
  v_change_id UUID;
  v_integrations_added TEXT[];
  v_integrations_removed TEXT[];
  v_marketplaces_added TEXT[];
BEGIN
  -- Get new snapshot
  SELECT * INTO v_new_snapshot
  FROM distribution_tracker.integration_snapshots
  WHERE id = p_new_snapshot_id;

  -- Get previous snapshot
  SELECT * INTO v_old_snapshot
  FROM distribution_tracker.integration_snapshots
  WHERE company_id = p_company_id
    AND snapshot_date < v_new_snapshot.snapshot_date
  ORDER BY snapshot_date DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Check for integrations added
  SELECT array_agg(name) INTO v_integrations_added
  FROM unnest(v_new_snapshot.integration_names) AS name
  WHERE name NOT IN (SELECT unnest(v_old_snapshot.integration_names));

  IF array_length(v_integrations_added, 1) > 0 THEN
    INSERT INTO distribution_tracker.distribution_changes (
      company_id, old_snapshot_id, new_snapshot_id, detected_at,
      change_type, change_details, significance
    ) VALUES (
      p_company_id, v_old_snapshot.id, p_new_snapshot_id, CURRENT_DATE,
      'integration_added',
      jsonb_build_object('integrations_added', v_integrations_added, 'old_count', v_old_snapshot.integration_count, 'new_count', v_new_snapshot.integration_count),
      CASE WHEN array_length(v_integrations_added, 1) >= 3 THEN 'major' ELSE 'minor' END
    ) RETURNING * INTO v_change_id;
    RETURN NEXT (SELECT * FROM distribution_tracker.distribution_changes WHERE id = v_change_id);
  END IF;

  -- Check for integrations removed
  SELECT array_agg(name) INTO v_integrations_removed
  FROM unnest(v_old_snapshot.integration_names) AS name
  WHERE name NOT IN (SELECT unnest(v_new_snapshot.integration_names));

  IF array_length(v_integrations_removed, 1) > 0 THEN
    INSERT INTO distribution_tracker.distribution_changes (
      company_id, old_snapshot_id, new_snapshot_id, detected_at,
      change_type, change_details, significance
    ) VALUES (
      p_company_id, v_old_snapshot.id, p_new_snapshot_id, CURRENT_DATE,
      'integration_removed',
      jsonb_build_object('integrations_removed', v_integrations_removed),
      'minor'
    ) RETURNING * INTO v_change_id;
    RETURN NEXT (SELECT * FROM distribution_tracker.distribution_changes WHERE id = v_change_id);
  END IF;

  -- Check for marketplace additions
  SELECT array_agg(mp) INTO v_marketplaces_added
  FROM unnest(v_new_snapshot.marketplace_presence) AS mp
  WHERE mp NOT IN (SELECT unnest(v_old_snapshot.marketplace_presence));

  IF array_length(v_marketplaces_added, 1) > 0 THEN
    INSERT INTO distribution_tracker.distribution_changes (
      company_id, old_snapshot_id, new_snapshot_id, detected_at,
      change_type, change_details, significance
    ) VALUES (
      p_company_id, v_old_snapshot.id, p_new_snapshot_id, CURRENT_DATE,
      'marketplace_listed',
      jsonb_build_object('marketplaces_added', v_marketplaces_added),
      'major'
    ) RETURNING * INTO v_change_id;
    RETURN NEXT (SELECT * FROM distribution_tracker.distribution_changes WHERE id = v_change_id);
  END IF;

  -- Check for API launch
  IF v_new_snapshot.has_public_api = true AND (v_old_snapshot.has_public_api = false OR v_old_snapshot.has_public_api IS NULL) THEN
    INSERT INTO distribution_tracker.distribution_changes (
      company_id, old_snapshot_id, new_snapshot_id, detected_at,
      change_type, change_details, significance
    ) VALUES (
      p_company_id, v_old_snapshot.id, p_new_snapshot_id, CURRENT_DATE,
      'api_launched',
      jsonb_build_object('api_doc_url', v_new_snapshot.api_doc_url),
      'major'
    ) RETURNING * INTO v_change_id;
    RETURN NEXT (SELECT * FROM distribution_tracker.distribution_changes WHERE id = v_change_id);
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to emit distribution signal to Control Plane
CREATE OR REPLACE FUNCTION distribution_tracker.emit_signal(p_change_id UUID)
RETURNS UUID AS $$
DECLARE
  v_change RECORD;
  v_signal_id UUID;
  v_title TEXT;
  v_severity INT;
BEGIN
  SELECT dc.*, isnap.integration_count, isnap.marketplace_presence
  INTO v_change
  FROM distribution_tracker.distribution_changes dc
  JOIN distribution_tracker.integration_snapshots isnap ON isnap.id = dc.new_snapshot_id
  WHERE dc.id = p_change_id;

  v_title := CASE v_change.change_type
    WHEN 'integration_added' THEN 'New integrations: ' || (v_change.change_details->>'integrations_added')::TEXT
    WHEN 'integration_removed' THEN 'Integrations removed'
    WHEN 'marketplace_listed' THEN 'Listed on marketplace: ' || (v_change.change_details->>'marketplaces_added')::TEXT
    WHEN 'api_launched' THEN 'Public API launched'
    WHEN 'category_expansion' THEN 'Integration category expansion'
    WHEN 'partner_announced' THEN 'New partner announcement'
    ELSE 'Distribution change detected'
  END;

  v_severity := CASE v_change.significance
    WHEN 'major' THEN 4
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
    'distribution',
    v_change.company_id,
    v_severity,
    COALESCE(v_change.confidence, 0.8),
    v_title,
    COALESCE(v_change.interpretation, 'Distribution strategy shift detected: ' || v_change.change_type),
    ARRAY[]::TEXT[],
    'distribution_tracker', 'distribution_changes', v_change.id,
    'distribution',
    CASE v_change.significance WHEN 'major' THEN 'this_week' ELSE 'monitor' END,
    v_change.change_details,
    NOW()
  )
  RETURNING id INTO v_signal_id;

  UPDATE distribution_tracker.distribution_changes
  SET signal_emitted = true, signal_id = v_signal_id
  WHERE id = p_change_id;

  RETURN v_signal_id;
END;
$$ LANGUAGE plpgsql;
