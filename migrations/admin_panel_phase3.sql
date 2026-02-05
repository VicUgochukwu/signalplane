-- =====================================================
-- ADMIN PANEL — Phase 3: Data Management & Feature Control
-- Run in Supabase SQL Editor as postgres role
-- =====================================================

-- =====================================================
-- A. FEATURE FLAG SEEDS
-- =====================================================

INSERT INTO admin.feature_flags (flag_key, label, description, is_enabled, applies_to) VALUES
  ('control_plane', 'Control Plane', 'Enable/disable Control Plane (Intel Packets) access', true, 'all'),
  ('artifacts', 'Artifacts', 'Enable/disable GTM Artifacts feature', true, 'all'),
  ('messaging_diff', 'Messaging Diff', 'Enable/disable Messaging Diff tool', true, 'all'),
  ('csv_upload', 'CSV Upload', 'Enable/disable CSV data upload feature', true, 'all'),
  ('admin_panel', 'Admin Panel', 'Gate admin panel visibility in app navigation', true, 'admin'),
  ('dark_mode', 'Dark Mode', 'Future dark mode toggle (not yet wired)', false, 'all'),
  ('beta_features', 'Beta Features', 'General beta feature gate for testing', false, 'specific_users')
ON CONFLICT (flag_key) DO NOTHING;

-- =====================================================
-- B. FEATURE FLAG CRUD RPCs
-- =====================================================

-- Admin-only: get all flags with full details
CREATE OR REPLACE FUNCTION public.admin_get_feature_flags()
RETURNS TABLE (
  id UUID, flag_key TEXT, label TEXT, description TEXT,
  is_enabled BOOLEAN, applies_to TEXT, allowed_user_ids UUID[],
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;
  RETURN QUERY
  SELECT ff.id, ff.flag_key, ff.label, ff.description, ff.is_enabled,
    ff.applies_to, ff.allowed_user_ids, ff.created_at, ff.updated_at
  FROM admin.feature_flags ff ORDER BY ff.created_at;
END;
$$;

-- Create a new feature flag
CREATE OR REPLACE FUNCTION public.admin_create_feature_flag(
  p_flag_key TEXT,
  p_label TEXT,
  p_description TEXT DEFAULT NULL,
  p_is_enabled BOOLEAN DEFAULT false,
  p_applies_to TEXT DEFAULT 'all',
  p_allowed_user_ids UUID[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_flag_id UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;
  IF p_applies_to NOT IN ('all', 'admin', 'specific_users') THEN
    RAISE EXCEPTION 'Invalid applies_to value: %', p_applies_to;
  END IF;

  INSERT INTO admin.feature_flags (flag_key, label, description, is_enabled, applies_to, allowed_user_ids)
  VALUES (p_flag_key, p_label, p_description, p_is_enabled, p_applies_to, p_allowed_user_ids)
  RETURNING id INTO v_flag_id;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'create_feature_flag', 'feature_flag', p_flag_key,
    jsonb_build_object('label', p_label, 'enabled', p_is_enabled, 'applies_to', p_applies_to));

  RETURN v_flag_id;
END;
$$;

-- Update an existing feature flag
CREATE OR REPLACE FUNCTION public.admin_update_feature_flag(
  p_flag_key TEXT,
  p_label TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_applies_to TEXT DEFAULT NULL,
  p_allowed_user_ids UUID[] DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;
  IF p_applies_to IS NOT NULL AND p_applies_to NOT IN ('all', 'admin', 'specific_users') THEN
    RAISE EXCEPTION 'Invalid applies_to value: %', p_applies_to;
  END IF;

  UPDATE admin.feature_flags SET
    label = COALESCE(p_label, label),
    description = COALESCE(p_description, description),
    applies_to = COALESCE(p_applies_to, applies_to),
    allowed_user_ids = COALESCE(p_allowed_user_ids, allowed_user_ids),
    updated_at = now()
  WHERE flag_key = p_flag_key;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'update_feature_flag', 'feature_flag', p_flag_key,
    jsonb_build_object('label', p_label, 'applies_to', p_applies_to));
END;
$$;

-- Delete a feature flag
CREATE OR REPLACE FUNCTION public.admin_delete_feature_flag(p_flag_key TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  DELETE FROM admin.feature_flags WHERE flag_key = p_flag_key;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'delete_feature_flag', 'feature_flag', p_flag_key, '{}');
END;
$$;

-- =====================================================
-- C. USAGE TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS admin.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_detail TEXT,
  resource_count INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_user_action
  ON admin.usage_tracking (user_id, action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_created
  ON admin.usage_tracking (created_at DESC);

ALTER TABLE admin.usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all usage tracking"
  ON admin.usage_tracking FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Users can read own usage tracking"
  ON admin.usage_tracking FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access on usage_tracking"
  ON admin.usage_tracking FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =====================================================
-- D. ABUSE DETECTION FLAGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS admin.abuse_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
  description TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_abuse_user
  ON admin.abuse_flags (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abuse_unresolved
  ON admin.abuse_flags (resolved, created_at DESC);

ALTER TABLE admin.abuse_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all abuse flags"
  ON admin.abuse_flags FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can update abuse flags"
  ON admin.abuse_flags FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Service role full access on abuse_flags"
  ON admin.abuse_flags FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =====================================================
-- E. USAGE AGGREGATION RPCs
-- =====================================================

-- Usage summary (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_usage_summary()
RETURNS TABLE (
  total_uploads BIGINT,
  total_rows_processed BIGINT,
  active_users_7d BIGINT,
  active_users_30d BIGINT,
  flagged_users BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::BIGINT FROM admin.usage_tracking WHERE action_type = 'csv_upload'),
    (SELECT COALESCE(SUM(resource_count), 0)::BIGINT FROM admin.usage_tracking WHERE action_type = 'csv_upload'),
    (SELECT COUNT(DISTINCT user_id)::BIGINT FROM admin.usage_tracking WHERE created_at >= now() - INTERVAL '7 days'),
    (SELECT COUNT(DISTINCT user_id)::BIGINT FROM admin.usage_tracking WHERE created_at >= now() - INTERVAL '30 days'),
    (SELECT COUNT(DISTINCT user_id)::BIGINT FROM admin.abuse_flags WHERE resolved = false);
END;
$$;

-- Per-user usage breakdown (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_user_usage(
  p_user_id UUID,
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  action_type TEXT,
  action_count BIGINT,
  total_resources BIGINT,
  last_action_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT
    ut.action_type,
    COUNT(*)::BIGINT,
    COALESCE(SUM(ut.resource_count), 0)::BIGINT,
    MAX(ut.created_at)
  FROM admin.usage_tracking ut
  WHERE ut.user_id = p_user_id
    AND ut.created_at >= now() - (p_days || ' days')::INTERVAL
  GROUP BY ut.action_type
  ORDER BY COUNT(*) DESC;
END;
$$;

-- Usage leaderboard (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_usage_leaderboard(
  p_days INT DEFAULT 30,
  p_limit INT DEFAULT 25
)
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  display_name TEXT,
  upload_count BIGINT,
  total_rows_processed BIGINT,
  last_active TIMESTAMPTZ,
  abuse_flag_count BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT
    ut.user_id,
    u.email::TEXT,
    up.display_name,
    COUNT(*)::BIGINT AS upload_count,
    COALESCE(SUM(ut.resource_count), 0)::BIGINT AS total_rows,
    MAX(ut.created_at) AS last_active,
    (SELECT COUNT(*)::BIGINT FROM admin.abuse_flags af
     WHERE af.user_id = ut.user_id AND af.resolved = false) AS abuse_flags
  FROM admin.usage_tracking ut
  JOIN auth.users u ON u.id = ut.user_id
  LEFT JOIN admin.user_profiles up ON up.id = ut.user_id
  WHERE ut.created_at >= now() - (p_days || ' days')::INTERVAL
  GROUP BY ut.user_id, u.email, up.display_name
  ORDER BY COALESCE(SUM(ut.resource_count), 0) DESC
  LIMIT p_limit;
END;
$$;

-- Get abuse flags (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_abuse_flags(
  p_resolved BOOLEAN DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  display_name TEXT,
  flag_type TEXT,
  severity TEXT,
  description TEXT,
  resolved BOOLEAN,
  resolved_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT
    af.id, af.user_id, u.email::TEXT, up.display_name,
    af.flag_type, af.severity, af.description,
    af.resolved, af.resolved_at, af.metadata, af.created_at
  FROM admin.abuse_flags af
  JOIN auth.users u ON u.id = af.user_id
  LEFT JOIN admin.user_profiles up ON up.id = af.user_id
  WHERE (p_resolved IS NULL OR af.resolved = p_resolved)
  ORDER BY af.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Resolve an abuse flag (admin only)
CREATE OR REPLACE FUNCTION public.admin_resolve_abuse_flag(p_flag_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_admin_id UUID := auth.uid(); v_user_id UUID; v_flag_type TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  SELECT user_id, flag_type INTO v_user_id, v_flag_type
  FROM admin.abuse_flags WHERE id = p_flag_id;

  UPDATE admin.abuse_flags
  SET resolved = true, resolved_by = v_admin_id, resolved_at = now()
  WHERE id = p_flag_id;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'resolve_abuse_flag', 'abuse_flag', p_flag_id::TEXT,
    jsonb_build_object('user_id', v_user_id, 'flag_type', v_flag_type));
END;
$$;

-- =====================================================
-- F. CSV UPLOAD TRACKING RPC (called by edge function)
-- =====================================================

-- Log a CSV upload and auto-detect abuse
CREATE OR REPLACE FUNCTION public.log_csv_upload(
  p_user_id UUID,
  p_filename TEXT,
  p_total_rows INT,
  p_valid_rows INT,
  p_skipped_rows INT,
  p_source_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_uploads_last_hour INT;
BEGIN
  -- Log the upload event
  INSERT INTO admin.usage_tracking (user_id, action_type, action_detail, resource_count, metadata)
  VALUES (
    p_user_id,
    'csv_upload',
    p_filename,
    p_valid_rows,
    jsonb_build_object(
      'total_rows', p_total_rows,
      'valid_rows', p_valid_rows,
      'skipped_rows', p_skipped_rows,
      'source_type', p_source_type
    )
  );

  -- Check for abuse: large upload (>1000 rows)
  IF p_total_rows > 1000 THEN
    INSERT INTO admin.abuse_flags (user_id, flag_type, severity, description, metadata)
    VALUES (p_user_id, 'large_upload', 'medium',
      'User uploaded a CSV with ' || p_total_rows || ' rows (threshold: 1000)',
      jsonb_build_object('filename', p_filename, 'total_rows', p_total_rows));
  END IF;

  -- Check for abuse: high volume (>500 valid rows)
  IF p_valid_rows > 500 THEN
    INSERT INTO admin.abuse_flags (user_id, flag_type, severity, description, metadata)
    VALUES (p_user_id, 'high_volume', 'low',
      'User imported ' || p_valid_rows || ' valid rows in a single upload (threshold: 500)',
      jsonb_build_object('filename', p_filename, 'valid_rows', p_valid_rows));
  END IF;

  -- Check for abuse: rapid requests (>10 uploads in last hour)
  SELECT COUNT(*) INTO v_uploads_last_hour
  FROM admin.usage_tracking
  WHERE user_id = p_user_id
    AND action_type = 'csv_upload'
    AND created_at >= now() - INTERVAL '1 hour';

  IF v_uploads_last_hour > 10 THEN
    INSERT INTO admin.abuse_flags (user_id, flag_type, severity, description, metadata)
    VALUES (p_user_id, 'rapid_requests', 'high',
      'User made ' || v_uploads_last_hour || ' CSV uploads in the last hour (threshold: 10)',
      jsonb_build_object('uploads_last_hour', v_uploads_last_hour));
  END IF;
END;
$$;

-- =====================================================
-- G. GRANT ACCESS TO admin SCHEMA TABLES (for PostgREST)
-- =====================================================

-- Ensure new tables are accessible via PostgREST
GRANT USAGE ON SCHEMA admin TO authenticated;
GRANT USAGE ON SCHEMA admin TO service_role;
GRANT SELECT ON admin.usage_tracking TO authenticated;
GRANT ALL ON admin.usage_tracking TO service_role;
GRANT SELECT, UPDATE ON admin.abuse_flags TO authenticated;
GRANT ALL ON admin.abuse_flags TO service_role;
