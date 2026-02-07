# Phase 7: Ship Status Dashboard & Ops Monitoring

## Context
We've implemented backend infrastructure for monitoring workflow health:
- `ops.workflow_failures` - Dead-letter queue for failed executions
- `ops.budget_alerts` - Budget threshold alerts
- `ops.ship_status` - View showing health of all signal-emitting ships
- `ops.failure_summary` - Aggregated failure stats

## Task
Add a new "System Health" section to the Admin Dashboard that displays:
1. Ship Status Overview
2. Recent Workflow Failures
3. Budget Alerts

## Database Views/Tables to Query

### 1. Ship Status (`ops.ship_status`)
```sql
SELECT * FROM ops.ship_status;
-- Returns:
-- ship_name | last_signal_at | signal_count_7d | status | hours_since_last_signal
-- messaging | 2026-02-06 ... | 12              | healthy | 24.5
-- narrative | 2026-02-05 ... | 8               | ok      | 48.2
-- objection | NULL           | 0               | missing | NULL
```

Status values: `healthy`, `ok`, `stale`, `missing`

### 2. Workflow Failures (`ops.workflow_failures`)
```sql
SELECT id, workflow_name, failed_node, error_message, status, retry_count, failed_at
FROM ops.workflow_failures
WHERE failed_at > NOW() - INTERVAL '7 days'
ORDER BY failed_at DESC
LIMIT 20;
```

Status values: `failed`, `retried`, `resolved`, `ignored`

### 3. Failure Summary (`ops.failure_summary`)
```sql
SELECT * FROM ops.failure_summary;
-- Returns aggregated counts by workflow and status
```

### 4. Budget Alerts (`ops.budget_alerts`)
```sql
SELECT * FROM ops.budget_alerts
WHERE acknowledged = false
ORDER BY created_at DESC;
```

## UI Components to Create

### 1. Ship Status Cards (Grid)
Create a grid of cards showing each ship's health:

```tsx
// Ship status card with color-coded status
interface ShipStatus {
  ship_name: string;
  last_signal_at: string | null;
  signal_count_7d: number | null;
  status: 'healthy' | 'ok' | 'stale' | 'missing';
  hours_since_last_signal: number | null;
}

// Status colors
const statusColors = {
  healthy: 'bg-terminal-green/20 border-terminal-green/40 text-terminal-green',
  ok: 'bg-terminal-cyan/20 border-terminal-cyan/40 text-terminal-cyan',
  stale: 'bg-terminal-amber/20 border-terminal-amber/40 text-terminal-amber',
  missing: 'bg-terminal-red/20 border-terminal-red/40 text-terminal-red',
};

// Status icons
const statusIcons = {
  healthy: CheckCircle2,
  ok: Clock,
  stale: AlertTriangle,
  missing: XCircle,
};
```

Each card should show:
- Ship name (capitalized)
- Status badge with icon
- Last signal time (relative, e.g., "2 hours ago")
- Signal count this week
- Progress bar showing time since last signal (green < 24h, amber < 48h, red > 48h)

### 2. Workflow Failures Table
A data table showing recent failures:

Columns:
- Workflow Name
- Failed Node
- Error Message (truncated, expandable)
- Status (badge)
- Retry Count
- Failed At (relative time)
- Actions (Resolve, Retry, Ignore buttons)

### 3. Budget Alerts Banner
If there are unacknowledged budget alerts, show a banner at the top:
- Warning (amber) for 75% threshold
- Critical (red) for 90%+ threshold
- Dismiss button to acknowledge

### 4. Quick Stats Row
At the top of the page, show:
- Total Ships: 5
- Healthy: X
- Issues: Y
- Failures (24h): Z
- Budget Status: OK / Warning / Critical

## Page Structure

```tsx
// src/pages/admin/AdminSystemHealth.tsx

const AdminSystemHealth = () => {
  return (
    <AdminLayout>
      {/* Budget Alert Banner (if any) */}
      <BudgetAlertBanner />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Ships" value={5} />
        <StatCard label="Healthy" value={healthyCount} color="green" />
        <StatCard label="Issues" value={issueCount} color="amber" />
        <StatCard label="Failures (24h)" value={failureCount} color="red" />
        <StatCard label="Budget" value="OK" color="green" />
      </div>

      {/* Ship Status Grid */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 font-mono">// Ship Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {ships.map(ship => <ShipStatusCard key={ship.ship_name} ship={ship} />)}
        </div>
      </section>

      {/* Recent Failures */}
      <section>
        <h2 className="text-lg font-semibold mb-4 font-mono">// Recent Failures</h2>
        <WorkflowFailuresTable failures={failures} />
      </section>
    </AdminLayout>
  );
};
```

## Data Fetching Hooks

```tsx
// src/hooks/useShipStatus.ts
export const useShipStatus = () => {
  return useQuery({
    queryKey: ['ship-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('ops')
        .from('ship_status')
        .select('*');
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
  });
};

// src/hooks/useWorkflowFailures.ts
export const useWorkflowFailures = () => {
  return useQuery({
    queryKey: ['workflow-failures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('ops')
        .from('workflow_failures')
        .select('*')
        .gte('failed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('failed_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
};

// src/hooks/useBudgetAlerts.ts
export const useBudgetAlerts = () => {
  return useQuery({
    queryKey: ['budget-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('ops')
        .from('budget_alerts')
        .select('*')
        .eq('acknowledged', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};
```

## Routing
Add to the admin routes:
- Path: `/admin/system-health`
- Add to admin sidebar navigation

## Design Guidelines
- Use the existing terminal/hacker aesthetic
- Monospace fonts for technical data
- Color coding: green (healthy), cyan (ok), amber (warning), red (error)
- Cards should have subtle glow effects on hover
- Auto-refresh data every 60 seconds
- Show loading skeletons while fetching

## Actions to Implement

### Resolve Failure
```tsx
const resolveFailure = useMutation({
  mutationFn: async (failureId: string) => {
    const { error } = await supabase
      .schema('ops')
      .from('workflow_failures')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: 'admin'
      })
      .eq('id', failureId);
    if (error) throw error;
  },
  onSuccess: () => queryClient.invalidateQueries(['workflow-failures']),
});
```

### Acknowledge Budget Alert
```tsx
const acknowledgeAlert = useMutation({
  mutationFn: async (alertId: string) => {
    const { error } = await supabase
      .schema('ops')
      .from('budget_alerts')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: 'admin'
      })
      .eq('id', alertId);
    if (error) throw error;
  },
  onSuccess: () => queryClient.invalidateQueries(['budget-alerts']),
});
```
