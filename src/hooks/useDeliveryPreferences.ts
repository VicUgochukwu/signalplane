import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { invokeEdgeFunction } from '@/lib/edge-functions';
import { useAuth } from './useAuth';

interface DeliveryPreference {
  id: string;
  user_id: string;
  channel_type: 'slack' | 'notion' | 'email';
  channel_config: Record<string, any>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotionDatabase {
  id: string;
  title: string;
  icon: string | null;
  url: string | null;
}

export function useDeliveryPreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['delivery-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('delivery_preferences')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DeliveryPreference[];
    },
    enabled: !!user,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ channelType, enabled }: { channelType: string; enabled: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('delivery_preferences')
        .update({ enabled })
        .eq('channel_type', channelType)
        .eq('user_id', user.id);
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
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('delivery_preferences')
        .delete()
        .eq('channel_type', channelType)
        .eq('user_id', user.id);
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

  // --- Slack OAuth ---
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

  // --- Notion OAuth ---
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

  // --- Notion Database Operations ---
  const fetchNotionDatabases = async (): Promise<NotionDatabase[]> => {
    const data = await invokeEdgeFunction<{ databases: NotionDatabase[] }>('notion-databases', { action: 'list' });
    return data.databases;
  };

  const selectNotionDatabase = useMutation({
    mutationFn: async ({ databaseId, databaseName }: { databaseId: string; databaseName: string }) => {
      return await invokeEdgeFunction('notion-databases', {
        action: 'select',
        database_id: databaseId,
        database_name: databaseName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-preferences'] });
      toast({ title: 'Database selected', description: 'Your Notion database has been configured.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const testNotionConnection = useMutation({
    mutationFn: async () => {
      return await invokeEdgeFunction('notion-databases', { action: 'test' });
    },
    onSuccess: () => {
      toast({ title: 'Connection verified', description: 'Test page was successfully created and removed.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Test failed', description: error.message, variant: 'destructive' });
    },
  });

  return {
    preferences,
    isLoading,
    connectSlack,
    connectNotion,
    fetchNotionDatabases,
    selectNotionDatabase: (databaseId: string, databaseName: string) =>
      selectNotionDatabase.mutate({ databaseId, databaseName }),
    isSelectingDatabase: selectNotionDatabase.isPending,
    testNotionConnection: () => testNotionConnection.mutate(),
    isTestingNotion: testNotionConnection.isPending,
    disconnectChannel: (channelType: string) => disconnectMutation.mutate(channelType),
    toggleChannel: (channelType: string, enabled: boolean) =>
      toggleMutation.mutate({ channelType, enabled }),
    isConnecting,
  };
}
