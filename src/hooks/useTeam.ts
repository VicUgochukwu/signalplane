import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Team, TeamMember, TeamInvite, TeamRole } from '@/types/teams';

/**
 * Fetch team, members, invites, and user role for the current user.
 * Pattern follows useOnboarding.ts.
 */
export function useTeam() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's team membership
  const { data: membership, isLoading: membershipLoading } = useQuery({
    queryKey: ['team-membership', user?.id],
    queryFn: async (): Promise<TeamMember | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching team membership:', error);
        return null;
      }

      return data as TeamMember;
    },
    enabled: !!user,
  });

  // Fetch team details (only if user has a team)
  const teamId = membership?.team_id;

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async (): Promise<Team | null> => {
      if (!teamId) return null;

      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error) {
        console.error('Error fetching team:', error);
        return null;
      }

      return data as Team;
    },
    enabled: !!teamId,
  });

  // Fetch team members with emails (via RPC that joins auth.users)
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async (): Promise<TeamMember[]> => {
      if (!teamId) return [];

      const { data, error } = await supabase
        .rpc('get_team_members_with_email', { p_team_id: teamId });

      if (error) {
        console.error('Error fetching team members:', error);
        return [];
      }

      return (data || []) as TeamMember[];
    },
    enabled: !!teamId,
  });

  // Fetch pending invites (admin only)
  const isAdmin = membership?.role === 'admin';

  const { data: invites, isLoading: invitesLoading } = useQuery({
    queryKey: ['team-invites', teamId],
    queryFn: async (): Promise<TeamInvite[]> => {
      if (!teamId) return [];

      const { data, error } = await supabase
        .from('team_invites')
        .select('*')
        .eq('team_id', teamId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching team invites:', error);
        return [];
      }

      return (data || []) as TeamInvite[];
    },
    enabled: !!teamId && isAdmin,
  });

  // Invite a team member
  const inviteMember = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: TeamRole }) => {
      if (!teamId || !user) throw new Error('No team or user');

      const { data, error } = await supabase
        .rpc('invite_team_member', {
          p_team_id: teamId,
          p_email: email,
          p_role: role,
          p_invited_by: user.id,
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invites', teamId] });
    },
  });

  // Revoke an invite
  const revokeInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('team_invites')
        .update({ status: 'revoked' })
        .eq('id', inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invites', teamId] });
    },
  });

  const role = membership?.role ?? null;
  const hasTeam = !!team;

  return {
    team,
    members: members || [],
    invites: invites || [],
    role,
    isAdmin,
    hasTeam,
    membership,
    isLoading: membershipLoading || teamLoading || membersLoading || (isAdmin ? invitesLoading : false),
    inviteMember,
    revokeInvite,
  };
}

/**
 * Accept a team invite by token.
 */
export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteToken: string) => {
      const { data, error } = await supabase
        .rpc('accept_team_invite', { p_invite_token: inviteToken });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-membership'] });
      queryClient.invalidateQueries({ queryKey: ['team'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}
