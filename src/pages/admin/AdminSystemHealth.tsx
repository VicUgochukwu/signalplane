import { AdminLayout } from '@/components/admin/AdminLayout';
import { ShipStatusCard } from '@/components/admin/ShipStatusCard';
import { WorkflowFailuresTable } from '@/components/admin/WorkflowFailuresTable';
import { BudgetAlertBanner } from '@/components/admin/BudgetAlertBanner';
import { StatCard } from '@/components/admin/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useShipStatus } from '@/hooks/useShipStatus';
import { useWorkflowFailures } from '@/hooks/useWorkflowFailures';
import { useBudgetAlerts } from '@/hooks/useBudgetAlerts';
import { Radio, CheckCircle2, AlertTriangle, XCircle, DollarSign, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';

const AdminSystemHealth = () => {
  const queryClient = useQueryClient();
  const { data: ships, isLoading: shipsLoading } = useShipStatus();
  const { data: failures, isLoading: failuresLoading } = useWorkflowFailures();
  const { data: budgetAlerts, isLoading: alertsLoading } = useBudgetAlerts();

  const isLoading = shipsLoading || failuresLoading || alertsLoading;

  // Calculate stats
  const healthyCount = ships?.filter((s) => s.status === 'healthy').length ?? 0;
  const okCount = ships?.filter((s) => s.status === 'ok').length ?? 0;
  const issueCount = ships?.filter((s) => s.status === 'stale' || s.status === 'missing').length ?? 0;
  const totalShips = ships?.length ?? 0;
  const failureCount24h = failures?.filter((f) => {
    const failedAt = new Date(f.failed_at);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return failedAt > oneDayAgo && f.status === 'failed';
  }).length ?? 0;

  const hasCriticalAlert = budgetAlerts?.some((a) => a.alert_type === 'critical');
  const hasWarningAlert = budgetAlerts?.some((a) => a.alert_type === 'warning');
  const budgetStatus = hasCriticalAlert ? 'Critical' : hasWarningAlert ? 'Warning' : 'OK';
  const budgetColor = hasCriticalAlert ? 'red' : hasWarningAlert ? 'amber' : 'green';

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['ship-status'] });
    queryClient.invalidateQueries({ queryKey: ['workflow-failures'] });
    queryClient.invalidateQueries({ queryKey: ['budget-alerts'] });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-mono text-zinc-100">
              // System Health
            </h1>
            <p className="text-sm text-zinc-500 font-mono mt-1">
              Monitor ship status, workflow failures, and budget alerts
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-zinc-400 border-zinc-700 hover:bg-zinc-800"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Budget Alert Banner */}
        {!alertsLoading && budgetAlerts && (
          <BudgetAlertBanner alerts={budgetAlerts} />
        )}

        {/* Quick Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 bg-zinc-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              label="Total Ships"
              value={totalShips}
              icon={Radio}
            />
            <StatCard
              label="Healthy"
              value={healthyCount + okCount}
              color="green"
              icon={CheckCircle2}
            />
            <StatCard
              label="Issues"
              value={issueCount}
              color={issueCount > 0 ? 'amber' : 'default'}
              icon={AlertTriangle}
            />
            <StatCard
              label="Failures (24h)"
              value={failureCount24h}
              color={failureCount24h > 0 ? 'red' : 'default'}
              icon={XCircle}
            />
            <StatCard
              label="Budget"
              value={budgetStatus}
              color={budgetColor as 'green' | 'amber' | 'red'}
              icon={DollarSign}
            />
          </div>
        )}

        {/* Ship Status Grid */}
        <section>
          <h2 className="text-lg font-semibold mb-4 font-mono text-zinc-100">
            // Ship Status
          </h2>
          {shipsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-40 bg-zinc-800" />
              ))}
            </div>
          ) : ships && ships.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {ships.map((ship) => (
                <ShipStatusCard key={ship.ship_name} ship={ship} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500 font-mono">
              No ship data available. Ships emit signals to ops.ship_status view.
            </div>
          )}
        </section>

        {/* Recent Failures */}
        <section>
          <h2 className="text-lg font-semibold mb-4 font-mono text-zinc-100">
            // Recent Failures
          </h2>
          {failuresLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 bg-zinc-800" />
              ))}
            </div>
          ) : (
            <WorkflowFailuresTable failures={failures || []} />
          )}
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminSystemHealth;
