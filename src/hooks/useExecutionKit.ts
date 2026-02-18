import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDemo } from '@/contexts/DemoContext';
import { useToast } from './use-toast';
import { ExecutionKit } from '@/types/actionBoard';

/**
 * Hook for generating execution kits via Supabase edge function.
 * In demo mode, returns a no-op (kits are pre-populated in demo data).
 */
export function useExecutionKit() {
  const { user } = useAuth();
  const demo = useDemo();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const generateKitMutation = useMutation({
    mutationFn: async (cardId: string): Promise<ExecutionKit | null> => {
      if (demo?.isDemo) {
        return null;
      }

      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('generate-execution-kit', {
        body: { card_id: cardId },
      });

      if (error) {
        console.error('Error generating execution kit:', error);
        throw new Error(typeof error === 'object' && error.message ? error.message : 'Failed to generate execution kit');
      }

      // Check if the edge function returned an error in the response body
      if (data?.error) {
        console.error('Edge function error:', data.error);
        throw new Error(data.error);
      }

      const kit = data?.execution_kit ?? data?.kit ?? null;
      if (!kit || !kit.components) {
        console.error('Invalid kit response:', data);
        throw new Error('Received invalid execution kit response');
      }

      return kit;
    },
    onSuccess: (_kit, _cardId) => {
      queryClient.invalidateQueries({ queryKey: ['action-board-cards', user?.id] });
      toast({ title: 'Execution kit generated', description: 'Your tailored materials are ready.' });
    },
    onError: (error) => {
      console.error('Execution kit generation failed:', error);
      toast({
        title: 'Failed to generate execution kit',
        description: (error as Error).message || 'Please try again.',
        variant: 'destructive',
      });
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
