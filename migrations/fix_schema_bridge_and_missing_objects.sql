-- ============================================
-- Fix Schema Bridge & Missing Database Objects
--
-- Resolves:
-- 1. public ↔ core schema bridge for tracked_pages (n8n reads public, admin writes core)
-- 2. public ↔ diff_tracker bridge for page_snapshots/page_diffs
-- 3. Missing get_my_tracked_pages RPC
-- 4. Missing get_decrypted_delivery_channels RPC
-- 5. Missing delivery_logs table
-- 6. RLS policies for control_plane.packets (frontend reads)
-- 7. RLS policies for gtm_artifacts tables (frontend reads)
-- ============================================

-- =========================================================
-- SECTION 1: Bridge views from public → core/diff_tracker
-- n8n queries "FROM tracked_pages" which hits public schema.
-- Admin RPCs write to core.tracked_pages.
-- These views ensure both sides see the same data.
-- =========================================================

-- Only create the view if the public table doesn't already exist
-- (if it does exist as a table, we need to drop it first since it's empty)
DO $$
BEGIN
  -- Check if public.tracked_pages exists as a TABLE (not a view)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tracked_pages' AND table_type = 'BASE TABLE'
  ) THEN
    -- Check if the table is empty (safe to replace with view)
    IF (SELECT count(*) FROM public.tracked_pages) = 0 THEN
      DROP TABLE public.tracked_pages CASCADE;
    ELSE
      -- Table has data — migrate it to core first
      INSERT INTO core.tracked_pages
        SELECT * FROM public.tracked_pages
        ON CONFLICT DO NOTHING;
      DROP TABLE public.tracked_pages CASCADE;
    END IF;
  END IF;

  -- Create view if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'tracked_pages'
  ) THEN
    EXECUTE 'CREATE VIEW public.tracked_pages AS SELECT * FROM core.tracked_pages';
  END IF;
END $$;

-- Similarly for page_snapshots
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'page_snapshots' AND table_type = 'BASE TABLE'
  ) THEN
    IF (SELECT count(*) FROM public.page_snapshots) = 0 THEN
      DROP TABLE public.page_snapshots CASCADE;
    ELSE
      INSERT INTO diff_tracker.page_snapshots
        SELECT * FROM public.page_snapshots
        ON CONFLICT DO NOTHING;
      DROP TABLE public.page_snapshots CASCADE;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'page_snapshots'
  ) THEN
    EXECUTE 'CREATE VIEW public.page_snapshots AS SELECT * FROM diff_tracker.page_snapshots';
  END IF;
END $$;

-- Similarly for page_diffs
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'page_diffs' AND table_type = 'BASE TABLE'
  ) THEN
    IF (SELECT count(*) FROM public.page_diffs) = 0 THEN
      DROP TABLE public.page_diffs CASCADE;
    ELSE
      INSERT INTO diff_tracker.page_diffs
        SELECT * FROM public.page_diffs
        ON CONFLICT DO NOTHING;
      DROP TABLE public.page_diffs CASCADE;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'page_diffs'
  ) THEN
    EXECUTE 'CREATE VIEW public.page_diffs AS SELECT * FROM diff_tracker.page_diffs';
  END IF;
END $$;

-- Similarly for classified_changes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'classified_changes' AND table_type = 'BASE TABLE'
  ) THEN
    IF (SELECT count(*) FROM public.classified_changes) = 0 THEN
      DROP TABLE public.classified_changes CASCADE;
    ELSE
      INSERT INTO diff_tracker.classified_changes
        SELECT * FROM public.classified_changes
        ON CONFLICT DO NOTHING;
      DROP TABLE public.classified_changes CASCADE;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'classified_changes'
  ) THEN
    EXECUTE 'CREATE VIEW public.classified_changes AS SELECT * FROM diff_tracker.classified_changes';
  END IF;
END $$;


-- =========================================================
-- SECTION 2: Missing get_my_tracked_pages RPC
-- Called by TrackedPagesList.tsx component
-- Returns tracked pages for the currently authenticated user
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_my_tracked_pages()
RETURNS TABLE (
  id UUID,
  company_id UUID,
  company_name TEXT,
  company_slug TEXT,
  url TEXT,
  url_type TEXT,
  enabled BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    tp.id,
    tp.company_id,
    tp.company_name,
    tp.company_slug,
    tp.url,
    tp.url_type,
    tp.enabled,
    tp.created_at
  FROM core.tracked_pages tp
  WHERE tp.company_id IN (
    -- Pages whose company matches user's tracked competitors
    SELECT utc.company_id
    FROM public.user_tracked_competitors utc
    WHERE utc.user_id = v_user_id
      AND utc.is_active = TRUE
      AND utc.company_id IS NOT NULL
  )
  OR tp.user_id = v_user_id
  ORDER BY tp.company_name, tp.url;
END;
$$;


-- =========================================================
-- SECTION 3: Missing delivery_logs table
-- Written by send-weekly-report edge function
-- =========================================================

CREATE TABLE IF NOT EXISTS public.delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  channel_type TEXT NOT NULL CHECK (channel_type IN ('slack', 'notion', 'email')),
  week_start_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_logs_user_week
  ON public.delivery_logs (user_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_created
  ON public.delivery_logs (created_at DESC);


-- =========================================================
-- SECTION 4: Missing get_decrypted_delivery_channels RPC
-- Called by send-weekly-report edge function
-- Returns enabled delivery preferences with decrypted config
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_decrypted_delivery_channels()
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  channel_type TEXT,
  channel_config JSONB
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dp.user_id,
    au.email AS user_email,
    dp.channel_type,
    dp.channel_config
  FROM public.delivery_preferences dp
  JOIN auth.users au ON au.id = dp.user_id
  WHERE dp.enabled = TRUE;
END;
$$;


-- =========================================================
-- SECTION 5: RLS for control_plane.packets
-- Frontend needs to read packets via authenticated user
-- =========================================================

ALTER TABLE control_plane.packets ENABLE ROW LEVEL SECURITY;

-- Users can read generic packets or their own personalized packets
DROP POLICY IF EXISTS packets_select_policy ON control_plane.packets;
CREATE POLICY packets_select_policy ON control_plane.packets
  FOR SELECT
  USING (
    user_id IS NULL  -- generic packets visible to all
    OR user_id = auth.uid()  -- personalized packets visible to owner
  );

-- Service role (n8n) can insert/update packets
DROP POLICY IF EXISTS packets_service_insert ON control_plane.packets;
CREATE POLICY packets_service_insert ON control_plane.packets
  FOR INSERT
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS packets_service_update ON control_plane.packets;
CREATE POLICY packets_service_update ON control_plane.packets
  FOR UPDATE
  USING (TRUE);

-- Expose control_plane schema to PostgREST (needed for .schema('control_plane') calls)
GRANT USAGE ON SCHEMA control_plane TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA control_plane TO anon, authenticated;

-- =========================================================
-- SECTION 6: RLS for gtm_artifacts tables
-- Frontend needs to read artifacts via authenticated user
-- =========================================================

ALTER TABLE gtm_artifacts.objection_library_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtm_artifacts.swipe_file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtm_artifacts.battlecard_versions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read artifacts
DROP POLICY IF EXISTS artifacts_objection_select ON gtm_artifacts.objection_library_versions;
CREATE POLICY artifacts_objection_select ON gtm_artifacts.objection_library_versions
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS artifacts_swipe_select ON gtm_artifacts.swipe_file_versions;
CREATE POLICY artifacts_swipe_select ON gtm_artifacts.swipe_file_versions
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS artifacts_battlecard_select ON gtm_artifacts.battlecard_versions;
CREATE POLICY artifacts_battlecard_select ON gtm_artifacts.battlecard_versions
  FOR SELECT USING (TRUE);

-- Expose gtm_artifacts schema to PostgREST
GRANT USAGE ON SCHEMA gtm_artifacts TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA gtm_artifacts TO anon, authenticated;


-- =========================================================
-- SECTION 7: Ensure delivery_logs has proper grants
-- =========================================================

GRANT INSERT, SELECT ON public.delivery_logs TO authenticated;
GRANT INSERT, SELECT ON public.delivery_logs TO service_role;
