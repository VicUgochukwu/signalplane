import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type {
  WinLossIndicator,
  WinLossPattern,
  WinLossReport,
  WinLossDecisionMap,
  WinLossOverview,
  ChurnSignal,
} from '@/types/winloss';

// âââ Overview (dashboard stats) ââââââââââââââââââââââââââââââââââââââââââââââ

export function useWinLoss() {
  const { user } = useAuth();

  const { data: overview, isLoading } = useQuery({
    queryKey: ['winloss-overview', user?.id],
    queryFn: async (): Promise<WinLossOverview | null> => {
      if (!user) return null;

      const { data, error } = await (supabase.rpc as any)('get_winloss_overview', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching win/loss overview:', error);
        return null;
      }

      return data as WinLossOverview;
    },
    enabled: !!user,
  });

  return {
    overview: overview || null,
    isLoading,
  };
}

// âââ Indicators ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function useWinLossIndicators(daysBack: number = 90) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['winloss-indicators', user?.id, daysBack],
    queryFn: async (): Promise<WinLossIndicator[]> => {
      if (!user) return [];

      const { data, error } = await (supabase.rpc as any)('get_winloss_indicators', {
        p_user_id: user.id,
        p_days_back: daysBack,
      });

      if (error) {
        console.error('Error fetching win/loss indicators:', error);
        return [];
      }

      return (data || []) as WinLossIndicator[];
    },
    enabled: !!user,
  });
}

// âââ Patterns ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function useWinLossPatterns() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['winloss-patterns', user?.id],
    queryFn: async (): Promise<WinLossPattern[]> => {
      if (!user) return [];

      const { data, error } = await (supabase.rpc as any)('get_winloss_patterns', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching win/loss patterns:', error);
        return [];
      }

      return (data || []) as WinLossPattern[];
    },
    enabled: !!user,
  });
}

// âââ Reports âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function useWinLossReports() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['winloss-reports', user?.id],
    queryFn: async (): Promise<WinLossReport[]> => {
      if (!user) return [];

      const { data, error } = await (supabase.rpc as any)('get_winloss_reports', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching win/loss reports:', error);
        return [];
      }

      return (data || []) as WinLossReport[];
    },
    enabled: !!user,
  });
}

// âââ Decision Maps âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function useWinLossDecisionMaps() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['winloss-decision-maps', user?.id],
    queryFn: async (): Promise<WinLossDecisionMap[]> => {
      if (!user) return [];

      const { data, error } = await (supabase.rpc as any)('get_winloss_decision_maps', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching win/loss decision maps:', error);
        return [];
      }

      return (data || []) as WinLossDecisionMap[];
    },
    enabled: !!user,
  });
}

// âââ Churn Signals âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function useChurnSignals(daysBack: number = 30) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['winloss-churn', user?.id, daysBack],
    queryFn: async (): Promise<ChurnSignal[]> => {
      if (!user) return [];

      const { data, error } = await (supabase.rpc as any)('get_winloss_churn_signals', {
        p_user_id: user.id,
        p_days_back: daysBack,
      });

      if (error) {
        console.error('Error fetching churn signals:', error);
        return [];
      }

      return (data || []) as ChurnSignal[];
    },
    enabled: !!user,
  });
}
