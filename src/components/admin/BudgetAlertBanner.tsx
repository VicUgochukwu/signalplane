import { AlertTriangle, XCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BudgetAlert } from '@/hooks/useBudgetAlerts';
import { useAcknowledgeAlert } from '@/hooks/useBudgetAlerts';

interface BudgetAlertBannerProps {
  alerts: BudgetAlert[];
}

export const BudgetAlertBanner = ({ alerts }: BudgetAlertBannerProps) => {
  const acknowledgeAlert = useAcknowledgeAlert();

  if (alerts.length === 0) return null;

  // Show the most critical alert first
  const criticalAlerts = alerts.filter((a) => a.alert_type === 'critical');
  const warningAlerts = alerts.filter((a) => a.alert_type === 'warning');
  const primaryAlert = criticalAlerts[0] || warningAlerts[0];

  const isCritical = primaryAlert.alert_type === 'critical';

  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3 mb-6 flex items-center justify-between',
        isCritical
          ? 'bg-red-500/10 border-red-500/40'
          : 'bg-amber-500/10 border-amber-500/40'
      )}
    >
      <div className="flex items-center gap-3">
        {isCritical ? (
          <XCircle className="h-5 w-5 text-red-400" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        )}
        <div>
          <p
            className={cn(
              'font-mono font-semibold text-sm',
              isCritical ? 'text-red-400' : 'text-amber-400'
            )}
          >
            {isCritical ? 'CRITICAL' : 'WARNING'}: Budget Alert
            {alerts.length > 1 && (
              <span className="text-zinc-400 font-normal ml-2">
                (+{alerts.length - 1} more)
              </span>
            )}
          </p>
          <p className="text-sm text-zinc-400 font-mono mt-0.5">
            {primaryAlert.message} ({primaryAlert.threshold_percent}% threshold reached)
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right mr-4 hidden sm:block">
          <p className="text-xs text-zinc-500 font-mono">Current / Limit</p>
          <p
            className={cn(
              'font-mono font-semibold',
              isCritical ? 'text-red-400' : 'text-amber-400'
            )}
          >
            ${primaryAlert.current_spend.toFixed(2)} / ${primaryAlert.budget_limit.toFixed(2)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'font-mono',
            isCritical
              ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
              : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
          )}
          onClick={() => acknowledgeAlert.mutate(primaryAlert.id)}
          disabled={acknowledgeAlert.isPending}
        >
          <X className="h-4 w-4 mr-1" />
          Dismiss
        </Button>
      </div>
    </div>
  );
};
