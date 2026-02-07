import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Check, RotateCcw, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { WorkflowFailure } from '@/hooks/useWorkflowFailures';
import { useResolveFailure, useIgnoreFailure, useRetryFailure } from '@/hooks/useWorkflowFailures';

interface WorkflowFailuresTableProps {
  failures: WorkflowFailure[];
}

const statusConfig = {
  failed: {
    color: 'bg-red-500/20 text-red-400 border-red-500/40',
    label: 'Failed',
  },
  retried: {
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    label: 'Retried',
  },
  resolved: {
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    label: 'Resolved',
  },
  ignored: {
    color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/40',
    label: 'Ignored',
  },
};

export const WorkflowFailuresTable = ({ failures }: WorkflowFailuresTableProps) => {
  const resolveFailure = useResolveFailure();
  const ignoreFailure = useIgnoreFailure();
  const retryFailure = useRetryFailure();

  if (failures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p className="font-mono text-sm">No failures in the last 7 days</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="font-mono text-zinc-400">Workflow</TableHead>
            <TableHead className="font-mono text-zinc-400">Failed Node</TableHead>
            <TableHead className="font-mono text-zinc-400">Error</TableHead>
            <TableHead className="font-mono text-zinc-400">Status</TableHead>
            <TableHead className="font-mono text-zinc-400">Retries</TableHead>
            <TableHead className="font-mono text-zinc-400">Failed At</TableHead>
            <TableHead className="font-mono text-zinc-400 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {failures.map((failure) => {
            const config = statusConfig[failure.status];
            const isActionable = failure.status === 'failed' || failure.status === 'retried';

            return (
              <TableRow key={failure.id} className="border-zinc-800">
                <TableCell className="font-mono font-medium text-zinc-200">
                  {failure.workflow_name}
                </TableCell>
                <TableCell className="font-mono text-zinc-400 text-sm">
                  {failure.failed_node || '—'}
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-mono text-xs text-zinc-400 truncate block cursor-help">
                        {failure.error_message || 'No error message'}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-md">
                      <p className="font-mono text-xs whitespace-pre-wrap">
                        {failure.error_message || 'No error message'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('text-xs', config.color)}>
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-zinc-400">
                  {failure.retry_count}
                </TableCell>
                <TableCell className="font-mono text-zinc-400 text-sm">
                  {formatDistanceToNow(new Date(failure.failed_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  {isActionable && (
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                            onClick={() => resolveFailure.mutate(failure.id)}
                            disabled={resolveFailure.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Resolve</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                            onClick={() => retryFailure.mutate(failure.id)}
                            disabled={retryFailure.isPending}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Retry</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-500/10"
                            onClick={() => ignoreFailure.mutate(failure.id)}
                            disabled={ignoreFailure.isPending}
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ignore</TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
