import { CheckCircle2, Clock, AlertTriangle, XCircle, Radio } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { ShipStatus } from '@/hooks/useShipStatus';

interface ShipStatusCardProps {
  ship: ShipStatus;
}

const statusConfig = {
  healthy: {
    icon: CheckCircle2,
    color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    label: 'Healthy',
  },
  ok: {
    icon: Clock,
    color: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    label: 'OK',
  },
  stale: {
    icon: AlertTriangle,
    color: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    label: 'Stale',
  },
  missing: {
    icon: XCircle,
    color: 'bg-red-500/20 border-red-500/40 text-red-400',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
    label: 'Missing',
  },
};

const getTimeProgressColor = (hours: number | null): string => {
  if (hours === null) return 'bg-muted';
  if (hours < 24) return 'bg-emerald-500';
  if (hours < 48) return 'bg-amber-500';
  return 'bg-red-500';
};

const getTimeProgressValue = (hours: number | null): number => {
  if (hours === null) return 0;
  // Cap at 72 hours for the progress bar
  return Math.min((hours / 72) * 100, 100);
};

export const ShipStatusCard = ({ ship }: ShipStatusCardProps) => {
  const config = statusConfig[ship.status];
  const StatusIcon = config.icon;

  const lastSignalText = ship.last_signal_at
    ? formatDistanceToNow(new Date(ship.last_signal_at), { addSuffix: true })
    : 'Never';

  return (
    <Card
      className={cn(
        'border transition-all duration-200 hover:shadow-lg hover:shadow-current/5',
        config.color,
        'bg-card/50'
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono font-semibold text-foreground capitalize">
              {ship.ship_name}
            </span>
          </div>
          <Badge variant="outline" className={cn('text-xs', config.badgeColor)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <p className="text-muted-foreground font-mono">Last Signal</p>
            <p className="text-muted-foreground font-medium">{lastSignalText}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground font-mono">7d Count</p>
            <p className="text-muted-foreground font-medium">{ship.signal_count_7d ?? 0}</p>
          </div>
        </div>

        {/* Time Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>Hours since signal</span>
            <span>{ship.hours_since_last_signal?.toFixed(1) ?? '—'}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                getTimeProgressColor(ship.hours_since_last_signal)
              )}
              style={{ width: `${getTimeProgressValue(ship.hours_since_last_signal)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>0h</span>
            <span>24h</span>
            <span>48h</span>
            <span>72h+</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
