import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WorkflowFailure {
  id: string;
  workflow_name: string;
  failed_node: string | null;
  error_message: string | null;
  status: 'failed' | 'retried' | 'resolved' | 'ignored';
  retry_count: number;
  failed_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export const useWorkflowFailures = () => {
  return useQuery({
    queryKey: ['workflow-failures'],
    queryFn: async (): Promise<WorkflowFailure[]> => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .schema('ops')
        .from('workflow_failures')
        .select('*')
        .gte('failed_at', sevenDaysAgo)
        .order('failed_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching workflow failures:', error);
        throw error;
      }

      return (data || []).map((row): WorkflowFailure => ({
        id: row.id,
        workflow_name: row.workflow_name || 'Unknown',
        failed_node: row.failed_node,
        error_message: row.error_message,
        status: row.status || 'failed',
        retry_count: row.retry_count ?? 0,
        failed_at: row.failed_at,
        resolved_at: row.resolved_at,
        resolved_by: row.resolved_by,
      }));
    },
    refetchInterval: 60000,
  });
};

export const useResolveFailure = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (failureId: string) => {
      const { error } = await supabase
        .schema('ops')
        .from('workflow_failures')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: 'admin',
        })
        .eq('id', failureId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-failures'] });
    },
  });
};

export const useIgnoreFailure = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (failureId: string) => {
      const { error } = await supabase
        .schema('ops')
        .from('workflow_failures')
        .update({
          status: 'ignored',
        })
        .eq('id', failureId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-failures'] });
    },
  });
};

export const useRetryFailure = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (failureId: string) => {
      // First get current retry count
      const { data: current } = await supabase
        .schema('ops')
        .from('workflow_failures')
        .select('retry_count')
        .eq('id', failureId)
        .single();
      
      const { error } = await supabase
        .schema('ops')
        .from('workflow_failures')
        .update({
          status: 'retried',
          retry_count: (current?.retry_count ?? 0) + 1,
        })
        .eq('id', failureId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-failures'] });
    },
  });
};
