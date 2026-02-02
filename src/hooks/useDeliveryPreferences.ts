import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface DeliveryPreference {
  id: string;
  user_id: string;
  channel_type: 'slack' | 'notion' | 'email';
  channel_config: Record<string, any>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useDeliveryPreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['delivery-preferences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_preferences')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DeliveryPreference[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ channelType, enabled }: { channelType: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('delivery_preferences')
        .update({ enabled })
        .eq('channel_type', channelType);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-preferences'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (channelType: string) => {
      const { error } = await supabase
        .from('delivery_preferences')
        .delete()
        .eq('channel_type', channelType);
      if (error) throw error;
    },
    onSuccess: (_data, channelType) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-preferences'] });
      toast({
        title: 'Disconnected',
        description: `${channelType.charAt(0).toUpperCase() + channelType.slice(1)} has been disconnected`,
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const connectSlack = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('slack-oauth-start');
      if (error) throw error;
      window.location.href = data.url;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to start Slack connection', variant: 'destructive' });
      setIsConnecting(false);
    }
  };

  const connectNotion = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('notion-oauth-start');
      if (error) throw error;
      window.location.href = data.url;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to start Notion connection', variant: 'destructive' });
      setIsConnecting(false);
    }
  };

  return {
    preferences,
    isLoading,
    connectSlack,
    connectNotion,
    disconnectChannel: (channelType: string) => disconnectMutation.mutate(channelType),
    toggleChannel: (channelType: string, enabled: boolean) =>
      toggleMutation.mutate({ channelType, enabled }),
    isConnecting,
  };
}
