import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { NarrativeArc } from '@/types/narrativeGraph';

export function useNarrativeArcs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['narrative-arcs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_narrative_arcs_for_user', {
        p_user_id: user!.id,
      });
      if (error) throw error;
      return (data ?? []) as NarrativeArc[];
    },
    enabled: !!user,
  });
}
