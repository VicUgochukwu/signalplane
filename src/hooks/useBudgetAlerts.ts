import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BudgetAlert {
  id: string;
  alert_type: 'warning' | 'critical';
  threshold_percent: number;
  current_spend: number;
  budget_limit: number;
  message: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
}

export const useBudgetAlerts = () => {
  return useQuery({
    queryKey: ['budget-alerts'],
    queryFn: async (): Promise<BudgetAlert[]> => {
      const { data, error } = await supabase
        .schema('ops')
        .from('budget_alerts')
        .select('*')
        .eq('acknowledged', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching budget alerts:', error);
        throw error;
      }

      return (data || []).map((row): BudgetAlert => ({
        id: row.id,
        alert_type: row.threshold_percent >= 90 ? 'critical' : 'warning',
        threshold_percent: row.threshold_percent ?? 0,
        current_spend: row.current_spend ?? 0,
        budget_limit: row.budget_limit ?? 0,
        message: row.message || 'Budget threshold exceeded',
        acknowledged: row.acknowledged ?? false,
        acknowledged_at: row.acknowledged_at,
        acknowledged_by: row.acknowledged_by,
        created_at: row.created_at,
      }));
    },
    refetchInterval: 60000,
  });
};

export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .schema('ops')
        .from('budget_alerts')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: 'admin',
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-alerts'] });
    },
  });
};
