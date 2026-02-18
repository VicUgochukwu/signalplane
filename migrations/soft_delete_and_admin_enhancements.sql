-- Migration: Soft delete for competitors, last active tracking, admin delete account
-- Date: 2026-02-13

-- ============================================================
-- 1. Soft delete: Add deleted_at columns
-- ============================================================

-- Add deleted_at to tracked_pages
ALTER TABLE core.tracked_pages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_tracked_pages_deleted ON core.tracked_pages (deleted_at) WHERE deleted_at IS NOT NULL;

-- Add deleted_at to user_tracked_competitors
ALTER TABLE public.user_tracked_competitors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_utc_deleted ON public.user_tracked_competitors (deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================================
-- 2. Replace delete_tracked_page with soft delete
-- ============================================================
DROP FUNCTION IF EXISTS public.delete_tracked_page(uuid);

CREATE OR REPLACE FUNCTION public.delete_tracked_page(page_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Soft delete: set deleted_at instead of hard deleting
  UPDATE core.tracked_pages
  SET deleted_at = NOW(), enabled = false
  WHERE id = page_id AND user_id = auth.uid() AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_tracked_page(uuid) TO authenticated;

-- ============================================================
-- 3. Replace delete_company with soft delete
-- ============================================================
DROP FUNCTION IF EXISTS public.delete_company(uuid);

CREATE OR REPLACE FUNCTION public.delete_company(p_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Soft delete tracked pages for this company + user
  UPDATE core.tracked_pages
  SET deleted_at = NOW(), enabled = false
  WHERE company_id = p_company_id AND user_id = auth.uid() AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Soft delete the competitor entry
  UPDATE public.user_tracked_competitors
  SET is_active = false, deleted_at = NOW()
  WHERE company_id = p_company_id AND user_id = auth.uid() AND deleted_at IS NULL;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_company(uuid) TO authenticated;

-- ============================================================
-- 4. Replace admin_delete_tracked_page with soft delete
-- ============================================================
DROP FUNCTION IF EXISTS public.admin_delete_tracked_page(uuid);

CREATE OR REPLACE FUNCTION public.admin_delete_tracked_page(p_page_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_page RECORD;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  SELECT company_name, url INTO v_page FROM core.tracked_pages WHERE id = p_page_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tracked page not found: %', p_page_id;
  END IF;

  -- Soft delete
  UPDATE core.tracked_pages
  SET deleted_at = NOW(), enabled = false
  WHERE id = p_page_id;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'delete_tracked_page', 'tracked_page', p_page_id::TEXT,
    jsonb_build_object('company_name', v_page.company_name, 'url', v_page.url));
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_tracked_page(uuid) TO authenticated;

-- ============================================================
-- 5. Restore function: let users undo a delete within 90 days
-- ============================================================
CREATE OR REPLACE FUNCTION public.restore_company(p_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Restore tracked pages (only if within 90 day window)
  UPDATE core.tracked_pages
  SET deleted_at = NULL, enabled = true
  WHERE company_id = p_company_id
    AND user_id = auth.uid()
    AND deleted_at IS NOT NULL
    AND deleted_at > NOW() - INTERVAL '90 days';

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Restore competitor entry
  UPDATE public.user_tracked_competitors
  SET is_active = true, deleted_at = NULL
  WHERE company_id = p_company_id
    AND user_id = auth.uid()
    AND deleted_at IS NOT NULL
    AND deleted_at > NOW() - INTERVAL '90 days';

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_company(uuid) TO authenticated;

-- ============================================================
-- 6. Purge function: permanently delete records older than 90 days
--    (call this from a weekly cron/n8n workflow)
-- ============================================================
CREATE OR REPLACE FUNCTION public.purge_soft_deleted()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_count integer := 0;
  v_page_ids uuid[];
BEGIN
  -- Get page IDs that are past the 90-day retention window
  SELECT array_agg(id) INTO v_page_ids
  FROM core.tracked_pages
  WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days';

  IF v_page_ids IS NOT NULL THEN
    -- Hard delete child records
    DELETE FROM diff_tracker.classified_changes
      WHERE page_diff_id IN (SELECT pd.id FROM diff_tracker.page_diffs pd WHERE pd.tracked_page_id = ANY(v_page_ids));
    DELETE FROM diff_tracker.narrative_snapshots WHERE tracked_page_id = ANY(v_page_ids);
    DELETE FROM diff_tracker.narrative_drifts WHERE company_id IN (
      SELECT DISTINCT company_id FROM core.tracked_pages WHERE id = ANY(v_page_ids)
    );
    DELETE FROM diff_tracker.page_diffs WHERE tracked_page_id = ANY(v_page_ids);
    DELETE FROM diff_tracker.page_snapshots WHERE tracked_page_id = ANY(v_page_ids);

    -- Hard delete the tracked pages
    DELETE FROM core.tracked_pages WHERE id = ANY(v_page_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;

  -- Hard delete expired user_tracked_competitors
  DELETE FROM public.user_tracked_competitors
  WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days';

  RETURN v_count;
END;
$$;

-- ============================================================
-- 7. Update views/queries to exclude soft-deleted records
--    (add WHERE deleted_at IS NULL filters)
-- ============================================================

-- Update admin_list_users to only count non-deleted competitors
DROP FUNCTION IF EXISTS public.admin_list_users(TEXT, TEXT, TEXT, TEXT, INT, INT);

CREATE OR REPLACE FUNCTION public.admin_list_users(
  p_search TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_tier TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  display_name TEXT,
  role TEXT,
  is_suspended BOOLEAN,
  is_banned BOOLEAN,
  last_active_at TIMESTAMPTZ,
  profile_created_at TIMESTAMPTZ,
  auth_created_at TIMESTAMPTZ,
  tracked_companies_count BIGINT,
  subscription_tier TEXT,
  account_status TEXT,
  pilot_start TIMESTAMPTZ,
  pilot_end TIMESTAMPTZ,
  company_name TEXT,
  job_title TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  RETURN QUERY
  SELECT
    up.id,
    u.email::TEXT,
    up.display_name,
    up.role,
    up.is_suspended,
    up.is_banned,
    up.last_active_at,
    up.created_at AS profile_created_at,
    u.created_at AS auth_created_at,
    (SELECT COUNT(DISTINCT utc.company_id)
     FROM public.user_tracked_competitors utc
     WHERE utc.user_id = up.id AND utc.is_active = true AND utc.deleted_at IS NULL
    ) AS tracked_companies_count,
    pa.tier AS subscription_tier,
    pa.status AS account_status,
    pa.pilot_start,
    pa.pilot_end,
    ucp.company_name,
    ucp.job_title
  FROM admin.user_profiles up
  JOIN auth.users u ON u.id = up.id
  LEFT JOIN public.pilot_accounts pa ON pa.user_id = up.id
  LEFT JOIN public.user_company_profiles ucp ON ucp.user_id = up.id
  WHERE
    (p_search IS NULL OR u.email ILIKE '%' || p_search || '%' OR up.display_name ILIKE '%' || p_search || '%')
    AND (p_role IS NULL OR up.role = p_role)
    AND (p_status IS NULL
      OR (p_status = 'active' AND up.is_suspended = false AND up.is_banned = false)
      OR (p_status = 'suspended' AND up.is_suspended = true)
      OR (p_status = 'banned' AND up.is_banned = true)
    )
    AND (p_tier IS NULL OR pa.tier = p_tier)
  ORDER BY u.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users(TEXT, TEXT, TEXT, TEXT, INT, INT) TO authenticated;

-- ============================================================
-- 8. Touch last_active_at: lightweight function for frontend
-- ============================================================
CREATE OR REPLACE FUNCTION public.touch_last_active()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE admin.user_profiles
  SET last_active_at = NOW()
  WHERE id = auth.uid()
    AND (last_active_at IS NULL OR last_active_at < NOW() - INTERVAL '5 minutes');
END;
$$;

GRANT EXECUTE ON FUNCTION public.touch_last_active() TO authenticated;

-- ============================================================
-- 9. Admin delete account
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_email TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  -- Don't allow deleting yourself
  IF p_user_id = v_admin_id THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  -- Get email for audit log
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Soft delete all their tracked pages
  UPDATE core.tracked_pages SET deleted_at = NOW(), enabled = false
  WHERE user_id = p_user_id AND deleted_at IS NULL;

  -- Soft delete all their competitors
  UPDATE public.user_tracked_competitors SET is_active = false, deleted_at = NOW()
  WHERE user_id = p_user_id AND deleted_at IS NULL;

  -- Delete pilot account
  DELETE FROM public.pilot_accounts WHERE user_id = p_user_id;

  -- Delete user company profile
  DELETE FROM public.user_company_profiles WHERE user_id = p_user_id;

  -- Delete team memberships
  DELETE FROM public.team_members WHERE user_id = p_user_id;

  -- Delete delivery preferences
  DELETE FROM public.delivery_preferences WHERE user_id = p_user_id;

  -- Delete admin profile
  DELETE FROM admin.user_profiles WHERE id = p_user_id;

  -- Delete auth user (cascades remaining FKs)
  DELETE FROM auth.users WHERE id = p_user_id;

  -- Audit log
  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'delete_user', 'user', p_user_id::TEXT,
    jsonb_build_object('email', v_email));
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;
