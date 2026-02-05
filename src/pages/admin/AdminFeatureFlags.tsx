import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface FeatureFlag {
  flag_key: string;
  label: string;
  description: string;
  is_enabled: boolean;
  applies_to: string;
}

export default function AdminFeatureFlags() {
  const queryClient = useQueryClient();

  const { data: flags, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_feature_flags');
      if (error) throw error;
      return data as FeatureFlag[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ flagKey, enabled }: { flagKey: string; enabled: boolean }) => {
      const { error } = await supabase.rpc('admin_toggle_feature_flag', {
        p_flag_key: flagKey,
        p_enabled: enabled,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Feature flag updated');
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
    onError: (error) => toast.error('Failed to update flag', { description: error.message }),
  });

  const getScopeBadge = (scope: string) => {
    const colors: Record<string, string> = {
      all: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      beta: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
    return <Badge className={colors[scope] || colors.all}>{scope}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Feature Flags</h2>

        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <Skeleton className="h-5 w-48 bg-zinc-700" />
                  <Skeleton className="h-4 w-72 bg-zinc-700" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : flags?.length === 0 ? (
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-8 text-center text-muted-foreground">
              No feature flags configured yet
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {flags?.map((flag) => (
              <Card key={flag.flag_key} className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-foreground">{flag.label}</CardTitle>
                        {getScopeBadge(flag.applies_to)}
                      </div>
                      <CardDescription>{flag.description}</CardDescription>
                      <code className="text-xs text-muted-foreground bg-zinc-900 px-2 py-0.5 rounded">
                        {flag.flag_key}
                      </code>
                    </div>
                    <Switch
                      checked={flag.is_enabled}
                      onCheckedChange={(enabled) => 
                        toggleMutation.mutate({ flagKey: flag.flag_key, enabled })
                      }
                      disabled={toggleMutation.isPending}
                    />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
