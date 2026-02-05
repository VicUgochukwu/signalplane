import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  ExternalLink, 
  Loader2, 
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ApiRegistry {
  id: string;
  api_name: string;
  api_slug: string;
  health_check_url: string;
  health_check_method: string;
  expected_status_codes: number[];
  timeout_ms: number;
  category: string;
  enabled: boolean;
  docs_url: string | null;
  created_at: string;
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

interface HealthHistoryItem {
  status: string;
  response_time_ms: number;
  http_status_code: number;
  error_message: string | null;
  checked_at: string;
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

function getStatusIcon(status: string) {
  switch (status) {
    case 'healthy':
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case 'degraded':
      return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    case 'down':
    case 'timeout':
    case 'error':
      return <XCircle className="h-4 w-4 text-red-400" />;
    default:
      return <div className="h-4 w-4 rounded-full bg-zinc-500" />;
  }
}

function getLatencyColor(ms: number): string {
  if (ms < 500) return 'text-emerald-400';
  if (ms <= 2000) return 'text-amber-400';
  return 'text-red-400';
}

function getStatusDotColor(status: string): string {
  switch (status) {
    case 'healthy':
      return 'bg-emerald-500';
    case 'degraded':
      return 'bg-amber-500';
    case 'down':
    case 'timeout':
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-zinc-500';
  }
}

export default function AdminApiHealth() {
  const [selectedApi, setSelectedApi] = useState<ApiRegistry | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d'>('24h');
  const [checkingApi, setCheckingApi] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: apiRegistry, isLoading: registryLoading } = useQuery({
    queryKey: ['admin-api-registry'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_api_registry');
      if (error) throw error;
      return data as ApiRegistry[];
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

  const hoursMap = { '24h': 24, '7d': 168 };

  const { data: healthHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['admin-health-history', selectedApi?.api_slug, timeRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_health_history', {
        p_api_slug: selectedApi!.api_slug,
        p_hours: hoursMap[timeRange],
      });
      if (error) throw error;
      return (data as HealthHistoryItem[]).map((item) => ({
        ...item,
        time: timeRange === '24h' 
          ? format(new Date(item.checked_at), 'HH:mm')
          : format(new Date(item.checked_at), 'MMM d'),
      }));
    },
    enabled: !!selectedApi,
  });

  const manualCheckMutation = useMutation({
    mutationFn: async (apiSlug: string) => {
      setCheckingApi(apiSlug);
      const { data, error } = await supabase.functions.invoke('admin-system-monitor', {
        body: { action: 'manual_health_check', api_slug: apiSlug },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Health check completed');
      queryClient.invalidateQueries({ queryKey: ['admin-health-overview'] });
    },
    onError: (error) => {
      toast.error(`Health check failed: ${error.message}`);
    },
    onSettled: () => {
      setCheckingApi(null);
    },
  });

  // Merge registry with health status
  const apisWithHealth = (apiRegistry || []).map((api) => {
    const health = (healthOverview || []).find((h) => h.api_slug === api.api_slug);
    return {
      ...api,
      status: health?.status || 'unknown',
      response_time_ms: health?.response_time_ms || 0,
      checked_at: health?.checked_at || '',
    };
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">API Health</h2>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-foreground">API Registry</CardTitle>
          </CardHeader>
          <CardContent>
            {registryLoading || healthLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 bg-zinc-700" />
                ))}
              </div>
            ) : apisWithHealth.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-700 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">API</TableHead>
                    <TableHead className="text-muted-foreground">Category</TableHead>
                    <TableHead className="text-muted-foreground">Endpoint</TableHead>
                    <TableHead className="text-muted-foreground">Method</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Latency</TableHead>
                    <TableHead className="text-muted-foreground">Last Check</TableHead>
                    <TableHead className="text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apisWithHealth.map((api) => (
                    <TableRow 
                      key={api.id} 
                      className="border-zinc-700 hover:bg-zinc-800/50 cursor-pointer"
                      onClick={() => setSelectedApi(api)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{api.api_name}</span>
                          {api.docs_url && (
                            <a 
                              href={api.docs_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryBadgeClass(api.category)}>
                          {api.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground font-mono max-w-32 truncate block">
                          {api.health_check_url}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {api.health_check_method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(api.status)}
                          <span className="text-sm capitalize text-foreground">{api.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm ${getLatencyColor(api.response_time_ms)}`}>
                          {api.response_time_ms}ms
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {api.checked_at ? getRelativeTime(api.checked_at) : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            manualCheckMutation.mutate(api.api_slug);
                          }}
                          disabled={checkingApi === api.api_slug}
                          className="text-xs"
                        >
                          {checkingApi === api.api_slug ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Check
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No APIs registered</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Detail Sheet */}
        <Sheet open={!!selectedApi} onOpenChange={() => setSelectedApi(null)}>
          <SheetContent className="bg-zinc-900 border-zinc-700 w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-foreground">{selectedApi?.api_name}</SheetTitle>
            </SheetHeader>
            
            {selectedApi && (
              <div className="mt-6 space-y-6">
                {/* API Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Category</p>
                    <Badge className={`mt-1 ${getCategoryBadgeClass(selectedApi.category)}`}>
                      {selectedApi.category}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Method</p>
                    <Badge variant="outline" className="mt-1">
                      {selectedApi.health_check_method}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Endpoint</p>
                    <code className="text-sm text-foreground font-mono break-all">
                      {selectedApi.health_check_url}
                    </code>
                  </div>
                </div>

                {/* Time Range Selector */}
                <div>
                  <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as '24h' | '7d')}>
                    <TabsList className="bg-zinc-800">
                      <TabsTrigger value="24h" className="data-[state=active]:bg-zinc-700">
                        24h
                      </TabsTrigger>
                      <TabsTrigger value="7d" className="data-[state=active]:bg-zinc-700">
                        7 days
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Latency Chart */}
                <Card className="bg-zinc-800/50 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-foreground">Response Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {historyLoading ? (
                      <Skeleton className="h-48 bg-zinc-700" />
                    ) : healthHistory && healthHistory.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={healthHistory}>
                          <XAxis 
                            dataKey="time" 
                            stroke="#71717a" 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#71717a" 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `${v}ms`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#27272a', 
                              border: '1px solid #3f3f46',
                              borderRadius: '6px',
                            }}
                            labelStyle={{ color: '#a1a1aa' }}
                            formatter={(value: number) => [`${value}ms`, 'Latency']}
                          />
                          <Line 
                            type="monotone"
                            dataKey="response_time_ms" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Status Timeline */}
                <Card className="bg-zinc-800/50 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-foreground">Status Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {historyLoading ? (
                      <Skeleton className="h-6 bg-zinc-700" />
                    ) : healthHistory && healthHistory.length > 0 ? (
                      <div className="flex gap-0.5">
                        {healthHistory.slice(-48).map((item, i) => (
                          <div
                            key={i}
                            className={`h-6 flex-1 rounded-sm ${getStatusDotColor(item.status)}`}
                            title={`${item.status} - ${format(new Date(item.checked_at), 'MMM d, HH:mm')}`}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No data</div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Checks Table */}
                <Card className="bg-zinc-800/50 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-foreground">Recent Checks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {historyLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-10 bg-zinc-700" />
                        ))}
                      </div>
                    ) : healthHistory && healthHistory.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow className="border-zinc-700 hover:bg-transparent">
                            <TableHead className="text-muted-foreground">Status</TableHead>
                            <TableHead className="text-muted-foreground">HTTP</TableHead>
                            <TableHead className="text-muted-foreground">Latency</TableHead>
                            <TableHead className="text-muted-foreground">Error</TableHead>
                            <TableHead className="text-muted-foreground">Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {healthHistory.slice(0, 10).map((item, i) => (
                            <TableRow key={i} className="border-zinc-700">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(item.status)}
                                  <span className="text-sm capitalize text-foreground">
                                    {item.status}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {item.http_status_code || '-'}
                              </TableCell>
                              <TableCell>
                                <span className={`text-sm ${getLatencyColor(item.response_time_ms)}`}>
                                  {item.response_time_ms}ms
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-32 truncate">
                                {item.error_message || '-'}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(item.checked_at), 'HH:mm:ss')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-sm text-muted-foreground">No checks recorded</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
