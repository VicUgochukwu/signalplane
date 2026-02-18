-- Migration: RPC wrappers for ops schema tables/views
-- The ops schema is not exposed via PostgREST, so we create public RPCs
-- that admin users can call from the frontend.
-- Date: 2026-02-13

-- ============================================================
-- 1. admin_get_weekly_costs: wraps ops.weekly_cost_summary view
-- ============================================================
DROP FUNCTION IF EXISTS public.admin_get_weekly_costs(DATE, DATE);

CREATE OR REPLACE FUNCTION public.admin_get_weekly_costs(
  p_from DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_to DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  week_start TIMESTAMPTZ,
  ship_name TEXT,
  runs BIGINT,
  total_pages BIGINT,
  total_headless BIGINT,
  total_llm_calls BIGINT,
  total_tokens BIGINT,
  total_duration_ms BIGINT,
  total_errors BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  RETURN QUERY
  SELECT
    wcs.week_start,
    wcs.ship_name,
    wcs.runs,
    wcs.total_pages,
    wcs.total_headless,
    wcs.total_llm_calls,
    wcs.total_tokens,
    wcs.total_duration_ms,
    wcs.total_errors
  FROM ops.weekly_cost_summary wcs
  WHERE wcs.week_start >= p_from::TIMESTAMPTZ
    AND wcs.week_start <= (p_to + INTERVAL '7 days')::TIMESTAMPTZ
  ORDER BY wcs.week_start DESC, wcs.ship_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_weekly_costs(DATE, DATE) TO authenticated;

-- ============================================================
-- 2. admin_get_cost_events: raw cost events with filters
-- ============================================================
DROP FUNCTION IF EXISTS public.admin_get_cost_events(DATE, DATE, TEXT, INT);

CREATE OR REPLACE FUNCTION public.admin_get_cost_events(
  p_from DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_to DATE DEFAULT CURRENT_DATE,
  p_ship_name TEXT DEFAULT NULL,
  p_limit INT DEFAULT 200
)
RETURNS TABLE (
  id UUID,
  run_id UUID,
  run_type TEXT,
  ship_name TEXT,
  user_id UUID,
  pages_checked INT,
  pages_changed INT,
  headless_renders INT,
  anthropic_calls INT,
  tokens_in INT,
  tokens_out INT,
  duration_ms INT,
  errors_count INT,
  error_details JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  RETURN QUERY
  SELECT
    ce.id, ce.run_id, ce.run_type, ce.ship_name, ce.user_id,
    ce.pages_checked, ce.pages_changed, ce.headless_renders,
    ce.anthropic_calls, ce.tokens_in, ce.tokens_out,
    ce.duration_ms, ce.errors_count, ce.error_details, ce.created_at
  FROM ops.cost_events ce
  WHERE ce.created_at >= p_from::TIMESTAMPTZ
    AND ce.created_at < (p_to + INTERVAL '1 day')::TIMESTAMPTZ
    AND (p_ship_name IS NULL OR ce.ship_name = p_ship_name)
  ORDER BY ce.created_at DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_cost_events(DATE, DATE, TEXT, INT) TO authenticated;

-- ============================================================
-- 3. admin_get_budget_status: budget limits + current usage
-- ============================================================
DROP FUNCTION IF EXISTS public.admin_get_budget_status();

CREATE OR REPLACE FUNCTION public.admin_get_budget_status()
RETURNS TABLE (
  id UUID,
  scope TEXT,
  scope_id TEXT,
  limit_type TEXT,
  limit_value INT,
  current_value INT,
  period_start DATE,
  enabled BOOLEAN,
  usage_pct NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  RETURN QUERY
  SELECT
    bl.id, bl.scope, bl.scope_id, bl.limit_type,
    bl.limit_value, bl.current_value, bl.period_start, bl.enabled,
    CASE WHEN bl.limit_value > 0
      THEN ROUND((bl.current_value::NUMERIC / bl.limit_value) * 100, 1)
      ELSE 0
    END AS usage_pct
  FROM ops.budget_limits bl
  WHERE bl.enabled = true
  ORDER BY bl.scope, bl.scope_id, bl.limit_type;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_budget_status() TO authenticated;

-- ============================================================
-- 4. admin_get_budget_alerts: recent unacknowledged alerts
-- ============================================================
DROP FUNCTION IF EXISTS public.admin_get_budget_alerts();

CREATE OR REPLACE FUNCTION public.admin_get_budget_alerts()
RETURNS TABLE (
  id UUID,
  alert_type TEXT,
  scope TEXT,
  scope_id TEXT,
  current_usage NUMERIC,
  limit_value NUMERIC,
  percentage_used NUMERIC,
  message TEXT,
  acknowledged BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  RETURN QUERY
  SELECT
    ba.id, ba.alert_type, ba.scope, ba.scope_id,
    ba.current_usage, ba.limit_value, ba.percentage_used,
    ba.message, ba.acknowledged, ba.created_at
  FROM ops.budget_alerts ba
  WHERE ba.created_at > NOW() - INTERVAL '30 days'
  ORDER BY ba.created_at DESC
  LIMIT 50;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_budget_alerts() TO authenticated;

-- ============================================================
-- 5. admin_get_workflow_failures: dead letter queue
-- ============================================================
DROP FUNCTION IF EXISTS public.admin_get_workflow_failures(TEXT, INT);

CREATE OR REPLACE FUNCTION public.admin_get_workflow_failures(
  p_status TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  workflow_id TEXT,
  workflow_name TEXT,
  execution_id TEXT,
  failed_node TEXT,
  error_message TEXT,
  status TEXT,
  retry_count INT,
  max_retries INT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  RETURN QUERY
  SELECT
    wf.id, wf.workflow_id, wf.workflow_name, wf.execution_id,
    wf.failed_node, wf.error_message, wf.status, wf.retry_count,
    wf.max_retries, wf.resolved_at, wf.resolved_by,
    wf.resolution_notes, wf.failed_at, wf.created_at
  FROM ops.workflow_failures wf
  WHERE (p_status IS NULL OR wf.status = p_status)
  ORDER BY wf.failed_at DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_workflow_failures(TEXT, INT) TO authenticated;

-- ============================================================
-- 6. admin_get_ship_status: wraps ops.ship_status view
-- ============================================================
DROP FUNCTION IF EXISTS public.admin_get_ship_status();

CREATE OR REPLACE FUNCTION public.admin_get_ship_status()
RETURNS TABLE (
  ship_name TEXT,
  last_signal_at TIMESTAMPTZ,
  signal_count_7d BIGINT,
  status TEXT,
  hours_since_last_signal DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  RETURN QUERY
  SELECT
    ss.ship_name, ss.last_signal_at, ss.signal_count_7d,
    ss.status, ss.hours_since_last_signal
  FROM ops.ship_status ss
  ORDER BY ss.ship_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_ship_status() TO authenticated;

-- ============================================================
-- 7. admin_get_failure_summary: wraps ops.failure_summary view
-- ============================================================
DROP FUNCTION IF EXISTS public.admin_get_failure_summary();

CREATE OR REPLACE FUNCTION public.admin_get_failure_summary()
RETURNS TABLE (
  workflow_name TEXT,
  status TEXT,
  count BIGINT,
  last_failure TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  RETURN QUERY
  SELECT fs.workflow_name, fs.status, fs.count, fs.last_failure
  FROM ops.failure_summary fs;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_failure_summary() TO authenticated;

-- ============================================================
-- 8. admin_cost_totals: quick aggregate for dashboard card
-- ============================================================
DROP FUNCTION IF EXISTS public.admin_cost_totals(DATE, DATE);

CREATE OR REPLACE FUNCTION public.admin_cost_totals(
  p_from DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_to DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_runs BIGINT,
  total_pages BIGINT,
  total_headless BIGINT,
  total_llm_calls BIGINT,
  total_tokens BIGINT,
  total_duration_ms BIGINT,
  total_errors BIGINT,
  distinct_ships BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_runs,
    COALESCE(SUM(ce.pages_checked), 0)::BIGINT AS total_pages,
    COALESCE(SUM(ce.headless_renders), 0)::BIGINT AS total_headless,
    COALESCE(SUM(ce.anthropic_calls), 0)::BIGINT AS total_llm_calls,
    COALESCE(SUM(ce.tokens_in + ce.tokens_out), 0)::BIGINT AS total_tokens,
    COALESCE(SUM(ce.duration_ms), 0)::BIGINT AS total_duration_ms,
    COALESCE(SUM(ce.errors_count), 0)::BIGINT AS total_errors,
    COUNT(DISTINCT ce.ship_name)::BIGINT AS distinct_ships
  FROM ops.cost_events ce
  WHERE ce.created_at >= p_from::TIMESTAMPTZ
    AND ce.created_at < (p_to + INTERVAL '1 day')::TIMESTAMPTZ;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_cost_totals(DATE, DATE) TO authenticated;
