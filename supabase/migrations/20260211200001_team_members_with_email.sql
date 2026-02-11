-- Create a view that joins team_members with auth.users to include email
-- This is needed because the frontend displays member emails but team_members
-- only stores user_id.

-- Use a SECURITY DEFINER function instead of a view since auth.users
-- is not accessible via RLS to normal authenticated users
CREATE OR REPLACE FUNCTION public.get_team_members_with_email(p_team_id UUID)
RETURNS TABLE (
  id UUID,
  team_id UUID,
  user_id UUID,
  role TEXT,
  invited_by UUID,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  email TEXT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  -- Only allow team members to see their own team's members
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = p_team_id AND tm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this team';
  END IF;

  RETURN QUERY
  SELECT
    tm.id,
    tm.team_id,
    tm.user_id,
    tm.role,
    tm.invited_by,
    tm.joined_at,
    tm.created_at,
    au.email
  FROM public.team_members tm
  LEFT JOIN auth.users au ON au.id = tm.user_id
  WHERE tm.team_id = p_team_id
  ORDER BY tm.joined_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_members_with_email(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_members_with_email(UUID) TO service_role;
