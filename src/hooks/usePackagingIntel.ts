import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type {
  PackagingOverview,
  PackagingLandscapeEntry,
  PackagingBrief,
  PackagingAudit,
  PackagingChange,
} from '@/types/packagingIntel';

// âââ Overview (dashboard stats) ââââââââââââââââââââââââââââââââââââââââââââââ

export function usePackagingIntel() {
  const { user } = useAuth();

  const { data: overview, isLoading } = useQuery({
    queryKey: ['packaging-overview', user?.id],
    queryFn: async (): Promise<PackagingOverview | null> => {
      if (!user) return null;

      const { data, error } = await (supabase.rpc as any)('get_packaging_overview', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching packaging overview:', error);
        return null;
      }

      return data as PackagingOverview;
    },
    enabled: !!user,
  });

  return {
    overview: overview || null,
    isLoading,
  };
}

// âââ Packaging Landscape âââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function usePackagingLandscape() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['packaging-landscape', user?.id],
    queryFn: async (): Promise<PackagingLandscapeEntry[]> => {
      if (!user) return [];

      const { data, error } = await (supabase.rpc as any)('get_packaging_landscape', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching packaging landscape:', error);
        return [];
      }

      return (data || []) as PackagingLandscapeEntry[];
    },
    enabled: !!user,
  });
}

// âââ Intelligence Briefs âââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function usePackagingBriefs(daysBack: number = 90) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['packaging-briefs', user?.id, daysBack],
    queryFn: async (): Promise<PackagingBrief[]> => {
      if (!user) return [];

      const { data, error } = await (supabase.rpc as any)('get_packaging_briefs', {
        p_user_id: user.id,
        p_days_back: daysBack,
      });

      if (error) {
        console.error('Error fetching packaging briefs:', error);
        return [];
      }

      return (data || []) as PackagingBrief[];
    },
    enabled: !!user,
  });
}

// âââ Packaging Audits ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function usePackagingAudits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['packaging-audits', user?.id],
    queryFn: async (): Promise<PackagingAudit[]> => {
      if (!user) return [];

      const { data, error } = await (supabase.rpc as any)('get_packaging_audits', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching packaging audits:', error);
        return [];
      }

      return (data || []) as PackagingAudit[];
    },
    enabled: !!user,
  });
}

// âââ Packaging Changes (from pricing_tracker) âââââââââââââââââââââââââââââââ

export function usePackagingChanges(daysBack: number = 90) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['packaging-changes', user?.id, daysBack],
    queryFn: async (): Promise<PackagingChange[]> => {
      if (!user) return [];

      const { data, error } = await (supabase.rpc as any)('get_packaging_changes', {
        p_user_id: user.id,
        p_days_back: daysBack,
      });

      if (error) {
        console.error('Error fetching packaging changes:', error);
        return [];
      }

      return (data || []) as PackagingChange[];
    },
    enabled: !!user,
  });
}
