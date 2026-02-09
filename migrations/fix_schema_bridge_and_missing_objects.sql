-- ============================================
-- Fix Schema Bridge & Missing Database Objects
-- Applied to live Supabase database on 2026-02-09.
--
-- Actual database state (verified via diagnostic migration):
-- - public.packets is a VIEW pointing to control_plane.packets
-- - control_plane.packets is the TABLE with RLS enabled
-- - control_plane.packets had RLS policies but NO SELECT grant for anon/authenticated
-- - public.tracked_pages is a TABLE (different columns from core.tracked_pages)
-- - gtm_artifacts tables exist with RLS enabled + policies + grants (already correct)
-- - delivery_logs, delivery_preferences, user_tracked_competitors exist (already correct)
-- - get_my_tracked_pages and get_decrypted_delivery_channels RPCs exist (already correct)
-- - Schemas (core, diff_tracker, control_plane, gtm_artifacts) all have USAGE grants (already correct)
--
-- ROOT CAUSE OF EMPTY UI:
-- public.packets VIEW reads from control_plane.packets, but anon/authenticated
-- didn't have SELECT on control_plane.packets. The view runs as CALLER (not
-- SECURITY DEFINER), so the caller's role needs direct access to the underlying table.
--
-- What this migration actually applied:
-- 1. GRANT SELECT on control_plane.packets to anon, authenticated
-- 2. GRANT SELECT on control_plane.signals to anon, authenticated
-- 3. GRANT INSERT/UPDATE/DELETE on control_plane tables to service_role
-- ============================================

-- Fix: Grant SELECT on the underlying control_plane tables
-- so the public.packets VIEW works for frontend users (anon/authenticated)
GRANT SELECT ON control_plane.packets TO anon, authenticated;
GRANT SELECT ON control_plane.signals TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON control_plane.packets TO service_role;
GRANT INSERT, UPDATE, DELETE ON control_plane.signals TO service_role;
