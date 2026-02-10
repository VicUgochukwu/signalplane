import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { PilotAccount, PilotStatusInfo } from '@/types/teams';

/**
 * Fetch pilot account and status for the current user.
 * Returns tier, status, days remaining, and competitor limits.
 */
export function usePilot() {
  const { user } = useAuth();

  const { data: pilot, isLoading, refetch } = useQuery({
    queryKey: ['pilot-account', user?.id],
    queryFn: async (): Promise<PilotAccount | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('pilot_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // no row
        console.error('Error fetching pilot account:', error);
        return null;
      }

      return data as PilotAccount;
    },
    enabled: !!user,
  });

  const statusInfo = useQuery({
    queryKey: ['pilot-status', user?.id],
    queryFn: async (): Promise<PilotStatusInfo | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .rpc('get_pilot_status', { p_user_id: user.id });

      if (error) {
        console.error('Error fetching pilot status:', error);
        return null;
      }

      // RPC returns a single row
      const row = Array.isArray(data) ? data[0] : data;
      return row ? (row as PilotStatusInfo) : null;
    },
    enabled: !!user,
  });

  const tier = pilot?.tier ?? 'free';
  const status = pilot?.status ?? 'free';
  const daysRemaining = statusInfo.data?.days_remaining ?? 0;
  const daysElapsed = statusInfo.data?.days_elapsed ?? 0;
  const maxCompetitors = pilot?.max_competitors ?? 2;
  const isPilot = status === 'pilot';
  const isGrace = status === 'grace';
  const isFree = status === 'free' || tier === 'free';
  const isPaid = status === 'active' && (tier === 'growth' || tier === 'enterprise');

  return {
    pilot,
    statusInfo: statusInfo.data,
    tier,
    status,
    daysRemaining,
    daysElapsed,
    maxCompetitors,
    isPilot,
    isGrace,
    isFree,
    isPaid,
    isLoading: isLoading || statusInfo.isLoading,
    refetch,
  };
}
