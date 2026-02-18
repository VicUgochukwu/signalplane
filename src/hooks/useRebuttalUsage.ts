import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface RebuttalUsageStat {
  objection_id: string;
  helped_count: number;
  not_helpful_count: number;
  total_uses: number;
}

/**
 * Fetch aggregated usage stats for all objections in a library version.
 * Returns a Map keyed by objection_id for O(1) lookups.
 */
export function useRebuttalUsageStats(versionId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['rebuttal-usage-stats', versionId, user?.id],
    enabled: !!versionId && !!user?.id && !!supabase,
    queryFn: async (): Promise<Map<string, RebuttalUsageStat>> => {
      if (!supabase || !versionId) return new Map();

      const { data, error } = await supabase.rpc(
        'get_rebuttal_usage_stats' as any,
        { p_library_version_id: versionId }
      );

      if (error) {
        console.error('Failed to fetch rebuttal usage stats:', error.message);
        return new Map();
      }

      const map = new Map<string, RebuttalUsageStat>();
      for (const row of (data || []) as RebuttalUsageStat[]) {
        map.set(row.objection_id, row);
      }
      return map;
    },
  });
}

/**
 * Mutation to record a rebuttal usage event (thumbs up/down).
 */
export function useRecordRebuttalUsage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      objectionId: string;
      libraryVersionId: string;
      outcome: 'helped' | 'not_helpful';
      dealName?: string;
      contextNote?: string;
    }) => {
      if (!supabase) throw new Error('Supabase not configured');

      const { data, error } = await supabase.rpc(
        'record_rebuttal_usage' as any,
        {
          p_objection_id: params.objectionId,
          p_library_version_id: params.libraryVersionId,
          p_outcome: params.outcome,
          p_deal_name: params.dealName || null,
          p_context_note: params.contextNote || null,
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate usage stats so the UI refreshes
      queryClient.invalidateQueries({ queryKey: ['rebuttal-usage-stats', variables.libraryVersionId] });
      toast({
        title: variables.outcome === 'helped' ? 'Marked as helpful' : 'Marked as not helpful',
        description: 'Your feedback helps improve future rebuttals.',
      });
    },
    onError: (error: any) => {
      console.error('Failed to record rebuttal usage:', error);
      toast({
        title: 'Failed to record feedback',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });
}
