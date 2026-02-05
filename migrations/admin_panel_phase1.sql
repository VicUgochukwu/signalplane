-- =====================================================
-- ADMIN PANEL — Phase 1: Foundation & User Management
-- Run in Supabase SQL Editor as postgres role
-- =====================================================

-- 1. Create admin schema
CREATE SCHEMA IF NOT EXISTS admin;

-- 2. User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS admin.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  display_name TEXT,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  suspended_at TIMESTAMPTZ,
  suspended_reason TEXT,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  banned_at TIMESTAMPTZ,
  banned_reason TEXT,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON admin.user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can read all profiles"
  ON admin.user_profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can update profiles"
  ON admin.user_profiles FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Service role full access on user_profiles"
  ON admin.user_profiles FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 3. Audit log table
CREATE TABLE IF NOT EXISTS admin.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit logs"
  ON admin.audit_log FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can insert audit logs"
  ON admin.audit_log FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Service role full access on audit_log"
  ON admin.audit_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 4. Feature flags table
CREATE TABLE IF NOT EXISTS admin.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'admin', 'specific_users')),
  allowed_user_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read feature flags"
  ON admin.feature_flags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage feature flags"
  ON admin.feature_flags FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Service role full access on feature_flags"
  ON admin.feature_flags FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 5. Auto-create user profile on signup trigger
CREATE OR REPLACE FUNCTION admin.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'admin'
AS $$
BEGIN
  INSERT INTO admin.user_profiles (id, role, display_name, created_at)
  VALUES (NEW.id, 'user', COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION admin.handle_new_user();

-- 6. Backfill existing users
INSERT INTO admin.user_profiles (id, role, display_name, created_at)
SELECT u.id, 'user', COALESCE(u.raw_user_meta_data ->> 'full_name', u.email), u.created_at
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM admin.user_profiles up WHERE up.id = u.id);

-- =====================================================
-- ADMIN RPCs — User Management Functions
-- =====================================================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin.user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
      AND is_banned = false AND is_suspended = false
  );
$$;

-- List all users (admin only)
CREATE OR REPLACE FUNCTION public.admin_list_users(
  p_search TEXT DEFAULT NULL, p_role TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL, p_limit INT DEFAULT 50, p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID, email TEXT, display_name TEXT, role TEXT,
  is_suspended BOOLEAN, is_banned BOOLEAN, last_active_at TIMESTAMPTZ,
  profile_created_at TIMESTAMPTZ, auth_created_at TIMESTAMPTZ,
  tracked_companies_count BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;
  RETURN QUERY
  SELECT up.id, u.email::TEXT, up.display_name, up.role, up.is_suspended, up.is_banned,
    up.last_active_at, up.created_at, u.created_at,
    (SELECT COUNT(DISTINCT c.id) FROM core.companies c WHERE c.user_id = up.id)
  FROM admin.user_profiles up JOIN auth.users u ON u.id = up.id
  WHERE (p_search IS NULL OR u.email ILIKE '%' || p_search || '%' OR up.display_name ILIKE '%' || p_search || '%')
    AND (p_role IS NULL OR up.role = p_role)
    AND (p_status IS NULL
      OR (p_status = 'active' AND up.is_suspended = false AND up.is_banned = false)
      OR (p_status = 'suspended' AND up.is_suspended = true)
      OR (p_status = 'banned' AND up.is_banned = true))
  ORDER BY u.created_at DESC LIMIT p_limit OFFSET p_offset;
END;
$$;

-- User growth stats (admin only)
CREATE OR REPLACE FUNCTION public.admin_user_growth_stats()
RETURNS TABLE (
  total_users BIGINT, active_users BIGINT, suspended_users BIGINT,
  banned_users BIGINT, admins BIGINT, users_last_7_days BIGINT,
  users_last_30_days BIGINT, users_last_90_days BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN QUERY
  SELECT COUNT(*)::BIGINT, COUNT(*) FILTER (WHERE up.is_suspended = false AND up.is_banned = false)::BIGINT,
    COUNT(*) FILTER (WHERE up.is_suspended = true)::BIGINT,
    COUNT(*) FILTER (WHERE up.is_banned = true)::BIGINT,
    COUNT(*) FILTER (WHERE up.role IN ('admin', 'super_admin'))::BIGINT,
    COUNT(*) FILTER (WHERE u.created_at >= now() - INTERVAL '7 days')::BIGINT,
    COUNT(*) FILTER (WHERE u.created_at >= now() - INTERVAL '30 days')::BIGINT,
    COUNT(*) FILTER (WHERE u.created_at >= now() - INTERVAL '90 days')::BIGINT
  FROM admin.user_profiles up JOIN auth.users u ON u.id = up.id;
END;
$$;

-- Daily signups for chart (admin only)
CREATE OR REPLACE FUNCTION public.admin_daily_signups(p_days INT DEFAULT 30)
RETURNS TABLE (signup_date DATE, count BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN QUERY
  SELECT d::DATE, COUNT(u.id)::BIGINT
  FROM generate_series((now() - (p_days || ' days')::INTERVAL)::DATE, now()::DATE, '1 day'::INTERVAL) d
  LEFT JOIN auth.users u ON u.created_at::DATE = d::DATE
  GROUP BY d::DATE ORDER BY d::DATE;
END;
$$;

-- Suspend user (admin only)
CREATE OR REPLACE FUNCTION public.admin_suspend_user(p_user_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF p_user_id = v_admin_id THEN RAISE EXCEPTION 'Cannot suspend yourself'; END IF;
  UPDATE admin.user_profiles SET is_suspended = true, suspended_at = now(),
    suspended_reason = p_reason, updated_at = now() WHERE id = p_user_id;
  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'suspend_user', 'user', p_user_id::TEXT, jsonb_build_object('reason', p_reason));
END;
$$;

-- Unsuspend user (admin only)
CREATE OR REPLACE FUNCTION public.admin_unsuspend_user(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  UPDATE admin.user_profiles SET is_suspended = false, suspended_at = NULL,
    suspended_reason = NULL, updated_at = now() WHERE id = p_user_id;
  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'unsuspend_user', 'user', p_user_id::TEXT, '{}');
END;
$$;

-- Ban user (admin only)
CREATE OR REPLACE FUNCTION public.admin_ban_user(p_user_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF p_user_id = v_admin_id THEN RAISE EXCEPTION 'Cannot ban yourself'; END IF;
  UPDATE admin.user_profiles SET is_banned = true, banned_at = now(), banned_reason = p_reason,
    is_suspended = false, suspended_at = NULL, suspended_reason = NULL, updated_at = now()
  WHERE id = p_user_id;
  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'ban_user', 'user', p_user_id::TEXT, jsonb_build_object('reason', p_reason));
END;
$$;

-- Unban user (admin only)
CREATE OR REPLACE FUNCTION public.admin_unban_user(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  UPDATE admin.user_profiles SET is_banned = false, banned_at = NULL,
    banned_reason = NULL, updated_at = now() WHERE id = p_user_id;
  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'unban_user', 'user', p_user_id::TEXT, '{}');
END;
$$;

-- Set user role (super_admin only)
CREATE OR REPLACE FUNCTION public.admin_set_user_role(p_user_id UUID, p_role TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_admin_id UUID := auth.uid(); v_old_role TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin.user_profiles WHERE id = v_admin_id AND role = 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized: super_admin required';
  END IF;
  IF p_role NOT IN ('user', 'admin', 'super_admin') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  SELECT role INTO v_old_role FROM admin.user_profiles WHERE id = p_user_id;
  UPDATE admin.user_profiles SET role = p_role, updated_at = now() WHERE id = p_user_id;
  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'set_user_role', 'user', p_user_id::TEXT,
    jsonb_build_object('old_role', v_old_role, 'new_role', p_role));
END;
$$;

-- Get audit log (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_audit_log(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (id UUID, admin_email TEXT, action TEXT, target_type TEXT, target_id TEXT, details JSONB, created_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN QUERY
  SELECT al.id, u.email::TEXT, al.action, al.target_type, al.target_id, al.details, al.created_at
  FROM admin.audit_log al JOIN auth.users u ON u.id = al.admin_user_id
  ORDER BY al.created_at DESC LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Get feature flags (all authenticated)
CREATE OR REPLACE FUNCTION public.get_feature_flags()
RETURNS TABLE (flag_key TEXT, label TEXT, description TEXT, is_enabled BOOLEAN, applies_to TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT ff.flag_key, ff.label, ff.description,
    CASE
      WHEN ff.applies_to = 'all' THEN ff.is_enabled
      WHEN ff.applies_to = 'admin' THEN ff.is_enabled AND EXISTS (
        SELECT 1 FROM admin.user_profiles up WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin'))
      WHEN ff.applies_to = 'specific_users' THEN ff.is_enabled AND auth.uid() = ANY(ff.allowed_user_ids)
      ELSE false
    END,
    ff.applies_to
  FROM admin.feature_flags ff;
$$;

-- Toggle feature flag (admin only)
CREATE OR REPLACE FUNCTION public.admin_toggle_feature_flag(p_flag_key TEXT, p_enabled BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  UPDATE admin.feature_flags SET is_enabled = p_enabled, updated_at = now() WHERE flag_key = p_flag_key;
  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'toggle_feature_flag', 'feature_flag', p_flag_key, jsonb_build_object('enabled', p_enabled));
END;
$$;
