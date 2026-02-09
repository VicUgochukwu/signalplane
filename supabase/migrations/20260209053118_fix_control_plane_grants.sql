-- ============================================
-- Fix: Grant SELECT on control_plane.packets to anon/authenticated
--
-- Problem: public.packets is a VIEW that reads from control_plane.packets.
-- The view itself has SELECT granted to anon/authenticated, BUT the 
-- underlying table control_plane.packets only has grants for postgres.
-- Since the view runs as the caller (not SECURITY DEFINER), 
-- anon/authenticated get permission denied when reading through the view.
--
-- Solution: Grant SELECT on the underlying table so the view works
-- for all roles that need to read packets.
-- ============================================

-- Grant SELECT on the underlying control_plane.packets table
-- so the public.packets view works for frontend users
GRANT SELECT ON control_plane.packets TO anon, authenticated;

-- Also grant SELECT on control_plane.signals (used by some admin RPCs)
GRANT SELECT ON control_plane.signals TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON control_plane.packets TO service_role;
GRANT INSERT, UPDATE, DELETE ON control_plane.signals TO service_role;
