import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Deal, DealOutcome } from '@/types/teams';

/**
 * Fetch deals for the current user.
 */
export function useDeals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: deals, isLoading, refetch } = useQuery({
    queryKey: ['deals', user?.id],
    queryFn: async (): Promise<Deal[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Table may not exist yet until migration runs — graceful fallback
        if (error.code === '42P01') return [];
        console.error('Error fetching deals:', error);
        return [];
      }

      return (data || []) as Deal[];
    },
    enabled: !!user,
  });

  const logDeal = useMutation({
    mutationFn: async (deal: {
      competitor_name: string;
      outcome: DealOutcome;
      deal_name?: string;
      deal_value?: number;
      close_date?: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .rpc('log_deal', {
          p_user_id: user.id,
          p_competitor_name: deal.competitor_name,
          p_outcome: deal.outcome,
          p_deal_name: deal.deal_name || null,
          p_deal_value: deal.deal_value || null,
          p_close_date: deal.close_date || null,
          p_notes: deal.notes || null,
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const winsCount = (deals || []).filter(d => d.outcome === 'won').length;
  const lossesCount = (deals || []).filter(d => d.outcome === 'lost').length;
  const inProgressCount = (deals || []).filter(d => d.outcome === 'in_progress').length;

  return {
    deals: deals || [],
    winsCount,
    lossesCount,
    inProgressCount,
    isLoading,
    logDeal,
    refetch,
  };
}
