import { useState } from 'react';
import { CheckCircle2, X, Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  useAdoptRecommendation,
  type AdoptionStatus,
} from '@/hooks/useRecommendationAdoption';

interface RecommendationTrackerProps {
  packetId: string;
  actionText: string;
  owner?: string;
  priority?: string;
  decisionType?: string;
  /** Current status from the adoptions query, if any */
  currentStatus?: AdoptionStatus;
  children: React.ReactNode;
}

const STATUS_STYLES: Record<AdoptionStatus, { bg: string; label: string; icon: React.ReactNode }> = {
  pending: {
    bg: '',
    label: 'Pending',
    icon: null,
  },
  adopted: {
    bg: 'border-emerald-500/30 bg-emerald-500/5',
    label: 'Adopted',
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  },
  dismissed: {
    bg: 'border-muted bg-muted/10 opacity-60',
    label: 'Dismissed',
    icon: <X className="h-3.5 w-3.5 text-muted-foreground" />,
  },
  deferred: {
    bg: 'border-amber-500/30 bg-amber-500/5',
    label: 'Deferred',
    icon: <Clock className="h-3.5 w-3.5 text-amber-400" />,
  },
};

/**
 * Wraps an action item with adopt/dismiss/defer controls.
 * Tracks recommendation adoption for compounding intelligence.
 */
export function RecommendationTracker({
  packetId,
  actionText,
  owner,
  priority,
  decisionType,
  currentStatus = 'pending',
  children,
}: RecommendationTrackerProps) {
  const [status, setStatus] = useState<AdoptionStatus>(currentStatus);
  const { mutate: adopt, isPending } = useAdoptRecommendation();

  const handleStatusChange = (newStatus: AdoptionStatus) => {
    setStatus(newStatus);
    adopt({
      packetId,
      actionText,
      status: newStatus,
      decisionType,
      ownerTeam: owner,
      priority,
    });
  };

  const style = STATUS_STYLES[status];

  return (
    <div className={cn('relative rounded-lg transition-all', style.bg)}>
      {children}

      {/* Status controls */}
      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/30">
        {status === 'pending' ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-accent-signal hover:text-accent-signal hover:bg-[hsl(var(--accent-signal)/0.1)] gap-1"
              onClick={() => handleStatusChange('adopted')}
              disabled={isPending}
            >
              <CheckCircle2 className="h-3 w-3" />
              Adopt
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 gap-1"
              onClick={() => handleStatusChange('deferred')}
              disabled={isPending}
            >
              <Clock className="h-3 w-3" />
              Defer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={() => handleStatusChange('dismissed')}
              disabled={isPending}
            >
              <X className="h-3 w-3" />
              Dismiss
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'text-xs gap-1',
                status === 'adopted' && 'border-emerald-500/50 text-emerald-400',
                status === 'dismissed' && 'border-muted text-muted-foreground',
                status === 'deferred' && 'border-amber-500/50 text-amber-400',
              )}
            >
              {style.icon}
              {style.label}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={() => handleStatusChange('pending')}
              disabled={isPending}
            >
              <RotateCcw className="h-2.5 w-2.5" />
              Reset
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
