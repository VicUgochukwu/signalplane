import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FeatureFlag {
  flag_key: string;
  label: string;
  description: string;
  is_enabled: boolean;
  applies_to: string;
}

export function useFeatureFlag() {
  const { data: flags, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_feature_flags');
      if (error) throw error;
      return data as FeatureFlag[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const isEnabled = (flagKey: string): boolean => {
    if (isLoading || !flags) return true; // Default to enabled while loading
    const flag = flags.find(f => f.flag_key === flagKey);
    return flag ? flag.is_enabled : true; // Default to enabled if flag not found
  };

  return { isEnabled, isLoading, flags };
}
