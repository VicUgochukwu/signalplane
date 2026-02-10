import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { KnowledgeLedgerMetrics } from '@/types/teams';

/**
 * Fetch Knowledge Ledger metrics for the current user.
 * Calls the `get_knowledge_ledger` RPC which aggregates
 * knowledge objects, signals, packets, prediction accuracy,
 * and pilot progress in a single query.
 */
export function useKnowledgeLedger() {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['knowledge-ledger', user?.id],
    queryFn: async (): Promise<KnowledgeLedgerMetrics | null> => {
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
    enabled: !!user,
    // Refresh every 5 minutes (ledger data is not real-time critical)
    staleTime: 5 * 60 * 1000,
  });

  return {
    metrics: data,
    isLoading,
    error,
    refetch,
  };
}
