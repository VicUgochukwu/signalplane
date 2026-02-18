import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type {
  PositioningOverview,
  HealthScore,
  PositioningAudit,
  DriftEvent,
  OwnMessaging,
} from '@/types/positioningHealth';

// âââ Overview (dashboard stats) ââââââââââââââââââââââââââââââââââââââââââââââ

export function usePositioningHealth() {
  const { user } = useAuth();

  const { data: overview, isLoading } = useQuery({
    queryKey: ['positioning-overview', user?.id],
    queryFn: async (): Promise<PositioningOverview | null> => {
      if (!user) return null;

      const { data, error } = await (supabase.rpc as any)('get_positioning_overview', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching positioning overview:', error);
        return null;
      }

      return data as PositioningOverview;
    },
    enabled: !!user,
  });

  return {
    overview: overview || null,
    isLoading,
  };
}

// âââ Health Scores (monthly score history) âââââââââââââââââââââââââââââââââââ

export function useHealthScores() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['positioning-health-scores', user?.id],
    queryFn: async (): Promise<HealthScore[]> => {
      if (!user) return [];

      const { data, error } = await (supabase.rpc as any)('get_health_scores', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching health scores:', error);
        return [];
      }

      return (data || []) as HealthScore[];
    },
    enabled: !!user,
  });
}

// âââ Positioning Audits (quarterly audits) âââââââââââââââââââââââââââââââââââ

export function usePositioningAudits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['positioning-audits', user?.id],
    queryFn: async (): Promise<PositioningAudit[]> => {
      if (!user) return [];

      const { data, error } = await (supabase.rpc as any)('get_positioning_audits', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching positioning audits:', error);
        return [];
      }

      return (data || []) as PositioningAudit[];
    },
    enabled: !!user,
  });
}

// âââ Drift Events ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function useDriftEvents(daysBack: number = 90) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['positioning-drift-events', user?.id, daysBack],
    queryFn: async (): Promise<DriftEvent[]> => {
      if (!user) return [];

      const { data, error } = await (supabase.rpc as any)('get_drift_events', {
        p_user_id: user.id,
        p_days_back: daysBack,
      });

      if (error) {
        console.error('Error fetching drift events:', error);
        return [];
      }

      return (data || []) as DriftEvent[];
    },
    enabled: !!user,
  });
}

// âââ Own Messaging (tracked own pages) âââââââââââââââââââââââââââââââââââââââ

export function useOwnMessaging() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['positioning-own-messaging', user?.id],
    queryFn: async (): Promise<OwnMessaging[]> => {
      if (!user) return [];

      const { data, error } = await (supabase.rpc as any)('get_own_messaging', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching own messaging:', error);
        return [];
      }

      return (data || []) as OwnMessaging[];
    },
    enabled: !!user,
  });
}
