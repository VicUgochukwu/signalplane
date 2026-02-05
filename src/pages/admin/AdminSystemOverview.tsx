import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight,
  ExternalLink,
  Clock,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SystemSummary {
  total_apis: number;
  healthy_apis: number;
  degraded_apis: number;
  down_apis: number;
  avg_response_time_ms: number;
}

interface HealthOverviewItem {
  api_name: string;
  api_slug: string;
  category: string;
  status: string;
  response_time_ms: number;
  http_status_code: number;
  error_message: string | null;
  checked_at: string;
  docs_url: string | null;
}

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface N8nExecution {
  id: string;
  workflowId: string;
  finished: boolean;
  startedAt: string;
  stoppedAt: string | null;
  status: 'success' | 'error' | 'waiting' | 'running';
}

function getRelativeTime(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

function getCategoryBadgeClass(category: string): string {
  switch (category) {
    case 'core':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'integration':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'external':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    default:
      return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  }
}

function getStatusDisplay(status: string): { dot: string; label: string } {
  switch (status) {
    case 'healthy':
      return { dot: 'bg-emerald-500', label: 'Healthy' };
    case 'degraded':
      return { dot: 'bg-amber-500', label: 'Degraded' };
    case 'down':
    case 'timeout':
    case 'error':
      return { dot: 'bg-red-500', label: 'Down' };
    default:
      return { dot: 'bg-zinc-500', label: 'No data' };
  }
}

function getExecutionStatusIcon(status: string) {
  switch (status) {
    case 'success':
      return <Check className="h-3 w-3 text-emerald-400" />;
    case 'error':
      return <X className="h-3 w-3 text-red-400" />;
    case 'running':
      return <Loader2 className="h-3 w-3 text-blue-400 animate-spin" />;
    case 'waiting':
      return <Clock className="h-3 w-3 text-amber-400" />;
    default:
      return <Clock className="h-3 w-3 text-zinc-400" />;
  }
}

export default function AdminSystemOverview() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['admin-system-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_system_summary');
      if (error) throw error;
      return data as SystemSummary;
    },
  });

  const { data: healthOverview, isLoading: healthLoading } = useQuery({
    queryKey: ['admin-health-overview'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_health_overview');
      if (error) throw error;
      return data as HealthOverviewItem[];
    },
    refetchInterval: 60000,
  });

  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['admin-n8n-workflows'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-system-monitor', {
        body: { action: 'n8n_list_workflows' },
      });
      if (error) throw error;
      return (data?.data || []) as N8nWorkflow[];
    },
    refetchInterval: 60000,
  });

  const { data: executions, isLoading: executionsLoading } = useQuery({
    queryKey: ['admin-n8n-executions'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-system-monitor', {
        body: { action: 'n8n_list_executions', limit: 10 },
      });
      if (error) throw error;
      return (data?.data || []) as N8nExecution[];
    },
    refetchInterval: 60000,
  });

  const statCards = [
    { label: 'Total APIs', value: summary?.total_apis ?? 0, icon: Server, color: 'text-blue-400' },
    { label: 'Healthy', value: summary?.healthy_apis ?? 0, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Degraded', value: summary?.degraded_apis ?? 0, icon: AlertTriangle, color: 'text-amber-400' },
    { label: 'Down', value: summary?.down_apis ?? 0, icon: XCircle, color: 'text-red-400' },
  ];

  const recentIssues = (healthOverview || []).filter(
    (item) => item.status !== 'healthy' && item.status !== 'unknown'
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">System Overview</h2>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-16 bg-zinc-700" />
                ) : (
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Avg Response Time */}
        {!summaryLoading && summary && (
          <p className="text-sm text-muted-foreground">
            Avg response time: {summary.avg_response_time_ms}ms
          </p>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: API Health Grid */}
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">API Status</CardTitle>
              <Link 
                to="/admin/api-health" 
                className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {healthLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 bg-zinc-700" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(healthOverview || []).map((api) => {
                    const statusDisplay = getStatusDisplay(api.status);
                    return (
                      <div 
                        key={api.api_slug} 
                        className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-700"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium text-sm text-foreground">{api.api_name}</span>
                          <Badge className={`text-xs ${getCategoryBadgeClass(api.category)}`}>
                            {api.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${statusDisplay.dot}`} />
                          <span className="text-xs text-foreground">{statusDisplay.label}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{api.response_time_ms}ms</span>
                          <span>{getRelativeTime(api.checked_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: n8n Workflows */}
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">Workflows</CardTitle>
              <Link 
                to="/admin/workflows" 
                className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {workflowsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 bg-zinc-700" />
                  ))}
                </div>
              ) : workflows && workflows.length > 0 ? (
                <div className="space-y-2">
                  {workflows.slice(0, 5).map((workflow) => (
                    <div 
                      key={workflow.id} 
                      className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/50"
                    >
                      <span className="font-medium text-sm text-foreground">{workflow.name}</span>
                      <Badge 
                        className={workflow.active 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                          : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                        }
                      >
                        {workflow.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  n8n integration not configured. Add N8N_BASE_URL and N8N_API_KEY to your edge function secrets.
                </p>
              )}

              {/* Recent Executions */}
              <div className="pt-4 border-t border-zinc-700">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Recent Executions</h4>
                {executionsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-6 bg-zinc-700" />
                    ))}
                  </div>
                ) : executions && executions.length > 0 ? (
                  <div className="space-y-2">
                    {executions.slice(0, 5).map((execution) => (
                      <div 
                        key={execution.id} 
                        className="flex items-center gap-2 text-xs"
                      >
                        {getExecutionStatusIcon(execution.status)}
                        <span className="font-mono text-muted-foreground">
                          {execution.id.slice(0, 8)}...
                        </span>
                        <span className="text-muted-foreground">
                          {getRelativeTime(execution.startedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No recent executions</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Issues */}
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Issues (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <Skeleton className="h-20 bg-zinc-700" />
            ) : recentIssues.length > 0 ? (
              <div className="space-y-2">
                {recentIssues.map((issue) => {
                  const statusDisplay = getStatusDisplay(issue.status);
                  return (
                    <div 
                      key={issue.api_slug} 
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${statusDisplay.dot}`} />
                        <span className="font-medium text-sm text-foreground">{issue.api_name}</span>
                        <Badge className={getCategoryBadgeClass(issue.category)}>
                          {statusDisplay.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="max-w-48 truncate">
                          {issue.error_message || 'No error message'}
                        </span>
                        <span>{getRelativeTime(issue.checked_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <span>All systems operational</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
