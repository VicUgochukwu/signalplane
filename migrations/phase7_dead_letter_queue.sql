-- Phase 7: Dead Letter Queue for Workflow Failures
-- This table captures failed workflow executions for monitoring and retry

-- Ensure ops schema exists
CREATE SCHEMA IF NOT EXISTS ops;

-- Workflow failures table (dead-letter queue)
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

CREATE INDEX IF NOT EXISTS idx_workflow_failures_status ON ops.workflow_failures(status, failed_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_failures_workflow ON ops.workflow_failures(workflow_name, failed_at DESC);

-- View for monitoring dashboard
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

-- View for recent failures (last 24 hours)
CREATE OR REPLACE VIEW ops.recent_failures AS
SELECT
  id,
  workflow_name,
  failed_node,
  error_message,
  status,
  retry_count,
  failed_at
FROM ops.workflow_failures
WHERE failed_at > NOW() - INTERVAL '24 hours'
ORDER BY failed_at DESC;

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

CREATE INDEX IF NOT EXISTS idx_budget_alerts_type ON ops.budget_alerts(alert_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_unack ON ops.budget_alerts(acknowledged, created_at DESC) WHERE acknowledged = false;

-- Function to check and return budget alerts
CREATE OR REPLACE FUNCTION ops.check_budget_alerts()
RETURNS TABLE(alert_type TEXT, scope TEXT, scope_id TEXT, message TEXT, percentage_used NUMERIC) AS $$
DECLARE
  v_budget RECORD;
  v_percentage NUMERIC;
BEGIN
  FOR v_budget IN
    SELECT * FROM ops.budget_limits
    WHERE enabled = true
    AND period_start = date_trunc('week', CURRENT_DATE)::DATE
  LOOP
    v_percentage := ROUND((v_budget.current_value::NUMERIC / NULLIF(v_budget.limit_value, 0)::NUMERIC) * 100, 1);

    IF v_budget.current_value >= v_budget.limit_value THEN
      RETURN QUERY SELECT
        'exceeded'::TEXT,
        v_budget.scope,
        v_budget.scope_id,
        format('%s budget EXCEEDED: %s/%s (%s%%)', v_budget.limit_type, v_budget.current_value, v_budget.limit_value, v_percentage),
        v_percentage;
    ELSIF v_budget.current_value >= v_budget.limit_value * 0.9 THEN
      RETURN QUERY SELECT
        'critical'::TEXT,
        v_budget.scope,
        v_budget.scope_id,
        format('%s budget at 90%%: %s/%s', v_budget.limit_type, v_budget.current_value, v_budget.limit_value),
        v_percentage;
    ELSIF v_budget.current_value >= v_budget.limit_value * 0.75 THEN
      RETURN QUERY SELECT
        'warning'::TEXT,
        v_budget.scope,
        v_budget.scope_id,
        format('%s budget at 75%%: %s/%s', v_budget.limit_type, v_budget.current_value, v_budget.limit_value),
        v_percentage;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to log a workflow failure (called from n8n Error Handler)
CREATE OR REPLACE FUNCTION ops.log_workflow_failure(
  p_workflow_id TEXT,
  p_workflow_name TEXT,
  p_execution_id TEXT,
  p_failed_node TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_error_stack TEXT DEFAULT NULL,
  p_execution_mode TEXT DEFAULT 'production',
  p_input_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_failure_id UUID;
BEGIN
  INSERT INTO ops.workflow_failures (
    workflow_id, workflow_name, execution_id,
    failed_node, error_message, error_stack,
    execution_mode, input_data
  ) VALUES (
    p_workflow_id, p_workflow_name, p_execution_id,
    p_failed_node, p_error_message, p_error_stack,
    p_execution_mode, p_input_data
  )
  RETURNING id INTO v_failure_id;

  RETURN v_failure_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark a failure as resolved
CREATE OR REPLACE FUNCTION ops.resolve_failure(
  p_failure_id UUID,
  p_resolved_by TEXT DEFAULT 'system',
  p_resolution_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE ops.workflow_failures
  SET
    status = 'resolved',
    resolved_at = NOW(),
    resolved_by = p_resolved_by,
    resolution_notes = p_resolution_notes
  WHERE id = p_failure_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Ship status view for monitoring dashboard
CREATE OR REPLACE VIEW ops.ship_status AS
WITH latest_signals AS (
  SELECT
    signal_type,
    MAX(created_at) as last_signal_at,
    COUNT(*) as signal_count_7d
  FROM control_plane.signals
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY signal_type
),
expected_ships AS (
  SELECT unnest(ARRAY['messaging', 'narrative', 'icp', 'horizon', 'objection']) as ship_name
)
SELECT
  es.ship_name,
  ls.last_signal_at,
  ls.signal_count_7d,
  CASE
    WHEN ls.last_signal_at IS NULL THEN 'missing'
    WHEN ls.last_signal_at < NOW() - INTERVAL '8 days' THEN 'stale'
    WHEN ls.last_signal_at > NOW() - INTERVAL '2 days' THEN 'healthy'
    ELSE 'ok'
  END as status,
  EXTRACT(EPOCH FROM (NOW() - ls.last_signal_at)) / 3600 as hours_since_last_signal
FROM expected_ships es
LEFT JOIN latest_signals ls ON es.ship_name = ls.signal_type
ORDER BY es.ship_name;

COMMENT ON TABLE ops.workflow_failures IS 'Dead-letter queue for failed n8n workflow executions';
COMMENT ON TABLE ops.budget_alerts IS 'Budget threshold alerts for cost monitoring';
COMMENT ON VIEW ops.ship_status IS 'Real-time status of all signal-emitting ships';
COMMENT ON FUNCTION ops.log_workflow_failure IS 'Log a workflow failure from n8n Error Handler';
COMMENT ON FUNCTION ops.check_budget_alerts IS 'Check budget limits and return any alerts';
