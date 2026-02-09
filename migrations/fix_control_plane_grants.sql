-- Fix: Grant service_role full access to control_plane schema
-- Required for n8n workflows that write signals via Supabase REST API
-- The service_role was missing SELECT permission, causing 403 Forbidden on INSERT with return=representation

GRANT USAGE ON SCHEMA control_plane TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA control_plane TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA control_plane TO service_role;

-- Also grant SELECT to service_role on control_plane.signals specifically
-- (redundant with ALL above, but explicit for clarity)
GRANT SELECT ON control_plane.signals TO service_role;
