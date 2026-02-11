-- Enable pgcrypto extension (needed for gen_random_bytes in team invite tokens)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Recreate invite_team_member to use extensions.gen_random_bytes explicitly
-- (the default column also references gen_random_bytes, but Supabase may
--  resolve it if pgcrypto is in the search_path; the function uses SECURITY DEFINER
--  with search_path = 'public', so we must qualify the call)
CREATE OR REPLACE FUNCTION public.invite_team_member(
  p_team_id UUID,
  p_email TEXT,
  p_role TEXT DEFAULT 'pmm',
  p_invited_by UUID DEFAULT NULL
)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'extensions' AS $$
DECLARE
  v_token TEXT;
BEGIN
  INSERT INTO public.team_invites (team_id, email, role, invited_by)
  VALUES (p_team_id, LOWER(p_email), p_role, COALESCE(p_invited_by, auth.uid()))
  ON CONFLICT (team_id, email) DO UPDATE SET
    role = EXCLUDED.role,
    status = 'pending',
    invite_token = encode(extensions.gen_random_bytes(32), 'hex'),
    expires_at = NOW() + INTERVAL '7 days'
  RETURNING invite_token INTO v_token;

  RETURN v_token;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.invite_team_member(UUID, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_team_member(UUID, TEXT, TEXT, UUID) TO service_role;
