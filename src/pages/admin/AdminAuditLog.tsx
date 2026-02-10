import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface AuditLogEntry {
  id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

const formatAction = (action: string): string => {
  const actionMap: Record<string, string> = {
    suspend_user: 'Suspended user',
    unsuspend_user: 'Unsuspended user',
    ban_user: 'Banned user',
    unban_user: 'Unbanned user',
    set_user_role: 'Changed user role',
    toggle_feature_flag: 'Toggled feature flag',
  };
  return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const getActionColor = (action: string): string => {
  if (action.includes('ban')) return 'bg-red-500/20 text-red-400 border-red-500/30';
  if (action.includes('suspend')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  if (action.includes('role')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (action.includes('feature')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  return 'bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30';
};

export default function AdminAuditLog() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-audit-log'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_audit_log', {
        p_limit: 50,
        p_offset: 0,
      });
      if (error) throw error;
      return data as AuditLogEntry[];
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Audit Log</h2>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="bg-muted/50 border-border">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 bg-muted mb-2" />
                  <Skeleton className="h-3 w-1/2 bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : logs?.length === 0 ? (
          <Card className="bg-muted/50 border-border">
            <CardContent className="p-8 text-center text-muted-foreground">
              No audit log entries yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {logs?.map((log) => (
              <Card key={log.id} className="bg-muted/50 border-border">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getActionColor(log.action)}>
                          {formatAction(log.action)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          by {log.admin_email}
                        </span>
                      </div>
                      <div className="text-sm text-foreground">
                        Target: <span className="text-muted-foreground">{log.target_type}</span>
                        {log.target_id && (
                          <span className="text-muted-foreground ml-1">({log.target_id})</span>
                        )}
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 p-2 bg-background rounded text-xs font-mono">
                          {Object.entries(log.details).map(([key, value]) => (
                            <div key={key} className="text-muted-foreground">
                              <span className="text-muted-foreground">{key}:</span>{' '}
                              <span className="text-foreground">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
