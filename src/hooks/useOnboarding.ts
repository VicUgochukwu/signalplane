import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface CompanyProfile {
  id: string;
  company_name: string;
  industry?: string;
  created_at: string;
}

interface Competitor {
  id: string;
  name: string;
  domain?: string;
}

interface OnboardingState {
  profile: CompanyProfile | null;
  competitors: Competitor[];
  needsOnboarding: boolean;
  isLoading: boolean;
}

export const useOnboarding = (): OnboardingState => {
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['company-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching company profile:', error);
        return null;
      }
      return data as CompanyProfile | null;
    },
    enabled: !!user?.id,
  });

  const { data: competitors = [], isLoading: competitorsLoading } = useQuery({
    queryKey: ['competitors', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('competitors')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching competitors:', error);
        return [];
      }
      return data as Competitor[];
    },
    enabled: !!user?.id,
  });

  const isLoading = profileLoading || competitorsLoading;
  const needsOnboarding = !isLoading && !profile;

  return {
    profile,
    competitors,
    needsOnboarding,
    isLoading,
  };
};
