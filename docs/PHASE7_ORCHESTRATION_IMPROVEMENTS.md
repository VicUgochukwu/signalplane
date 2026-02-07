# Phase 7: Orchestration Improvements

## 7.1 Retry Logic Configuration

### Per-Node Retry Settings (n8n)
For critical nodes in each workflow, configure retry on failure:

1. **HTTP Request nodes** (API calls to Anthropic, external services)
   - Retry on Fail: ✅ Enabled
   - Max Tries: 3
   - Wait Between Tries: 1000ms (exponential backoff)

2. **Postgres nodes** (database operations)
   - Retry on Fail: ✅ Enabled
   - Max Tries: 2
   - Wait Between Tries: 500ms

3. **Code nodes** (parsing, transformation)
   - Generally don't need retry (deterministic)
   - Add try-catch within code for graceful error handling

### How to Configure in n8n:
1. Click on any node
2. Go to "Settings" tab
3. Enable "Retry On Fail"
4. Set "Max Tries" and "Wait Between Tries"

### Workflows to Update:
- [ ] Control Plane v2
- [ ] Ships Orchestrator
- [ ] Objection Tracker v2
- [ ] Sector Pack Winners Weekly
- [ ] Launch Decay Tracker Weekly
- [ ] All other ship workflows

---

## 7.2 Error Workflow (Dead-Letter Queue)

### Create: "Error Handler - Dead Letter Queue"

This workflow captures all failed executions and:
1. Logs failure details to `ops.workflow_failures` table
2. Sends Slack/email notification for critical failures
3. Provides retry capability

### Schema for Dead-Letter Queue:

```sql
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS ops.workflow_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Workflow context
  workflow_id TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  execution_id TEXT NOT NULL,

  -- Failure details
  failed_node TEXT,
  error_message TEXT,
  error_stack TEXT,

  -- Execution context
  input_data JSONB,
  execution_mode TEXT, -- 'production', 'manual', 'trigger'

  -- Status
  status TEXT DEFAULT 'failed', -- 'failed', 'retried', 'resolved', 'ignored'
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,

  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT,

  -- Timestamps
  failed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflow_failures_status ON ops.workflow_failures(status, failed_at DESC);
CREATE INDEX idx_workflow_failures_workflow ON ops.workflow_failures(workflow_name, failed_at DESC);

-- View for monitoring
CREATE OR REPLACE VIEW ops.failure_summary AS
SELECT
  workflow_name,
  status,
  COUNT(*) as count,
  MAX(failed_at) as last_failure
FROM ops.workflow_failures
WHERE failed_at > NOW() - INTERVAL '7 days'
GROUP BY workflow_name, status
ORDER BY count DESC;
```

### Error Handler Workflow (n8n JSON):

```json
{
  "name": "Error Handler - Dead Letter Queue",
  "nodes": [
    {
      "name": "Error Trigger",
      "type": "n8n-nodes-base.errorTrigger",
      "position": [250, 300]
    },
    {
      "name": "Extract Error Details",
      "type": "n8n-nodes-base.code",
      "position": [450, 300],
      "parameters": {
        "jsCode": "const error = $input.first().json;\nreturn [{\n  workflow_id: error.workflow?.id || 'unknown',\n  workflow_name: error.workflow?.name || 'unknown',\n  execution_id: error.execution?.id || 'unknown',\n  failed_node: error.execution?.lastNodeExecuted || 'unknown',\n  error_message: error.execution?.error?.message || 'Unknown error',\n  error_stack: error.execution?.error?.stack || '',\n  execution_mode: error.execution?.mode || 'unknown',\n  input_data: JSON.stringify(error.execution?.data || {})\n}];"
      }
    },
    {
      "name": "Log to Database",
      "type": "n8n-nodes-base.postgres",
      "position": [650, 300],
      "parameters": {
        "operation": "insert",
        "schema": "ops",
        "table": "workflow_failures",
        "columns": "workflow_id,workflow_name,execution_id,failed_node,error_message,error_stack,execution_mode,input_data"
      }
    },
    {
      "name": "Check Severity",
      "type": "n8n-nodes-base.if",
      "position": [850, 300],
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.workflow_name }}",
              "operation": "contains",
              "value2": "Control Plane"
            }
          ]
        }
      }
    },
    {
      "name": "Send Slack Alert",
      "type": "n8n-nodes-base.slack",
      "position": [1050, 200],
      "parameters": {
        "channel": "#alerts-workflows",
        "text": "🚨 *Workflow Failed*\n\n*Workflow:* {{ $json.workflow_name }}\n*Node:* {{ $json.failed_node }}\n*Error:* {{ $json.error_message }}\n*Execution:* {{ $json.execution_id }}"
      }
    }
  ]
}
```

---

## 7.3 Budget Alerting

### Schema for Budget Tracking:

```sql
-- Budget alerts table
CREATE TABLE IF NOT EXISTS ops.budget_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL, -- 'warning', 'critical', 'exceeded'
  scope TEXT NOT NULL, -- 'global', 'ship', 'user'
  scope_id TEXT,

  current_usage NUMERIC NOT NULL,
  limit_value NUMERIC NOT NULL,
  percentage_used NUMERIC NOT NULL,

  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to check and alert on budget
CREATE OR REPLACE FUNCTION ops.check_budget_alerts()
RETURNS TABLE(alert_type TEXT, scope TEXT, message TEXT) AS $$
DECLARE
  v_budget RECORD;
BEGIN
  FOR v_budget IN
    SELECT * FROM ops.budget_limits
    WHERE enabled = true
    AND period_start = date_trunc('week', CURRENT_DATE)::DATE
  LOOP
    IF v_budget.current_value >= v_budget.limit_value THEN
      RETURN QUERY SELECT
        'exceeded'::TEXT,
        v_budget.scope,
        format('%s budget exceeded: %s/%s', v_budget.limit_type, v_budget.current_value, v_budget.limit_value);
    ELSIF v_budget.current_value >= v_budget.limit_value * 0.9 THEN
      RETURN QUERY SELECT
        'critical'::TEXT,
        v_budget.scope,
        format('%s budget at 90%%: %s/%s', v_budget.limit_type, v_budget.current_value, v_budget.limit_value);
    ELSIF v_budget.current_value >= v_budget.limit_value * 0.75 THEN
      RETURN QUERY SELECT
        'warning'::TEXT,
        v_budget.scope,
        format('%s budget at 75%%: %s/%s', v_budget.limit_type, v_budget.current_value, v_budget.limit_value);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### Budget Check Workflow (runs daily):
- Schedule: Daily at 9 AM
- Query `ops.check_budget_alerts()`
- Send Slack notification if any alerts returned

---

## 7.4 Workflow Dependencies Documentation

### Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEEKLY SCHEDULE (UTC)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SATURDAY                                                        │
│  ├── 10:00 PM - Messaging Diff Tracker                          │
│  └── 11:00 PM - Narrative Drift Detector                        │
│                                                                  │
│  SUNDAY                                                          │
│  ├── 12:00 AM - ICP Evolution Tracker                           │
│  ├── 12:00 AM - Horizon Scanner                                 │
│  ├── 12:00 AM - Objection Tracker v2                            │
│  ├──  2:00 PM - Ships Orchestrator (validates all ships ran)    │
│  └──  6:00 PM - Control Plane v2 (generates weekly packet)      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   DATA SOURCES   │     │     SIGNALS      │     │     OUTPUTS      │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│                  │     │                  │     │                  │
│ page_snapshots   │────►│ control_plane.   │────►│ Weekly Packet    │
│ page_diffs       │     │ signals          │     │ (JSON)           │
│ classified_      │     │                  │     │                  │
│ changes          │     │ Signal Types:    │     │ Builders:        │
│                  │     │ - messaging      │     │ - Battlecards    │
│ objection_       │     │ - narrative      │     │ - Objection Lib  │
│ tracker.events   │     │ - icp            │     │ - Swipe File     │
│                  │     │ - horizon        │     │                  │
│ Reddit/G2/       │     │ - objection      │     │                  │
│ Capterra         │     │                  │     │                  │
│                  │     │                  │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Critical Path

1. **Ships must complete before Orchestrator** (Sunday 2 PM)
   - If any ship fails, Orchestrator will detect missing signals
   - Manual intervention required before Control Plane runs

2. **Orchestrator must complete before Control Plane** (Sunday 6 PM)
   - Orchestrator validates signal availability
   - Alerts if signals are missing

3. **Control Plane must complete before Monday morning**
   - Sunday 6 PM allows 12+ hours buffer for failure recovery
   - Manual re-run possible if needed

### Failure Recovery Procedures

| Scenario | Detection | Recovery |
|----------|-----------|----------|
| Ship workflow fails | Orchestrator detects missing signals | Re-run failed ship manually, then re-run Orchestrator |
| Anthropic API timeout | Error Handler logs failure | Wait 5 min, retry workflow |
| Database connection error | Postgres node retry fails | Check Supabase status, retry |
| Control Plane fails | No packet generated | Re-run Control Plane before Monday AM |

---

## Implementation Checklist

### Immediate (Today):
- [x] Document workflow dependencies
- [ ] Run dead-letter queue migration in Supabase
- [ ] Create Error Handler workflow in n8n

### This Week:
- [ ] Add retry settings to each critical node
- [ ] Set up Error Workflow in each workflow's settings
- [ ] Create Budget Check workflow
- [ ] Test failure scenarios

### Verification:
- [ ] Simulate Anthropic API failure
- [ ] Verify error is logged to ops.workflow_failures
- [ ] Verify Slack alert is sent
- [ ] Verify manual retry works
