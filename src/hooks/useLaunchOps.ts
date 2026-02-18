import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type {
  LaunchListItem,
  LaunchDetail,
  LaunchType,
} from '@/types/launchOps';

// âââ Hook ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function useLaunchOps() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // âââ User launches (list view) ââââââââââââââââââââââââââââââââââââââââââââ
  const { data: launches, isLoading: launchesLoading } = useQuery({
    queryKey: ['launches', user?.id],
    queryFn: async (): Promise<LaunchListItem[]> => {
      if (!user) return [];

      const { data, error } = await (supabase.rpc as any)('get_user_launches', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching launches:', error);
        return [];
      }

      return (data || []) as LaunchListItem[];
    },
    enabled: !!user,
  });

  // âââ Register launch ââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const registerLaunch = useMutation({
    mutationFn: async (params: {
      launchName: string;
      productName: string;
      launchType: LaunchType;
      targetDate: string;
      description?: string;
      competitorIds?: string[];
      competitorNames?: string[];
      tags?: string[];
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase.rpc as any)('register_launch', {
        p_user_id: user.id,
        p_launch_name: params.launchName,
        p_product_name: params.productName,
        p_launch_type: params.launchType,
        p_target_date: params.targetDate,
        p_description: params.description || null,
        p_competitor_ids: params.competitorIds || null,
        p_competitor_names: params.competitorNames || null,
        p_tags: params.tags || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['launches'] });
      toast({ title: 'Launch registered', description: 'Your launch has been added to the operations center.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to register launch', description: err.message, variant: 'destructive' });
    },
  });

  return {
    // Data
    launches: launches || [],
    isLoading: launchesLoading,

    // Mutations
    registerLaunch,
  };
}

// âââ Launch Detail Hook (separate, takes launchId) âââââââââââââââââââââââââââ

export function useLaunchDetail(launchId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['launch-detail', launchId],
    queryFn: async (): Promise<LaunchDetail | null> => {
      if (!user || !launchId) return null;

      const { data, error } = await (supabase.rpc as any)('get_launch_detail', {
        p_launch_id: launchId,
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching launch detail:', error);
        return null;
      }

      return data as LaunchDetail;
    },
    enabled: !!user && !!launchId,
  });
}
