import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, Database, Users, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface UsageSummary {
  total_uploads: number;
  total_rows_processed: number;
  active_users_7d: number;
  active_users_30d: number;
  flagged_users: number;
}

interface LeaderboardEntry {
  user_id: string;
  user_email: string;
  display_name: string;
  upload_count: number;
  total_rows_processed: number;
  last_active: string;
  abuse_flag_count: number;
}

interface AbuseFlag {
  id: string;
  user_id: string;
  user_email: string;
  display_name: string;
  flag_type: string;
  severity: string;
  description: string;
  resolved: boolean;
  resolved_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export default function AdminUsageReports() {
  const queryClient = useQueryClient();
  const [resolvedFilter, setResolvedFilter] = useState<string>('unresolved');

  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['admin-usage-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_usage_summary');
      if (error) throw error;
      return data as UsageSummary;
    },
  });

  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ['admin-usage-leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_usage_leaderboard', {
        p_days: 30,
        p_limit: 25,
      });
      if (error) throw error;
      return data as LeaderboardEntry[];
    },
  });

  const { data: abuseFlags, isLoading: isLoadingFlags } = useQuery({
    queryKey: ['admin-abuse-flags', resolvedFilter],
    queryFn: async () => {
      const resolvedParam = resolvedFilter === 'all' ? null : resolvedFilter === 'resolved';
      const { data, error } = await supabase.rpc('admin_get_abuse_flags', {
        p_resolved: resolvedParam,
        p_limit: 50,
      });
      if (error) throw error;
      return data as AbuseFlag[];
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (flagId: string) => {
      const { error } = await supabase.rpc('admin_resolve_abuse_flag', {
        p_flag_id: flagId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Flag resolved');
      queryClient.invalidateQueries({ queryKey: ['admin-abuse-flags'] });
      queryClient.invalidateQueries({ queryKey: ['admin-usage-summary'] });
    },
    onError: (error) => {
      toast.error('Failed to resolve flag', { description: error.message });
    },
  });

  const getFlagTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      large_upload: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      high_volume: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      rapid_requests: 'bg-red-500/20 text-red-400 border-red-500/30',
      suspicious_pattern: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };
    return <Badge className={colors[type] || 'bg-muted-foreground/20 text-muted-foreground'}>{type.replace('_', ' ')}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30',
      medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      high: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return <Badge className={colors[severity] || colors.low}>{severity}</Badge>;
  };

  const summaryCards = [
    { label: 'Total Uploads', value: summary?.total_uploads || 0, icon: Upload, color: 'text-blue-400' },
    { label: 'Rows Processed', value: summary?.total_rows_processed || 0, icon: Database, color: 'text-emerald-400' },
    { label: 'Active Users (7d)', value: summary?.active_users_7d || 0, icon: Users, color: 'text-amber-400' },
    { label: 'Active Users (30d)', value: summary?.active_users_30d || 0, icon: Users, color: 'text-purple-400' },
    { label: 'Flagged Users', value: summary?.flagged_users || 0, icon: AlertTriangle, color: 'text-red-400' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Usage Reports</h2>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted border-border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="abuse">Abuse Flags</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {isLoadingSummary ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="bg-muted/50 border-border">
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-20 mb-2 bg-muted" />
                      <Skeleton className="h-8 w-16 bg-muted" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                summaryCards.map((card) => (
                  <Card key={card.label} className="bg-muted/50 border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <card.icon className={`h-4 w-4 ${card.color}`} />
                        <span className="text-sm text-muted-foreground">{card.label}</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {card.value.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Quick Stats */}
            {summary && (
              <Card className={`border ${summary.flagged_users > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  {summary.flagged_users > 0 ? (
                    <>
                      <AlertTriangle className="h-5 w-5 text-amber-400" />
                      <span className="text-amber-400">
                        {summary.flagged_users} user(s) flagged for review
                      </span>
                      <Button
                        variant="link"
                        className="text-amber-400 p-0 h-auto"
                        onClick={() => {
                          const tabsList = document.querySelector('[data-state="inactive"][value="abuse"]');
                          if (tabsList) (tabsList as HTMLElement).click();
                        }}
                      >
                        View flags →
                      </Button>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <span className="text-emerald-400">All systems operational - No abuse flags detected</span>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card className="bg-muted/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">User Activity Leaderboard (30 days)</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingLeaderboard ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 bg-muted" />
                    ))}
                  </div>
                ) : leaderboard && leaderboard.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead>User</TableHead>
                        <TableHead>Uploads</TableHead>
                        <TableHead>Rows Processed</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Flags</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.map((entry) => (
                        <TableRow key={entry.user_id} className="border-border">
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{entry.user_email}</p>
                              {entry.display_name && (
                                <p className="text-xs text-muted-foreground">{entry.display_name}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{entry.upload_count}</TableCell>
                          <TableCell>{entry.total_rows_processed?.toLocaleString() || 0}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {entry.last_active
                              ? formatDistanceToNow(new Date(entry.last_active), { addSuffix: true })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {entry.abuse_flag_count > 0 ? (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                {entry.abuse_flag_count}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No user activity recorded</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Abuse Flags Tab */}
          <TabsContent value="abuse" className="space-y-4">
            <div className="flex items-center gap-4">
              <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
                <SelectTrigger className="w-40 bg-muted border-border">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="bg-muted/50 border-border">
              <CardContent className="p-0">
                {isLoadingFlags ? (
                  <div className="p-4 space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 bg-muted" />
                    ))}
                  </div>
                ) : abuseFlags && abuseFlags.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {abuseFlags.map((flag) => (
                        <TableRow key={flag.id} className="border-border">
                          <TableCell className="text-sm">{flag.user_email}</TableCell>
                          <TableCell>{getFlagTypeBadge(flag.flag_type)}</TableCell>
                          <TableCell>{getSeverityBadge(flag.severity)}</TableCell>
                          <TableCell className="text-sm max-w-xs truncate">
                            {flag.description}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(flag.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            {flag.resolved ? (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                Resolved
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                                Open
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!flag.resolved && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => resolveMutation.mutate(flag.id)}
                                disabled={resolveMutation.isPending}
                              >
                                {resolveMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Resolve'
                                )}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {resolvedFilter === 'unresolved'
                        ? 'No unresolved abuse flags'
                        : 'No abuse flags found'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
