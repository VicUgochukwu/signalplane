import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { invokeEdgeFunction } from '@/lib/edge-functions';

interface SubmitSignalPayload {
  text: string;
  signal_type?: string;
  source_type?: string;
  company?: string;
  author?: string;
  severity?: number;
  context?: string;
}

interface SubmitSignalResponse {
  success: boolean;
  event_id: string;
  message: string;
}

export function useSubmitSignal() {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (payload: SubmitSignalPayload) => {
      return await invokeEdgeFunction<SubmitSignalResponse>('manual-signal-submit', payload);
    },
    onSuccess: (data) => {
      toast({
        title: 'Signal submitted',
        description: data.message || 'It will be processed and included in your next weekly packet.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Submission failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    submitSignal: (payload: SubmitSignalPayload) => mutation.mutate(payload),
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}
