import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDemo } from '@/contexts/DemoContext';
import type { KnowledgeLedgerMetrics } from '@/types/teams';

const DEMO_KNOWLEDGE: KnowledgeLedgerMetrics = {
  total_knowledge_objects: 247,
  total_signals_processed: 1_832,
  total_packets: 12,
  prediction_accuracy: 74,
  predictions_scored: 18,
  predictions_total: 26,
  competitors_monitored: 5,
  pages_tracked: 38,
  pilot_days_remaining: 42,
  pilot_days_elapsed: 18,
  weekly_signal_growth: 12,
};

/**
 * Fetch Knowledge Ledger metrics for the current user.
 * In demo mode, returns synthetic data.
 */
export function useKnowledgeLedger() {
  const { user } = useAuth();
  const demo = useDemo();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: demo?.isDemo
      ? ['demo-knowledge-ledger', demo.sectorSlug]
      : ['knowledge-ledger', user?.id],
    queryFn: async (): Promise<KnowledgeLedgerMetrics | null> => {
      if (demo?.isDemo) return DEMO_KNOWLEDGE;
      if (!user) return null;

      const { data: result, error: rpcError } = await supabase
        .rpc('get_knowledge_ledger', { p_user_id: user.id });

      if (rpcError) {
        console.error('Error fetching knowledge ledger:', rpcError);
        return null;
      }

      // RPC returns a single row (table-returning function)
      const row = Array.isArray(result) ? result[0] : result;
      return row ? (row as KnowledgeLedgerMetrics) : null;
    },
    enabled: !!user || !!demo?.isDemo,
    staleTime: 5 * 60 * 1000,
  });

  return {
    metrics: data,
    isLoading,
    error,
    refetch,
  };
}
