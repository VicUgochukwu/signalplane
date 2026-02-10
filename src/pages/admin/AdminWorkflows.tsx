import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  Check, 
  X, 
  Loader2, 
  Clock, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow, format, differenceInSeconds } from 'date-fns';

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
  mode?: string;
  data?: {
    resultData?: {
      runData?: Record<string, Array<{
        executionTime?: number;
        error?: { message: string };
      }>>;
    };
  };
}

function getRelativeTime(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

function formatDuration(startedAt: string, stoppedAt: string | null): string {
  if (!stoppedAt) return 'Running...';
  try {
    const seconds = differenceInSeconds(new Date(stoppedAt), new Date(startedAt));
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } catch {
    return 'Unknown';
  }
}

function getExecutionStatusBadge(status: string) {
  switch (status) {
    case 'success':
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          <Check className="h-3 w-3 mr-1" /> Success
        </Badge>
      );
    case 'error':
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <X className="h-3 w-3 mr-1" /> Error
        </Badge>
      );
    case 'running':
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Running
        </Badge>
      );
    case 'waiting':
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
          <Clock className="h-3 w-3 mr-1" /> Waiting
        </Badge>
      );
    default:
      return (
        <Badge className="bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30">
          Unknown
        </Badge>
      );
  }
}

export default function AdminWorkflows() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<N8nWorkflow | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<N8nExecution | null>(null);

  const { data: workflows, isLoading: workflowsLoading, error: workflowsError } = useQuery({
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
    queryKey: ['admin-n8n-executions', selectedWorkflow?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-system-monitor', {
        body: { 
          action: 'n8n_list_executions', 
          workflowId: selectedWorkflow?.id,
          limit: 20 
        },
      });
      if (error) throw error;
      return (data?.data || []) as N8nExecution[];
    },
    enabled: !!selectedWorkflow,
    refetchInterval: 30000,
  });

  const { data: executionDetail } = useQuery({
    queryKey: ['admin-n8n-execution-detail', selectedExecution?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-system-monitor', {
        body: { 
          action: 'n8n_get_execution', 
          executionId: selectedExecution?.id 
        },
      });
      if (error) throw error;
      return data?.data as N8nExecution;
    },
    enabled: !!selectedExecution,
  });

  if (workflowsError) {
    const errorMessage = workflowsError instanceof Error ? workflowsError.message : 'Unknown error';
    const isConfigError = errorMessage.includes('n8n') || errorMessage.includes('configuration');

    return (
      <AdminLayout>
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Workflows</h2>
          <Card className="bg-muted/50 border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-amber-400 mb-4" />
              <p className="text-foreground font-medium mb-2">
                {isConfigError ? 'n8n integration not configured' : 'Error loading workflows'}
              </p>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {isConfigError 
                  ? 'Add N8N_BASE_URL and N8N_API_KEY to your edge function secrets to enable workflow monitoring.'
                  : errorMessage
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Workflows</h2>

        <Card className="bg-muted/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Workflow Registry</CardTitle>
          </CardHeader>
          <CardContent>
            {workflowsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 bg-muted" />
                ))}
              </div>
            ) : workflows && workflows.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Created</TableHead>
                    <TableHead className="text-muted-foreground">Updated</TableHead>
                    <TableHead className="text-muted-foreground w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((workflow) => (
                    <TableRow 
                      key={workflow.id} 
                      className="border-border hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedWorkflow(workflow)}
                    >
                      <TableCell className="font-medium text-foreground">
                        {workflow.name}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={workflow.active 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                            : 'bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30'
                          }
                        >
                          {workflow.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(workflow.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {getRelativeTime(workflow.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No workflows found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Execution History Sheet */}
        <Sheet open={!!selectedWorkflow} onOpenChange={() => setSelectedWorkflow(null)}>
          <SheetContent className="bg-background border-border w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-foreground">
                Executions — {selectedWorkflow?.name}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              {executionsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 bg-muted" />
                  ))}
                </div>
              ) : executions && executions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">ID</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Started</TableHead>
                      <TableHead className="text-muted-foreground">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executions.map((execution) => (
                      <TableRow 
                        key={execution.id} 
                        className="border-border hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedExecution(execution)}
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {execution.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          {getExecutionStatusBadge(execution.status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(execution.startedAt), 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDuration(execution.startedAt, execution.stoppedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No executions found</p>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Execution Detail Dialog */}
        <Dialog open={!!selectedExecution} onOpenChange={() => setSelectedExecution(null)}>
          <DialogContent className="bg-background border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">Execution Details</DialogTitle>
            </DialogHeader>
            {selectedExecution && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Execution ID</p>
                    <p className="font-mono text-sm text-foreground">{selectedExecution.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="mt-1">{getExecutionStatusBadge(selectedExecution.status)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Started</p>
                    <p className="text-sm text-foreground">
                      {format(new Date(selectedExecution.startedAt), 'MMM d, yyyy HH:mm:ss')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm text-foreground">
                      {formatDuration(selectedExecution.startedAt, selectedExecution.stoppedAt)}
                    </p>
                  </div>
                </div>

                {executionDetail?.data?.resultData?.runData ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Node Execution Timeline</p>
                    <div className="space-y-2">
                      {Object.entries(executionDetail.data.resultData.runData).map(([nodeName, runs]) => (
                        <div 
                          key={nodeName} 
                          className="flex items-center justify-between p-2 rounded bg-muted"
                        >
                          <span className="text-sm text-foreground">{nodeName}</span>
                          <div className="flex items-center gap-2">
                            {runs[0]?.error ? (
                              <X className="h-4 w-4 text-red-400" />
                            ) : (
                              <Check className="h-4 w-4 text-emerald-400" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {runs[0]?.executionTime ? `${runs[0].executionTime}ms` : '-'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Detailed node data not available
                  </p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
