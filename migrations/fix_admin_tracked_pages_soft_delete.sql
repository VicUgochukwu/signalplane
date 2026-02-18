-- Migration: Fix admin tracked pages RPCs to exclude soft-deleted records
-- Date: 2026-02-13
-- Issue: admin_list_tracked_pages, admin_tracked_pages_stats, admin_tracked_page_companies
--        were not filtering out records where deleted_at IS NOT NULL

-- ============================================================
-- 1. Fix admin_list_tracked_pages to exclude soft-deleted records
-- ============================================================
DROP FUNCTION IF EXISTS public.admin_list_tracked_pages(TEXT, TEXT, BOOLEAN, INT, INT);

CREATE OR REPLACE FUNCTION public.admin_list_tracked_pages(
  p_search TEXT DEFAULT NULL,
  p_page_type TEXT DEFAULT NULL,
  p_enabled BOOLEAN DEFAULT NULL,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  company_name TEXT,
  company_slug TEXT,
  url TEXT,
  url_type TEXT,
  page_type TEXT,
  enabled BOOLEAN,
  created_at TIMESTAMPTZ,
  user_id UUID,
  snapshot_count BIGINT,
  last_snapshot_at TIMESTAMPTZ,
  last_snapshot_status TEXT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT
    tp.id,
    tp.company_id,
    tp.company_name,
    tp.company_slug,
    tp.url,
    tp.url_type,
    tp.page_type,
    tp.enabled,
    tp.created_at,
    tp.user_id,
    COALESCE(stats.snapshot_count, 0) AS snapshot_count,
    stats.last_snapshot_at,
    stats.last_snapshot_status
  FROM core.tracked_pages tp
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) AS snapshot_count,
      MAX(ps.fetched_at) AS last_snapshot_at,
      (SELECT ps2.status FROM diff_tracker.page_snapshots ps2
       WHERE ps2.tracked_page_id = tp.id
       ORDER BY ps2.fetched_at DESC LIMIT 1) AS last_snapshot_status
    FROM diff_tracker.page_snapshots ps
    WHERE ps.tracked_page_id = tp.id
  ) stats ON true
  WHERE
    tp.deleted_at IS NULL  -- Exclude soft-deleted records
    AND (p_search IS NULL OR (
      tp.company_name ILIKE '%' || p_search || '%'
      OR tp.url ILIKE '%' || p_search || '%'
      OR tp.company_slug ILIKE '%' || p_search || '%'
    ))
    AND (p_page_type IS NULL OR tp.page_type = p_page_type)
    AND (p_enabled IS NULL OR tp.enabled = p_enabled)
  ORDER BY tp.company_name, tp.url
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_tracked_pages(TEXT, TEXT, BOOLEAN, INT, INT) TO authenticated;

-- ============================================================
-- 2. Fix admin_tracked_pages_stats to exclude soft-deleted records
-- ============================================================
DROP FUNCTION IF EXISTS public.admin_tracked_pages_stats();

CREATE OR REPLACE FUNCTION public.admin_tracked_pages_stats()
RETURNS TABLE (
  total_pages BIGINT,
  enabled_pages BIGINT,
  disabled_pages BIGINT,
  unique_companies BIGINT,
  pages_with_snapshots BIGINT,
  total_snapshots BIGINT,
  failed_snapshots BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_pages,
    COUNT(*) FILTER (WHERE tp.enabled = true)::BIGINT AS enabled_pages,
    COUNT(*) FILTER (WHERE tp.enabled = false)::BIGINT AS disabled_pages,
    COUNT(DISTINCT tp.company_name)::BIGINT AS unique_companies,
    COUNT(DISTINCT ps.tracked_page_id)::BIGINT AS pages_with_snapshots,
    COUNT(ps.id)::BIGINT AS total_snapshots,
    COUNT(ps.id) FILTER (WHERE ps.status = 'failed')::BIGINT AS failed_snapshots
  FROM core.tracked_pages tp
  LEFT JOIN diff_tracker.page_snapshots ps ON ps.tracked_page_id = tp.id
  WHERE tp.deleted_at IS NULL;  -- Exclude soft-deleted records
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_tracked_pages_stats() TO authenticated;

-- ============================================================
-- 3. Fix admin_tracked_page_companies to exclude soft-deleted records
-- ============================================================
DROP FUNCTION IF EXISTS public.admin_tracked_page_companies();

CREATE OR REPLACE FUNCTION public.admin_tracked_page_companies()
RETURNS TABLE (
  company_id UUID,
  company_name TEXT,
  company_slug TEXT,
  page_count BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  RETURN QUERY
  SELECT
    tp.company_id,
    tp.company_name,
    tp.company_slug,
    COUNT(*)::BIGINT AS page_count
  FROM core.tracked_pages tp
  WHERE tp.deleted_at IS NULL  -- Exclude soft-deleted records
  GROUP BY tp.company_id, tp.company_name, tp.company_slug
  ORDER BY tp.company_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_tracked_page_companies() TO authenticated;
