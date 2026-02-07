import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserCompanyProfile {
  id: string;
  user_id: string;
  company_name: string;
  company_domain: string | null;
  industry: string | null;
  company_size: string | null;
  job_title: string | null;
  department: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TrackedCompetitor {
  id: string;
  user_id: string;
  company_id: string | null;
  competitor_name: string;
  competitor_domain: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
}

export function useOnboarding() {
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['user-company-profile', user?.id],
    queryFn: async (): Promise<UserCompanyProfile | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // PGRST116 = no rows found, which is expected for new users
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data as UserCompanyProfile;
    },
    enabled: !!user,
  });

  const { data: competitors, isLoading: competitorsLoading, refetch: refetchCompetitors } = useQuery({
    queryKey: ['user-tracked-competitors', user?.id],
    queryFn: async (): Promise<TrackedCompetitor[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_tracked_competitors')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) {
        console.error('Error fetching competitors:', error);
        return [];
      }

      return (data || []) as TrackedCompetitor[];
    },
    enabled: !!user,
  });

  const needsOnboarding = !profileLoading && !profile?.onboarding_completed_at;
  const isLoading = profileLoading || competitorsLoading;

  const refetch = () => {
    refetchProfile();
    refetchCompetitors();
  };

  return {
    profile,
    competitors,
    needsOnboarding,
    isLoading,
    refetch,
  };
}

export function useUserCompanyProfile() {
  const { profile, isLoading } = useOnboarding();
  return { profile, isLoading };
}

export function useTrackedCompetitors() {
  const { competitors, isLoading } = useOnboarding();
  return { competitors, isLoading };
}
