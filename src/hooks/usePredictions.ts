import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { PredictionOutcome } from '@/types/report';

export interface NormalizedPrediction {
  id: string;
  packet_id: string;
  user_id: string | null;
  company_id: string | null;
  company_name: string | null;
  prediction_text: string;
  timeframe: string | null;
  confidence: number | null;
  status: 'open' | 'resolved' | 'expired';
  created_at: string;
  // Joined outcome
  outcome?: PredictionOutcome;
  outcome_notes?: string | null;
  scored_at?: string | null;
  scored_by?: string | null;
}

export interface PredictionAccuracy {
  company_name: string | null;
  total: number;
  scored: number;
  correct: number;
  incorrect: number;
  partial: number;
  accuracy_rate: number;
}

/**
 * Fetch normalized predictions for a specific packet.
 */
export function usePredictions(packetId: string | null) {
  const { user } = useAuth();

  const { data: predictions, isLoading, refetch } = useQuery({
    queryKey: ['predictions', packetId],
    queryFn: async (): Promise<NormalizedPrediction[]> => {
      if (!packetId) return [];

      if (!user) return [];

      // Fetch predictions scoped to this user's packet
      const { data: preds, error: predError } = await supabase
        .from('predictions')
        .select('*')
        .eq('packet_id', packetId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (predError) {
        console.error('Error fetching predictions:', predError);
        return [];
      }

      if (!preds || preds.length === 0) return [];

      // Fetch outcomes for these predictions
      const predIds = preds.map(p => p.id);
      const { data: outcomes, error: outError } = await supabase
        .from('prediction_outcomes')
        .select('*')
        .in('prediction_id', predIds);

      if (outError) {
        console.error('Error fetching outcomes:', outError);
      }

      const outcomeMap = new Map(
        (outcomes || []).map(o => [o.prediction_id, o])
      );

      return preds.map(p => {
        const outcome = outcomeMap.get(p.id);
        return {
          ...p,
          outcome: outcome?.outcome as PredictionOutcome | undefined,
          outcome_notes: outcome?.notes ?? null,
          scored_at: outcome?.scored_at ?? null,
          scored_by: outcome?.scored_by ?? null,
        } as NormalizedPrediction;
      });
    },
    enabled: !!packetId && !!user,
  });

  return {
    predictions: predictions || [],
    isLoading,
    refetch,
  };
}

/**
 * Score a prediction (mark as correct/incorrect/partial).
 */
export function useScorePrediction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      predictionId,
      outcome,
      notes,
    }: {
      predictionId: string;
      outcome: PredictionOutcome;
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .rpc('score_prediction', {
          p_prediction_id: predictionId,
          p_outcome: outcome,
          p_notes: notes || null,
          p_scored_by: user.id,
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.invalidateQueries({ queryKey: ['prediction-accuracy'] });
    },
  });
}

/**
 * Fetch prediction accuracy stats for the current user.
 */
export function usePredictionAccuracy() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['prediction-accuracy', user?.id],
    queryFn: async (): Promise<PredictionAccuracy[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .rpc('get_prediction_accuracy', { p_user_id: user.id });

      if (error) {
        console.error('Error fetching prediction accuracy:', error);
        return [];
      }

      return (Array.isArray(data) ? data : []) as PredictionAccuracy[];
    },
    enabled: !!user,
  });
}
