-- =====================================================
-- ADMIN PANEL — Phase 2: System Monitoring
-- Run in Supabase SQL Editor as postgres role
-- =====================================================

-- 1. API Registry table — which APIs to monitor
CREATE TABLE IF NOT EXISTS admin.api_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name TEXT NOT NULL,
  api_slug TEXT NOT NULL UNIQUE,
  health_check_url TEXT NOT NULL,
  health_check_method TEXT NOT NULL DEFAULT 'GET' CHECK (health_check_method IN ('GET', 'POST', 'HEAD')),
  health_check_headers JSONB NOT NULL DEFAULT '{}',
  health_check_body JSONB DEFAULT NULL,
  expected_status_codes INT[] NOT NULL DEFAULT '{200}',
  timeout_ms INT NOT NULL DEFAULT 10000,
  category TEXT NOT NULL DEFAULT 'core' CHECK (category IN ('core', 'external', 'integration')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  docs_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin.api_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read api_registry"
  ON admin.api_registry FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage api_registry"
  ON admin.api_registry FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Service role full access on api_registry"
  ON admin.api_registry FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 2. System Health Checks table — health check results
CREATE TABLE IF NOT EXISTS admin.system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_registry_id UUID NOT NULL REFERENCES admin.api_registry(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down', 'timeout', 'error')),
  response_time_ms INT,
  http_status_code INT,
  error_message TEXT,
  response_body_preview TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_source TEXT NOT NULL DEFAULT 'scheduled' CHECK (check_source IN ('scheduled', 'manual'))
);

CREATE INDEX idx_health_checks_api_time
  ON admin.system_health_checks (api_registry_id, checked_at DESC);

CREATE INDEX idx_health_checks_checked_at
  ON admin.system_health_checks (checked_at DESC);

ALTER TABLE admin.system_health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read health checks"
  ON admin.system_health_checks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Service role full access on system_health_checks"
  ON admin.system_health_checks FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 3. Seed API Registry with connected APIs
INSERT INTO admin.api_registry (api_name, api_slug, health_check_url, health_check_method, health_check_headers, health_check_body, expected_status_codes, timeout_ms, category, docs_url) VALUES
(
  'Anthropic Claude',
  'anthropic',
  'https://api.anthropic.com/v1/messages',
  'POST',
  '{"x-api-key": "ENV:ANTHROPIC_API_KEY", "anthropic-version": "2023-06-01", "content-type": "application/json"}',
  '{"model": "claude-3-haiku-20240307", "max_tokens": 1, "messages": [{"role": "user", "content": "hi"}]}',
  '{200}',
  15000,
  'core',
  'https://docs.anthropic.com/en/api'
),
(
  'Supabase',
  'supabase',
  'https://dnqjzgfunvbofsuibcsk.supabase.co/rest/v1/',
  'GET',
  '{"apikey": "ENV:SUPABASE_ANON_KEY"}',
  NULL,
  '{200}',
  10000,
  'core',
  'https://supabase.com/docs'
),
(
  'Slack API',
  'slack',
  'https://slack.com/api/api.test',
  'POST',
  '{"content-type": "application/x-www-form-urlencoded"}',
  NULL,
  '{200}',
  10000,
  'integration',
  'https://api.slack.com/methods'
),
(
  'Notion API',
  'notion',
  'https://api.notion.com/v1/users/me',
  'GET',
  '{"Authorization": "ENV:NOTION_API_KEY", "Notion-Version": "2022-06-28"}',
  NULL,
  '{200}',
  10000,
  'integration',
  'https://developers.notion.com'
),
(
  'Apify',
  'apify',
  'https://api.apify.com/v2/acts',
  'GET',
  '{"Authorization": "ENV:APIFY_API_TOKEN"}',
  NULL,
  '{200}',
  10000,
  'external',
  'https://docs.apify.com/api/v2'
),
(
  'n8n Cloud',
  'n8n',
  'https://replyra.app.n8n.cloud/api/v1/workflows',
  'GET',
  '{"X-N8N-API-KEY": "ENV:N8N_API_KEY"}',
  NULL,
  '{200}',
  10000,
  'core',
  'https://docs.n8n.io/api/'
)
ON CONFLICT (api_slug) DO NOTHING;

-- =====================================================
-- ADMIN RPCs — System Monitoring Functions
-- =====================================================

-- System summary stats (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_system_summary()
RETURNS TABLE (
  total_apis BIGINT,
  healthy_apis BIGINT,
  degraded_apis BIGINT,
  down_apis BIGINT,
  avg_response_time_ms NUMERIC
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  RETURN QUERY
  WITH latest_checks AS (
    SELECT DISTINCT ON (shc.api_registry_id)
      shc.api_registry_id,
      shc.status,
      shc.response_time_ms
    FROM admin.system_health_checks shc
    JOIN admin.api_registry ar ON ar.id = shc.api_registry_id
    WHERE ar.enabled = true
    ORDER BY shc.api_registry_id, shc.checked_at DESC
  )
  SELECT
    (SELECT COUNT(*)::BIGINT FROM admin.api_registry WHERE enabled = true),
    COUNT(*) FILTER (WHERE lc.status = 'healthy')::BIGINT,
    COUNT(*) FILTER (WHERE lc.status = 'degraded')::BIGINT,
    COUNT(*) FILTER (WHERE lc.status IN ('down', 'timeout', 'error'))::BIGINT,
    ROUND(AVG(lc.response_time_ms)::NUMERIC, 0)
  FROM latest_checks lc;
END;
$$;

-- Health overview — latest check per API (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_health_overview()
RETURNS TABLE (
  api_name TEXT,
  api_slug TEXT,
  category TEXT,
  status TEXT,
  response_time_ms INT,
  http_status_code INT,
  error_message TEXT,
  checked_at TIMESTAMPTZ,
  docs_url TEXT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  RETURN QUERY
  SELECT
    ar.api_name,
    ar.api_slug,
    ar.category,
    COALESCE(shc.status, 'unknown'),
    shc.response_time_ms,
    shc.http_status_code,
    shc.error_message,
    shc.checked_at,
    ar.docs_url
  FROM admin.api_registry ar
  LEFT JOIN LATERAL (
    SELECT s.status, s.response_time_ms, s.http_status_code, s.error_message, s.checked_at
    FROM admin.system_health_checks s
    WHERE s.api_registry_id = ar.id
    ORDER BY s.checked_at DESC
    LIMIT 1
  ) shc ON true
  WHERE ar.enabled = true
  ORDER BY ar.api_name;
END;
$$;

-- Health history for a specific API (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_health_history(
  p_api_slug TEXT,
  p_hours INT DEFAULT 24
)
RETURNS TABLE (
  status TEXT,
  response_time_ms INT,
  http_status_code INT,
  error_message TEXT,
  checked_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  RETURN QUERY
  SELECT shc.status, shc.response_time_ms, shc.http_status_code, shc.error_message, shc.checked_at
  FROM admin.system_health_checks shc
  JOIN admin.api_registry ar ON ar.id = shc.api_registry_id
  WHERE ar.api_slug = p_api_slug
    AND shc.checked_at >= now() - (p_hours || ' hours')::INTERVAL
  ORDER BY shc.checked_at DESC;
END;
$$;

-- List all registered APIs (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_api_registry()
RETURNS TABLE (
  id UUID,
  api_name TEXT,
  api_slug TEXT,
  health_check_url TEXT,
  health_check_method TEXT,
  expected_status_codes INT[],
  timeout_ms INT,
  category TEXT,
  enabled BOOLEAN,
  docs_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  RETURN QUERY
  SELECT ar.id, ar.api_name, ar.api_slug, ar.health_check_url, ar.health_check_method,
    ar.expected_status_codes, ar.timeout_ms, ar.category, ar.enabled, ar.docs_url, ar.created_at
  FROM admin.api_registry ar
  ORDER BY ar.api_name;
END;
$$;
