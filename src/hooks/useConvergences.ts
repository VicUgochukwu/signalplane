import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Convergence } from '@/types/narrativeGraph';

export function useConvergences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['convergences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_active_convergences', {
        p_user_id: user!.id,
      });
      if (error) throw error;
      return (data ?? []) as Convergence[];
    },
    enabled: !!user,
  });
}
