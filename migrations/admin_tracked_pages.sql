-- ============================================
-- Admin Tracked Pages Management
-- RPCs for admin/super_admin to manage core.tracked_pages
-- ============================================

-- List all tracked pages with snapshot stats
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
    (p_search IS NULL OR (
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

-- Get stats summary for tracked pages
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
  LEFT JOIN diff_tracker.page_snapshots ps ON ps.tracked_page_id = tp.id;
END;
$$;

-- Add a new tracked page
CREATE OR REPLACE FUNCTION public.admin_add_tracked_page(
  p_company_name TEXT,
  p_company_slug TEXT,
  p_url TEXT,
  p_page_type TEXT DEFAULT 'homepage',
  p_url_type TEXT DEFAULT 'homepage',
  p_company_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_page_id UUID;
  v_company_id UUID := p_company_id;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  -- Auto-generate company_id if not provided
  IF v_company_id IS NULL THEN
    v_company_id := gen_random_uuid();
  END IF;

  INSERT INTO core.tracked_pages (
    company_id, company_name, company_slug, url, url_type, page_type, enabled, user_id
  ) VALUES (
    v_company_id, p_company_name, p_company_slug, p_url, p_url_type, p_page_type, true, v_admin_id
  )
  RETURNING id INTO v_page_id;

  -- Audit log
  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'add_tracked_page', 'tracked_page', v_page_id::TEXT,
    jsonb_build_object(
      'company_name', p_company_name,
      'url', p_url,
      'page_type', p_page_type
    ));

  RETURN v_page_id;
END;
$$;

-- Toggle a tracked page enabled/disabled
CREATE OR REPLACE FUNCTION public.admin_toggle_tracked_page(
  p_page_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_new_enabled BOOLEAN;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  UPDATE core.tracked_pages
  SET enabled = NOT enabled
  WHERE id = p_page_id
  RETURNING enabled INTO v_new_enabled;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tracked page not found: %', p_page_id;
  END IF;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'toggle_tracked_page', 'tracked_page', p_page_id::TEXT,
    jsonb_build_object('enabled', v_new_enabled));

  RETURN v_new_enabled;
END;
$$;

-- Update a tracked page
CREATE OR REPLACE FUNCTION public.admin_update_tracked_page(
  p_page_id UUID,
  p_url TEXT DEFAULT NULL,
  p_page_type TEXT DEFAULT NULL,
  p_url_type TEXT DEFAULT NULL,
  p_company_name TEXT DEFAULT NULL,
  p_company_slug TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  UPDATE core.tracked_pages
  SET
    url = COALESCE(p_url, url),
    page_type = COALESCE(p_page_type, page_type),
    url_type = COALESCE(p_url_type, url_type),
    company_name = COALESCE(p_company_name, company_name),
    company_slug = COALESCE(p_company_slug, company_slug)
  WHERE id = p_page_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tracked page not found: %', p_page_id;
  END IF;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'update_tracked_page', 'tracked_page', p_page_id::TEXT,
    jsonb_build_object(
      'url', p_url, 'page_type', p_page_type, 'url_type', p_url_type,
      'company_name', p_company_name, 'company_slug', p_company_slug
    ));
END;
$$;

-- Delete a tracked page
CREATE OR REPLACE FUNCTION public.admin_delete_tracked_page(
  p_page_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_page RECORD;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;

  SELECT company_name, url INTO v_page FROM core.tracked_pages WHERE id = p_page_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tracked page not found: %', p_page_id;
  END IF;

  -- Delete associated snapshots and diffs first
  DELETE FROM diff_tracker.page_diffs
  WHERE old_snapshot_id IN (SELECT id FROM diff_tracker.page_snapshots WHERE tracked_page_id = p_page_id)
     OR new_snapshot_id IN (SELECT id FROM diff_tracker.page_snapshots WHERE tracked_page_id = p_page_id);

  DELETE FROM diff_tracker.page_snapshots WHERE tracked_page_id = p_page_id;
  DELETE FROM core.tracked_pages WHERE id = p_page_id;

  INSERT INTO admin.audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (v_admin_id, 'delete_tracked_page', 'tracked_page', p_page_id::TEXT,
    jsonb_build_object('company_name', v_page.company_name, 'url', v_page.url));
END;
$$;

-- Get distinct companies from tracked pages (for the add form company picker)
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
  GROUP BY tp.company_id, tp.company_name, tp.company_slug
  ORDER BY tp.company_name;
END;
$$;
