import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ChangelogEntry } from '@/types/changelog';

export function useChangelog(enabled = true) {
  return useQuery({
    queryKey: ['changelog'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_changelog');
      if (error) throw error;
      return data as ChangelogEntry[];
    },
    enabled,
  });
}
