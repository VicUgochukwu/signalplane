import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type AdoptionStatus = 'pending' | 'adopted' | 'dismissed' | 'deferred';

export interface RecommendationAdoption {
  id: string;
  user_id: string;
  packet_id: string;
  action_text: string;
  decision_type: string | null;
  owner_team: string | null;
  priority: string | null;
  status: AdoptionStatus;
  adopted_at: string | null;
  dismissed_at: string | null;
  dismiss_reason: string | null;
  outcome: string | null;
  outcome_notes: string | null;
  outcome_recorded_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch recommendation adoption status for a specific packet.
 */
export function useRecommendationAdoptions(packetId: string | undefined) {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['recommendation-adoptions', packetId, user?.id],
    queryFn: async (): Promise<RecommendationAdoption[]> => {
      if (!user || !packetId) return [];

      const { data: result, error: rpcError } = await supabase
        .rpc('get_recommendation_adoptions', {
          p_user_id: user.id,
          p_packet_id: packetId,
        });

      if (rpcError) {
        console.error('Error fetching recommendation adoptions:', rpcError);
        return [];
      }

      return (result || []) as unknown as RecommendationAdoption[];
    },
    enabled: !!user && !!packetId,
    staleTime: 2 * 60 * 1000,
  });

  return { adoptions: data || [], isLoading, error, refetch };
}

/**
 * Mutation to record or update a recommendation adoption.
 */
export function useAdoptRecommendation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      packetId: string;
      actionText: string;
      status: AdoptionStatus;
      decisionType?: string;
      ownerTeam?: string;
      priority?: string;
      dismissReason?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .rpc('record_recommendation_adoption', {
          p_user_id: user.id,
          p_packet_id: params.packetId,
          p_action_text: params.actionText,
          p_status: params.status,
          p_decision_type: params.decisionType || null,
          p_owner_team: params.ownerTeam || null,
          p_priority: params.priority || null,
          p_dismiss_reason: params.dismissReason || null,
        });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['recommendation-adoptions', variables.packetId],
      });
      queryClient.invalidateQueries({
        queryKey: ['compounding-metrics'],
      });

      const statusLabels: Record<AdoptionStatus, string> = {
        adopted: 'Marked as adopted',
        dismissed: 'Dismissed',
        deferred: 'Deferred for later',
        pending: 'Reset to pending',
      };

      toast({
        title: statusLabels[variables.status],
        description: variables.actionText.substring(0, 80) + (variables.actionText.length > 80 ? '...' : ''),
      });
    },
    onError: (error) => {
      console.error('Failed to update adoption:', error);
      toast({
        title: 'Failed to update',
        description: 'Could not save recommendation status',
        variant: 'destructive',
      });
    },
  });
}
