import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type {
  VocEntry,
  VocOverview,
  VocTrends,
  PersonaReport,
  MarketPulse,
} from '@/types/vocResearch';

// âââ Overview (dashboard stats) ââââââââââââââââââââââââââââââââââââââââââââââ

export function useVocResearch() {
  const { user } = useAuth();

  const { data: overview, isLoading } = useQuery({
    queryKey: ['voc-overview', user?.id],
    queryFn: async (): Promise<VocOverview | null> => {
      if (!user) return null;

      const { data, error } = await (supabase.rpc as any)('get_voc_overview', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching VoC overview:', error);
        return null;
      }

      return data as VocOverview;
    },
    enabled: !!user,
  });

  return {
    overview: overview || null,
    isLoading,
  };
}

// âââ VoC Entries (filterable) ââââââââââââââââââââââââââââââââââââââââââââââââ

export function useVocEntries(
  dimension?: string,
  persona?: string,
  daysBack: number = 90,
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['voc-entries', user?.id, dimension, persona, daysBack],
    queryFn: async (): Promise<VocEntry[]> => {
      if (!user) return [];

      const { data, error } = await (supabase.rpc as any)('get_voc_entries', {
        p_user_id: user.id,
        p_dimension: dimension || null,
        p_persona: persona || null,
        p_days_back: daysBack,
      });

      if (error) {
        console.error('Error fetching VoC entries:', error);
        return [];
      }

      return (data || []) as VocEntry[];
    },
    enabled: !!user,
  });
}

// âââ Persona Reports âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function usePersonaReports() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['voc-persona-reports', user?.id],
    queryFn: async (): Promise<PersonaReport[]> => {
      if (!user) return [];

      const { data, error } = await (supabase.rpc as any)('get_persona_reports', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching persona reports:', error);
        return [];
      }

      return (data || []) as PersonaReport[];
    },
    enabled: !!user,
  });
}

// âââ Market Pulse ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function useMarketPulse() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['voc-market-pulse', user?.id],
    queryFn: async (): Promise<MarketPulse[]> => {
      if (!user) return [];

      const { data, error } = await (supabase.rpc as any)('get_market_pulse', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching market pulse:', error);
        return [];
      }

      return (data || []) as MarketPulse[];
    },
    enabled: !!user,
  });
}

// âââ VoC Trends ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function useVocTrends(daysBack: number = 90) {
  const { user } = useAuth();

  const { data: trends, isLoading } = useQuery({
    queryKey: ['voc-trends', user?.id, daysBack],
    queryFn: async (): Promise<VocTrends | null> => {
      if (!user) return null;

      const { data, error } = await (supabase.rpc as any)('get_voc_trends', {
        p_user_id: user.id,
        p_days_back: daysBack,
      });

      if (error) {
        console.error('Error fetching VoC trends:', error);
        return null;
      }

      return data as VocTrends;
    },
    enabled: !!user,
  });

  return {
    trends: trends || null,
    isLoading,
  };
}
