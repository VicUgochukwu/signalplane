import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDemo } from '@/contexts/DemoContext';
import { ExecutionKit } from '@/types/actionBoard';

/**
 * Hook for generating execution kits via Supabase edge function.
 * In demo mode, returns a no-op (kits are pre-populated in demo data).
 */
export function useExecutionKit() {
  const { user } = useAuth();
  const demo = useDemo();
  const queryClient = useQueryClient();

  const generateKitMutation = useMutation({
    mutationFn: async (cardId: string): Promise<ExecutionKit | null> => {
      if (demo?.isDemo) {
        // Demo kits are pre-populated — nothing to generate
        return null;
      }

      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('generate-execution-kit', {
        body: { card_id: cardId },
      });

      if (error) {
        console.error('Error generating execution kit:', error);
        throw error;
      }

      return data?.kit ?? data;
    },
    onSuccess: (_kit, _cardId) => {
      // Invalidate board cards query so the card refreshes with the new kit
      queryClient.invalidateQueries({ queryKey: ['action-board-cards', user?.id] });
    },
    onError: (error) => {
      console.error('Execution kit generation failed:', error);
    },
  });

  return {
    generateKit: generateKitMutation.mutate,
    generateKitAsync: generateKitMutation.mutateAsync,
    isGenerating: generateKitMutation.isPending,
    error: generateKitMutation.error,
    generatedKit: generateKitMutation.data,
    reset: generateKitMutation.reset,
  };
}
