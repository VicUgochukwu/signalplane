-- Fix circular RLS on team_members.
-- The existing policy "Team members can view members" references team_members
-- in its own USING clause, creating a circular dependency that blocks all reads.
--
-- Fix: Users can always see their OWN row (user_id = auth.uid()),
-- plus rows of co-members (same team_id).

-- Drop the circular policy
DROP POLICY IF EXISTS "Team members can view members" ON public.team_members;

-- Users can always read their own membership
CREATE POLICY "Users can view own membership" ON public.team_members
  FOR SELECT USING (user_id = auth.uid());

-- Users can view co-members (same team)
-- This works because the user's own row is readable via the policy above,
-- so the subquery can resolve the user's team_id.
CREATE POLICY "Users can view team co-members" ON public.team_members
  FOR SELECT USING (
    team_id IN (
      SELECT tm.team_id FROM public.team_members tm WHERE tm.user_id = auth.uid()
    )
  );
