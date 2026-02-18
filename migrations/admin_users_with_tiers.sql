-- Migration: Add subscription tier and company info to admin_list_users
-- Also adds admin_tier_summary RPC for dashboard tier counts
-- Date: 2026-02-13

-- ============================================================
-- 1. Drop and recreate admin_list_users with pilot_accounts join
-- ============================================================
DROP FUNCTION IF EXISTS public.admin_list_users(TEXT, TEXT, TEXT, INT, INT);

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
    (SELECT COUNT(DISTINCT utc.company_id) FROM public.user_tracked_competitors utc WHERE utc.user_id = up.id AND utc.is_active = true) AS tracked_companies_count,
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

-- ============================================================
-- 2. Create admin_tier_summary RPC for dashboard tier counts
-- ============================================================
DROP FUNCTION IF EXISTS public.admin_tier_summary();

CREATE OR REPLACE FUNCTION public.admin_tier_summary()
RETURNS TABLE (
  tier TEXT,
  user_count BIGINT
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
    pa.tier,
    COUNT(*)::BIGINT AS user_count
  FROM public.pilot_accounts pa
  GROUP BY pa.tier
  ORDER BY
    CASE pa.tier
      WHEN 'enterprise' THEN 1
      WHEN 'growth' THEN 2
      WHEN 'pilot' THEN 3
      WHEN 'free' THEN 4
      ELSE 5
    END;
END;
$$;

-- Grant execute to authenticated users (admin check is inside the function)
GRANT EXECUTE ON FUNCTION public.admin_list_users(TEXT, TEXT, TEXT, TEXT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_tier_summary() TO authenticated;
