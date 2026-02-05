import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ChangelogEntry } from '@/types/changelog';

export function useMyChangelog(enabled: boolean) {
  return useQuery({
    queryKey: ['my-changelog'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_changelog');
      if (error) throw error;
      return data as ChangelogEntry[];
    },
    enabled,
  });
}
