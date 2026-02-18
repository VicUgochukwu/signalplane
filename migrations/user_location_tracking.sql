-- Migration: Add location tracking to user_company_profiles
-- and expose more company fields in admin_list_users
-- Date: 2026-02-13

-- ============================================================
-- 1. Add location columns to user_company_profiles
-- ============================================================
ALTER TABLE public.user_company_profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.user_company_profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.user_company_profiles ADD COLUMN IF NOT EXISTS signup_ip_country TEXT;

-- ============================================================
-- 2. Update admin_list_users to return location + full company info
-- ============================================================
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
  job_title TEXT,
  company_domain TEXT,
  industry TEXT,
  company_size TEXT,
  department TEXT,
  country TEXT,
  city TEXT,
  signup_provider TEXT,
  avatar_url TEXT
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
    ucp.job_title,
    ucp.company_domain,
    ucp.industry,
    ucp.company_size,
    ucp.department,
    COALESCE(ucp.country, ucp.signup_ip_country) AS country,
    ucp.city,
    (u.raw_app_meta_data->>'provider')::TEXT AS signup_provider,
    (u.raw_user_meta_data->>'avatar_url')::TEXT AS avatar_url
  FROM admin.user_profiles up
  JOIN auth.users u ON u.id = up.id
  LEFT JOIN public.pilot_accounts pa ON pa.user_id = up.id
  LEFT JOIN public.user_company_profiles ucp ON ucp.user_id = up.id
  WHERE
    (p_search IS NULL OR u.email ILIKE '%' || p_search || '%' OR up.display_name ILIKE '%' || p_search || '%'
     OR ucp.company_name ILIKE '%' || p_search || '%')
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
-- 3. RPC to save location from edge function (IP geolocation)
-- ============================================================
CREATE OR REPLACE FUNCTION public.save_user_location(
  p_user_id UUID,
  p_country TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.user_company_profiles
  SET
    signup_ip_country = COALESCE(signup_ip_country, p_country),
    country = COALESCE(country, p_country),
    city = COALESCE(city, p_city),
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND signup_ip_country IS NULL;

  -- If no company profile yet, create a minimal one with location
  IF NOT FOUND THEN
    INSERT INTO public.user_company_profiles (user_id, company_name, signup_ip_country, country, city)
    VALUES (p_user_id, '', p_country, p_country, p_city)
    ON CONFLICT (user_id) DO UPDATE SET
      signup_ip_country = COALESCE(public.user_company_profiles.signup_ip_country, EXCLUDED.signup_ip_country),
      country = COALESCE(public.user_company_profiles.country, EXCLUDED.country),
      city = COALESCE(public.user_company_profiles.city, EXCLUDED.city),
      updated_at = NOW();
  END IF;
END;
$$;

-- Grant to service_role only (called from edge function)
GRANT EXECUTE ON FUNCTION public.save_user_location(UUID, TEXT, TEXT) TO service_role;
