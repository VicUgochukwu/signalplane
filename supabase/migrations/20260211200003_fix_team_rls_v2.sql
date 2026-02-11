-- Fix team_members RLS properly.
-- The previous attempt created two policies but the co-members one still
-- causes infinite recursion. The correct approach: a single policy that
-- allows users to see their own row directly.
-- Then use a SECURITY DEFINER function to break the circularity for co-members.

-- Drop all existing SELECT policies on team_members
DROP POLICY IF EXISTS "Team members can view members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view own membership" ON public.team_members;
DROP POLICY IF EXISTS "Users can view team co-members" ON public.team_members;

-- Simple non-recursive policy: you can see any row in a team you belong to.
-- We use a SECURITY DEFINER helper to break the circular RLS.
CREATE OR REPLACE FUNCTION public._user_team_ids(p_uid UUID)
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = 'public' AS $$
  SELECT team_id FROM public.team_members WHERE user_id = p_uid;
$$;

CREATE POLICY "Users can view own team members" ON public.team_members
  FOR SELECT USING (
    team_id IN (SELECT public._user_team_ids(auth.uid()))
  );

-- Also fix the teams table RLS — same circular issue
DROP POLICY IF EXISTS "Team members can view team" ON public.teams;

CREATE POLICY "Users can view own team" ON public.teams
  FOR SELECT USING (
    id IN (SELECT public._user_team_ids(auth.uid()))
  );

-- Fix team_invites RLS similarly
DROP POLICY IF EXISTS "Team admins can manage invites" ON public.team_invites;

CREATE OR REPLACE FUNCTION public._user_admin_team_ids(p_uid UUID)
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = 'public' AS $$
  SELECT team_id FROM public.team_members WHERE user_id = p_uid AND role = 'admin';
$$;

CREATE POLICY "Team admins can manage invites" ON public.team_invites
  FOR ALL USING (
    team_id IN (SELECT public._user_admin_team_ids(auth.uid()))
  );

-- Fix team_annotations RLS too
DROP POLICY IF EXISTS "Team members can view annotations" ON public.team_annotations;

CREATE POLICY "Team members can view annotations" ON public.team_annotations
  FOR SELECT USING (
    team_id IN (SELECT public._user_team_ids(auth.uid()))
  );

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION public._user_team_ids(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public._user_admin_team_ids(UUID) TO authenticated;
