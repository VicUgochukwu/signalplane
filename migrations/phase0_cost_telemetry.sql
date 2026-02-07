-- Phase 0.3: Cost Telemetry Infrastructure
-- Tracks costs across all ships for budget management

CREATE SCHEMA IF NOT EXISTS ops;

-- Cost events table
CREATE TABLE IF NOT EXISTS ops.cost_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  run_id UUID,
  run_type TEXT NOT NULL, -- 'ship', 'builder', 'packet', 'experiment'
  ship_name TEXT, -- 'messaging', 'pricing', 'objection', etc.
  user_id UUID,

  -- Fetch costs
  pages_checked INT DEFAULT 0,
  pages_changed INT DEFAULT 0,
  headless_renders INT DEFAULT 0,

  -- LLM costs
  anthropic_calls INT DEFAULT 0,
  tokens_in INT DEFAULT 0,
  tokens_out INT DEFAULT 0,

  -- Timing
  duration_ms INT,

  -- Errors
  errors_count INT DEFAULT 0,
  error_details JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_events_run_type ON ops.cost_events(run_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cost_events_ship ON ops.cost_events(ship_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cost_events_user ON ops.cost_events(user_id, created_at DESC);

-- Weekly cost summary view
CREATE OR REPLACE VIEW ops.weekly_cost_summary AS
SELECT
  date_trunc('week', created_at) as week_start,
  ship_name,
  COUNT(*) as runs,
  SUM(pages_checked) as total_pages,
  SUM(headless_renders) as total_headless,
  SUM(anthropic_calls) as total_llm_calls,
  SUM(tokens_in + tokens_out) as total_tokens,
  SUM(duration_ms) as total_duration_ms,
  SUM(errors_count) as total_errors
FROM ops.cost_events
GROUP BY 1, 2
ORDER BY 1 DESC, 2;

-- Budget limits table
CREATE TABLE IF NOT EXISTS ops.budget_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL, -- 'global', 'ship', 'user'
  scope_id TEXT, -- ship_name or user_id
  limit_type TEXT NOT NULL, -- 'headless_per_week', 'anthropic_calls_per_week', 'tokens_per_week'
  limit_value INT NOT NULL,
  current_value INT DEFAULT 0,
  period_start DATE,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scope, scope_id, limit_type, period_start)
);

-- Function to check budget before expensive operations
CREATE OR REPLACE FUNCTION ops.check_budget(
  p_scope TEXT,
  p_scope_id TEXT,
  p_limit_type TEXT,
  p_increment INT DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  v_limit_value INT;
  v_current_value INT;
  v_period_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
BEGIN
  SELECT limit_value, current_value
  INTO v_limit_value, v_current_value
  FROM ops.budget_limits
  WHERE scope = p_scope
    AND (scope_id = p_scope_id OR scope_id IS NULL)
    AND limit_type = p_limit_type
    AND period_start = v_period_start
    AND enabled = true;

  IF NOT FOUND THEN
    RETURN true; -- No limit configured
  END IF;

  IF v_current_value + p_increment > v_limit_value THEN
    RETURN false; -- Over budget
  END IF;

  -- Increment counter
  UPDATE ops.budget_limits
  SET current_value = current_value + p_increment
  WHERE scope = p_scope
    AND (scope_id = p_scope_id OR scope_id IS NULL)
    AND limit_type = p_limit_type
    AND period_start = v_period_start;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to log cost event
CREATE OR REPLACE FUNCTION ops.log_cost(
  p_run_type TEXT,
  p_ship_name TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_pages_checked INT DEFAULT 0,
  p_pages_changed INT DEFAULT 0,
  p_headless_renders INT DEFAULT 0,
  p_anthropic_calls INT DEFAULT 0,
  p_tokens_in INT DEFAULT 0,
  p_tokens_out INT DEFAULT 0,
  p_duration_ms INT DEFAULT 0,
  p_errors_count INT DEFAULT 0,
  p_error_details JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO ops.cost_events (
    run_type, ship_name, user_id,
    pages_checked, pages_changed, headless_renders,
    anthropic_calls, tokens_in, tokens_out,
    duration_ms, errors_count, error_details
  ) VALUES (
    p_run_type, p_ship_name, p_user_id,
    p_pages_checked, p_pages_changed, p_headless_renders,
    p_anthropic_calls, p_tokens_in, p_tokens_out,
    p_duration_ms, p_errors_count, p_error_details
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;
